'use strict';

const express    = require('express');
const helmet      = require('helmet');
const cors        = require('cors');
const rateLimit  = require('express-rate-limit');
const morgan      = require('morgan');

const logger       = require('./src/config/logger');
const errorHandler = require('./src/middlewares/errorHandler');
const AppError     = require('./src/utils/appError');

// ── Route Imports ────────────────────────────────────────────────────────────
const v1Router      = require('./src/routes/v1');
const webhookRouter = require('./src/routes/v1/webhook.routes');
// ✅ استدعاء राوت الـ OTP بالمسار الصحيح
const otpRoutes     = require('./src/routes/v1/otp.routes'); 

const app = express();

// ── Trust Proxy (لضمان دقة محرك كشف الاحتيال خلف الـ Proxy) ───────────────
app.set('trust proxy', 1); 

// ── Security Headers ──────────────────────────────────────────────────────
app.use(helmet());

// ── CORS Configuration ──────────────────────────────────────────────────
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.APP_BASE_URL]
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods:         ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Firebase-IdToken'], 
  credentials:      true,
};

app.use(cors(corsOptions));

// ── Global Rate Limiters ───────────────────────────────────────────────────
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      1000, 
  standardHeaders: true,
  legacyHeaders:   false,
  message: { status: 'error', message: 'Too many requests from this IP.' },
}));

// رفع حد الطلبات للأوردرات لمنع إيرور 429 أثناء الـ Polling
app.use('/api/v1/orders', rateLimit({
  windowMs: 5 * 60 * 1000,
  max:      500, 
  message:  { status: 'error', message: 'Order tracking limit reached. Please wait a moment.' },
}));

// ── HTTP Request Logger ───────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
}

// ─────────────────────────────────────────────────────────────────────────────
// ✅ ترتيب الـ Parsers: ضروري جداً لعمل توثيق Signature الخاص بـ Stripe
// ─────────────────────────────────────────────────────────────────────────────

// 1. Stripe Webhook (RAW BODY) - يجب أن يكون أول بارسير
app.use('/api/v1/webhooks/stripe', express.raw({ type: '*/*' }));

// 2. باقي الويب هوكس (Telegram & Paymob)
app.use('/api/v1/webhooks/telegram', express.json());
app.use('/api/v1/webhooks/paymob', express.urlencoded({ extended: true }));

// 3. البارسير العالمي لباقي راوتس الأبلكيشن
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─────────────────────────────────────────────────────────────────────────────
// ✅ المسارات (Routes)
// ─────────────────────────────────────────────────────────────────────────────

// 1. المسار الترحيبي
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to Zameny Backend API 🚀',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// 2. Health Check للمراقبة
app.get('/health', (req, res) => {
  res.status(200).json({
    status:    'OK',
    platform:  'Zameny - Store',
    version:   '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// 3. الـ API Routes
app.use('/api/v1/webhooks', webhookRouter);
// ✅ راوت الـ OTP أُضيف هنا "بعد" الـ express.json() عشان يعرف يقرأ الإيميل
app.use('/api/v1/otp', otpRoutes); 
app.use('/api/v1', v1Router);

// ── 404 Handler ───────────────────────────────────────────────────────────
app.all('*', (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found on this server.`, 404));
});

// ── Global Error Handler ──────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;