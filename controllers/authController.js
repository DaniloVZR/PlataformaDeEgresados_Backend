import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"
import Usuario from "../models/Usuario.js";

export const registrarUsuario = async (req, res) => {
  try {
    // Extracción de campos
    const { nombre, correo, password } = req.body;

    // Validación de campos
    if (!nombre || !correo || !password) {
      return res.status(400).json({ msg: "Todos los campos son obligatorios" });
    }

    // Revisar si existe
    const existeUsuario = await Usuario.findOne({ correo });

    if (existeUsuario) {
      return res.status(400).json({ msg: "El usuario ya está registrado" });
    }

    // Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const passwordHasheado = await bcrypt.hash(password, salt);

    // Validar dominio de correo
    const emailRegex = /^[\w._%+-]+@pascualbravo\.edu\.co$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "El correo debe ser institucional (@pascualbravo.edu.co)" });
    }

    const nuevoUsuario = new Usuario({
      nombre,
      correo,
      password: passwordHasheado
    });

    await nuevoUsuario.save();
    res.status(201).json({ msg: "Usuario registrado correctamente" });

  } catch (error) {
    console.log(error);
  }
}

export const loginUsuario = async (req, res) => {
  try {
    const { correo, password } = req.body;

    // Validar campos
    if (!correo || !password) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    // Buscar usuario
    const usuario = await Usuario.findOne({ correo });

    if (!usuario) {
      return res.status(400).json({ message: "Credenciales inválidas" });
    }

    // Comparar contraseñas
    const isMatch = await bcrypt.compare(password, usuario.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Credenciales inválidas" });
    }

    const token = jwt.sign(
      { id: usuario._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        correo: usuario.correo
      }
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error en el servidor" });
  }
}