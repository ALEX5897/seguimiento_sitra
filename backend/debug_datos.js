const mysql = require('mysql2/promise');

async function debugDatos() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'seguimiento_v2'
  });

  console.log('🔍 Analizando datos en la base de datos...\n');

  try {
    // 1. Usuarios en usuarios_auth
    console.log('1️⃣ Usuarios en usuarios_auth (para login):');
    const [authUsers] = await connection.query(
      `SELECT ua.id, ua.correo, ua.nombre, r.nombre as rol
       FROM usuarios_auth ua
       LEFT JOIN roles r ON ua.rol_id = r.id
       ORDER BY ua.id`
    );
    console.table(authUsers);

    // 2. Usuarios en usuarios (tabla de negocio)
    console.log('\n2️⃣ Usuarios en tabla usuarios (negocio):');
    const [businessUsers] = await connection.query(
      'SELECT id, nombre, correo, gerencia FROM usuarios ORDER BY id'
    );
    console.table(businessUsers);

    // 3. Documentos reasignados
    console.log('\n3️⃣ Documentos reasignados:');
    const [reasignados] = await connection.query(
      `SELECT id, numero_documento, usuario_id, reasignado_a, estado 
       FROM reasignados 
       ORDER BY id 
       LIMIT 10`
    );
    console.table(reasignados);

    // 4. Tareas
    console.log('\n4️⃣ Tareas:');
    const [tareas] = await connection.query(
      `SELECT id, numero_documento, usuario_id, asignado_para, estado 
       FROM tareas 
       ORDER BY id 
       LIMIT 10`
    );
    console.table(tareas);

    // 5. Enviados
    console.log('\n5️⃣ Enviados:');
    const [enviados] = await connection.query(
      `SELECT id, numero_documento, usuario_id, para, estado 
       FROM enviados 
       ORDER BY id 
       LIMIT 10`
    );
    console.table(enviados);

    // 6. Verificar coincidencias de correos
    console.log('\n6️⃣ Análisis de coincidencias de correos:');
    const [coincidencias] = await connection.query(
      `SELECT 
        ua.correo as correo_auth,
        u.correo as correo_usuarios,
        ua.id as id_auth,
        u.id as id_usuarios,
        CASE WHEN ua.correo = u.correo THEN '✅ MATCH' ELSE '❌ NO MATCH' END as coincide
       FROM usuarios_auth ua
       LEFT JOIN usuarios u ON ua.correo = u.correo
       ORDER BY ua.id`
    );
    console.table(coincidencias);

    // 7. Contar documentos por usuario_id
    console.log('\n7️⃣ Cantidad de documentos por usuario_id:');
    const [docsCount] = await connection.query(
      `SELECT 
        u.id,
        u.nombre,
        u.correo,
        (SELECT COUNT(*) FROM reasignados WHERE usuario_id = u.id) as reasignados,
        (SELECT COUNT(*) FROM tareas WHERE usuario_id = u.id) as tareas,
        (SELECT COUNT(*) FROM enviados WHERE usuario_id = u.id) as enviados
       FROM usuarios u
       ORDER BY u.id`
    );
    console.table(docsCount);

    console.log('\n✅ Análisis completado');

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await connection.end();
  }
}

debugDatos().catch(console.error);
