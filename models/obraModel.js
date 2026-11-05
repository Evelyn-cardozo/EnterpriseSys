
const pool = require("../Database/conexion");

// ===============================
// OBRAS
// ===============================

// Listar todas las obras con el nombre del cliente
const listarObras = async () => {
  const resultado = await pool.query(`
    SELECT
      o.id_obra,
      o.id_cliente,
      c.nombre_razon_social AS nombre_cliente,
      o.nombre_obra,
      o.presupuesto_planificado,
      o.costo_real_acumulado,
      o.porcentaje_avance,
      o.fecha_inicio,
      o.fecha_fin_prevista,
      o.estado
    FROM obras o
    INNER JOIN clientes c
      ON o.id_cliente = c.id_cliente
    ORDER BY o.id_obra DESC
  `);

  return resultado.rows;
};

// Buscar una obra por su ID
const buscarObraPorId = async (id) => {
  const resultado = await pool.query(
    `SELECT *
     FROM obras
     WHERE id_obra = $1
     LIMIT 1`,
    [id]
  );

  return resultado.rows[0];
};

// Registrar una obra
const registrarObra = async (obra) => {
  const {
    id_cliente,
    nombre_obra,
    presupuesto_planificado,
    fecha_inicio,
    fecha_fin_prevista
  } = obra;

  const resultado = await pool.query(
    `INSERT INTO obras (
      id_cliente,
      nombre_obra,
      presupuesto_planificado,
      costo_real_acumulado,
      porcentaje_avance,
      fecha_inicio,
      fecha_fin_prevista,
      estado
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      id_cliente,
      nombre_obra,
      presupuesto_planificado,
      0,
      0,
      fecha_inicio,
      fecha_fin_prevista,
      "Planificada"
    ]
  );

  return resultado.rows[0];
};

// Modificar una obra
const modificarObra = async (id, obra) => {
  const {
    id_cliente,
    nombre_obra,
    presupuesto_planificado,
    fecha_inicio,
    fecha_fin_prevista
  } = obra;

  const resultado = await pool.query(
    `UPDATE obras
     SET id_cliente = $1,
         nombre_obra = $2,
         presupuesto_planificado = $3,
         fecha_inicio = $4,
         fecha_fin_prevista = $5
     WHERE id_obra = $6
     RETURNING *`,
    [
      id_cliente,
      nombre_obra,
      presupuesto_planificado,
      fecha_inicio,
      fecha_fin_prevista,
      id
    ]
  );

  return resultado.rows[0];
};

// Cambiar el estado de una obra
const cambiarEstadoObra = async (id, estado) => {
  const resultado = await pool.query(
    `UPDATE obras
     SET estado = $1
     WHERE id_obra = $2
     RETURNING *`,
    [estado, id]
  );

  return resultado.rows[0];
};


// ===============================
// TRABAJADORES DE LAS OBRAS
// ===============================

// Listar trabajadores de una obra
const listarTrabajadoresPorObra = async (id_obra) => {
  const resultado = await pool.query(
    `SELECT *
     FROM personales
     WHERE id_obra = $1
     ORDER BY nombre_trabajador ASC`,
    [id_obra]
  );

  return resultado.rows;
};

// Listar todos los trabajadores con su obra
const listarTodosLosTrabajadores = async () => {
  const resultado = await pool.query(`
    SELECT
      p.id_personal,
      p.id_obra,
      p.nombre_trabajador,
      p.cargo,
      p.telefono,
      p.gmail,
      p.direccion,
      o.nombre_obra
    FROM personales p
    INNER JOIN obras o
      ON p.id_obra = o.id_obra
    ORDER BY p.id_personal DESC
  `);

  return resultado.rows;
};

// Registrar trabajador
const registrarTrabajador = async (trabajador) => {
  const {
    id_obra,
    nombre_trabajador,
    cargo,
    telefono,
    gmail,
    direccion
  } = trabajador;

  const resultado = await pool.query(
    `INSERT INTO personales (
      id_obra,
      nombre_trabajador,
      cargo,
      telefono,
      gmail,
      direccion
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [
      id_obra,
      nombre_trabajador,
      cargo,
      telefono,
      gmail,
      direccion
    ]
  );

  return resultado.rows[0];
};

// Buscar trabajador por ID
const buscarTrabajadorPorId = async (id) => {
  const resultado = await pool.query(
    `SELECT *
     FROM personales
     WHERE id_personal = $1
     LIMIT 1`,
    [id]
  );

  return resultado.rows[0];
};

// Modificar trabajador
const modificarTrabajador = async (id, trabajador) => {
  const {
    id_obra,
    nombre_trabajador,
    cargo,
    telefono,
    gmail,
    direccion
  } = trabajador;

  const resultado = await pool.query(
    `UPDATE personales
     SET id_obra = $1,
         nombre_trabajador = $2,
         cargo = $3,
         telefono = $4,
         gmail = $5,
         direccion = $6
     WHERE id_personal = $7
     RETURNING *`,
    [
      id_obra,
      nombre_trabajador,
      cargo,
      telefono,
      gmail,
      direccion,
      id
    ]
  );

  return resultado.rows[0];
};

// Eliminar trabajador
const eliminarTrabajador = async (id) => {
  const resultado = await pool.query(
    `DELETE FROM personales
     WHERE id_personal = $1
     RETURNING *`,
    [id]
  );

  return resultado.rows[0];
};


module.exports = {
  listarObras,
  buscarObraPorId,
  registrarObra,
  modificarObra,
  cambiarEstadoObra,

  listarTrabajadoresPorObra,
  listarTodosLosTrabajadores,
  registrarTrabajador,
  buscarTrabajadorPorId,
  modificarTrabajador,
  eliminarTrabajador
};
