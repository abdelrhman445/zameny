'use strict';

const admin = require('firebase-admin');
const logger = require('./logger');

try {
  let serviceAccount;

  // التحقق هل إحنا في بيئة الإنتاج (Render) وعندنا المفاتيح في الـ .env
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_PROJECT_ID) {
    serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // السطر اللي جاي ده سحري: بيصلح مشكلة الـ \n عشان المفتاح يتقبل
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  } else {
    // في حالة الـ Development لو الملف موجود محلياً
    try {
      serviceAccount = require('../../firebaseServiceAccount.json');
    } catch (err) {
      logger.warn('[Firebase] Warning: Service account file not found, falling back to env vars');
    }
  }

  if (serviceAccount && !admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    logger.info('[Firebase] Firebase Admin Initialized successfully');
  } else if (!serviceAccount) {
    throw new Error('No Firebase credentials provided (env or file)');
  }
} catch (error) {
  logger.error('[Firebase] Error initializing Firebase Admin: ' + error.message);
}

module.exports = admin;
