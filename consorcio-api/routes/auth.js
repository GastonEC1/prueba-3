const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth'); 
const authorizeRole = require('../middleware/authorizeRole'); // ✨ Importamos el nuevo middleware aquí ✨

// @route   POST /api/auth/register
// @desc    Registrar un nuevo usuario (solo para administradores)
// @access  Private (requiere token y rol de admin)
router.post(
    '/register', 
    authMiddleware,         // 1. Primero: Autentica al usuario (verifica el token y adjunta req.user)
    authorizeRole(['admin']), // 2. Segundo: Autoriza solo si el rol de req.user es 'admin'
    authController.registerUser // 3. Tercero: Ejecuta la lógica para registrar al usuario
);

// @route   POST /api/auth/login
// @desc    Autenticar usuario y obtener token
// @access  Public
router.post('/login', authController.loginUser);

// @route   GET /api/auth/me
// @desc    Obtener información del usuario autenticado
// @access  Private (protegido por el middleware de autenticación)
router.get('/me', authMiddleware, authController.getAuthenticatedUser); 

module.exports = router;
