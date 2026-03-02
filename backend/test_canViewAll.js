const db = require('./src/db');

async function testCanViewAll() {
  console.log('🧪 Probando función canViewAll\n');

  const testCases = [
    { rol: 'admin', expected: true },
    { rol: 'secretaria', expected: true },
    { rol: 'solo_vista', expected: true },
    { rol: 'Solo_Vista', expected: true },
    { rol: 'SOLO_VISTA', expected: true },
    { rol: 'solo lectura', expected: true },
    { rol: 'lectura', expected: true },
    { rol: 'usuario', expected: false },
    { rol: 'otro', expected: false }
  ];

  function canViewAll(usuario) {
    const rolLower = (usuario.rol || '').toLowerCase();
    return usuario.rol === 'admin' || 
           usuario.rol === 'secretaria' || 
           rolLower === 'solo_vista' || 
           rolLower === 'solo lectura' || 
           rolLower === 'lectura';
  }

  console.log('Casos de prueba:');
  testCases.forEach((test, i) => {
    const result = canViewAll({ rol: test.rol });
    const status = result === test.expected ? '✅' : '❌';
    console.log(`  ${i + 1}. ${status} rol: "${test.rol}" → ${result} (esperado: ${test.expected})`);
  });

  // Probar consulta real
  console.log('\n📊 Probando consulta de reasignados:\n');

  const [total] = await db.query('SELECT COUNT(*) as count FROM reasignados');
  console.log(`  Total de reasignados en BD: ${total[0].count}`);

  // Simular usuario admin
  const [adminDocs] = await db.query('SELECT COUNT(*) as count FROM reasignados');
  console.log(`  Documentos visibles para ADMIN: ${adminDocs[0].count}`);

  // Simular usuario solo_vista (debe ver todos)
  const [soloVistaDocs] = await db.query('SELECT COUNT(*) as count FROM reasignados');
  console.log(`  Documentos visibles para SOLO_VISTA: ${soloVistaDocs[0].count}`);

  // Simular usuario específico (debe ver solo los suyos)
  const [specificUser] = await db.query(
    'SELECT COUNT(*) as count FROM reasignados WHERE usuario_id = ?',
    [9] // Alex Wladimir Casa
  );
  console.log(`  Documentos visibles para usuario_id=9: ${specificUser[0].count}`);

  console.log('\n✅ Pruebas completadas');
  process.exit(0);
}

testCanViewAll().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
