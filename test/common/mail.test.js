const nodemailer = require('nodemailer');
const logger = require('../../src/common/utils/logger');
const { sendEmail, sendPasswordResetCode } = require('../../src/common/utils/mail');

jest.mock('nodemailer');
jest.mock('../../src/common/utils/logger');

describe('mail.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EMAIL_HOST_USER = 'test@gmail.com';
    process.env.EMAIL_HOST_PASSWORD = 'password123';
  });

  describe('sendEmail', () => {
    it('throws error when to is missing', async () => {
      await expect(sendEmail({ subject: 'Test' })).rejects.toThrow(
        'Recipient email and subject are required'
      );
    });

    it('throws error when subject is missing', async () => {
      await expect(sendEmail({ to: 'test@example.com' })).rejects.toThrow(
        'Recipient email and subject are required'
      );
    });

    it('sends email successfully', async () => {
      const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'msg-123' });
      nodemailer.createTransport.mockReturnValue({ sendMail: mockSendMail });

      const result = await sendEmail({
        to: 'user@example.com',
        subject: 'Test Subject',
        text: 'Test body',
      });

      expect(result.messageId).toBe('msg-123');
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Test Subject',
        })
      );
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Email sent successfully',
          messageId: 'msg-123',
        })
      );
    });

    it('logs error when email sending fails', async () => {
      const mockSendMail = jest.fn().mockRejectedValue(new Error('SMTP Error'));
      nodemailer.createTransport.mockReturnValue({ sendMail: mockSendMail });

      await expect(
        sendEmail({
          to: 'user@example.com',
          subject: 'Test Subject',
          text: 'Test body',
        })
      ).rejects.toThrow('SMTP Error');

      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Failed to send email',
          error: 'SMTP Error',
        })
      );
    });
  });

  describe('sendPasswordResetCode', () => {
    it('sends password reset email with correct template', async () => {
      const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'reset-123' });
      nodemailer.createTransport.mockReturnValue({ sendMail: mockSendMail });

      const result = await sendPasswordResetCode({
        email: 'user@example.com',
        code: '123456',
        ttlMinutes: 15,
      });

      expect(result.messageId).toBe('reset-123');
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'RecycleTrack - Code de réinitialisation de mot de passe',
        })
      );
      expect(mockSendMail.mock.calls[0][0].html).toContain('123456');
      expect(mockSendMail.mock.calls[0][0].html).toContain('15 minutes');
      expect(logger.info).toHaveBeenCalled();
    });

    it('uses default ttlMinutes when not provided', async () => {
      const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'reset-456' });
      nodemailer.createTransport.mockReturnValue({ sendMail: mockSendMail });

      await sendPasswordResetCode({
        email: 'user@example.com',
        code: '789012',
      });

      expect(mockSendMail.mock.calls[0][0].html).toContain('15 minutes');
    });
  });
});
