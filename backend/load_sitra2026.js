const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');
const db = require('./src/db');

/**
 * Función auxiliar para convertir fecha de Excel a formato MySQL
 * Excel guarda las fechas como números seriales (días desde 1/1/1900)
 * También puede recibir strings con fecha/hora en formato ISO
 * @param {number|string|Date} fechaExcel - Fecha en formato Excel, string o Date
 * @returns {string|null} Fecha en formato YYYY-MM-DD o null
 */
function convertirFechaExcel(fechaExcel) {
  if (!fechaExcel) return null;
  
  // Si ya es un objeto Date
  if (fechaExcel instanceof Date) {
    return fechaExcel.toISOString().split('T')[0];
  }
  
  // Si es un número serial de Excel
  if (typeof fechaExcel === 'number') {
    // Excel cuenta días desde 1899-12-30 (debido a un bug histórico)
    const dias = Math.floor(fechaExcel);
    const fecha = new Date(Date.UTC(1899, 11, 30));
    fecha.setUTCDate(fecha.getUTCDate() + dias);
    return fecha.toISOString().split('T')[0];
  }
  
  // Si es un string
  if (typeof fechaExcel === 'string') {
    let fechaLimpia = fechaExcel.trim();
    
    // Remover (GMT-5), (GMT-4), etc. del final
    fechaLimpia = fechaLimpia.replace(/\s*\(GMT[^)]*\)\s*$/i, '').trim();
    
    // Extraer solo la parte de fecha (primer 10 caracteres: YYYY-MM-DD)
    // Si es formato como "2026-02-12 20:58:37", solo tomar "2026-02-12"
    const matchFecha = fechaLimpia.match(/^(\d{4}-\d{2}-\d{2})/);
    if (matchFecha) {
      return matchFecha[1];
    }
    
    // Si no tiene formato YYYY-MM-DD, intentar parsear como Date
    const fecha = new Date(fechaLimpia);
    if (!isNaN(fecha.getTime())) {
      return fecha.toISOString().split('T')[0];
    }
  }
  
  return null;
}

/**
 * Función auxiliar para calcular distancia de Levenshtein
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[str2.length][str1.length];
}

/**
 * Función auxiliar para buscar un usuario por nombre
 * @param {Array} usuarios - Lista de usuarios disponibles
 * @param {string} nombreBuscado - Nombre a buscar
 * @returns {object|null} Usuario encontrado o null
 */
function buscarUsuarioPorNombre(usuarios, nombreBuscado) {
  if (!nombreBuscado || typeof nombreBuscado !== 'string') return null;
  
  // Limpiar el nombre: remover texto entre paréntesis y espacios extra
  let nombreLimpio = nombreBuscado.trim();
  nombreLimpio = nombreLimpio.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  nombreLimpio = nombreLimpio.replace(/\s+/g, ' ');
  const nombreLimpioLower = nombreLimpio.toLowerCase();
  
  if (!nombreLimpioLower) return null;

  // 1. Búsqueda exacta (ignorando mayúsculas)
  let encontrado = usuarios.find(u => u.nombre.toLowerCase() === nombreLimpioLower);
  if (encontrado) return encontrado;

  // 2. Búsqueda parcial (el nombre del Excel contiene el nombre del usuario)
  encontrado = usuarios.find(u => nombreLimpioLower.includes(u.nombre.toLowerCase()));
  if (encontrado) return encontrado;

  // 3. Búsqueda inversa (el nombre del usuario contiene el del Excel)
  encontrado = usuarios.find(u => u.nombre.toLowerCase().includes(nombreLimpioLower));
  if (encontrado) return encontrado;

  // 4. Búsqueda con similitud (Levenshtein) para errores de escritura menores
  let mejorCoincidencia = null;
  let menorDistancia = Infinity;
  
  for (const usuario of usuarios) {
    const distancia = levenshteinDistance(nombreLimpioLower, usuario.nombre.toLowerCase());
    // Permitir hasta 2 caracteres de diferencia para nombres similares
    if (distancia <= 2 && distancia < menorDistancia) {
      menorDistancia = distancia;
      mejorCoincidencia = usuario;
    }
  }
  
  if (mejorCoincidencia) {
    console.log(`  🔍 Coincidencia aproximada: "${nombreBuscado}" ≈ "${mejorCoincidencia.nombre}" (distancia: ${menorDistancia})`);
    return mejorCoincidencia;
  }

  return null;
}

async function run() {
  try {
    const file = path.resolve(__dirname, '..', 'doc', 'sitra2026.xlsx');
    if (!fs.existsSync(file)) {
      console.error('❌ Archivo no encontrado:', file);
      process.exit(1);
    }

    console.log('📂 Cargando archivo:', file);
    const workbook = xlsx.readFile(file);
    const sheetNames = workbook.SheetNames;
    console.log('📋 Hojas encontradas:', sheetNames);

    // Cargar todos los usuarios activos de la base de datos
    const [usuariosActivos] = await db.query(
      'SELECT id, nombre, correo FROM usuarios WHERE estado = ? ORDER BY nombre',
      ['activo']
    );

    console.log(`\n👥 Usuarios activos en BD: ${usuariosActivos.length}`);
    usuariosActivos.slice(0, 5).forEach(u => console.log(`  - ${u.nombre} (${u.correo})`));
    if (usuariosActivos.length > 5) console.log(`  ... y ${usuariosActivos.length - 5} más`);

    const results = {
      reasignados: { insertados: 0, omitidos: 0, errores: [] },
      tareas: { insertados: 0, omitidos: 0, errores: [] },
      enviados: { insertados: 0, omitidos: 0, errores: [] },
      usuariosNoEncontrados: []
    };

    // NOTA: Descomenta estas líneas si deseas limpiar las tablas antes de cargar
    // console.log('\n🗑️  Limpiando tablas...');
    // await db.query('DELETE FROM reasignados');
    // await db.query('DELETE FROM tareas');
    // await db.query('DELETE FROM enviados');

    for (const name of sheetNames) {
      const sheet = workbook.Sheets[name];
      const json = xlsx.utils.sheet_to_json(sheet, { defval: null });
      const key = name.toLowerCase().trim();

      if (key.includes('reasign')) {
        console.log(`\n📄 Procesando hoja: ${name} (${json.length} filas)`);
        
        for (let i = 0; i < json.length; i++) {
          const row = json[i];
          const numero_documento = row['Número Documento'] || row['Numero Documento'] || row['Nro. Trámite'] || null;
          const tipo_documento = row['Tipo Documento'] || null;
          const numero_tramite = row['Nro. Trámite'] || null;
          const fecha_documento = convertirFechaExcel(row['Fecha Documento'] || row['? Fecha Documento'] || null);
          const fecha_reasignacion = convertirFechaExcel(row['? Fecha Reasignación'] || row['Fecha Reasignación'] || null);
          const fecha_max_respuesta = convertirFechaExcel(row['Fecha Max. de Respuesta'] || null);
          const reasignado_a_excel = row['Reasignado a'] || null;
          const comentario = row['Comentario'] || null;
          const respuesta = row['Respuesta'] || null;
          const remitente = row['De'] || row['Remitente'] || null;
          const destinatario = row['Para'] || row['Destinatario'] || null;
          const asunto = row['Asunto'] || null;
          const estado = row['Estado'] || null;

          // Buscar usuario en la base de datos
          const usuario = buscarUsuarioPorNombre(usuariosActivos, reasignado_a_excel);

          if (!usuario) {
            results.reasignados.omitidos++;
            const nombreNoEncontrado = reasignado_a_excel || '(vacío)';
            if (!results.usuariosNoEncontrados.includes(nombreNoEncontrado)) {
              results.usuariosNoEncontrados.push(nombreNoEncontrado);
            }
            results.reasignados.errores.push({
              fila: i + 2,
              numero_documento,
              reasignado_a: nombreNoEncontrado,
              error: 'Usuario no encontrado en la base de datos'
            });
            continue;
          }

          // Insertar con usuario_id validado
          try {
            await db.query(
              'INSERT INTO reasignados (numero_documento, tipo_documento, numero_tramite, fecha_documento, fecha_reasignacion, fecha_max_respuesta, reasignado_a, usuario_id, comentario, respuesta, remitente, destinatario, asunto, estado, extra) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [numero_documento, tipo_documento, numero_tramite, fecha_documento, fecha_reasignacion, fecha_max_respuesta, usuario.nombre, usuario.id, comentario, respuesta, remitente, destinatario, asunto, estado, JSON.stringify(row)]
            );
            results.reasignados.insertados++;
            if (results.reasignados.insertados <= 3) {
              console.log(`  ✅ Fila ${i + 2}: ${numero_documento} → ${usuario.nombre}`);
            }
          } catch (insertError) {
            results.reasignados.omitidos++;
            results.reasignados.errores.push({
              fila: i + 2,
              numero_documento,
              error: insertError.message
            });
          }
        }
      } else if (key.includes('tarea') || key.includes('tareas')) {
        console.log(`\n📄 Procesando hoja: ${name} (${json.length} filas)`);
        
        for (let i = 0; i < json.length; i++) {
          const row = json[i];
          const numero_documento = row['Número Documento'] || row['Numero Documento'] || null;
          const fecha_documento = convertirFechaExcel(row['? Fecha Documento'] || row['Fecha Documento'] || null);
          const fecha_asignacion = convertirFechaExcel(row['Fecha Asignación'] || null);
          const asignado_para_excel = row['Asignado para'] || null;
          const descripcion = row['Comentario'] || null;
          const fecha_maxima = convertirFechaExcel(row['Fecha Máxima'] || null);
          const avance = row['Avance'] || null;
          const estado = row['Estado'] || null;
          const nro_dias = row['Nro. Días'] || null;
          const remitente = row['De'] || null;
          const destinatario = row['Para'] || null;
          const asunto = row['Asunto'] || null;

          // Buscar usuario en la base de datos
          const usuario = buscarUsuarioPorNombre(usuariosActivos, asignado_para_excel);

          if (!usuario) {
            results.tareas.omitidos++;
            const nombreNoEncontrado = asignado_para_excel || '(vacío)';
            if (!results.usuariosNoEncontrados.includes(nombreNoEncontrado)) {
              results.usuariosNoEncontrados.push(nombreNoEncontrado);
            }
            results.tareas.errores.push({
              fila: i + 2,
              numero_documento,
              asignado_para: nombreNoEncontrado,
              error: 'Usuario no encontrado en la base de datos'
            });
            continue;
          }

          // Insertar con usuario_id validado
          try {
            await db.query(
              'INSERT INTO tareas (numero_documento, fecha_documento, fecha_asignacion, asignado_para, usuario_id, descripcion, fecha_maxima, avance, estado, nro_dias, remitente, destinatario, asunto, extra) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [numero_documento, fecha_documento, fecha_asignacion, usuario.nombre, usuario.id, descripcion, fecha_maxima, avance, estado, nro_dias, remitente, destinatario, asunto, JSON.stringify(row)]
            );
            results.tareas.insertados++;
            if (results.tareas.insertados <= 3) {
              console.log(`  ✅ Fila ${i + 2}: ${numero_documento} → ${usuario.nombre}`);
            }
          } catch (insertError) {
            results.tareas.omitidos++;
            results.tareas.errores.push({
              fila: i + 2,
              numero_documento,
              error: insertError.message
            });
          }
        }
      } else if (key.includes('envi') || key.includes('enviado') || key.includes('enviados')) {
        console.log(`\n📄 Procesando hoja: ${name} (${json.length} filas)`);
        
        for (let i = 0; i < json.length; i++) {
          const row = json[i];
          const numero_documento = row['Número Documento'] || row['Numero Documento'] || null;
          const remitente = row['De'] || null;
          const para_excel = row['Para'] || null;
          const asunto = row['Asunto'] || null;
          const fecha_documento = convertirFechaExcel(row['? Fecha Documento'] || row['Fecha Documento'] || null);
          const no_referencia = row['No. Referencia'] || null;
          const tipo_documento = row['Tipo Documento'] || null;
          const nro_tramite = row['Nro. Trámite'] || null;
          const estado = row['Estado'] || null;

          // Buscar usuario en la base de datos (OPCIONAL para enviados)
          const usuario = buscarUsuarioPorNombre(usuariosActivos, para_excel);

          // Para enviados, permitimos insertar incluso si no se encuentra el usuario
          const usuario_id = usuario ? usuario.id : null;
          const para_nombre = usuario ? usuario.nombre : para_excel;

          try {
            await db.query(
              'INSERT INTO enviados (numero_documento, remitente, para, usuario_id, asunto, fecha_documento, no_referencia, tipo_documento, nro_tramite, estado, extra) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
              [numero_documento, remitente, para_nombre, usuario_id, asunto, fecha_documento, no_referencia, tipo_documento, nro_tramite, estado, JSON.stringify(row)]
            );
            results.enviados.insertados++;
            if (results.enviados.insertados <= 3) {
              console.log(`  ✅ Fila ${i + 2}: ${numero_documento} → ${para_nombre}`);
            }
          } catch (insertError) {
            results.enviados.omitidos++;
            results.enviados.errores.push({
              fila: i + 2,
              numero_documento,
              error: insertError.message
            });
          }
        }
      } else {
        console.log(`\n⏭️  Omitiendo hoja: ${name}`);
      }
    }

    // Reporte final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE CARGA');
    console.log('='.repeat(60));
    console.log(`✅ Reasignados insertados: ${results.reasignados.insertados}`);
    console.log(`❌ Reasignados omitidos: ${results.reasignados.omitidos}`);
    console.log(`✅ Tareas insertadas: ${results.tareas.insertados}`);
    console.log(`❌ Tareas omitidas: ${results.tareas.omitidos}`);
    console.log(`✅ Enviados insertados: ${results.enviados.insertados}`);
    console.log(`❌ Enviados omitidos: ${results.enviados.omitidos}`);
    
    if (results.usuariosNoEncontrados.length > 0) {
      console.log('\n⚠️  USUARIOS NO ENCONTRADOS EN LA BASE DE DATOS:');
      results.usuariosNoEncontrados.forEach((nombre, i) => {
        console.log(`  ${i + 1}. ${nombre}`);
      });
      console.log('\n💡 Tip: Verifica que estos usuarios estén registrados en la tabla "usuarios" con estado "activo"');
    }

    if (results.reasignados.errores.length > 0 || results.tareas.errores.length > 0 || results.enviados.errores.length > 0) {
      console.log('\n📝 DETALLES DE ERRORES:');
      
      if (results.reasignados.errores.length > 0) {
        console.log('\n  Reasignados:');
        results.reasignados.errores.slice(0, 10).forEach(err => {
          console.log(`    Fila ${err.fila}: ${err.numero_documento || '(sin número)'} - ${err.error}`);
        });
        if (results.reasignados.errores.length > 10) {
          console.log(`    ... y ${results.reasignados.errores.length - 10} errores más`);
        }
      }
      
      if (results.tareas.errores.length > 0) {
        console.log('\n  Tareas:');
        results.tareas.errores.slice(0, 10).forEach(err => {
          console.log(`    Fila ${err.fila}: ${err.numero_documento || '(sin número)'} - ${err.error}`);
        });
        if (results.tareas.errores.length > 10) {
          console.log(`    ... y ${results.tareas.errores.length - 10} errores más`);
        }
      }
    }

    console.log('\n✅ Proceso completado');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error fatal:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

run();
