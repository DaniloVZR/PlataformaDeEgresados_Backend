import jwt from 'jsonwebtoken';
import Usuario from '../models/Usuario.js';
import Egresado from '../models/Egresado.js';

const usuariosConectados = new Map();

export const configurarSocket = (io) => {

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error('Autenticación requerida'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const usuario = await Usuario.findById(decoded.id).populate('-password -token');

      if (!usuario || !usuario.confirmado || usuario.bloqueado) {
        return next(new Error('Usuario no autorizado'));
      }

      const egresado = await Egresado.findOne({ usuario: usuario._id });

      if (!egresado) {
        return next(new Error('Egresado no encontrado'));
      }

      socket.userId = usuario._id.toString();
      socket.egresadoId = egresado._id.toString();
      socket.nombre = egresado.nombre;
      socket.apellido = egresado.apellido;
      socket.fotoPerfil = egresado.fotoPerfil;
      next();

    } catch (error) {
      console.error('Error en la autenticación del socket:', error);
      next(new Error('Error en la autenticación del socket'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Usuario conectado: ${socket.egresadoId}`);

    usuariosConectados.set(socket.egresadoId, socket.id);

    socket.join(socket.egresadoId);

    socket.broadcast.emit('usuario-conectado', {
      egresadoId: socket.egresadoId,
      enLinea: true
    });

    socket.emit('usuarios:conectados', {
      usuariosConectados: Array.from(usuariosConectados.keys())
    });

    // Mensajes

    socket.on('mensaje:escribiendo', async ({ receptorId }) => {
      const receptorSocketId = usuariosConectados.get(receptorId);
      if (receptorSocketId) {
        io.to(receptorSocketId).emit('mensaje:escribiendo', {
          emisorId: socket.egresadoId,
          nombre: socket.nombre,
          apellido: socket.apellido,
        });
      }
    });

    socket.on('mensaje:dejo-escribir', ({ receptorId }) => {
      const receptorSocketId = usuariosConectados.get(receptorId);
      if (receptorSocketId) {
        io.to(receptorSocketId).emit('mensaje:dejo-escribir', {
          emisorId: socket.egresadoId
        });
      }
    });

    socket.on('mensaje:leido', ({ emisorId }) => {
      const emisorSocketId = usuariosConectados.get(emisorId);
      if (emisorSocketId) {
        io.to(emisorSocketId).emit('mensaje:leido', {
          receptorId: socket.egresadoId
        });
      }
    });

    socket.on('disconnect', () => {
      console.log(`❌ Usuario desconectado: ${socket.egresadoId}`);

      // Remover de la lista de conectados
      usuariosConectados.delete(socket.egresadoId);

      // Notificar desconexión
      socket.broadcast.emit('usuario:desconectado', {
        egresadoId: socket.egresadoId,
        enLinea: false
      });
    });

    // Manejar errores
    socket.on('error', (error) => {
      console.error('Error en socket:', error);
    });
  });
};

export const emitirEvento = (io, evento, datos) => {
  io.to(receptorId).emit(evento, datos);
}

export const obtenerUsuariosConectados = () => {
  return Array.from(usuariosConectados.keys());
}

export const estaConectado = (egresadoId) => {
  return usuariosConectados.has(egresadoId);
}
