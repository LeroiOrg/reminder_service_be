/**
 * Middleware de manejo de errores global
 */

// Errores operacionales conocidos
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Middleware para rutas no encontradas
const notFound = (req, res, next) => {
  const error = new AppError(`Ruta no encontrada: ${req.originalUrl}`, 404);
  next(error);
};

// Middleware de manejo de errores
const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  // Error por defecto
  if (!statusCode) statusCode = 500;
  if (!message) message = 'Error interno del servidor';

  // Log del error
  console.error('❌ ERROR:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  // Errores específicos
  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = 'Error de validación en base de datos';
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'El registro ya existe';
  }

  // Respuesta
  res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? {
      stack: err.stack
    } : undefined
  });
};

export { AppError, notFound, errorHandler };
