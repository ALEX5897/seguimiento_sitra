require('dotenv').config();
const mysql = require('mysql2/promise');

function levenshtein(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
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
  return matrix[b.length][a.length];
}

function normalizarNombre(nombre) {
  return nombre
    .toLowerCase()
    .trim()
    .replace(/á/g, 'a')
    .replace(/é/g, 'e')
    .replace(/í/g, 'i')
    .replace(/ó/g, 'o')
    .replace(/ú/g, 'u')
    .replace(/ñ/g, 'n');
}

function encontrarCoinicidencia(empleadoNombre, empleadoCorreo, usuarios) {
  const empleadoNormalizado = normalizarNombre(empleadoNombre);
  const palabrasEmpleado = empleadoNormalizado.split(/\s+/);

  let mejorCoincidencia = null;
  let mejorPuntuacion = -1;

  for (const usuario of usuarios) {
    const usuarioNormalizado = normalizarNombre(usuario.nombre);
    const palabrasUsuario = usuarioNormalizado.split(/\s+/);

    // Coincidir por correo primero (más confiable)
    if (usuario.correo.toLowerCase().includes(empleadoCorreo.split('@')[0].toLowerCase())) {
      return usuario;
    }

    // Contar palabras coincidentes
    let palabrasCoincidentes = 0;
    for (const palabra of palabrasEmpleado) {
      if (palabra.length > 2) {
        for (const palabraUsuario of palabrasUsuario) {
          if (levenshtein(palabra, palabraUsuario) <= 2) {
            palabrasCoincidentes++;
            break;
          }
        }
      }
    }

    const puntuacion = palabrasCoincidentes / Math.max(palabrasEmpleado.length, 1);

    if (puntuacion > mejorPuntuacion && puntuacion > 0.5) {
      mejorPuntuacion = puntuacion;
      mejorCoincidencia = usuario;
    }
  }

  return mejorCoincidencia;
}

async function sincronizarGerencias() {
  let connection;
  try {
    console.log('🔄 Conectando a base de datos...');
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });

    console.log('✓ Conectado\n');

    // Obtener todos los usuarios con gerencia
    console.log('🔄 Cargando usuarios con gerencias...');
    const [usuarios] = await connection.query(
      'SELECT correo, nombre, gerencia FROM usuarios WHERE gerencia IS NOT NULL AND gerencia != ""'
    );
    console.log(`  ✓ ${usuarios.length} usuarios con gerencia cargados\n`);

    // Procesar empleados
    console.log('🔄 Sincronizando gerencias a empleados...');
    const [empleados] = await connection.query(
      'SELECT id, correo, nombre, gerencia FROM empleados ORDER BY nombre'
    );

    let actualizados = 0;
    let noEncontrados = 0;
    const actualizacionesPendientes = [];

    for (const empleado of empleados) {
      const usuario = encontrarCoinicidencia(empleado.nombre, empleado.correo, usuarios);

      if (usuario && usuario.gerencia && usuario.gerencia !== empleado.gerencia) {
        actualizacionesPendientes.push({
          id: empleado.id,
          gerencia: usuario.gerencia,
          nombre: empleado.nombre
        });
        actualizados++;
      } else if (!usuario) {
        noEncontrados++;
      }
    }

    // Ejecutar actualizaciones
    console.log(`🔄 Aplicando ${actualizacionesPendientes.length} actualizaciones...\n`);
    for (const actualización of actualizacionesPendientes) {
      await connection.query(
        'UPDATE empleados SET gerencia = ? WHERE id = ?',
        [actualización.gerencia, actualización.id]
      );
      console.log(`  ✓ ${actualización.nombre}: ${actualización.gerencia}`);
    }

    console.log('\n📊 Resumen:');
    console.log(`  - Empleados actualizados: ${actualizados}`);
    console.log(`  - Empleados no encontrados: ${noEncontrados}`);

    // Mostrar distribución final
    console.log('\n📋 Distribución de gerencias en empleados:');
    const [distribucion] = await connection.query(`
      SELECT
        COALESCE(gerencia, 'Sin Gerencia') as gerencia,
        COUNT(*) as cantidad
      FROM empleados
      GROUP BY gerencia
      ORDER BY cantidad DESC
    `);

    distribucion.forEach(row => {
      console.log(`  - ${row.gerencia}: ${row.cantidad} empleado(s)`);
    });

    // Verificar cobertura
    const [conGerencia] = await connection.query(
      `SELECT COUNT(*) as total FROM empleados WHERE gerencia IS NOT NULL AND gerencia != '' AND gerencia != 'Sin Gerencia'`
    );
    const [total] = await connection.query('SELECT COUNT(*) as total FROM empleados');
    const cobertura = Math.round((conGerencia[0].total / total[0].total) * 100);
    console.log(`\n📈 Cobertura: ${cobertura}% (${conGerencia[0].total}/${total[0].total})`);

    console.log('\n✓ Sincronización completada');
    await connection.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (connection) await connection.end();
    process.exit(1);
  }
}

sincronizarGerencias();
