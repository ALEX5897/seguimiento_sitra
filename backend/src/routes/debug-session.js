const express = require('express');
const router = express.Router();

// Endpoint de debug para verificar sesión (SOLO PARA DESARROLLO)
router.get('/session-status', (req, res) => {
  const usuario = req.session?.usuario;

  console.log('\n📋 DEBUG: Session Status');
  console.log('════════════════════════════════════════════');
  console.log('Session ID:', req.sessionID);
  console.log('Usuario en sesión:', usuario ? {
    correo: usuario.correo,
    nombre: usuario.nombre,
    rol: usuario.rol
  } : 'null');
  console.log('req.session:', req.session ? {
    id: req.session.id,
    usuario: !!usuario
  } : 'null');
  console.log('Cookies recibidas:', req.headers.cookie);
  console.log('════════════════════════════════════════════\n');

  res.json({
    sessionID: req.sessionID,
    hasSession: !!req.session,
    usuario: usuario ? {
      correo: usuario.correo,
      nombre: usuario.nombre,
      rol: usuario.rol
    } : null,
    message: usuario ? '✅ Usuario autenticado' : '⚠️ Sin autenticación'
  });
});

// Endpoint para forzar login de prueba (SOLO PARA DESARROLLO)
router.post('/login-test', (req, res) => {
  const { correo = 'test@quito-turismo.gob.ec', rol = 'admin' } = req.body;

  req.session.usuario = {
    correo,
    nombre: 'Usuario Test',
    rol,
    id: 1
  };

  req.session.save((err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    console.log('✅ Login test realizado:', {
      correo,
      rol,
      sessionID: req.sessionID
    });

    res.json({
      success: true,
      message: 'Login test realizado',
      usuario: req.session.usuario,
      sessionID: req.sessionID
    });
  });
});

module.exports = router;
