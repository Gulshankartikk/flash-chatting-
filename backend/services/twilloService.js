const twilio = require("twilio");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID;

const client = twilio(accountSid, authToken);

const mapTwilioSendError = (error) => {
  switch (error.code) {
    case 60200:
      return "Invalid phone number format.";
    case 60203:
      return "Max send attempts reached. Please try again later.";
    case 60212:
      return "Too many requests. Please wait before trying again.";
    case 21211:
      return "This phone number is invalid.";
    default:
      return "Failed to send OTP. Please try again.";
  }
};

const mapTwilioVerifyError = (error) => {
  switch (error.code) {
    case 60200:
      return "Invalid phone number format.";
    case 60202:
      return "Max verification attempts reached. Please request a new OTP.";
    case 20404:
      return "OTP expired or not found. Please request a new one.";
    default:
      return "Invalid OTP. Please try again.";
  }
};

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
    throw new Error(mapTwilioSendError(error));
  }
};

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
    throw new Error(mapTwilioVerifyError(error));
  }
};

module.exports = {
  sendOtpToPhone,
  verifyOtp,
};