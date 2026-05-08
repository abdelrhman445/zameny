'use strict';

const express    = require('express');
const helmet     = require('helmet');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const morgan     = require('morgan');

const logger       = require('./src/config/logger');
const errorHandler = require('./src/middlewares/errorHandler');
const AppError     = require('./src/utils/appError');

// ── Route Imports ────────────────────────────────────────────────────────────
const v1Router      = require('./src/routes/v1');
const webhookRouter = require('./src/routes/v1/webhook.routes');

const app = express();

// ── Trust Proxy (accurate IPs for fraud engine) ───────────────────────────
app.set('trust proxy', 1); // تعديل لـ 1 لضمان قراءة الـ IPs خلف الـ Proxy/Tunnel

// ── Security Headers ──────────────────────────────────────────────────────
app.use(helmet());

// ── CORS Configuration ──────────────────────────────────────────────────
// تم السماح بـ localhost:3000 لضمان عمل الـ Socket والـ Polling بدون قيود
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.APP_BASE_URL]
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods:         ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Firebase-IdToken'], 
  credentials:     true,
};

app.use(cors(corsOptions));

// ── Global Rate Limiters ───────────────────────────────────────────────────
// رفع الحد العام لضمان استقرار التيست وتطوير الـ A.E.E
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      1000, 
  standardHeaders: true,
  legacyHeaders:   false,
  message: { status: 'error', message: 'Too many requests from this IP.' },
}));

// ✅ تحسين: رفع حد الطلبات للأوردرات لمنع إيرور 429 تماماً أثناء الـ Polling
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
// ✅ الضربة القاضية: ترتيب الـ Parsers لضمان عمل الـ Stripe Webhook
// يجب تعريف الـ Raw Body قبل تعريف الـ JSON parser العالمي وإلا سيفشل الـ Signature
// ─────────────────────────────────────────────────────────────────────────────

// 1. Stripe Webhook (RAW BODY) - ضروري جداً للـ Signature Verification
app.use('/api/v1/webhooks/stripe', express.raw({ type: '*/*' }));

// 2. باقي الويب هوكس
app.use('/api/v1/webhooks/telegram', express.json()); // تليجرام بيحتاج JSON عادي
app.use('/api/v1/webhooks/paymob', express.urlencoded({ extended: true }));

// 3. البارسير العالمي لباقي راوتس الأبلكيشن
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Health Check ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    status:    'OK',
    platform:  'A.E.E - Advanced E-commerce Engine',
    version:   '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ── API Routes ────────────────────────────────────────────────────────────
// ✅ وضع راوت الويب هوك في المقدمة لضمان استجابة السيرفر الفورية لسترايب
app.use('/api/v1/webhooks', (req, res, next) => {
  if (req.originalUrl.includes('stripe')) {
    console.log("🔍 FULL HEADERS RECEIVED:");
    console.log(JSON.stringify(req.headers, null, 2)); // هيبان كل اللي واصل للسيرفر
  }
  next();
}, webhookRouter);

app.use('/api/v1', v1Router);

// ── 404 Handler ───────────────────────────────────────────────────────────
app.all('*', (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found on this server.`, 404));
});

// ── Global Error Handler ──────────────────────────────────────────────────
app.use(errorHandler);
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to A.E.E Backend API 🚀',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});
module.exports = app;
