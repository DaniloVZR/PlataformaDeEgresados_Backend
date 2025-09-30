import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario.js";

const checkAuth = async (req, res, next) => {
  // 1. Verificar si existe el header Authorization
  if (!req.headers.authorization || !req.headers.authorization.startsWith("Bearer")) {
    return res.status(401).json({
      success: false,
      msg: "No autorizado - Token no proporcionado"
    });
  }

  try {
    // 2. Extraer el token
    const token = req.headers.authorization.split(" ")[1];

    // 3. Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Buscar el usuario en la base de datos
    const usuario = await Usuario.findById(decoded.id).select(
      "-password -token -createdAt -updatedAt -__v"
    );

    // 5. Verificar si el usuario existe
    if (!usuario) {
      return res.status(404).json({
        success: false,
        msg: "Usuario no encontrado"
      });
    }

    // 6. Opcional: Verificar si la cuenta está confirmada
    if (!usuario.confirmado) {
      return res.status(403).json({
        success: false,
        msg: "Cuenta no confirmada"
      });
    }

    // 7. Agregar el usuario al request
    req.usuario = usuario;

    next();

  } catch (error) {
    // Manejar diferentes tipos de errores JWT
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        msg: "Token expirado"
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        msg: "Token inválido"
      });
    }

    // Error genérico
    return res.status(401).json({
      success: false,
      msg: "No autorizado"
    });
  }
};

export default checkAuth;