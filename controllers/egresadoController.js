import Egresado from "../models/Egresado.js";
import { v2 as cloudinary } from 'cloudinary';

// Helper para sanitizar búsquedas
const sanitizarBusqueda = (texto) => {
  if (!texto || typeof texto !== 'string') return '';
  return texto.replace(/[^\w\s@.-]/gi, '').trim().substring(0, 100);
};

// Helper para validar ObjectId
const esObjectIdValido = (id) => {
  return id && id.match(/^[0-9a-fA-F]{24}$/);
};

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

export const obtenerPerfilPublico = async (req, res) => {
  try {
    const { id } = req.params;

    // VALIDAR ObjectId
    if (!esObjectIdValido(id)) {
      return res.status(400).json({
        success: false,
        msg: "ID de egresado inválido"
      });
    }

    const egresado = await Egresado.findById(id)
      .select('-usuario -actualizadoEn -__v')
      .lean();

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
    console.error('Error al obtener perfil público:', error);
    res.status(500).json({
      success: false,
      msg: "Error al obtener el perfil"
    });
  }
}

export const buscarEgresados = async (req, res) => {
  try {
    const {
      q,
      programa,
      yearGraduacion,
      page = 1,
      limit = 12
    } = req.query;

    const filtros = {
      completadoPerfil: true
    };

    // SANITIZAR búsqueda general
    if (q && q.trim()) {
      const qSanitizado = sanitizarBusqueda(q);
      if (qSanitizado) {
        const searchRegex = new RegExp(qSanitizado, 'i');
        filtros.$or = [
          { nombre: searchRegex },
          { apellido: searchRegex }
        ];
      }
    }

    // SANITIZAR programa académico
    if (programa && programa.trim()) {
      const programaSanitizado = sanitizarBusqueda(programa);
      if (programaSanitizado) {
        filtros.programaAcademico = new RegExp(programaSanitizado, 'i');
      }
    }

    // VALIDAR año de graduación
    if (yearGraduacion) {
      const year = parseInt(yearGraduacion);
      if (!isNaN(year) && year >= 1900 && year <= new Date().getFullYear() + 5) {
        filtros.yearGraduacion = year;
      }
    }

    // Validar paginación
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 12));

    const egresados = await Egresado.find(filtros)
      .select('nombre apellido fotoPerfil programaAcademico yearGraduacion descripcion')
      .sort({ nombre: 1, apellido: 1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .lean();

    const total = await Egresado.countDocuments(filtros);

    res.json({
      success: true,
      egresados,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      total
    });

  } catch (error) {
    console.error('Error en búsqueda de egresados:', error);
    res.status(500).json({
      success: false,
      msg: "Error al buscar egresados"
    });
  }
}

export const obtenerProgramasAcademicos = async (req, res) => {
  try {
    const programas = await Egresado.distinct('programaAcademico', {
      programaAcademico: { $ne: '' },
      completadoPerfil: true
    });

    res.json({
      success: true,
      programas: programas.sort()
    });

  } catch (error) {
    console.error('Error al obtener programas:', error);
    res.status(500).json({
      success: false,
      msg: "Error al obtener programas académicos"
    });
  }
}

export const obtenerYearsGraduacion = async (req, res) => {
  try {
    const years = await Egresado.distinct('yearGraduacion', {
      yearGraduacion: { $ne: null },
      completadoPerfil: true
    });

    res.json({
      success: true,
      years: years.sort((a, b) => b - a)
    });

  } catch (error) {
    console.error('Error al obtener años:', error);
    res.status(500).json({
      success: false,
      msg: "Error al obtener años de graduación"
    });
  }
}

export const completarPerfil = async (req, res) => {
  try {
    const usuarioId = req.usuario._id;

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

    // SANITIZAR inputs de texto
    if (nombre) {
      const nombreSanitizado = sanitizarBusqueda(nombre);
      if (nombreSanitizado) egresado.nombre = nombreSanitizado;
    }

    if (apellido) {
      const apellidoSanitizado = sanitizarBusqueda(apellido);
      if (apellidoSanitizado) egresado.apellido = apellidoSanitizado;
    }

    if (programaAcademico) {
      const programaSanitizado = sanitizarBusqueda(programaAcademico);
      if (programaSanitizado) egresado.programaAcademico = programaSanitizado;
    }

    // VALIDAR año de graduación
    if (yearGraduacion) {
      const year = parseInt(yearGraduacion);
      if (!isNaN(year) && year >= 1900 && year <= new Date().getFullYear() + 5) {
        egresado.yearGraduacion = year;
      }
    }

    if (descripcion !== undefined) {
      const descripcionSanitizada = sanitizarBusqueda(descripcion);
      egresado.descripcion = descripcionSanitizada;
    }

    // SANITIZAR URLs de redes sociales
    if (redesSociales) {
      const redesSanitizadas = {};
      const urlRegex = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b/;

      for (const [red, url] of Object.entries(redesSociales)) {
        if (['linkedin', 'github', 'twitter', 'instagram'].includes(red)) {
          if (url && typeof url === 'string' && urlRegex.test(url)) {
            redesSanitizadas[red] = url.substring(0, 200);
          } else {
            redesSanitizadas[red] = '';
          }
        }
      }

      egresado.redesSociales = {
        ...egresado.redesSociales,
        ...redesSanitizadas
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
  } catch (error) {
    console.error('Error al completar perfil:', error);
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

    if (egresado.fotoPerfil) {
      try {
        const urlParts = egresado.fotoPerfil.split('/');
        const filename = urlParts[urlParts.length - 1];
        const publicId = `egresados_fotos_perfil/${filename.split('.')[0]}`;
        await cloudinary.uploader.destroy(publicId);
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
    console.error('Error al actualizar foto de perfil:', error);
    res.status(500).json({
      success: false,
      msg: "Error al actualizar la foto de perfil"
    });
  }
}