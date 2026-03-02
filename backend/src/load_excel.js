const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const db = require('./db');

async function run() {
  const file = path.resolve(__dirname, '..', '..', 'doc', 'sitra2026.xlsx');
  if (!fs.existsSync(file)) {
    console.error('File not found:', file);
    process.exit(1);
  }

  const workbook = xlsx.readFile(file);
  const sheets = workbook.SheetNames;
  console.log('Found sheets:', sheets);

  for (const name of sheets) {
    const key = name.toLowerCase();
    const sheet = workbook.Sheets[name];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: null });
    console.log(`Processing sheet ${name} (${rows.length} rows)`);

    if (key.includes('reasign')) {
      for (const row of rows) {
        const numero_documento = row['Número Documento'] || row['Numero Documento'] || row['Nro. Trámite'] || null;
        const tipo_documento = row['Tipo Documento'] || null;
        const numero_tramite = row['Nro. Trámite'] || null;
        const fecha_documento = row['Fecha Documento'] || row['? Fecha Documento'] || null;
        const fecha_reasignacion = row['? Fecha Reasignación'] || row['Fecha Reasignación'] || null;
        const fecha_max_respuesta = row['Fecha Max. de Respuesta'] || null;
        const reasignado_a = row['Reasignado a'] || null;
        const comentario = row['Comentario'] || null;
        const respuesta = row['Respuesta'] || null;
        const remitente = row['De'] || row['Remitente'] || null;
        const destinatario = row['Para'] || row['Destinatario'] || null;
        const asunto = row['Asunto'] || null;
        const estado = row['Estado'] || null;

        await db.query(
          'INSERT INTO reasignados (numero_documento, tipo_documento, numero_tramite, fecha_documento, fecha_reasignacion, fecha_max_respuesta, reasignado_a, comentario, respuesta, remitente, destinatario, asunto, estado, extra) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [numero_documento, tipo_documento, numero_tramite, fecha_documento, fecha_reasignacion, fecha_max_respuesta, reasignado_a, comentario, respuesta, remitente, destinatario, asunto, estado, JSON.stringify(row)]
        );
      }
      console.log(`Inserted ${rows.length} reasignados`);
    } else if (key.includes('tarea') || key.includes('tareas')) {
      for (const row of rows) {
        const numero_documento = row['Número Documento'] || row['Numero Documento'] || null;
        const fecha_documento = row['? Fecha Documento'] || row['Fecha Documento'] || null;
        const fecha_asignacion = row['Fecha Asignación'] || null;
        const asignado_para = row['Asignado para'] || null;
        const descripcion = row['Comentario'] || null;
        const fecha_maxima = row['Fecha Máxima'] || null;
        const avance = row['Avance'] || null;
        const estado = row['Estado'] || null;
        const nro_dias = row['Nro. Días'] || null;
        const remitente = row['De'] || null;
        const destinatario = row['Para'] || null;
        const asunto = row['Asunto'] || null;

        await db.query(
          'INSERT INTO tareas (numero_documento, fecha_documento, fecha_asignacion, asignado_para, descripcion, fecha_maxima, avance, estado, nro_dias, remitente, destinatario, asunto, extra) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [numero_documento, fecha_documento, fecha_asignacion, asignado_para, descripcion, fecha_maxima, avance, estado, nro_dias, remitente, destinatario, asunto, JSON.stringify(row)]
        );
      }
      console.log(`Inserted ${rows.length} tareas`);
    } else if (key.includes('envi') || key.includes('enviado') || key.includes('enviados')) {
      for (const row of rows) {
        const numero_documento = row['Número Documento'] || row['Numero Documento'] || null;
        const remitente = row['De'] || null;
        const para = row['Para'] || null;
        const asunto = row['Asunto'] || null;
        const fecha_documento = row['? Fecha Documento'] || row['Fecha Documento'] || null;
        const no_referencia = row['No. Referencia'] || null;
        const tipo_documento = row['Tipo Documento'] || null;
        const nro_tramite = row['Nro. Trámite'] || null;
        const estado = row['Estado'] || null;

        await db.query(
          'INSERT INTO enviados (numero_documento, remitente, para, asunto, fecha_documento, no_referencia, tipo_documento, nro_tramite, estado, extra) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [numero_documento, remitente, para, asunto, fecha_documento, no_referencia, tipo_documento, nro_tramite, estado, JSON.stringify(row)]
        );
      }
      console.log(`Inserted ${rows.length} enviados`);
    } else {
      console.log(`Skipping sheet ${name}`);
    }
  }

  console.log('Done');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
