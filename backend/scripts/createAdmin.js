require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
(async () => {
  const { MONGO_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!MONGO_URI || !ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) {
    throw new Error('Set MONGO_URI, ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD (12+ chars) in server/.env');
  }
  await mongoose.connect(MONGO_URI);
  const email = ADMIN_EMAIL.toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = 'admin';
    existing.password = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await existing.save();
    console.log(`Admin role/password updated for ${email}`);
  } else {
    await User.create({ name: ADMIN_NAME, email, password: await bcrypt.hash(ADMIN_PASSWORD, 12), role: 'admin' });
    console.log(`Admin account created for ${email}`);
  }
  await mongoose.disconnect();
})().catch(async e => { console.error(e.message); try { await mongoose.disconnect(); } catch {} process.exit(1); });
