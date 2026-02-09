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
transporter .verify((error,success)=>{
    if(error){
        console.error('Gmail services connection failed')

    }else{
        console.log('Gmail configured properly and ready to send email')
    }
})