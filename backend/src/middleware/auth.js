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
  const usuario = req.session?.usuario || req.user;

  if (!usuario) {
    console.log('\n⚠️  [requireAdmin] No hay usuario en session ni en req.user');
    console.log('   req.session:', req.session ? { id: req.session.id, usuario: !!req.session.usuario } : 'undefined');
    console.log('   req.user:', req.user ? { correo: req.user.correo || req.user.email, rol: req.user.rol || req.user.role } : 'undefined');
    console.log('   Path:', req.path);
    console.log('   Method:', req.method);
    console.log('   Headers:', Object.keys(req.headers));
    return res.status(401).json({ error: 'No autenticado' });
  }

  const userRole = usuario.rol || usuario.role;
  console.log(`\n✅ [requireAdmin] Usuario encontrado: ${usuario.nombre || usuario.name || usuario.correo || usuario.email}`);
  console.log(`   Rol: ${userRole}`);

  if (userRole !== 'admin') {
    console.log(`⚠️  Usuario no es admin. Rol: ${userRole}`);
    return res.status(403).json({ error: 'Requiere permisos de administrador' });
  }

  console.log('   ✅ Acceso permitido');
  req.usuarioAuth = usuario;
  next();
}

/**
 * Determina si el usuario puede ver todos los documentos
 * o solo los suyos. Solo admin y secretaria pueden ver todo.
 */
function canViewAll(usuario) {
  return usuario.rol === 'admin' || usuario.rol === 'secretaria';
}

/**
 * Obtiene el ID del usuario en la tabla 'empleados' basándose en el correo
 * del usuario autenticado en 'usuarios_auth'
 *
 * @param {object} db - Conexión a la base de datos
 * @param {string} correo - Correo del usuario autenticado
 * @returns {Promise<number|null>} - ID del usuario en la tabla empleados, o null si no existe
 */
async function getUserIdFromCorreo(db, correo) {
  try {
    const [rows] = await db.query(
      'SELECT id FROM empleados WHERE correo = ?',
      [correo]
    );
    return rows.length > 0 ? rows[0].id : null;
  } catch (err) {
    console.error('Error obteniendo usuario_id desde correo:', err);
    return null;
  }
}

/**
 * Alias para requireAdmin (compatible con diferentes nombres)
 */
function isAdmin(req, res, next) {
  return requireAdmin(req, res, next);
}

module.exports = {
  requireAuth,
  requireRole,
  requireAdmin,
  isAdmin,
  canViewAll,
  getUserIdFromCorreo
};
