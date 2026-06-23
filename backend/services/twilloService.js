const twilio = require("twilio");

// Twilio credentials from env
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID;

// --- Sanity check: make sure env vars actually loaded ---
if (!accountSid || !authToken || !serviceSid) {
  console.log("\n❌ [TWILIO SERVICE] One or more required env vars are missing:");
  console.log(`   TWILIO_ACCOUNT_SID: ${accountSid ? "set" : "MISSING"}`);
  console.log(`   TWILIO_AUTH_TOKEN:  ${authToken ? "set" : "MISSING"}`);
  console.log(`   TWILIO_SERVICE_SID: ${serviceSid ? "set" : "MISSING"}`);
  console.log("👉 Check your .env file and that dotenv.config() runs before this module loads.\n");
} else {
  console.log("✅ [TWILIO SERVICE] Credentials loaded from environment.");
}

const client = twilio(accountSid, authToken);

// SEND OTP TO PHONE NUMBER
const sendOtpToPhone = async (phoneNumber) => {
  if (!phoneNumber) {
    throw new Error("Phone number is required");
  }

  console.log("[TWILIO SERVICE] Sending OTP to:", phoneNumber);

  try {
    const response = await client.verify.v2
      .services(serviceSid)
      .verifications.create({
        to: phoneNumber,
        channel: "sms",
      });

    console.log("[TWILIO SERVICE] OTP sent. Status:", response.status);
    return response;
  } catch (error) {
    console.error("[TWILIO SERVICE] Send OTP failed.");
    console.error("Message:", error.message, "| Code:", error.code);
    console.error("Full error:", error);
    throw new Error(mapTwilioSendError(error));
  }
};

// VERIFY OTP
const verifyOtp = async (phoneNumber, otp) => {
  if (!phoneNumber || !otp) {
    throw new Error("Phone number and OTP are required");
  }

  console.log("[TWILIO SERVICE] Verifying OTP for:", phoneNumber);

  try {
    const response = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({
        to: phoneNumber,
        code: otp,
      });

    console.log("[TWILIO SERVICE] OTP verify status:", response.status);
    return response;
  } catch (error) {
    console.error("[TWILIO SERVICE] OTP verification failed.");
    console.error("Message:", error.message, "| Code:", error.code);
    console.error("Full error:", error);
    throw new Error(mapTwilioVerifyError(error));
  }
};

// Maps Twilio's verification-check error codes to messages a user can
// actually act on. Falls back to a generic message for anything we
// haven't explicitly handled (new/rare Twilio error codes), so we
// never throw raw internal text.
const mapTwilioVerifyError = (error) => {
  switch (error.code) {
    case 20404:
      // Twilio has no pending verification for this number — usually
      // means the OTP already expired (verifications expire after
      // 10 minutes) or was never actually sent.
      return "This OTP has expired. Please request a new one";
    case 60200:
      return "Invalid phone number format";
    case 60202:
      // Too many failed verification attempts against this code
      return "Too many incorrect attempts. Please request a new OTP";
    case 60203:
      return "Maximum OTP send attempts reached. Please try again later";
    case 60410:
      return "This OTP request is no longer valid. Please request a new one";
    default:
      return "OTP verification failed. Please try again";
  }
};

// Maps Twilio's send-verification error codes similarly.
const mapTwilioSendError = (error) => {
  switch (error.code) {
    case 60200:
      return "Invalid phone number format";
    case 60203:
      return "Maximum OTP send attempts reached. Please try again later";
    case 60212:
      return "Too many concurrent OTP requests for this number. Please wait a moment";
    case 21211:
      return "This phone number is invalid";
    case 21614:
      return "This phone number cannot receive SMS messages";
    default:
      return "Failed to send OTP. Please try again";
  }
};

module.exports = {
  sendOtpToPhone,
  verifyOtp,
};