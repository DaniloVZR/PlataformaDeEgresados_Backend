import Usuario from "../models/Usuario.js";
import Egresado from "../models/Egresado.js";
import Publicacion from "../models/Publicacion.js";

// ==================== MÉTRICAS ====================

export const obtenerMetricasGenerales = async (req, res) => {
  try {
    const totalUsuarios = await Usuario.countDocuments();
    const totalPublicaciones = await Publicacion.countDocuments();
    const usuariosActivos = await Usuario.countDocuments({ activo: true });
    const usuariosBaneados = await Usuario.countDocuments({ activo: false });

    // Usuarios registrados en los últimos 30 días
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    const nuevosUsuarios = await Usuario.countDocuments({
      createdAt: { $gte: hace30Dias }
    });

    // Publicaciones de los últimos 30 días
    const nuevasPublicaciones = await Publicacion.countDocuments({
      createdAt: { $gte: hace30Dias }
    });

    // Publicaciones de los últimos 7 días
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);
    const publicacionesSemanales = await Publicacion.countDocuments({
      createdAt: { $gte: hace7Dias }
    });

    // Usuarios con perfil completo
    const perfilesCompletos = await Egresado.countDocuments({
      completadoPerfil: true
    });

    // Total de likes en todas las publicaciones
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
    // Top 5 usuarios con más publicaciones
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

    // Top 5 publicaciones con más likes
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

    // Distribución por programa académico
    const distribucionProgramas = await Egresado.aggregate([
      { $match: { programaAcademico: { $ne: "" } } },
      { $group: { _id: "$programaAcademico", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Distribución por año de graduación
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
    const {
      page = 1,
      limit = 10,
      rol,
      activo,
      buscar
    } = req.query;

    const filtros = {};

    if (rol) filtros.rol = rol;
    if (activo !== undefined) filtros.activo = activo === 'true';
    if (buscar) {
      filtros.$or = [
        { nombre: { $regex: buscar, $options: 'i' } },
        { correo: { $regex: buscar, $options: 'i' } }
      ];
    }

    const usuarios = await Usuario.find(filtros)
      .select('-password -token')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Usuario.countDocuments(filtros);

    res.json({
      success: true,
      usuarios,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
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

    // Total de likes recibidos
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
    const { id } = req.params;
    const { rol } = req.body;

    if (!['comun', 'administrador'].includes(rol)) {
      return res.status(400).json({
        success: false,
        msg: "Rol inválido. Debe ser 'comun' o 'administrador'"
      });
    }

    const usuario = await Usuario.findById(id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        msg: "Usuario no encontrado"
      });
    }

    // Prevenir que un admin se quite sus propios privilegios
    if (usuario._id.toString() === req.usuario._id.toString() && rol === 'comun') {
      return res.status(400).json({
        success: false,
        msg: "No puedes cambiar tu propio rol de administrador"
      });
    }

    usuario.rol = rol;
    await usuario.save();

    res.json({
      success: true,
      msg: `Rol actualizado exitosamente a ${rol}`,
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
      razon: razon || 'No especificada'
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
    const { page = 1, limit = 10, buscar } = req.query;

    const filtros = {};
    if (buscar) {
      filtros.descripcion = { $regex: buscar, $options: 'i' };
    }

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
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Publicacion.countDocuments(filtros);

    res.json({
      success: true,
      publicaciones,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
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
      razon: razon || 'No especificada'
    });
  } catch (error) {
    console.error('Error al eliminar publicación:', error);
    res.status(500).json({
      success: false,
      msg: "Error al eliminar la publicación"
    });
  }
};