import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "egresados_fotos_perfil",
    allowed_formats: ["jpg", "png", "jpeg"],
    transformation: [{ width: 500, height: 500, crop: "limit" }]
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // máximo 5MB
  fileFilter: (req, file, cb) => {
    const ext = file.mimetype;
    if (
      ext !== "image/png" &&
      ext !== "image/jpg" &&
      ext !== "image/jpeg"
    ) {
      return cb(new Error("Formato de imagen no permitido (solo jpg, jpeg, png)"));
    }
    cb(null, true);
  }
});

export default upload;
