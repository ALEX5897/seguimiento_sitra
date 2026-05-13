require('dotenv').config();
const mysql = require('mysql2/promise');
const XLSX = require('xlsx');
const path = require('path');

async function procesarGerencias() {
  let connection;
  try {
    console.log('🔄 Conectando a base de datos...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    console.log('✓ Conectado');

    // Leer archivo Excel
    console.log('\n🔄 Leyendo archivo Excel...');
    const excelPath = path.join(__dirname, '../doc/funcionarios_28042026.xlsx');
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Leer todas las filas para encontrar los headers
    const todasLasFilas = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // La fila 0 es el título, la fila 1 tiene los headers
    const headers = todasLasFilas[1];
    const dataRows = todasLasFilas.slice(2);

    console.log(`  ✓ Archivo leído: ${dataRows.length} registros`);
    console.log(`  Columnas encontradas: ${headers.join(', ')}`);

    // Encontrar índices de columnas
    const idxFuncionario = headers.indexOf('FUNCIONARIO');
    const idxArea = headers.indexOf('ÁREA');

    if (idxFuncionario === -1 || idxArea === -1) {
      throw new Error(`Columnas no encontradas. Funcionario: ${idxFuncionario}, Área: ${idxArea}`);
    }

    // Crear tabla de catálogo de gerencias
    console.log('\n🔄 Creando/verificando tabla de catálogo de gerencias...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS catalogo_gerencias (
        id INT PRIMARY KEY AUTO_INCREMENT,
        codigo VARCHAR(50) UNIQUE NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        descripcion TEXT,
        activo BOOLEAN DEFAULT true,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ Tabla de gerencias lista');

    // Extraer gerencias únicas
    const gerenciasSet = new Set();
    const funcionariosMap = new Map();

    dataRows.forEach((row, index) => {
      const nombre = (row[idxFuncionario] || '').trim();
      const gerencia = (row[idxArea] || 'Sin Gerencia').trim();

      if (nombre) {
        funcionariosMap.set(nombre, gerencia);
        gerenciasSet.add(gerencia);
      }
    });

    console.log(`\n📊 Encontradas ${gerenciasSet.size} gerencias únicas:`);
    const gerencias = Array.from(gerenciasSet).sort();
    gerencias.forEach(g => console.log(`  - ${g}`));

    // Insertar gerencias en el catálogo
    console.log('\n🔄 Insertando gerencias en catálogo...');
    for (const gerencia of gerencias) {
      const codigo = gerencia.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      try {
        await connection.query(
          'INSERT IGNORE INTO catalogo_gerencias (codigo, nombre) VALUES (?, ?)',
          [codigo, gerencia]
        );
        console.log(`  ✓ Gerencia "${gerencia}" agregada`);
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`  ℹ️ Gerencia "${gerencia}" ya existe`);
        } else {
          console.error(`  ❌ Error con gerencia "${gerencia}":`, err.message);
        }
      }
    }

    // Actualizar usuarios con gerencia
    console.log('\n🔄 Asignando gerencias a usuarios...');
    let actualizados = 0;
    let sinEncontrar = 0;

    for (const [nombreFuncionario, gerencia] of funcionariosMap) {
      try {
        // Buscar usuario por nombre (búsqueda flexible)
        const [usuario] = await connection.query(
          'SELECT id, nombre FROM usuarios WHERE LOWER(nombre) LIKE LOWER(?) LIMIT 1',
          [`%${nombreFuncionario}%`]
        );

        if (usuario.length > 0) {
          const usr = usuario[0];
          // Actualizar gerencia
          await connection.query(
            'UPDATE usuarios SET gerencia = ? WHERE id = ?',
            [gerencia, usr.id]
          );
          actualizados++;
          console.log(`  ✓ ${nombreFuncionario}: ${gerencia}`);
        } else {
          sinEncontrar++;
          console.log(`  ⚠️ No encontrado: ${nombreFuncionario} (${gerencia})`);
        }
      } catch (err) {
        console.error(`  ❌ Error procesando ${nombreFuncionario}:`, err.message);
      }
    }

    // Resumen final
    console.log('\n📊 Resumen:');
    console.log(`  - Gerencias creadas: ${gerencias.length}`);
    console.log(`  - Empleados actualizados: ${actualizados}`);
    console.log(`  - Empleados no encontrados: ${sinEncontrar}`);

    // Mostrar usuarios sin gerencia
    console.log('\n🔍 Usuarios sin gerencia asignada:');
    const [sinGerencia] = await connection.query(
      `SELECT id, nombre, correo FROM usuarios
       WHERE (gerencia IS NULL OR gerencia = '' OR gerencia = 'Sin Gerencia')
       ORDER BY nombre`
    );

    if (sinGerencia.length > 0) {
      console.log(`  Encontrados ${sinGerencia.length} usuarios sin gerencia:`);
      sinGerencia.forEach(usr => {
        console.log(`    - ${usr.nombre} (${usr.correo})`);
      });

      // Asignar "Sin Gerencia" a los que no tienen
      console.log('\n🔄 Asignando "Sin Gerencia" a usuarios sin gerencia...');
      for (const usr of sinGerencia) {
        await connection.query(
          'UPDATE usuarios SET gerencia = ? WHERE id = ?',
          ['Sin Gerencia', usr.id]
        );
      }
      console.log(`  ✓ ${sinGerencia.length} usuarios actualizados`);
    } else {
      console.log('  ✓ Todos los usuarios tienen gerencia asignada');
    }

    // Mostrar gerencias en usuarios
    console.log('\n📋 Distribución de gerencias:');
    const [distribucion] = await connection.query(`
      SELECT
        COALESCE(gerencia, 'Sin Gerencia') as gerencia,
        COUNT(*) as cantidad
      FROM usuarios
      GROUP BY gerencia
      ORDER BY cantidad DESC
    `);

    distribucion.forEach(row => {
      console.log(`  - ${row.gerencia}: ${row.cantidad} empleado(s)`);
    });

    console.log('\n✓ Proceso completado exitosamente');
    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

procesarGerencias();
