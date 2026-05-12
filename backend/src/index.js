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
const notificacionesConfig = require('./routes/notificaciones-config');
const debug = require('./routes/debug');
const comentarios = require('./routes/comentarios');
const { verificarConexion } = require('./services/mailService');
const { ejecutarTodasLasNotificaciones, procesarNotificacionesUnDiaAntes, obtenerConfiguracion } = require('./services/notificationService');
const { initKeycloak, isKeycloakEnabled, getKeycloak } = require('./services/keycloakService');
const { syncKeycloakUsers } = require('./services/keycloakSyncService');

const app = express();

// Permitir cookies seguras cuando hay proxy inverso (Nginx, etc.)
app.set('trust proxy', 1);

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
const isProduction = process.env.NODE_ENV === 'production';
const sessionSecure = Object.prototype.hasOwnProperty.call(process.env, 'SESSION_SECURE')
  ? process.env.SESSION_SECURE === 'true'
  : isProduction;
const sessionSameSite = process.env.SESSION_SAMESITE
  ? process.env.SESSION_SAMESITE
  : (isProduction ? 'none' : false);

const memoryStore = new session.MemoryStore();

app.use(session({
  secret: process.env.SESSION_SECRET || 'tu-clave-secreta-super-segura',
  resave: true,
  saveUninitialized: true,
  store: memoryStore,
  cookie: {
    secure: sessionSecure,
    httpOnly: true,
    sameSite: sessionSameSite || 'lax',
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
app.use('/api/admin/notificaciones', notificacionesConfig);
app.use('/api/debug', debug);
app.use('/api', comentarios);

// TEMPORAL: Endpoint público para test de correo (solo para testing)
app.post('/api/test/correo-prueba', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Correo electrónico requerido' });
    }

    const { enviarCorreoPrueba } = require('./services/notificationService');
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

// Endpoint de diagnóstico de sesión (público)
app.get('/api/test/debug-session', async (req, res) => {
  res.json({
    sessionId: req.sessionID,
    sessionData: req.session,
    usuario: req.session?.usuario,
    user: req.user,
    keycloakEnabled: isKeycloakEnabled(),
    cookies: req.headers.cookie || 'Sin cookies',
    mensaje: 'Este endpoint muestra el estado actual de la sesión'
  });
});

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

// Endpoint de prueba para sincronizar usuarios de Keycloak
app.post('/api/test/sync-keycloak', async (req, res) => {
  try {
    const resultado = await syncKeycloakUsers();
    res.json({ success: resultado.success, resultado });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint para ver estado de sincronización
app.get('/api/admin/sync-status', async (req, res) => {
  try {
    const db = require('./db');

    const [total] = await db.query('SELECT COUNT(*) as count FROM usuarios');
    const [porEstado] = await db.query(
      'SELECT estado, COUNT(*) as cantidad FROM usuarios GROUP BY estado'
    );
    const [conKeycloak] = await db.query(
      'SELECT COUNT(*) as count FROM usuarios WHERE extra LIKE "%keycloakId%"'
    );
    const [gerencias] = await db.query(
      'SELECT COUNT(DISTINCT gerencia) as count FROM usuarios WHERE gerencia IS NOT NULL'
    );

    res.json({
      totalUsuarios: total[0].count,
      porEstado,
      sincronizadosKeycloak: conKeycloak[0].count,
      gerenciasUnicas: gerencias[0].count,
      listoParaSincronizar: conKeycloak[0].count < total[0].count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
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

// Variables globales para guardar las tareas de cron
let cronTaskNotificaciones = null;
let cronTaskSyncKeycloak = null;

async function iniciarCron() {
  try {
    const config = await obtenerConfiguracion();
    const [hh, mm] = (config.hora_envio || '08:00').split(':');
    const cronExpressionNotificaciones = `${mm} ${hh} * * *`;

    // Calcular hora de sincronización 30 minutos antes
    let syncHh = parseInt(hh);
    let syncMm = parseInt(mm) - 30;
    if (syncMm < 0) {
      syncMm += 60;
      syncHh -= 1;
    }
    if (syncHh < 0) syncHh = 23;
    const cronExpressionSync = `${String(syncMm).padStart(2, '0')} ${String(syncHh).padStart(2, '0')} * * *`;

    if (cronTaskNotificaciones) {
      cronTaskNotificaciones.stop();
      cronTaskNotificaciones = null;
    }

    if (cronTaskSyncKeycloak) {
      cronTaskSyncKeycloak.stop();
      cronTaskSyncKeycloak = null;
    }

    // Tarea de sincronización de Keycloak
    cronTaskSyncKeycloak = cron.schedule(cronExpressionSync, async () => {
      console.log('\n🔄 [CRONJOB] Sincronizando usuarios de Keycloak...');
      try {
        await syncKeycloakUsers();
      } catch (error) {
        console.error('❌ Error en sincronización de Keycloak:', error.message);
      }
    }, {
      scheduled: true,
      timezone: process.env.TIMEZONE || 'America/Guayaquil'
    });

    // Tarea de notificaciones
    cronTaskNotificaciones = cron.schedule(cronExpressionNotificaciones, async () => {
      console.log('\n🔔 [CRONJOB] Iniciando verificación de documentos...');
      await ejecutarTodasLasNotificaciones();
    }, {
      scheduled: true,
      timezone: process.env.TIMEZONE || 'America/Guayaquil'
    });

    console.log(`⏰ Cronjob de Keycloak programado: ${cronExpressionSync} (Ecuador)`);
    console.log(`⏰ Cronjob de notificaciones programado: ${cronExpressionNotificaciones} (Ecuador)`);
  } catch (error) {
    console.error('❌ Error inicializando cron:', error.message);
    // Fallback con horas por defecto
    const syncExpressionFallback = '30 7 * * *';
    const notifyExpressionFallback = '0 8 * * *';

    cronTaskSyncKeycloak = cron.schedule(syncExpressionFallback, async () => {
      console.log('\n🔄 [CRONJOB] Sincronizando usuarios de Keycloak...');
      try {
        await syncKeycloakUsers();
      } catch (error) {
        console.error('❌ Error en sincronización de Keycloak:', error.message);
      }
    }, {
      scheduled: true,
      timezone: process.env.TIMEZONE || 'America/Guayaquil'
    });

    cronTaskNotificaciones = cron.schedule(notifyExpressionFallback, async () => {
      console.log('\n🔔 [CRONJOB] Iniciando verificación de documentos...');
      await ejecutarTodasLasNotificaciones();
    }, {
      scheduled: true,
      timezone: process.env.TIMEZONE || 'America/Guayaquil'
    });
    console.log(`⏰ Cronjob de Keycloak programado (fallback): ${syncExpressionFallback} (Ecuador)`);
    console.log(`⏰ Cronjob de notificaciones programado (fallback): ${notifyExpressionFallback} (Ecuador)`);
  }
}

// Iniciar cron después de conectar a la BD
iniciarCron();

// Manejo seguro de cierre
process.on('SIGINT', () => {
  console.log('\n\n👋 Cerrando servidor...');
  if (cronTaskNotificaciones) cronTaskNotificaciones.stop();
  if (cronTaskSyncKeycloak) cronTaskSyncKeycloak.stop();
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});
