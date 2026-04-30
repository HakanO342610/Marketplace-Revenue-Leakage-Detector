# API Contract — v0.1

Frozen contract between backend (NestJS, port 3001) and frontend (Next.js, port 3000). Both sides build to this doc.

Frontend dev: Next.js `next.config.js` rewrites `/api/*` → `http://localhost:3001/api/*` so client code uses relative URLs.

---

## POST /api/upload

**Request:** `multipart/form-data`
- `file` (required) — CSV file
- `marketplace` (optional) — string (e.g. "trendyol", "hepsiburada", "mixed")

**Response 201:**
```json
{ "runId": "clxxxxxxxx", "rowCount": 1500, "marketplace": "mixed" }
```

**Errors:**
- 400 — missing file, invalid CSV headers, malformed rows
- 413 — file too large (>10MB)

---

## POST /api/reconcile

**Request:** `application/json`
```json
{ "runId": "clxxxxxxxx" }
```

**Response 200:**
```json
{ "runId": "clxxxxxxxx", "issueCount": 412, "totalLoss": 70123.45 }
```

**Errors:**
- 404 — runId not found

---

## GET /api/results

**Query params:**
- `runId` (required)
- `issueType` (optional) — `COMMISSION_MISMATCH` | `UNDERPAYMENT` | `MISSING_REFUND`
- `limit` (optional, default 500)

**Response 200:**
```json
[
  {
    "orderLineId": "500007-1",
    "issues": ["MISSING_REFUND"],
    "estimatedLoss": 640.8,
    "expectedAmount": 640.8,
    "actualAmount": 0
  }
]
```

---

## GET /api/summary

**Query params:**
- `runId` (required)

**Response 200:**
```json
{
  "runId": "clxxxxxxxx",
  "total_revenue": 2345678.0,
  "total_paid": 2180000.0,
  "total_leakage": 70123.45,
  "leakage_rate": 2.99,
  "leakage_score": 49086.4,
  "issue_count": 412,
  "issue_breakdown": {
    "COMMISSION_MISMATCH": 89,
    "UNDERPAYMENT": 120,
    "MISSING_REFUND": 203
  }
}
```

**Note:** `leakage_rate` is `(total_leakage / total_revenue) * 100` rounded to 2dp. `leakage_score` is `(total_leakage * 0.7) + (issue_count * 10)`.

---

## CSV Header Contract

Required columns (snake_case in CSV, mapped to camelCase in DB):

```
marketplace, seller_id, order_id, order_line_id, sku, category, quantity,
unit_price, gross_amount, commission_rate_expected, commission_charged,
logistics_fee, campaign_discount, net_paid, order_date, payout_date,
is_return, refund_amount, commission_refund
```

Boolean coercion: `is_return` accepts `0`/`1` or `true`/`false`.
