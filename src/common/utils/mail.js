const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_HOST_USER,
      pass: process.env.EMAIL_HOST_PASSWORD,
    },
  });
};

/**
 * Send an email
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} options.html - HTML body
 * @returns {Promise<Object>} - Nodemailer response
 */
const sendEmail = async ({ to, subject, text, html }) => {
  if (!to || !subject) {
    throw new Error('Recipient email and subject are required');
  }

  const transporter = createTransporter();

  const mailOptions = {
    from: `"RecycleTrack" <${process.env.EMAIL_HOST_USER}>`,
    to,
    subject,
    text,
    html: html || text,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info({
      message: 'Email sent successfully',
      to,
      subject,
      messageId: info.messageId,
    });
    return info;
  } catch (error) {
    logger.error({
      message: 'Failed to send email',
      to,
      subject,
      error: error.message,
    });
    throw error;
  }
};

/**
 * Send password reset code email
 * @param {Object} options
 * @param {string} options.email - Recipient email
 * @param {string} options.code - Verification code
 * @param {number} options.ttlMinutes - Code validity duration in minutes
 * @returns {Promise<Object>} - Nodemailer response
 */
const sendPasswordResetCode = async ({ email, code, ttlMinutes = 15 }) => {
  const subject = 'RecycleTrack - Code de réinitialisation de mot de passe';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🔄 RecycleTrack</h1>
        <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Réinitialisation de mot de passe</p>
      </div>
      
      <div style="background: #ffffff; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Bonjour,
        </p>
        <p style="color: #333; font-size: 16px; line-height: 1.6;">
          Vous avez demandé à réinitialiser votre mot de passe pour votre compte RecycleTrack.
        </p>
        
        <div style="background: #f7f7f7; padding: 20px; text-align: center; margin: 25px 0; border-radius: 8px; border: 2px dashed #667eea;">
          <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">Votre code de vérification :</p>
          <h2 style="color: #667eea; font-size: 42px; margin: 0; letter-spacing: 8px; font-weight: bold;">${code}</h2>
        </div>
        
        <p style="color: #666; font-size: 14px; line-height: 1.6;">
          ⏰ Ce code expirera dans <strong>${ttlMinutes} minutes</strong>.
        </p>
        
        <p style="color: #666; font-size: 14px; line-height: 1.6;">
          Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email. Votre mot de passe restera inchangé.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <p style="color: #999; font-size: 12px; line-height: 1.6;">
            Cordialement,<br>
            <strong>L'équipe RecycleTrack</strong>
          </p>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
        <p>© ${new Date().getFullYear()} RecycleTrack. Tous droits réservés.</p>
      </div>
    </div>
  `;

  const text = `
    RecycleTrack - Réinitialisation de mot de passe
    
    Bonjour,
    
    Vous avez demandé à réinitialiser votre mot de passe pour votre compte RecycleTrack.
    
    Votre code de vérification : ${code}
    
    Ce code expirera dans ${ttlMinutes} minutes.
    
    Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.
    
    Cordialement,
    L'équipe RecycleTrack
  `;

  return sendEmail({
    to: email,
    subject,
    text,
    html,
  });
};

module.exports = {
  sendEmail,
  sendPasswordResetCode,
};
