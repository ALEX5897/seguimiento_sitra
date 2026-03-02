async function testLogin() {
  const baseURL = 'http://localhost:3000';
  
  let sessionCookie = null;

  try {
    console.log('🧪 Test 1: Login como Admin\n');
    
    // 1. Login
    const loginRes = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        correo: 'admin@empresa.com'
      })
    });
    
    const loginData = await loginRes.json();
    
    console.log('✅ Login exitoso:');
    console.log('   Usuario:', loginData.usuario.correo);
    console.log('   Rol:', loginData.usuario.rol);
    console.log('   ID:', loginData.usuario.id);
    
    // Obtener cookie de la respuesta
    const setCookie = loginRes.headers.get('set-cookie');
    if (setCookie) {
      sessionCookie = setCookie.split(';')[0];
      console.log('\n📋 Cookie recibida:', sessionCookie.substring(0, 30) + '...');
    }
    
    // 2. Verificar sesión
    console.log('\n🧪 Test 2: Verificar sesión\n');
    const sessionRes = await fetch(`${baseURL}/api/auth/usuario`, {
      headers: sessionCookie ? { 'Cookie': sessionCookie } : {},
      credentials: 'include'
    });
    
    if (sessionRes.ok) {
      const sessionData = await sessionRes.json();
      console.log('✅ Sesión verificada:');
      console.log('   Usuario:', sessionData.usuario.correo);
      console.log('   Rol:', sessionData.usuario.rol);
    } else {
      console.log('❌ Sesión NO verificada:', sessionRes.status);
    }
    
    // 3. Obtener reasignados
    console.log('\n🧪 Test 3: Obtener reasignados\n');
    const reasignadosRes = await fetch(`${baseURL}/api/reasignados`, {
      headers: sessionCookie ? { 'Cookie': sessionCookie } : {},
      credentials: 'include'
    });
    
    let reasignadosData = [];
    if (reasignadosRes.ok) {
      reasignadosData = await reasignadosRes.json();
      console.log('✅ Reasignados obtenidos:', reasignadosData.length);
      if (reasignadosData.length > 0) {
        console.log('   Primeros 3:');
        reasignadosData.slice(0, 3).forEach(doc => {
          console.log(`   - ${doc.numero_documento}: ${doc.reasignado_a}`);
        });
      }
    } else {
      console.log('❌ Error obteniendo reasignados:', reasignadosRes.status);
      const errorData = await reasignadosRes.json();
      console.log('   Error:', errorData);
    }
    
    // 4. Obtener tareas
    console.log('\n🧪 Test 4: Obtener tareas\n');
    const tareasRes = await fetch(`${baseURL}/api/tareas`, {
      headers: sessionCookie ? { 'Cookie': sessionCookie } : {},
      credentials: 'include'
    });
    
    let tareasData = [];
    if (tareasRes.ok) {
      tareasData = await tareasRes.json();
      console.log('✅ Tareas obtenidas:', tareasData.length);
    } else {
      console.log('❌ Error obteniendo tareas:', tareasRes.status);
    }
    
    // 5. Obtener enviados
    console.log('\n🧪 Test 5: Obtener enviados\n');
    const enviadosRes = await fetch(`${baseURL}/api/enviados`, {
      headers: sessionCookie ? { 'Cookie': sessionCookie } : {},
      credentials: 'include'
    });
    
    let enviadosData = [];
    if (enviadosRes.ok) {
      enviadosData = await enviadosRes.json();
      console.log('✅ Enviados obtenidos:', enviadosData.length);
      
      console.log('\n---------------------');
      console.log('✅ RESUMEN - Admin:');
      console.log(`   Reasignados: ${reasignadosData.length}/10`);
      console.log(`   Tareas: ${tareasData.length}/10`);
      console.log(`   Enviados: ${enviadosData.length}/10`);
      console.log('---------------------\n');
    } else {
      console.log('❌ Error obteniendo enviados:', enviadosRes.status);
    }
    
  } catch (error) {
    console.error('❌ Error en el test:', error.message);
  }
}

testLogin();
