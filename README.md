# MRLD — Marketplace Revenue Leakage Detector

> Pazaryeri hakedişlerinde komisyon farkı, eksik ödeme ve eksik iadeleri **satır bazında** tespit eden finansal denetim motoru.

CFO için, Trendyol / Hepsiburada / Amazon satıcısı firmalar için, %2-7 sessiz gelir kaybını dakikalar içinde tespit eder.

---

## Demo

- Frontend: <http://localhost:3100>
- Backend: <http://localhost:3101/api>
- Demo hesap: `demo@mrld.test` / `demo1234`
- Sample dataset: [`datasets/sample.csv`](datasets/sample.csv) (1500 satır, 542 sorun, 65.181 ₺ toplam kayıp)

## Stack

| Katman | Teknoloji |
| --- | --- |
| Backend | NestJS 10, Prisma 6, PostgreSQL |
| Frontend | Next.js 16 (App Router), Tailwind 4, TypeScript strict |
| Auth | JWT + Passport (org-scoped, multi-tenant) |
| DB | Postgres (Docker lokal `:5434`, prod Hetzner) |
| Font | Inter Variable (sans), JetBrains Mono Variable, Plus Jakarta Sans (landing) — hepsi `@fontsource` ile lokal |

## Lokal Geliştirme

```bash
# 1) Postgres
docker compose up -d postgres

# 2) Backend
cd backend
npm install
npx prisma migrate dev
npm run start:dev   # :3101

# 3) Frontend (yeni terminal)
cd frontend
npm install
npm run dev         # :3100
```

`.env` örneği [`backend/.env.example`](backend/.env.example).

## Mimari

3 katmanlı dashboard:

1. **CFO Özeti** — Beklenen Gelir / Toplam Gelir / Toplam Ödenen / Toplam Kayıp / Açıklanmayan Fark / Güven Skoru
2. **Yönetici İçgörüsü** — auto-generated executive özet + risk seviyesi (LOW / MEDIUM / HIGH)
3. **Kök Neden Analizi** — Top 3 loss driver, kategori ve pazaryeri kırılımı, satır bazında sorun incelemesi (drill-down)

Backend katmanları:

```
backend/src/modules/
├── auth/           JWT + JwtAuthGuard + OrgContextGuard
├── orgs/           Organization + Membership + roller (admin/member/viewer)
├── upload/         CSV multipart parse → OrderRow persist
├── reconciliation/
│   ├── engine/     ReconciliationEngine + IRule plugin sistemi
│   └── rules/      Commission, Underpayment, Refund kuralları
├── results/        IssueResult + IssueAttribution drill-down
├── summary/        SummaryService + InsightsService (TR templated)
└── runs/           UploadRun listesi (org-scoped)
```

## Reconciliation Kuralları

| Kural | Tetik koşulu | Loss formülü |
| --- | --- | --- |
| `COMMISSION_MISMATCH` | `\|kesilen − beklenen\| > dynamicThreshold` | `\|fark\|` |
| `UNDERPAYMENT` | `netPaid < expectedNet` | `expectedNet − netPaid` |
| `MISSING_REFUND` | `isReturn && commissionRefund == 0` | `gross × commissionRateExpected` |

Dynamic threshold: `<1000 ₺ → ±5 ₺`, `1000-10000 ₺ → %1`, `>10000 ₺ → %0.5`.

## Dokümanlar

- [`MVP.md`](MVP.md) — ürün spec
- [`BUILD_GUIDE.md`](BUILD_GUIDE.md) — clean architecture rehberi
- [`API_CONTRACT.md`](API_CONTRACT.md) — endpoint sözleşmesi
- [`OUTBOUND_PLAYBOOK.md`](OUTBOUND_PLAYBOOK.md) — ilk 10 müşteri satış playbook'u
- [`INITIAL_SPEC.md`](INITIAL_SPEC.md) — orijinal proje spec'i (history)
- [`memory.md`](memory.md) — session log

## Durum

v0.1 + multi-tenant + dashboard v2 + Xpensio-grade UI yayında. Sıradaki: prod deploy (Hetzner), AI-powered insights (LLM), native pazaryeri export adapter'ları, PDF/CSV export.
