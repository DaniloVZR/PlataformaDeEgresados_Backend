import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const usuarioSchema = mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  correo: {
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
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  token: {
    type: String,
  },
  confirmado: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

usuarioSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSaltSync(10);
  this.password = await bcrypt.hashSync(this.password, salt);
  next();
})

usuarioSchema.methods.compararPassword = async function (passwordFormulario) {
  return await bcrypt.compare(passwordFormulario, this.password);
}

const Usuario = mongoose.model("Usuario", usuarioSchema);

export default Usuario;