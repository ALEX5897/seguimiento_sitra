const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// GET - Obtener todos los roles (solo admin)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const [roles] = await db.query(`
      SELECT id, nombre, descripcion, permisos,
             (SELECT COUNT(*) FROM usuarios_auth WHERE rol_id = roles.id) as cantidad_usuarios,
             created_at, updated_at
      FROM roles
      ORDER BY id
    `);

    // Parse permisos JSON if needed
    const rolesWithPermissions = roles.map(role => ({
      ...role,
      permisos: typeof role.permisos === 'string' ? JSON.parse(role.permisos || '{}') : (role.permisos || {})
    }));

    res.json(rolesWithPermissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - Obtener un rol específico (solo admin)
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const [roles] = await db.query(`
      SELECT id, nombre, descripcion, permisos,
             (SELECT COUNT(*) FROM usuarios_auth WHERE rol_id = roles.id) as cantidad_usuarios,
             created_at, updated_at
      FROM roles
      WHERE id = ?
    `, [req.params.id]);

    if (roles.length === 0) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }

    const role = roles[0];
    role.permisos = typeof role.permisos === 'string' ? JSON.parse(role.permisos || '{}') : (role.permisos || {});

    res.json(role);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST - Crear nuevo rol (solo admin)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { nombre, descripcion, permisos } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'Nombre del rol es requerido' });
    }

    // Verificar que el nombre sea único
    const [existing] = await db.query('SELECT id FROM roles WHERE nombre = ?', [nombre]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Ya existe un rol con ese nombre' });
    }

    const permisosJson = JSON.stringify(permisos || {});

    await db.query(
      'INSERT INTO roles (nombre, descripcion, permisos, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      [nombre, descripcion || '', permisosJson]
    );

    const [newRole] = await db.query('SELECT * FROM roles WHERE nombre = ?', [nombre]);
    const role = newRole[0];
    role.permisos = JSON.parse(role.permisos || '{}');
    role.cantidad_usuarios = 0;

    res.status(201).json({
      success: true,
      message: `Rol "${nombre}" creado exitosamente`,
      role
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT - Actualizar rol (solo admin)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { nombre, descripcion, permisos } = req.body;
    const roleId = req.params.id;

    // Verificar que el rol existe
    const [existingRole] = await db.query('SELECT * FROM roles WHERE id = ?', [roleId]);
    if (existingRole.length === 0) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }

    // Si se cambia el nombre, verificar que sea único
    if (nombre && nombre !== existingRole[0].nombre) {
      const [duplicate] = await db.query('SELECT id FROM roles WHERE nombre = ? AND id != ?', [nombre, roleId]);
      if (duplicate.length > 0) {
        return res.status(400).json({ error: 'Ya existe otro rol con ese nombre' });
      }
    }

    const updates = {};
    if (nombre !== undefined) updates.nombre = nombre;
    if (descripcion !== undefined) updates.descripcion = descripcion;
    if (permisos !== undefined) updates.permisos = JSON.stringify(permisos);

    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(roleId);

    if (setClause.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    await db.query(
      `UPDATE roles SET ${setClause}, updated_at = NOW() WHERE id = ?`,
      values
    );

    const [updatedRole] = await db.query(`
      SELECT id, nombre, descripcion, permisos,
             (SELECT COUNT(*) FROM usuarios_auth WHERE rol_id = roles.id) as cantidad_usuarios,
             created_at, updated_at
      FROM roles
      WHERE id = ?
    `, [roleId]);

    const role = updatedRole[0];
    role.permisos = JSON.parse(role.permisos || '{}');

    res.json({
      success: true,
      message: `Rol "${role.nombre}" actualizado exitosamente`,
      role
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE - Eliminar rol (solo admin) - con validaciones
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const roleId = req.params.id;

    // Verificar que el rol existe
    const [role] = await db.query('SELECT * FROM roles WHERE id = ?', [roleId]);
    if (role.length === 0) {
      return res.status(404).json({ error: 'Rol no encontrado' });
    }

    // No permitir eliminar roles predeterminados (admin, secretaria, solo_vista)
    if ([1, 2, 3].includes(parseInt(roleId))) {
      return res.status(400).json({ error: 'No se pueden eliminar los roles predeterminados del sistema' });
    }

    // Verificar que no hay usuarios asignados a este rol
    const [users] = await db.query('SELECT COUNT(*) as count FROM usuarios_auth WHERE rol_id = ?', [roleId]);
    if (users[0].count > 0) {
      return res.status(400).json({
        error: `No se puede eliminar el rol porque hay ${users[0].count} usuario(s) asignado(s)`
      });
    }

    await db.query('DELETE FROM roles WHERE id = ?', [roleId]);

    res.json({
      success: true,
      message: `Rol "${role[0].nombre}" eliminado exitosamente`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - Obtener estructura de permisos disponibles
router.get('/estructura/permisos', requireAdmin, async (req, res) => {
  try {
    const permisosDisponibles = {
      'dashboard': {
        nombre: 'Dashboard',
        descripcion: 'Acceso al panel principal',
        permisos: {
          'dashboard': 'Ver dashboard',
          'dashboard.estadisticas': 'Ver estadísticas'
        }
      },
      'documentos': {
        nombre: 'Documentos',
        descripcion: 'Gestión de documentos',
        permisos: {
          'documentos.ver': 'Ver documentos',
          'documentos.crear': 'Crear documentos',
          'documentos.editar': 'Editar documentos',
          'documentos.eliminar': 'Eliminar documentos'
        }
      },
      'reasignaciones': {
        nombre: 'Reasignaciones',
        descripcion: 'Gestión de reasignaciones',
        permisos: {
          'reasignaciones.ver': 'Ver reasignaciones',
          'reasignaciones.crear': 'Crear reasignaciones',
          'reasignaciones.editar': 'Editar reasignaciones',
          'reasignaciones.eliminar': 'Eliminar reasignaciones'
        }
      },
      'usuarios': {
        nombre: 'Usuarios',
        descripcion: 'Gestión de usuarios y roles',
        permisos: {
          'usuarios': 'Acceso completo a usuarios',
          'usuarios.ver': 'Ver usuarios',
          'usuarios.crear': 'Crear usuarios',
          'usuarios.editar': 'Editar usuarios',
          'usuarios.eliminar': 'Eliminar usuarios'
        }
      },
      'reportes': {
        nombre: 'Reportes',
        descripcion: 'Generación y visualización de reportes',
        permisos: {
          'reportes.ver': 'Ver reportes',
          'reportes.generar': 'Generar reportes',
          'reportes.descargar': 'Descargar reportes'
        }
      },
      'notificaciones': {
        nombre: 'Notificaciones',
        descripcion: 'Gestión de notificaciones',
        permisos: {
          'notificaciones.ver': 'Ver notificaciones',
          'notificaciones.configurar': 'Configurar notificaciones',
          'notificaciones.enviar': 'Enviar notificaciones manuales'
        }
      },
      'settings': {
        nombre: 'Configuración',
        descripcion: 'Configuración del sistema',
        permisos: {
          'settings': 'Acceso a configuración',
          'settings.smtp': 'Configurar SMTP',
          'settings.catalogos': 'Gestionar catálogos'
        }
      }
    };

    res.json(permisosDisponibles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
