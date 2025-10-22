import express from "express";
import { obtenerEgresado, completarPerfil, actualizarFotoPerfil } from "../controllers/egresadoController.js";
import checkAuth from "../middleware/checkAuth.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Rutas protegidas
// router.post("/", checkAuth, crearEgresado);

router.get("/", checkAuth, obtenerEgresado);
router.put("/", checkAuth, completarPerfil);
router.put("/foto", checkAuth, upload.single("fotoPerfil"), actualizarFotoPerfil);

export default router;