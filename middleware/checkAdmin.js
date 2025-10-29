const checkAdmin = (req, res, next) => {
  try {
    // Verificar que esté autenticado
    if (!req.usuario) {
      return res.status(401).json({
        success: false,
        msg: 'No autenticado'
      });
    }

    // Verificar que esté activo
    if (!req.usuario.activo) {
      return res.status(403).json({
        success: false,
        msg: 'Cuenta suspendida'
      });
    }

    if (req.usuario.rol !== 'administrador') {
      return res.status(403).json({
        success: false,
        msg: 'Acceso denegado, requiere rol de administrador'
      });
    }

    next();

  } catch (error) {
    console.log('Error en checkAdmin middleware:', error);
    return res.status(500).json({
      success: false,
      msg: 'Error del servidor'
    });
  }
}

export default checkAdmin;