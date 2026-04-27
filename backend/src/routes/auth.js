const express = require('express');
const router = express.Router();
const pool = require('../db');
const { 
  isKeycloakEnabled, 
  getLoginUrl, 
  getLogoutUrl,
  mapKeycloakRoleToSystemRole,
  exchangeCodeForToken
} = require('../services/keycloakService');

// Función auxiliar para decodificar JWT sin verificación de firma
function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Token JWT inválido');
    
    const decodedPayload = Buffer.from(parts[1], 'base64').toString('utf8');
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('❌ Error decodificando JWT:', error.message);
    throw error;
  }
}

// Middleware para obtener el usuario de Keycloak/sesión
function obtenerUsuario(req) {
  return req.session?.usuario || req.user || null;
}

// GET /api/auth/usuario - Obtener usuario actual
router.get('/usuario', async (req, res) => {
  try {
    const usuario = obtenerUsuario(req);
    
    console.log('GET /usuario - Session ID:', req.sessionID, 'Usuario:', usuario ? usuario.correo : 'No autenticado');
    
    if (!usuario) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const [rows] = await pool.query(
      `SELECT ua.id, ua.correo, ua.nombre, ua.apellido, r.nombre as rol, r.permisos
       FROM usuarios_auth ua
       LEFT JOIN roles r ON ua.rol_id = r.id
       WHERE ua.id = ?`,
      [usuario.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const usuarioData = rows[0];
    const permisos = parsePermisos(usuarioData.permisos);

    res.json({
      usuario: {
        id: usuarioData.id,
        correo: usuarioData.correo,
        nombre: usuarioData.nombre,
        apellido: usuarioData.apellido,
        rol: usuarioData.rol,
        permisos
      }
    });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/login - Login de usuario
router.post('/login', async (req, res) => {
  try {
    if (isKeycloakEnabled()) {
      return res.status(400).json({ error: 'Keycloak habilitado. Usa el login con Active Directory.' });
    }

    const { correo, token_keycloak } = req.body;

    if (!correo) {
      return res.status(400).json({ error: 'Correo requerido' });
    }

    // Si viene un token de Keycloak, decodificar y obtener información
    let usuarioInfo = { correo };
    if (token_keycloak) {
      try {
        // Aquí iría la verificación del token de Keycloak
        // Por ahora simplificado
        usuarioInfo.keycloak_id = req.body.keycloak_id;
        usuarioInfo.nombre = req.body.nombre;
      } catch (err) {
        console.error('Error validando token Keycloak:', err);
      }
    }

    // Buscar usuario en BD
    const [usuarios] = await pool.query(
      'SELECT id, correo, nombre, apellido, rol_id, estado FROM usuarios_auth WHERE correo = ?',
      [correo]
    );

    let usuario;
    if (usuarios.length === 0) {
      // Crear nuevo usuario con rol "solo_vista" por defecto
      const [roleDefault] = await pool.query(
        'SELECT id FROM roles WHERE nombre = ?',
        ['solo_vista']
      );

      const rolId = roleDefault.length > 0 ? roleDefault[0].id : 1;

      const [result] = await pool.query(
        `INSERT INTO usuarios_auth (correo, nombre, apellido, keycloak_id, rol_id)
         VALUES (?, ?, ?, ?, ?)`,
        [correo, usuarioInfo.nombre || '', usuarioInfo.apellido || '', usuarioInfo.keycloak_id || null, rolId]
      );

      usuario = {
        id: result.insertId,
        correo,
        nombre: usuarioInfo.nombre || '',
        apellido: usuarioInfo.apellido || '',
        rol_id: rolId,
        estado: 'activo'
      };
    } else {
      usuario = usuarios[0];

      // Verificar si está bloqueado
      if (usuario.estado === 'bloqueado') {
        await registrarLoginFallido(correo, req, 'Usuario bloqueado');
        return res.status(403).json({ error: 'Usuario bloqueado' });
      }
    }

    // Registrar login exitoso
    await pool.query(
      `INSERT INTO audit_login (usuario_id, correo, ip_address, user_agent, login_exitoso)
       VALUES (?, ?, ?, ?, true)`,
      [usuario.id, correo, req.ip, req.get('user-agent')]
    );

    // Actualizar último login
    await pool.query(
      'UPDATE usuarios_auth SET ultimo_login = NOW() WHERE id = ?',
      [usuario.id]
    );

    // Obtener rol y permisos
    const [roles] = await pool.query(
      'SELECT nombre, permisos FROM roles WHERE id = ?',
      [usuario.rol_id]
    );

    const rol = roles.length > 0 ? roles[0] : { nombre: 'solo_vista', permisos: '{}' };
    const permisos = parsePermisos(rol.permisos);

    // Crear sesión
    req.session.usuario = {
      id: usuario.id,
      correo: usuario.correo,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      rol: rol.nombre,
      permisos
    };

    res.json({
      success: true,
      usuario: req.session.usuario,
      mensaje: 'Login exitoso'
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/admin-login - Login de admin con usuario y contraseña
router.post('/admin-login', async (req, res) => {
  try {
    const { usuario, contrasena } = req.body;

    if (!usuario || !contrasena) {
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    console.log('🔐 Intento de admin login con usuario:', usuario);

    // Buscar usuario por nombre de usuario
    // Nota: Usamos el correo como usuario por ahora
    // Si existe un campo usuario específico, reemplazar esta query
    const [usuarios] = await pool.query(
      `SELECT ua.id, ua.correo, ua.nombre, ua.apellido, ua.rol_id, ua.estado, ua.password_hash
       FROM usuarios_auth ua
       WHERE ua.correo = ? OR CONCAT(ua.nombre, ' ', ua.apellido) = ?`,
      [usuario, usuario]
    );

    if (usuarios.length === 0) {
      console.warn('❌ Usuario no encontrado:', usuario);
      await registrarLoginFallido(usuario, req, 'Usuario no encontrado');
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const usuarioData = usuarios[0];

    // Verificar si está bloqueado
    if (usuarioData.estado === 'bloqueado') {
      console.warn('🚫 Usuario bloqueado:', usuario);
      await registrarLoginFallido(usuario, req, 'Usuario bloqueado');
      return res.status(403).json({ error: 'Usuario bloqueado' });
    }

    // Comparar contraseña
    // Nota: La contraseña debe estar hasheada en la BD
    // Si no hay password_hash, usar un hash simple para dev
    let contrasenaValida = false;
    
    if (usuarioData.password_hash) {
      // Comparar con hash (aquí usarías bcrypt en producción)
      // Por ahora, comparación simple (NO recomendado en prod)
      contrasenaValida = usuarioData.password_hash === contrasena;
    } else {
      // Si no hay hash, admitir la contraseña si es "admin"
      contrasenaValida = contrasena === 'admin';
    }

    if (!contrasenaValida) {
      console.warn('❌ Contraseña incorrecta para usuario:', usuario);
      await registrarLoginFallido(usuario, req, 'Contraseña incorrecta');
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    console.log('✅ Admin login exitoso:', usuarioData.correo);

    // Registrar login exitoso
    await pool.query(
      `INSERT INTO audit_login (usuario_id, correo, ip_address, user_agent, login_exitoso)
       VALUES (?, ?, ?, ?, true)`,
      [usuarioData.id, usuarioData.correo, req.ip, req.get('user-agent')]
    );

    // Actualizar último login
    await pool.query(
      'UPDATE usuarios_auth SET ultimo_login = NOW() WHERE id = ?',
      [usuarioData.id]
    );

    // Obtener rol y permisos
    const [roles] = await pool.query(
      'SELECT nombre, permisos FROM roles WHERE id = ?',
      [usuarioData.rol_id]
    );

    const rol = roles.length > 0 ? roles[0] : { nombre: 'admin', permisos: '{}' };
    const permisos = parsePermisos(rol.permisos);

    // Crear sesión
    req.session.usuario = {
      id: usuarioData.id,
      correo: usuarioData.correo,
      nombre: usuarioData.nombre,
      apellido: usuarioData.apellido,
      rol: rol.nombre,
      permisos
    };

    res.json({
      success: true,
      usuario: req.session.usuario,
      mensaje: 'Admin login exitoso'
    });
  } catch (error) {
    console.error('❌ Error en admin login:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/auth/logout - Logout
router.post('/logout', (req, res) => {
  const isKeycloak = isKeycloakEnabled();
  
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error al cerrar sesión' });
    }
    
    if (isKeycloak) {
      // Si usa Keycloak, devolver URL de logout
      const logoutUrl = getLogoutUrl(process.env.FRONTEND_URL || 'http://localhost:5173');
      return res.json({ 
        success: true, 
        mensaje: 'Sesión cerrada',
        keycloakLogout: true,
        logoutUrl 
      });
    }
    
    res.json({ success: true, mensaje: 'Sesión cerrada' });
  });
});

// GET /api/auth/config - Obtener configuración de autenticación
router.get('/config', (req, res) => {
  // Detectar el protocolo y host desde el request
  const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
  const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:3000';
  
  // Construir URL base del callback dinámicamente
  const callbackUrl = `${protocol}://${host}/api/auth/keycloak/callback`;
  
  const loginUrl = isKeycloakEnabled() ? getLoginUrl(callbackUrl) : null;
  
  res.json({
    keycloakEnabled: isKeycloakEnabled(),
    loginUrl: loginUrl
  });
});

// GET /api/auth/keycloak/login - Redirigir a Keycloak para login
router.get('/keycloak/login', (req, res) => {
  if (!isKeycloakEnabled()) {
    return res.status(400).json({ error: 'Keycloak no está habilitado' });
  }

  // Detectar el protocolo y host desde el request para construir URL dinámica
  const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
  const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:3000';
  const callbackUrl = `${protocol}://${host}/api/auth/keycloak/callback`;
  
  console.log(`🔐 Keycloak login - Callback URL: ${callbackUrl}`);
  
  const loginUrl = getLoginUrl(callbackUrl);
  res.json({ loginUrl });
});

// GET /api/auth/keycloak/callback - Callback de Keycloak después del login
router.get('/keycloak/callback', async (req, res) => {
  if (!isKeycloakEnabled()) {
    return res.status(400).json({ error: 'Keycloak no está habilitado' });
  }

  try {
    const { code, error: oauth_error } = req.query;

    if (oauth_error) {
      console.error('❌ Error de OAuth desde Keycloak:', oauth_error);
      
      // Intentar detectar de dónde vino el request
      const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
      const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:5175';
      // Cambiar puerto de 3000 a 5175 si es necesario
      const frontendHost = host.replace(':3000', ':5175');
      
      return res.redirect(`${protocol}://${frontendHost}/login?error=oauth_error`);
    }

    if (!code) {
      console.error('❌ No se recibió código de autorización');
      
      const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
      const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:5175';
      const frontendHost = host.replace(':3000', ':5175');
      
      return res.redirect(`${protocol}://${frontendHost}/login?error=no_code`);
    }

    console.log('📝 Recibido código de autorización:', code.substring(0, 20) + '...');

    // Intercambiar código por tokens
    const protocol = req.get('x-forwarded-proto') || req.protocol || 'http';
    const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:3000';
    const callbackUrl = `${protocol}://${host}/api/auth/keycloak/callback`;
    
    console.log(`🔐 Keycloak callback - URL del callback: ${callbackUrl}`);
    
    const tokens = await exchangeCodeForToken(code, callbackUrl);

    console.log('✅ Tokens recibidos de Keycloak');

    // Decodificar el access token para obtener información del usuario
    const userPayload = decodeJWT(tokens.access_token);
    
    console.log('👤 Usuario de Keycloak:', userPayload.email);

    const userInfo = {
      id: userPayload.sub,
      username: userPayload.preferred_username,
      email: userPayload.email,
      firstName: userPayload.given_name || '',
      lastName: userPayload.family_name || '',
      roles: userPayload.realm_access?.roles || [],
      groups: userPayload.groups || []
    };

    // Mapear roles de Keycloak a roles del sistema
    const adminRole = process.env.KEYCLOAK_ROLE_ADMIN || 'admin';
    const secretariaRole = process.env.KEYCLOAK_ROLE_SECRETARIA || 'secretaria';
    const soloVistaRole = process.env.KEYCLOAK_ROLE_SOLO_VISTA || 'empleado';

    let systemRole = 'solo_vista'; // Por defecto
    if (userInfo.roles.includes(adminRole)) {
      systemRole = 'admin';
    } else if (userInfo.roles.includes(secretariaRole)) {
      systemRole = 'secretaria';
    } else if (userInfo.roles.includes(soloVistaRole)) {
      systemRole = 'solo_vista';
    }

    console.log('🔑 Rol mapeado:', systemRole, 'Roles Keycloak:', userInfo.roles);

    // Buscar o crear usuario en la base de datos
    const [usuarios] = await pool.query(
      'SELECT id, correo, nombre, apellido, rol_id, estado, keycloak_id FROM usuarios_auth WHERE keycloak_id = ? OR correo = ?',
      [userInfo.id, userInfo.email]
    );

    let usuario;
    
    if (usuarios.length === 0) {
      console.log('➕ Creando nuevo usuario:', userInfo.email);
      
      // Crear nuevo usuario
      const [roleRows] = await pool.query(
        'SELECT id FROM roles WHERE nombre = ?',
        [systemRole]
      );

      const rolId = roleRows.length > 0 ? roleRows[0].id : 1;

      const [result] = await pool.query(
        `INSERT INTO usuarios_auth (correo, nombre, apellido, keycloak_id, rol_id, estado)
         VALUES (?, ?, ?, ?, ?, 'activo')`,
        [userInfo.email, userInfo.firstName, userInfo.lastName, userInfo.id, rolId]
      );

      usuario = {
        id: result.insertId,
        correo: userInfo.email,
        nombre: userInfo.firstName,
        apellido: userInfo.lastName,
        rol_id: rolId,
        keycloak_id: userInfo.id
      };
    } else {
      usuario = usuarios[0];
      console.log('🔄 Usuario existente:', usuario.correo);

      // Actualizar keycloak_id si no existe
      if (!usuario.keycloak_id) {
        await pool.query(
          'UPDATE usuarios_auth SET keycloak_id = ? WHERE id = ?',
          [userInfo.id, usuario.id]
        );
      }

      // Verificar si está bloqueado
      if (usuario.estado === 'bloqueado') {
        console.log('🚫 Usuario bloqueado:', usuario.correo);
        await registrarLoginFallido(userInfo.email, req, 'Usuario bloqueado');
        
        const protocolFE = req.get('x-forwarded-proto') || req.protocol || 'http';
        const hostFE = req.get('x-forwarded-host') || req.get('host') || 'localhost:5175';
        const frontendHost = hostFE.replace(':3000', ':5175');
        
        return res.redirect(`${protocolFE}://${frontendHost}/login?error=blocked`);
      }
    }

    // Registrar login exitoso
    await pool.query(
      `INSERT INTO audit_login (usuario_id, correo, ip_address, user_agent, login_exitoso)
       VALUES (?, ?, ?, ?, true)`,
      [usuario.id, userInfo.email, req.ip, req.get('user-agent')]
    );

    // Actualizar último login
    await pool.query(
      'UPDATE usuarios_auth SET ultimo_login = NOW() WHERE id = ?',
      [usuario.id]
    );

    // Obtener rol y permisos
    const [roles] = await pool.query(
      'SELECT nombre, permisos FROM roles WHERE id = ?',
      [usuario.rol_id]
    );

    const rol = roles.length > 0 ? roles[0] : { nombre: systemRole, permisos: '{}' };
    const permisos = parsePermisos(rol.permisos);

    // Crear sesión
    req.session.usuario = {
      id: usuario.id,
      correo: userInfo.email,
      nombre: userInfo.firstName || usuario.nombre,
      apellido: userInfo.lastName || usuario.apellido,
      rol: rol.nombre,
      permisos,
      keycloak_id: userInfo.id
    };

    // Guardar sesión antes de redirigir
    req.session.save((err) => {
      if (err) {
        console.error('❌ Error guardando sesión:', err);
        
        const protocolFE = req.get('x-forwarded-proto') || req.protocol || 'http';
        const hostFE = req.get('x-forwarded-host') || req.get('host') || 'localhost:5175';
        const frontendHost = hostFE.replace(':3000', ':5175');
        
        return res.redirect(`${protocolFE}://${frontendHost}/login?error=session_error`);
      }
      
      console.log('✅ Sesión guardada para usuario:', userInfo.email, 'Session ID:', req.sessionID);
      
      // Redirigir al componente callback del frontend
      const protocolFE = req.get('x-forwarded-proto') || req.protocol || 'http';
      const hostFE = req.get('x-forwarded-host') || req.get('host') || 'localhost:5175';
      const frontendHost = hostFE.replace(':3000', ':5175');
      
      res.redirect(`${protocolFE}://${frontendHost}/auth/callback`);
    });

  } catch (error) {
    console.error('❌ Error en callback de Keycloak:', error.message);
    console.error('Stack:', error.stack);
    
    const protocolFE = req.get('x-forwarded-proto') || req.protocol || 'http';
    const hostFE = req.get('x-forwarded-host') || req.get('host') || 'localhost:5175';
    const frontendHost = hostFE.replace(':3000', ':5175');
    
    res.redirect(`${protocolFE}://${frontendHost}/login?error=server_error`);
  }
});


// Función auxiliar para registrar login fallido
async function registrarLoginFallido(correo, req, motivo) {
  try {
    await pool.query(
      `INSERT INTO audit_login (correo, ip_address, user_agent, login_exitoso, motivo_fallo)
       VALUES (?, ?, ?, false, ?)`,
      [correo, req.ip, req.get('user-agent'), motivo]
    );
  } catch (error) {
    console.error('Error registrando login fallido:', error);
  }
}

module.exports = router;

function parsePermisos(value) {
  if (!value) {
    return {};
  }
  if (typeof value === 'object') {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn('⚠️  Permisos no son JSON valido, usando objeto vacio.');
    return {};
  }
}
