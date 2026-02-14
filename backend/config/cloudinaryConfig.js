const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadFileToCloudinary = (file) => {
  const isVideo = file.mimetype.startsWith("video");

  const options = {
    resource_type: isVideo ? "video" : "image",
  };

  return new Promise((resolve, reject) => {
    const uploader = isVideo
      ? cloudinary.uploader.upload_large
      : cloudinary.uploader.upload;

    uploader(file.path, options, (error, result) => {
      fs.unlink(file.path, () => {});
      if (error) return reject(error);
      resolve(result);
    });
  });
};

// ✅ FIXED HERE
const multerMiddleware = multer({ dest: "upload/" }).single("media");

module.exports = {
  uploadFileToCloudinary,
  multerMiddleware,
};
