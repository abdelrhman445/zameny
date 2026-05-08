'use strict';

const admin = require('firebase-admin');
const logger = require('./logger'); // استدعاء اللوجر اللي صلحناه

try {
  let serviceAccount;

  // التحقق هل إحنا في بيئة الإنتاج (Render) أم الجهاز الشخصي
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    // قراءة البيانات من متغيرات البيئة في Render
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } else {
    // قراءة البيانات من الملف المحلي (فقط في جهازك للـ Development)
    serviceAccount = require('../../firebaseServiceAccount.json');
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    logger.info('[Firebase] Firebase Admin Initialized successfully');
  }
} catch (error) {
  logger.error('[Firebase] Error initializing Firebase Admin: ' + error.message);
}

module.exports = admin;
