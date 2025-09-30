import mongoose from "mongoose";

const conectarDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log("DB Conectada");
  } catch (error) {
    console.log("Error: ", error.message);
    process.exit(1);
  }
}

export default conectarDB;