import Comentario from "../models/Comentario.js";
import Publicacion from "../models/Publicacion.js";

// Crear comentario
export const crearComentario = async (req, res) => {
  try {
    const { publicacionId } = req.params;
    const { contenido } = req.body;

    if (!contenido || contenido.trim() === "") {
      return res.status(400).json({
        success: false,
        msg: "El comentario no puede estar vacío"
      });
    }

    if (contenido.length > 500) {
      return res.status(400).json({
        success: false,
        msg: "El comentario no puede exceder 500 caracteres"
      });
    }

    // Verificar que la publicación existe
    const publicacion = await Publicacion.findById(publicacionId);
    if (!publicacion) {
      return res.status(404).json({
        success: false,
        msg: "Publicación no encontrada"
      });
    }

    // Verificar que tenemos un egresado válido
    if (!req.egresado || !req.egresado._id) {
      return res.status(400).json({
        success: false,
        msg: "No se pudo identificar al autor del comentario"
      });
    }

    const nuevoComentario = new Comentario({
      publicacion: publicacionId,
      autor: req.egresado._id,
      contenido: contenido.trim()
    });

    await nuevoComentario.save();

    // Buscar el comentario recién creado con populate
    const comentarioPopulado = await Comentario.findById(nuevoComentario._id)
      .populate('autor', 'nombre apellido fotoPerfil')
      .lean();

    res.status(201).json({
      success: true,
      msg: "Comentario agregado",
      comentario: comentarioPopulado
    });

  } catch (error) {
    console.error('Error al crear comentario:', error);
    res.status(500).json({
      success: false,
      msg: "Error al crear el comentario"
    });
  }
};

// Obtener comentarios de una publicación
export const obtenerComentarios = async (req, res) => {
  try {
    const { publicacionId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const comentarios = await Comentario.find({ publicacion: publicacionId })
      .populate('autor', 'nombre apellido fotoPerfil')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Comentario.countDocuments({ publicacion: publicacionId });

    res.json({
      success: true,
      comentarios,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total
    });

  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    res.status(500).json({
      success: false,
      msg: "Error al obtener los comentarios"
    });
  }
};

// Eliminar comentario
export const eliminarComentario = async (req, res) => {
  try {
    const { comentarioId } = req.params;

    const comentario = await Comentario.findById(comentarioId);

    if (!comentario) {
      return res.status(404).json({
        success: false,
        msg: "Comentario no encontrado"
      });
    }

    // Solo el autor puede eliminar su comentario
    if (comentario.autor.toString() !== req.egresado._id.toString()) {
      return res.status(403).json({
        success: false,
        msg: "No tienes permiso para eliminar este comentario"
      });
    }

    await comentario.deleteOne();

    res.json({
      success: true,
      msg: "Comentario eliminado"
    });

  } catch (error) {
    console.error('Error al eliminar comentario:', error);
    res.status(500).json({
      success: false,
      msg: "Error al eliminar el comentario"
    });
  }
};

// Contar comentarios de una publicación
export const contarComentarios = async (req, res) => {
  try {
    const { publicacionId } = req.params;

    const total = await Comentario.countDocuments({ publicacion: publicacionId });

    res.json({
      success: true,
      total
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      msg: "Error al contar comentarios"
    });
  }
};