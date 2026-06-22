const twilio = require("twilio");

// Twilio credentials from env
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID;

const client = twilio(accountSid, authToken);

// SEND OTP TO PHONE NUMBER
const sendOtpToPhone = async (phoneNumber) => {
  try {
    console.log("Sending OTP to:", phoneNumber);

    if (!phoneNumber) {
      throw new Error("Phone number is required");
    }

    const response = await client.verify.v2
      .services(serviceSid)
      .verifications.create({
        to: phoneNumber,
        channel: "sms",
      });

    console.log("OTP sent response:", response.status);
    return response;
  } catch (error) {
    console.error("Send OTP Error:", error.message, "Code:", error.code);
    throw new Error(mapTwilioSendError(error));
  }
};

// VERIFY OTP
const verifyOtp = async (phoneNumber, otp) => {
  try {
    console.log("Verifying OTP for", phoneNumber);

    const response = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({
        to: phoneNumber,
        code: otp,
      });

    console.log("OTP verify response:", response.status);
    return response;
  } catch (error) {
    console.error("OTP Verify Error:", error.message, "Code:", error.code);
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