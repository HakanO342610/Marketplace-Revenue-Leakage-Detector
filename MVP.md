# Marketplace Revenue Leakage Detector — MVP v2 (Production Grade)

---

## 🚀 1. Product Definition

### Problem
Marketplace sellers lose revenue due to:
- incorrect commissions
- missing payouts
- unpaid refunds
- campaign deductions inconsistencies

### Solution
A financial reconciliation engine that:
> "Matches orders, payouts, and returns and detects revenue leakage automatically."

---

## 🎯 2. MVP Goal

Build a system that:
- ingests marketplace export files (CSV)
- reconciles financial flows
- detects revenue leakage
- produces actionable insights

---

## 🧩 3. MVP Scope (STRICT)

### Included
- ✔ CSV ingestion (Orders, Payouts, Returns)
- ✔ Reconciliation engine (rule-based)
- ✔ Leakage detection scoring
- ✔ Simple dashboard (KPI + issues)
- ✔ Exportable report (CSV/PDF)

### Excluded
- ✘ API integrations (Trendyol, HB, Amazon)
- ✘ AI/ML models
- ✘ Multi-tenant SaaS infra
- ✘ SAP integration

---

## 📁 4. Data Model (Realistic Marketplace Structure)

### ORDERS
- order_id
- order_line_id
- seller_id
- sku
- category
- quantity
- gross_amount
- order_date

### PAYOUTS
- order_line_id
- marketplace
- commission_charged
- logistics_fee
- campaign_discount
- net_paid
- payout_date

### RETURNS
- order_line_id
- is_return
- refund_amount
- commission_refund
- return_reason

### RESULT TABLE (Engine Output)
- order_line_id
- issue_types[]
- expected_amount
- actual_amount
- estimated_loss
- confidence_score

---

## ⚙️ 5. Core Reconciliation Engine (Production Logic)

### 5.1 Commission Validation

```python
expected_commission = gross_amount * commission_rate

diff = commission_charged - expected_commission

if abs(diff) > dynamic_threshold:
    issue = "COMMISSION_MISMATCH"
```

### 5.2 Underpayment Detection

```python
expected_net = gross_amount - expected_commission - logistics_fee - campaign_discount

if net_paid < expected_net:
    issue = "UNDERPAYMENT"
    loss  = expected_net - net_paid
```

### 5.3 Missing Refund Detection

```python
if is_return == True:
    if commission_refund == 0:
        issue = "MISSING_REFUND"
```

### 5.4 Leakage Scoring Model

```python
leakage_score = (total_loss * 0.7) + (issue_count * 10)
```

### 5.5 Dynamic Threshold Logic

| Gross Amount       | Threshold |
| ------------------ | --------- |
| < 1.000 TL         | ±5 TL     |
| 1.000 – 10.000 TL  | %1        |
| > 10.000 TL        | %0.5      |

---

## 🔌 6. API Design

### Upload Data
```
POST /api/upload
Content-Type: multipart/form-data
```

### Run Reconciliation
```
POST /api/reconcile
```

### Get Results
```
GET /api/results
```

### Summary KPI
```
GET /api/summary
```

Response:
```json
{
  "total_revenue": 1250000,
  "total_paid": 1180000,
  "total_leakage": 70000,
  "leakage_rate": 5.6
}
```

---

## 🧠 7. Backend Architecture (Clean Design)

### Modules
- UploadModule
- ParsingModule
- ReconciliationModule
- ReportingModule

### Flow
```
CSV Upload
   ↓
Parser
   ↓
Normalized DB
   ↓
Reconciliation Engine
   ↓
Results Store
   ↓
API Output
```

---

## 🖥️ 8. Frontend (Minimal Viable UX)

### Dashboard
**KPI Cards**
- Total Leakage (highlighted)
- Total Revenue
- Total Discrepancy %

**Tables**

| Order | Issue | Loss | Confidence |
| ----- | ----- | ---- | ---------- |

**Drill-down View**
- expected vs actual breakdown
- rule explanations

### Upload Screen
- drag & drop CSV
- marketplace selector (optional)

---

## 🐳 9. Infrastructure

### Local Dev
- Node.js backend
- React frontend
- PostgreSQL

### Optional
- Dockerized environment

---

## 🚀 10. MVP Roadmap (6 Weeks Realistic)

| Week | Deliverable                  |
| ---- | ---------------------------- |
| 1    | schema + ingestion           |
| 2    | reconciliation engine v1     |
| 3    | results API                  |
| 4    | dashboard UI                 |
| 5    | edge cases + validation      |
| 6    | pilot customer               |

---

## 💰 11. Go-To-Market Strategy

### ICP
- marketplace sellers (5M+ monthly GMV)
- finance teams
- CFO-level stakeholders

### Entry Strategy

**Step 1 — Free audit**
> "Upload your payout file, we show leakage."

**Step 2 — Show output**
- missed refunds
- commission mismatches
- underpayments

**Step 3 — Convert**
> "We recover lost revenue automatically."

---

## 🧲 12. Sales Positioning

- ❌ Not a reporting tool
- ✔ Financial recovery engine
- ✔ Marketplace audit system

---

## 📌 13. North Star Metric

**Total Leakage Detected (₺)**

---

## ⚠️ 14. Core Principle

> Don't build dashboards.
> Build recovered money.

---

## 🔥 15. Product Insight

This is not SaaS reporting.

This is:
> "Automated financial loss detection system for marketplaces"

---

## 🔥 Next Steps

1. Gerçek NestJS repo (modüler + clean architecture)
2. React dashboard (chart + KPI ready)
3. Rule engine'i plugin system'e çevirme
4. İlk satış landing page (conversion odaklı)
5. İlk 10 müşteri acquisition playbook

> Bu noktadan sonra yaptığın şey artık fikir değil:
> **fintech-grade marketplace intelligence product**
