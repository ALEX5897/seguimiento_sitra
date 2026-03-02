/**
 * userHelper.js - Funciones auxiliares para usuarios
 * Contiene funciones para obtener datos de usuario por diferentes criterios
 */

const db = require('../db');

/**
 * Obtener usuario completo por nombre
 * @param {String} nombre - Nombre exacto del usuario
 * @returns {Object|null} Datos del usuario o null
 */
async function obtenerUsuarioPorNombre(nombre) {
  if (!nombre || !nombre.trim()) {
    return null;
  }

  try {
    const [rows] = await db.query(
      'SELECT id, nombre, correo, cargo, gerencia, telefono, estado FROM usuarios WHERE LOWER(nombre) = LOWER(?) AND estado = "activo"',
      [nombre.trim()]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error obtenerUsuarioPorNombre:', error.message);
    return null;
  }
}

/**
 * Obtener usuario por ID
 * @param {Number} usuarioId - ID del usuario
 * @returns {Object|null} Datos del usuario o null
 */
async function obtenerUsuarioPorId(usuarioId) {
  if (!usuarioId) {
    return null;
  }

  try {
    const [rows] = await db.query(
      'SELECT id, nombre, correo, cargo, gerencia, telefono, estado FROM usuarios WHERE id = ? AND estado = "activo"',
      [usuarioId]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error obtenerUsuarioPorId:', error.message);
    return null;
  }
}

/**
 * Obtener user_id por nombre (retorna solo el ID)
 * @param {String} nombre - Nombre del usuario
 * @returns {Number|null} ID del usuario o null
 */
async function obtenerUserIdPorNombre(nombre) {
  const usuario = await obtenerUsuarioPorNombre(nombre);
  return usuario ? usuario.id : null;
}

/**
 * Obtener correo por nombre de usuario
 * @param {String} nombre - Nombre del usuario
 * @returns {String|null} Correo del usuario o null
 */
async function obtenerCorreoPorNombre(nombre) {
  const usuario = await obtenerUsuarioPorNombre(nombre);
  return usuario ? usuario.correo : null;
}

/**
 * Validar que usuario existe y está activo
 * @param {String|Number} identificador - Nombre o ID del usuario
 * @returns {Boolean}
 */
async function validarUsuario(identificador) {
  if (typeof identificador === 'number') {
    return (await obtenerUsuarioPorId(identificador)) !== null;
  }
  return (await obtenerUsuarioPorNombre(identificador)) !== null;
}

/**
 * Obtener todos los usuarios activos agrupados por gerencia
 * @returns {Object} Usuarios agrupados por gerencia
 */
async function obtenerUsuariosPorGerencia() {
  try {
    const [rows] = await db.query(
      'SELECT id, nombre, cargo, gerencia, correo FROM usuarios WHERE estado = "activo" ORDER BY gerencia ASC, nombre ASC'
    );

    const agrupados = {};
    rows.forEach(user => {
      const gerencia = user.gerencia || 'Sin Gerencia';
      if (!agrupados[gerencia]) {
        agrupados[gerencia] = [];
      }
      agrupados[gerencia].push(user);
    });

    return agrupados;
  } catch (error) {
    console.error('Error obtenerUsuariosPorGerencia:', error.message);
    return {};
  }
}

/**
 * Buscar usuarios por término (autocompletado)
 * @param {String} termino - Término de búsqueda
 * @param {Number} limite - Número máximo de resultados
 * @returns {Array} Array de usuarios que coinciden
 */
async function buscarUsuarios(termino, limite = 10) {
  if (!termino || termino.trim().length < 2) {
    return [];
  }

  try {
    const [rows] = await db.query(
      'SELECT id, nombre, cargo, gerencia, correo FROM usuarios WHERE LOWER(nombre) LIKE LOWER(?) AND estado = "activo" ORDER BY nombre ASC LIMIT ?',
      [`%${termino}%`, limite]
    );
    return rows;
  } catch (error) {
    console.error('Error buscarUsuarios:', error.message);
    return [];
  }
}

module.exports = {
  obtenerUsuarioPorNombre,
  obtenerUsuarioPorId,
  obtenerUserIdPorNombre,
  obtenerCorreoPorNombre,
  validarUsuario,
  obtenerUsuariosPorGerencia,
  buscarUsuarios
};
