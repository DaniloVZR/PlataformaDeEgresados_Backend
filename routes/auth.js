import express from 'express';
import { autenticar, registrar, confirmar, comprobarToken, nuevaPassword, recuperarPassword, perfil } from '../controllers/usuarioController.js';
import checkAuth from '../middleware/checkAuth.js';

const router = express.Router();

// login y registro
router.post('/registrar', registrar);
router.post('/autenticar', autenticar);

// Confirmar cuenta
router.get('/confirmar/:token', confirmar);

// Contraseña
router.post('/recuperar-password', recuperarPassword);
router.get('/recuperar-password/:token', comprobarToken);
router.post('/recuperar-password/:token', nuevaPassword);

// Perfil
router.get('/perfil', checkAuth, perfil);

export default router;