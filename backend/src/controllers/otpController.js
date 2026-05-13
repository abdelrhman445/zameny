const Otp = require('../models/Otp');
const { Resend } = require('resend');

// تهيئة Resend باستخدام الـ API Key اللي عندك في .env
const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendOtpEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'البريد الإلكتروني مطلوب' });
    }

    // توليد كود عشوائي من 6 أرقام
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // حفظ الكود في الداتا بيز لمدة 10 دقائق
    await Otp.findOneAndUpdate(
      { email },
      { otp: otpCode, createdAt: Date.now() },
      { upsert: true, new: true }
    );

    // ── إرسال الإيميل باستخدام Resend ──
    const { data, error } = await resend.emails.send({
      // ملاحظة مهمة: Resend بيحتاج دومين موثق للإرسال، لو لسه موثقتش دومين، استخدم الافتراضي بتاعهم للتجربة
      from: 'Zameny Store <otp@zameny.tech>',
      to: [email],
      subject: 'تأكيد طلبك من Zameny ',
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: auto; padding: 30px; background-color: #f8fafc; border-radius: 15px; text-align: center; direction: rtl;">
          <h2 style="color: #0f172a; margin-bottom: 10px;">مرحباً بك في Zameny</h2>
          <p style="color: #64748b; font-size: 16px;">يرجى استخدام رمز التحقق التالي لإتمام طلبك بنجاح:</p>
          
          <div style="background-color: #ffffff; border: 2px dashed #cbd5e1; padding: 20px; margin: 30px auto; width: fit-content; border-radius: 12px;">
            <span style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #4f46e5; display: inline-block;">
              ${otpCode}
            </span>
          </div>
          
          <p style="color: #94a3b8; font-size: 13px;">هذا الرمز صالح لمدة 10 دقائق فقط. إذا لم تطلب هذا الرمز، يرجى تجاهل هذه الرسالة.</p>
        </div>
      `
    });

    if (error) {
      console.error('❌ خطأ في إرسال إيميل Resend:', error);
      return res.status(500).json({ success: false, message: 'تعذر إرسال الإيميل. يرجى التأكد من البريد الإلكتروني.' });
    }

    res.status(200).json({ success: true, message: 'تم إرسال رمز التحقق إلى بريدك الإلكتروني بنجاح' });
  } catch (error) {
    console.error('❌ خطأ غير متوقع:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء إرسال البريد الإلكتروني.' });
  }
};

exports.verifyOtpEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = await Otp.findOne({ email });

    if (!record || record.otp !== otp) {
      return res.status(400).json({ success: false, message: 'الرمز غير صحيح أو منتهي الصلاحية' });
    }

    await Otp.deleteOne({ email });
    res.status(200).json({ success: true, message: 'تم التحقق بنجاح' });
  } catch (error) {
    console.error('❌ خطأ في التحقق من الكود:', error);
    res.status(500).json({ success: false, message: 'حدث خطأ أثناء التحقق' });
  }
};