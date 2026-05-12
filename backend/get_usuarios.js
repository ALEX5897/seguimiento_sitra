const db = require('./src/db');

async function obtenerUsuarios() {
  try {
    const [usuarios] = await db.query(
      'SELECT id, nombre, correo FROM usuarios WHERE estado = "activo" ORDER BY nombre'
    );
    
    console.log('Usuarios registrados en la BD:\n');
    usuarios.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.nombre} (${user.correo})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

obtenerUsuarios();
