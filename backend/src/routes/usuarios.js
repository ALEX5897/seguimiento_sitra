const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET - Obtener todos los empleados (requiere autenticación)
router.get('/', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, usuario, correo, nombre, cargo, gerencia, telefono, estado, created_at FROM empleados ORDER BY gerencia ASC, nombre ASC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - Obtener empleado por ID (requiere autenticación)
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM empleados WHERE id = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Empleado no encontrado' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST - Crear nuevo empleado (requiere autenticación)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { usuario, nombre, correo, cargo, gerencia, telefono, estado } = req.body;

    if (!nombre || !correo) {
      return res.status(400).json({ error: 'Nombre y correo son requeridos' });
    }

    // Verificar que el correo sea único
    const [existente] = await db.query(
      'SELECT id FROM empleados WHERE correo = ?',
      [correo]
    );
    if (existente.length > 0) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    const usuarioFinal = usuario || correo.split('@')[0];

    const [result] = await db.query(
      'INSERT INTO empleados (usuario, nombre, correo, cargo, gerencia, telefono, estado) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [usuarioFinal, nombre, correo, cargo || null, gerencia || null, telefono || null, estado || 'activo']
    );

    res.status(201).json({
      id: result.insertId,
      mensaje: 'Empleado creado exitosamente'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT - Actualizar empleado (requiere autenticación)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { nombre, correo, cargo, gerencia, telefono, estado } = req.body;

    // Verificar que el empleado exista
    const [empleado] = await db.query(
      'SELECT * FROM empleados WHERE id = ?',
      [req.params.id]
    );
    if (empleado.length === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    // Si se cambia el correo, verificar que sea único
    if (correo && correo !== empleado[0].correo) {
      const [existente] = await db.query(
        'SELECT id FROM empleados WHERE correo = ? AND id != ?',
        [correo, req.params.id]
      );
      if (existente.length > 0) {
        return res.status(400).json({ error: 'El correo ya está registrado' });
      }
    }

    await db.query(
      'UPDATE empleados SET nombre = ?, correo = ?, cargo = ?, gerencia = ?, telefono = ?, estado = ? WHERE id = ?',
      [
        nombre || empleado[0].nombre,
        correo || empleado[0].correo,
        cargo || null,
        gerencia || null,
        telefono || null,
        estado || 'activo',
        req.params.id
      ]
    );

    res.json({ ok: true, mensaje: 'Empleado actualizado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE - Eliminar empleado (requiere autenticación)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const [empleado] = await db.query(
      'SELECT id FROM empleados WHERE id = ?',
      [req.params.id]
    );
    if (empleado.length === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }

    await db.query('DELETE FROM empleados WHERE id = ?', [req.params.id]);
    res.json({ ok: true, mensaje: 'Empleado eliminado exitosamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - Obtener todos los empleados activos (para dropdowns)
router.get('/activos/lista', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nombre, cargo, gerencia, correo FROM empleados WHERE estado = "activo" ORDER BY gerencia ASC, nombre ASC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - Obtener empleado por nombre (para asignación de documentos/tareas)
router.get('/nombre/:nombre', requireAuth, async (req, res) => {
  try {
    const nombreBusqueda = req.params.nombre.trim();
    const [rows] = await db.query(
      'SELECT id, nombre, correo, cargo, gerencia, telefono, estado FROM empleados WHERE LOWER(nombre) = LOWER(?) AND estado = "activo"',
      [nombreBusqueda]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - Buscar empleados por coincidencia (autocompletar)
router.get('/buscar/:termino', requireAuth, async (req, res) => {
  try {
    const termino = `%${req.params.termino}%`;
    const [rows] = await db.query(
      'SELECT id, nombre, cargo, gerencia FROM empleados WHERE LOWER(nombre) LIKE LOWER(?) AND estado = "activo" ORDER BY nombre ASC LIMIT 10',
      [termino]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - Obtener empleados por gerencia
router.get('/gerencia/:gerencia', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nombre, correo, cargo, gerencia FROM empleados WHERE gerencia = ? AND estado = "activo" ORDER BY nombre ASC',
      [req.params.gerencia]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
