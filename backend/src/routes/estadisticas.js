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

// KPIs de Reasignados - Estadísticas generales
router.get('/kpi/reasignados', requireAuth, async (req, res) => {
  try {
    // Total y estados
    const [stats] = await db.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN estado NOT IN ('archivado', 'eliminado', 'completado', 'enviado') THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN estado IN ('completado', 'enviado') OR respuesta IS NOT NULL THEN 1 ELSE 0 END) as resueltos,
        SUM(CASE WHEN fecha_max_respuesta < NOW() AND estado NOT IN ('archivado', 'eliminado', 'completado', 'enviado') THEN 1 ELSE 0 END) as vencidos,
        SUM(CASE WHEN fecha_max_respuesta > NOW() AND fecha_max_respuesta < DATE_ADD(NOW(), INTERVAL 24 HOUR) AND estado NOT IN ('archivado', 'eliminado', 'completado', 'enviado') THEN 1 ELSE 0 END) as proximosVencer
      FROM reasignados r
    `);

    const data = stats[0];
    const tasaCumplimiento = data.total > 0 ? Math.round((data.resueltos / data.total) * 100) : 0;

    res.json({
      total: data.total || 0,
      pendientes: data.pendientes || 0,
      resueltos: data.resueltos || 0,
      vencidos: data.vencidos || 0,
      proximosVencer: data.proximosVencer || 0,
      tasa_cumplimiento: tasaCumplimiento
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reasignados por persona/usuario
router.get('/kpi/reasignados-por-usuario', requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        COALESCE(r.reasignado_a, 'Sin asignar') as persona,
        COUNT(*) as total,
        SUM(CASE WHEN r.estado NOT IN ('archivado', 'eliminado', 'completado', 'enviado') THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN r.estado IN ('completado', 'enviado') OR r.respuesta IS NOT NULL THEN 1 ELSE 0 END) as resueltos,
        SUM(CASE WHEN r.fecha_max_respuesta < NOW() AND r.estado NOT IN ('archivado', 'eliminado', 'completado', 'enviado') THEN 1 ELSE 0 END) as vencidos
      FROM reasignados r
      GROUP BY COALESCE(r.reasignado_a, 'Sin asignar')
      ORDER BY pendientes DESC
    `);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reasignados por importancia con detalles
router.get('/kpi/reasignados-por-importancia', requireAuth, async (req, res) => {
  try {
    const usuario = req.usuarioAuth;
    let whereClause = '';
    const params = [];

    if (!canViewAll(usuario)) {
      const usuarioId = await getUserIdFromCorreo(db, usuario.correo);
      if (usuarioId) {
        whereClause = ' WHERE r.usuario_id = ?';
        params.push(usuarioId);
      } else {
        return res.json([]);
      }
    }

    const [rows] = await db.query(`
      SELECT
        COALESCE(r.importancia, 'No especificada') as importancia,
        COUNT(*) as total,
        SUM(CASE WHEN r.estado NOT IN ('archivado', 'eliminado', 'completado', 'enviado') THEN 1 ELSE 0 END) as pendientes,
        SUM(CASE WHEN r.fecha_max_respuesta < NOW() AND r.estado NOT IN ('archivado', 'eliminado', 'completado', 'enviado') THEN 1 ELSE 0 END) as vencidos
      FROM reasignados r
      ${whereClause}
      GROUP BY COALESCE(r.importancia, 'No especificada')
      ORDER BY FIELD(importancia, 'Urgente', 'Alta', 'Media', 'Baja', 'No especificada')
    `, params);

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tiempo promedio de respuesta (en días)
router.get('/kpi/tiempo-promedio-respuesta', requireAuth, async (req, res) => {
  try {
    const usuario = req.usuarioAuth;
    let whereClause = '';
    const params = [];

    if (!canViewAll(usuario)) {
      const usuarioId = await getUserIdFromCorreo(db, usuario.correo);
      if (usuarioId) {
        whereClause = ' WHERE r.usuario_id = ? AND (r.estado IN ("completado", "enviado") OR r.respuesta IS NOT NULL)';
        params.push(usuarioId);
      } else {
        return res.json({ tiempo_promedio_dias: 0, documentos_resueltos: 0 });
      }
    } else {
      whereClause = ' WHERE (r.estado IN ("completado", "enviado") OR r.respuesta IS NOT NULL)';
    }

    const [rows] = await db.query(`
      SELECT
        COUNT(*) as documentos_resueltos,
        ROUND(AVG(DATEDIFF(COALESCE(DATE(r.fecha_max_respuesta), DATE(r.created_at)), DATE(r.fecha_reasignacion))), 2) as tiempo_promedio_dias
      FROM reasignados r
      ${whereClause}
    `, params);

    res.json({
      documentos_resueltos: rows[0]?.documentos_resueltos || 0,
      tiempo_promedio_dias: rows[0]?.tiempo_promedio_dias || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
