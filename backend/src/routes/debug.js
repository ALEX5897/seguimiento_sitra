const express = require('express');
const router = express.Router();
const db = require('../db');

// Endpoint de prueba para verificar sesión
router.get('/test-session', (req, res) => {
  const usuario = req.session?.usuario;
  
  res.json({
    tiene_sesion: !!req.session,
    tiene_usuario: !!usuario,
    usuario: usuario || null,
    session_id: req.sessionID,
    cookies: req.cookies,
    headers: {
      cookie: req.headers.cookie
    }
  });
});

module.exports = router;
