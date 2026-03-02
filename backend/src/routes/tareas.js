const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, canViewAll, getUserIdFromCorreo } = require('../middleware/auth');

// GET /api/tareas - Obtener tareas (filtrado por rol)
router.get('/', requireAuth, async (req, res) => {
  try {
    const usuario = req.usuarioAuth;
    let query = 'SELECT * FROM tareas';
    let params = [];
    
    // Si el usuario no puede ver todo, filtrar solo sus tareas
    if (!canViewAll(usuario)) {
      // Obtener el usuario_id de la tabla usuarios basado en el correo
      const usuarioId = await getUserIdFromCorreo(db, usuario.correo);
      
      if (usuarioId) {
        query += ' WHERE usuario_id = ?';
        params.push(usuarioId);
      } else {
        // Si no existe en la tabla usuarios, no mostrar nada
        return res.json([]);
      }
    }
    
    query += ' ORDER BY id DESC LIMIT 100';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const b = req.body;
    const [result] = await db.query(
      'INSERT INTO tareas (numero_documento, fecha_documento, fecha_asignacion, asignado_para, usuario_id, descripcion, fecha_maxima, avance, estado, nro_dias, remitente, destinatario, asunto, extra) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [b.numero_documento || null, b.fecha_documento || b.due_date || null, b.fecha_asignacion || null, b.asignado_para || b.assigned_to || null, b.usuario_id || null, b.descripcion || b.description || null, b.fecha_maxima || null, b.avance || null, b.estado || b.status || null, b.nro_dias || null, b.remitente || null, b.destinatario || null, b.asunto || null, JSON.stringify(b.extra || {})]
    );
    res.json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// CRUD endpoints
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tareas WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const b = req.body;
    await db.query('UPDATE tareas SET numero_documento = ?, fecha_documento = ?, fecha_asignacion = ?, asignado_para = ?, usuario_id = ?, descripcion = ?, fecha_maxima = ?, avance = ?, estado = ?, nro_dias = ?, remitente = ?, destinatario = ?, asunto = ?, extra = ? WHERE id = ?', [b.numero_documento || null, b.fecha_documento || b.due_date || null, b.fecha_asignacion || null, b.asignado_para || b.assigned_to || null, b.usuario_id || null, b.descripcion || b.description || null, b.fecha_maxima || null, b.avance || null, b.estado || b.status || null, b.nro_dias || null, b.remitente || null, b.destinatario || null, b.asunto || null, JSON.stringify(b.extra || {}), req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM tareas WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
