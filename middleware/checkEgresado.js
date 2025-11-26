import Egresado from '../models/Egresado.js';

const checkEgresado = async (req, res, next) => {
  try {
    // Asume que checkAuth ya se ejecutó y req.usuario existe
    if (!req.usuario) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    const egresado = await Egresado.findOne({ usuario: req.usuario._id });

    if (!egresado) {
      egresado = new Egresado({
        usuario: req.usuario._id,
        nombre: req.usuario.nombre,
        email: req.usuario.correo,
        completadoPerfil: false
      });
      await egresado.save();
    }

    req.egresado = egresado;

    // Opcional: verificar que el perfil esté completo
    if (!egresado.completadoPerfil) {
      return res.status(403).json({
        success: false,
        message: 'Debes completar tu perfil antes de crear publicaciones'
      });
    }

    next();

  } catch (error) {
    console.error('Error en checkEgresado:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al verificar perfil de egresado'
    });
  }
};

export default checkEgresado;