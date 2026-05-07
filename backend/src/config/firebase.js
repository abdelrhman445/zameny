const admin = require('firebase-admin');

let serviceAccount;

/**
 * المنطق ده بيحل مشكلة الـ Deployment على Render
 * في الـ Production: بنسحب البيانات من الـ Environment Variables للأمان
 * في الـ Development: بنسحبها من ملف الـ JSON المحلي
 */
if (process.env.NODE_ENV === 'production') {
  serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // السطر ده مهم جداً عشان يعالج تنسيق الـ Private Key في السيرفرات السحابية
    privateKey: process.env.FIREBASE_PRIVATE_KEY 
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
      : undefined,
  };
} else {
  try {
    // استدعاء ملف المفاتيح المحلي (موجود في الـ .gitignore ومش هيترفع)
    serviceAccount = require('../../firebaseServiceAccount.json');
  } catch (error) {
    console.warn("⚠️ Firebase Service Account file not found locally. Ignore this if you are in production.");
  }
}

// التأكد من عدم تكرار عمل Initialize لـ Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

module.exports = admin;
