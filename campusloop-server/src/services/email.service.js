const nodemailer = require('nodemailer');

const secureConnection = Number(process.env.SMTP_PORT) === 465;

console.log(`[EmailService] Initializing transporter with host: ${process.env.SMTP_HOST}, port: ${process.env.SMTP_PORT}, secure: ${secureConnection}`);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: secureConnection,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify connection configuration on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ [EmailService] SMTP connection verification failed:', error.message);
  } else {
    console.log('✅ [EmailService] SMTP connection verified successfully - Ready to send emails');
  }
});

/**
 * Helper to send email with retry logic
 */
const sendMailWithRetry = async (mailOptions, retries = 3, delayMs = 1000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[EmailService] Attempt ${attempt} of ${retries} to send email to ${mailOptions.to}`);
      const info = await transporter.sendMail(mailOptions);
      console.log(`[EmailService] Email sent successfully on attempt ${attempt}. MessageId: ${info.messageId}`);
      return info;
    } catch (error) {
      console.error(`[EmailService] Attempt ${attempt} failed: ${error.message}`);
      if (attempt === retries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
};

/**
 * Send OTP verification email to the student
 */
const sendOTPEmail = async (to, name, otp) => {
  const mailOptions = {
    from: `"CampusLoop 🔁" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Verify your CampusLoop account',
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #0f172a; color: #f1f5f9; border-radius: 16px;">
        <h1 style="color: #6366f1; margin-bottom: 8px;">CampusLoop 🔁</h1>
        <p style="color: #94a3b8; margin-bottom: 24px;">Your campus marketplace & social network</p>
        <hr style="border-color: #1e293b; margin-bottom: 24px;" />
        <p style="font-size: 16px;">Hi <strong>${name}</strong>,</p>
        <p style="color: #cbd5e1;">Use the code below to verify your account. It expires in <strong>10 minutes</strong>.</p>
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: 700; letter-spacing: 12px; color: #6366f1;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 13px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  };

  await sendMailWithRetry(mailOptions);
};

module.exports = { sendOTPEmail };
