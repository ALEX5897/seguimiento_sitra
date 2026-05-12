const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, requireAdmin, isAdmin } = require('../middleware/auth');

// GET - Obtener configuración de notificaciones (solo admin)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM notificaciones_config WHERE id = 1');
    if (!rows.length) {
      return res.status(404).json({ error: 'Configuración no encontrada' });
    }
    const config = rows[0];
    // Convertir valores booleanos para respuesta JSON
    config.activo = Boolean(config.activo);
    config.notificaciones_email_activas = Boolean(config.notificaciones_email_activas);
    config.notificaciones_app_activas = Boolean(config.notificaciones_app_activas);
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT - Actualizar configuración de notificaciones (solo admin)
router.put('/', requireAdmin, async (req, res) => {
  try {
    const { notificaciones_email_activas, notificaciones_app_activas, activo, hora_envio, dias_retraso } = req.body;

    const updates = {};
    if (notificaciones_email_activas !== undefined) {
      updates.notificaciones_email_activas = notificaciones_email_activas ? 1 : 0;
    }
    if (notificaciones_app_activas !== undefined) {
      updates.notificaciones_app_activas = notificaciones_app_activas ? 1 : 0;
    }
    if (activo !== undefined) {
      updates.activo = activo ? 1 : 0;
    }
    if (hora_envio !== undefined) {
      updates.hora_envio = hora_envio;
    }
    if (dias_retraso !== undefined) {
      updates.dias_retraso = parseInt(dias_retraso);
    }

    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(1);

    await db.query(
      `UPDATE notificaciones_config SET ${setClause}, updated_at = NOW() WHERE id = ?`,
      values
    );

    const [rows] = await db.query('SELECT * FROM notificaciones_config WHERE id = 1');
    const config = rows[0];
    // Convertir valores booleanos para respuesta JSON
    config.activo = Boolean(config.activo);
    config.notificaciones_email_activas = Boolean(config.notificaciones_email_activas);
    config.notificaciones_app_activas = Boolean(config.notificaciones_app_activas);
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - Endpoint de diagnóstico (público, solo para desarrollo)
router.get('/debug', async (req, res) => {
  try {
    const [config] = await db.query('SELECT * FROM notificaciones_config WHERE id = 1');
    if (!config.length) {
      return res.status(404).json({ error: 'Configuración no encontrada' });
    }
    const configData = config[0];
    // Convertir valores booleanos
    configData.activo = Boolean(configData.activo);
    configData.notificaciones_email_activas = Boolean(configData.notificaciones_email_activas);
    configData.notificaciones_app_activas = Boolean(configData.notificaciones_app_activas);
    res.json({
      config: configData,
      sessionUser: req.session?.usuario || null,
      isAuthenticated: !!req.session?.usuario,
      cookies: req.cookies || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - Obtener estado de envíos de notificaciones (solo admin)
router.get('/status', requireAdmin, async (req, res) => {
  try {
    // Obtener estadísticas de envíos
    const [ultimoEnvioNotificaciones] = await db.query(`
      SELECT MAX(fecha_envio) as ultimo_envio
      FROM notificaciones_log
      WHERE tipo = 'notificaciones_generales'
    `);

    const [ultimoEnvioExpirados] = await db.query(`
      SELECT MAX(fecha_envio) as ultimo_envio
      FROM notificaciones_log
      WHERE tipo = 'documentos_expirados'
    `);

    const [ultimoEnvioProximos] = await db.query(`
      SELECT MAX(fecha_envio) as ultimo_envio
      FROM notificaciones_log
      WHERE tipo = 'documentos_proximos'
    `);

    const [correosHoy] = await db.query(`
      SELECT COUNT(*) as total
      FROM notificaciones_log
      WHERE DATE(fecha_envio) = CURDATE()
    `);

    res.json({
      ultimo_envio_notificaciones: ultimoEnvioNotificaciones[0]?.ultimo_envio || null,
      ultimo_envio_expirados: ultimoEnvioExpirados[0]?.ultimo_envio || null,
      ultimo_envio_proximos: ultimoEnvioProximos[0]?.ultimo_envio || null,
      correos_enviados_hoy: correosHoy[0]?.total || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST - Enviar correo de prueba (solo admin)
router.post('/test-email', requireAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Correo electrónico requerido' });
    }

    // Importar servicio de notificaciones
    const { enviarCorreoPrueba } = require('../services/notificationService');

    const resultado = await enviarCorreoPrueba(email);

    res.json({
      success: true,
      message: `Correo de prueba enviado a ${email}`,
      resultado
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST - Enviar notificaciones ahora (solo admin)
router.post('/enviar-ahora', requireAdmin, async (req, res) => {
  try {
    const { documentosExpirados, documentosProximos } = req.body;

    if (!documentosExpirados && !documentosProximos) {
      return res.status(400).json({ error: 'Selecciona al menos una opción' });
    }

    const { ejecutarNotificacionesManual } = require('../services/notificationService');

    const resultado = await ejecutarNotificacionesManual({
      documentosExpirados,
      documentosProximos
    });

    console.log('📤 Notificaciones enviadas manualmente');

    res.json({
      success: true,
      mensaje: `Se enviaron notificaciones: ${resultado.correos_enviados} correos, ${resultado.notificaciones_creadas} notificaciones en app`,
      resultado
    });
  } catch (err) {
    console.error('❌ Error enviando notificaciones:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
