import Usuario from "../models/Usuario.js";
import { generarJWT, generarId } from "../helpers/index.js";
import { emailRegistro, emailOlvidePassword } from "../helpers/email.js";

export const registrar = async (req, res) => {
  try {
    // Extracción de campos
    const { nombre, correo, password } = req.body;

    // Revisar si existe
    const existeUsuario = await Usuario.findOne({ correo });

    if (existeUsuario) {
      return res.status(400).json({
        success: false,
        msg: "El usuario ya está registrado"
      });
    }

    // Crear el usuario
    const nuevoUsuario = new Usuario({
      nombre,
      correo,
      password,
      token: generarId()
    });

    await nuevoUsuario.save();

    // Enviar el email
    await emailRegistro({
      email: nuevoUsuario.correo,
      nombre: nuevoUsuario.nombre,
      asunto: "Confirma tu cuenta en Plataforma de Egresados",
      mensaje: `Para confirmar tu cuenta, haz clic en el siguiente enlace: ${process.env.FRONTEND_URL}/confirmar/${nuevoUsuario.token}`,
      token: nuevoUsuario.token
    });

    res.status(201).json({
      success: true,
      msg: "Usuario registrado correctamente, revisa tu email para confirmar tu cuenta"
    });

  } catch (error) {
    console.log('Error en registrar usuario:', error.message);
    res.status(500).json({
      success: false,
      msg: "Error al procesar el registro"
    });
  }
};

export const autenticar = async (req, res) => {
  try {
    const { correo, password } = req.body;

    // Buscar usuario
    const usuario = await Usuario.findOne({ correo });

    if (!usuario) {
      return res.status(400).json({
        success: false,
        msg: "Credenciales inválidas"
      });
    }

    if (!usuario.confirmado) {
      return res.status(403).json({
        success: false,
        msg: "Debes confirmar tu cuenta antes de iniciar sesión"
      });
    }

    // Comparar contraseñas
    const passwordValida = await usuario.compararPassword(password);

    if (!passwordValida) {
      return res.status(400).json({
        success: false,
        msg: "Credenciales inválidas"
      });
    }

    const token = generarJWT(usuario);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 días
    })

    res.json({
      success: true,
      msg: "Login exitoso",
      token,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        correo: usuario.correo,
      },
      token
    });

  } catch (error) {
    console.log("Error en la autenticación:", error.message);
    res.status(500).json({
      success: false,
      msg: "Error en el servidor"
    });
  }
};

export const logout = (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });

  res.json({
    success: true,
    msg: "Sesión cerrada correctamente"
  });
};

export const confirmar = async (req, res) => {
  try {
    const { token } = req.params;

    const usuario = await Usuario.findOne({ token });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        msg: "Token no válido"
      });
    }

    usuario.confirmado = true;
    usuario.token = "";
    await usuario.save();

    res.json({
      success: true,
      msg: "Usuario confirmado correctamente",
      confirmado: true
    });

  } catch (error) {
    console.error('Error al confirmar cuenta:', error.message);
    res.status(500).json({
      success: false,
      msg: "Error al confirmar la cuenta"
    });
  }
}

export const recuperarPassword = async (req, res) => {
  try {
    const { correo } = req.body;

    const usuario = await Usuario.findOne({ correo });

    if (!usuario || !usuario.confirmado) {
      return res.json({
        success: false,
        msg: "No se encontró un usuario con ese correo o no está confirmado"
      });
    }

    usuario.token = generarId();
    await usuario.save();

    await emailOlvidePassword({
      nombre: usuario.nombre,
      email: usuario.correo,
      token: usuario.token
    });

    res.json({
      success: true,
      msg: "Revisa el correo con el que se registró, recibirás instrucciones para recuperar tu contraseña"
    });
  } catch (error) {
    console.error('Error en recuperar password:', error.message);
    res.status(500).json({
      success: false,
      msg: "Error al procesar la solicitud"
    });
  }
}

export const comprobarToken = async (req, res) => {
  try {
    const { token } = req.params;

    const usuario = await Usuario.findOne({ token });

    if (usuario) {
      return res.json({
        success: true,
        msg: "Token válido",
        valido: true
      });
    }

    return res.status(403).json({
      success: false,
      msg: "Token no válido o expirado",
      valido: false
    });
  } catch (error) {
    console.error('Error al comprobar token:', error.message);
    res.status(500).json({
      success: false,
      msg: "Error al verificar el token"
    });
  }
};

export const nuevaPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const usuario = await Usuario.findOne({ token });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        msg: "Token no válido o expirado"
      });
    }

    usuario.password = password;
    usuario.token = "";
    await usuario.save();

    res.json({
      success: true,
      msg: "Contraseña actualizada correctamente"
    });

  } catch (error) {
    console.error('Error al cambiar password:', error.message);
    res.status(500).json({
      success: false,
      msg: "Error al actualizar la contraseña"
    });
  }
};

export const perfil = (req, res) => {
  const { usuario } = req;
  res.json({
    success: true,
    usuario
  });
} 