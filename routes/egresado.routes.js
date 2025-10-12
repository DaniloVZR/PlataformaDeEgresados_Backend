import express from "express";
import { obtenerEgresado, crearEgresado, actualizarEgresado, actualizarFotoPerfil } from "../controllers/egresadoController.js";
import checkAuth from "../middleware/checkAuth.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Rutas protegidas
router.get("/", checkAuth, obtenerEgresado);
router.post("/", checkAuth, crearEgresado);
router.put("/", checkAuth, actualizarEgresado);

router.put(
  "/foto",
  checkAuth,
  upload.single("fotoPerfil"),
  actualizarFotoPerfil
);


export default router;