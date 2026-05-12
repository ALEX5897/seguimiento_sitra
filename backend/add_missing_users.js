require('dotenv').config();
const pool = require('./src/db');

async function addMissingUsers() {
  try {
    console.log('📥 Adding missing users to database...\n');

    const missingUsers = [
      { nombre: 'ALEX WADIMIR CASA CHANALUISA', correo: 'acasa@quito-turismo.gob.ec', cargo: 'FUNCIONARIO', gerencia: 'DIRECCIÓN ADMINISTRATIVA FINANCIERA' },
      { nombre: 'RUTH ELENA UTRERAS FUENTES', correo: 'rutreras@quito-turismo.gob.ec', cargo: 'FUNCIONARIO', gerencia: '' },
      { nombre: 'ANDERSON RICHARD CORREA AMORES', correo: 'acorrea@quito-turismo.gob.ec', cargo: 'FUNCIONARIO', gerencia: '' },
      { nombre: 'JORGE ENRIQUE SIGUENCIA GUILLÉN', correo: 'jsiguencia@quito-turismo.gob.ec', cargo: 'FUNCIONARIO', gerencia: '' },
      { nombre: 'SEBASTIÁN SEVILLA', correo: 'ssevilla@quito-turismo.gob.ec', cargo: 'FUNCIONARIO', gerencia: '' },
      { nombre: 'CARLOS EDUARDO PONCE VILLACIS', correo: 'cponce@quito-turismo.gob.ec', cargo: 'FUNCIONARIO', gerencia: '' },
      { nombre: 'SANTIAGO FERNANDO SANDOVAL GALLARDO', correo: 'ssandoval@quito-turismo.gob.ec', cargo: 'FUNCIONARIO', gerencia: '' },
      { nombre: 'PAULINA DE LOURDES RECALDE VELASCO', correo: 'precalde@quito-turismo.gob.ec', cargo: 'FUNCIONARIO', gerencia: '' },
      { nombre: 'ETZON ENRIQUE ROMO TORRES', correo: 'eromo@quito-turismo.gob.ec', cargo: 'FUNCIONARIO', gerencia: '' }
    ];

    let inserted = 0;
    const connection = await pool.getConnection();

    for (const user of missingUsers) {
      try {
        const [result] = await connection.query(
          'INSERT IGNORE INTO usuarios (nombre, correo, cargo, gerencia, estado) VALUES (?, ?, ?, ?, ?)',
          [user.nombre, user.correo, user.cargo, user.gerencia || null, 'activo']
        );

        if (result.affectedRows > 0) {
          inserted++;
          console.log(`✅ ${user.nombre}`);
        } else {
          console.log(`⊘ ${user.nombre} (ya existe)`);
        }
      } catch (err) {
        console.error(`❌ Error inserting ${user.nombre}:`, err.message);
      }
    }

    connection.release();

    // Show total
    const [total] = await pool.query('SELECT COUNT(*) as count FROM usuarios WHERE estado = "activo"');
    console.log(`\n✅ Added: ${inserted}`);
    console.log(`📊 Total active users: ${total[0].count}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addMissingUsers();
