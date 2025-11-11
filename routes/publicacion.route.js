import express from "express";
import {
  crearPublicacion,
  obtenerPublicaciones,
  obtenerPublicacion,
  editarPublicacion,
  eliminarPublicacion,
  obtenerPublicacionesPorEgresado,
  toggleLike,
  obtenerPublicacionesLikeadas
} from "../controllers/publicacionController.js";
import checkAuth from "../middleware/checkAuth.js";
import checkEgresado from "../middleware/checkEgresado.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();
router.use(checkAuth);

// Crear publicación
router.post("/", checkEgresado, upload.single("imagen"), crearPublicacion);

// Obtener todas las publicaciones (feed)
router.get("/", obtenerPublicaciones);

// Obtener publicaciones likeadas
router.get("/likeados", checkEgresado, obtenerPublicacionesLikeadas);

// Obtener publicación por ID
router.get("/:id", checkEgresado, obtenerPublicacion);

// Obtener publicaciones de un egresado
router.get('/egresado/:egresadoId', obtenerPublicacionesPorEgresado);

// Like
router.post('/:id/like', checkEgresado, toggleLike)

// Editar publicación
router.put("/:id", checkEgresado, upload.single("imagen"), editarPublicacion);

// Eliminar publicación
router.delete("/:id", checkEgresado, eliminarPublicacion);

export default router;
