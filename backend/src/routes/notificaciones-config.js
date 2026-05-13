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

// GET - Obtener plantillas de notificación (solo admin)
router.get('/plantillas', requireAdmin, async (req, res) => {
  try {
    const [plantillas] = await db.query(
      'SELECT id, tipo, asunto, cuerpo_html FROM notificaciones_plantillas ORDER BY tipo'
    );
    res.json(plantillas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - Obtener plantilla específica (solo admin)
router.get('/plantillas/:tipo', requireAdmin, async (req, res) => {
  try {
    const [plantilla] = await db.query(
      'SELECT id, tipo, asunto, cuerpo_html FROM notificaciones_plantillas WHERE tipo = ?',
      [req.params.tipo]
    );
    if (!plantilla.length) {
      return res.status(404).json({ error: 'Plantilla no encontrada' });
    }
    res.json(plantilla[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT - Actualizar plantilla (solo admin)
router.put('/plantillas/:tipo', requireAdmin, async (req, res) => {
  try {
    const { asunto, cuerpo_html } = req.body;

    if (!asunto || !cuerpo_html) {
      return res.status(400).json({ error: 'Asunto y cuerpo HTML son requeridos' });
    }

    await db.query(
      'UPDATE notificaciones_plantillas SET asunto = ?, cuerpo_html = ?, updated_at = NOW() WHERE tipo = ?',
      [asunto, cuerpo_html, req.params.tipo]
    );

    const [plantilla] = await db.query(
      'SELECT id, tipo, asunto, cuerpo_html FROM notificaciones_plantillas WHERE tipo = ?',
      [req.params.tipo]
    );

    res.json({ success: true, plantilla: plantilla[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET - Obtener configuración de SMTP avanzada (solo admin)
router.get('/smtp-config', requireAdmin, async (req, res) => {
  try {
    const [config] = await db.query('SELECT * FROM notificaciones_smtp_config WHERE id = 1');
    if (!config.length) {
      return res.status(404).json({ error: 'Configuración no encontrada' });
    }
    res.json(config[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT - Actualizar configuración de SMTP avanzada (solo admin)
router.put('/smtp-config', requireAdmin, async (req, res) => {
  try {
    const {
      email_from,
      email_from_name,
      email_reply_to,
      email_cc,
      email_bcc,
      smtp_host,
      smtp_port,
      smtp_user,
      smtp_password
    } = req.body;

    const updates = {};
    if (email_from) updates.email_from = email_from;
    if (email_from_name) updates.email_from_name = email_from_name;
    if (email_reply_to !== undefined) updates.email_reply_to = email_reply_to;
    if (email_cc !== undefined) updates.email_cc = email_cc;
    if (email_bcc !== undefined) updates.email_bcc = email_bcc;
    if (smtp_host) updates.smtp_host = smtp_host;
    if (smtp_port) updates.smtp_port = parseInt(smtp_port);
    if (smtp_user) updates.smtp_user = smtp_user;
    if (smtp_password) updates.smtp_password = smtp_password;

    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(1);

    await db.query(
      `UPDATE notificaciones_smtp_config SET ${setClause}, updated_at = NOW() WHERE id = ?`,
      values
    );

    const [config] = await db.query('SELECT * FROM notificaciones_smtp_config WHERE id = 1');
    res.json({ success: true, config: config[0] });
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
