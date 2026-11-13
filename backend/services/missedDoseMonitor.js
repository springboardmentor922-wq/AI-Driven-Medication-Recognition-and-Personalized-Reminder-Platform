const Medicine = require('../models/Medicine');
const User = require('../models/User');
const Dose = require('../models/Dose');
const { sendMissedDoseEmail, sendRefillEmail } = require('./email');

const GRACE_MINUTES = Math.max(1, Number(process.env.MISSED_DOSE_GRACE_MINUTES || 10));
let running = false;

function todayAt(time, now) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(time));
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
}

async function checkMissedDoses() {
  if (running) return;
  running = true;
  try {
    const now = new Date();
    const medicines = await Medicine.find({ active: true, schedule: { $exists: true, $ne: [] } }).lean();
    for (const medicine of medicines) {
      const user = await User.findById(medicine.user).select('name email').lean();
      if (!user?.email) continue;
      const dailyUse = Number(medicine.quantityPerDose || 1) * Number(medicine.frequencyPerDay || 1);
      const daysLeft = dailyUse > 0 ? Number(medicine.stock || 0) / dailyUse : Infinity;
      if (daysLeft <= 7 && !medicine.refillAlertSentAt) {
        try {
          const sent = await sendRefillEmail(user, medicine, daysLeft);
          if (sent) {
            await Medicine.updateOne({ _id: medicine._id, refillAlertSentAt: null }, { $set: { refillAlertSentAt: new Date() } });
            console.log(`[refill] Email sent to ${user.email} for ${medicine.name}`);
          }
        } catch (mailError) { console.error(`[refill] Could not email ${user.email}:`, mailError.message); }
      }
      for (const time of (medicine.schedule || [])) {
        const scheduledAt = todayAt(time, now);
        if (!scheduledAt || now.getTime() < scheduledAt.getTime() + GRACE_MINUTES * 60000) continue;
        const alreadyLogged = await Dose.findOne({
          user: medicine.user,
          medicine: medicine._id,
          scheduledAt: { $gte: new Date(scheduledAt.getTime() - 60000), $lte: new Date(scheduledAt.getTime() + 60000) }
        });
        let missed = alreadyLogged;
        if (missed && missed.status !== 'taken' && missed.status !== 'missed') {
          missed.status = 'missed';
          await missed.save();
        }
        if (!missed) {
          try {
            missed = await Dose.create({
              user: medicine.user,
              medicine: medicine._id,
              medicineName: medicine.name,
              scheduledAt,
              status: 'missed'
            });
          } catch (error) {
            // Another monitor instance may have recorded the same dose first.
            if (error.code !== 11000) console.error('[missed-dose] Could not record dose:', error.message);
            continue;
          }
        }
        if (missed.status === 'missed' && !missed.missedEmailSentAt) {
          try {
            const sent = await sendMissedDoseEmail(user, medicine, scheduledAt);
            if (sent) {
              missed.missedEmailSentAt = new Date();
              await missed.save();
              console.log(`[missed-dose] Email sent to ${user.email} for ${medicine.name}`);
            }
          } catch (mailError) {
            console.error(`[missed-dose] Could not email ${user.email}:`, mailError.message);
          }
        }
      }
    }
  } catch (error) {
    console.error('[missed-dose] Monitor failed:', error.message);
  } finally {
    running = false;
  }
}

function startMissedDoseMonitor() {
  console.log(`[missed-dose] Monitor active; grace period ${GRACE_MINUTES} minutes; timezone ${process.env.APP_TIMEZONE || 'server local time'}`);
  checkMissedDoses();
  setInterval(checkMissedDoses, 60 * 1000);
}

module.exports = { startMissedDoseMonitor, checkMissedDoses };
