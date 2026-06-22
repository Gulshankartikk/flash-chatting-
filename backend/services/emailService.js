const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("Gmail service connection failed:", error.message);
  } else {
    console.log("Gmail configured properly and ready to send email");
  }
});

const sendOtpToEmail = async (email, otp) => {
  if (!email || !otp) throw new Error("Email and OTP are required");

  const html = `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <h2 style="color: #075e54;">Flash Chat verification</h2>
      <p>Hi there,</p>
      <p>Your one-time password (OTP) to verify your Flash Chat account is:</p>
      <h1 style="background: #e0f7fa; color: #000; padding: 10px 20px; display: inline-block; border-radius: 5px; letter-spacing: 2px;">
        ${otp}
      </h1>
      <p><strong>This OTP is valid for the next 5 minutes.</strong> Please do not share this code with anyone.</p>
      <p>If you didn't request this OTP, please ignore this email.</p>
      <p style="margin-top: 20px;">Thanks & Regards,<br/>Flash Chat Security Team</p>
      <hr style="margin: 30px 0;" />
      <small style="color: #777;">This is an automated message. Please do not reply.</small>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: `Flash Chat <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Flash Chat verification code",
      html,
    });
  } catch (error) {
    console.error("Failed to send OTP email:", error.message);
    throw new Error("Failed to send OTP email. Please try again");
  }
};

module.exports = sendOtpToEmail;