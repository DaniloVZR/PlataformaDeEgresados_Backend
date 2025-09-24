import Usuario from "../models/Usuario.js";
import { generarJWT, generarId } from "../helpers/index.js";
import { emailRegistro, emailOlvidePassword } from "../helpers/email.js";

export const registrar = async (req, res) => {
  try {
    // Extracción de campos
    const { nombre, correo, password } = req.body;

    // Validación de campos
    if (!nombre || !correo || !password) {
      return res.status(400).json({ msg: "Todos los campos son obligatorios" });
    }

    if (password.length < 8) {
      return res.status(400).json({ msg: "La contraseña debe tener al menos 8 caracteres" });
    }

    // Validar dominio de correo
    const emailRegex = /^[\w._%+-]+@pascualbravo\.edu\.co$/;
    if (!emailRegex.test(correo)) {
      return res.status(400).json({ message: "El correo debe ser institucional (@pascualbravo.edu.co)" });
    }

    // Revisar si existe
    const existeUsuario = await Usuario.findOne({ correo });

    if (existeUsuario) {
      return res.status(400).json({ msg: "El usuario ya está registrado" });
    }

    // Crear el usuario
    const nuevoUsuario = new Usuario({
      nombre,
      correo,
      password,
      token: generarId()
    });
    await nuevoUsuario.save();

    await emailRegistro({
      email: nuevoUsuario.correo,
      nombre: nuevoUsuario.nombre,
      asunto: "Confirma tu cuenta en Plataforma de Egresados",
      mensaje: `Para confirmar tu cuenta, haz clic en el siguiente enlace: ${process.env.FRONTEND_URL}/confirmar/${nuevoUsuario.token}`,
      token: nuevoUsuario.token
    });

    res.status(201).json({ msg: "Usuario registrado correctamente" });

  } catch (error) {
    console.log(error);
  }
}

export const autenticar = async (req, res) => {
  try {
    const { correo, password } = req.body;

    // Validar campos
    if (!correo || !password) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    // Buscar usuario
    const usuario = await Usuario.findOne({ correo });

    if (!usuario) {
      return res.status(400).json({ message: "El usuario no existe" });
    }

    if (!usuario.confirmado) {
      return res.status(403).json({ msg: "Debes confirmar tu cuenta antes de iniciar sesión" });
    }

    // Comparar contraseñas
    const passwordValida = await usuario.compararPassword(password);

    if (!passwordValida) {
      return res.status(400).json({ message: "Credenciales inválidas" });
    }

    const token = generarJWT(usuario);

    res.json({
      msg: "Login exitoso",
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        correo: usuario.correo,
      },
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error en el servidor" });
  }
}

export const confirmar = async (req, res) => {
  const { token } = req.params;

  const usuario = await Usuario.findOne({ token });

  if (!usuario) {
    return res.status(404).json({ msg: "Token no válido" });
  }

  try {
    usuario.confirmado = true;
    usuario.token = "";
    await usuario.save();
    res.json({ msg: "Usuario confirmado correctamente" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Error en el servidor" });
  }
}

export const recuperarPassword = async (req, res) => {
  const { correo } = req.body;

  const usuario = await Usuario.findOne({ correo });

  if (!usuario) {
    return res.status(404).json({ msg: "El usuario no existe" });
  }

  try {
    usuario.token = generarId();
    await usuario.save();

    await emailOlvidePassword({
      nombre: usuario.nombre,
      email: usuario.correo,
      token: usuario.token
    });

    res.json({ msg: "Se ha enviado un correo con las instrucciones" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Error en el servidor" });
  }
}

export const comprobarToken = async (req, res) => {
  const { token } = req.params;

  const usuario = await Usuario.findOne({ token });

  if (usuario) {
    res.json({ msg: "Token válido, el usuario existe" });
  } else {
    return res.status(403).json({ msg: "Token no válido" });
  }
}

export const nuevaPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const usuario = await Usuario.findOne({ token });

  if (!usuario) {
    return res.status(403).json({ msg: "Token no válido" });
  }

  if (password.length < 8) {
    return res.status(400).json({ msg: "La contraseña debe tener al menos 8 caracteres" });
  }

  try {
    usuario.password = password;
    usuario.token = "";
    await usuario.save();
    res.json({ msg: "Contraseña modificada correctamente" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Error en el servidor" });
  }
}

export const perfil = (req, res) => {
  const { usuario } = req;
  res.json(usuario);
} 