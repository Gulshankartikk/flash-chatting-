const mongoose = require ('mongoose');

const userSchema =new mongoose.Schema({
    phoneNumber:{type:String,unique:true,sparse:true},
    phonesuffix:{type:String,unique:false},
    username:{type:string},
    email:{
        type:string,
        lowercase:true,
        validate:function(value) {
            return /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/.test(value)
         
        },              
        message:"invalid email adderess format",
    },
    emailOtp:{type:string},
    emailOtpExpiry:{type:Date},
    profilePicture:{type:String},
    password:{type:String},
    about:{type:string},
    lastSeen:{type:date},
    isonline:{type:Boolean,default:false},
    isVerified:{type:Boolean,default:false},
    agreed:{type:Boolean,default:false},
    
},{timestamps:true});


const User = mongoose.model("User",userSchema);
module.exports = User;