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
    [id],
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
    fecha_fin_prevista,
  } = obra;

  const resultado = await pool.query(
    `INSERT INTO obras (
      id_cliente,
      nombre_obra,
      presupuesto_planificado,
      fecha_inicio,
      fecha_fin_prevista,
      estado
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [
      id_cliente,
      nombre_obra,
      presupuesto_planificado,
      fecha_inicio,
      fecha_fin_prevista,
      "Planificada",
    ],
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
    fecha_fin_prevista,
  } = obra;

  const resultado = await pool.query(
    `UPDATE obras
     SET id_cliente = $1,
         nombre_obra = $2,
         presupuesto_planificado = $3,
         fecha_inicio = $4,
         fecha_fin_prevista = $5
     WHERE id_obra = $6
       AND LOWER(TRIM(estado)) NOT IN ('finalizada', 'cancelada')
     RETURNING *`,
    [
      id_cliente,
      nombre_obra,
      presupuesto_planificado,
      fecha_inicio,
      fecha_fin_prevista,
      id,
    ],
  );

  if (resultado.rows.length === 0) {
    const obraExistente = await pool.query(
      `SELECT estado
       FROM obras
       WHERE id_obra = $1`,
      [id],
    );

    if (obraExistente.rows.length === 0) {
      return null;
    }

    const error = new Error(
      "No se puede modificar una obra finalizada o cancelada.",
    );

    error.codigo = "OBRA_NO_MODIFICABLE";
    throw error;
  }

  return resultado.rows[0];
};

// Cambiar el estado de una obra
const cambiarEstadoObra = async (id, estado) => {
  const resultado = await pool.query(
    `UPDATE obras
     SET estado = $1
     WHERE id_obra = $2
     RETURNING *`,
    [estado, id],
  );

  return resultado.rows[0];
};

// ===============================
// TRABAJADORES
// ===============================

// Listar trabajadores asignados a una obra
const listarTrabajadoresPorObra = async (id_obra) => {
  const resultado = await pool.query(
    `SELECT
       p.id_personal,
       p.nombre_trabajador,
       p.cargo,
       p.telefono,
       p.gmail,
       p.direccion,
       op.id_obra_personal,
       op.fecha_asignacion,
       op.fecha_fin,
       op.estado AS estado_asignacion
     FROM obra_personal op
     INNER JOIN personales p
       ON p.id_personal = op.id_personal
     WHERE op.id_obra = $1
       AND op.estado = 'Activo'
     ORDER BY p.nombre_trabajador ASC`,
    [id_obra],
  );

  return resultado.rows;
};

// Listar TODOS los trabajadores registrados
const listarTodosLosTrabajadores = async () => {
  const resultado = await pool.query(`
    SELECT
      p.id_personal,
      p.nombre_trabajador,
      p.cargo,
      p.telefono,
      p.gmail,
      p.direccion,
      (
        SELECT COUNT(*)
        FROM obra_personal op
        WHERE op.id_personal = p.id_personal
          AND op.estado = 'Activo'
      ) AS obras_activas
    FROM personales p
    ORDER BY p.id_personal DESC
  `);

  return resultado.rows;
};

// Registrar trabajador sin asignarlo a una obra
const registrarTrabajador = async (trabajador) => {
  const { nombre_trabajador, cargo, telefono, gmail, direccion } = trabajador;

  const resultado = await pool.query(
    `INSERT INTO personales (
      nombre_trabajador,
      cargo,
      telefono,
      gmail,
      direccion
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
    [nombre_trabajador, cargo, telefono, gmail || null, direccion || null],
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
    [id],
  );

  return resultado.rows[0];
};

// Modificar datos personales
const modificarTrabajador = async (id, trabajador) => {
  const { nombre_trabajador, cargo, telefono, gmail, direccion } = trabajador;

  const resultado = await pool.query(
    `UPDATE personales
     SET nombre_trabajador = $1,
         cargo = $2,
         telefono = $3,
         gmail = $4,
         direccion = $5
     WHERE id_personal = $6
     RETURNING *`,
    [nombre_trabajador, cargo, telefono, gmail || null, direccion || null, id],
  );

  return resultado.rows[0];
};

// ===============================
// ASIGNACIONES DE TRABAJADORES
// ===============================

// Asignar un trabajador existente a una obra
const asignarTrabajadorAObra = async (id_obra, id_personal) => {
  // Comprobar que la obra exista y permita asignaciones
  const obra = await pool.query(
    `SELECT estado
     FROM obras
     WHERE id_obra = $1`,
    [id_obra],
  );

  if (obra.rows.length === 0) {
    throw new Error("La obra no existe.");
  }

  if (
    ["finalizada", "cancelada"].includes(
      obra.rows[0].estado.trim().toLowerCase(),
    )
  ) {
    throw new Error(
      "No se pueden asignar trabajadores a una obra finalizada o cancelada.",
    );
  }

  try {
    const resultado = await pool.query(
      `INSERT INTO obra_personal (
        id_obra,
        id_personal,
        estado
      )
      VALUES ($1, $2, 'Activo')
      RETURNING *`,
      [id_obra, id_personal],
    );

    return resultado.rows[0];
  } catch (error) {
    // El trabajador ya está asignado a esa obra
    if (error.code === "23505") {
      throw new Error("Este trabajador ya está asignado a esta obra.");
    }

    // El trabajador no existe
    if (error.code === "23503") {
      throw new Error("El trabajador o la obra indicada no existen.");
    }

    throw error;
  }
};

// ===============================
// ELIMINAR TRABAJADOR
// ===============================

// Solo permite eliminar trabajadores sin historial de asignaciones
const eliminarTrabajador = async (id) => {
  const resultado = await pool.query(
    `DELETE FROM personales p
     WHERE p.id_personal = $1
       AND NOT EXISTS (
         SELECT 1
         FROM obra_personal op
         WHERE op.id_personal = p.id_personal
       )
     RETURNING *`,
    [id],
  );

  return resultado.rows[0];
};

// ===============================
// EXPORTAR FUNCIONES
// ===============================

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
  eliminarTrabajador,

  asignarTrabajadorAObra,
};
