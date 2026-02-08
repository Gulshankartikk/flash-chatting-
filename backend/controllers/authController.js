const otpGenerate = require("../utils/otpGenerater");




//step -1 send otp
const sendOtp =async(req,res)=> {
    const {phoneNumber,phoneSuffix,email} =req.body;
    const otp = otpGenerate();
    const expiry = new Date(Date.now() + 5 * 60 * 1000);
    let user;
    try{
        if(email) {
            user = await User.findOne({email});

            if(!user){
                user = new User({email})
            }
            user.emailOtp =otp;
            user.emailOtpExpiry = expiry;
            await user.save();

            return response(res,200, 'Otp sent to your email',{email});
        }
        if(!phoneNumber ||!phoneSuffix) {
            return response(res,400,'Phone number and suffix are required');
        }
        const fullPhonenumber = `${phoneSuffix}${phoneNumber}`;
        user = await User.findOne({phoneNumber});
        if(!user){
            user = await new User ({phoneNumber,phoneSuffix})
        }

        await user.save();

        return response(res,200,'Otp send successfully',user)
    } catch (error){
        console.error(error);
        return response(res,500,'Internal server error')
    }
}