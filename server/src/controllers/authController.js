// Auth controller – handles register, login, and get-current-user
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const Profile = require('../models/Profile');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });

    // Auto-create a first profile named "Me"
    await Profile.create({ userId: user._id, name: 'Me', relation: 'Self' });

    const token = signToken(user._id);
    res.status(201).json({
      success: true,
      data: { token, user: { _id: user._id, name: user.name, email: user.email } },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = signToken(user._id);
    res.json({
      success: true,
      data: { token, user: { _id: user._id, name: user.name, email: user.email } },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me  (protected)
const getMe = async (req, res) => {
  const { _id, name, email, createdAt } = req.user;
  res.json({ success: true, data: { _id, name, email, createdAt } });
};

// PUT /api/auth/me  (protected) - update account info
const updateMe = async (req, res, next) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name && name.trim()) {
      user.name = name.trim();
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required to set a new password' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }
      user.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    await user.save();

    res.json({
      success: true,
      message: 'Account updated successfully',
      data: { _id: user._id, name: user.name, email: user.email, createdAt: user.createdAt },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, updateMe };

