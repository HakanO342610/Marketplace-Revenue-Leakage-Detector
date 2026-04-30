# Marketplace Revenue Leakage Detector — Full Production Starter Kit

## 🚀 1. Overview

Marketplace’lerde (Trendyol, Hepsiburada, Amazon) oluşan finansal kayıpları tespit eden sistem.

> Core Value: “We detect where you are losing money in marketplaces.”

---

## 📁 2. Project Structure

marketplace-recon/

backend/
src/
modules/
upload/
reconciliation/
results/
summary/
common/
config/
main.ts

prisma/
schema.prisma
package.json

frontend/
app/
dashboard/
upload/
components/
services/

datasets/
sample.csv

docker-compose.yml

---

## 🧠 3. Core Data Model

orders:

- order_line_id
- gross_amount
- commission_rate_expected

payouts:

- order_line_id
- commission_charged
- logistics_fee
- campaign_discount
- net_paid

returns:

- order_line_id
- is_return
- refund_amount
- commission_refund

---

## ⚙️ 4. Reconciliation Engine

### Commission Check

expected_commission = gross_amount \* commission_rate

variance = commission_charged - expected_commission

if abs(variance) > threshold → commission_mismatch

---

### Underpayment

expected_net =
gross_amount - expected_commission - logistics_fee - campaign_discount

if net_paid < expected_net → underpayment

---

### Return Check

if is_return and commission_refund == 0 → missing_refund

---

## 🔌 5. API

POST /upload  
GET /results  
GET /summary

---

## 🧾 6. Backend (NestJS)

@Post('upload')
@UseInterceptors(FileInterceptor('file'))
uploadFile(@UploadedFile() file) {
return this.uploadService.process(file);
}

---

## 🧠 Reconciliation Service

run(rows) {
return rows.map(row => {

    const expected = row.gross_amount * row.commission_rate_expected;

    let issues = [];
    let loss = 0;

    if (Math.abs(row.commission_charged - expected) > 5) {
      issues.push("commission_mismatch");
      loss += Math.abs(row.commission_charged - expected);
    }

    const expectedNet =
      row.gross_amount - expected - row.logistics_fee - row.campaign_discount;

    if (row.net_paid < expectedNet) {
      issues.push("underpayment");
      loss += expectedNet - row.net_paid;
    }

    return {
      order_line_id: row.order_line_id,
      issues: issues.join(",") || "OK",
      estimated_loss: loss
    };

});
}

---

## 🖥️ 7. Frontend

Upload:
<input type="file" />

Dashboard:

- Total Leakage
- Issue list
- SKU breakdown

---

## 🐳 8. Docker

version: '3.8'

services:
db:
image: postgres
environment:
POSTGRES_USER: postgres
POSTGRES_PASSWORD: postgres
POSTGRES_DB: recon
ports: - "5432:5432"

---

## 🚀 9. Roadmap

Week 1: Setup  
Week 2: CSV upload  
Week 3: Engine  
Week 4: Dashboard  
Week 5: Testing  
Week 6: Pilot

---

## 💰 10. Go-To-Market

- Free audit
- Show leakage
- Convert to paid

---

## 🧲 11. Sales Hook

“We detect money lost in marketplaces without any integration.”

---

## 📌 12. North Star Metric

Total Leakage Detected (₺)

---

## ⚠️ 13. Principle

Don’t build features.  
Build recovered money.
