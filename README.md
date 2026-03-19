# SenangGov 🛂

**SenangGov** is a simple, user-friendly web app that helps Malaysians navigate the **passport renewal process** with ease. Check your eligibility for online renewal, calculate fees, and get a step-by-step guide — all in one place.

🔗 **Live Demo:** [senanggov.bqianchong.workers.dev](https://senanggov.bqianchong.workers.dev/)

---

## ✨ Features

- **Eligibility Checker** — Answer 4 quick questions to find out if you qualify for online renewal via MyOnline Passport
- **Fee Calculator** — Automatically calculates your renewal fee (RM 100 for age 60+, RM 200 for others)
- **Step-by-Step Guidance** — Clear renewal steps for both online and counter renewal
- **Photo Requirements** — Detailed passport photo rules to avoid rejection
- **Collection Checklist** — Documents checklist tailored to your age group
- **Smooth Animations** — Powered by Framer Motion for a polished mobile-first experience

---

## 🛠️ Tech Stack

| Technology | Usage |
|---|---|
| React + TypeScript | Frontend framework |
| Vite | Build tool |
| Tailwind CSS | Styling |
| Framer Motion (`motion/react`) | Animations |
| Lucide React | Icons |
| Cloudflare Workers | Deployment/hosting |

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Installation

```bash
git clone https://github.com/ChongBingQian/SenangGov.git
cd SenangGov
npm install
```

### Environment Variables

Copy the example env file and fill in the required values:

```bash
cp .env.example .env
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

---

## 📋 Eligibility Rules

The app follows official rules from **Jabatan Imigresen Malaysia**:

- ❌ Age 13 and below → Counter only
- ❌ No existing passport → Counter only
- ❌ Lost or damaged passport → Counter only
- ❌ Special category (OKU, overseas student, hajj pilgrim) → Counter only
- ✅ All others → Eligible for online renewal

---

## 💳 Renewal Fees

| Age Group | Fee |
|---|---|
| Below 60 | RM 200 |
| 60 and above | RM 100 |

Passport validity: **5 years**

---

## 📎 Useful Links

- [MyOnline Passport Portal](https://imigresen-online.imi.gov.my/eservices/myPasport)
- [Jabatan Imigresen Malaysia](https://www.imi.gov.my)

---

## 📄 License

Licensed under the [Apache 2.0 License](./LICENSE).

---

> SenangGov © 2026 — Making government services less scary, one step at a time.
