import express from "express";
import {
  crearComentario,
  obtenerComentarios,
  eliminarComentario,
  contarComentarios
} from "../controllers/comentarioController.js";
import checkAuth from "../middleware/checkAuth.js";
import checkEgresado from "../middleware/checkEgresado.js";

const router = express.Router();

router.use(checkAuth);

// Obtener comentarios de una publicación
router.get("/:publicacionId", obtenerComentarios);

// Contar comentarios
router.get("/:publicacionId/count", contarComentarios);

// Crear comentario (requiere perfil de egresado)
router.post("/:publicacionId", checkEgresado, crearComentario);

// Eliminar comentario
router.delete("/:comentarioId", checkEgresado, eliminarComentario);

export default router;