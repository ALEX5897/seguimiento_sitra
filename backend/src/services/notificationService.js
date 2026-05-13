const pool = require('../db');
const { enviarNotificacionDocumentos, formatearFecha } = require('./mailService');
const { obtenerUsuarioPorId, obtenerUsuarioPorNombre } = require('../helpers/userHelper');

async function obtenerConfiguracion() {
  try {
    const [config] = await pool.query(
      'SELECT id, activo, hora_envio, dias_retraso, notificaciones_email_activas, notificaciones_app_activas FROM notificaciones_config WHERE id = 1'
    );
    return config[0] || {
      activo: true,
      hora_envio: '08:00',
      dias_retraso: 1,
      notificaciones_email_activas: true,
      notificaciones_app_activas: true
    };
  } catch (error) {
    console.error('Error obteniendo configuración de notificaciones:', error.message);
    return {
      activo: true,
      hora_envio: '08:00',
      dias_retraso: 1,
      notificaciones_email_activas: true,
      notificaciones_app_activas: true
    };
  }
}

async function obtenerPlantilla(tipo) {
  try {
    const [plantilla] = await pool.query(
      'SELECT id, tipo, asunto, cuerpo_html FROM notificaciones_plantillas WHERE tipo = ?',
      [tipo]
    );
    return plantilla[0] || null;
  } catch (error) {
    console.error('Error obteniendo plantilla de notificaciones:', error.message);
    return null;
  }
}

/**
 * Obtener documentos expirados (fecha_max_respuesta <= hoy - dias_retraso)
 */
async function obtenerDocumentosExpirados() {
  try {
    const config = await obtenerConfiguracion();
    const diasRetraso = config.dias_retraso || 1;

    const connection = await pool.getConnection();

    const query = `
      SELECT
        id, numero_documento, tipo_documento, numero_tramite,
        fecha_documento, fecha_reasignacion, fecha_max_respuesta,
        reasignado_a, usuario_id, correo_enviado_expiracion,
        remitente, destinatario, asunto, estado
      FROM reasignados
      WHERE DATE(fecha_max_respuesta) <= DATE(DATE_SUB(NOW(), INTERVAL ? DAY))
        AND estado NOT IN ('archivado', 'eliminado', 'enviado', 'cancelado', 'resuelto', 'completado')
      ORDER BY fecha_max_respuesta ASC
    `;

    const [documentos] = await connection.query(query, [diasRetraso]);
    connection.release();
    return documentos || [];
  } catch (error) {
    console.error('Error obteniendo documentos expirados:', error.message);
    return [];
  }
}

/**
 * Obtener documentos próximos a expirar (mañana)
 */
async function obtenerDocumentosProximosAExpirar() {
  try {
    const connection = await pool.getConnection();
    
    const query = `
      SELECT 
        id, numero_documento, tipo_documento, numero_tramite, 
        fecha_documento, fecha_reasignacion, fecha_max_respuesta,
        reasignado_a, usuario_id, correo_enviado_un_dia_antes,
        remitente, destinatario, asunto, estado
      FROM reasignados
      WHERE DATE(fecha_max_respuesta) = DATE(DATE_ADD(NOW(), INTERVAL 1 DAY))
        AND estado NOT IN ('archivado', 'eliminado', 'enviado', 'cancelado', 'resuelto', 'completado')
      ORDER BY fecha_max_respuesta ASC
    `;

    const [documentos] = await connection.query(query);
    connection.release();
    return documentos || [];
  } catch (error) {
    console.error('Error obteniendo documentos próximos a expirar:', error.message);
    return [];
  }
}

/**
 * Obtener información del usuario por usuario_id o nombre
 * @param {Number|String} identificador - ID o nombre del usuario
 * @param {String} nombreAlternativo - Nombre alternativo si el ID no funciona
 */
async function obtenerUsuario(identificador, nombreAlternativo = null) {
  try {
    let usuario = null;

    // Primero intenta por ID si se proporciona un número
    if (typeof identificador === 'number' && identificador) {
      usuario = await obtenerUsuarioPorId(identificador);
      if (usuario) return usuario;
    }

    // Si no se encontró, intenta por nombre alternativo
    if (nombreAlternativo) {
      usuario = await obtenerUsuarioPorNombre(nombreAlternativo);
      if (usuario) return usuario;
    }

    // Si aún no se encontró y el identificador es string, intenta como nombre
    if (typeof identificador === 'string' && identificador) {
      usuario = await obtenerUsuarioPorNombre(identificador);
      if (usuario) return usuario;
    }

    return null;
  } catch (error) {
    console.error('Error obteniendo usuario:', error.message);
    return null;
  }
}

/**
 * Marcar como enviado el correo de expiración
 */
async function marcarCorreoExpiradoEnviado(documentoId) {
  try {
    const connection = await pool.getConnection();
    await connection.query(
      'UPDATE reasignados SET correo_enviado_expiracion = "si" WHERE id = ?',
      [documentoId]
    );
    connection.release();
    return true;
  } catch (error) {
    console.error('Error marcando correo expirado:', error.message);
    return false;
  }
}

/**
 * Marcar como enviado el correo de 1 día antes
 */
async function marcarCorreoUnDiaAntesEnviado(documentoId) {
  try {
    const connection = await pool.getConnection();
    await connection.query(
      'UPDATE reasignados SET correo_enviado_un_dia_antes = "si" WHERE id = ?',
      [documentoId]
    );
    connection.release();
    return true;
  } catch (error) {
    console.error('Error marcando correo de 1 día antes:', error.message);
    return false;
  }
}

/**
 * Agrupar documentos por usuario
 */
function agruparPorUsuario(documentos) {
  const grupos = {};
  
  documentos.forEach(doc => {
    const usuarioId = doc.usuario_id || 'sin_usuario';
    if (!grupos[usuarioId]) {
      grupos[usuarioId] = {
        usuarioId,
        nombreAlternativo: doc.reasignado_a, // También guardar nombre para búsqueda
        documentos: [],
        nombre: doc.reasignado_a || 'Usuario Desconocido'
      };
    }
    grupos[usuarioId].documentos.push(doc);
  });
  
  return Object.values(grupos);
}

/**
 * Procesar y enviar notificaciones de documentos expirados
 */
async function procesarNotificacionesExpirados() {
  console.log('\n📧 [' + new Date().toLocaleString('es-ES') + '] Procesando documentos EXPIRADOS...');

  try {
    const config = await obtenerConfiguracion();

    if (!config.activo) {
      console.log('ℹ️ Notificaciones desactivadas en la configuración. Saltando...');
      return { procesados: 0, enviados: 0, errores: 0 };
    }

    if (!config.notificaciones_email_activas) {
      console.log('ℹ️ Notificaciones por correo desactivadas. Saltando...');
      return { procesados: 0, enviados: 0, errores: 0 };
    }

    const documentosExpirados = await obtenerDocumentosExpirados();
    console.log(`ℹ️ Total documentos expirados encontrados: ${documentosExpirados.length}`);

    if (documentosExpirados.length === 0) {
      console.log('✓ No hay documentos expirados para notificar.');
      return { procesados: 0, enviados: 0, errores: 0 };
    }

    const gruposUsuarios = agruparPorUsuario(documentosExpirados);
    let enviados = 0;
    let errores = 0;

    for (const grupo of gruposUsuarios) {
      // Filtrar solo documentos que no tengan correo enviado
      const docsNoNotificados = grupo.documentos.filter(doc => doc.correo_enviado_expiracion !== 'si');
      
      if (docsNoNotificados.length === 0) {
        console.log(`⏭️ ${grupo.nombre}: Todos sus documentos ya fueron notificados.`);
        continue;
      }

      // Intentar obtener usuario por ID, y si no existe, por nombre
      let usuario = null;
      if (grupo.usuarioId !== 'sin_usuario') {
        usuario = await obtenerUsuario(grupo.usuarioId, grupo.nombreAlternativo);
      } else if (grupo.nombreAlternativo) {
        usuario = await obtenerUsuario(grupo.nombreAlternativo);
      }

      if (!usuario) {
        console.log(`⚠️ No se encontró usuario: ${grupo.nombre} (ID: ${grupo.usuarioId})`);
        continue;
      }

      const exito = await enviarNotificacionDocumentos(usuario, docsNoNotificados, 'expirado');
      
      if (exito) {
        // Marcar como enviado
        for (const doc of docsNoNotificados) {
          await marcarCorreoExpiradoEnviado(doc.id);
        }
        enviados++;
      } else {
        errores++;
      }
    }

    console.log(`✅ Resumen - Enviados: ${enviados} | Errores: ${errores}\n`);
    return { procesados: documentosExpirados.length, enviados, errores };
  } catch (error) {
    console.error('❌ Error en procesarNotificacionesExpirados:', error.message);
    return { procesados: 0, enviados: 0, errores: 1 };
  }
}

/**
 * Procesar y enviar notificaciones de documentos próximos a expirar (1 día antes)
 */
async function procesarNotificacionesUnDiaAntes() {
  console.log('\n📧 [' + new Date().toLocaleString('es-ES') + '] Procesando documentos PRÓXIMOS A EXPIRAR (1 día antes)...');

  try {
    const config = await obtenerConfiguracion();

    if (!config.activo) {
      console.log('ℹ️ Notificaciones desactivadas en la configuración. Saltando...');
      return { procesados: 0, enviados: 0, errores: 0 };
    }

    if (!config.notificaciones_email_activas) {
      console.log('ℹ️ Notificaciones por correo desactivadas. Saltando...');
      return { procesados: 0, enviados: 0, errores: 0 };
    }

    const docsProximos = await obtenerDocumentosProximosAExpirar();
    console.log(`ℹ️ Total documentos próximos a expirar encontrados: ${docsProximos.length}`);

    if (docsProximos.length === 0) {
      console.log('✓ No hay documentos próximos a expirar para notificar.');
      return { procesados: 0, enviados: 0, errores: 0 };
    }

    const gruposUsuarios = agruparPorUsuario(docsProximos);
    let enviados = 0;
    let errores = 0;

    for (const grupo of gruposUsuarios) {
      // Filtrar solo documentos que no tengan correo enviado
      const docsNoNotificados = grupo.documentos.filter(doc => doc.correo_enviado_un_dia_antes !== 'si');
      
      if (docsNoNotificados.length === 0) {
        console.log(`⏭️ ${grupo.nombre}: Todos sus documentos ya fueron notificados (1 día antes).`);
        continue;
      }

      let usuario = null;
      if (grupo.usuarioId !== 'sin_usuario') {
        usuario = await obtenerUsuario(grupo.usuarioId, grupo.nombreAlternativo);
      } else if (grupo.nombreAlternativo) {
        usuario = await obtenerUsuario(grupo.nombreAlternativo);
      }

      if (!usuario) {
        console.log(`⚠️ No se encontró usuario: ${grupo.nombre} (ID: ${grupo.usuarioId})`);
        continue;
      }

      const exito = await enviarNotificacionDocumentos(usuario, docsNoNotificados, 'proximo');
      
      if (exito) {
        // Marcar como enviado
        for (const doc of docsNoNotificados) {
          await marcarCorreoUnDiaAntesEnviado(doc.id);
        }
        enviados++;
      } else {
        errores++;
      }
    }

    console.log(`✅ Resumen - Enviados: ${enviados} | Errores: ${errores}\n`);
    return { procesados: docsProximos.length, enviados, errores };
  } catch (error) {
    console.error('❌ Error en procesarNotificacionesUnDiaAntes:', error.message);
    return { procesados: 0, enviados: 0, errores: 1 };
  }
}

/**
 * Ejecutar todas las notificaciones
 */
async function ejecutarTodasLasNotificaciones() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🔔 INICIANDO CICLO DE NOTIFICACIONES DE DOCUMENTOS');
  console.log('═══════════════════════════════════════════════════════════');
  
  const inicio = Date.now();
  
  const resultadoExpirados = await procesarNotificacionesExpirados();
  const resultadoProximos = await procesarNotificacionesUnDiaAntes();
  
  const duracion = Date.now() - inicio;
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 RESUMEN GENERAL:');
  console.log(`   Expirados - Procesados: ${resultadoExpirados.procesados} | Enviados: ${resultadoExpirados.enviados} | Errores: ${resultadoExpirados.errores}`);
  console.log(`   Próximos - Procesados: ${resultadoProximos.procesados} | Enviados: ${resultadoProximos.enviados} | Errores: ${resultadoProximos.errores}`);
  console.log(`   Duración: ${duracion}ms`);
  console.log('═══════════════════════════════════════════════════════════\n');
}

/**
 * Crear notificación en el sistema
 */
async function crearNotificacionSistema(datos) {
  try {
    // Verificar si las notificaciones de la app están activas
    const config = await obtenerConfiguracion();

    if (!config.notificaciones_app_activas) {
      console.log('ℹ️ Notificaciones de la app desactivadas. No se creó notificación del sistema.');
      return null;
    }

    const {
      usuario_id,
      correo_usuario,
      reasignado_id,
      comentario_id,
      tipo_notificacion,
      titulo,
      mensaje,
      urlAccion
    } = datos;

    if (!correo_usuario || !reasignado_id || !comentario_id) {
      console.error('❌ Datos incompletos para crear notificación:', datos);
      return null;
    }

    // Verificar si ya existe una notificación para este comentario y correo
    const [existente] = await pool.query(
      `SELECT id FROM notificaciones_sistema 
       WHERE correo_usuario = ? AND comentario_id = ? AND tipo_notificacion = ?`,
      [correo_usuario, comentario_id, tipo_notificacion]
    );

    if (existente.length > 0) {
      console.log(`⚠️ Notificación duplicada detectada - ya existe para ${correo_usuario}`);
      return existente[0].id;
    }

    const [result] = await pool.query(
      `INSERT INTO notificaciones_sistema
      (usuario_id, correo_usuario, reasignado_id, comentario_id, tipo_notificacion, titulo, mensaje, urlAccion, leida)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id, correo_usuario, reasignado_id, comentario_id, tipo_notificacion, titulo, mensaje, urlAccion || '', false]
    );

    console.log(`✅ Notificación creada: ${titulo} - ID: ${result.insertId}`);
    return result.insertId;
  } catch (error) {
    console.error('❌ Error creando notificación del sistema:', error.message);
    return null;
  }
}

/**
 * Obtener notificaciones sin leer de un usuario
 */
async function obtenerNotificacionesUsuario(correoUsuario, soloNoLeidas = false) {
  try {
    let query = `
      SELECT 
        id, usuario_id, correo_usuario, reasignado_id, comentario_id,
        tipo_notificacion, titulo, mensaje, leida, fecha_creacion,
        fecha_lectura, urlAccion
      FROM notificaciones_sistema 
      WHERE correo_usuario = ?
    `;

    const params = [correoUsuario];

    if (soloNoLeidas) {
      query += ' AND leida = FALSE';
    }

    query += ' ORDER BY fecha_creacion DESC LIMIT 100';

    const [notificaciones] = await pool.query(query, params);
    return notificaciones || [];
  } catch (error) {
    console.error('❌ Error obteniendo notificaciones:', error.message);
    return [];
  }
}

/**
 * Contar notificaciones sin leer
 */
async function contarNotificacionesSinLeer(correoUsuario) {
  try {
    const [result] = await pool.query(
      `SELECT COUNT(*) as contador FROM notificaciones_sistema 
       WHERE correo_usuario = ? AND leida = FALSE`,
      [correoUsuario]
    );

    return result[0]?.contador || 0;
  } catch (error) {
    console.error('❌ Error contando notificaciones sin leer:', error.message);
    return 0;
  }
}

/**
 * Marcar notificación como leída
 */
async function marcarNotificacionComoLeida(notificacionId) {
  try {
    const [result] = await pool.query(
      `UPDATE notificaciones_sistema SET leida = TRUE, fecha_lectura = NOW() 
       WHERE id = ?`,
      [notificacionId]
    );

    if (result.affectedRows > 0) {
      console.log(`✅ Notificación ${notificacionId} marcada como leída`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Error marcando notificación como leída:', error.message);
    return false;
  }
}

/**
 * Enviar correo de prueba
 */
async function enviarCorreoPrueba(emailDestino) {
  try {
    const { enviarCorreo } = require('./mailService');

    const asunto = 'SITRA - Correo de Prueba';
    const cuerpoHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #007bff;">Correo de Prueba - SITRA</h2>
        <p>Este es un correo de prueba enviado desde el sistema SITRA.</p>
        <p><strong>Fecha de envío:</strong> ${new Date().toLocaleString('es-ES')}</p>
        <p>Si recibió este correo, significa que la configuración de notificaciones por correo está funcionando correctamente.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          Este es un mensaje automático del Sistema de Seguimiento de Trámites Administrativos (SITRA).
        </p>
      </div>
    `;

    const resultado = await enviarCorreo(emailDestino, asunto, cuerpoHtml);

    // Registrar en el log
    await pool.query(
      'INSERT INTO notificaciones_log (tipo, email_destino, estado, detalles) VALUES (?, ?, ?, ?)',
      ['correo_prueba', emailDestino, 'enviado', JSON.stringify(resultado)]
    );

    return resultado;
  } catch (error) {
    console.error('Error enviando correo de prueba:', error);

    // Registrar error en el log
    await pool.query(
      'INSERT INTO notificaciones_log (tipo, email_destino, estado, detalles) VALUES (?, ?, ?, ?)',
      ['correo_prueba', emailDestino, 'error', error.message]
    );

    throw error;
  }
}

/**
 * Ejecutar notificaciones manualmente según filtros
 */
async function ejecutarNotificacionesManual(filtros) {
  try {
    console.log('🚀 Iniciando envío manual de notificaciones...');

    let correos_enviados = 0;
    let notificaciones_creadas = 0;

    const config = await obtenerConfiguracion();

    // Procesar documentos expirados si está seleccionado
    if (filtros.documentosExpirados) {
      console.log('📋 Procesando documentos expirados...');
      const resultado = await procesarNotificacionesExpirados();
      correos_enviados += resultado.enviados || 0;
    }

    // Procesar documentos próximos a expirar si está seleccionado
    if (filtros.documentosProximos) {
      console.log('⏰ Procesando documentos próximos a expirar...');
      const resultado = await procesarNotificacionesUnDiaAntes();
      correos_enviados += resultado.enviados || 0;
    }

    // Registrar en log
    if (correos_enviados > 0) {
      await pool.query(
        `INSERT INTO notificaciones_log (tipo, cantidad_correos, fecha_envio, estado)
         VALUES (?, ?, NOW(), 'enviado')`,
        ['notificaciones_generales', correos_enviados]
      ).catch(err => console.error('Error registrando en log:', err));
    }

    console.log(`✅ Notificaciones enviadas: ${correos_enviados} correos`);

    return {
      correos_enviados,
      notificaciones_creadas: 0,
      mensaje: `Se envió exitosamente a ${correos_enviados} usuarios`
    };
  } catch (error) {
    console.error('❌ Error en ejecutarNotificacionesManual:', error.message);
    throw error;
  }
}

module.exports = {
  obtenerConfiguracion,
  obtenerPlantilla,
  obtenerDocumentosExpirados,
  obtenerDocumentosProximosAExpirar,
  obtenerUsuario,
  marcarCorreoExpiradoEnviado,
  marcarCorreoUnDiaAntesEnviado,
  agruparPorUsuario,
  procesarNotificacionesExpirados,
  procesarNotificacionesUnDiaAntes,
  ejecutarTodasLasNotificaciones,
  crearNotificacionSistema,
  obtenerNotificacionesUsuario,
  contarNotificacionesSinLeer,
  marcarNotificacionComoLeida,
  enviarCorreoPrueba,
  ejecutarNotificacionesManual
};
