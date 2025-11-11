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
/*
export const crearEgresado = async (req, res) => {
  try {
    const usuarioId = req.usuario._id;

    // Verificar si ya existe un perfil para este usuario
    const existeEgresado = await Egresado.findOne({ usuario: usuarioId });

    if (existeEgresado) {
      return res.status(400).json({
        success: false,
        msg: "Perfil ya existente"
      });
    }

    const { nombre, apellido, programaAcademico, yearGraduacion, descripcion, redes } = req.body;

    if (!nombre || !apellido || !programaAcademico || !yearGraduacion) {
      return res.status(400).json({ msg: "Todos los campos obligatorios deben ser completados" });
    }

    const nuevoEgresado = new Egresado({
      usuario: usuarioId,
      nombre,
      apellido,
      email: req.usuario.correo,
      programaAcademico,
      yearGraduacion,
      descripcion: "",
      redesSociales: {},
      fotoPerfil: "",
      completadoPerfil: true
    });

    const egresadoGuardado = await nuevoEgresado.save();

    res.status(201).json({
      success: true,
      msg: "Perfil creado correctamente",
      egresado: egresadoGuardado
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      msg: "Error en el servidor"
    });
  }
}

export const actualizarEgresado = async (req, res) => {
  try {
    const egresado = await Egresado.findOne({ usuario: req.usuario._id });

    if (!egresado) {
      return res.status(404).json({
        success: false,
        msg: "Egresado no encontrado"
      });
    }

    const camposActualizables = [
      "descripcion",
      "programaAcademico",
      "yearGraduacion",
      "redesSociales",
    ];

    // Seguridad: evitar actualización de email y password
    if (req.body.correo || req.body.password) {
      return res.status(400).json({
        success: false,
        msg: "Acción imposible: no se puede actualizar email o password"
      });
    }

    // Validación
    for (let campo of camposActualizables) {
      if (req.body[campo] !== undefined && req.body[campo] === "") {
        return res.status(400).json({
          success: false,
          msg: `El campo '${campo}' no puede estar vacío`
        });
      }
    }

    if (req.body.fotoPerfil && typeof req.body.fotoPerfil !== "string") {
      return res.status(400).json({
        success: false,
        msg: "El campo de Foto de Perfil debe ser un string"
      });
    }

    camposActualizables.forEach((campo => {
      if (req.body[campo] !== undefined) {
        egresado[campo] = req.body[campo];
      }
    }))

    egresado.actualizadoEn = Date.now();
    const actualizado = await egresado.save();

    res.json({
      success: true,
      msg: "Información actualizada correctamente",
      egresado: actualizado
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      msg: "Error en el servidor"
    });
  }
}
*/
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
        console.log("✅ Imagen anterior eliminada");
      } catch (error) {
        console.log("⚠️ No se pudo eliminar la imagen anterior:", error.message);
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
        console.log("⚠️ No se pudo eliminar archivo temporal");
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