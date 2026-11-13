const m = require('mongoose');

const MedicineSchema = new m.Schema({
  user: { type: m.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  dosage: { type: String, default: '' },
  activeIngredient: { type: String, default: '' },
  packQuantity: { type: Number, min: 0, default: null },
  quantityPerDose: { type: Number, default: 1, min: 0.01 },
  frequencyPerDay: { type: Number, default: 1, min: 0.01 },
  stock: { type: Number, default: 0, min: 0 },
  category: { type: String, default: 'Other' },
  schedule: { type: [String], default: [] },
  notes: { type: String, default: '' },
  refillAlertSentAt: { type: Date, default: null },
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = m.model('Medicine', MedicineSchema);
