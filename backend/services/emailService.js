const nodemailer = require ("nodemailer");
const dotenv= require ("dotenv");

dotenv.config();

const transporter =nodemailer.createTransport({
    service:'gmail',
    auth:{
        user:process.env.EMAIL_USER,
        Pass:process.env.EMAIL_PASS,
    }
});
transporter