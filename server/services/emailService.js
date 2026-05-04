const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send reminder email for upcoming court dates / deadlines
 */
async function sendReminderEmail(to, subject, caseTitle, hearingDate, courtName, caseId) {
  const mailOptions = {
    from: `"LegalDesk" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 24px; border-radius: 12px; color: white;">
          <h1 style="margin: 0 0 8px 0; font-size: 24px;">⚖️ LegalDesk Reminder</h1>
          <p style="margin: 0; color: #94a3b8;">Court Date / Deadline Alert</p>
        </div>
        <div style="padding: 24px; background: #f8fafc; border-radius: 0 0 12px 12px;">
          <h2 style="color: #1e293b; margin-top: 0;">${caseTitle}</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">📅 Date:</td>
              <td style="padding: 8px 0; color: #1e293b;">${new Date(hearingDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-weight: 600;">🏛️ Court:</td>
              <td style="padding: 8px 0; color: #1e293b;">${courtName || 'Not specified'}</td>
            </tr>
          </table>
          <p style="color: #64748b; margin-top: 16px; font-size: 14px;">
            This is an automated reminder from LegalDesk. Please prepare accordingly.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Reminder sent to ${to}`);
  } catch (error) {
    console.error('Email send failed:', error.message);
  }
}

/**
 * Send appointment confirmation email
 */
async function sendAppointmentEmail(to, lawyerName, dateTime, status) {
  const mailOptions = {
    from: `"LegalDesk" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Appointment ${status} - LegalDesk`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>⚖️ LegalDesk - Appointment ${status}</h2>
        <p>Your appointment with <strong>${lawyerName}</strong> has been <strong>${status}</strong>.</p>
        <p><strong>Date & Time:</strong> ${new Date(dateTime).toLocaleString('en-IN')}</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email send failed:', error.message);
  }
}

module.exports = { sendReminderEmail, sendAppointmentEmail };
