const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, canViewAll, getUserIdFromCorreo } = require('../middleware/auth');

// GET /api/enviados - Obtener enviados (filtrado por rol)
router.get('/', requireAuth, async (req, res) => {
  try {
    const usuario = req.usuarioAuth;
    let query = 'SELECT * FROM enviados';
    let params = [];
    
    // Si el usuario no puede ver todo, filtrar solo sus documentos
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
      'INSERT INTO enviados (numero_documento, remitente, para, usuario_id, asunto, fecha_documento, no_referencia, tipo_documento, nro_tramite, estado, extra) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [b.numero_documento || b.document_number || null, b.remitente || null, b.para || b.to || null, b.usuario_id || null, b.asunto || null, b.fecha_documento || b.date_sent || null, b.no_referencia || null, b.tipo_documento || null, b.nro_tramite || null, b.estado || b.status || null, JSON.stringify(b.extra || {})]
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
    const [rows] = await db.query('SELECT * FROM enviados WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const b = req.body;
    await db.query('UPDATE enviados SET numero_documento = ?, remitente = ?, para = ?, usuario_id = ?, asunto = ?, fecha_documento = ?, no_referencia = ?, tipo_documento = ?, nro_tramite = ?, estado = ?, extra = ? WHERE id = ?', [b.numero_documento || b.document_number || null, b.remitente || null, b.para || b.to || null, b.usuario_id || null, b.asunto || null, b.fecha_documento || b.date_sent || null, b.no_referencia || null, b.tipo_documento || null, b.nro_tramite || null, b.estado || b.status || null, JSON.stringify(b.extra || {}), req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM enviados WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
