const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth, canViewAll, getUserIdFromCorreo } = require('../middleware/auth');
const { enviarNotificacionDocumentos, enviarNotificacionCambioEstado } = require('../services/mailService');
const { obtenerUsuario, crearNotificacionSistema } = require('../services/notificationService');

// GET /api/reasignados - Obtener reasignados (filtrado por rol)
router.get('/', requireAuth,async (req, res) => {
  try {
    const usuario = req.usuarioAuth;
    let query = 'SELECT * FROM reasignados';
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

    if (!b.usuario_id) {
      return res.status(400).json({ error: 'Debe seleccionar un usuario registrado' });
    }

    const [usuarios] = await db.query(
      'SELECT id, nombre, correo FROM usuarios WHERE id = ? LIMIT 1',
      [b.usuario_id]
    );

    if (!usuarios.length) {
      return res.status(400).json({ error: 'Usuario seleccionado no existe' });
    }

    const usuarioSeleccionado = usuarios[0];
    const reasignadoNombre = (usuarioSeleccionado.nombre || '').trim() || 'Usuario';

    const [result] = await db.query(
      'INSERT INTO reasignados (numero_documento, tipo_documento, importancia, numero_tramite, fecha_documento, fecha_reasignacion, fecha_max_respuesta, reasignado_a, usuario_id, comentario, respuesta, remitente, destinatario, asunto, estado, extra) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [b.numero_documento || b.document_number || null, b.tipo_documento || null, b.importancia || null, b.numero_tramite || null, b.fecha_documento || b.date || null, b.fecha_reasignacion || null, b.fecha_max_respuesta || null, reasignadoNombre, usuarioSeleccionado.id, b.comentario || b.subject || null, b.respuesta || null, b.remitente || b.sender || null, b.destinatario || null, b.asunto || null, b.estado || b.status || null, JSON.stringify(b.extra || {})]
    );

    // Enviar notificacion de documento reasignado creado
    try {
      const usuarioNotificacion = { correo: usuarioSeleccionado.correo || null, nombre: reasignadoNombre };
      const documento = {
        numero_documento: b.numero_documento || b.document_number || null,
        numero_tramite: b.numero_tramite || null,
        tipo_documento: b.tipo_documento || null,
        remitente: b.remitente || b.sender || null,
        destinatario: b.destinatario || null,
        asunto: b.asunto || null,
        fecha_max_respuesta: b.fecha_max_respuesta || null
      };
      await enviarNotificacionDocumentos(usuarioNotificacion, [documento], 'nuevo');
    } catch (mailError) {
      console.error('❌ Error enviando correo de documento nuevo:', mailError.message);
    }

    res.json({ id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// CRUD endpoints
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM reasignados WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const b = req.body;
    const [prevRows] = await db.query('SELECT * FROM reasignados WHERE id = ?', [req.params.id]);
    const prev = prevRows.length ? prevRows[0] : null;

    if (!b.usuario_id) {
      return res.status(400).json({ error: 'Debe seleccionar un usuario registrado' });
    }

    const [usuarios] = await db.query(
      'SELECT id, nombre, correo FROM usuarios WHERE id = ? LIMIT 1',
      [b.usuario_id]
    );

    if (!usuarios.length) {
      return res.status(400).json({ error: 'Usuario seleccionado no existe' });
    }

    const usuarioSeleccionado = usuarios[0];
    const reasignadoNombre = (usuarioSeleccionado.nombre || '').trim() || 'Usuario';

    await db.query('UPDATE reasignados SET numero_documento = ?, tipo_documento = ?, importancia = ?, numero_tramite = ?, fecha_documento = ?, fecha_reasignacion = ?, fecha_max_respuesta = ?, reasignado_a = ?, usuario_id = ?, comentario = ?, respuesta = ?, remitente = ?, destinatario = ?, asunto = ?, estado = ?, extra = ? WHERE id = ?', [b.numero_documento || b.document_number || null, b.tipo_documento || null, b.importancia || null, b.numero_tramite || null, b.fecha_documento || b.date || null, b.fecha_reasignacion || null, b.fecha_max_respuesta || null, reasignadoNombre, usuarioSeleccionado.id, b.comentario || b.subject || null, b.respuesta || null, b.remitente || b.sender || null, b.destinatario || null, b.asunto || null, b.estado || b.status || null, JSON.stringify(b.extra || {}), req.params.id]);

    const nuevoEstado = b.estado || b.status || null;
    const estadoAnterior = prev ? prev.estado : null;

    if (prev && nuevoEstado && estadoAnterior && nuevoEstado !== estadoAnterior) {
      const usuarioSesion = req.session?.usuario || {};
      const autorNombre = usuarioSesion.nombre || 'Sistema';
      const autorCorreo = usuarioSesion.correo || 'sistema@local';
      const autorRol = usuarioSesion.rol || 'admin';

      // Crear comentario automatico para asociar notificacion al documento
      const [comentarioResult] = await db.query(
        `INSERT INTO comentarios_reasignados
         (reasignado_id, usuario_id, correo_usuario, nombre_usuario, tipo_usuario,
          contenido, tipo_comentario, creado_por, extra)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ,
        [
          req.params.id,
          usuarioSesion.id || null,
          autorCorreo,
          autorNombre,
          (autorRol === 'admin' || autorRol === 'secretaria') ? 'secretaria' : 'usuario_asignado',
          `Estado actualizado: "${estadoAnterior}" -> "${nuevoEstado}"`,
          'aclaracion',
          autorCorreo,
          JSON.stringify({
            tipo: 'cambio_estado',
            estado_anterior: estadoAnterior,
            estado_nuevo: nuevoEstado
          })
        ]
      );

      const comentarioId = comentarioResult.insertId;

      // Obtener destinatario del documento
      const usuarioIdAsignado = b.usuario_id || (prev ? prev.usuario_id : null);
      let destinatarioCorreo = '';
      let destinatarioNombre = '';

      if (usuarioIdAsignado) {
        const [usuarioAsignado] = await db.query(
          'SELECT correo, nombre FROM usuarios WHERE id = ? LIMIT 1',
          [usuarioIdAsignado]
        );
        if (usuarioAsignado.length) {
          destinatarioCorreo = usuarioAsignado[0].correo || '';
          destinatarioNombre = usuarioAsignado[0].nombre || '';
        }
      }

      if (!destinatarioCorreo) {
        destinatarioNombre = b.reasignado_a || (prev ? prev.reasignado_a : '') || 'Usuario';
        const [usuarioAsignado] = await db.query(
          `SELECT correo, nombre FROM usuarios
           WHERE nombre LIKE ? OR CONCAT(nombre, ' ', apellido) LIKE ?
           LIMIT 1`,
          [`%${destinatarioNombre}%`, `%${destinatarioNombre}%`]
        );
        if (usuarioAsignado.length) {
          destinatarioCorreo = usuarioAsignado[0].correo || '';
          destinatarioNombre = usuarioAsignado[0].nombre || destinatarioNombre;
        }
      }

      if (destinatarioCorreo && destinatarioCorreo.includes('@')) {
        await crearNotificacionSistema({
          usuario_id: usuarioIdAsignado || null,
          correo_usuario: destinatarioCorreo,
          reasignado_id: req.params.id,
          comentario_id: comentarioId,
          tipo_notificacion: 'documento_modificado',
          titulo: `Estado actualizado en documento ${prev.numero_documento || 'N/A'}`,
          mensaje: `El estado cambio de "${estadoAnterior}" a "${nuevoEstado}"`,
          urlAccion: `/reasignados?doc=${req.params.id}`
        });

        await enviarNotificacionCambioEstado({
          destinatario: destinatarioCorreo,
          nombre: destinatarioNombre,
          documento: prev.numero_documento || 'N/A',
          estadoAnterior,
          estadoNuevo: nuevoEstado,
          actor: autorNombre
        });
      }
    }

    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM reasignados WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
