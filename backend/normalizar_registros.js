require('dotenv').config();
const mysql = require('mysql2/promise');

async function normalizarRegistros() {
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

    // Obtener estados válidos del catálogo
    console.log('\n🔄 Cargando catálogo de estados...');
    const [estadosCatalogo] = await connection.query(
      'SELECT nombre FROM catalogo_estados_reasignados WHERE activo = true'
    );
    const estadosValidos = estadosCatalogo.map(e => e.nombre);
    const estadosValidosMap = new Map();
    estadosValidos.forEach(e => {
      estadosValidosMap.set(e.toLowerCase(), e);
    });
    console.log(`  ✓ Estados válidos: ${estadosValidos.join(', ')}`);

    // Obtener importancias válidas del catálogo
    console.log('\n🔄 Cargando catálogo de importancias...');
    const [importanciasCatalogo] = await connection.query(
      'SELECT nombre FROM catalogo_importancias WHERE activo = true'
    );
    const importanciasValidas = importanciasCatalogo.map(i => i.nombre);
    const importanciasValidasMap = new Map();
    importanciasValidas.forEach(i => {
      importanciasValidasMap.set(i.toLowerCase(), i);
    });
    console.log(`  ✓ Importancias válidas: ${importanciasValidas.join(', ')}`);

    // Obtener todos los registros de reasignados
    console.log('\n🔄 Analizando registros en reasignados...');
    const [registros] = await connection.query('SELECT id, estado, importancia FROM reasignados');

    const estadosInvalidos = new Map();
    const importanciasInvalidas = new Map();

    registros.forEach(reg => {
      const estado = (reg.estado || '').trim();
      const importancia = (reg.importancia || '').trim();

      // Verificar estado
      if (estado && !estadosValidosMap.has(estado.toLowerCase())) {
        if (!estadosInvalidos.has(estado)) {
          estadosInvalidos.set(estado, []);
        }
        estadosInvalidos.get(estado).push(reg.id);
      }

      // Verificar importancia
      if (importancia && !importanciasValidasMap.has(importancia.toLowerCase())) {
        if (!importanciasInvalidas.has(importancia)) {
          importanciasInvalidas.set(importancia, []);
        }
        importanciasInvalidas.get(importancia).push(reg.id);
      }
    });

    console.log(`  📊 Total de registros: ${registros.length}`);

    if (estadosInvalidos.size === 0 && importanciasInvalidas.size === 0) {
      console.log('  ✓ Todos los registros están normalizados');
      await connection.end();
      process.exit(0);
    }

    if (estadosInvalidos.size > 0) {
      console.log('\n  ⚠️ Estados inválidos encontrados:');
      estadosInvalidos.forEach((ids, estado) => {
        console.log(`    - "${estado}" (${ids.length} registros) → será normalizado a "Pendiente"`);
      });
    }

    if (importanciasInvalidas.size > 0) {
      console.log('\n  ⚠️ Importancias inválidas encontradas:');
      importanciasInvalidas.forEach((ids, importancia) => {
        console.log(`    - "${importancia}" (${ids.length} registros) → será normalizado a "Media"`);
      });
    }

    // Normalizar registros
    console.log('\n🔄 Normalizando registros...');

    for (const reg of registros) {
      let estado = (reg.estado || '').trim();
      let importancia = (reg.importancia || '').trim();
      let actualizar = false;

      // Normalizar estado
      if (estado) {
        const estadoNormalizado = estadosValidosMap.get(estado.toLowerCase());
        if (estadoNormalizado && estadoNormalizado !== estado) {
          const estadoAnterior = estado;
          estado = estadoNormalizado;
          actualizar = true;
          console.log(`  ✓ ID ${reg.id}: Estado "${estadoAnterior}" → "${estado}"`);
        } else if (!estadoNormalizado) {
          const estadoAnterior = estado;
          // Mapear al estado válido por defecto
          estado = estadosValidosMap.get('pendiente') || 'Pendiente';
          actualizar = true;
          console.log(`  ✓ ID ${reg.id}: Estado "${estadoAnterior}" → "${estado}"`);
        }
      }

      // Normalizar importancia
      if (importancia) {
        const importanciaNormalizada = importanciasValidasMap.get(importancia.toLowerCase());
        if (importanciaNormalizada && importanciaNormalizada !== importancia) {
          const importanciaAnterior = importancia;
          importancia = importanciaNormalizada;
          actualizar = true;
          console.log(`  ✓ ID ${reg.id}: Importancia "${importanciaAnterior}" → "${importancia}"`);
        } else if (!importanciaNormalizada) {
          const importanciaAnterior = importancia;
          // Mapear a la importancia válida por defecto
          importancia = importanciasValidasMap.get('normal') || importanciasValidas[0] || 'Normal';
          actualizar = true;
          console.log(`  ✓ ID ${reg.id}: Importancia "${importanciaAnterior}" → "${importancia}"`);
        }
      }

      // Actualizar registro si fue modificado
      if (actualizar) {
        await connection.query(
          'UPDATE reasignados SET estado = ?, importancia = ? WHERE id = ?',
          [estado, importancia, reg.id]
        );
      }
    }

    // Verificación final
    console.log('\n🔍 Verificación final...');
    const [registrosNormalizados] = await connection.query(
      `SELECT DISTINCT estado FROM reasignados WHERE estado IS NOT NULL AND estado != ''`
    );
    console.log(`  Estados únicos en registros: ${registrosNormalizados.map(r => r.estado).join(', ')}`);

    const [importanciasNormalizadas] = await connection.query(
      `SELECT DISTINCT importancia FROM reasignados WHERE importancia IS NOT NULL AND importancia != ''`
    );
    console.log(`  Importancias únicas en registros: ${importanciasNormalizadas.map(i => i.importancia).join(', ')}`);

    console.log('\n✓ Normalización completada exitosamente');
    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err);
    if (connection) await connection.end();
    process.exit(1);
  }
}

normalizarRegistros();
