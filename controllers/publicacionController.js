import Publicacion from "../models/Publicacion.js";
import { v2 as cloudinary } from 'cloudinary';

export const crearPublicacion = async (req, res) => {
  try {
    const { descripcion } = req.body;

    // Validar que la descripción es obligatoria
    if (!descripcion || descripcion.trim() === "") {
      return res.status(400).json({
        success: false,
        msg: "La descripción es obligatoria"
      });
    }

    let imagenUrl = '';

    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'publicaciones',
          transformation: [{ width: 1200, height: 1200, crop: "limit" }, { quality: "auto" }]
        });

        imagenUrl = result.secure_url;

      } catch (error) {
        console.error('Error al subir imagen:', uploadError);
      }
    }

    const nuevaPublicacion = new Publicacion({
      autor: req.egresado._id,
      descripcion: descripcion.trim(),
      imagen: imagenUrl
    });

    await nuevaPublicacion.save();

    await nuevaPublicacion.populate('autor', 'nombre apellido fotoPerfil');

    res.status(201).json({
      success: true,
      msg: "Publicación creada exitosamente",
      publicacion: nuevaPublicacion
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      msg: "Error al crear la publicación",
      error: error.message
    });
  }
}
// Feed
export const obtenerPublicaciones = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const publicaciones = await Publicacion.find()
      .populate('autor', 'nombre apellido fotoPerfil programaAcademico yearGraduacion')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Publicacion.countDocuments();

    res.json({
      success: true,
      publicaciones,
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      msg: "Error al obtener las publicaciones",
      error: error.message
    });
  }
}

export const eliminarPublicacion = async (req, res) => {
  try {
    const publicacion = await Publicacion.findById(req.params.id);

    if (!publicacion) {
      return res.status(404).json({
        success: false,
        msg: "Publicación no encontrada"
      });
    }

    // Validacion por autor
    if (publicacion.autor.toString() !== req.egresado._id.toString()) {
      return res.status(403).json({
        success: false,
        msg: "No tienes permiso para eliminar esta publicación"
      });
    }

    if (publicacion.imagen) {
      try {
        // Extraer public_id de la URL
        const publicId = publicacion.imagen.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`publicaciones/${publicId}`);
      } catch (cloudinaryError) {
        console.error('Error al eliminar imagen de Cloudinary:', cloudinaryError);
      }
    }

    await publicacion.deleteOne();

    res.json({
      success: true,
      msg: "Publicación eliminada"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      msg: "Error al eliminar la publicación"
    });
  }
}

export const obtenerPublicacion = async (req, res) => {
  try {
    const publicacion = await Publicacion.findById(req.params.id)
      .populate('autor', 'nombre apellido fotoPerfil programaAcademico yearGraduacion')
      .populate('likes', 'nombre apellido fotoPerfil');

    if (!publicacion) {
      return res.status(404).json({
        success: false,
        message: "Publicación no encontrada"
      });
    }

    res.json({
      success: true,
      publicacion
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al obtener la publicación",
      error: error.message
    });
  }
}

export const editarPublicacion = async (req, res) => {
  try {
    const { descripcion } = req.body;
    const publicacion = await Publicacion.findById(req.params.id);

    if (!publicacion) {
      return res.status(404).json({
        success: false,
        msg: "Publicación no encontrada"
      });
    }

    // Validar que el usuario sea el autor
    if (publicacion.autor.toString() !== req.egresado._id.toString()) {
      return res.status(403).json({
        success: false,
        msg: "No tienes permiso para editar esta publicación"
      });
    }

    // Actualizar descripción
    if (descripcion) {
      publicacion.descripcion = descripcion.trim();
    }

    // Si hay nueva imagen
    if (req.file) {
      // Eliminar imagen anterior si existe
      if (publicacion.imagen) {
        try {
          const publicId = publicacion.imagen.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`publicaciones/${publicId}`);
        } catch (cloudinaryError) {
          console.error('Error al eliminar imagen antigua:', cloudinaryError);
        }
      }

      // Subir nueva imagen
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'publicaciones',
        transformation: [
          { width: 1200, height: 1200, crop: 'limit' },
          { quality: 'auto' }
        ]
      });
      publicacion.imagen = result.secure_url;
    }

    await publicacion.save();
    await publicacion.populate('autor', 'nombre apellido fotoPerfil programaAcademico yearGraduacion');

    res.json({
      success: true,
      message: "Publicación actualizada exitosamente",
      publicacion
    });

  } catch (error) {
    console.error('Error al editar publicación:', error);

    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error al eliminar archivo temporal:', unlinkError);
      }
    }

    res.status(500).json({
      success: false,
      message: "Error al editar la publicación",
      error: error.message
    });
  }
}