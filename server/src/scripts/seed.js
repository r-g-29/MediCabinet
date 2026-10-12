const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Profile = require('../models/Profile');
const Medicine = require('../models/Medicine');
const Schedule = require('../models/Schedule');
const DoseLog = require('../models/DoseLog');
const Notification = require('../models/Notification');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/medicabinet';

async function seed() {
  console.log('Connecting to MongoDB at', MONGO_URI);
  await mongoose.connect(MONGO_URI);

  const demoEmail = 'demo@medicabinet.com';
  const demoPassword = 'Demo@123';

  console.log(`Cleaning up existing data for ${demoEmail}...`);
  const existingUser = await User.findOne({ email: demoEmail });
  if (existingUser) {
    const uid = existingUser._id;
    await Promise.all([
      Profile.deleteMany({ userId: uid }),
      Medicine.deleteMany({ userId: uid }),
      Schedule.deleteMany({ userId: uid }),
      DoseLog.deleteMany({ userId: uid }),
      Notification.deleteMany({ userId: uid }),
      User.deleteOne({ _id: uid }),
    ]);
    console.log('Previous demo user and related documents removed.');
  }

  // 1. Create Demo User
  console.log('Creating demo user...');
  const passwordHash = await bcrypt.hash(demoPassword, 12);
  const demoUser = await User.create({
    name: 'Demo User',
    email: demoEmail,
    passwordHash,
  });
  const userId = demoUser._id;

  // 2. Create 3 Profiles
  console.log('Creating 3 family profiles...');
  const profileSelf = await Profile.create({
    userId,
    name: 'Self',
    relation: 'Self',
    age: 36,
    allergies: ['penicillin'],
  });

  const profileSpouse = await Profile.create({
    userId,
    name: 'Sarah',
    relation: 'Spouse',
    age: 34,
    allergies: ['sulfa'],
  });

  const profileChild = await Profile.create({
    userId,
    name: 'Leo',
    relation: 'Child',
    age: 7,
    allergies: [],
  });

  // 3. Create 8 Medicines
  // Requirements:
  // - 1 expired (price present)
  // - 2 expiring soon (within 30 days)
  // - 1 low stock (quantity <= threshold)
  // - 2 sharing an ingredient (e.g. Paracetamol: Dolo 650 & Crocin Advance)
  // - Remaining medicines to reach total of 8
  console.log('Creating 8 medicines with varied conditions...');
  const now = new Date();

  // Expired 45 days ago
  const dateExpired = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000);
  // Expiring in 10 days
  const dateExpiringSoon1 = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);
  // Expiring in 24 days
  const dateExpiringSoon2 = new Date(now.getTime() + 24 * 24 * 60 * 60 * 1000);
  // Future expiry dates
  const dateFuture1 = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
  const dateFuture2 = new Date(now.getTime() + 300 * 24 * 60 * 60 * 1000);
  const dateFuture3 = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  const dateFuture4 = new Date(now.getTime() + 240 * 24 * 60 * 60 * 1000);
  const dateFuture5 = new Date(now.getTime() + 150 * 24 * 60 * 60 * 1000);

  const medicines = await Medicine.create([
    // 1. Expired medicine (with price for waste calculation)
    {
      userId,
      profileId: profileChild._id,
      name: 'Amoxicillin 250mg Suspension',
      genericName: 'Amoxicillin',
      activeIngredients: ['amoxicillin'],
      uses: 'Bacterial infections',
      expiry: dateExpired,
      batchNo: 'AMX-901',
      quantity: 8,
      threshold: 5,
      price: 85,
    },
    // 2. Expiring soon #1
    {
      userId,
      profileId: profileSelf._id,
      name: 'Azithromycin 500mg',
      genericName: 'Azithromycin',
      activeIngredients: ['azithromycin'],
      uses: 'Respiratory infections',
      expiry: dateExpiringSoon1,
      batchNo: 'AZI-442',
      quantity: 6,
      threshold: 5,
      price: 110,
    },
    // 3. Expiring soon #2
    {
      userId,
      profileId: profileSpouse._id,
      name: 'Cetirizine 10mg Tablets',
      genericName: 'Cetirizine',
      activeIngredients: ['cetirizine'],
      uses: 'Allergic rhinitis and hives',
      expiry: dateExpiringSoon2,
      batchNo: 'CET-118',
      quantity: 14,
      threshold: 5,
      price: 45,
    },
    // 4. Low stock medicine (quantity 2 <= threshold 5)
    {
      userId,
      profileId: profileSelf._id,
      name: 'Metformin 500mg SR',
      genericName: 'Metformin',
      activeIngredients: ['metformin'],
      uses: 'Type 2 Diabetes management',
      expiry: dateFuture1,
      batchNo: 'MET-802',
      quantity: 2,
      threshold: 5,
      price: 65,
    },
    // 5. Shared ingredient medicine #1 (Paracetamol)
    {
      userId,
      profileId: profileSelf._id,
      name: 'Dolo 650 Tablet',
      genericName: 'Paracetamol',
      activeIngredients: ['paracetamol'],
      uses: 'Fever and moderate pain relief',
      expiry: dateFuture3,
      batchNo: 'DL-7731',
      quantity: 25,
      threshold: 5,
      price: 32,
    },
    // 6. Shared ingredient medicine #2 (Paracetamol - trigger duplicate warning)
    {
      userId,
      profileId: profileSpouse._id,
      name: 'Crocin Advance 500mg',
      genericName: 'Paracetamol',
      activeIngredients: ['paracetamol'],
      uses: 'Fast headache and body ache relief',
      expiry: dateFuture2,
      batchNo: 'CR-4409',
      quantity: 18,
      threshold: 5,
      price: 28,
    },
    // 7. Additional regular medicine
    {
      userId,
      profileId: profileSelf._id,
      name: 'Pantoprazole 40mg',
      genericName: 'Pantoprazole',
      activeIngredients: ['pantoprazole'],
      uses: 'Acid reflux and gastritis',
      expiry: dateFuture4,
      batchNo: 'PAN-330',
      quantity: 15,
      threshold: 5,
      price: 90,
    },
    // 8. Additional regular medicine
    {
      userId,
      profileId: profileSpouse._id,
      name: 'Ibuprofen 400mg',
      genericName: 'Ibuprofen',
      activeIngredients: ['ibuprofen'],
      uses: 'Anti-inflammatory pain relief',
      expiry: dateFuture5,
      batchNo: 'IBU-512',
      quantity: 10,
      threshold: 5,
      price: 40,
    },
  ]);

  const doloMed = medicines.find(m => m.name.includes('Dolo'));
  const cetiMed = medicines.find(m => m.name.includes('Cetirizine'));

  // 4. Create 2 Schedules
  console.log('Creating 2 schedules...');
  const schedule1 = await Schedule.create({
    userId,
    profileId: profileSelf._id,
    medicineId: doloMed._id,
    times: ['08:00', '20:00'],
    startDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
    active: true,
  });

  const schedule2 = await Schedule.create({
    userId,
    profileId: profileSpouse._id,
    medicineId: cetiMed._id,
    times: ['21:00'],
    startDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
    active: true,
  });

  // 5. Generate 14 Days of Dose Logs with mixed taken/missed
  console.log('Generating 14 days of realistic dose logs...');
  const doseLogs = [];

  for (let i = 14; i >= 1; i--) {
    const dayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);

    // Schedule 1: 08:00 dose
    const dateS1Morn = new Date(dayDate);
    dateS1Morn.setHours(8, 0, 0, 0);
    // 85% taken, occasional missed
    const s1MornTaken = (i % 5 !== 0);
    doseLogs.push({
      userId,
      scheduleId: schedule1._id,
      scheduledFor: dateS1Morn,
      status: s1MornTaken ? 'taken' : 'missed',
      loggedAt: new Date(dateS1Morn.getTime() + 15 * 60 * 1000),
    });

    // Schedule 1: 20:00 dose
    const dateS1Eve = new Date(dayDate);
    dateS1Eve.setHours(20, 0, 0, 0);
    const s1EveTaken = (i % 4 !== 0);
    doseLogs.push({
      userId,
      scheduleId: schedule1._id,
      scheduledFor: dateS1Eve,
      status: s1EveTaken ? 'taken' : 'missed',
      loggedAt: new Date(dateS1Eve.getTime() + 20 * 60 * 1000),
    });

    // Schedule 2: 21:00 dose
    const dateS2Night = new Date(dayDate);
    dateS2Night.setHours(21, 0, 0, 0);
    const s2NightTaken = (i % 3 !== 0);
    doseLogs.push({
      userId,
      scheduleId: schedule2._id,
      scheduledFor: dateS2Night,
      status: s2NightTaken ? 'taken' : 'missed',
      loggedAt: new Date(dateS2Night.getTime() + 10 * 60 * 1000),
    });
  }

  await DoseLog.insertMany(doseLogs);

  // 6. Seed demo notifications
  console.log('Creating sample notifications...');
  await Notification.create([
    {
      userId,
      type: 'expiry',
      message: 'Medicine expired: Amoxicillin 250mg Suspension',
      dedupeKey: `expiry-expired-${medicines[0]._id}-${now.toISOString().split('T')[0]}`,
      read: false,
    },
    {
      userId,
      type: 'expiry',
      message: 'Medicine expiring in 10 days: Azithromycin 500mg',
      dedupeKey: `expiry-10-${medicines[1]._id}-${now.toISOString().split('T')[0]}`,
      read: false,
    },
    {
      userId,
      type: 'lowstock',
      message: 'Low stock for Metformin 500mg SR (2 remaining)',
      dedupeKey: `lowstock-${medicines[3]._id}-${now.toISOString().split('T')[0]}`,
      read: false,
    },
  ]);

  console.log('\n=========================================');
  console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
  console.log('=========================================');
  console.log('Demo Credentials:');
  console.log('  Email:    demo@medicabinet.com');
  console.log('  Password: Demo@123');
  console.log('Data Created:');
  console.log('  - 1 Demo User');
  console.log('  - 3 Profiles (Self, Sarah, Leo)');
  console.log('  - 8 Medicines:');
  console.log('      • 1 Expired: Amoxicillin 250mg Suspension');
  console.log('      • 2 Expiring Soon: Azithromycin 500mg, Cetirizine 10mg Tablets');
  console.log('      • 1 Low Stock: Metformin 500mg SR (qty: 2, threshold: 5)');
  console.log('      • 2 Sharing Ingredient: Dolo 650 & Crocin Advance (Paracetamol)');
  console.log('      • 2 Regular: Pantoprazole 40mg, Ibuprofen 400mg');
  console.log('  - 2 Active Schedules (Dolo 650 twice daily, Cetirizine nightly)');
  console.log(`  - ${doseLogs.length} Dose Logs spanning 14 days (mixed taken/missed)`);
  console.log('  - 3 In-App Notifications');
  console.log('=========================================\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
