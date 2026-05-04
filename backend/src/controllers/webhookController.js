const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const logger = require('../config/logger');

exports.handleStripe = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // التأكد إن الإشارة جاية من سترايب بجد (Raw Body)
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error(`⚠️ Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // معالجة الحدث: نجاح عملية الدفع
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.client_reference_id;

    try {
      // 1. تحديث حالة الأوردر في الداتابيز
      const updatedOrder = await Order.findByIdAndUpdate(
        orderId,
        { status: 'Confirmed', paymentStatus: 'Paid', paidAt: new Date() },
        { new: true }
      );

      if (updatedOrder) {
        // 2. سحب الـ socketio اللي إحنا حقناه في الـ app.js
        const io = req.app.get('socketio');

        // 3. إرسال الإشارة للفرونت إند لحظياً (Real-time)
        io.to(orderId).emit('orderUpdated', updatedOrder);

        logger.info(`⚡ Order ${updatedOrder.orderNumber} Confirmed via Webhook`);
      }
    } catch (error) {
      logger.error(`❌ DB Update Error during Webhook: ${error.message}`);
    }
  }

  res.status(200).json({ received: true });
};