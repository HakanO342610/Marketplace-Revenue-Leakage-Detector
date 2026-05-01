# Project Memory — Marketplace Revenue Leakage Detector

> **Convention:** Every session ends with an update to this file. Every new session starts by reading it. Goal: zero context loss between sessions.

---

## Current State

**Phase:** v0.1 implementation in progress (Phase 1 — backend bootstrap)

**Stack (locked):**
- Backend: NestJS 10 (npm), port **3101**
- Frontend: Next.js 14 App Router + Tailwind, port **3100**
- DB: PostgreSQL via Prisma. Local: Docker on port **5434**. Prod: Hetzner CX23 (Helsinki, IP `89.167.115.209`)
- Repo layout: top-level `backend/` + `frontend/` (no monorepo)
- CSV parser: `csv-parse` (sync)
- Validation: `class-validator` + `class-transformer`

**Why these ports (not 3000/3001/5433):** user's `expense_*` Docker stack already uses 3000/3001/5433 — avoided collision.

---

## Files / Artifacts

- [Readme.MD](Readme.MD) — initial pitch
- [MVP.md](MVP.md) — production spec (5 reconciliation rules, API design, roadmap)
- [BUILD_GUIDE.md](BUILD_GUIDE.md) — clean architecture, plugin engine, dashboard, landing, GTM
- [API_CONTRACT.md](API_CONTRACT.md) — frozen contract between back and front (4 endpoints)
- [datasets/sample.csv](datasets/sample.csv) — 1500 rows, **203 seeded MISSING_REFUND cases**
- [docker-compose.yml](docker-compose.yml) — local Postgres on 5434
- `backend/.env` — local DATABASE_URL (gitignored)
- `backend/.env.example` — has Hetzner placeholder for prod
- Plan file: `/Users/holusan/.claude/plans/vast-inventing-cupcake.md`

---

## Reconciliation Rules (locked)

1. **COMMISSION_MISMATCH** — `|commission_charged - gross*rate_expected| > getDynamicThreshold(gross)`. Loss = `|diff|`.
2. **UNDERPAYMENT** — `net_paid < (gross - expected_commission - logistics_fee - campaign_discount)`. Loss = `expected_net - net_paid`.
3. **MISSING_REFUND** — `is_return && commission_refund == 0`. Loss = `gross * commission_rate_expected`.

Threshold: `<1000 → 5`, `1000–10000 → gross*0.01`, `>10000 → gross*0.005`.

Leakage score: `(total_loss * 0.7) + (issue_count * 10)`.

---

## Verification Targets (E2E)

Against `datasets/sample.csv`:
- Upload → `rowCount === 1500`
- `summary.issue_breakdown.MISSING_REFUND === 203`
- Rows `500007-1`, `500010-1`, `500014-2` must flag MISSING_REFUND
- Counter-examples `500005-1`, `500013-1` must NOT flag MISSING_REFUND
- `total_leakage > 30,000 ₺` (sanity floor)

---

## Session Log

### Session 3 — 2026-04-30 (Xpensio redesign + items 1-6, multi-tenant in progress)

**Yapılanlar:**
- **Tasarım pass 1 (dark control surface):** teal accent, Layer 01/02/03 sticky CFO grid. Build green.
- **Tasarım pass 2 (Xpensio aesthetic):** sidebar layout (`components/sidebar.tsx`), top bar `site-header.tsx`, **violet brand** (#8b5cf6), navy surfaces (#0b0d12 / #11141b / #1a1e27), TR/theme/lang chips, user pill + ADMIN role. Auth pages use centered card on auth-canvas (no sidebar). Sidebar self-hides on `/`, `/login`, `/register`.
- **Bug fix — reconcile idempotency:** `IssueResult.deleteMany({ where: { runId } })` BEFORE persist. Demo run vardı 7046 sorun (13× duplikasyon) → 542'ye temizlendi.
- **Item 1 — InsightEngine refactor:** `insights.risk_level` (LOW/MEDIUM/HIGH bazlı leakage_rate), `insights.headline` (executive alias), `insights.top_drivers[]` (label+amount+share, top 3, amount desc).
- **Item 2 — RootCause:** Yeni `summary.root_causes[]` = `{type, label, totalLoss, percentage, examples[]}` — her rule için en yüksek loss'lu 3 orderLineId IssueAttribution'dan çekiliyor.
- **Item 3 — Value math:** `monthly_recovered` (= total_leakage), `annual_impact` (× 12). Frontend `<ValueMath>` kart: violet glow sol "Aylık Kurtarılabilir Gelir", red sağ "Yıllık Etki", altta projeksiyon notu.
- **Item 4 — Top 3 Loss Driver UI:** `<TopDrivers>` bileşeni, `<RootCauses>` bileşeni (örnekler chip'lerle), `<RiskPill>` insight panel header'da. Layer numbering: ValueMath (top) → 01 CFO → 02 İçgörü → 03 Kök Neden (Top3+RootCauses+Breakdowns) → 04 İnceleme.
- **Item 5 — Outbound playbook:** [OUTBOUND_PLAYBOOK.md](OUTBOUND_PLAYBOOK.md) yazıldı. ICP, 4 step (LinkedIn hook + offer + output + closing), 30-day sprint, pricing matrix (free audit / %15-25 performance fee / sabit ₺50K-₺250K SaaS), email + LinkedIn DM şablonları, anti-pattern listesi.
- **Item 6 — Multi-tenant (in progress):**
  - Schema: `Organization {id,name,slug(unique),createdAt}`, `Membership {userId,orgId,role,@@unique([userId,orgId])}`, `UploadRun.orgId String?`. Migration `add_organizations` uygulandı.
  - Backfill: `backend/scripts/backfill-orgs.js` çalıştırıldı — 7 user, herkes personal org admin'i, mevcut runs orgId'ye linklendi. demo@mrld.test → org `cmolid4sd00000hoftvnekhsy`.
  - Backend: `OrgsModule` (controller + service + 3 DTO + module), `OrgContextGuard` (`X-Org-Id` header okur, fallback first org), tüm run-scoped endpoint'ler artık `JwtAuthGuard + OrgContextGuard`, services `where: { orgId }` ile filtreliyor. Auth register/login response'unda `orgs[]` lite payload geri dönüyor.
  - Frontend: `lib/api.ts` org tipleri + helper fns + `currentOrgId/setCurrentOrgId/clearCurrentOrgId` (localStorage + cookie samesite=lax 7d) + `X-Org-Id` header otomatik enjekte. `app/orgs/page.tsx` (cards + "Yeni Organizasyon"), `app/orgs/[slug]/members/page.tsx` (members tablosu + invite formu, last-admin guard, TR rol etiketleri: Yönetici/Üye/Görüntüleyici). Sidebar org switcher dropdown, admin-only "Üyeler" nav item. Site header'da org name + role chip. proxy.ts matcher `/orgs` ve `/orgs/:path*`'a genişletildi.
  - **Item 6.5 DONE — E2E multi-tenant doğrulama (2026-04-30 son tur):**
    - Backend yeni kod ile restart edildi (port 3101).
    - demo@mrld.test login → `orgs[]` payload dönüyor (`Demo Kullanıcı Workspace`, role admin).
    - GET /api/orgs → memberCount=1, role=admin ✓
    - GET /api/runs (X-Org-Id ile) → demo'nun 1 run'u 542 sorun + monthly ₺65.181,50 + annual ₺782.178 + risk MEDIUM + Top 3 drivers (Eksik İade %93, Eksik Ödeme %4, Komisyon Farkı %2.5) ✓
    - POST /api/orgs body `{name:"Test Şirketi A.Ş."}` → yeni org oluştu, demo otomatik admin (slug auto: `test-sirketi-a-s-205021`) ✓
    - GET /api/orgs/{newOrg}/members → sadece demo (admin) ✓
    - **Cross-org isolation:** demo'nun eski run'una yeni org context (X-Org-Id) ile erişim → **403** ✓ (ownership check by orgId çalışıyor)

**UI follow-up (2026-04-30 itibariyle):**
- Kullanıcı feedback: "yazılar küçük ve koyu renk gibi görünmüyor" — readability tier consistency lazım.
- Punch list 7 madde + ek dashboard component'leri inline contrast tier (zinc-400 micro-labels, zinc-200 body, zinc-100 numbers) uygulanıyor (subagent rate limit nedeniyle inline).

**Kalan iş listesi (gelecek session):**
- Item 6.5: E2E doğrulama
- Item 6 alternatif sub-items (kullanıcı seçmedi ama istenirse): GitHub repo + README, Sales deck PDF, Outbound automation
- v3 ileri özellikler: AI-powered insights (LLM), anomaly detection, native Trendyol/HB adapter, PDF/CSV export, Recharts, drill-down modal
- Hetzner deploy: backend/.env.example'da Hetzner CX23 (89.167.115.209) placeholder var, prod connection string alınınca deploy

---

### Açık Sprint Başlıkları (2026-05-01 itibariyle, sırasız backlog)

Bunlar bağımsız sprint'ler olarak ele alınabilir — herhangi birinden başlayabiliriz:

1. **Hetzner deploy** — backend `.env.example`'da Hetzner CX23 (89.167.115.209) placeholder var. User prod connection string sağlayınca: docker-compose prod profile, GitHub Actions deploy workflow, nginx reverse proxy + SSL (Caddy/Let's Encrypt), domain bağlama, frontend Vercel veya aynı sunucuda host. PM2 veya systemd ile NestJS process management.

2. **AI-powered insights (LLM)** — mevcut template-based InsightsService'i Anthropic Claude API ile değiştir. Input: SummaryDto v2; output: gerçek doğal-dil narrative + risk yorumu + öneri. Prompt cache'le (sample.csv için aynı çıkar). Cost guard: token budget per run. Anti-pattern: streaming yok, kısa cevap (200-300 token).

3. **Charts (Recharts) — zaman serisi** — şu an snapshot-only. Zaman boyutunu eklemek için: birden fazla `UploadRun`'ı aynı org'da agrega ederek aylık trend. Recharts yerine Tremor veya `@nivo` da değerlendirilebilir. Hedef: dashboard'da "Son 6 ay leakage trendi" line chart + ay-bazında driver kırılımı stacked bar.

4. **PDF export (audit raporu)** — dashboard'un printable versiyonu. `@react-pdf/renderer` veya server-side Puppeteer ile. İçerik: kapak (müşteri adı, tarih, run ID), CFO özet, KPI grid, top drivers donut, root-causes tablo, 50 satırlık sample bulgu, kapanış. Tek tıklık `/api/export/pdf?runId=...` endpoint. Email göndermek için Resend entegrasyonu opsiyonel.

5. **Native Trendyol/HB CSV export adapter'ları** — şu an tek bir merged CSV format bekliyoruz. Gerçek Trendyol satıcı paneli "Hakediş Detayı" CSV ve Hepsiburada satıcı portali farklı kolonlara sahip. Her marketplace için ayrı parser modülü: `parsers/trendyol.parser.ts`, `parsers/hepsiburada.parser.ts`, dispatcher upload sırasında `marketplace` form field'ına göre seçer. Format detection (header eşleme) + unit testler (gerçek müşteri sample dosyalarıyla).

**Önceliklendirme önerisi:**
- Para hızı: **#1 Hetzner deploy** (yayında olmadan satış yok) → **#5 native adapter'lar** (gerçek dosya kabul etmek için şart)
- Demo gücü: **#4 PDF export** (satış toplantısında müşteriye bırakacak somut çıktı) → **#2 AI insights** (premium hissi)
- v3 polish: **#3 zaman serisi** (sürekli izleme abonelik modeline destek)

---

### Donnerstag.ai analizinden landing P0 öneriler (2026-05-01)

Tarayıcı analiz sonrası belirlenen P0 landing iyileştirmeleri (henüz uygulanmadı):
1. Hero tipografisini büyüt (text-7xl → text-8xl/9xl lg)
2. 3 trust badge ekle: 🇹🇷 Türkiye barındırma · ✓ KVKK uyumlu · 🛡 Kurumsal güvenlik
3. Tek CTA stratejisi (Sign Up + Open Account → tek "Ücretsiz Denetim Başlat")
4. Vaka çalışması bandı (gerçek/mock müşteri quote + sayısal kanıt)

P1 (sonraki sprint): 3 sektör kartı (Moda/Elektronik/FMCG), 4-aşama timeline ("Değer Kanıtı" rebrand), FAQ section, üst banner mekanizması.

P2: blog/resources, partners sayfası, EN switcher, aggregate metric sayacı.

Strateji: "Free Trial" yerine **"Değer Kanıtı"** (Proof of Value) — donnerstag formülü; CFO'ya "para buldun göster" mesajı.

**Operasyonel kararlar (locked):**
- Brand: **violet-500** (#8b5cf6) — finansal güven, indigo info severity için ikincil
- Surfaces: #0b0d12 page / #11141b card / #1a1e27 elevated, navy tint
- Sidebar layout (Xpensio-style) — sadece login/register/landing'de gizli
- Multi-tenant default rol: register sonrası kullanıcı kendi personal org'unun admin'i

---

### Session 2 — 2026-04-30 (v2 CFO-grade upgrade + auth + Turkish UI)

**Built (after v0.1 was already running):**
- Frontend Türkçeleştirme: tüm sayfa/bileşen string'leri TR.
- Auth (JWT): `User` table + `UploadRun.userId`; backend `/api/auth/{register,login,me}`, JWT guard on all routes; frontend login/register pages, `/runs` listesi, `proxy.ts` (Next 16'da middleware = proxy konvansiyonu) protected route guard, header user state, localStorage+cookie token.
- v2 CFO upgrade — engine artık per-rule attribution emit ediyor: `severity` (info/warning/critical), `confidence` (real, formülle hesaplanan), `explanation` (TR template). Yeni `IssueAttribution` tablosu: `(ruleName, expected, actual, variance, loss, severity, confidence, explanation)`.
- Summary v2 ek alanlar: `expected_revenue`, `recovered_revenue_potential`, `unexplained_variance`, `confidence_score`, `top_loss_driver`, `amount_breakdown` (₺), `category_breakdown`, `marketplace_breakdown`, `insights {executive, bullets[3], alert?}`.
- Insight engine: TR template-based executive sentence + 3 bullet + risk alert.
- Yeni endpoint: `GET /api/results/:orderLineId/attributions?runId=` — drill-down için.
- Dashboard 3-layer redesign: CFO summary (6 KPI sticky) → InsightPanel → Layer 2 (3 BreakdownBar: Sorun Türüne Göre / Kategori / Pazaryeri) → Layer 3 InvestigationTable (tab filter + expandable rows + AttributionDetail).
- Components: `kpi-card` (positive/subtle tone + delta pill), `insight-panel`, `breakdown-bar` (proportional Tailwind bars, no chart lib), `investigation-table`, `attribution-detail`.
- Helpers: `formatTRYShort`, `formatConfidence`, `severityClasses`.

**E2E doğrulama (sample.csv ile, /api/v2):**
- Reconcile: 542 issue, 65.181,50 ₺ leakage. Breakdown ₺: COMMISSION_MISMATCH 1.610, UNDERPAYMENT 2.890, MISSING_REFUND 60.681,50 (top driver, %93).
- Category top: cosmetics %29, electronics %26, home %26, fashion %19.
- Marketplace: hepsiburada %56, trendyol %44.
- Confidence: 0.98 ortalama.
- Insight executive (TR): "Bu çalıştırmada gelirin %2.10'i ₺65.182 olarak kayboldu — kaybın %93.0 oranı Eksik İade kaynaklı." + 3 bullet, alert null.

**Bug fix'ler bu session:**
- Next.js SSR fetch dedup: aynı render'da `getSummary` iki kez çağrılınca React/Next request memoization aynı response'u dönüyordu (auto-reconcile sonrası ikinci fetch eski boş veriyi gösteriyordu). Fix: `getSummary(runId, fresh=true)` cache-bust query param ekliyor.
- `unexplained_variance` formülü meşru komisyon/lojistik tutarlarını da kayıp olarak sayıyordu (~500k ₺ yanıltıcı alarm). Fix: `max(0, expected_revenue - total_paid - total_leakage)` — sample veride 0, alert artık tetiklenmiyor.

**Operasyonel:**
- `expense_*` Docker stack'i 3000/3001/5433 kullanıyor. Bizimkiler 3100/3101/5434.
- Hetzner CX23 (89.167.115.209) prod hedefi, connection string henüz alınmadı.
- npm cache root-owned, lokal `--cache /tmp/npm-cache-mrld` kullanılıyor. **TODO:** `sudo chown -R 1030700097:1723434838 ~/.npm`.
- Frontend Next 16 — middleware → `proxy.ts` konvansiyonu kullandık.
- Prisma 6'ya pin'lendi (v7 datasource config breaking change var).

**Next session pickup (deferred sprint 2 deliverables):**
- Landing rewrite (Stripe-grade, daha güçlü financial narrative)
- Outbound script (cold email/LinkedIn DM, ICP segmentlerine göre)
- AI v2 architecture doc (LLM-generated insights, anomaly detection, NL drill-down — sadece tasarım)
- "Stripe seviyesi UI prompt pack" — istenirse ayrı doc olarak

---

### Session 1 — 2026-04-30 (v0.1 shipped end-to-end)
**Done:**
- Docs: MVP.md, BUILD_GUIDE.md, API_CONTRACT.md, memory.md, plan file
- Phase 0: CSV → `datasets/sample.csv`, root `.gitignore`
- Phase 1: `docker-compose.yml` (Postgres on 5434), `backend/.env`, Prisma 6 (pinned — v7 has breaking config changes), schema migrated, NestJS Prisma module
- Phase 1.5: Next.js scaffolded with TS/Tailwind/App Router (port 3100)
- Phase 2: upload module (controller + service + csv parser + DTO + types) — verified 1500 rows persist
- Phases 3+4 (subagent A): plugin rule engine + 3 rules + threshold + reconciliation/results/summary modules, all wired to AppModule
- Phase 5 (subagent B): `lib/api.ts`, `lib/format.ts`, layout, upload form, dashboard server component (auto-reconciles on first load), KPI cards, leakage table, `next.config.ts` rewrites `/api/*` → `:3101`
- Phase 6 (subagent C): conversion-focused landing page at `app/page.tsx` (hero + pain + how-it-works + mock dashboard + CTA)
- Phase 7 E2E: **all assertions PASS**
  - rowCount = 1500 ✓
  - `summary.issue_breakdown.MISSING_REFUND` = **203** ✓
  - Total: 542 issues, 65,181.50 ₺ leakage, 2.10% rate
  - Seeded rows 500007-1, 500010-1, 500014-2 flagged ✓
  - Counter-examples 500005-1, 500013-1 NOT flagged ✓
  - `total_leakage > 30k ₺` floor ✓
  - Frontend `/`, `/upload`, `/dashboard/[runId]` all return HTTP 200 with expected content
- Bug fix: `/api/results?issueType=...` filter was post-limit; moved to SQL via `{ issues: { contains: issueType } }`
- Bug fix: removed `next/font/google` from `app/layout.tsx` — sandbox blocks fonts.gstatic.com, was causing 500. Now uses system fonts via Tailwind defaults.
- Dependencies workaround: npm cache root-owned, used `--cache /tmp/npm-cache-mrld`. **TODO for user:** `sudo chown -R 1030700097:1723434838 ~/.npm` for permanent fix.

**Operational notes:**
- Backend dev: `cd backend && npm run start:prod` (built via `npm run build`). Currently running on :3101.
- Frontend dev: `cd frontend && npm run dev` (port 3100, turbopack). Currently running.
- Postgres: `docker compose up -d postgres` (port 5434). Volume `mrld_pg_data` persists.
- AGENTS.md inside frontend/ warns "this is NOT the Next.js you know" — Next 16 is installed, agents read `node_modules/next/dist/docs/` for canonical API. Heed deprecation notices.

**Next session pickup:**
- Polish landing page visuals (current is functional, can be more distinctive)
- Maybe add shadcn/ui to dashboard for table sorting/pagination
- Real Hetzner deploy: fill `backend/.env.example` with prod Postgres URL, add Dockerfile + GH Actions
- v0.2 features (deferred): PDF export, drill-down view, charts, native marketplace adapters

**Open decisions:**
- Hetzner Postgres connection string still pending — fill before deploy
