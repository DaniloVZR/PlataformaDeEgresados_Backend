import express from 'express';
import { loginUsuario, registrarUsuario } from '../controllers/authController.js';

const router = express.Router();

router.post('/registrarUsuario', registrarUsuario);
router.post('/loginUsuario', loginUsuario);

export default router;