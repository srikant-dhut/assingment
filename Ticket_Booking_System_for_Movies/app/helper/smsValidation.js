const transporter = require("../config/emailConfig");
const otpVerifyModel = require("../moduals/otpModel");

const sendEmailVerificationOTP = async (req, user, customEmailData = null) => {
  // If custom email data is provided, send that instead of OTP
  if (customEmailData) {
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: customEmailData.to,
        subject: customEmailData.subject,
        html: customEmailData.html,
      });
      return true;
    } catch (error) {
      console.error('Error sending custom email:', error);
      throw error;
    }
  }

  // Default OTP functionality
  const otp = Math.floor(1000 + Math.random() * 9000);
  const dhut = await new otpVerifyModel({ userId: user._id, otp: otp }).save();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: user.email,
    subject: "OTP - Verify your account",
    html: `<p>Dear ${user.name},</p>
        <p>Thank you for signing up with our website.
         To complete your registration, please verify your email
          address by entering the following one-time password (OTP)</p>
    <h2>OTP: ${otp}</h2>
    <p>This OTP is valid for 15 minutes. 
    If you didn't request this OTP, please ignore this email.</p>`,
  });

  return otp;
};

module.exports = sendEmailVerificationOTP;
