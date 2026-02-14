const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phoneNumber: { type: String, unique: true, sparse: true },
  phoneSuffix: { type: String }, // fixed naming style

  username: { type: String },

  email: {
    type: String,
    lowercase: true,
    validate: {
      validator: function (value) {
        return /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(value);
      },
      message: "Invalid email address format"
    }
  },

  emailOtp: { type: String },
  emailOtpExpiry: { type: Date },

  profilePicture: { type: String },
  password: { type: String },
  about: { type: String },

  lastSeen: { type: Date },

  isOnline: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: false },
  agreed: { type: Boolean, default: false }

}, { timestamps: true });

const User = mongoose.model("User", userSchema);
module.exports = User;
