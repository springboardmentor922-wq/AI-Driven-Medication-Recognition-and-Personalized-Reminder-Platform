const r = require('express').Router();
const auth = require('../middleware/auth');
const { getTransporter } = require('../services/email');
r.use(auth);

r.post('/test-email', async (req, res, next) => {
  try {
    const mailer = getTransporter();
    if (!mailer) return res.status(503).json({ message: 'Email is not configured. Add SMTP settings to server/.env and restart the API.' });
    await mailer.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: req.user.email,
      subject: 'PillSync email test',
      text: `Hello ${req.user.name || ''}, this is a test email from PillSync. Missed-dose alerts will be sent to this address.`
    });
    res.json({ message: `Test email sent to ${req.user.email}` });
  } catch (error) { next(error); }
});

module.exports = r;
