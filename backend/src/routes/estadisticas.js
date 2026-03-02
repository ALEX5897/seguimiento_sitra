const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, canViewAll, getUserIdFromCorreo } = require('../middleware/auth');

//Estadísticas de tareas por área/gerencia
router.get('/tareas-por-area', requireAuth, async (req, res) => {
  try {
    const usuario = req.usuarioAuth;
    let query = `
      SELECT 
        COALESCE(u.gerencia, 'Sin asignar') as area,
        COUNT(*) as total,
        SUM(CASE WHEN t.estado = 'completado' OR t.avance = '100%' THEN 1 ELSE 0 END) as completadas,
        SUM(CASE WHEN t.estado = 'en_proceso' THEN 1 ELSE 0 END) as en_proceso,
        SUM(CASE WHEN t.estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes
      FROM tareas t
      LEFT JOIN usuarios u ON t.usuario_id = u.id
    `;
    
    const params = [];
    if (!canViewAll(usuario)) {
      const usuarioId = await getUserIdFromCorreo(db, usuario.correo);
      if (usuarioId) {
        query += ' WHERE t.usuario_id = ?';
        params.push(usuarioId);
      } else {
        return res.json([]);
      }
    }
    
    query += `
      GROUP BY COALESCE(u.gerencia, 'Sin asignar')
      ORDER BY total DESC
    `;
    
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Porcentaje de documentos expirados por área
router.get('/documentos-expirados-por-area', requireAuth, async (req, res) => {
  try {
    const usuario = req.usuarioAuth;
    let query = `
      SELECT 
        COALESCE(u.gerencia, 'Sin asignar') as area,
        COUNT(*) as total,
        SUM(CASE WHEN r.fecha_max_respuesta < NOW() AND r.estado NOT IN ('archivado', 'eliminado', 'enviado', 'completado') THEN 1 ELSE 0 END) as expirados
      FROM reasignados r
      LEFT JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.estado NOT IN ('archivado', 'eliminado', 'enviado', 'completado')
    `;
    
    const params = [];
    if (!canViewAll(usuario)) {
      const usuarioId = await getUserIdFromCorreo(db, usuario.correo);
      if (usuarioId) {
        query += ' AND r.usuario_id = ?';
        params.push(usuarioId);
      } else {
        return res.json([]);
      }
    }
    
    query += `
      GROUP BY COALESCE(u.gerencia, 'Sin asignar')
      ORDER BY expirados DESC
    `;
    
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Distribución de tipos de documento
router.get('/tipos-documento', requireAuth, async (req, res) => {
  try {
    const usuario = req.usuarioAuth;
    let query = `
      SELECT 
        COALESCE(tipo_documento, 'Sin especificar') as tipo,
        COUNT(*) as cantidad
      FROM reasignados
      WHERE estado NOT IN ('archivado', 'eliminado', 'enviado')
    `;
    
    const params = [];
    if (!canViewAll(usuario)) {
      const usuarioId = await getUserIdFromCorreo(db, usuario.correo);
      if (usuarioId) {
        query += ' AND usuario_id = ?';
        params.push(usuarioId);
      } else {
        return res.json([]);
      }
    }
    
    query += `
      GROUP BY COALESCE(tipo_documento, 'Sin especificar')
      ORDER BY cantidad DESC
    `;
    
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Estado general de tareas
router.get('/estado-tareas', requireAuth, async (req, res) => {
  try {
    const usuario = req.usuarioAuth;
    let query = `
      SELECT 
        COALESCE(estado, 'pendiente') as estado,
        COUNT(*) as cantidad
      FROM tareas
    `;
    
    const params = [];
    if (!canViewAll(usuario)) {
      const usuarioId = await getUserIdFromCorreo(db, usuario.correo);
      if (usuarioId) {
        query += ' WHERE usuario_id = ?';
        params.push(usuarioId);
      } else {
        return res.json([]);
      }
    }
    
    query += ' GROUP BY COALESCE(estado, \'pendiente\')';
    
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Distribución de importancia en reasignados
router.get('/importancia-reasignados', requireAuth, async (req, res) => {
  try {
    const usuario = req.usuarioAuth;
    let query = `
      SELECT 
        COALESCE(importancia, 'No especificada') as importancia,
        COUNT(*) as cantidad
      FROM reasignados
      WHERE estado NOT IN ('archivado', 'eliminado', 'enviado')
    `;
    
    const params = [];
    if (!canViewAll(usuario)) {
      const usuarioId = await getUserIdFromCorreo(db, usuario.correo);
      if (usuarioId) {
        query += ' AND usuario_id = ?';
        params.push(usuarioId);
      } else {
        return res.json([]);
      }
    }
    
    query += `
      GROUP BY COALESCE(importancia, 'No especificada')
      ORDER BY FIELD(importancia, 'Urgente', 'Alta', 'Media', 'Baja', 'No especificada')
    `;
    
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
