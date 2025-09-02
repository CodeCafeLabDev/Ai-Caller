// backend/routes/email.js
const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const { sendEmail } = require('../services/emailService');

// POST /api/email/send - Send an email
router.post('/send', authenticateJWT, async (req, res) => {
  try {
    const { to, subject, text, html, template, templateData } = req.body;
    
    if (!to || (!subject && !template)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Recipient email and either subject or template are required' 
      });
    }

    let emailResult;
    
    if (template) {
      // Send email using template
      emailResult = await sendEmail(to, template, templateData || {});
    } else {
      // Send email with custom content
      emailResult = await sendEmail(to, 'custom', { subject, text, html });
    }

    res.json({ 
      success: true, 
      message: 'Email sent successfully',
      messageId: emailResult.messageId 
    });
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send email', 
      error: error.message 
    });
  }
});

// POST /api/email/send-welcome - Send welcome email to a client
router.post('/send-welcome', authenticateJWT, async (req, res) => {
  try {
    const { clientId, clientEmail, clientName } = req.body;
    
    if (!clientId || !clientEmail || !clientName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Client ID, email, and name are required' 
      });
    }

    const emailResult = await sendEmail(clientEmail, 'welcomeEmail', {
      companyName: clientName,
      contactPersonName: clientName
    });

    console.log(`📧 Welcome email sent successfully to: ${clientEmail}`);
    console.log(`📧 Company: ${clientName}`);
    console.log(`📧 Email Message ID: ${emailResult.messageId}`);

    res.json({ 
      success: true, 
      message: 'Welcome email sent successfully',
      email: clientEmail,
      companyName: clientName,
      messageId: emailResult.messageId
    });
  } catch (error) {
    console.error('Welcome email error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send welcome email', 
      error: error.message 
    });
  }
});

// POST /api/email/send-notification - Send notification email
router.post('/send-notification', authenticateJWT, async (req, res) => {
  try {
    const { to, notificationType, data } = req.body;
    
    if (!to || !notificationType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Recipient email and notification type are required' 
      });
    }

    const emailResult = await sendEmail(to, notificationType, data || {});

    res.json({ 
      success: true, 
      message: 'Notification email sent successfully',
      messageId: emailResult.messageId 
    });
  } catch (error) {
    console.error('Notification email error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send notification email', 
      error: error.message 
    });
  }
});

// GET /api/email/templates - Get available email templates
router.get('/templates', authenticateJWT, (req, res) => {
  const templates = [
    {
      id: 'welcomeEmail',
      name: 'Welcome Email',
      description: 'Welcome email for new clients',
      requiredFields: ['companyName', 'contactPersonName']
    },
    {
      id: 'passwordReset',
      name: 'Password Reset',
      description: 'Password reset email',
      requiredFields: ['resetLink', 'userName']
    },
    {
      id: 'planUpgrade',
      name: 'Plan Upgrade',
      description: 'Plan upgrade notification',
      requiredFields: ['planName', 'userName', 'newFeatures']
    },
    {
      id: 'custom',
      name: 'Custom Email',
      description: 'Custom email with subject, text, and HTML',
      requiredFields: ['subject', 'text', 'html']
    }
  ];

  res.json({ success: true, data: templates });
});

// POST /api/email/test - Test email configuration
router.post('/test', authenticateJWT, async (req, res) => {
  try {
    const { testEmail } = req.body;
    
    if (!testEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'Test email address is required' 
      });
    }

    const emailResult = await sendEmail(testEmail, 'test', {
      testMessage: 'This is a test email to verify your email configuration.',
      timestamp: new Date().toISOString()
    });

    res.json({ 
      success: true, 
      message: 'Test email sent successfully',
      messageId: emailResult.messageId 
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send test email', 
      error: error.message 
    });
  }
});

module.exports = router;
