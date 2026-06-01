const winston = require('winston');
const path = require('path');
const { NODE_ENV } = require('../config/env');
const { AsyncLocalStorage } = require('async_hooks');

const asyncLocalStorage = new AsyncLocalStorage();

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    const traceId = asyncLocalStorage.getStore()?.get('trace_id') || 'SYSTEM';
    // Production will use JSON format, but for Dev we use human-readable
    if (NODE_ENV === 'production') {
      return JSON.stringify({ timestamp, level, traceId, message, stack });
    }
    return `[${timestamp}] [${traceId}] ${level.toUpperCase()}: ${message} ${stack || ''}`;
  })
);
const logger = winston.createLogger({
  level: NODE_ENV === 'development' ? 'debug' : 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    }),
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join(__dirname, '../../logs/combined.log') 
    })
  ]
});

logger.asyncLocalStorage = asyncLocalStorage;
module.exports = logger;
