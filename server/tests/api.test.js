const request = require('supertest');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = require('../src/app');
const User = require('../src/models/User');
const Profile = require('../src/models/Profile');
const Medicine = require('../src/models/Medicine');
const Schedule = require('../src/models/Schedule');
const DoseLog = require('../src/models/DoseLog');

const MONGO_URI = (process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medicabinet').replace('localhost', '127.0.0.1');

describe('MediCabinet API Integration Tests', () => {
  jest.setTimeout(30000);

  let userAToken;
  let userBToken;
  let userAId;
  let userBId;
  let userAProfileId;
  let medicineAId;
  let scheduleAId;

  const testUserA = {
    name: 'User A',
    email: `usera_${Date.now()}@test.com`,
    password: 'Password123!',
  };

  const testUserB = {
    name: 'User B',
    email: `userb_${Date.now()}@test.com`,
    password: 'Password123!',
  };

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }
  });

  afterAll(async () => {
    // Clean up created test data
    if (userAId) {
      await Promise.all([
        User.deleteOne({ _id: userAId }),
        Profile.deleteMany({ userId: userAId }),
        Medicine.deleteMany({ userId: userAId }),
        Schedule.deleteMany({ userId: userAId }),
        DoseLog.deleteMany({ userId: userAId }),
      ]);
    }
    if (userBId) {
      await Promise.all([
        User.deleteOne({ _id: userBId }),
        Profile.deleteMany({ userId: userBId }),
        Medicine.deleteMany({ userId: userBId }),
        Schedule.deleteMany({ userId: userBId }),
        DoseLog.deleteMany({ userId: userBId }),
      ]);
    }
    await mongoose.disconnect();
  });

  // ─────────────────────────────────────────────────────────────
  // 1. Auth: Register & Login Flow
  // ─────────────────────────────────────────────────────────────
  describe('Authentication Flow', () => {
    it('should register User A and return JWT token and user info', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUserA);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(testUserA.email);

      userAToken = res.body.data.token;
      userAId = res.body.data.user._id;

      // Verify default "Me" profile was created
      const profiles = await Profile.find({ userId: userAId });
      expect(profiles.length).toBe(1);
      expect(profiles[0].name).toBe('Me');
      userAProfileId = profiles[0]._id;
    });

    it('should register User B', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUserB);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      userBToken = res.body.data.token;
      userBId = res.body.data.user._id;
    });

    it('should fail login with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUserA.email, password: 'WrongPassword' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should successfully log in with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUserA.email, password: testUserA.password });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 2. User Scoping: Multi-user Medicine Isolation
  // ─────────────────────────────────────────────────────────────
  describe('Medicine Scoping between Two Users', () => {
    it('User A creates a medicine', async () => {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 90);

      const res = await request(app)
        .post('/api/medicines')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          name: 'Paracetamol 500mg',
          genericName: 'Paracetamol',
          activeIngredients: ['paracetamol'],
          quantity: 10,
          threshold: 3,
          expiry: expiry.toISOString(),
          price: 25,
          profileId: userAProfileId.toString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Paracetamol 500mg');
      medicineAId = res.body.data._id;
    });

    it('User B cannot see User A medicine in GET /api/medicines', async () => {
      const res = await request(app)
        .get('/api/medicines')
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // User B should have 0 medicines
      expect(res.body.data.length).toBe(0);
    });

    it('User B cannot update User A medicine (returns 404)', async () => {
      const res = await request(app)
        .put(`/api/medicines/${medicineAId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({
          name: 'Hacked Medicine',
          quantity: 99,
          expiry: new Date().toISOString(),
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);

      // Verify in DB that medicine was not altered
      const med = await Medicine.findById(medicineAId);
      expect(med.name).toBe('Paracetamol 500mg');
    });

    it('User B cannot delete User A medicine (returns 404)', async () => {
      const res = await request(app)
        .delete(`/api/medicines/${medicineAId}`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);

      // Verify medicine still exists
      const med = await Medicine.findById(medicineAId);
      expect(med).not.toBeNull();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // 3. Dose-Log Stock Decrement & Logging
  // ─────────────────────────────────────────────────────────────
  describe('Dose Logging & Stock Decrement', () => {
    it('creates a schedule for User A medicine', async () => {
      const res = await request(app)
        .post('/api/schedules')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          medicineId: medicineAId,
          profileId: userAProfileId.toString(),
          times: ['08:00', '20:00'],
          startDate: new Date().toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      scheduleAId = res.body.data._id;
    });

    it('logging a dose as "taken" decrements medicine stock by 1', async () => {
      // Check initial quantity is 10
      const initialMed = await Medicine.findById(medicineAId);
      expect(initialMed.quantity).toBe(10);

      const scheduledFor = new Date();
      scheduledFor.setHours(8, 0, 0, 0);

      const res = await request(app)
        .post('/api/doses/log')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          scheduleId: scheduleAId,
          scheduledFor: scheduledFor.toISOString(),
          status: 'taken',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.updatedQuantity).toBe(9);

      // Verify persisted quantity in database is decremented to 9
      const updatedMed = await Medicine.findById(medicineAId);
      expect(updatedMed.quantity).toBe(9);
    });

    it('prevents double-logging the same dose slot (returns 409)', async () => {
      const scheduledFor = new Date();
      scheduledFor.setHours(8, 0, 0, 0);

      const res = await request(app)
        .post('/api/doses/log')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          scheduleId: scheduleAId,
          scheduledFor: scheduledFor.toISOString(),
          status: 'taken',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('logging a dose as "missed" does not decrement medicine stock', async () => {
      const scheduledFor = new Date();
      scheduledFor.setHours(20, 0, 0, 0);

      const res = await request(app)
        .post('/api/doses/log')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          scheduleId: scheduleAId,
          scheduledFor: scheduledFor.toISOString(),
          status: 'missed',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      // Verify quantity remains 9
      const currentMed = await Medicine.findById(medicineAId);
      expect(currentMed.quantity).toBe(9);
    });
  });
});
