import jwt from "jsonwebtoken";
import Egresado from "../models/Egresado.js";

const usuariosConectados = new Map(); // egresadoId -> socketId

export const configurarSocket = (io) => {
  // Middleware de autenticación
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Token no proporcionado'));
      }

      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Buscar egresado
      const egresado = await Egresado.findOne({ usuario: decoded.id });

      if (!egresado) {
        return next(new Error('Egresado no encontrado'));
      }

      // Agregar datos al socket
      socket.egresadoId = egresado._id.toString();
      socket.usuarioId = decoded.id;

      next();
    } catch (error) {
      console.error('Error en autenticación de socket:', error);
      next(new Error('Autenticación fallida'));
    }
  });

  // Conexión exitosa
  io.on('connection', (socket) => {
    const egresadoId = socket.egresadoId;

    // Registrar usuario conectado
    usuariosConectados.set(egresadoId, socket.id);

    // Unir al room personal
    socket.join(egresadoId);

    // Notificar a todos que este usuario se conectó
    socket.broadcast.emit('usuario:en-linea', { egresadoId });

    // Enviar lista de usuarios conectados al nuevo usuario
    const usuariosOnline = Array.from(usuariosConectados.keys());
    socket.emit('usuarios:conectados', { usuariosConectados: usuariosOnline });

    // ==================== MENSAJES ====================

    // Usuario está escribiendo
    socket.on('mensaje:escribiendo', ({ receptorId }) => {
      const receptorSocketId = usuariosConectados.get(receptorId);
      if (receptorSocketId) {
        io.to(receptorSocketId).emit('mensaje:escribiendo', {
          emisorId: egresadoId
        });
      }
    });

    // Usuario dejó de escribir
    socket.on('mensaje:dejo-escribir', ({ receptorId }) => {
      const receptorSocketId = usuariosConectados.get(receptorId);
      if (receptorSocketId) {
        io.to(receptorSocketId).emit('mensaje:dejo-escribir', {
          emisorId: egresadoId
        });
      }
    });

    // ==================== DESCONEXIÓN ====================

    socket.on('disconnect', (reason) => {

      // Eliminar de usuarios conectados
      usuariosConectados.delete(egresadoId);

      // Notificar a todos
      socket.broadcast.emit('usuario:desconectado', { egresadoId });
    });

    // ==================== ERRORES ====================

    socket.on('error', (error) => {
      console.error('Error de socket:', error);
    });
  });

  console.log('🚀 Socket.IO configurado correctamente');
};

// Helper para obtener usuario conectado
export const getUsuarioConectado = (egresadoId) => {
  return usuariosConectados.has(egresadoId);
};

// Helper para obtener todos los usuarios conectados
export const getUsuariosConectados = () => {
  return Array.from(usuariosConectados.keys());
};