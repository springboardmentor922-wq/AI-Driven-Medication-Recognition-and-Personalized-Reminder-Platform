const nodemailer = require('nodemailer');

let transporter;
function getTransporter() {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) return null;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });
  return transporter;
}

async function sendMissedDoseEmail(user, medicine, scheduledAt) {
  const mailer = getTransporter();
  if (!mailer) {
    console.warn('[email] SMTP is not configured; missed-dose email skipped.');
    return false;
  }
  if (!user?.email) return false;
  const when = new Date(scheduledAt).toLocaleString('en-IN', {
    dateStyle: 'medium', timeStyle: 'short', timeZone: process.env.APP_TIMEZONE || 'Asia/Kolkata'
  });
  await mailer.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: user.email,
    subject: `PillSync: Missed dose — ${medicine.name}`,
    text: `Hello ${user.name || 'there'},\n\nPillSync recorded a missed dose.\nMedicine: ${medicine.name}\nStrength: ${medicine.dosage || 'Not specified'}\nScheduled time: ${when}\n\nPlease check your medication plan and follow the instructions provided by your healthcare professional. This is an automated reminder, not medical advice.\n\nPillSync`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#18233b"><h2>PillSync missed-dose alert</h2><p>Hello ${escapeHtml(user.name || 'there')},</p><p>A scheduled dose has been marked as <b>Missed</b>.</p><p><b>Medicine:</b> ${escapeHtml(medicine.name)}<br><b>Strength:</b> ${escapeHtml(medicine.dosage || 'Not specified')}<br><b>Scheduled:</b> ${escapeHtml(when)}</p><p>Please check your medication plan and follow your healthcare professional's instructions.</p><small>This is an automated reminder, not medical advice.</small></div>`
  });
  return true;
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

async function sendRefillEmail(user, medicine, daysRemaining) {
  const mailer = getTransporter();
  if (!mailer || !user?.email) return false;
  const days = Math.max(0, Math.ceil(daysRemaining));
  await mailer.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: user.email,
    subject: `PillSync: Refill reminder — ${medicine.name}`,
    text: `Hello ${user.name || 'there'},\n\nYour recorded stock of ${medicine.name} is estimated to last about ${days} day(s). Please verify your actual stock and arrange a refill if needed. This is an estimate, not medical advice.\n\nPillSync`
  });
  return true;
}
module.exports = { getTransporter, sendMissedDoseEmail, sendRefillEmail };
