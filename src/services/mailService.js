const { Resend } = require('resend');
const logger = require('../utils/logger');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendOTPEmail = async (email, otp) => {
  try {
    logger.info('Attempting to send OTP email', { email });
    
    const { data, error } = await resend.emails.send({
      from: 'DrivePrep <onboarding@resend.dev>', // Resend verified domain or default onboarding
      to: email,
      subject: 'Your Password Reset Code - DrivePrep',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #F7C631;">Password Recovery</h2>
          <p>Hello,</p>
          <p>You requested to reset your password for DrivePrep. Use the following 6-digit verification code to proceed:</p>
          <div style="background-color: #F8F9FA; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; border-radius: 8px; margin: 20px 0; border: 1px solid #E9ECEF;">
            ${otp}
          </div>
          <p>This code will expire in 15 minutes.</p>
          <p>If you did not request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #EEE; margin: 20px 0;" />
          <p style="font-size: 12px; color: #777;">DrivePrep - Master the Road with Confidence</p>
        </div>
      `
    });

    if (error) {
      logger.error('Resend API error', { error });
      
      // Development mode fallback: if we can't send because of unverified domain, 
      // still "succeed" but log the code so the dev can use it.
      if (process.env.NODE_ENV === 'development') {
        logger.info('DEVELOPMENT MODE: OTP logged below since email could not be sent to non-verified address');
        console.log('\n------------------------------------------------');
        console.log(`🔥 [DEV] VERIFICATION CODE FOR ${email}: ${otp}`);
        console.log('------------------------------------------------\n');
        return { success: true, message: 'Dev mode: Code logged to terminal', mock: true };
      }

      return { success: false, error };
    }

    logger.info('OTP email sent successfully', { email, messageId: data.id });
    return { success: true, data };
  } catch (err) {
    logger.error('Unexpected error sending email', { error: err.message });
    
    // Fallback for any other unexpected error in dev mode
    if (process.env.NODE_ENV === 'development') {
      logger.info(`DEV MODE: Unexpected error, logging OTP: ${otp}`);
      return { success: true, message: 'Dev mode: Code logged via error fallback', mock: true };
    }

    return { success: false, error: err.message };
  }
};

module.exports = {
  sendOTPEmail
};
