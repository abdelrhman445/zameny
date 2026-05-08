'use strict';

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, errors } = format;

// تحديد البيئة الحالية
const isProduction = process.env.NODE_ENV === 'production';

// تنسيق اللوجز
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// إعداد الناقلات (Transports)
const activeTransports = [
  // الكونسول شغال في كل الحالات (جهازك + ريندر)
  new transports.Console({
    format: combine(
      isProduction ? format.uncolorize() : colorize(),
      logFormat
    )
  })
];

// لو إحنا مش على ريندر (على جهازك الشخصي)، ضيف ملفات اللوجز عادي
if (!isProduction) {
  activeTransports.push(
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' })
  );
}

const logger = createLogger({
  level: isProduction ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports: activeTransports,
  // معالجة الأخطاء غير المتوقعة
  exceptionHandlers: isProduction 
    ? [new transports.Console()] 
    : [new transports.File({ filename: 'logs/exceptions.log' })],
  rejectionHandlers: isProduction 
    ? [new transports.Console()] 
    : [new transports.File({ filename: 'logs/rejections.log' })],
});

module.exports = logger;
