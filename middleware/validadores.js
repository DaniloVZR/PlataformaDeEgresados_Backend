import { body, validationResult } from "express-validator";

export const manejarErrores = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errores: errors.array().map(err => ({
        campo: err.path,
        mensaje: err.msg
      }))
    });
  }
  next();
};

// Valdación de registros:
export const validarRegistro = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 50 }).withMessage('Nombre debe tener entre 2 y 50 caracteres'),

  body('correo')
    .trim()
    .notEmpty().withMessage('El correo es obligatorio')
    .isEmail().withMessage('Correo inválido')
    .normalizeEmail()
    .custom((value) => {
      const emailRegex = /^[\w._%+-]+@pascualbravo\.edu\.co$/;
      if (!emailRegex.test(value)) {
        throw new Error('El correo debe ser institucional (@pascualbravo.edu.co)');
      }
      return true;
    }),

  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria')
    .isLength({ min: 8, max: 100 }).withMessage('La contraseña debe tener entre 8 y 100 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/)
    .withMessage('La contraseña debe contener mayúsculas, minúsculas, números y caracteres especiales'),

  manejarErrores
]

// Validación de login
export const validarLogin = [
  body('correo')
    .trim()
    .notEmpty().withMessage('El correo es obligatorio')
    .isEmail().withMessage('Correo inválido')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria'),

  manejarErrores
];

// Validación de email (para recuperación)
export const validarEmail = [
  body('correo')
    .trim()
    .notEmpty().withMessage('El correo es obligatorio')
    .isEmail().withMessage('Correo inválido')
    .normalizeEmail(),

  manejarErrores
];

// Validación de nueva contraseña
export const validarNuevaPassword = [
  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria')
    .isLength({ min: 8, max: 100 }).withMessage('La contraseña debe tener entre 8 y 100 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/)
    .withMessage('La contraseña debe contener mayúsculas, minúsculas, números y caracteres especiales'),

  manejarErrores
];