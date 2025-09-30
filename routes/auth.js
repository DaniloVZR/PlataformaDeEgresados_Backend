import express from 'express';
import { autenticar, registrar, confirmar, comprobarToken, nuevaPassword, recuperarPassword, perfil } from '../controllers/usuarioController.js';
import { validarRegistro, validarLogin, validarEmail, validarNuevaPassword } from '../middleware/validadores.js';
import checkAuth from '../middleware/checkAuth.js';
import rateLimit from 'express-rate-limit';
const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Solo 5 intentos
  message: 'Demasiados intentos de login. Intenta en 15 minutos',
  skipSuccessfulRequests: true, // No cuenta los login exitosos
});

const passwordRecoveryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // Solo 3 intentos de recuperación
  message: 'Demasiadas solicitudes de recuperación. Intenta en 1 hora',
});

// login y registro
router.post('/registrar', validarRegistro, registrar);
router.post('/autenticar', loginLimiter, validarLogin, autenticar);

// Confirmar cuenta
router.get('/confirmar/:token', confirmar);

// Contraseña
router.post('/recuperar-password', passwordRecoveryLimiter, validarEmail, recuperarPassword);
router.get('/recuperar-password/:token', comprobarToken);
router.post('/recuperar-password/:token', validarNuevaPassword, nuevaPassword);

// Perfil
router.get('/perfil', checkAuth, perfil);

export default router;