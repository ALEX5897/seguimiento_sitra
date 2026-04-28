const express = require('express');
const router = express.Router();
const pool = require('../db');
const { ejecutarTodasLasNotificaciones } = require('../services/notificationService');

function verificarAutenticacion(req, res, next) {
  if (!req.session?.usuario) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  next();
}

function verificarAdmin(req, res, next) {
  if (req.session?.usuario?.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Solo para administradores' });
  }
  next();
}

// GET /api/admin/notificaciones/config
router.get('/config', verificarAutenticacion, verificarAdmin, async (req, res) => {
  try {
    const [config] = await pool.query(
      'SELECT id, activo, hora_envio, dias_retraso, updated_at FROM notificaciones_config WHERE id = 1'
    );

    if (config.length === 0) {
      return res.status(404).json({ error: 'Configuración no encontrada' });
    }

    res.json(config[0]);
  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/notificaciones/config
router.put('/config', verificarAutenticacion, verificarAdmin, async (req, res) => {
  try {
    const { activo, hora_envio, dias_retraso } = req.body;

    if (!hora_envio || !/^\d{2}:\d{2}$/.test(hora_envio)) {
      return res.status(400).json({ error: 'Formato de hora inválido (usar HH:MM)' });
    }

    if (dias_retraso === undefined || dias_retraso < 0 || dias_retraso > 30) {
      return res.status(400).json({ error: 'Días de retraso debe estar entre 0 y 30' });
    }

    await pool.query(
      'UPDATE notificaciones_config SET activo = ?, hora_envio = ?, dias_retraso = ? WHERE id = 1',
      [activo === true ? 1 : 0, hora_envio, dias_retraso]
    );

    res.json({
      success: true,
      message: 'Configuración actualizada',
      nota: 'El cambio de hora requerirá reiniciar el servidor para que tome efecto el nuevo horario del CRON'
    });
  } catch (error) {
    console.error('Error actualizando configuración:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/notificaciones/plantillas
router.get('/plantillas', verificarAutenticacion, verificarAdmin, async (req, res) => {
  try {
    const [plantillas] = await pool.query(
      'SELECT id, tipo, asunto, cuerpo_html, updated_at FROM notificaciones_plantillas ORDER BY tipo'
    );

    res.json(plantillas);
  } catch (error) {
    console.error('Error obteniendo plantillas:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/notificaciones/plantillas/:tipo
router.get('/plantillas/:tipo', verificarAutenticacion, verificarAdmin, async (req, res) => {
  try {
    const [plantilla] = await pool.query(
      'SELECT id, tipo, asunto, cuerpo_html, updated_at FROM notificaciones_plantillas WHERE tipo = ?',
      [req.params.tipo]
    );

    if (plantilla.length === 0) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }

    res.json(plantilla[0]);
  } catch (error) {
    console.error('Error obteniendo plantilla:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/admin/notificaciones/plantillas/:tipo
router.put('/plantillas/:tipo', verificarAutenticacion, verificarAdmin, async (req, res) => {
  try {
    const { asunto, cuerpo_html } = req.body;
    const tipo = req.params.tipo;

    if (!asunto || asunto.trim() === '') {
      return res.status(400).json({ error: 'El asunto es requerido' });
    }

    if (!cuerpo_html || cuerpo_html.trim() === '') {
      return res.status(400).json({ error: 'El cuerpo HTML es requerido' });
    }

    if (!['asignado', 'tarde'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo de plantilla inválido (asignado|tarde)' });
    }

    const result = await pool.query(
      'UPDATE notificaciones_plantillas SET asunto = ?, cuerpo_html = ? WHERE tipo = ?',
      [asunto, cuerpo_html, tipo]
    );

    if (result[0].affectedRows === 0) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }

    res.json({ success: true, message: 'Plantilla actualizada' });
  } catch (error) {
    console.error('Error actualizando plantilla:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/notificaciones/test
router.post('/test', verificarAutenticacion, verificarAdmin, async (req, res) => {
  try {
    await ejecutarTodasLasNotificaciones();
    res.json({ success: true, message: 'Notificaciones ejecutadas manualmente' });
  } catch (error) {
    console.error('Error ejecutando notificaciones:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
