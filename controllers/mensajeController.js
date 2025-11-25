import Mensaje from "../models/Mensaje.js";
import Egresado from "../models/Egresado.js";

export const enviarMensaje = async (req, res) => {
  try {
    const { receptorId, contenido } = req.body;

    if (!contenido || contenido.trim() === "") {
      return res.status(400).json({
        success: false,
        msg: "El mensaje no puede estar vacío"
      });
    }

    if (contenido.length > 1000) {
      return res.status(400).json({
        success: false,
        msg: "El mensaje no puede exceder 1000 caracteres"
      });
    }

    const receptor = await Egresado.findById(receptorId);
    if (!receptor) {
      return res.status(404).json({
        success: false,
        msg: "Usuario receptor no encontrado"
      });
    }

    if (receptorId === req.egresado._id.toString()) {
      return res.status(400).json({
        success: false,
        msg: "No puedes enviarte mensajes a ti mismo"
      });
    }

    const nuevoMensaje = new Mensaje({
      emisor: req.egresado._id,
      receptor: receptorId,
      contenido: contenido.trim()
    });

    await nuevoMensaje.save();

    // Populate el mensaje
    await nuevoMensaje.populate([
      { path: "emisor", select: "nombre apellido fotoPerfil" },
      { path: "receptor", select: "nombre apellido fotoPerfil" },
    ]);

    // ========== EMIT SOCKET EVENTS ==========
    const io = req.app.get("io");
    const mensajeData = nuevoMensaje.toObject();

    // Enviar al receptor
    io.to(receptorId).emit("mensaje:nuevo", {
      mensaje: mensajeData
    });

    // Confirmar al emisor
    io.to(req.egresado._id.toString()).emit("mensaje:enviado", {
      mensaje: mensajeData
    });

    console.log(`✉️ Mensaje enviado: ${req.egresado._id} → ${receptorId}`);

    res.status(201).json({
      success: true,
      msg: "Mensaje enviado correctamente",
      mensaje: mensajeData
    });

  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    res.status(500).json({
      success: false,
      msg: "Error al enviar el mensaje"
    });
  }
}

export const obtenerConversacion = async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { page = 1, limit = 30 } = req.query;

    const usuario = await Egresado.findById(usuarioId);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        msg: "Usuario no encontrado"
      });
    }

    const mensajes = await Mensaje.find({
      $or: [
        {
          emisor: req.egresado._id,
          receptor: usuarioId,
          eliminadoPorEmisor: false
        },
        {
          emisor: usuarioId,
          receptor: req.egresado._id,
          eliminadoPorReceptor: false
        }
      ]
    })
      .populate('emisor', 'nombre apellido fotoPerfil')
      .populate('receptor', 'nombre apellido fotoPerfil')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Mensaje.countDocuments({
      $or: [
        {
          emisor: req.egresado._id,
          receptor: usuarioId,
          eliminadoPorEmisor: false
        },
        {
          emisor: usuarioId,
          receptor: req.egresado._id,
          eliminadoPorReceptor: false
        }
      ]
    });

    // Marcar como leídos
    await Mensaje.updateMany(
      {
        emisor: usuarioId,
        receptor: req.egresado._id,
        leido: false
      },
      { $set: { leido: true } }
    );

    // Notificar al emisor vía socket
    const io = req.app.get('io');
    io.to(usuarioId).emit('mensajes:leidos', {
      receptorId: req.egresado._id.toString()
    });

    res.json({
      success: true,
      mensajes: mensajes.reverse(),
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total
    });

  } catch (error) {
    console.error('Error al obtener la conversación:', error);
    res.status(500).json({
      success: false,
      msg: "Error al obtener la conversación"
    });
  }
}

export const obtenerConversaciones = async (req, res) => {
  try {
    const egresadoId = req.egresado._id;

    const mensajesEnviados = await Mensaje.distinct('receptor', {
      emisor: egresadoId,
      eliminadoPorEmisor: false
    });

    const mensajesRecibidos = await Mensaje.distinct('emisor', {
      receptor: egresadoId,
      eliminadoPorReceptor: false
    });

    const usuariosIds = [
      ...new Set([...mensajesEnviados, ...mensajesRecibidos])
    ];

    const conversaciones = await Promise.all(
      usuariosIds.map(async (usuarioId) => {
        const ultimoMensaje = await Mensaje.findOne({
          $or: [
            { emisor: egresadoId, receptor: usuarioId, eliminadoPorEmisor: false },
            { emisor: usuarioId, receptor: egresadoId, eliminadoPorReceptor: false }
          ]
        })
          .sort({ createdAt: -1 })
          .lean();

        const mensajesNoLeidos = await Mensaje.countDocuments({
          emisor: usuarioId,
          receptor: egresadoId,
          leido: false,
          eliminadoPorReceptor: false
        });

        const usuario = await Egresado.findById(usuarioId)
          .select('nombre apellido fotoPerfil programaAcademico')
          .lean();

        if (!usuario || !ultimoMensaje) return null;

        return {
          usuario,
          ultimoMensaje: {
            contenido: ultimoMensaje.contenido,
            createdAt: ultimoMensaje.createdAt,
            esMio: ultimoMensaje.emisor.toString() === egresadoId.toString()
          },
          mensajesNoLeidos
        };
      })
    );

    const conversacionesFiltradas = conversaciones
      .filter(c => c !== null)
      .sort((a, b) =>
        new Date(b.ultimoMensaje.createdAt) - new Date(a.ultimoMensaje.createdAt)
      );

    res.json({
      success: true,
      conversaciones: conversacionesFiltradas
    });
  } catch (error) {
    console.error('Error al obtener conversaciones:', error);
    res.status(500).json({
      success: false,
      msg: "Error al obtener las conversaciones"
    });
  }
}

export const marcarComoLeido = async (req, res) => {
  try {
    const { usuarioId } = req.params;

    await Mensaje.updateMany(
      {
        emisor: usuarioId,
        receptor: req.egresado._id,
        leido: false
      },
      { leido: true }
    );

    // Notificar al emisor
    const io = req.app.get('io');
    io.to(usuarioId).emit('mensajes:leidos', {
      receptorId: req.egresado._id.toString()
    });

    res.json({
      success: true,
      msg: "Mensajes marcados como leídos"
    });

  } catch (error) {
    console.error('Error al marcar como leído:', error);
    res.status(500).json({
      success: false,
      msg: "Error al actualizar el estado"
    });
  }
}

export const eliminarMensaje = async (req, res) => {
  try {
    const { mensajeId } = req.params;

    const mensaje = await Mensaje.findById(mensajeId);

    if (!mensaje) {
      return res.status(404).json({
        success: false,
        msg: "Mensaje no encontrado"
      });
    }

    const egresadoId = req.egresado._id.toString();

    if (mensaje.emisor.toString() === egresadoId) {
      mensaje.eliminadoPorEmisor = true;
    } else if (mensaje.receptor.toString() === egresadoId) {
      mensaje.eliminadoPorReceptor = true;
    } else {
      return res.status(403).json({
        success: false,
        msg: "No tienes permiso para eliminar este mensaje"
      });
    }

    if (mensaje.eliminadoPorEmisor && mensaje.eliminadoPorReceptor) {
      await mensaje.deleteOne();
    } else {
      await mensaje.save();
    }

    // Notificar vía socket
    const io = req.app.get('io');
    const otroUsuarioId = mensaje.emisor.toString() === egresadoId
      ? mensaje.receptor.toString()
      : mensaje.emisor.toString();

    io.to(otroUsuarioId).emit('mensaje:eliminado', {
      mensajeId: mensaje._id.toString()
    });

    res.json({
      success: true,
      msg: "Mensaje eliminado"
    });

  } catch (error) {
    console.error('Error al eliminar mensaje:', error);
    res.status(500).json({
      success: false,
      msg: "Error al eliminar el mensaje"
    });
  }
};

export const obtenerMensajesNoLeidos = async (req, res) => {
  try {
    const count = await Mensaje.countDocuments({
      receptor: req.egresado._id,
      leido: false,
      eliminadoPorReceptor: false
    });

    res.json({
      success: true,
      count
    });

  } catch (error) {
    console.error('Error al obtener mensajes no leídos:', error);
    res.status(500).json({
      success: false,
      msg: "Error al obtener el contador"
    });
  }
};