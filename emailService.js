const nodemailer = require('nodemailer');

// Email configuration
const emailConfig = {
  // For Gmail (you can change this to your preferred email service)
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com', // Your Gmail address
    pass: process.env.EMAIL_PASS || 'your-app-password'    // Gmail App Password (not regular password)
  }
};

// Alternative configurations for other email services:

// For Outlook/Hotmail:
// const emailConfig = {
//   service: 'outlook',
//   auth: {
//     user: process.env.EMAIL_USER || 'your-email@outlook.com',
//     pass: process.env.EMAIL_PASS || 'your-password'
//   }
// };

// For custom SMTP server:
// const emailConfig = {
//   host: process.env.SMTP_HOST || 'smtp.yourdomain.com',
//   port: process.env.SMTP_PORT || 587,
//   secure: false, // true for 465, false for other ports
//   auth: {
//     user: process.env.EMAIL_USER || 'your-email@yourdomain.com',
//     pass: process.env.EMAIL_PASS || 'your-password'
//   }
// };

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Email templates
const emailTemplates = {
  welcomeEmail: (clientData) => ({
    subject: `Welcome to AI Caller - ${clientData.companyName}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to AI Caller</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .highlight { background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to AI Caller!</h1>
            <p>Your AI-powered calling solution</p>
          </div>
          
          <div class="content">
            <h2>Hello ${clientData.contactPersonName}!</h2>
            
            <p>Welcome to <strong>AI Caller</strong>! We're excited to have <strong>${clientData.companyName}</strong> on board.</p>
            
            <div class="highlight">
              <strong>Your Account Details:</strong><br>
              • Company: ${clientData.companyName}<br>
              • Email: ${clientData.companyEmail}<br>
              • Contact: ${clientData.contactPersonName}<br>
              • Phone: ${clientData.phoneNumber}
            </div>
            
            <h3>🚀 What's Next?</h3>
            <p>Your account has been successfully created and is ready to use. Here's what you can do:</p>
            
            <ul>
              <li>Create and configure AI agents for your calling campaigns</li>
              <li>Set up your knowledge base with company information</li>
              <li>Start your first AI-powered calling campaign</li>
              <li>Monitor performance and analytics</li>
            </ul>
            
            <p><strong>Need Help?</strong> Our support team is here to assist you with any questions or setup requirements.</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/client-admin/dashboard" class="button">Access Your Dashboard</a>
            
            <p style="margin-top: 30px;">
              <strong>Best regards,</strong><br>
              The AI Caller Team
            </p>
          </div>
          
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p>© 2024 AI Caller. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Welcome to AI Caller - ${clientData.companyName}

Hello ${clientData.contactPersonName}!

Welcome to AI Caller! We're excited to have ${clientData.companyName} on board.

Your Account Details:
• Company: ${clientData.companyName}
• Email: ${clientData.companyEmail}
• Contact: ${clientData.contactPersonName}
• Phone: ${clientData.phoneNumber}

What's Next?
Your account has been successfully created and is ready to use. Here's what you can do:

• Create and configure AI agents for your calling campaigns
• Set up your knowledge base with company information
• Start your first AI-powered calling campaign
• Monitor performance and analytics

Need Help? Our support team is here to assist you with any questions or setup requirements.

Access Your Dashboard: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/client-admin/dashboard

Best regards,
The AI Caller Team

This is an automated message. Please do not reply to this email.
© 2024 AI Caller. All rights reserved.
    `
  })
};

// Send email function
const sendEmail = async (to, template, data = {}) => {
  try {
    const emailContent = emailTemplates[template](data);
    
    const mailOptions = {
      from: `"AI Caller Team" <${emailConfig.auth.user}>`,
      to: to,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${to}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    throw error;
  }
};

// Test email configuration
const testEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email service configuration is valid');
    return true;
  } catch (error) {
    console.error('❌ Email service configuration error:', error);
    return false;
  }
};

module.exports = {
  sendEmail,
  testEmailConfig,
  emailTemplates
};
