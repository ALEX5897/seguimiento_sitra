/**
 * Middleware de autenticación y autorización
 */

/**
 * Verifica que el usuario esté autenticado
 */
function requireAuth(req, res, next) {
  const usuario = req.session?.usuario;
  
  if (!usuario) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  
  // Adjuntar usuario a la request
  req.usuarioAuth = usuario;
  next();
}

/**
 * Verifica que el usuario tenga un rol específico
 */
function requireRole(...roles) {
  return (req, res, next) => {
    const usuario = req.session?.usuario;
    
    if (!usuario) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    
    if (!roles.includes(usuario.rol)) {
      return res.status(403).json({ error: 'Sin permisos' });
    }
    
    req.usuarioAuth = usuario;
    next();
  };
}

/**
 * Verifica solo que sea admin
 */
function requireAdmin(req, res, next) {
  const usuario = req.session?.usuario;
  
  if (!usuario) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  
  if (usuario.rol !== 'admin') {
    return res.status(403).json({ error: 'Requiere permisos de administrador' });
  }
  
  req.usuarioAuth = usuario;
  next();
}

/**
 * Determina si el usuario puede ver todos los documentos
 * o solo los suyos
 */
function canViewAll(usuario) {
  const rolLower = (usuario.rol || '').toLowerCase();
  return usuario.rol === 'admin' || 
         usuario.rol === 'secretaria' || 
         rolLower === 'solo_vista' || 
         rolLower === 'solo lectura' || 
         rolLower === 'lectura';
}

/**
 * Obtiene el ID del usuario en la tabla 'usuarios' basándose en el correo
 * del usuario autenticado en 'usuarios_auth'
 * 
 * @param {object} db - Conexión a la base de datos
 * @param {string} correo - Correo del usuario autenticado
 * @returns {Promise<number|null>} - ID del usuario en la tabla usuarios, o null si no existe
 */
async function getUserIdFromCorreo(db, correo) {
  try {
    const [rows] = await db.query(
      'SELECT id FROM usuarios WHERE correo = ?',
      [correo]
    );
    return rows.length > 0 ? rows[0].id : null;
  } catch (err) {
    console.error('Error obteniendo usuario_id desde correo:', err);
    return null;
  }
}

module.exports = {
  requireAuth,
  requireRole,
  requireAdmin,
  canViewAll,
  getUserIdFromCorreo
};
