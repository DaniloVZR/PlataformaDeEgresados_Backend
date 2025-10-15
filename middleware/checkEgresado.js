// middleware/checkEgresado.js
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
      return res.status(404).json({
        success: false,
        message: 'Perfil de egresado no encontrado. Por favor completa tu perfil primero.'
      });
    }

    // Opcional: verificar que el perfil esté completo
    if (!egresado.completadoPerfil) {
      return res.status(403).json({
        success: false,
        message: 'Debes completar tu perfil antes de crear publicaciones'
      });
    }

    req.egresado = egresado;
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