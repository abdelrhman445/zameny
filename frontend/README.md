# 🚀 A.E.E — Advanced E-commerce Engine (Frontend)

منصة تجارة إلكترونية SaaS متعددة المستأجرين مع محرك كشف احتيال ذكي.

## Tech Stack

- **Next.js 14+** (App Router)
- **TypeScript** (strict mode)
- **Tailwind CSS** + **Shadcn UI**
- **Zustand** (State Management)
- **Axios** (API calls with interceptors)
- **Recharts** (Dashboard charts)
- **Sonner** (Toast notifications)

## Project Structure

```
aee-frontend/
├── app/
│   ├── (marketing)/         # Landing page, Login, Register
│   ├── (dashboard)/         # Merchant dashboard (protected)
│   │   ├── overview/        # KPI stats + charts
│   │   ├── orders/          # Orders table + Fraud Engine
│   │   ├── products/        # Product CRUD + stock management
│   │   ├── customers/       # Customer fraud profiles
│   │   └── settings/        # Profile + Telegram integration
│   ├── [storeSlug]/         # Dynamic customer storefront
│   │   ├── page.tsx         # Product listing
│   │   ├── product/[id]/    # Product detail page
│   │   ├── checkout/        # One-page checkout + OTP flow
│   │   └── success/[id]/    # Order tracking page
│   └── home/                # Marketing landing page
├── components/
│   ├── ui/                  # Shadcn UI components
│   ├── dashboard/           # Dashboard-specific components
│   │   ├── Sidebar.tsx      # Collapsible navigation
│   │   ├── FraudBadge.tsx   # Risk level indicator
│   │   ├── OrderDrawer.tsx  # Order detail panel
│   │   └── StatsCard.tsx    # KPI metric card
│   ├── storefront/          # Storefront components
│   │   ├── ProductCard.tsx  # Product listing card
│   │   └── CartSheet.tsx    # Slide-over shopping cart
│   └── shared/              # Loading, Error components
├── lib/
│   ├── api.ts               # Axios instance + interceptors
│   ├── utils.ts             # Utility functions
│   └── auth.ts              # Auth helpers
├── store/
│   ├── useAuthStore.ts      # Merchant auth state (Zustand)
│   ├── useCartStore.ts      # Shopping cart state (Zustand)
│   └── useMerchantStore.ts  # UI state (sidebar, notifications)
├── types/
│   └── index.ts             # All TypeScript types
└── middleware.ts             # Route protection
```

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit NEXT_PUBLIC_API_URL to point to your backend

# 3. Start development server
npm run dev

# 4. Open in browser
# Dashboard: http://localhost:3000/login
# Storefront: http://localhost:3000/{storeSlug}
```

## Key Features

### 🛡️ Fraud Engine Display
Orders page shows a color-coded `FraudBadge` for each order:
- 🟢 **Low** (score 80-100): Green shield — safe to ship
- 🟡 **Medium** (score 50-79): Yellow warning — review recommended
- 🔴 **High** (score < 50): Red alert — auto-flagged, requires action

### 🔐 OTP Checkout Flow
When customer selects "Cash on Delivery":
1. Customer fills out checkout form
2. Clicks submit → OTP screen appears
3. 6-digit OTP sent to phone (demo: use `123456`)
4. Only after OTP verified → `POST /api/v1/orders` is called

### 🏪 Multi-Tenant Storefronts
Each merchant gets a unique URL: `/{storeSlug}`
- Dynamic product listing
- Shopping cart (Zustand, persisted)
- Full checkout with fraud detection

### 🔒 Route Protection
`middleware.ts` protects all dashboard routes.
Unauthenticated users are redirected to `/login`.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:5000/api/v1` |
| `NEXT_PUBLIC_APP_URL` | Frontend URL | `http://localhost:3000` |

## API Integration

All API calls use the configured Axios instance from `lib/api.ts`:
- Auto-attaches `Bearer <token>` from cookies
- Handles `401` globally → auto-logout + redirect to `/login`
- Token stored in both cookies (for middleware) and localStorage

## Production Build

```bash
npm run build
npm start
```
