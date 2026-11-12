
const pool = require("../Database/conexion");

// ========================================
// BUSCAR USUARIO POR USERNAME
// ========================================

const buscarPorUsername = async (username) => {
  const result = await pool.query(
    `SELECT
      u.id_usuario,
      u.id_rol,
      u.username,
      u.password_hash,
      u.email,
      u.intentos_fallidos,
      u.estado,
      r.nombre_rol
    FROM usuarios u
    INNER JOIN roles r ON u.id_rol = r.id_rol
    WHERE u.username = $1`,
    [username]
  );

  return result.rows[0];
};

// ========================================
// BUSCAR USUARIO POR ID
// ========================================

const buscarPorId = async (id) => {
  const result = await pool.query(
    `SELECT
      u.id_usuario,
      u.id_rol,
      u.username,
      u.password_hash,
      u.email,
      u.estado,
      r.nombre_rol
    FROM usuarios u
    INNER JOIN roles r ON u.id_rol = r.id_rol
    WHERE u.id_usuario = $1`,
    [id]
  );

  return result.rows[0];
};

// ========================================
// LISTAR USUARIOS
// ========================================

const listarUsuarios = async () => {
  const result = await pool.query(
    `SELECT
      u.id_usuario,
      u.id_rol,
      u.username,
      u.email,
      u.estado,
      r.nombre_rol
    FROM usuarios u
    INNER JOIN roles r ON u.id_rol = r.id_rol
    ORDER BY u.id_usuario ASC`
  );

  return result.rows;
};

// ========================================
// CREAR USUARIO
// ========================================

const crearUsuario = async (datos) => {
  const { username, password_hash, email, id_rol } = datos;

  const result = await pool.query(
    `INSERT INTO usuarios
      (username, password_hash, email, id_rol,
       intentos_fallidos, estado)
     VALUES ($1, $2, $3, $4, 0, 'Activo')
     RETURNING id_usuario, username, email, id_rol, estado`,
    [username, password_hash, email, id_rol]
  );

  return result.rows[0];
};

// ========================================
// MODIFICAR USUARIO
// ========================================

const modificarUsuario = async (id, datos) => {
  const { username, email, id_rol } = datos;

  const result = await pool.query(
    `UPDATE usuarios
     SET username = $1,
         email = $2,
         id_rol = $3
     WHERE id_usuario = $4
     RETURNING id_usuario, username, email, id_rol, estado`,
    [username, email, id_rol, id]
  );

  return result.rows[0];
};

// ========================================
// CAMBIAR ESTADO
// ========================================

const cambiarEstado = async (id, estado) => {
  const result = await pool.query(
    `UPDATE usuarios
     SET estado = $1,
         intentos_fallidos = 0
     WHERE id_usuario = $2
     RETURNING id_usuario, estado`,
    [estado, id]
  );

  return result.rows[0];
};

// ========================================
// CAMBIAR CONTRASEÑA
// ========================================

const cambiarPassword = async (id, password_hash) => {
  const result = await pool.query(
    `UPDATE usuarios
     SET password_hash = $1,
         intentos_fallidos = 0
     WHERE id_usuario = $2
     RETURNING id_usuario`,
    [password_hash, id]
  );

  return result.rows[0];
};

module.exports = {
  buscarPorUsername,
  buscarPorId,
  listarUsuarios,
  crearUsuario,
  modificarUsuario,
  cambiarEstado,
  cambiarPassword
};
