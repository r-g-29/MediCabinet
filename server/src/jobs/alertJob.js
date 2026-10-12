const cron = require('node-cron');
const mongoose = require('mongoose');
const Medicine = require('../models/Medicine');
const Schedule = require('../models/Schedule');
const DoseLog = require('../models/DoseLog');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { sendEmail } = require('../utils/email');

const generateDedupeKey = (type, entityId, dateStr) => {
  return `${type}-${entityId}-${dateStr}`;
};

/**
 * Checks a specific medicine for expiry or low stock, sends alert email, and tracks delivery status.
 * Can be called immediately on medicine create/update, or on-demand, or via cron job.
 */
const checkAndTriggerMedicineAlert = async (medOrId, userOrId = null, options = {}) => {
  const { forceEmail = false } = options;
  try {
    let med = null;
    if (medOrId && (medOrId.expiry !== undefined || medOrId.name !== undefined)) {
      med = medOrId;
    } else if (medOrId) {
      med = await Medicine.findById(medOrId);
    }

    if (!med) return { triggered: false, message: 'Medicine not found' };

    const userId = userOrId || med.userId;
    const user = await User.findById(userId);
    if (!user || !user.email) return { triggered: false, message: 'User or email not found' };

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const expiry = new Date(med.expiry);
    const daysToExpiry = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

    let alertType = null;
    let subject = '';
    let message = '';
    let dedupeKey = '';

    if (daysToExpiry <= 0) {
      alertType = 'expiry';
      subject = `🚨 MediCabinet Alert: Medicine Expired - ${med.name}`;
      message = `Warning: "${med.name}" expired on ${expiry.toLocaleDateString()}. Please discontinue use and dispose of safely.`;
      dedupeKey = generateDedupeKey('expiry-expired', med._id.toString(), todayStr);
    } else if (daysToExpiry <= 7) {
      alertType = 'expiry';
      subject = `⚠️ MediCabinet Warning: Expiring in ${daysToExpiry} Day(s) - ${med.name}`;
      message = `Notice: "${med.name}" will expire in ${daysToExpiry} day(s) on ${expiry.toLocaleDateString()}.`;
      dedupeKey = generateDedupeKey('expiry-7', med._id.toString(), todayStr);
    } else if (daysToExpiry <= 30) {
      alertType = 'expiry';
      subject = `MediCabinet Notice: Expiring in ${daysToExpiry} Days - ${med.name}`;
      message = `Notice: "${med.name}" is approaching its expiration date on ${expiry.toLocaleDateString()} (${daysToExpiry} days left).`;
      dedupeKey = generateDedupeKey('expiry-30', med._id.toString(), todayStr);
    } else if (med.quantity <= med.threshold) {
      alertType = 'lowstock';
      subject = `📉 MediCabinet Alert: Low Stock - ${med.name}`;
      message = `Low Stock Alert: "${med.name}" only has ${med.quantity} unit(s) remaining (Threshold: ${med.threshold}). Consider refilling soon.`;
      dedupeKey = generateDedupeKey('lowstock', med._id.toString(), todayStr);
    }

    if (!alertType) {
      // Medicine is valid and in healthy stock
      return { triggered: false, status: 'ok', message: 'Medicine has no active alert condition' };
    }

    // Check if this notification already exists today (unless forceEmail is set)
    let existingNotif = null;
    if (!forceEmail) {
      existingNotif = await Notification.findOne({ userId: user._id, dedupeKey });
    }

    if (existingNotif && existingNotif.emailSent) {
      return { 
        triggered: false, 
        alreadySent: true, 
        message: 'Alert email already sent for this medicine today',
        lastSentAt: existingNotif.emailSentAt 
      };
    }

    // Dispatch email
    const emailResult = await sendEmail(user.email, subject, message, {
      medicineName: med.name,
      expiryDate: med.expiry,
      quantity: med.quantity,
      type: alertType.toUpperCase()
    });

    // Record or update in-app Notification with email tracking
    if (existingNotif) {
      existingNotif.emailSent = emailResult.success;
      existingNotif.emailSentAt = emailResult.success ? new Date() : null;
      existingNotif.emailStatus = emailResult.success ? 'sent' : 'failed';
      existingNotif.emailRecipient = user.email;
      existingNotif.emailError = emailResult.error || null;
      existingNotif.medicineId = med._id;
      await existingNotif.save();
    } else {
      await Notification.create({
        userId: user._id,
        type: alertType,
        message,
        dedupeKey,
        medicineId: med._id,
        emailSent: emailResult.success,
        emailSentAt: emailResult.success ? new Date() : null,
        emailStatus: emailResult.success ? 'sent' : 'failed',
        emailRecipient: user.email,
        emailError: emailResult.error || null,
      }).catch(err => {
        if (err.code !== 11000) console.error('Error saving notification:', err);
      });
    }

    // Update Medicine tracking
    await Medicine.findByIdAndUpdate(med._id, {
      alertEmailSent: emailResult.success,
      alertEmailSentAt: emailResult.success ? new Date() : null,
      alertEmailStatus: emailResult.success ? 'sent' : 'failed',
      alertEmailRecipient: user.email,
      alertEmailError: emailResult.error || null
    });

    return {
      triggered: true,
      alertType,
      subject,
      emailSent: emailResult.success,
      recipient: user.email,
      error: emailResult.error || null
    };
  } catch (err) {
    console.error('Error in checkAndTriggerMedicineAlert:', err);
    return { triggered: false, error: err.message };
  }
};

const notifyUser = async (userId, type, message, dedupeKey) => {
  try {
    const existing = await Notification.findOne({ userId, dedupeKey });
    if (!existing) {
      const user = await User.findById(userId);
      if (user) {
        const subjects = {
          'expiry': 'MediCabinet: Expiry Alert',
          'lowstock': 'MediCabinet: Low Stock Alert',
          'dose': 'MediCabinet: Dose Reminder'
        };
        const emailResult = await sendEmail(user.email, subjects[type] || 'MediCabinet Alert', message, { type });
        await Notification.create({
          userId,
          type,
          message,
          dedupeKey,
          emailSent: emailResult.success,
          emailSentAt: emailResult.success ? new Date() : null,
          emailStatus: emailResult.success ? 'sent' : 'failed',
          emailRecipient: user.email,
          emailError: emailResult.error || null
        });
      }
    }
  } catch (err) {
    if (err.code !== 11000) {
      console.error('Error in notifyUser:', err);
    }
  }
};

const runAlertsNow = async () => {
  console.log('Running alerts job...');
  try {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // 1. Expiry & Low Stock Alerts for all medicines
    const medicines = await Medicine.find({}).lean();
    for (const med of medicines) {
      await checkAndTriggerMedicineAlert(med, med.userId);
    }

    // 2. Dose Reminders for today
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const activeSchedules = await Schedule.find({
      active: true,
      startDate: { $lte: todayEnd },
      $or: [{ endDate: null }, { endDate: { $gte: todayStart } }],
    }).populate('medicineId', 'name').populate('profileId', 'name').lean();

    for (const schedule of activeSchedules) {
      const logs = await DoseLog.find({
        userId: schedule.userId,
        scheduleId: schedule._id,
        scheduledFor: { $gte: todayStart, $lte: todayEnd },
      }).lean();

      const loggedTimes = new Set(logs.map(log => {
        const d = new Date(log.scheduledFor);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }));

      for (const time of schedule.times) {
        if (!loggedTimes.has(time)) {
          const message = `Reminder: Time to take ${schedule.medicineId?.name || 'medicine'} for ${schedule.profileId?.name || 'General'} at ${time}.`;
          await notifyUser(schedule.userId, 'dose', message, generateDedupeKey('dose', schedule._id.toString(), todayStr + '-' + time));
        }
      }
    }

    console.log('Alerts job completed.');
  } catch (err) {
    console.error('Error running alerts job:', err);
  }
};

const startCronJob = () => {
  cron.schedule('0 8 * * *', () => {
    runAlertsNow();
  });
  console.log('Cron job scheduled: daily at 08:00');
};

module.exports = { startCronJob, runAlertsNow, checkAndTriggerMedicineAlert, notifyUser };

