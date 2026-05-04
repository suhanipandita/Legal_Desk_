const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Registration validation
const validateRegister = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
  handleValidation,
];

// Login validation
const validateLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidation,
];

// Case validation
const validateCase = [
  body('title').trim().notEmpty().withMessage('Case title is required'),
  body('client').notEmpty().withMessage('Client ID is required'),
  body('lawyer').notEmpty().withMessage('Lawyer ID is required'),
  handleValidation,
];

// Appointment validation
const validateAppointment = [
  body('lawyer').notEmpty().withMessage('Lawyer ID is required'),
  body('dateTime').isISO8601().withMessage('Valid date and time is required'),
  handleValidation,
];

// Invoice validation
const validateInvoice = [
  body('case').notEmpty().withMessage('Case ID is required'),
  body('client').notEmpty().withMessage('Client ID is required'),
  body('lawyer').notEmpty().withMessage('Lawyer ID is required'),
  handleValidation,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateCase,
  validateAppointment,
  validateInvoice,
  handleValidation,
};
