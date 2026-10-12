const nodemailer = require('nodemailer');

let transporter = null;

if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Format a modern HTML email template for MediCabinet alerts
 */
const formatAlertHtml = (title, message, details = {}) => {
  const medicineName = details.medicineName || '';
  const expiryDate = details.expiryDate ? new Date(details.expiryDate).toLocaleDateString() : '';
  const quantity = details.quantity !== undefined ? details.quantity : '';
  const alertType = details.type || 'Alert';

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">💊 MediCabinet</h1>
        <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Family Health Vault & Medicine Tracker</p>
      </div>
      
      <div style="padding: 28px 24px;">
        <div style="display: inline-block; padding: 4px 12px; border-radius: 9999px; background: #fee2e2; color: #dc2626; font-size: 12px; font-weight: 700; text-transform: uppercase; margin-bottom: 12px;">
          ${alertType} Notification
        </div>
        
        <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #111827; font-weight: 700;">
          ${title}
        </h2>
        
        <p style="margin: 0 0 20px 0; font-size: 15px; color: #374151; line-height: 1.5;">
          ${message}
        </p>

        ${medicineName ? `
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <div style="font-size: 13px; color: #6b7280; margin-bottom: 6px;">Medicine Details:</div>
          <div style="font-size: 16px; font-weight: 700; color: #111827;">${medicineName}</div>
          ${expiryDate ? `<div style="font-size: 14px; color: #4b5563; margin-top: 4px;"><strong>Expiry Date:</strong> ${expiryDate}</div>` : ''}
          ${quantity !== '' ? `<div style="font-size: 14px; color: #4b5563; margin-top: 4px;"><strong>Stock Left:</strong> ${quantity} units</div>` : ''}
        </div>
        ` : ''}

        <p style="margin: 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
          Log into your <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" style="color: #dc2626; text-decoration: none; font-weight: 600;">MediCabinet Dashboard</a> to manage your cabinet or safely mark medicines.
        </p>
      </div>

      <div style="background: #f9fafb; padding: 16px 24px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #9ca3af;">
        This is an automated safety alert from MediCabinet. If you did not request this, you can review your family health cabinet settings.
      </div>
    </div>
  `;
};

/**
 * Send an email and return delivery tracking metadata
 */
const sendEmail = async (to, subject, text, details = {}) => {
  if (transporter) {
    try {
      const html = details.html || formatAlertHtml(subject, text, details);
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || 'MediCabinet <noreply@medicabinet.local>',
        to,
        subject,
        text,
        html,
      });
      console.log(`[Email Sent] To: ${to} | Subject: ${subject} | MessageId: ${info.messageId}`);
      return {
        success: true,
        messageId: info.messageId,
        recipient: to,
        timestamp: new Date()
      };
    } catch (err) {
      console.error(`[Email Failed] To: ${to} | Subject: ${subject}`, err.message);
      return {
        success: false,
        error: err.message,
        recipient: to,
        timestamp: new Date()
      };
    }
  } else {
    console.log(`[Email Log] (No SMTP configured) To: ${to} | Subject: ${subject}\nBody: ${text}`);
    return {
      success: false,
      error: 'SMTP transporter not configured',
      skipped: true,
      recipient: to,
      timestamp: new Date()
    };
  }
};

const verifySMTP = async () => {
  if (!transporter) return { configured: false, message: 'SMTP not configured' };
  try {
    await transporter.verify();
    return { configured: true, connected: true };
  } catch (err) {
    return { configured: true, connected: false, error: err.message };
  }
};

module.exports = { sendEmail, verifySMTP, formatAlertHtml };

