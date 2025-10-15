import mongoose from "mongoose";

const publicacionSchema = new mongoose.Schema({
  autor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Egresado",
    required: true,
  },
  descripcion: {
    type: String,
    trim: true,
    required: true
  },
  imagen: {
    type: String,
    default: ""
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Egresado"
  }
  ],
}, { timestamps: true });

const Publicacion = mongoose.model("Publicacion", publicacionSchema);

export default Publicacion;