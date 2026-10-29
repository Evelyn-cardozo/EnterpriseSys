
const pool = require("../Database/conexion");

// Listar todas las obras con el nombre del cliente
const listarObras = async () => {
  const resultado = await pool.query(`
    SELECT
      o.id_obra,
      o.id_cliente,
      c.nombre_razon_social AS nombre_cliente,
      o.nombre_obra,
      o.personal_responsable,
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
    personal_responsable,
    presupuesto_planificado,
    fecha_inicio,
    fecha_fin_prevista
  } = obra;

  const resultado = await pool.query(
    `INSERT INTO obras (
      id_cliente,
      nombre_obra,
      personal_responsable,
      presupuesto_planificado,
      costo_real_acumulado,
      porcentaje_avance,
      fecha_inicio,
      fecha_fin_prevista,
      estado
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`,
    [
      id_cliente,
      nombre_obra,
      personal_responsable,
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
    personal_responsable,
    presupuesto_planificado,
    fecha_inicio,
    fecha_fin_prevista
  } = obra;

  const resultado = await pool.query(
    `UPDATE obras
     SET id_cliente = $1,
         nombre_obra = $2,
         personal_responsable = $3,
         presupuesto_planificado = $4,
         fecha_inicio = $5,
         fecha_fin_prevista = $6
     WHERE id_obra = $7
     RETURNING *`,
    [
      id_cliente,
      nombre_obra,
      personal_responsable,
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

module.exports = {
  listarObras,
  buscarObraPorId,
  registrarObra,
  modificarObra,
  cambiarEstadoObra
};
