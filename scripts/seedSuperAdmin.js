require('dotenv').config();
const mongoose = require('mongoose');
const SuperAdmin = require('../models/SuperAdmin');
const connectDB = require('../config/database');

async function seed() {
  await connectDB();
  const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@schoolsaas.com';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!';
  const name = process.env.SUPER_ADMIN_NAME || 'Super Admin';

  const existing = await SuperAdmin.findOne({ email });
  if (existing) {
    console.log('Super Admin already exists:', email);
    process.exit(0);
    return;
  }

  await SuperAdmin.create({ name, email, password });
  console.log('Super Admin created:', email);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
