const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/catalogos/estados-reasignados - Obtener catálogo de estados (solo activos)
router.get('/estados-reasignados', async (req, res) => {
  try {
    const [estados] = await db.query(
      'SELECT id, codigo, nombre, descripcion, icono, color, activo FROM catalogo_estados_reasignados WHERE activo = true ORDER BY id ASC'
    );
    res.json(estados);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/catalogos/estados-reasignados/:codigo - Obtener estado por código
router.get('/estados-reasignados/:codigo', async (req, res) => {
  try {
    const [estado] = await db.query(
      'SELECT * FROM catalogo_estados_reasignados WHERE codigo = ? AND activo = true LIMIT 1',
      [req.params.codigo]
    );

    if (!estado.length) {
      return res.status(404).json({ error: 'Estado no encontrado' });
    }

    res.json(estado[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/catalogos/estados-reasignados - Crear nuevo estado (admin)
router.post('/estados-reasignados', async (req, res) => {
  try {
    const { codigo, nombre, descripcion, icono, color } = req.body;

    if (!codigo || !nombre) {
      return res.status(400).json({ error: 'Código y nombre son requeridos' });
    }

    const [result] = await db.query(
      'INSERT INTO catalogo_estados_reasignados (codigo, nombre, descripcion, icono, color) VALUES (?, ?, ?, ?, ?)',
      [codigo, nombre, descripcion || null, icono || null, color || null]
    );

    res.json({ id: result.insertId, codigo, nombre });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'El código del estado ya existe' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/catalogos/estados-reasignados/:id - Actualizar estado
router.put('/estados-reasignados/:id', async (req, res) => {
  try {
    const { nombre, descripcion, icono, color, activo } = req.body;

    await db.query(
      'UPDATE catalogo_estados_reasignados SET nombre = ?, descripcion = ?, icono = ?, color = ?, activo = ? WHERE id = ?',
      [nombre || null, descripcion || null, icono || null, color || null, activo !== undefined ? activo : true, req.params.id]
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/catalogos/estados-reasignados/:id - Desactivar estado (soft delete)
router.delete('/estados-reasignados/:id', async (req, res) => {
  try {
    await db.query(
      'UPDATE catalogo_estados_reasignados SET activo = false WHERE id = ?',
      [req.params.id]
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== IMPORTANCIAS =====

// GET /api/catalogos/importancias - Obtener catálogo de importancias (solo activas)
router.get('/importancias', async (req, res) => {
  try {
    const [importancias] = await db.query(
      'SELECT id, codigo, nombre, descripcion, icono, color, activo FROM catalogo_importancias WHERE activo = true ORDER BY id ASC'
    );
    res.json(importancias);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/catalogos/importancias/:codigo - Obtener importancia por código
router.get('/importancias/:codigo', async (req, res) => {
  try {
    const [importancia] = await db.query(
      'SELECT * FROM catalogo_importancias WHERE codigo = ? AND activo = true LIMIT 1',
      [req.params.codigo]
    );

    if (!importancia.length) {
      return res.status(404).json({ error: 'Importancia no encontrada' });
    }

    res.json(importancia[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/catalogos/importancias - Crear nueva importancia (admin)
router.post('/importancias', async (req, res) => {
  try {
    const { codigo, nombre, descripcion, icono, color } = req.body;

    if (!codigo || !nombre) {
      return res.status(400).json({ error: 'Código y nombre son requeridos' });
    }

    const [result] = await db.query(
      'INSERT INTO catalogo_importancias (codigo, nombre, descripcion, icono, color) VALUES (?, ?, ?, ?, ?)',
      [codigo, nombre, descripcion || null, icono || null, color || null]
    );

    res.json({ id: result.insertId, codigo, nombre });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'El código de importancia ya existe' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/catalogos/importancias/:id - Actualizar importancia
router.put('/importancias/:id', async (req, res) => {
  try {
    const { nombre, descripcion, icono, color, activo } = req.body;

    await db.query(
      'UPDATE catalogo_importancias SET nombre = ?, descripcion = ?, icono = ?, color = ?, activo = ? WHERE id = ?',
      [nombre || null, descripcion || null, icono || null, color || null, activo !== undefined ? activo : true, req.params.id]
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/catalogos/importancias/:id - Desactivar importancia (soft delete)
router.delete('/importancias/:id', async (req, res) => {
  try {
    await db.query(
      'UPDATE catalogo_importancias SET activo = false WHERE id = ?',
      [req.params.id]
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== GERENCIAS =====

// GET /api/catalogos/gerencias - Obtener catálogo de gerencias (solo activas)
router.get('/gerencias', async (req, res) => {
  try {
    const [gerencias] = await db.query(
      'SELECT id, codigo, nombre, descripcion, activo FROM catalogo_gerencias WHERE activo = true ORDER BY nombre ASC'
    );
    res.json(gerencias);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/catalogos/gerencias/:codigo - Obtener gerencia por código
router.get('/gerencias/:codigo', async (req, res) => {
  try {
    const [gerencia] = await db.query(
      'SELECT * FROM catalogo_gerencias WHERE codigo = ? AND activo = true LIMIT 1',
      [req.params.codigo]
    );

    if (!gerencia.length) {
      return res.status(404).json({ error: 'Gerencia no encontrada' });
    }

    res.json(gerencia[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/catalogos/gerencias - Crear nueva gerencia (admin)
router.post('/gerencias', async (req, res) => {
  try {
    const { codigo, nombre, descripcion } = req.body;

    if (!codigo || !nombre) {
      return res.status(400).json({ error: 'Código y nombre son requeridos' });
    }

    const [result] = await db.query(
      'INSERT INTO catalogo_gerencias (codigo, nombre, descripcion) VALUES (?, ?, ?)',
      [codigo, nombre, descripcion || null]
    );

    res.json({ id: result.insertId, codigo, nombre });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'El código de gerencia ya existe' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/catalogos/gerencias/:id - Actualizar gerencia
router.put('/gerencias/:id', async (req, res) => {
  try {
    const { nombre, descripcion, activo } = req.body;

    await db.query(
      'UPDATE catalogo_gerencias SET nombre = ?, descripcion = ?, activo = ? WHERE id = ?',
      [nombre || null, descripcion || null, activo !== undefined ? activo : true, req.params.id]
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/catalogos/gerencias/:id - Desactivar gerencia (soft delete)
router.delete('/gerencias/:id', async (req, res) => {
  try {
    await db.query(
      'UPDATE catalogo_gerencias SET activo = false WHERE id = ?',
      [req.params.id]
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
