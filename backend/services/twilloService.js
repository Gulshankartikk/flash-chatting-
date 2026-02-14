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

    console.log("OTP sent response:", response);
    return response;
  } catch (error) {
    console.error("Send OTP Error:", error.message);
    throw new Error("Failed to send OTP");
  }
};

// VERIFY OTP
const verifyOtp = async (phoneNumber, otp) => {
  try {
    console.log("Verifying OTP:", otp, "for", phoneNumber);

    const response = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({
        to: phoneNumber,
        code: otp,
      });

    console.log("OTP verify response:", response);
    return response;
  } catch (error) {
    console.error("OTP Verify Error:", error.message);
    throw new Error("OTP verification failed");
  }
};

module.exports = {
  sendOtpToPhone,
  verifyOtp,
};
