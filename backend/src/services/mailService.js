const nodemailer = require('nodemailer');
require('dotenv').config();

// Variables globales para configuración
let smtpConfig = null;
let transporter = null;

// NOTA: Para usar correo de prueba, define NOTIFICATION_TEST_EMAIL o MAIL_TO_PRUEBA en .env
const notificationTestEmail = process.env.NOTIFICATION_TEST_EMAIL || process.env.MAIL_TO_PRUEBA || '';

console.log("TEST_EMAIL:", notificationTestEmail || 'No configurado - usando correos reales');

/**
 * Obtener configuración de SMTP desde BD o .env
 */
async function obtenerConfiguracionSMTP() {
  try {
    const db = require('../db');
    const [config] = await db.query('SELECT * FROM notificaciones_smtp_config WHERE id = 1');

    if (config.length > 0) {
      console.log("✅ Configuración SMTP cargada desde BD");
      return config[0];
    }
  } catch (error) {
    console.warn('⚠️  No se pudo cargar configuración de BD, usando .env');
  }

  // Fallback a .env si no existe en BD
  return {
    smtp_host: process.env.SMTP_HOST || process.env.MAIL_HOST,
    smtp_port: parseInt(process.env.SMTP_PORT || process.env.MAIL_PORT || 587),
    smtp_secure: (process.env.SMTP_SECURE || process.env.MAIL_SECURE) === 'true',
    smtp_require_tls: (process.env.SMTP_REQUIRE_TLS || process.env.MAIL_REQUIRE_TLS) === 'true',
    smtp_user: process.env.SMTP_USER || process.env.MAIL_USER,
    smtp_password: process.env.SMTP_PASSWORD || process.env.MAIL_PASS,
    email_from: process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.MAIL_USER,
    email_from_name: process.env.EMAIL_FROM_NAME || 'SITRA - Sistema de Seguimiento',
    email_reply_to: process.env.EMAIL_REPLY_TO || null,
    email_cc: process.env.EMAIL_CC || null,
    email_bcc: process.env.EMAIL_BCC || null
  };
}

/**
 * Crear transporter con configuración actual
 */
async function crearTransporter() {
  const config = await obtenerConfiguracionSMTP();

  console.log("SMTP_HOST:", config.smtp_host);
  console.log("SMTP_USER:", config.smtp_user);
  console.log("FROM:", config.email_from);

  const transporterConfig = {
    host: config.smtp_host,
    port: config.smtp_port,
    secure: config.smtp_secure,
    requireTLS: config.smtp_require_tls,
    auth: {
      user: config.smtp_user,
      pass: config.smtp_password
    },
    tls: {
      rejectUnauthorized: false
    }
  };

  smtpConfig = config;
  transporter = nodemailer.createTransport(transporterConfig);
  return transporter;
}

// Inicializar transporter al cargar el módulo
crearTransporter().catch(err => console.error('Error inicializando transporter:', err));

function reemplazarVariables(texto, datos) {
  if (!texto) return texto;
  let resultado = texto;
  const variables = {
    '{{nombre}}': datos.nombre || 'Usuario',
    '{{numero_documento}}': datos.numero_documento || '-',
    '{{fecha_max_respuesta}}': datos.fecha_max_respuesta || '-',
    '{{remitente}}': datos.remitente || '-',
    '{{asunto}}': datos.asunto || '-',
    '{{destinatario}}': datos.destinatario || '-',
    '{{cantidad}}': datos.cantidad || '0',
    '{{tabla_documentos}}': datos.tabla_documentos || ''
  };

  Object.entries(variables).forEach(([variable, valor]) => {
    resultado = resultado.replace(new RegExp(variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), valor);
  });

  return resultado;
}

/**
 * Enviar correo de documentos expirados/próximos a expirar
 * @param {Object} usuario - Datos del usuario {correo, nombre}
 * @param {Array} documentos - Array de documentos expirados/próximos a expirar
 * @param {String} tipo - 'expirado', 'proximo' (1 día antes) o 'nuevo'
 * @param {Object} plantillaPersonalizada - Plantilla personalizada {asunto, cuerpo_html}
 */
async function enviarNotificacionDocumentos(usuario, documentos, tipo = 'expirado', plantillaPersonalizada = null) {
  try {
    // Verificar si las notificaciones por correo están activas
    const db = require('../db');
    const [config] = await db.query('SELECT notificaciones_email_activas FROM notificaciones_config WHERE id = 1');

    if (config[0] && !config[0].notificaciones_email_activas) {
      console.log('ℹ️ Notificaciones por correo desactivadas. No se envió correo de documentos.');
      return false;
    }
  } catch (error) {
    console.error('⚠️ Error verificando configuración de notificaciones:', error.message);
    // Continuar de todas formas en caso de error
  }

  const destinatarioOverride = notificationTestEmail && notificationTestEmail.trim();
  const correoUsuario = usuario && usuario.correo ? String(usuario.correo).trim() : '';
  const nombreUsuario = usuario && usuario.nombre ? usuario.nombre : 'Usuario';

  if (!destinatarioOverride && (!correoUsuario || !correoUsuario.trim())) {
    console.log(`⚠️ Usuario "${usuario && usuario.nombre ? usuario.nombre : 'Desconocido'}" no tiene correo registrado`);
    return false;
  }

  try {
    const tipoNormalizado = String(tipo || 'expirado').toLowerCase();
    const esExpirado = tipoNormalizado === 'expirado';
    const esProximo = tipoNormalizado === 'proximo';
    const esNuevo = tipoNormalizado === 'nuevo';

    const tablaHTML = generarTablaHTML(documentos, { esExpirado, esProximo, esNuevo });

    let asunto, html;

    if (plantillaPersonalizada) {
      const datosTemplate = {
        nombre: nombreUsuario,
        numero_documento: documentos.length > 0 ? documentos[0].numero_documento : '-',
        fecha_max_respuesta: documentos.length > 0 ? formatearFecha(documentos[0].fecha_max_respuesta) : '-',
        remitente: documentos.length > 0 ? documentos[0].remitente : '-',
        asunto: documentos.length > 0 ? documentos[0].asunto : '-',
        destinatario: documentos.length > 0 ? documentos[0].destinatario : '-',
        cantidad: documentos.length,
        tabla_documentos: tablaHTML
      };

      asunto = reemplazarVariables(plantillaPersonalizada.asunto, datosTemplate);
      const cuerpoPersonalizado = reemplazarVariables(plantillaPersonalizada.cuerpo_html, datosTemplate);

      html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #f0f0f0; padding: 12px; text-align: left; font-weight: bold; border: 1px solid #ddd; }
            td { padding: 12px; border: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <div class="container">
            ${cuerpoPersonalizado}
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 12px;">
              <p>Este es un correo automático del Sistema de Gestión de Documentos (SISTRA).</p>
              <p>Por favor, no responda a este correo. Si tiene preguntas, contacte al administrador.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      const titulo = esNuevo
        ? `🆕 ${documentos.length} Documento(s) REASIGNADO(S)`
        : esExpirado
          ? `🚨 ${documentos.length} Documento(s) EXPIRADO(S)`
          : `⏰ ${documentos.length} Documento(s) PRÓXIMO(S) A EXPIRAR`;

      const mensaje = esNuevo
        ? 'Se ha creado un nuevo documento reasignado. Revisa los detalles:'
        : esExpirado
          ? 'Los siguientes documentos han excedido su fecha máxima de respuesta:'
          : 'Los siguientes documentos vencerán mañana:';

      const headerColor = esNuevo ? '#0d6efd' : (esExpirado ? '#dc3545' : '#fd7e14');
      const bloqueAlerta = esNuevo
        ? '<div class="alert alert-info"><strong>🆕 NUEVO:</strong> Se asignó un nuevo documento a tu bandeja.</div>'
        : esProximo
          ? '<div class="alert alert-warning"><strong>⚠️ ATENCION:</strong> Estos documentos vencen mañana. Toma accion hoy.</div>'
          : '';

      html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; line-height: 1.6; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
            .header { background: ${headerColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; }
            .message { font-size: 16px; margin-bottom: 20px; color: #555; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #f0f0f0; padding: 12px; text-align: left; font-weight: bold; border: 1px solid #ddd; }
            td { padding: 12px; border: 1px solid #ddd; }
            tr:nth-child(even) { background: #f9f9f9; }
            .alert { padding: 12px; border-radius: 4px; margin-bottom: 16px; }
            .alert-warning { background: #fff3cd; border-left: 4px solid #fd7e14; color: #664d03; }
            .alert-info { background: #e7f1ff; border-left: 4px solid #0d6efd; color: #0b2f6a; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #999; font-size: 12px; }
            .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
            .badge-danger { background: #dc3545; color: white; }
            .badge-warning { background: #fd7e14; color: white; }
            .badge-info { background: #0d6efd; color: white; }
            .usuario { color: #0066cc; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${titulo}</h1>
              <p>Hola <span class="usuario">${nombreUsuario}</span></p>
            </div>
            <div class="content">
              ${bloqueAlerta}
              <p class="message">${mensaje}</p>
              ${tablaHTML}
              <div class="footer">
                <p>Este es un correo automático del Sistema de Gestión de Documentos (SISTRA).</p>
                <p>Por favor, no responda a este correo. Si tiene preguntas, contacte al administrador.</p>
                <p>Fecha de envío: ${new Date().toLocaleString('es-ES')}</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      asunto = titulo;
    }

    // Preparar opciones de envío
    const mailOptions = {
      from: `"${smtpConfig.email_from_name}" <${smtpConfig.email_from}>`,
      to: destinatarioOverride || correoUsuario,
      subject: asunto,
      html: html
    };

    // Agregar CC si está configurado
    if (smtpConfig.email_cc) {
      mailOptions.cc = smtpConfig.email_cc;
    }

    // Agregar BCC si está configurado
    if (smtpConfig.email_bcc) {
      mailOptions.bcc = smtpConfig.email_bcc;
    }

    // Agregar Reply-To si está configurado
    if (smtpConfig.email_reply_to) {
      mailOptions.replyTo = smtpConfig.email_reply_to;
    }

    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ Correo enviado a ${destinatarioOverride || correoUsuario} - Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error enviando correo a ${correoUsuario || 'destinatario'}:`, error.message);
    return false;
  }
}

/**
 * Enviar correo genérico
 */
async function enviarCorreo(destinatario, asunto, html, options = {}) {
  try {
    const mailOptions = {
      from: `"${smtpConfig.email_from_name}" <${smtpConfig.email_from}>`,
      to: destinatario,
      subject: asunto,
      html,
      ...options
    };

    // Agregar CC/BCC/Reply-To si están configurados
    if (smtpConfig.email_cc) mailOptions.cc = smtpConfig.email_cc;
    if (smtpConfig.email_bcc) mailOptions.bcc = smtpConfig.email_bcc;
    if (smtpConfig.email_reply_to) mailOptions.replyTo = smtpConfig.email_reply_to;

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Correo enviado a ${destinatario} - Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Error enviando correo genérico a ${destinatario}:`, error.message);
    throw error;
  }
}

/**
 * Generar tabla HTML con detalles de documentos
 */
function generarTablaHTML(documentos, estado) {
  if (!documentos || documentos.length === 0) {
    return '<p style="color: #999;">No hay documentos para mostrar.</p>';
  }

  const flags = typeof estado === 'object' ? estado : { esExpirado: !!estado };
  const esExpirado = !!flags.esExpirado;
  const esProximo = !!flags.esProximo;
  const esNuevo = !!flags.esNuevo;
  const badgeClass = esNuevo ? 'badge-info' : (esExpirado ? 'badge-danger' : 'badge-warning');
  const badgeText = esNuevo ? '🆕 Nuevo' : (esExpirado ? '❌ Expirado' : '⏰ Vence mañana');

  const filas = documentos.map(doc => `
    <tr>
      <td>${doc.numero_documento || '-'}</td>
      <td>${doc.numero_tramite || '-'}</td>
      <td>${doc.tipo_documento || '-'}</td>
      <td>${doc.remitente || '-'}</td>
      <td>${doc.destinatario || '-'}</td>
      <td>${doc.asunto || '-'}</td>
      <td>${formatearFecha(doc.fecha_max_respuesta)}</td>
      <td>
        <span class="badge ${badgeClass}">
          ${badgeText}
        </span>
      </td>
    </tr>
  `).join('');

  return `
    <table>
      <thead>
        <tr>
          <th>Nº Documento</th>
          <th>Nº Trámite</th>
          <th>Tipo</th>
          <th>Remitente</th>
          <th>Destinatario</th>
          <th>Asunto</th>
          <th>Fecha Máxima</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        ${filas}
      </tbody>
    </table>
  `;
}

/**
 * Formatear fecha al formato DD/MM/YYYY
 */
function formatearFecha(fecha) {
  if (!fecha) return '-';
  const d = new Date(fecha);
  if (isNaN(d)) return '-';
  return d.toLocaleDateString('es-ES');
}

/**
 * Verificar disponibilidad del servidor SMTP
 */
async function verificarConexion() {
  try {
    await transporter.verify();
    console.log('✅ Conexión SMTP verificada correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error verificando conexión SMTP:', error.message);
    return false;
  }
}

async function testSMTP() {
  try {
    await transporter.verify();
    console.log("✅ SMTP conectado correctamente");
  } catch (err) {
    console.error("❌ Error SMTP completo:", err);
  }
}

testSMTP();

/**
 * Enviar notificación de nuevo comentario en un documento
 * @param {Object} datos - {destinatario, nombre, documento, comentador, contenido, tipoUsuario}
 */
async function enviarNotificacionComentario(datos) {
  try {
    // Verificar si las notificaciones por correo están activas
    const db = require('../db');
    const [config] = await db.query('SELECT notificaciones_email_activas FROM notificaciones_config WHERE id = 1');

    if (config[0] && !config[0].notificaciones_email_activas) {
      console.log('ℹ️ Notificaciones por correo desactivadas. No se envió correo de comentario.');
      return false;
    }
  } catch (error) {
    console.error('⚠️ Error verificando configuración de notificaciones:', error.message);
    // Continuar de todas formas en caso de error
  }

  const destinatarioOverride = notificationTestEmail && notificationTestEmail.trim();
  const destinatario = destinatarioOverride || (datos.destinatario || '').trim();

  if (!destinatario) {
    console.log(`⚠️ No se puede enviar comentario: falta correo de destino`);
    return false;
  }

  try {
    const { nombre = 'Usuario', documento = 'N/A', comentador = 'Un usuario', contenido = '', tipoUsuario = 'usuario' } = datos;

    const mensaje = tipoUsuario === 'secretaria' 
      ? `La secretaría ha dejado un comentario en el documento #${documento}`
      : `${comentador} ha respondido tu comentario en el documento #${documento}`;

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 20px auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { background-color: #0d6efd; color: white; padding: 15px; border-radius: 5px; text-align: center; }
          .header h2 { margin: 0; }
          .content { margin: 20px 0; }
          .comment-box { background-color: #f9f9f9; border-left: 4px solid #0d6efd; padding: 15px; margin: 10px 0; border-radius: 4px; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
          .btn { background-color: #0d6efd; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>💬 Nuevo Comentario</h2>
          </div>
          
          <div class="content">
            <p>Hola <strong>${nombre}</strong>,</p>
            
            <p>${mensaje}</p>
            
            <div class="comment-box">
              <p><strong>De:</strong> ${comentador}</p>
              <p><strong>Documento:</strong> ${documento}</p>
              <p><strong>Comentario:</strong></p>
              <p>${contenido.replace(/\n/g, '<br>')}</p>
            </div>
            
            <p>Por favor, revisa el documento y responde si es necesario.</p>
            
            <center>
              <a href="${process.env.FRONTEND_URL}/reasignados" class="btn">Ver Documento</a>
            </center>
          </div>
          
          <div class="footer">
            <p>Este es un mensaje automático del Sistema de Seguimiento.</p>
            <p>© 2026 Quito Turismo. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const resultado = await transporter.sendMail({
      from: `"${smtpConfig.email_from_name}" <${smtpConfig.email_from}>`,
      to: destinatario,
      subject: `💬 ${mensaje}`,
      html: html,
      replyTo: smtpConfig.email_reply_to || smtpConfig.email_from
    });

    console.log(`✅ Correo de comentario enviado a ${destinatario}: ${resultado.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Error enviando notificación de comentario:', error.message);
    return false;
  }
}

/**
 * Enviar notificacion de cambio de estado
 * @param {Object} datos - {destinatario, nombre, documento, estadoAnterior, estadoNuevo, actor}
 */
async function enviarNotificacionCambioEstado(datos) {
  try {
    // Verificar si las notificaciones por correo están activas
    const db = require('../db');
    const [config] = await db.query('SELECT notificaciones_email_activas FROM notificaciones_config WHERE id = 1');

    if (config[0] && !config[0].notificaciones_email_activas) {
      console.log('ℹ️ Notificaciones por correo desactivadas. No se envió cambio de estado.');
      return false;
    }
  } catch (error) {
    console.error('⚠️ Error verificando configuración de notificaciones:', error.message);
    // Continuar de todas formas en caso de error
  }

  const destinatarioOverride = notificationTestEmail && notificationTestEmail.trim();
  const destinatario = destinatarioOverride || (datos.destinatario || '').trim();

  if (!destinatario) {
    console.log('⚠️ No se puede enviar cambio de estado: falta correo de destino');
    return false;
  }

  try {
    const {
      nombre = 'Usuario',
      documento = 'N/A',
      estadoAnterior = 'N/A',
      estadoNuevo = 'N/A',
      actor = 'Sistema'
    } = datos;

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 20px auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .header { background-color: #6c757d; color: white; padding: 15px; border-radius: 5px; text-align: center; }
          .header h2 { margin: 0; }
          .content { margin: 20px 0; }
          .state-box { background-color: #f9f9f9; border-left: 4px solid #6c757d; padding: 15px; margin: 10px 0; border-radius: 4px; }
          .footer { text-align: center; color: #999; font-size: 12px; margin-top: 20px; }
          .btn { background-color: #6c757d; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>📝 Cambio de Estado</h2>
          </div>
          <div class="content">
            <p>Hola <strong>${nombre}</strong>,</p>
            <p>Se actualizo el estado del documento:</p>
            <div class="state-box">
              <p><strong>Documento:</strong> ${documento}</p>
              <p><strong>Estado anterior:</strong> ${estadoAnterior}</p>
              <p><strong>Estado nuevo:</strong> ${estadoNuevo}</p>
              <p><strong>Actualizado por:</strong> ${actor}</p>
            </div>
            <center>
              <a href="${process.env.FRONTEND_URL}/reasignados" class="btn">Ver Documento</a>
            </center>
          </div>
          <div class="footer">
            <p>Este es un mensaje automatico del Sistema de Seguimiento.</p>
            <p>© 2026 Quito Turismo. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const resultado = await transporter.sendMail({
      from: `"${smtpConfig.email_from_name}" <${smtpConfig.email_from}>`,
      to: destinatario,
      subject: `📝 Estado actualizado: ${estadoNuevo}`,
      html: html,
      replyTo: smtpConfig.email_reply_to || smtpConfig.email_from
    });

    console.log(`✅ Correo de cambio de estado enviado a ${destinatario}: ${resultado.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Error enviando notificacion de cambio de estado:', error.message);
    return false;
  }
}

module.exports = {
  enviarNotificacionDocumentos,
  enviarNotificacionComentario,
  enviarNotificacionCambioEstado,
  enviarCorreo,
  generarTablaHTML,
  formatearFecha,
  reemplazarVariables,
  verificarConexion,
  transporter
};


// Función de prueba para enviar correo manual
if (require.main === module) {
  (async () => {
    const testEmail = process.env.MAIL_TO_PRUEBA || process.env.NOTIFICATION_TEST_EMAIL;
    if (!testEmail) {
      console.log('⚠️ No se configuró MAIL_TO_PRUEBA o NOTIFICATION_TEST_EMAIL para enviar correo de prueba');
      return;
    }

    const usuario = {
      correo: testEmail,
      nombre: 'Prueba Notificación'
    };
    const documentos = [
      {
        numero_documento: 'DOC-PRUEBA-001',
        numero_tramite: 'TR-PRUEBA-001',
        tipo_documento: 'Memo',
        remitente: 'Admin',
        destinatario: usuario.nombre,
        asunto: 'Prueba de envío',
        fecha_max_respuesta: new Date(),
      }
    ];
    const ok = await enviarNotificacionDocumentos(usuario, documentos, 'expirado');
    if (ok) {
      console.log('✅ Correo de prueba enviado correctamente a:', testEmail);
    } else {
      console.log('❌ Error al enviar correo de prueba');
    }
  })();
}
