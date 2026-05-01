# MRLD — Hetzner Deploy Rehberi

Bu rehber, MRLD'yi Hetzner CX23 (Ubuntu 24.04) sunucusuna deploy eder.
Postgres external (Hetzner managed veya aynı sunucuda ayrı), uygulama
Docker Compose içinde Caddy + frontend + backend olarak çalışır.

---

## 1. Önkoşullar

**Sunucu tarafında (sadece bir kez):**

```bash
# SSH ile sunucuya bağlan
ssh root@89.167.115.209   # ya da kendi user'ın

# Docker + Compose plugin
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER  # logout/login sonrası geçerli
```

**Domain hazırlığı:**

DNS sağlayıcında bir A kaydı oluştur (örn. `mrld.example.com → 89.167.115.209`).
Caddy ilk istekte otomatik Let's Encrypt sertifikası alır — DNS doğru
yönlendirilmeden ACME challenge başarısız olur.

**Postgres (Hetzner):**

CX23 üzerinde Postgres zaten kurulu varsayalım. Bu projeye ait yeni bir
DB ve kullanıcı oluştur:

```sql
CREATE DATABASE mrld;
CREATE USER mrld_app WITH ENCRYPTED PASSWORD 'GUCLU_SIFRE';
GRANT ALL PRIVILEGES ON DATABASE mrld TO mrld_app;
\c mrld
GRANT ALL ON SCHEMA public TO mrld_app;
```

`pg_hba.conf` ve `postgresql.conf` ayarlarında uygulamanın bu DB'ye
bağlanabildiğini doğrula (uygulama aynı sunucudaysa `127.0.0.1`, aynı
network'teki başka bir sunucudaysa o IP).

---

## 2. Repo'yu sunucuya çek

```bash
cd /opt
sudo git clone https://github.com/HakanO342610/Marketplace-Revenue-Leakage-Detector.git mrld
sudo chown -R $USER:$USER mrld
cd mrld
```

---

## 3. Production env dosyasını oluştur

```bash
cp .env.prod.example .env
nano .env
```

Doldur:

```
DOMAIN=mrld.example.com
DATABASE_URL=postgresql://mrld_app:GUCLU_SIFRE@127.0.0.1:5432/mrld?schema=public&sslmode=disable
JWT_SECRET=$(openssl rand -hex 64)
JWT_EXPIRES_IN=7d
```

> **Not:** Postgres aynı sunucudaysa `sslmode=disable`, ayrı sunucuda
> ise `sslmode=require` kullan ve PG_HBA'da SSL'i etkinleştir.

---

## 4. Build + Run

```bash
docker compose -f docker-compose.prod.yml --env-file .env build
docker compose -f docker-compose.prod.yml --env-file .env up -d
```

İlk başlatmada:
- Backend container açılırken `prisma migrate deploy` çalışır → mevcut
  migration'lar (init, add_user_auth, add_issue_attribution,
  add_organizations) DB'ye uygulanır.
- Caddy ACME challenge'ı başlatır → 1-2 dakika içinde HTTPS hazır.

Logları takip:

```bash
docker compose -f docker-compose.prod.yml logs -f
```

---

## 5. Demo kullanıcı oluştur (opsiyonel)

```bash
docker compose -f docker-compose.prod.yml exec backend \
  node scripts/backfill-orgs.js   # mevcut kullanıcılar için (gerekmez ilk deploy'da)

# Yeni demo hesap:
curl -X POST -H "content-type: application/json" \
  -d '{"email":"demo@mrld.com","password":"GuvenliSifre","name":"Demo"}' \
  https://${DOMAIN}/api/auth/register
```

---

## 6. Güncelleme akışı

```bash
cd /opt/mrld
git pull
docker compose -f docker-compose.prod.yml --env-file .env build
docker compose -f docker-compose.prod.yml --env-file .env up -d
```

Backend yeniden başlatılırken yeni migration'lar otomatik uygulanır.

---

## 7. Doğrulama checklist

- [ ] `https://mrld.example.com/` → landing açılıyor (yeşil tema, MRLD)
- [ ] `https://mrld.example.com/api` → 404 ya da JSON, NestJS yanıtı
- [ ] `/login` → demo hesap ile giriş çalışıyor
- [ ] CSV upload → 1500 satır okunup persist ediliyor
- [ ] Dashboard reconciliation çalışıyor → 542 sorun, ₺65.181,50
- [ ] SSL sertifika geçerli (tarayıcı kilit ikonu)

---

## 8. Sorun giderme

**Caddy SSL alamıyor:**
- DNS A kaydı sunucu IP'sini gösteriyor mu? `dig +short mrld.example.com`
- 80 ve 443 portları sunucu firewall'unda açık mı? `ufw status`
- Caddy logu: `docker compose -f docker-compose.prod.yml logs caddy`

**Backend Postgres'e bağlanamıyor:**
- `DATABASE_URL` doğru mu? Test: `docker compose exec backend npx prisma db execute --stdin` (boş query gönder)
- Postgres `pg_hba.conf` Docker network'ünden bağlantıya izin veriyor mu?
  - Aynı host: `host all all 172.17.0.0/16 md5` ekle
  - Ayrı host: `host all all 89.167.0.0/16 md5` ya da spesifik IP

**Frontend SSR fetch'i 500 dönüyor:**
- Backend container ayakta mı? `docker compose ps`
- `BACKEND_INTERNAL_URL=http://backend:3101` olarak set edilmiş mi?
- Cookie domain → `lib/api.ts` `serverAuthHeaders()` Next.js cookies()
  ile prod domain'de çalışmalı.

---

## 9. Sonraki adımlar (deploy sonrası)

- [ ] Backup: Postgres günlük dump (cron + S3/B2)
- [ ] Monitoring: Uptime Kuma veya Better Stack
- [ ] CI/CD: GitHub Actions ile `git push main` → otomatik deploy
- [ ] Observability: Sentry (frontend + backend)
- [ ] Rate limiting: Caddy `rate_limit` veya nginx fronting
