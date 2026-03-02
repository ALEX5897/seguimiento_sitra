const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, canViewAll, getUserIdFromCorreo } = require('../middleware/auth');
const { enviarNotificacionComentario } = require('../services/mailService');
const { crearNotificacionSistema, obtenerNotificacionesUsuario } = require('../services/notificationService');

// GET /api/comentarios/:reasignadoId - Obtener todos los comentarios de un documento
router.get('/reasignados/:reasignadoId/comentarios', requireAuth, async (req, res) => {
  try {
    const { reasignadoId } = req.params;
    
    // Verificar que el documento existe
    const [reasignado] = await db.query('SELECT id FROM reasignados WHERE id = ?', [reasignadoId]);
    if (!reasignado.length) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    // Obtener comentarios ordenados por fecha (más recientes primero)
    const [comentarios] = await db.query(
      `SELECT 
        id, reasignado_id, usuario_id, correo_usuario, nombre_usuario, 
        tipo_usuario, contenido, tipo_comentario, fecha_hora, 
        leido, creado_por, extra
      FROM comentarios_reasignados 
      WHERE reasignado_id = ? 
      ORDER BY fecha_hora DESC`,
      [reasignadoId]
    );

    res.json(comentarios);
  } catch (err) {
    console.error('Error obteniendo comentarios:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reasignados/:reasignadoId/comentarios - Crear nuevo comentario
router.post('/reasignados/:reasignadoId/comentarios', requireAuth, async (req, res) => {
  try {
    const { reasignadoId } = req.params;
    const { contenido, tipo_comentario = 'comentario' } = req.body;
    const usuario = req.usuarioAuth;

    console.log(`\n📝 POST /comentarios - Usuario: ${usuario.correo}, Rol: ${usuario.rol}`);

    if (!contenido || contenido.trim().length === 0) {
      return res.status(400).json({ error: 'El contenido del comentario es requerido' });
    }

    // Obtener documento reasignado
    const [reasignado] = await db.query(
      'SELECT id, reasignado_a, usuario_id, numero_documento FROM reasignados WHERE id = ?',
      [reasignadoId]
    );

    if (!reasignado.length) {
      return res.status(404).json({ error: 'Documento reasignado no encontrado' });
    }

    console.log(`📄 Documento: ${reasignado[0].numero_documento}, Usuario asignado: ${reasignado[0].reasignado_a}`);

    // Determinar tipo de usuario que comenta
    let tipoUsuario = 'usuario_asignado';
    const rolUsuario = (usuario.rol || '').toLowerCase().trim();
    if (rolUsuario === 'admin' || rolUsuario === 'secretaria') {
      tipoUsuario = 'secretaria';
    }

    console.log(`👤 Tipo de usuario: ${tipoUsuario}`);

    // Insertar comentario
    const [result] = await db.query(
      `INSERT INTO comentarios_reasignados 
      (reasignado_id, usuario_id, correo_usuario, nombre_usuario, tipo_usuario, 
       contenido, tipo_comentario, creado_por, extra) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reasignadoId,
        usuario.id || null,
        usuario.correo || '',
        usuario.nombre || 'Usuario',
        tipoUsuario,
        contenido.trim(),
        tipo_comentario,
        usuario.correo || 'Sistema',
        JSON.stringify({ 
          user_id: usuario.id, 
          rol: usuario.rol 
        })
      ]
    );

    const comentarioId = result.insertId;
    console.log(`✅ Comentario insertado: ID ${comentarioId}`);

    // Obtener documento completo para contexto
    const [docCompleto] = await db.query(
      'SELECT * FROM reasignados WHERE id = ?',
      [reasignadoId]
    );

    let destinatarioEmail = '';
    let destinatarioId = null;
    let destinatarioNombre = '';
    const destinatarios = [];

    // Crear notificación en el sistema
    try {
      console.log(`\n🔔 Iniciando creación de notificaciones...`);
      
      // Si lo comentó la secretaria, notificar al usuario asignado
      if (tipoUsuario === 'secretaria') {
        console.log(`  ➡️ Secretaria comentó - buscando usuario asignado`);
        // Priorizar usuario_id del reasignado
        const usuarioIdAsignado = reasignado[0].usuario_id || null;

        if (usuarioIdAsignado) {
          const [usuario_asignado] = await db.query(
            'SELECT id, correo, nombre FROM usuarios WHERE id = ? LIMIT 1',
            [usuarioIdAsignado]
          );

          if (usuario_asignado.length) {
            destinatarioEmail = usuario_asignado[0].correo || '';
            destinatarioId = usuario_asignado[0].id || null;
            destinatarioNombre = usuario_asignado[0].nombre || '';
          }
        }

        // Fallback por nombre si no se encontro por ID
        if (!destinatarioEmail) {
          const nombreBuscar = reasignado[0].reasignado_a || '';
          if (nombreBuscar) {
            const [usuario_asignado] = await db.query(
              `SELECT id, correo, nombre FROM usuarios 
               WHERE nombre LIKE ? OR CONCAT(nombre, ' ', apellido) LIKE ?
               LIMIT 1`,
              [`%${nombreBuscar}%`, `%${nombreBuscar}%`]
            );

            if (usuario_asignado.length) {
              destinatarioEmail = usuario_asignado[0].correo || '';
              destinatarioId = usuario_asignado[0].id || null;
              destinatarioNombre = usuario_asignado[0].nombre || nombreBuscar;
            }
          }
        }

        if (destinatarioEmail) {
          destinatarios.push({
            correo: destinatarioEmail,
            id: destinatarioId,
            nombre: destinatarioNombre || reasignado[0].reasignado_a || 'Usuario'
          });
        }
      } 
      // Si lo comentó el usuario asignado, crear UNA sola notificación del sistema
      else {
        console.log(`📧 Usuario comentó como: ${usuario.nombre} (Rol: ${usuario.rol})`);

        // Notificación global para que la vean todas las secretarias
        destinatarios.push({
          correo: 'secretarias',
          id: null,
          nombre: 'Secretarias'
        });
      }

      // Filtrar destinatarios únicos y excluir al usuario que comenta
      const correoUsuarioActual = (usuario.correo || usuario.email || '').toLowerCase();
      const destinatariosUnicos = Array.from(
        new Map(
          destinatarios
            .filter(d => d.correo && d.correo.toLowerCase() !== correoUsuarioActual)
            .map(d => [d.correo, d])
        ).values()
      );

      console.log(`📧 Destinatarios filtrados: ${destinatariosUnicos.length} (usuario actual: ${correoUsuarioActual})`);
      destinatariosUnicos.forEach(d => {
        console.log(`  ✉️ ${d.nombre} - ${d.correo}`);
      });

      if (!destinatariosUnicos.length) {
        console.warn(`⚠️ No se pudo determinar correo del destinatario. Nombre: ${reasignado[0].reasignado_a}`);
      }

      for (const dest of destinatariosUnicos) {
        // Crear notificación en BD
        console.log(`  📧 Creando notificación para: ${dest.nombre} (${dest.correo})`);
        const notifId = await crearNotificacionSistema({
          usuario_id: dest.id || null,
          correo_usuario: dest.correo,
          reasignado_id: reasignadoId,
          comentario_id: comentarioId,
          tipo_notificacion: 'comentario_nuevo',
          titulo: `Nuevo comentario en documento ${docCompleto[0]?.numero_documento || 'N/A'}`,
          mensaje: `${usuario.nombre || 'Un usuario'} ha dejado un comentario: "${contenido.substring(0, 100)}..."`,
          urlAccion: `/reasignados?doc=${reasignadoId}`
        });
        console.log(`  ✅ Notificación creada: ID ${notifId}`);
      }

    } catch (notifError) {
      console.error('Error creando notificación:', notifError);
    }

    // Enviar notificación por correo solo si comenta la secretaria
    if (tipoUsuario === 'secretaria') {
      const correoUsuarioActual = (usuario.correo || usuario.email || '').toLowerCase();
      const destinatariosCorreo = Array.from(
        new Set(
          destinatarios
            .filter(d => d.correo && d.correo.includes('@') && d.correo.toLowerCase() !== correoUsuarioActual)
            .map(d => d.correo)
        )
      );

      for (const correo of destinatariosCorreo) {
        try {
          await enviarNotificacionComentario({
            destinatario: correo,
            nombre: destinatarioNombre || reasignado[0].reasignado_a,
            documento: docCompleto[0]?.numero_documento || 'N/A',
            comentador: usuario.nombre || 'Un usuario',
            contenido: contenido.substring(0, 500),
            tipoUsuario: tipoUsuario
          });
        } catch (mailError) {
          console.error('Error enviando correo de comentario:', mailError.message);
        }
      }
    } else {
      console.log(`ℹ️  Usuario asignado comentó - solo notificación en sistema (sin correo)`);
    }

    console.log(`\n✅ POST /comentarios completado\n`);
    res.json({ id: comentarioId, success: true });
  } catch (err) {
    console.error('Error creando comentario:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/reasignados/:reasignadoId/comentarios/:comentarioId/leer - Marcar como leído
router.put('/reasignados/:reasignadoId/comentarios/:comentarioId/leer', requireAuth, async (req, res) => {
  try {
    const { reasignadoId, comentarioId } = req.params;

    const [update] = await db.query(
      'UPDATE comentarios_reasignados SET leido = TRUE WHERE id = ? AND reasignado_id = ?',
      [comentarioId, reasignadoId]
    );

    if (update.affectedRows === 0) {
      return res.status(404).json({ error: 'Comentario no encontrado' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/reasignados/:reasignadoId/comentarios/:comentarioId - Eliminar comentario
router.delete('/reasignados/:reasignadoId/comentarios/:comentarioId', requireAuth, async (req, res) => {
  try {
    const { reasignadoId, comentarioId } = req.params;
    const usuario = req.usuarioAuth;

    // Solo admin/secretaria puede eliminar comentarios
    const esAdmin = usuario.rol === 'admin';
    const esSecretaria = usuario.rol === 'secretaria';

    if (!esAdmin && !esSecretaria) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar comentarios' });
    }

    const [deleteResult] = await db.query(
      'DELETE FROM comentarios_reasignados WHERE id = ? AND reasignado_id = ?',
      [comentarioId, reasignadoId]
    );

    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ error: 'Comentario no encontrado' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notificaciones - Obtener notificaciones del usuario
router.get('/notificaciones', requireAuth, async (req, res) => {
  try {
    const usuario = req.usuarioAuth;
    const { sin_leer = false } = req.query;
    
    // Verificar el rol (case-insensitive)
    const rolUsuario = (usuario.rol || '').toLowerCase().trim();
    const esSecretaria = rolUsuario === 'secretaria' || rolUsuario === 'admin';

    console.log(`📋 GET /notificaciones - Usuario: ${usuario.correo}, Rol: ${usuario.rol}, esSecretaria: ${esSecretaria}`);

    let query = `
      SELECT 
        id, usuario_id, correo_usuario, reasignado_id, comentario_id,
        tipo_notificacion, titulo, mensaje, leida, fecha_creacion,
        fecha_lectura, urlAccion, extra
      FROM notificaciones_sistema 
    `;

    const params = [];

    // Si es secretaria, ver TODAS las notificaciones; si no, solo las suyas
    if (!esSecretaria) {
      const correoUsuario = (usuario.correo || usuario.email || '').toLowerCase().trim();
      query += `WHERE (LOWER(TRIM(correo_usuario)) = ? OR usuario_id = ?)`;
      params.push(correoUsuario, usuario.id || null);
    }

    if (sin_leer === 'true') {
      query += params.length ? ' AND leida = FALSE' : ' WHERE leida = FALSE';
    }

    query += ' ORDER BY fecha_creacion DESC LIMIT 50';

    const [notificaciones] = await db.query(query, params);
    console.log(`📋 Notificaciones encontradas: ${notificaciones.length}`);
    res.json(notificaciones);
  } catch (err) {
    console.error('Error obteniendo notificaciones:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notificaciones/:notificacionId/leer - Marcar notificación como leída
router.put('/notificaciones/:notificacionId/leer', requireAuth, async (req, res) => {
  try {
    const { notificacionId } = req.params;
    const usuario = req.usuarioAuth;
    const rolUsuario = (usuario.rol || '').toLowerCase().trim();
    const esSecretaria = rolUsuario === 'secretaria' || rolUsuario === 'admin';

    // Las secretarias pueden marcar cualquier notificación como leída
    // Los usuarios normales solo pueden marcar las suyas
    let query = 'SELECT id FROM notificaciones_sistema WHERE id = ?';
    const params = [notificacionId];

    if (!esSecretaria) {
      query += ' AND (correo_usuario = ? OR usuario_id = ?)';
      params.push((usuario.correo || usuario.email || '').toLowerCase().trim(), usuario.id || null);
    }

    const [notif] = await db.query(query, params);

    if (!notif.length) {
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    await db.query(
      'UPDATE notificaciones_sistema SET leida = TRUE, fecha_lectura = NOW() WHERE id = ?',
      [notificacionId]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/notificaciones/sin-leer/contador - Contar notificaciones sin leer
router.get('/notificaciones/sin-leer/contador', requireAuth, async (req, res) => {
  try {
    const usuario = req.usuarioAuth;
    const rolUsuario = (usuario.rol || '').toLowerCase().trim();
    const esSecretaria = rolUsuario === 'secretaria' || rolUsuario === 'admin';

    let query = `SELECT COUNT(*) as contador FROM notificaciones_sistema WHERE leida = FALSE`;
    const params = [];

    // Si es secretaria, contar TODAS las sin leer; si no, contar solo las suyas
    if (!esSecretaria) {
      const correoUsuario = (usuario.correo || usuario.email || '').toLowerCase().trim();
      query = `SELECT COUNT(*) as contador FROM notificaciones_sistema 
               WHERE (LOWER(TRIM(correo_usuario)) = ? OR usuario_id = ?) AND leida = FALSE`;
      params.push(correoUsuario, usuario.id || null);
    }

    const [result] = await db.query(query, params);
    res.json({ contador: result[0]?.contador || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
