// middleware/authorizeRole.js

/**
 * Middleware para autorizar roles específicos.
 * Se usa para restringir el acceso a ciertas rutas solo a usuarios con roles específicos.
 *
 * @param {Array<String>} roles - Un array de roles permitidos (ej. ['admin', 'employee']).
 * @returns {Function} Un middleware de Express.
 */
module.exports = function (roles = []) {
    // Si no se especifican roles, se convierte una cadena a un array
    // o se asume que no hay restricciones de rol específicas más allá de la autenticación.
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        // req.user viene del middleware 'auth' y contiene la información del usuario autenticado.
        // Es crucial que 'authMiddleware' se ejecute ANTES de este middleware y adjunte req.user
        // con el ID y el ROL del usuario (ej. req.user = { id: '...', rol: 'admin' }).

        // Asegurarse de que el usuario esté autenticado y que su rol esté disponible
        if (!req.user || !req.user.rol) {
            // Si no hay información de usuario o de rol, el usuario no está autorizado
            // Esto puede significar que authMiddleware no se ejecutó o falló,
            // o que el token no contenía el rol.
            return res.status(401).json({ msg: 'No autorizado para esta acción (falta información de rol del usuario autenticado)' });
        }

        // Verificar si se han especificado roles para esta ruta
        if (roles.length > 0) {
            // Si hay roles específicos, verificar si el rol del usuario está incluido en ellos
            if (!roles.includes(req.user.rol)) {
                // El usuario no tiene ninguno de los roles permitidos
                return res.status(403).json({ msg: 'Acceso denegado: Se requiere un rol específico para realizar esta acción' });
            }
        }

        // Si el usuario tiene el rol correcto (o no hay roles específicos requeridos), continuar
        next();
    };
};