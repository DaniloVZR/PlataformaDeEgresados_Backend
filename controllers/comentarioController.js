import Comentario from '../models/Comentario.js';
import Publicacion from '../models/Publicacion.js';

export const crearComentario = async (req, res) => {
  try {
    const { publicacionId } = req.params;
    const { contenido } = req.body;

    if (!contenido || contenido.trim() === '') {
      return res.status(400).json({
        success: false,
        msg: 'El contenido del comentario no puede estar vacío'
      });
    }

    if (contenido.length > 500) {
      return res.status(400).json({
        success: false,
        msg: 'El contenido del comentario no puede exceder los 500 caracteres'
      });
    }

    const publicacion = await Publicacion.findById(publicacionId);

    if (!publicacion) {
      return res.status(404).json({
        success: false,
        msg: 'La publicación no existe'
      });
    }

    const nuevoComentario = new Comentario({
      contenido,
      publicacion: publicacionId,
      autor: req.usuario.id
    });

    await nuevoComentario.save();
    await nuevoComentario.populate('autor', 'nombre apellido fotoPerfil');

    res.status(201).json({
      success: true,
      msg: "Comentario creado exitosamente",
      comentario: nuevoComentario
    });

  } catch (error) {
    console.error('Error al crear el comentario:', error);
    res.status(500).json({
      success: false,
      msg: 'Error del servidor al crear el comentario'
    });
  }
}

export const obtenerComentarios = async (req, res) => {
  try {
    const { publicacionId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const comentarios = await Comentario.find({ publicacion: publicacionId })
      .populate('autor', 'nombre apellido fotoPerfil')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();

    const total = await Comentario.countDocuments({ publicacion: publicacionId });

    res.status(200).json({
      success: true,
      comentarios,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });

  } catch (error) {
    console.error('Error al obtener los comentarios:', error);
    res.status(500).json({
      success: false,
      msg: 'Error del servidor al obtener los comentarios'
    });
  }
}

export const eliminarComentario = async (req, res) => {
  try {
    const { comentarioId } = req.params;

    const comentario = await Comentario.findById(comentarioId);

    if (!comentario) {
      return res.status(404).json({
        success: false,
        msg: 'El comentario no existe'
      });
    }

    if (comentario.autor.toString() !== req.egreedo._id.toString()) {
      return res.status(403).json({
        success: false,
        msg: 'No tienes permiso para eliminar este comentario'
      });
    }

    await comentario.deleteOne();

    res.status(200).json({
      success: true,
      msg: 'Comentario eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar el comentario:', error);
    res.status(500).json({
      success: false,
      msg: 'Error del servidor al eliminar el comentario'
    });
  }
}

export const contarComentarios = async (req, res) => {
  try {

    const { publicacionId } = req.params;

    const total = await Comentario.countDocuments({ publicacion: publicacionId });

    res.status(200).json({
      success: true,
      total
    });

  } catch (error) {
    console.error('Error al contar los comentarios:', error);
    res.status(500).json({
      success: false,
      msg: 'Error del servidor al contar los comentarios'
    });
  }
}