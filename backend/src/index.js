require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const bodyParser = require('express').json;
const cron = require('node-cron');
const reasignados = require('./routes/reasignados');
const tareas = require('./routes/tareas');
const enviados = require('./routes/enviados');
const upload = require('./routes/upload');
const usuarios = require('./routes/usuarios');
const estadisticas = require('./routes/estadisticas');
const auth = require('./routes/auth');
const admin = require('./routes/admin');
const debug = require('./routes/debug');
const comentarios = require('./routes/comentarios');
const { verificarConexion } = require('./services/mailService');
const { ejecutarTodasLasNotificaciones, procesarNotificacionesUnDiaAntes } = require('./services/notificationService');
const { initKeycloak, isKeycloakEnabled, getKeycloak } = require('./services/keycloakService');

const app = express();

// Configurar CORS para permitir credenciales (cookies)
const getLocalIP = () => {
  try {
    const os = require('os');
    const ips = os.networkInterfaces();
    for (const name of Object.keys(ips)) {
      for (const iface of ips[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  } catch (e) {
    return 'localhost';
  }
  return 'localhost';
};

const localIP = getLocalIP();
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  `http://${localIP}:5173`,
  `http://${localIP}:5174`,
  `http://${localIP}:5175`,
  '127.0.0.1:5173',
  '127.0.0.1:5174',
  '127.0.0.1:5175'
].filter(Boolean);

console.log('📡 CORS Origins permitidos:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // En desarrollo, permitir solicitudes sin origen o desde orígenes conocidos
    if (!origin || allowedOrigins.some(allowed => origin.includes(allowed.split('//')[1] || ''))) {
      return callback(null, true);
    }
    // También permitir cualquier origen en desarrollo
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    return callback(new Error('CORS origin no permitido'));
  },
  credentials: true, // Permitir cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(bodyParser());

// Configurar sesiones
const memoryStore = new session.MemoryStore();

app.use(session({
  secret: process.env.SESSION_SECRET || 'tu-clave-secreta-super-segura',
  resave: false,
  saveUninitialized: true, // Cambiar a true para guardar sesiones incluso antes de autenticar
  store: memoryStore,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // HTTPS en producción
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'Strict' : false, // En desarrollo, permitir cross-origin cookies
    maxAge: 1000 * 60 * 60 * 24 // 24 horas
  }
}));

// Inicializar Keycloak si está habilitado
if (isKeycloakEnabled()) {
  const keycloak = initKeycloak(memoryStore);
  
  // Middleware de Keycloak
  app.use(keycloak.middleware({
    logout: '/api/auth/keycloak/logout',
    admin: '/'
  }));
  
  console.log('✅ Keycloak habilitado');
} else {
  console.log('ℹ️  Keycloak deshabilitado - Usando autenticación por correo');
}

app.use('/api/reasignados', reasignados);
app.use('/api/tareas', tareas);
app.use('/api/enviados', enviados);
app.use('/api/upload', upload);
app.use('/api/usuarios', usuarios);
app.use('/api/estadisticas', estadisticas);
app.use('/api/auth', auth);
app.use('/api/admin/usuarios', admin);
app.use('/api/debug', debug);
app.use('/api', comentarios);

// Endpoint de prueba para forzar notificaciones manualmente
app.post('/api/test/notificaciones', async (req, res) => {
  try {
    await ejecutarTodasLasNotificaciones();
    res.json({ success: true, message: 'Notificaciones ejecutadas manualmente' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint de prueba para notificaciones de 1 dia antes
app.post('/api/test/notificaciones-proximos', async (req, res) => {
  try {
    const resultado = await procesarNotificacionesUnDiaAntes();
    res.json({ success: true, resultado });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint de salud para verificar conexión SMTP
app.get('/api/health/mail', async (req, res) => {
  try {
    const conectado = await verificarConexion();
    res.json({ 
      status: conectado ? 'ok' : 'error',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const server = app.listen(PORT, HOST, () => {
  const getLocalIP = () => {
    try {
      const ips = require('os').networkInterfaces();
      for (const name of Object.keys(ips)) {
        for (const iface of ips[name]) {
          if (iface.family === 'IPv4' && !iface.internal) {
            return iface.address;
          }
        }
      }
    } catch (e) {
      return 'localhost';
    }
    return 'localhost';
  };
  
  console.log(`\n🚀 SISTRA backend listening on ${HOST}:${PORT}`);
  console.log(`📡 Acceso local:  http://localhost:${PORT}`);
  console.log(`📡 Acceso remoto: http://${getLocalIP()}:${PORT}`);
  console.log(`📧 Mail Service: ${process.env.MAIL_USER || 'No configurado'}`);
  console.log(`⏰ Cronjob configurado para ejecutarse diariamente\n`);
  
  // Verificar conexión SMTP al iniciar
  verificarConexion().catch(err => console.error('Error SMTP inicial:', err));
});

// Configurar cronjob para ejecutar notificaciones diariamente
// Ejecutar a las 08:00 (8 AM) cada día
// Formato cron: segundo minuto hora día_mes mes día_semana
const cronExpression = process.env.CRON_SCHEDULE || '0 8 * * *';
cron.schedule(cronExpression, async () => {
  console.log('\n🔔 [CRONJOB] Iniciando verificación de documentos...');
  await ejecutarTodasLasNotificaciones();
}, {
  scheduled: true,
  timezone: 'America/Guayaquil'
});

console.log(`⏰ Cronjob programado: ${cronExpression} (Ecuador)`);

// Manejo seguro de cierre
process.on('SIGINT', () => {
  console.log('\n\n👋 Cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});
