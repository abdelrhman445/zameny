# 🛒 A.E.E — Advanced E-commerce Engine
## Complete API Reference & Postman Testing Guide

> **Base URL:** `http://localhost:5000/api/v1`  
> **Content-Type:** `application/json`  
> **Authentication:** `Bearer <JWT_TOKEN>` in `Authorization` header

---

## 📋 Table of Contents
1. [Health Check](#health-check)
2. [Authentication](#authentication)
3. [Products](#products)
4. [Orders](#orders)
5. [Telegram Webhook](#telegram-webhook)
6. [Postman Environment Setup](#postman-environment-setup)
7. [Fraud Score Formula](#fraud-score-formula)
8. [Order State Machine](#order-state-machine)

---

## ✅ Health Check

### `GET /health`
Check server status.

**No auth required.**

**Response `200`:**
```json
{
  "status": "OK",
  "platform": "A.E.E - Advanced E-commerce Engine",
  "version": "1.0.0",
  "timestamp": "2024-12-01T10:00:00.000Z"
}
```

---

## 🔐 Authentication

### `POST /api/v1/auth/register`
Register a new merchant account.

**No auth required.**

**Body:**
```json
{
  "name": "Ahmed Hassan",
  "email": "ahmed@mystore.com",
  "password": "SecurePass123",
  "storeName": "Hassan Electronics",
  "telegramChatId": "123456789"
}
```

**Response `201`:**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR...",
  "data": {
    "merchant": {
      "_id": "64abc...",
      "name": "Ahmed Hassan",
      "email": "ahmed@mystore.com",
      "storeName": "Hassan Electronics",
      "telegramChatId": "123456789",
      "isActive": true,
      "createdAt": "2024-12-01T10:00:00.000Z"
    }
  }
}
```

**Validation Rules:**
- `name`: required, max 100 chars
- `email`: valid email, unique
- `password`: min 8 chars, must contain uppercase + lowercase + digit
- `storeName`: required
- `telegramChatId`: optional

---

### `POST /api/v1/auth/login`
Authenticate and receive JWT token.

**No auth required.**

**Body:**
```json
{
  "email": "ahmed@mystore.com",
  "password": "SecurePass123"
}
```

**Response `200`:**
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR...",
  "data": {
    "merchant": { "..." }
  }
}
```

**Error `401`:**
```json
{
  "status": "fail",
  "message": "Invalid email or password."
}
```

---

### `GET /api/v1/auth/me`
Get current authenticated merchant profile.

**🔒 Requires Auth**

**Headers:**
```
Authorization: Bearer <token>
```

**Response `200`:**
```json
{
  "status": "success",
  "data": {
    "merchant": {
      "_id": "64abc...",
      "name": "Ahmed Hassan",
      "email": "ahmed@mystore.com",
      "storeName": "Hassan Electronics",
      "telegramChatId": "123456789"
    }
  }
}
```

---

### `PATCH /api/v1/auth/update-telegram`
Update Telegram Chat ID for bot notifications.

**🔒 Requires Auth**

**Body:**
```json
{
  "telegramChatId": "987654321"
}
```

**Response `200`:**
```json
{
  "status": "success",
  "message": "Telegram Chat ID updated successfully.",
  "data": { "merchant": { "..." } }
}
```

---

### `PATCH /api/v1/auth/change-password`
Change the current merchant's password.

**🔒 Requires Auth**

**Body:**
```json
{
  "currentPassword": "SecurePass123",
  "newPassword": "NewSecurePass456"
}
```

**Response `200`:**
```json
{
  "status": "success",
  "token": "new_jwt_token...",
  "data": { "merchant": { "..." } }
}
```

---

## 📦 Products

### `POST /api/v1/products`
Create a new product for the authenticated merchant's store.

**🔒 Requires Auth**

**Body:**
```json
{
  "name": "iPhone 15 Pro",
  "price": 45000,
  "stockCount": 25,
  "description": "Latest Apple flagship with titanium build",
  "sku": "APPL-IP15P-128"
}
```

**Response `201`:**
```json
{
  "status": "success",
  "data": {
    "product": {
      "_id": "64def...",
      "merchantId": "64abc...",
      "name": "iPhone 15 Pro",
      "price": 45000,
      "stockCount": 25,
      "sku": "APPL-IP15P-128",
      "isActive": true,
      "inStock": true,
      "createdAt": "2024-12-01T10:00:00.000Z"
    }
  }
}
```

---

### `GET /api/v1/products`
Get all products with pagination and filters.

**🔒 Requires Auth**

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20, max: 100) |
| `inStock` | boolean | Filter to in-stock only (`true`) |
| `isActive` | boolean | Filter by active status |

**Example:** `GET /api/v1/products?page=1&limit=10&inStock=true`

**Response `200`:**
```json
{
  "status": "success",
  "data": [
    { "product": "..." }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

### `GET /api/v1/products/:id`
Get a single product by ID.

**🔒 Requires Auth**

**URL:** `GET /api/v1/products/64def...`

**Response `200`:**
```json
{
  "status": "success",
  "data": {
    "product": {
      "_id": "64def...",
      "name": "iPhone 15 Pro",
      "price": 45000,
      "stockCount": 25,
      "inStock": true
    }
  }
}
```

**Error `404`:**
```json
{ "status": "fail", "message": "Product not found." }
```

---

### `PATCH /api/v1/products/:id`
Update product details.

**🔒 Requires Auth**

**Body (all fields optional):**
```json
{
  "name": "iPhone 15 Pro Max",
  "price": 52000,
  "stockCount": 30,
  "isActive": true,
  "description": "Updated description"
}
```

**Response `200`:**
```json
{
  "status": "success",
  "data": { "product": { "..." } }
}
```

---

### `DELETE /api/v1/products/:id`
Soft-delete a product (sets `isActive = false`).

**🔒 Requires Auth**

**Response `200`:**
```json
{
  "status": "success",
  "message": "Product deactivated successfully."
}
```

---

### `PATCH /api/v1/products/:id/stock`
Manually adjust stock count (add or subtract units).

**🔒 Requires Auth**

**Body:**
```json
{
  "adjustment": 10
}
```
> Use negative values to remove stock: `{ "adjustment": -5 }`

**Response `200`:**
```json
{
  "status": "success",
  "message": "Stock adjusted by +10.",
  "data": {
    "product": {
      "stockCount": 35
    }
  }
}
```

**Error `400` (insufficient stock):**
```json
{
  "status": "fail",
  "message": "Cannot reduce stock below 0. Current stock: 5, Adjustment: -10."
}
```

---

## 🛍️ Orders

### `POST /api/v1/orders`
Create a new order. Automatically runs fraud analysis before saving.

**🔒 Requires Auth**

> ⚠️ **Fraud Engine** runs automatically:  
> The `fraudAnalyzer` middleware intercepts the request, calculates the fraud score, and attaches it to the order. If risk is `High`, status is auto-set to `Flagged`.

**Body:**
```json
{
  "customerPhone": "01012345678",
  "customerName": "Mohamed Ali",
  "customerAddress": "123 Tahrir St, Cairo",
  "items": [
    {
      "productId": "64def...",
      "quantity": 2
    },
    {
      "productId": "64ghi...",
      "quantity": 1
    }
  ],
  "notes": "Handle with care"
}
```

**Response `201` (Normal):**
```json
{
  "status": "success",
  "message": "Order created successfully.",
  "data": {
    "order": {
      "_id": "64jkl...",
      "orderNumber": "AEE-M3X5A2-K9PQ",
      "merchantId": "64abc...",
      "customerPhone": "01012345678",
      "customerName": "Mohamed Ali",
      "customerIp": "102.190.5.10",
      "items": [
        {
          "productId": "64def...",
          "name": "iPhone 15 Pro",
          "quantity": 2,
          "unitPrice": 45000,
          "subtotal": 90000
        }
      ],
      "totalAmount": 93500,
      "status": "Pending",
      "fraudAnalysis": {
        "score": 90,
        "riskLevel": "Low",
        "reason": "New customer — no history on file.",
        "rtoRate": 0,
        "isNewCustomer": true,
        "ipMismatch": false
      },
      "statusHistory": [
        { "status": "Pending", "changedAt": "...", "changedBy": "system" }
      ],
      "createdAt": "2024-12-01T10:00:00.000Z"
    }
  }
}
```

**Response `201` (High Risk — Auto-Flagged):**
```json
{
  "status": "success",
  "message": "Order created and flagged for review due to high fraud risk.",
  "data": {
    "order": {
      "status": "Flagged",
      "fraudAnalysis": {
        "score": 28,
        "riskLevel": "High",
        "reason": "RTO Rate: 45.0% (penalty: -27.0 pts) | HIGH RTO RATE — exceeds 30% threshold. | New/unknown IP detected: 102.190.5.10 (penalty: -10 pts)",
        "rtoRate": 0.45
      }
    }
  }
}
```

---

### `GET /api/v1/orders`
List all orders with pagination and filters.

**🔒 Requires Auth**

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 20) |
| `status` | string | Filter by status: `Pending`, `Flagged`, `Confirmed`, `Shipped`, `Delivered`, `RTO`, `Cancelled` |
| `phone` | string | Filter by customer phone |
| `riskLevel` | string | Filter by risk: `Low`, `Medium`, `High` |

**Examples:**
```
GET /api/v1/orders?status=Flagged
GET /api/v1/orders?riskLevel=High&page=1&limit=5
GET /api/v1/orders?phone=01012345678
```

**Response `200`:**
```json
{
  "status": "success",
  "data": [ { "order": "..." } ],
  "pagination": {
    "total": 120,
    "page": 1,
    "limit": 20,
    "totalPages": 6
  }
}
```

---

### `GET /api/v1/orders/:id`
Get a single order by MongoDB ID.

**🔒 Requires Auth**

**Response `200`:**
```json
{
  "status": "success",
  "data": {
    "order": {
      "_id": "64jkl...",
      "orderNumber": "AEE-M3X5A2-K9PQ",
      "status": "Pending",
      "totalAmount": 93500,
      "fraudAnalysis": { "..." },
      "statusHistory": [ "..." ]
    }
  }
}
```

---

### `PATCH /api/v1/orders/:id/status`
Manually update order status. Triggers inventory sync for critical transitions.

**🔒 Requires Auth**

> ⚠️ **Inventory Sync triggers:**
> - `Pending/Flagged → Confirmed`: Decrements stock for all items
> - `Confirmed → Cancelled`: Restores stock
> - `Shipped → RTO`: Restores stock + updates customer fraud profile + lowers fraud score permanently

**Body:**
```json
{
  "status": "Confirmed",
  "notes": "Payment verified by phone"
}
```

**Valid Status Values:** `Pending` | `Flagged` | `Confirmed` | `Shipped` | `Delivered` | `RTO` | `Cancelled`

**Response `200`:**
```json
{
  "status": "success",
  "message": "Order status updated to \"Confirmed\".",
  "data": {
    "order": {
      "status": "Confirmed",
      "statusHistory": [
        { "status": "Pending", "changedBy": "system" },
        { "status": "Confirmed", "changedBy": "system" }
      ]
    }
  }
}
```

**Error `422` (Invalid transition):**
```json
{
  "status": "fail",
  "message": "Cannot transition order from \"Delivered\" to \"Cancelled\". Allowed transitions: [none]."
}
```

---

### `GET /api/v1/orders/customer/:phone`
Get the fraud profile + order history for a customer phone (OSINT view).

**🔒 Requires Auth**

**URL:** `GET /api/v1/orders/customer/01012345678`

**Response `200`:**
```json
{
  "status": "success",
  "data": {
    "customerHistory": {
      "_id": "64mno...",
      "phoneNumber": "01012345678",
      "totalOrders": 10,
      "rtoOrders": 3,
      "fraudScore": 55,
      "riskLevel": "Medium",
      "rtoRate": 0.3,
      "knownIps": ["102.190.5.10", "41.65.20.100"],
      "isBlacklisted": false,
      "lastOrderDate": "2024-12-01T10:00:00.000Z"
    },
    "recentOrders": [
      {
        "orderNumber": "AEE-M3X5A2-K9PQ",
        "status": "Delivered",
        "totalAmount": 93500,
        "fraudAnalysis": { "riskLevel": "Medium", "score": 55 },
        "createdAt": "2024-11-28T09:00:00.000Z"
      }
    ]
  }
}
```

---

### `GET /api/v1/orders/stats/summary`
Get aggregated order and fraud statistics for the merchant dashboard.

**🔒 Requires Auth**

**Response `200`:**
```json
{
  "status": "success",
  "data": {
    "orderStats": [
      { "_id": "Pending", "count": 5, "totalRevenue": 25000 },
      { "_id": "Confirmed", "count": 42, "totalRevenue": 210000 },
      { "_id": "Delivered", "count": 100, "totalRevenue": 500000 },
      { "_id": "RTO", "count": 8, "totalRevenue": 0 },
      { "_id": "Cancelled", "count": 3, "totalRevenue": 0 }
    ],
    "fraudStats": [
      { "_id": "Low", "count": 120 },
      { "_id": "Medium", "count": 30 },
      { "_id": "High", "count": 8 }
    ]
  }
}
```

---
وقفت هنا ++++++++++++++++++++++++++++++++++++
## 🤖 Telegram Webhook

### `POST /api/v1/webhooks/telegram`
Receive Telegram Bot updates (callback_query events from inline keyboard buttons).

**No Bearer auth. Uses `X-Telegram-Bot-Api-Secret-Token` header.**

> This endpoint is called by Telegram's servers — not directly by the merchant.  
> You must register it with Telegram via the `setWebhook` API:

```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/api/v1/webhooks/telegram",
    "secret_token": "your_webhook_secret"
  }'
```

**Supported Callback Actions (via inline keyboard buttons):**
| `callback_data` | Trigger | Effect |
|----------------|---------|--------|
| `confirm_order:<orderId>` | ✅ Confirm Order | Status → Confirmed, decrements stock |
| `cancel_order:<orderId>` | ❌ Cancel Order | Status → Cancelled, restores stock if was Confirmed |
| `ship_order:<orderId>` | 🚢 Mark as Shipped | Status → Shipped |

**Telegram sends payload like:**
```json
{
  "callback_query": {
    "id": "abc123",
    "from": { "username": "merchant_bot_user" },
    "message": {
      "chat": { "id": 123456789 },
      "message_id": 42
    },
    "data": "confirm_order:64jkl..."
  }
}
```

**Response `200` (always — to prevent Telegram retries):**
```json
{ "ok": true }
```

---

## 🛠️ Postman Environment Setup

Create a Postman Environment with these variables:

| Variable | Initial Value | Description |
|----------|--------------|-------------|
| `base_url` | `http://localhost:5000` | Server base URL |
| `token` | *(empty)* | Set automatically after login |
| `merchant_id` | *(empty)* | Set after register/login |
| `product_id` | *(empty)* | Set after creating a product |
| `order_id` | *(empty)* | Set after creating an order |

**Auto-set token after login — add this to Login request's Tests tab:**
```javascript
const json = pm.response.json();
if (json.token) {
  pm.environment.set("token", json.token);
  pm.environment.set("merchant_id", json.data.merchant._id);
}
```

**Auto-set product_id — add to Create Product Tests tab:**
```javascript
const json = pm.response.json();
pm.environment.set("product_id", json.data.product._id);
```

**Auto-set order_id — add to Create Order Tests tab:**
```javascript
const json = pm.response.json();
pm.environment.set("order_id", json.data.order._id);
```

**Authorization header for all protected routes:**
```
Authorization: Bearer {{token}}
```

---

## 🧮 Fraud Score Formula

```
FraudScore = 100 - (RTO_Rate × 60) - IP_Penalty
```

| Factor | Penalty | Trigger |
|--------|---------|---------|
| RTO Rate | `Rate × 60` pts | Any RTO history |
| High RTO Flag | Included in above | RTO Rate > 30% |
| New/Unknown IP | `-10` pts | IP not in `knownIps` |
| Blacklisted | Score = `0` | `isBlacklisted = true` |

**Risk Levels:**
| Score Range | Risk Level | Default Order Status |
|-------------|------------|---------------------|
| 80 – 100 | 🟢 Low | Pending |
| 50 – 79 | 🟡 Medium | Pending |
| 0 – 49 | 🔴 High | **Flagged** |

**Auto-blacklist:** Customer is auto-blacklisted when `fraudScore` drops below 20 after an RTO event.

---

## 🔄 Order State Machine

```
                    ┌─────────┐
                    │ Pending │──────────────────────────────┐
                    └────┬────┘                              │
                         │ (auto if High Risk)               │
                    ┌────▼────┐                              │
                    │ Flagged │──────────────────────────────┤
                    └────┬────┘                              │
                         │ Confirm (+ decrement stock)       │ Cancel
                    ┌────▼─────┐                             │
                    │Confirmed │─────────────────────────────┤
                    └────┬─────┘   Cancel (+ restore stock) │
                         │ Ship                              │
                    ┌────▼────┐                         ┌────▼─────┐
                    │ Shipped │                         │Cancelled │
                    └────┬────┘                         └──────────┘
                         │
              ┌──────────┴──────────┐
              │                     │
         ┌────▼──────┐         ┌────▼───┐
         │ Delivered │         │  RTO   │
         └───────────┘         └────────┘
                              (+ restore stock
                               + update fraud profile)
```

**Terminal States** (no further transitions): `Delivered`, `RTO`, `Cancelled`

---

## ⚠️ Error Response Format

All errors follow this consistent structure:

```json
{
  "status": "fail",
  "message": "Human-readable error description."
}
```

| HTTP Code | Meaning |
|-----------|---------|
| `400` | Bad Request / Validation Error |
| `401` | Unauthorized (missing/invalid/expired token) |
| `403` | Forbidden |
| `404` | Resource not found |
| `409` | Conflict (duplicate, insufficient stock) |
| `422` | Unprocessable Entity (invalid state transition) |
| `429` | Too Many Requests (rate limited) |
| `500` | Internal Server Error |

---

*Platform: **A.E.E — Advanced E-commerce Engine** | Version 1.0.0*
