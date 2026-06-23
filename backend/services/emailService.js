const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config();

// --- Sanity check: make sure env vars actually loaded ---
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.log("\n❌ [GMAIL SERVICE] EMAIL_USER or EMAIL_PASS is missing from environment.");
  console.log("👉 Check that your .env file is in the project root and dotenv.config() runs before this file loads.\n");
} else {
  console.log(
    `[GMAIL SERVICE] Loaded EMAIL_USER=${process.env.EMAIL_USER}, EMAIL_PASS length=${process.env.EMAIL_PASS.length}`
  );
  if (process.env.EMAIL_PASS.length !== 16) {
    console.log(
      "⚠️  [GMAIL SERVICE] EMAIL_PASS is not 16 characters — Gmail App Passwords are always 16 characters with no spaces."
    );
    console.log("👉 Generate one at https://myaccount.google.com/apppasswords (requires 2-Step Verification ON).\n");
  }
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

let smtpReady = false;

transporter.verify((error, success) => {
  if (error) {
    smtpReady = false;
    console.log("\n⚠️  [GMAIL SERVICE] SMTP connection failed. Real email delivery is DISABLED.");
    console.log("👉 Full error from Nodemailer:");
    console.error(error);
    console.log(
      "\n👉 Most common causes: not using an App Password, 2-Step Verification not enabled, or wrong EMAIL_USER/EMAIL_PASS.\n"
    );
  } else {
    smtpReady = true;
    console.log("✅ [GMAIL SERVICE] Gmail configured properly and ready to send email.");
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
    const info = await transporter.sendMail({
      from: `Flash Chat <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Flash Chat verification code",
      html,
    });

    console.log(`✅ [GMAIL SERVICE] OTP email sent to ${email} (messageId: ${info.messageId})`);
    return { delivered: true, mode: "email" };
  } catch (error) {
    console.error("\n❌ [GMAIL SERVICE] Failed to send OTP email via SMTP.");
    console.error("Reason:", error.message);
    console.error("Full error:", error);

    if (process.env.NODE_ENV === "production") {
      // Never silently fall back in production — the user must know the OTP wasn't delivered
      throw new Error("Failed to send OTP email. Please try again");
    }

    // Development-only fallback: clearly flagged so it's never mistaken for a real send
    console.log("\n==================================================");
    console.log("🔑 [DEV FALLBACK — EMAIL NOT ACTUALLY SENT]");
    console.log(`To: ${email}`);
    console.log(`OTP Code: ${otp}`);
    console.log("This code was only printed because SMTP failed (see error above).");
    console.log("Fix the SMTP error to get real email delivery.");
    console.log("==================================================\n");

    return { delivered: false, mode: "console-fallback" };
  }
};

module.exports = sendOtpToEmail;