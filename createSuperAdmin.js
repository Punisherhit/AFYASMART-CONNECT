require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

const createSuperAdmin = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  
  const superAdminExists = await User.findOne({ role: 'super-admin' });
  if (superAdminExists) {
    console.log('Super admin already exists');
    process.exit();
  }

  const superAdmin = await User.create({
    name: 'Super Admin',
    email: 'superadmin@afyasmart.com',
    password: await bcrypt.hash('Admin@1234', 10),
    role: 'super-admin'
  });

  console.log('Super admin created:', superAdmin);
  process.exit();
};

createSuperAdmin();