import express from "express";
import {
  enviarMensaje,
  obtenerConversacion,
  obtenerConversaciones,
  marcarComoLeido,
  eliminarMensaje,
  obtenerMensajesNoLeidos
} from "../controllers/mensajeController.js";
import checkAuth from "../middleware/checkAuth.js";
import checkEgresado from "../middleware/checkEgresado.js";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(checkAuth, checkEgresado);

// Enviar mensaje
router.post("/", enviarMensaje);

// Obtener lista de conversaciones
router.get("/conversaciones", obtenerConversaciones);

// Obtener contador de no leídos
router.get("/no-leidos", obtenerMensajesNoLeidos);

// Obtener conversación específica
router.get("/:usuarioId", obtenerConversacion);

// Marcar conversación como leída
router.put("/:usuarioId/leido", marcarComoLeido);

// Eliminar mensaje
router.delete("/:mensajeId", eliminarMensaje);

export default router;