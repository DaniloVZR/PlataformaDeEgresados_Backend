import mongoose from "mongoose";

const egresadoSchema = mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Usuario",
    required: true,
    unique: true
  },
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  apellido: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function (v) {
        return /@pascualbravo\.edu\.co$/.test(v);
      },
      message: props => `${props.value} no es un correo institucional válido (@pascualbravo.edu.co)`
    }
  },
  descripcion: {
    type: String,
    default: ""
  },
  programaAcademico: {
    type: String,
    required: true,
  },
  yearGraduacion: {
    type: Number,
    required: true,
  },
  redesSociales: {
    linkedin: { type: String, default: "" },
    github: { type: String, default: "" },
    twitter: { type: String, default: "" },
    instagram: { type: String, default: "" }
  },
  fotoPerfil: {
    type: String,
    default: ""
  },
  completadoPerfil: {
    type: Boolean,
    default: false
  },
  actualizadoEn: {
    type: Date,
    default: Date.now
  }
});

const Egresado = mongoose.model("Egresado", egresadoSchema);

export default Egresado;