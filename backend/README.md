# 🛒 A.E.E — Advanced E-commerce Engine
### Multi-Tenant SaaS Backend Platform

> Production-ready Node.js/Express backend with MongoDB, JWT Auth, Fraud Detection Engine, and Telegram Bot Integration.

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- MongoDB (local or Atlas)
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Start development server
```bash
npm run dev
```

### 4. Register your Telegram Webhook
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/api/v1/webhooks/telegram",
    "secret_token": "your_webhook_secret_from_env"
  }'
```

---

## 📁 Project Structure

```
aee-backend/
├── app.js                          # Express app + security middlewares
├── server.js                       # Entry point (DB + server boot)
├── package.json
├── .env.example
├── API_ENDPOINTS.md                # Full API reference for Postman
└── src/
    ├── config/
    │   ├── db.js                   # MongoDB connection
    │   └── logger.js               # Winston logger
    ├── models/
    │   ├── Merchant.js             # Auth + store info
    │   ├── Product.js              # Inventory items
    │   ├── Order.js                # Orders + fraud analysis embedded
    │   └── CustomerHistory.js      # Global fraud tracking collection
    ├── routes/v1/
    │   ├── index.js                # V1 router aggregator
    │   ├── auth.routes.js
    │   ├── product.routes.js
    │   ├── order.routes.js
    │   └── webhook.routes.js       # Telegram webhook
    ├── controllers/
    │   ├── authController.js
    │   ├── productController.js
    │   ├── orderController.js      # Transactions + inventory sync
    │   └── botController.js        # Telegram callback handler
    ├── services/
    │   ├── telegramService.js      # Bot API calls
    │   └── inventoryService.js     # Stock sync logic
    ├── middlewares/
    │   ├── auth.js                 # JWT protect middleware
    │   ├── fraudAnalyzer.js        # 🛡️ Fraud Detection Engine
    │   └── errorHandler.js         # Global error handler
    ├── validations/
    │   ├── auth.validation.js
    │   ├── product.validation.js
    │   └── order.validation.js
    └── utils/
        ├── appError.js             # Custom operational error class
        └── helpers.js              # Utility functions
```

---

## 🛡️ Security Features

| Feature | Implementation |
|---------|---------------|
| Password Hashing | bcryptjs (12 rounds) |
| Authentication | JWT (RS256 compatible) |
| Security Headers | Helmet.js |
| Rate Limiting | 200 req/15min (20 for auth) |
| Input Validation | express-validator |
| CORS | Configurable per environment |
| IP Trust | `trust proxy` enabled |
| Webhook Auth | X-Telegram-Bot-Api-Secret-Token |
| Error Leakage | Sanitized production errors |

---

## 🧮 Fraud Engine Formula

```
FraudScore = 100 - (RTO_Rate × 60) - IP_Penalty
```

- **RTO Rate > 30%** → Heavy penalty
- **New/Unknown IP** → -10 points
- **Blacklisted customer** → Score = 0 (immediate flag)
- **Auto-blacklist** if score drops below 20

---

## 📡 Telegram Bot Features

- 📨 Instant order notifications with full details
- 🛡️ Fraud risk badge (🟢🟡🔴)
- ✅ Confirm / ❌ Cancel / 🚢 Ship buttons
- 🔄 Real-time order management from mobile
- 📝 Message edit-in-place (buttons removed after action)

---

*Built with ❤️ for local merchants | A.E.E Platform v1.0.0*
