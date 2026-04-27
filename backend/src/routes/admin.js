const express = require('express');
const router = express.Router();
const pool = require('../db');

// Middleware para verificar autenticación
function verificarAutenticacion(req, res, next) {
  if (!req.session?.usuario) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  next();
}

// Middleware para verificar rol admin
function verificarAdmin(req, res, next) {
  if (req.session?.usuario?.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Solo para administradores' });
  }
  next();
}

// GET /api/admin/usuarios/lista/roles - Listar todos los roles (DEBE IR ANTES DE /:id)
router.get('/lista/roles', verificarAutenticacion, verificarAdmin, async (req, res) => {
  try {
    const [roles] = await pool.query(
      'SELECT id, nombre, descripcion, permisos FROM roles ORDER BY nombre'
    );

    const rolesFormateados = roles.map(rol => ({
      id: rol.id,
      nombre: rol.nombre,
      descripcion: rol.descripcion,
      permisos: parsePermisos(rol.permisos)
    }));

    res.json({ roles: rolesFormateados });
  } catch (error) {
    console.error('Error listando roles:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/usuarios - Listar todos los usuarios
router.get('/', verificarAutenticacion, verificarAdmin, async (req, res) => {
  try {
    const [usuarios] = await pool.query(
      `SELECT ua.id, ua.correo, ua.nombre, ua.apellido, ua.rol_id, r.nombre as rol, 
              ua.estado, ua.ultimo_login, ua.created_at
       FROM usuarios_auth ua
       LEFT JOIN roles r ON ua.rol_id = r.id
       ORDER BY ua.created_at DESC`
    );

    res.json({ usuarios });
  } catch (error) {
    console.error('Error listando usuarios:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/usuarios/:id - Obtener usuario específico
router.get('/:id', verificarAutenticacion, verificarAdmin, async (req, res) => {
  try {
    const [usuarios] = await pool.query(
      `SELECT ua.id, ua.correo, ua.nombre, ua.apellido, ua.rol_id, r.nombre as rol, 
              ua.estado, ua.ultimo_login, ua.created_at
       FROM usuarios_auth ua
       LEFT JOIN roles r ON ua.rol_id = r.id
       WHERE ua.id = ?`,
      [req.params.id]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ usuario: usuarios[0] });
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/usuarios - Crear usuario
router.post('/', verificarAutenticacion, verificarAdmin, async (req, res) => {
  try {
    const { correo, nombre, apellido, rol_id } = req.body;

    if (!correo || !nombre) {
      return res.status(400).json({ error: 'Correo y nombre requeridos' });
    }

    // Verificar que el correo no exista
    const [existente] = await pool.query(
      'SELECT id FROM usuarios_auth WHERE correo = ?',
      [correo]
    );

    if (existente.length > 0) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    // Usar rol por defecto si no se especifica
    const rolAsignado = rol_id || 1; // 1 = solo_vista

    const [result] = await pool.query(
      `INSERT INTO usuarios_auth (correo, nombre, apellido, rol_id)
       VALUES (?, ?, ?, ?)`,
      [correo, nombre, apellido, rolAsignado]
    );

    res.status(201).json({
      id: result.insertId,
      correo,
      nombre,
      apellido,
      rol_id: rolAsignado,
      mensaje: 'Usuario creado exitosamente'
    });
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/usuarios/:id - Actualizar usuario
router.put('/:id', verificarAutenticacion, verificarAdmin, async (req, res) => {
  try {
    const { nombre, apellido, rol_id, estado } = req.body;
    const usuarioId = req.params.id;

    // Verificar que el usuario exista
    const [usuarios] = await pool.query(
      'SELECT id FROM usuarios_auth WHERE id = ?',
      [usuarioId]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Actualizar
    const campos = [];
    const valores = [];

    if (nombre !== undefined) {
      campos.push('nombre = ?');
      valores.push(nombre);
    }
    if (apellido !== undefined) {
      campos.push('apellido = ?');
      valores.push(apellido);
    }
    if (rol_id !== undefined) {
      campos.push('rol_id = ?');
      valores.push(rol_id);
    }
    if (estado !== undefined) {
      campos.push('estado = ?');
      valores.push(estado);
    }

    if (campos.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    valores.push(usuarioId);

    await pool.query(
      `UPDATE usuarios_auth SET ${campos.join(', ')} WHERE id = ?`,
      valores
    );

    res.json({ success: true, mensaje: 'Usuario actualizado' });
  } catch (error) {
    console.error('Error actualizando usuario:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/usuarios/:id - Eliminar usuario
router.delete('/:id', verificarAutenticacion, verificarAdmin, async (req, res) => {
  try {
    const usuarioId = req.params.id;

    // No permitir eliminar el mismo usuario
    if (req.session.usuario.id === parseInt(usuarioId)) {
      return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
    }

    // Verificar que el usuario exista
    const [usuarios] = await pool.query(
      'SELECT id FROM usuarios_auth WHERE id = ?',
      [usuarioId]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Eliminar sesiones activas
    await pool.query(
      'DELETE FROM sesiones WHERE usuario_id = ?',
      [usuarioId]
    );

    // Eliminar usuario
    await pool.query(
      'DELETE FROM usuarios_auth WHERE id = ?',
      [usuarioId]
    );

    res.json({ success: true, mensaje: 'Usuario eliminado' });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({ error: error.message });
  }
});

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
