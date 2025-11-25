import mongoose from "mongoose";

const mensajeSchema = new mongoose.Schema({
  emisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Egresado",
    required: true,
  },
  receptor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Egresado",
    required: true,
  },
  contenido: {
    type: String,
    required: true,
    trim: true,
    maxLength: 1000
  },
  leido: {
    type: Boolean,
    default: false
  },
  eliminadoPorEmisor: {
    type: Boolean,
    default: false
  },
  eliminadoPorReceptor: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Índices para mejorar el rendimiento
mensajeSchema.index({ emisor: 1, receptor: 1, createdAt: -1 });
mensajeSchema.index({ receptor: 1, leido: 1 });

const Mensaje = mongoose.model("Mensaje", mensajeSchema);

export default Mensaje;