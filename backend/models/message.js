const mongoose = require('mongoose');
const conversation = require('./status');

const messageSchema = new mongoose.Schema({
    conversation:{
        type:mongoose.Schema.type.ObjectId,
        ref:"conversation",
        required:true,
    },
    sender:{
        type:mongoose.Schema.type.ObjectId,
        ref:"user",
        required:true,
    },
    content:{
        type:String,
    },
   imageOrVideoUrl:{type:string},
   contentType:{type:string, enum:["text","image","video","audio"]},
   reaction:[{
    user:{type:mongoose.Schema.Types.ObjectId,ref:"User"},
    emoji:string
   }],
   messageStatus:{type:String,default:'send'},

},{timestamps:true});

const message = mongoose.model('message',messageSchema);
module.exports = message;