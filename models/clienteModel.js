const pool = require("../Database/conexion");

// Listar todos los clientes
const listarClientes = async () => {
  const resultado = await pool.query(`
        SELECT
            id_cliente,
            nombre_razon_social,
            ruc_ci,
            telefono,
            direccion,
            email,
            estado
        FROM clientes
        ORDER BY id_cliente DESC
    `);

  return resultado.rows;
};

// Buscar cliente por CI/RUC
const buscarPorRucCi = async (ruc_ci) => {
  const resultado = await pool.query(
    `SELECT id_cliente, ruc_ci
         FROM clientes
         WHERE ruc_ci = $1
         LIMIT 1`,
    [ruc_ci],
  );

  return resultado.rows[0];
};

// Registrar un cliente
const registrarCliente = async (cliente) => {
  const { nombre_razon_social, ruc_ci, telefono, direccion, email } = cliente;

  const resultado = await pool.query(
    `INSERT INTO clientes (
            nombre_razon_social,
            ruc_ci,
            telefono,
            direccion,
            email,
            estado
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
    [
      nombre_razon_social,
      ruc_ci,
      telefono || null,
      direccion || null,
      email || null,
      "Activo",
    ],
  );

  return resultado.rows[0];
};

// Buscar CI/RUC de otro cliente, excluyendo el cliente que se está modificando
const buscarPorRucCiExceptoId = async (ruc_ci, id) => {
  const resultado = await pool.query(
    `SELECT id_cliente, ruc_ci
         FROM clientes
         WHERE ruc_ci = $1 AND id_cliente <> $2
         LIMIT 1`,
    [ruc_ci, id],
  );

  return resultado.rows[0];
};

// Modificar los datos de un cliente
const modificarCliente = async (id, cliente) => {
  const { nombre_razon_social, ruc_ci, telefono, direccion, email } = cliente;

  const resultado = await pool.query(
    `UPDATE clientes
         SET nombre_razon_social = $1,
             ruc_ci = $2,
             telefono = $3,
             direccion = $4,
             email = $5
         WHERE id_cliente = $6
         RETURNING *`,
    [
      nombre_razon_social,
      ruc_ci,
      telefono || null,
      direccion || null,
      email || null,
      id,
    ],
  );

  return resultado.rows[0];
};

// Cambiar el estado de un cliente
const cambiarEstadoCliente = async (id, estado) => {
  const resultado = await pool.query(
    `UPDATE clientes
         SET estado = $1
         WHERE id_cliente = $2
         RETURNING *`,
    [estado, id],
  );

  return resultado.rows[0];
};

module.exports = {
  listarClientes,
  buscarPorRucCi,
  registrarCliente,
  cambiarEstadoCliente,
  buscarPorRucCiExceptoId,
  modificarCliente,
};
