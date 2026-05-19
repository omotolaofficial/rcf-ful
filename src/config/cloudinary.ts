export const cloudinaryConfig = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
};

if (!cloudinaryConfig.cloudName || !cloudinaryConfig.uploadPreset) {
  console.log("🔥 CLOUDINARY CONFIG LOAD FAILURE:", cloudinaryConfig);
  throw new Error("Cloudinary configuration missing");
}
