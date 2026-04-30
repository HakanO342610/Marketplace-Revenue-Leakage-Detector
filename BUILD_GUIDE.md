# Marketplace Revenue Leakage Detector — Build Guide

> MVP'nin "Next Steps" maddelerinin tam açılımı: gerçek NestJS repo, plugin-based rule engine, React dashboard, landing page ve GTM playbook.

---

## 🧱 1. Real NestJS Repo (Clean Architecture)

### 📁 Structure

```
backend/
├── src/
│   ├── modules/
│   │   ├── upload/
│   │   │   ├── upload.controller.ts
│   │   │   ├── upload.service.ts
│   │   │   └── upload.module.ts
│   │   │
│   │   ├── reconciliation/
│   │   │   ├── engine/
│   │   │   │   ├── reconciliation.engine.ts
│   │   │   │   └── rule.registry.ts
│   │   │   ├── rules/
│   │   │   │   ├── commission.rule.ts
│   │   │   │   ├── payout.rule.ts
│   │   │   │   └── refund.rule.ts
│   │   │   ├── reconciliation.service.ts
│   │   │   └── reconciliation.module.ts
│   │   │
│   │   ├── results/
│   │   ├── summary/
│   │   └── common/
│   │
│   ├── main.ts
│   └── app.module.ts
```

### 🧠 Core Design

Clean separation:
- **Controller** → HTTP only
- **Service** → orchestration
- **Engine** → business logic
- **Rules** → plugin system

### ⚙️ Reconciliation Engine

```ts
export class ReconciliationEngine {
  constructor(private rules: IRule[]) {}

  run(rows: any[]) {
    return rows.map(row => {
      let issues = [];
      let loss = 0;

      for (const rule of this.rules) {
        const result = rule.evaluate(row);
        if (result.flagged) {
          issues.push(result.type);
          loss += result.loss || 0;
        }
      }

      return {
        order_line_id: row.order_line_id,
        issues,
        estimated_loss: loss
      };
    });
  }
}
```

---

## 🔌 2. Rule Engine → Plugin System (Critical Upgrade)

### IRule Interface

```ts
export interface IRule {
  name: string;
  evaluate(row: any): {
    flagged: boolean;
    type?: string;
    loss?: number;
  };
}
```

### 💡 Example Rule

```ts
export class CommissionRule implements IRule {
  name = "commission_rule";

  evaluate(row: any) {
    const expected = row.gross_amount * row.commission_rate_expected;

    const diff = row.commission_charged - expected;

    if (Math.abs(diff) > 5) {
      return {
        flagged: true,
        type: "COMMISSION_MISMATCH",
        loss: Math.abs(diff)
      };
    }

    return { flagged: false };
  }
}
```

### 🧩 Rule Registry (Plugin Core)

```ts
export const ruleRegistry = [
  new CommissionRule(),
  new PayoutRule(),
  new RefundRule()
];
```

> 👉 Burada yeni rule eklemek = plugin eklemek.

---

## 🖥️ 3. React Dashboard (KPI Ready)

### 📊 Layout

**KPI Cards**
- Total Revenue
- Total Paid
- 🔴 Total Leakage

### Dashboard Component

```tsx
export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/summary")
      .then(r => r.json())
      .then(setData);
  }, []);

  if (!data) return null;

  return (
    <div>
      <h1>Revenue Leakage Dashboard</h1>

      <div className="grid">
        <Card title="Revenue" value={data.total_revenue} />
        <Card title="Paid" value={data.total_paid} />
        <Card title="Leakage" value={data.total_leakage} />
      </div>

      <LeakageTable />
    </div>
  );
}
```

### 📉 Issue Table

```tsx
function LeakageTable() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    fetch("/api/results")
      .then(r => r.json())
      .then(setRows);
  }, []);

  return (
    <table>
      <thead>
        <tr>
          <th>Order</th>
          <th>Issues</th>
          <th>Loss</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.order_line_id}>
            <td>{r.order_line_id}</td>
            <td>{r.issues}</td>
            <td>{r.estimated_loss}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## 🌐 4. Landing Page (Conversion-Focused)

### 🎯 Hero

```html
<h1>Find Money You Are Losing on Marketplaces</h1>
<p>No integration. Upload your file. Get leakage report in minutes.</p>

<button>Start Free Audit</button>
```

### 💥 Pain Section
- "Are you sure your payouts are correct?"
- "Do you trust marketplace reports?"
- "Most sellers lose 2–7% revenue unnoticed"

### 🧠 How it works
1. Upload file
2. We analyze
3. We show leakage

### 📊 Output Example

> "You are losing 84.000 ₺ monthly"

### CTA

> 👉 "Upload your report now"

---

## 📈 5. First 10 Customer Acquisition Playbook

### 🎯 ICP
- 5M+ TL monthly GMV sellers
- multi marketplace sellers
- finance pain yaşayan firmalar

### 🔥 Strategy 1 — Free Audit Hook

> "Marketplace payout'larınızı kontrol edip kaç TL kaybettiğinizi söyleyebilirim."

### 🔥 Strategy 2 — LinkedIn Outreach

Target:
- e-commerce director
- CFO
- marketplace manager

### 🔥 Strategy 3 — Value-first Audit

Step:
1. CSV iste
2. analiz yap
3. leakage raporu ver

**💰 Conversion moment**

> "Sadece bu ay 73.000 ₺ kayıp tespit ettik."

### 🔥 Strategy 4 — Authority Hack

Konumlandırma:

> "We audit marketplace finances."

### 📦 Offer
- Free audit
- Paid continuous monitoring

### 💸 Pricing (early stage)
- % of recovered leakage
- OR fixed monthly fee

---

## ⚠️ Strategic Insight (En Kritik Nokta)

Bu ürün:
- ❌ SaaS dashboard **değil**
- ✔ "money recovery engine"

---

## 🚀 Sonuç

Elindeki sistem artık:
- backend architecture ready
- plugin-based rule engine
- dashboard ready
- landing page ready
- GTM playbook ready
