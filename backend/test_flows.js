const http = require('http');

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function testFlowReasignados() {
  console.log('\n📄 TEST FLUJO REASIGNADOS');
  console.log('=' .repeat(50));
  
  const newRecord = {
    numero_documento: 'TEST-REASIGNADOS-001',
    tipo_documento: 'Memorando Test',
    numero_tramite: 'TRAM-TEST-001',
    fecha_documento: new Date().toISOString(),
    fecha_reasignacion: new Date().toISOString(),
    fecha_max_respuesta: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    reasignado_a: 'Juan Pérez',
    usuario_id: 1,
    estado: 'pendiente',
    asunto: 'Prueba de flujo - Reasignados',
    remitente: 'Sistema Test',
    destinatario: 'Juan Pérez'
  };

  try {
    // CREATE
    console.log('1️⃣  Creando nuevo reasignado...');
    const createRes = await makeRequest('POST', '/api/reasignados', newRecord);
    if (createRes.status === 201 || createRes.status === 200) {
      console.log('   ✅ Creado exitosamente');
      const recordId = createRes.data.id || createRes.data.insertId;
      
      // READ
      console.log(`2️⃣  Leyendo registro (ID: ${recordId})...`);
      const readRes = await makeRequest('GET', `/api/reasignados/${recordId}`);
      if (readRes.status === 200) {
        console.log('   ✅ Lectura exitosa');
        console.log(`   📋 Datos: ${readRes.data.numero_documento} → ${readRes.data.usuario_id}`);
      }

      // UPDATE
      console.log('3️⃣  Actualizando estado...');
      const updateData = { ...newRecord, estado: 'en_tramite' };
      const updateRes = await makeRequest('PUT', `/api/reasignados/${recordId}`, updateData);
      if (updateRes.status === 200 || updateRes.status === 204) {
        console.log('   ✅ Actualización exitosa');
      }

      // DELETE
      console.log('4️⃣  Eliminando registro de prueba...');
      const deleteRes = await makeRequest('DELETE', `/api/reasignados/${recordId}`);
      if (deleteRes.status === 200 || deleteRes.status === 204) {
        console.log('   ✅ Eliminación exitosa');
      }
    } else {
      console.log(`   ❌ Error: ${createRes.status}`);
    }
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
  }
}

async function testFlowTareas() {
  console.log('\n✅ TEST FLUJO TAREAS');
  console.log('=' .repeat(50));
  
  const newRecord = {
    numero_documento: 'TEST-TAREAS-001',
    fecha_documento: new Date().toISOString(),
    fecha_asignacion: new Date().toISOString(),
    asignado_para: 'María García',
    usuario_id: 2,
    descripcion: 'Prueba de flujo - Tareas',
    fecha_maxima: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    avance: '25',
    estado: 'en_proceso',
    nro_dias: 3
  };

  try {
    // CREATE
    console.log('1️⃣  Creando nueva tarea...');
    const createRes = await makeRequest('POST', '/api/tareas', newRecord);
    if (createRes.status === 201 || createRes.status === 200) {
      console.log('   ✅ Creada exitosamente');
      const recordId = createRes.data.id || createRes.data.insertId;
      
      // READ
      console.log(`2️⃣  Leyendo registro (ID: ${recordId})...`);
      const readRes = await makeRequest('GET', `/api/tareas/${recordId}`);
      if (readRes.status === 200) {
        console.log('   ✅ Lectura exitosa');
        console.log(`   📋 Datos: ${readRes.data.numero_documento} → ${readRes.data.usuario_id}`);
      }

      // UPDATE
      console.log('3️⃣  Actualizando avance...');
      const updateData = { ...newRecord, avance: '75' };
      const updateRes = await makeRequest('PUT', `/api/tareas/${recordId}`, updateData);
      if (updateRes.status === 200 || updateRes.status === 204) {
        console.log('   ✅ Actualización exitosa');
      }

      // DELETE
      console.log('4️⃣  Eliminando registro de prueba...');
      const deleteRes = await makeRequest('DELETE', `/api/tareas/${recordId}`);
      if (deleteRes.status === 200 || deleteRes.status === 204) {
        console.log('   ✅ Eliminación exitosa');
      }
    } else {
      console.log(`   ❌ Error: ${createRes.status}`);
    }
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
  }
}

async function testFlowEnviados() {
  console.log('\n📮 TEST FLUJO ENVIADOS');
  console.log('=' .repeat(50));
  
  const newRecord = {
    numero_documento: 'TEST-ENVIADOS-001',
    remitente: 'Sistema Test',
    para: 'Carlos López',
    usuario_id: 3,
    asunto: 'Prueba de flujo - Enviados',
    fecha_documento: new Date().toISOString(),
    no_referencia: 'REF-TEST-001',
    tipo_documento: 'Contrato Test',
    nro_tramite: 'TRAM-TEST-001',
    estado: 'enviado'
  };

  try {
    // CREATE
    console.log('1️⃣  Creando nuevo enviado...');
    const createRes = await makeRequest('POST', '/api/enviados', newRecord);
    if (createRes.status === 201 || createRes.status === 200) {
      console.log('   ✅ Creado exitosamente');
      const recordId = createRes.data.id || createRes.data.insertId;
      
      // READ
      console.log(`2️⃣  Leyendo registro (ID: ${recordId})...`);
      const readRes = await makeRequest('GET', `/api/enviados/${recordId}`);
      if (readRes.status === 200) {
        console.log('   ✅ Lectura exitosa');
        console.log(`   📋 Datos: ${readRes.data.numero_documento} → ${readRes.data.usuario_id}`);
      }

      // UPDATE
      console.log('3️⃣  Actualizando estado...');
      const updateData = { ...newRecord, estado: 'recibido' };
      const updateRes = await makeRequest('PUT', `/api/enviados/${recordId}`, updateData);
      if (updateRes.status === 200 || updateRes.status === 204) {
        console.log('   ✅ Actualización exitosa');
      }

      // DELETE
      console.log('4️⃣  Eliminando registro de prueba...');
      const deleteRes = await makeRequest('DELETE', `/api/enviados/${recordId}`);
      if (deleteRes.status === 200 || deleteRes.status === 204) {
        console.log('   ✅ Eliminación exitosa');
      }
    } else {
      console.log(`   ❌ Error: ${createRes.status}`);
    }
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
  }
}

async function testUsuarioSelector() {
  console.log('\n🎯 TEST USUARIO SELECTOR');
  console.log('=' .repeat(50));
  
  try {
    console.log('1️⃣  Obteniendo lista de usuarios activos...');
    const listRes = await makeRequest('GET', '/api/usuarios/activos/lista');
    if (listRes.status === 200) {
      console.log(`   ✅ Usuarios disponibles: ${listRes.data.length}`);
      listRes.data.forEach((u, i) => {
        console.log(`   • ${u.nombre} (${u.cargo}) - ${u.gerencia}`);
      });
    }

    console.log('\n2️⃣  Buscando usuario "juan"...');
    const searchRes = await makeRequest('GET', '/api/usuarios/buscar/juan');
    if (searchRes.status === 200) {
      console.log(`   ✅ Resultados encontrados: ${searchRes.data.length}`);
      searchRes.data.forEach(u => {
        console.log(`   • ${u.nombre} - ${u.correo}`);
      });
    }

    console.log('\n3️⃣  Todos los usuarios disponibles para selector:');
    const allRes = await makeRequest('GET', '/api/usuarios');
    if (allRes.status === 200) {
      console.log(`   ✅ Total: ${allRes.data.length} usuarios`);
      allRes.data.slice(0, 3).forEach(u => {
        console.log(`   • ID ${u.id}: ${u.nombre}`);
      });
    }
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
  }
}

(async () => {
  console.log('🚀 PRUEBA COMPLETA DE FLUJOS');
  console.log('════════════════════════════════════════════════════\n');

  await testUsuarioSelector();
  await testFlowReasignados();
  await testFlowTareas();
  await testFlowEnviados();

  console.log('\n════════════════════════════════════════════════════');
  console.log('✅ PRUEBAS COMPLETADAS');
  console.log('════════════════════════════════════════════════════\n');
  process.exit(0);
})();
