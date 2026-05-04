const admin = require('firebase-admin');
// استدعاء ملف المفاتيح اللي لسة عاملينه
const serviceAccount = require('../../firebaseServiceAccount.json'); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;