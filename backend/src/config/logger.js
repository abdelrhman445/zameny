'use strict';

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, errors } = format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// 1. إعداد الـ Transports لتكون مرنة (Console يعمل في كل الحالات)
const activeTransports = [
  new transports.Console()
];

const activeExceptionHandlers = [
  new transports.Console()
];

const activeRejectionHandlers = [
  new transports.Console()
];

if (process.env.NODE_ENV !== 'production') {
  activeTransports.push(
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' })
  );
  activeExceptionHandlers.push(
    new transports.File({ filename: 'logs/exceptions.log' })
  );
  activeRejectionHandlers.push(
    new transports.File({ filename: 'logs/rejections.log' })
  );
}

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    process.env.NODE_ENV !== 'production' ? colorize() : format.uncolorize(),
    logFormat
  ),
  transports: activeTransports,
  exceptionHandlers: activeExceptionHandlers,
  rejectionHandlers: activeRejectionHandlers,
});

module.exports = logger;
