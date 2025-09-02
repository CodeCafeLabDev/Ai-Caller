// backend/services/emailService.js
const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Test email configuration
async function testEmailConfig() {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Email configuration test failed:', error);
    return false;
  }
}

// Send email function
async function sendEmail(to, template, data) {
  let subject, html;

  switch (template) {
    case 'welcomeEmail':
      subject = `Welcome to AI Caller - ${data.companyName}`;
      html = `
        <h2>Welcome to AI Caller!</h2>
        <p>Dear ${data.contactPersonName},</p>
        <p>Thank you for choosing AI Caller for your business. Your account has been successfully created.</p>
        <h3>Account Details:</h3>
        <ul>
          <li><strong>Company:</strong> ${data.companyName}</li>
          <li><strong>Email:</strong> ${data.companyEmail}</li>
          <li><strong>Phone:</strong> ${data.phoneNumber}</li>
        </ul>
        <p>You can now log in to your dashboard and start creating AI agents for your business.</p>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <p>Best regards,<br>The AI Caller Team</p>
      `;
      break;

    case 'planAssignmentEmail':
      subject = `Plan Assignment - ${data.companyName}`;
      html = `
        <h2>Plan Assignment Notification</h2>
        <p>Dear ${data.contactPersonName},</p>
        <p>Your plan has been successfully assigned to your account.</p>
        <h3>Plan Details:</h3>
        <ul>
          <li><strong>Plan Name:</strong> ${data.planName}</li>
          <li><strong>Start Date:</strong> ${data.startDate}</li>
          ${data.durationOverrideDays ? `<li><strong>Duration:</strong> ${data.durationOverrideDays} days</li>` : ''}
          ${data.discountType ? `<li><strong>Discount:</strong> ${data.discountType} - ${data.discountValue}</li>` : ''}
        </ul>
        <p>You can now access all the features included in your plan.</p>
        <p>Best regards,<br>The AI Caller Team</p>
      `;
      break;

    default:
      throw new Error(`Unknown email template: ${template}`);
  }

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: to,
    subject: subject,
    html: html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

module.exports = { sendEmail, testEmailConfig };
