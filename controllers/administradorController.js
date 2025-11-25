import Usuario from "../models/Usuario.js";
import Egresado from "../models/Egresado.js";
import Publicacion from "../models/Publicacion.js";

// ==================== HELPERS DE VALIDACIÓN ====================

/**
 * Valida y sanitiza el rol del usuario
 */
const validarRol = (rol) => {
  const rolesPermitidos = ['comun', 'administrador'];
  return rolesPermitidos.includes(rol) ? rol : null;
};

/**
 * Valida y sanitiza el estado activo
 */
const validarEstadoActivo = (activo) => {
  if (activo === 'true' || activo === true) return true;
  if (activo === 'false' || activo === false) return false;
  return undefined;
};

/**
 * Sanitiza texto de búsqueda para prevenir ReDoS y NoSQL injection
 */
const sanitizarBusqueda = (texto) => {
  if (!texto || typeof texto !== 'string') return '';
  // Remover caracteres especiales que pueden causar problemas
  return texto.replace(/[^\w\s@.-]/gi, '').trim().substring(0, 100);
};

// ==================== MÉTRICAS ====================

export const obtenerMetricasGenerales = async (req, res) => {
  try {
    const totalUsuarios = await Usuario.countDocuments();
    const totalPublicaciones = await Publicacion.countDocuments();
    const usuariosActivos = await Usuario.countDocuments({ activo: true });
    const usuariosBaneados = await Usuario.countDocuments({ activo: false });

    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    const nuevosUsuarios = await Usuario.countDocuments({
      createdAt: { $gte: hace30Dias }
    });

    const nuevasPublicaciones = await Publicacion.countDocuments({
      createdAt: { $gte: hace30Dias }
    });

    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    const publicacionesSemanales = await Publicacion.countDocuments({
      createdAt: { $gte: hace7Dias }
    });

    const perfilesCompletos = await Egresado.countDocuments({
      completadoPerfil: true
    });

    const publicaciones = await Publicacion.find().select('likes');
    const totalLikes = publicaciones.reduce((sum, pub) => sum + pub.likes.length, 0);

    res.json({
      success: true,
      metricas: {
        usuarios: {
          total: totalUsuarios,
          activos: usuariosActivos,
          baneados: usuariosBaneados,
          nuevos30Dias: nuevosUsuarios,
          perfilesCompletos
        },
        publicaciones: {
          total: totalPublicaciones,
          nuevas30Dias: nuevasPublicaciones,
          nuevas7Dias: publicacionesSemanales,
          totalLikes
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener métricas:', error);
    res.status(500).json({
      success: false,
      msg: "Error al obtener las métricas del sistema"
    });
  }
};

export const obtenerEstadisticasDetalladas = async (req, res) => {
  try {
    const topPublicadores = await Publicacion.aggregate([
      { $group: { _id: "$autor", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "egresados",
          localField: "_id",
          foreignField: "_id",
          as: "egresado"
        }
      },
      { $unwind: "$egresado" },
      {
        $project: {
          _id: 1,
          count: 1,
          nombre: "$egresado.nombre",
          apellido: "$egresado.apellido",
          fotoPerfil: "$egresado.fotoPerfil"
        }
      }
    ]);

    const topPublicaciones = await Publicacion.find()
      .select('descripcion imagen likes createdAt')
      .populate('autor', 'nombre apellido fotoPerfil')
      .sort({ 'likes': -1 })
      .limit(5)
      .lean();

    const topPublicacionesFormateadas = topPublicaciones.map(pub => ({
      _id: pub._id,
      descripcion: pub.descripcion.substring(0, 100),
      imagen: pub.imagen,
      cantidadLikes: pub.likes.length,
      autor: pub.autor,
      createdAt: pub.createdAt
    }));

    const distribucionProgramas = await Egresado.aggregate([
      { $match: { programaAcademico: { $ne: "" } } },
      { $group: { _id: "$programaAcademico", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const distribucionGraduacion = await Egresado.aggregate([
      { $match: { yearGraduacion: { $ne: null } } },
      { $group: { _id: "$yearGraduacion", count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]);

    res.json({
      success: true,
      estadisticas: {
        topPublicadores,
        topPublicaciones: topPublicacionesFormateadas,
        distribucionProgramas,
        distribucionGraduacion
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      msg: "Error al obtener las estadísticas detalladas"
    });
  }
};

// ==================== GESTIÓN DE USUARIOS ====================

export const listarUsuarios = async (req, res) => {
  try {
    // Convertir explícitamente a String para prevenir NoSQL injection
    const pageStr = String(req.query.page || '1');
    const limitStr = String(req.query.limit || '10');
    const rolStr = req.query.rol ? String(req.query.rol) : null;
    const activoStr = req.query.activo ? String(req.query.activo) : null;
    const buscarStr = req.query.buscar ? String(req.query.buscar) : null;

    // VALIDACIÓN Y SANITIZACIÓN
    const filtros = {};

    // Validar rol (solo strings seguros)
    if (rolStr) {
      const rolValidado = validarRol(rolStr);
      if (rolValidado) {
        filtros.rol = String(rolValidado); // Garantizar que es string
      }
    }

    // Validar activo (solo boolean)
    if (activoStr) {
      const activoValidado = validarEstadoActivo(activoStr);
      if (activoValidado !== undefined) {
        filtros.activo = Boolean(activoValidado); // Garantizar que es boolean
      }
    }

    // Sanitizar búsqueda (solo strings)
    if (buscarStr) {
      const busquedaSanitizada = sanitizarBusqueda(buscarStr);
      if (busquedaSanitizada) {
        // Usar strings literales en lugar de regex para mayor seguridad
        const searchPattern = String(busquedaSanitizada);
        filtros.$or = [
          { nombre: { $regex: searchPattern, $options: 'i' } },
          { correo: { $regex: searchPattern, $options: 'i' } }
        ];
      }
    }

    // Validar paginación (garantizar numbers)
    const pageNum = Math.max(1, parseInt(pageStr, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limitStr, 10) || 10));

    const usuarios = await Usuario.find(filtros)
      .select('-password -token')
      .sort({ createdAt: -1 })
      .limit(Number(limitNum))
      .skip(Number((pageNum - 1) * limitNum))
      .lean();

    const total = await Usuario.countDocuments(filtros);

    res.json({
      success: true,
      usuarios,
      totalPages: Math.ceil(total / limitNum),
      currentPage: Number(pageNum),
      total
    });
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({
      success: false,
      msg: "Error al obtener la lista de usuarios"
    });
  }
};

export const obtenerDetalleUsuario = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar que sea un ObjectId válido
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        msg: "ID de usuario inválido"
      });
    }

    const usuario = await Usuario.findById(id)
      .select('-password -token')
      .lean();

    if (!usuario) {
      return res.status(404).json({
        success: false,
        msg: "Usuario no encontrado"
      });
    }

    const egresado = await Egresado.findOne({ usuario: id }).lean();
    const publicaciones = await Publicacion.countDocuments({ autor: egresado?._id });

    let totalLikes = 0;
    if (egresado) {
      const pubs = await Publicacion.find({ autor: egresado._id }).select('likes');
      totalLikes = pubs.reduce((sum, pub) => sum + pub.likes.length, 0);
    }

    res.json({
      success: true,
      usuario: {
        ...usuario,
        perfil: egresado,
        estadisticas: {
          publicaciones,
          likesRecibidos: totalLikes
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener detalle de usuario:', error);
    res.status(500).json({
      success: false,
      msg: "Error al obtener los detalles del usuario"
    });
  }
};

export const cambiarRolUsuario = async (req, res) => {
  try {
    // Convertir a String explícitamente
    const idStr = String(req.params.id);
    const rolStr = String(req.body.rol);

    // VALIDACIÓN 1: Validar ObjectId
    if (!idStr || !idStr.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        msg: "ID de usuario inválido"
      });
    }

    // VALIDACIÓN 2: Validar rol
    const rolValidado = validarRol(rolStr);
    if (!rolValidado) {
      return res.status(400).json({
        success: false,
        msg: "Rol inválido. Debe ser 'comun' o 'administrador'"
      });
    }

    const usuario = await Usuario.findById(idStr);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        msg: "Usuario no encontrado"
      });
    }

    // Prevenir que un admin se quite sus propios privilegios
    if (usuario._id.toString() === req.usuario._id.toString() && rolValidado === 'comun') {
      return res.status(400).json({
        success: false,
        msg: "No puedes cambiar tu propio rol de administrador"
      });
    }

    // USAR VALOR VALIDADO y convertido a String
    usuario.rol = String(rolValidado);
    await usuario.save();

    res.json({
      success: true,
      msg: `Rol actualizado exitosamente a ${rolValidado}`,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('Error al cambiar rol:', error);
    res.status(500).json({
      success: false,
      msg: "Error al cambiar el rol del usuario"
    });
  }
};

export const toggleBanUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { razon } = req.body;

    // Validar ObjectId
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        msg: "ID de usuario inválido"
      });
    }

    // Sanitizar razón
    const razonSanitizada = razon ? sanitizarBusqueda(razon) : 'No especificada';

    const usuario = await Usuario.findById(id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        msg: "Usuario no encontrado"
      });
    }

    // Prevenir que un admin se banee a sí mismo
    if (usuario._id.toString() === req.usuario._id.toString()) {
      return res.status(400).json({
        success: false,
        msg: "No puedes suspender tu propia cuenta"
      });
    }

    // Prevenir banear a otro administrador
    if (usuario.rol === 'administrador') {
      return res.status(403).json({
        success: false,
        msg: "No puedes suspender a otro administrador"
      });
    }

    usuario.activo = !usuario.activo;
    await usuario.save();

    const accion = usuario.activo ? 'reactivada' : 'suspendida';

    res.json({
      success: true,
      msg: `Cuenta ${accion} exitosamente`,
      usuario: {
        id: usuario._id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        activo: usuario.activo
      },
      razon: razonSanitizada
    });
  } catch (error) {
    console.error('Error al suspender/reactivar usuario:', error);
    res.status(500).json({
      success: false,
      msg: "Error al cambiar el estado del usuario"
    });
  }
};

// ==================== GESTIÓN DE PUBLICACIONES ====================

export const listarPublicacionesAdmin = async (req, res) => {
  try {
    // Convertir explícitamente a String
    const pageStr = String(req.query.page || '1');
    const limitStr = String(req.query.limit || '10');
    const buscarStr = req.query.buscar ? String(req.query.buscar) : null;

    const filtros = {};

    // Sanitizar búsqueda
    if (buscarStr) {
      const busquedaSanitizada = sanitizarBusqueda(buscarStr);
      if (busquedaSanitizada) {
        filtros.descripcion = { $regex: String(busquedaSanitizada), $options: 'i' };
      }
    }

    // Validar paginación (garantizar numbers)
    const pageNum = Math.max(1, parseInt(pageStr, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limitStr, 10) || 10));

    const publicaciones = await Publicacion.find(filtros)
      .populate('autor', 'nombre apellido fotoPerfil email')
      .populate({
        path: 'autor',
        populate: {
          path: 'usuario',
          select: 'correo activo'
        }
      })
      .sort({ createdAt: -1 })
      .limit(Number(limitNum))
      .skip(Number((pageNum - 1) * limitNum))
      .lean();

    const total = await Publicacion.countDocuments(filtros);

    res.json({
      success: true,
      publicaciones,
      totalPages: Math.ceil(total / limitNum),
      currentPage: Number(pageNum),
      total
    });
  } catch (error) {
    console.error('Error al listar publicaciones:', error);
    res.status(500).json({
      success: false,
      msg: "Error al obtener la lista de publicaciones"
    });
  }
};

export const eliminarPublicacionAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { razon } = req.body;

    // Validar ObjectId
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        msg: "ID de publicación inválido"
      });
    }

    // Sanitizar razón
    const razonSanitizada = razon ? sanitizarBusqueda(razon) : 'No especificada';

    const publicacion = await Publicacion.findById(id);

    if (!publicacion) {
      return res.status(404).json({
        success: false,
        msg: "Publicación no encontrada"
      });
    }

    // Eliminar imagen de Cloudinary si existe
    if (publicacion.imagen) {
      try {
        const { v2: cloudinary } = await import('cloudinary');
        const publicId = publicacion.imagen.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`publicaciones/${publicId}`);
      } catch (cloudinaryError) {
        console.error('Error al eliminar imagen:', cloudinaryError);
      }
    }

    await publicacion.deleteOne();

    res.json({
      success: true,
      msg: "Publicación eliminada exitosamente por el administrador",
      razon: razonSanitizada
    });
  } catch (error) {
    console.error('Error al eliminar publicación:', error);
    res.status(500).json({
      success: false,
      msg: "Error al eliminar la publicación"
    });
  }
};