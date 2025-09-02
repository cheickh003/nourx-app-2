import { validationResult } from 'express-validator';
import { ValidationError } from './errorHandler.js';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));
    
    const error = new ValidationError('Validation failed', errorMessages);
    return next(error);
  }
  
  next();
};