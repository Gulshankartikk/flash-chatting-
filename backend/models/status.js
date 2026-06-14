const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema({
  user:{type:mongoose.Schema.ObjectId, ref:'User',required:true},
  content:{type:String,required:true},
  contentType:{type:string,enum:['image','video','text'],default:'text'},
  viewers:[{type:mongoose.schema.Type.ObjectId, ref:'User'}]
  }
    
);

// Prevent OverwriteModelError
const Status = mongoose.model('status',statusSchema)

module.exports = Conversation;