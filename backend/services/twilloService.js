const twilio = require("twilio");

//Twilio creaditials form env
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const serviceSid = process.env.TWILIO_SERVICE_SID;

const client = twilio(accountSid, authToken);

//SEND OTP TO PHONE NUMBER
const sendOtpToPhone = async (phoneNumber) => {
  try {
    console.log("sending otp to this number", phoneNumber);
    if (!phoneNumber) {
      throw new Error("phone number is required");
    }
    const response = await client.verify.v2
      .services(serviceSid)
      .verification.create({
        to: phoneNumber,
        channel: "sms",
      });
    console.log("this is my otp response", response);
    return response;
  } catch (error) {
    console.error(error);
    throw new Error('failed to send otp')
  }
}


const verifyotp = async (phoneNumber,otp) => {
  try {
    console.log("this is my otp",otp);
    console.log("this number",phoneNumber);
    const response = await client.verify.v2
      .services(serviceSid)
      .verificationChecks.create({
        to: phoneNumber,
        code: otp,
      });
    console.log("this is my otp response", response);
    return response;
  } catch (error) {
    console.error(error);
    throw new Error("otp verification failed ")
  }
};

module.export={
    sendOtpToNumber,
    verifyOtp
}
