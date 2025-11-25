/**
 * Middleware de sanitización seguro y no invasivo
 * Solo bloquea operadores MongoDB peligrosos
 * Compatible con Express 5.x
 */

const DANGEROUS_OPERATORS = [
  '$where',
  '$regex',
  '$ne',
  '$gt',
  '$gte',
  '$lt',
  '$lte',
  '$in',
  '$nin',
  '$or',
  '$and',
  '$not',
  '$nor',
  '$exists',
  '$type',
  '$expr',
  '$jsonSchema',
  '$mod',
  '$text',
  '$geoIntersects',
  '$geoWithin',
  '$near',
  '$nearSphere'
];

/**
 * Verifica si un objeto contiene operadores MongoDB peligrosos
 */
const containsDangerousOperators = (obj, path = '') => {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  for (const key in obj) {
    const currentPath = path ? `${path}.${key}` : key;

    // Verificar si la key es un operador peligroso
    if (DANGEROUS_OPERATORS.includes(key)) {
      console.warn(`⚠️  Operador MongoDB bloqueado: ${key} en ${currentPath}`);
      return true;
    }

    // Verificar recursivamente
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      if (containsDangerousOperators(obj[key], currentPath)) {
        return true;
      }
    }
  }

  return false;
};

/**
 * Sanitiza removiendo operadores peligrosos
 */
const sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized = {};
  for (const key in obj) {
    // Si la key es un operador peligroso, NO la incluyas
    if (DANGEROUS_OPERATORS.includes(key)) {
      console.warn(`🛡️  Operador eliminado: ${key}`);
      continue;
    }

    // Sanitizar recursivamente
    sanitized[key] = sanitizeObject(obj[key]);
  }

  return sanitized;
};

const safeSanitize = (req, res, next) => {
  try {
    let blocked = false;

    // Verificar body
    if (req.body && typeof req.body === 'object') {
      if (containsDangerousOperators(req.body, 'body')) {
        blocked = true;
      } else {
        req.body = sanitizeObject(req.body);
      }
    }

    // Verificar query
    if (req.query && typeof req.query === 'object') {
      if (containsDangerousOperators(req.query, 'query')) {
        blocked = true;
      } else {
        const sanitizedQuery = sanitizeObject(req.query);
        // Reemplazar query completo
        for (const key in req.query) {
          delete req.query[key];
        }
        Object.assign(req.query, sanitizedQuery);
      }
    }

    if (blocked) {
      console.error('🚨 Intento de inyección NoSQL bloqueado');
      return res.status(400).json({
        success: false,
        msg: 'Solicitud inválida detectada'
      });
    }

    next();
  } catch (error) {
    console.error('Error en sanitización:', error);
    res.status(500).json({
      success: false,
      msg: 'Error en el procesamiento de datos'
    });
  }
};

export default safeSanitize;