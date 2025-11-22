import mongoose from "mongoose";

const comentarioSchema = new mongoose.Schema({
  publicacion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Publicacion",
    required: true,
  },
  autor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Egresado",
    required: true,
  },
  contenido: {
    type: String,
    required: true,
    trim: true,
    maxLength: 500,
  },
}, { timestamps: true });

comentarioSchema.index({ publicacion: 1, createdAt: -1 });

const Comentario = mongoose.model("Comentario", comentarioSchema);

export default Comentario;