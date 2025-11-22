import Egresado from "../models/Egresado.js";
import { v2 as cloudinary } from 'cloudinary';

export const obtenerEgresado = async (req, res) => {
  try {
    const egresado = await Egresado.findOne({ usuario: req.usuario._id }).populate('usuario', 'nombre correo');

    if (!egresado) {
      return res.status(404).json({
        success: false,
        msg: "Egresado no encontrado"
      });
    }

    res.json({
      success: true,
      egresado
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      msg: "Error en el servidor"
    });
  }
}

export const completarPerfil = async (req, res) => {
  try {
    const usuarioId = req.usuario._id;

    // Buscar perfil
    const egresado = await Egresado.findOne({ usuario: usuarioId });

    if (!egresado) {
      return res.status(404).json({
        success: false,
        msg: "Perfil no encontrado"
      });
    }

    const {
      nombre,
      apellido,
      programaAcademico,
      yearGraduacion,
      descripcion,
      redesSociales
    } = req.body;

    // Actualizar campos
    if (nombre) egresado.nombre = nombre;
    if (apellido) egresado.apellido = apellido;
    if (programaAcademico) egresado.programaAcademico = programaAcademico;
    if (yearGraduacion) egresado.yearGraduacion = yearGraduacion;
    if (descripcion !== undefined) egresado.descripcion = descripcion;
    if (redesSociales) {
      egresado.redesSociales = {
        ...egresado.redesSociales,
        ...redesSociales
      };
    }

    // Verificar si el perfil está completo
    if (egresado.nombre && egresado.programaAcademico && egresado.yearGraduacion) {
      egresado.completadoPerfil = true;
    }

    egresado.actualizadoEn = Date.now();
    await egresado.save();

    res.json({
      success: true,
      msg: egresado.completadoPerfil
        ? "Perfil completado exitosamente"
        : "Perfil actualizado",
      egresado
    });
  } catch {
    res.status(500).json({
      success: false,
      msg: "Error en el servidor"
    });
  }
}

export const actualizarFotoPerfil = async (req, res) => {
  try {
    const egresado = await Egresado.findOne({ usuario: req.usuario._id });

    if (!egresado) {
      return res.status(404).json({
        success: false,
        msg: "Egresado no encontrado"
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        msg: "No se envió ninguna imagen"
      });
    }

    // Verificar si hay foto
    if (egresado.fotoPerfil) {
      try {
        // Eliminar foto anterior en Cloudinary
        const urlParts = egresado.fotoPerfil.split('/');
        const filename = urlParts[urlParts.length - 1];
        const publicId = `egresados_fotos_perfil/${filename.split('.')[0]}`;

        await cloudinary.uploader.destroy(publicId);
        console.log("Imagen anterior eliminada");
      } catch (error) {
        console.log("No se pudo eliminar la imagen anterior:", error.message);
      }
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'egresados_fotos_perfil',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto' }
      ]
    });

    console.log("Imagen subida a Cloudinary:", result.secure_url);

    egresado.fotoPerfil = result.secure_url;
    egresado.actualizadoEn = Date.now();
    await egresado.save();

    if (req.file.path) {
      try {
        const fs = await import('fs');
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.log("No se pudo eliminar archivo temporal");
      }
    }

    res.json({
      success: true,
      msg: "Foto de perfil actualizada correctamente",
      fotoPerfil: egresado.fotoPerfil
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      msg: "Error al actualizar la foto de perfil"
    });
  }
}