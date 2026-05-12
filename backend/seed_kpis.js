require('dotenv').config();
const db = require('./src/db');

const tiposDocumento = ['Memorando', 'Oficio', 'Resolución', 'Contrato', 'Informe'];
const importancias = ['Urgente', 'Alta', 'Media', 'Baja'];
const estados = ['pendiente', 'en_proceso', 'completado', 'enviado'];
const personas = ['Juan Pérez', 'María García', 'Carlos López', 'Ana Martínez', 'Roberto Sánchez'];
const remitentes = ['Alcaldía', 'Secretaría General', 'Dirección Financiera', 'Recursos Humanos'];
const destinatarios = ['Departamento de Obras', 'Gestión Ambiental', 'Tesorería', 'Planificación'];

function generateRandomDate(daysBack) {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  return date.toISOString().split('T')[0];
}

function generateMaxResponseDate(baseDate, daysToAdd) {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().split('T')[0];
}

async function seedData() {
  try {
    console.log('🌱 Iniciando carga de datos de prueba para KPIs...');

    // Limpiar tabla anterior (opcional)
    // await db.query('TRUNCATE TABLE reasignados');

    const reasignaciones = [];

    // Generar 50 registros variados
    for (let i = 0; i < 50; i++) {
      const fechaDocumento = generateRandomDate(60);
      const daysToResponse = Math.floor(Math.random() * 30);
      const maxResponseDate = generateMaxResponseDate(fechaDocumento, daysToResponse);

      const tipoDoc = tiposDocumento[Math.floor(Math.random() * tiposDocumento.length)];
      const importancia = importancias[Math.floor(Math.random() * importancias.length)];
      const estado = estados[Math.floor(Math.random() * estados.length)];
      const persona = personas[Math.floor(Math.random() * personas.length)];
      const remitente = remitentes[Math.floor(Math.random() * remitentes.length)];
      const destinatario = destinatarios[Math.floor(Math.random() * destinatarios.length)];

      const numeroDocumento = `DOC-${2024}-${String(i + 1).padStart(5, '0')}`;
      const numeroTramite = `TRAM-${String(i + 1).padStart(4, '0')}`;
      const asunto = `${tipoDoc} relacionado con ${destinatario}`;

      // Si el estado es completado, generar una respuesta
      let respuesta = null;
      if (estado === 'completado' || estado === 'enviado') {
        const responseDate = new Date(fechaDocumento);
        responseDate.setDate(responseDate.getDate() + Math.floor(Math.random() * daysToResponse + 1));
        respuesta = `Respuesta completada el ${responseDate.toISOString().split('T')[0]}`;
      }

      await db.query(
        `INSERT INTO reasignados
        (numero_documento, tipo_documento, importancia, numero_tramite,
         fecha_documento, fecha_reasignacion, fecha_max_respuesta,
         reasignado_a, comentario, respuesta, remitente,
         destinatario, asunto, estado, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          numeroDocumento,
          tipoDoc,
          importancia,
          numeroTramite,
          fechaDocumento,
          generateRandomDate(30),
          maxResponseDate,
          persona,
          `Documento ${tipoDoc} para procesar`,
          respuesta,
          remitente,
          destinatario,
          asunto,
          estado
        ]
      );

      console.log(`✓ Registro ${i + 1}/50 creado: ${numeroDocumento}`);
    }

    console.log('\n✅ Datos de prueba cargados exitosamente!');
    console.log('📊 Se han creado 50 reasignaciones con diferentes estados e importancias');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

seedData();
