const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET - Obtener todos los usuarios (requiere autenticación)
router.get('/', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nombre, correo, cargo, gerencia, telefono, estado, created_at FROM usuarios ORDER BY gerencia ASC, nombre ASC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - Obtener usuario por ID (requiere autenticación)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM usuarios WHERE id = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST - Crear nuevo usuario (requiere autenticación)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { nombre, correo, cargo, gerencia, telefono, estado } = req.body;

    if (!nombre || !correo) {
      return res.status(400).json({ error: 'Nombre y correo son requeridos' });
    }

    // Verificar que el correo sea único
    const [existente] = await db.query(
      'SELECT id FROM usuarios WHERE correo = ?',
      [correo]
    );
    if (existente.length > 0) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    const [result] = await db.query(
      'INSERT INTO usuarios (nombre, correo, cargo, gerencia, telefono, estado, extra) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nombre, correo, cargo || null, gerencia || null, telefono || null, estado || 'activo', '{}']
    );

    res.status(201).json({ 
      id: result.insertId, 
      mensaje: 'Usuario creado exitosamente' 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT - Actualizar usuario (requiere autenticación)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { nombre, correo, cargo, gerencia, telefono, estado } = req.body;

    // Verificar que el usuario exista
    const [usuario] = await db.query(
      'SELECT id FROM usuarios WHERE id = ?',
      [req.params.id]
    );
    if (usuario.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Si se cambia el correo, verificar que sea único
    if (correo && correo !== usuario[0].correo) {
      const [existente] = await db.query(
        'SELECT id FROM usuarios WHERE correo = ? AND id != ?',
        [correo, req.params.id]
      );
      if (existente.length > 0) {
        return res.status(400).json({ error: 'El correo ya está registrado' });
      }
    }

    await db.query(
      'UPDATE usuarios SET nombre = ?, correo = ?, cargo = ?, gerencia = ?, telefono = ?, estado = ? WHERE id = ?',
      [
        nombre || usuario[0].nombre,
        correo || usuario[0].correo,
        cargo || null,
        gerencia || null,
        telefono || null,
        estado || 'activo',
        req.params.id
      ]
    );

    res.json({ ok: true, mensaje: 'Usuario actualizado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE - Eliminar usuario (requiere autenticación)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const [usuario] = await db.query(
      'SELECT id FROM usuarios WHERE id = ?',
      [req.params.id]
    );
    if (usuario.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await db.query('DELETE FROM usuarios WHERE id = ?', [req.params.id]);
    res.json({ ok: true, mensaje: 'Usuario eliminado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - Obtener todos los usuarios activos (para dropdowns)
router.get('/activos/lista', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nombre, cargo, gerencia, correo FROM usuarios WHERE estado = "activo" ORDER BY gerencia ASC, nombre ASC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - Obtener usuario por nombre (para asignación de documentos/tareas)
router.get('/nombre/:nombre', requireAuth, async (req, res) => {
  try {
    const nombreBusqueda = req.params.nombre.trim();
    const [rows] = await db.query(
      'SELECT id, nombre, correo, cargo, gerencia, telefono, estado FROM usuarios WHERE LOWER(nombre) = LOWER(?) AND estado = "activo"',
      [nombreBusqueda]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - Buscar usuarios por coincidencia (autocompletar)
router.get('/buscar/:termino', requireAuth, async (req, res) => {
  try {
    const termino = `%${req.params.termino}%`;
    const [rows] = await db.query(
      'SELECT id, nombre, cargo, gerencia FROM usuarios WHERE LOWER(nombre) LIKE LOWER(?) AND estado = "activo" ORDER BY nombre ASC LIMIT 10',
      [termino]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - Obtener usuarios por gerencia
router.get('/gerencia/:gerencia', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nombre, correo, cargo, gerencia FROM usuarios WHERE gerencia = ? AND estado = "activo" ORDER BY nombre ASC',
      [req.params.gerencia]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
