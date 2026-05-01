# MRLD — Hetzner Deploy (IP-only, henüz domain yok)

Bu rehber, MRLD'yi Hetzner CX23 Ubuntu sunucusuna **sadece IP üzerinden**
(domain ve SSL olmadan) deploy eder. Pilot dönem için ideal — domain
alındığında DEPLOY.md'ye Caddy + auto-SSL bölümü eklenecek.

> Pattern: Xpensio'nun deploy yapısı (Postgres in Docker, backend internal,
> sadece frontend port 3100 host'a açık, GitHub Actions ile push-deploy).

---

## Adım 1 — Sunucuya bağlan

```bash
ssh root@89.167.115.209
```

## Adım 2 — Docker kur (tek seferlik)

```bash
curl -fsSL https://get.docker.com | sh
docker --version
docker compose version
```

## Adım 3 — Repo'yu clone et

```bash
mkdir -p /opt && cd /opt
git clone https://github.com/HakanO342610/Marketplace-Revenue-Leakage-Detector.git mrld
cd mrld
```

## Adım 4 — `.env` oluştur

```bash
cp .env.prod.example .env

# POSTGRES_PASSWORD ve JWT_SECRET üret
echo "POSTGRES_PASSWORD=$(openssl rand -base64 32)" >> .env.tmp
echo "JWT_SECRET=$(openssl rand -hex 64)" >> .env.tmp
echo "JWT_EXPIRES_IN=7d" >> .env.tmp

# .env.tmp'i .env üzerine yaz (manuel kontrol et)
mv .env.tmp .env
cat .env   # değerleri doğrula
```

## Adım 5 — Build + Run

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

İlk build 3-5 dakika sürer (npm install + nest build + next build).

Logları takip et:

```bash
docker compose -f docker-compose.prod.yml logs -f
```

Açılış sırası:
1. `mrld_db` (postgres healthy)
2. `mrld_api` (prisma migrate deploy → NestJS başlar `:3101`)
3. `mrld_web` (Next.js standalone başlar `:3000` (host'ta `:3100`))

## Adım 6 — Hetzner Cloud Firewall

Hetzner panel → CX23 → Firewalls → 3100 portunu TCP olarak `0.0.0.0/0`'a aç.
22 (SSH) zaten açık olmalı.

## Adım 7 — Test

```bash
# Sunucu içinden
curl -s http://localhost:3100 -o /dev/null -w "%{http_code}\n"   # 200 beklenir

# Kendi makinen üzerinden (tarayıcıda)
http://89.167.115.209:3100
```

Demo kullanıcı oluştur:

```bash
curl -X POST -H "content-type: application/json" \
  -d '{"email":"demo@mrld.com","password":"GuvenliSifre123","name":"Demo"}' \
  http://89.167.115.209:3100/api/auth/register
```

---

## Güncelleme akışı (manuel)

```bash
cd /opt/mrld
git pull
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

Backend yeniden başlarken yeni Prisma migration'ları otomatik uygulanır
(`migrate deploy` Dockerfile CMD'sinde).

---

## Otomatik deploy (GitHub Actions ile)

`.github/workflows/deploy.yml` mevcut. Çalışması için:

1. **Sunucuda SSH key oluştur** (deploy için ayrı, ana root key'inden bağımsız):
   ```bash
   ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/mrld_deploy
   cat ~/.ssh/mrld_deploy.pub >> ~/.ssh/authorized_keys
   cat ~/.ssh/mrld_deploy   # PRIVATE key — kopyala, GitHub'a ekleyeceksin
   ```

2. **GitHub repo'da Secrets ekle**: Settings → Secrets and variables → Actions
   - `HETZNER_SSH_KEY` = (yukarıdaki private key, `-----BEGIN ... END-----` dahil tüm içerik)
   - `HETZNER_HOST` = `89.167.115.209`
   - `HETZNER_USER` = `root` (veya farklı user kullanıyorsan o)

3. Sonraki `git push origin main` otomatik deploy tetikler. CI çalıştığını
   GitHub → Actions sekmesinden takip et.

---

## Backup (günlük cron)

```bash
# Bir kerelik kurulum
sudo cp /opt/mrld/scripts/vps-backup.sh /etc/cron.daily/mrld-backup
sudo chmod +x /etc/cron.daily/mrld-backup

# Manuel test
sudo /etc/cron.daily/mrld-backup
ls -la /root/mrld-backups/
```

7 günlük rotation, gzip'lenmiş `pg_dump` çıktıları.

---

## Sorun giderme

**`http://89.167.115.209:3100` açılmıyor:**
- `docker compose ps` → tüm servisler `running` ve `healthy` mi?
- `docker compose logs frontend` → standalone server hata veriyor mu?
- Hetzner firewall'da 3100 açık mı?

**Backend Postgres'e bağlanamıyor:**
- `docker compose logs postgres` → healthcheck geçiyor mu?
- `docker compose exec backend env | grep DATABASE_URL` → URL doğru mu?
- `docker compose exec backend npx prisma db pull --force` (test connect)

**Migration hatası:**
- `docker compose exec backend npx prisma migrate status`
- Manuel uygula: `docker compose exec backend npx prisma migrate deploy`

**Frontend build OOM (memory):**
- CX23 4 GB RAM. Next build agresif. Çözüm: swap aç:
  ```bash
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  ```

---

## Domain alındığında (gelecek)

İleride bir domain bağlandığında:

1. DNS A kaydı: `mrld.example.com → 89.167.115.209`
2. Caddy container ekle (önceki versiyonda `Caddyfile` vardı, geri restore et)
3. `docker-compose.prod.yml`'de frontend ports'u kaldır, Caddy'yi 80/443'e bağla
4. Caddy auto-SSL Let's Encrypt'ten sertifika alır
5. Hetzner firewall: 80 + 443 aç, 3100'i kapat

Bu adımlar için ayrı bir `DEPLOY-DOMAIN.md` yazılacak (domain alındığında).
