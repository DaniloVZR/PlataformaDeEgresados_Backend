import express from "express";
import {
  obtenerEgresado,
  completarPerfil,
  actualizarFotoPerfil,
  buscarEgresados,
  obtenerYearsGraduacion,
  obtenerProgramasAcademicos,
  obtenerPerfilPublico
} from "../controllers/egresadoController.js";
import checkAuth from "../middleware/checkAuth.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Rutas protegidas
// router.post("/", checkAuth, crearEgresado);

router.use(checkAuth);

// Busqueda
router.get("/buscar", buscarEgresados);
router.get("/programas", obtenerProgramasAcademicos);
router.get("/years", obtenerYearsGraduacion);

// Perfil
router.get("/", obtenerEgresado);
router.put("/", completarPerfil);
router.put("/foto", upload.single("fotoPerfil"), actualizarFotoPerfil);

// Perfil público
router.get("/:id", obtenerPerfilPublico);

export default router;