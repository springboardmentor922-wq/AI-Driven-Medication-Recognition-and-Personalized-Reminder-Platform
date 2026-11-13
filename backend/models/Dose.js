const m = require('mongoose');

const DoseSchema = new m.Schema({
  user: { type: m.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  medicine: { type: m.Schema.Types.ObjectId, ref: 'Medicine', required: true, index: true },
  medicineName: String,
  scheduledAt: { type: Date, default: Date.now, required: true, index: true },
  status: { type: String, enum: ['taken', 'missed', 'snoozed'], required: true },
  note: String,
  missedEmailSentAt: { type: Date, default: null },
  stockAdjusted: { type: Boolean, default: false }
}, { timestamps: true });

DoseSchema.index({ user:  1, medicine: 1, scheduledAt: 1 }, { unique: true });
module.exports = m.model('Dose', DoseSchema);
