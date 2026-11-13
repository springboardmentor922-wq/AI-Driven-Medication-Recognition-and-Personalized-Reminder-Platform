const r = require('express').Router();
const D = require('../models/Dose');
const M = require('../models/Medicine');
const auth = require('../middleware/auth');
r.use(auth);

r.get('/', async (req, res, next) => {
  try {
    let owner=req.user._id;if(req.query.patientId){if(req.user.role!=='caregiver'||!(req.user.patientIds||[]).some(id=>String(id)===String(req.query.patientId)))return res.status(403).json({message:'You are not linked to this patient'});owner=req.query.patientId;}res.json(await D.find({ user: owner }).sort({ scheduledAt: -1 }).limit(500));
  } catch (e) { next(e); }
});

r.post('/', async (req, res, next) => {
  try {
    const { medicineId, status, scheduledAt, note } = req.body;
    if (!['taken', 'missed', 'snoozed'].includes(status)) return res.status(400).json({ message: 'Invalid dose status' });
    const medicine = await M.findOne({ _id: medicineId, user: req.user._id, active: true });
    if (!medicine) return res.status(404).json({ message: 'Medicine not found' });
    const slot = scheduledAt ? new Date(scheduledAt) : new Date();
    if (Number.isNaN(slot.getTime())) return res.status(400).json({ message: 'Invalid scheduledAt' });
    let dose = await D.findOne({ user: req.user._id, medicine: medicine._id,
      scheduledAt: { $gte: new Date(slot.getTime() - 60000), $lte: new Date(slot.getTime() + 60000) } });
    const previousStatus = dose?.status;
    if (!dose) dose = new D({ user: req.user._id, medicine: medicine._id, medicineName: medicine.name, scheduledAt: slot, status });
    dose.status = status;
    if (note !== undefined) dose.note = note;
    // Stock is decremented only while a dose is marked taken; changing it back restores stock.
    if (previousStatus !== 'taken' && status === 'taken' && !dose.stockAdjusted) {
      medicine.stock = Math.max(0, Number(medicine.stock || 0) - Number(medicine.quantityPerDose || 1));
      dose.stockAdjusted = true;
      medicine.refillAlertSentAt = null;
      await medicine.save();
    } else if (previousStatus === 'taken' && status !== 'taken' && dose.stockAdjusted) {
      medicine.stock = Number(medicine.stock || 0) + Number(medicine.quantityPerDose || 1);
      dose.stockAdjusted = false;
      medicine.refillAlertSentAt = null;
      await medicine.save();
    }
    await dose.save();
    res.status(previousStatus ? 200 : 201).json(dose);
  } catch (e) { next(e); }
});
module.exports = r;
