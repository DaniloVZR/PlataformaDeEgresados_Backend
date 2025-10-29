import express from "express";
import {
  obtenerMetricasGenerales,
  obtenerEstadisticasDetalladas,
  listarUsuarios,
  obtenerDetalleUsuario,
  cambiarRolUsuario,
  toggleBanUsuario,
  listarPublicacionesAdmin,
  eliminarPublicacionAdmin
} from "../controllers/administradorController.js";
import checkAuth from "../middleware/checkAuth.js";
import checkAdmin from "../middleware/checkAdmin.js";

const router = express.Router();

router.use(checkAuth, checkAdmin);

// Métricas
router.get("/metricas", obtenerMetricasGenerales);
router.get("/estadisticas", obtenerEstadisticasDetalladas);

// Gestión de usuarios
router.get("/usuarios", listarUsuarios);
router.get("/usuarios/:id", obtenerDetalleUsuario);
router.put("/usuarios/:id/rol", cambiarRolUsuario);
router.put("/usuarios/:id/ban", toggleBanUsuario);

// Gestión de publicaciones
router.get("/publicaciones", listarPublicacionesAdmin);
router.delete("/publicaciones/:id", eliminarPublicacionAdmin);

export default router;