const pool = require("../Database/conexion.js");

// ========================================
// RESUMEN DEL PANEL SEGÚN EL ROL
// ========================================

const obtenerResumen = async (idRol, idUsuario) => {
  // GERENTE
  if (Number(idRol) === 1) {
    const resultado = await pool.query(`
      SELECT
        (SELECT COUNT(*)::integer
         FROM clientes) AS total_clientes,

        (SELECT COUNT(*)::integer
         FROM obras
         WHERE estado = 'En ejecución') AS obras_en_ejecucion,

        (SELECT COUNT(*)::integer
         FROM materiales
         WHERE stock_actual <= stock_minimo) AS stock_bajo,

        (SELECT COUNT(*)::integer
         FROM materiales
         WHERE stock_actual = 0) AS materiales_agotados,

        (SELECT COUNT(*)::integer
         FROM solicitudes_materiales
         WHERE estado = 'Pendiente') AS solicitudes_pendientes
    `);

    return resultado.rows[0];
  }

  // JEFE DE OBRA
  if (Number(idRol) === 2) {
    const resultado = await pool.query(
      `
      SELECT
        COUNT(*)::integer AS total_solicitudes,

        COUNT(*) FILTER (
          WHERE estado = 'Pendiente'
        )::integer AS solicitudes_pendientes,

        COUNT(*) FILTER (
          WHERE estado = 'Aprobada'
        )::integer AS solicitudes_aprobadas,

        COUNT(*) FILTER (
          WHERE estado = 'Rechazada'
        )::integer AS solicitudes_rechazadas,

        COUNT(*) FILTER (
          WHERE estado = 'Entregada'
        )::integer AS solicitudes_entregadas

      FROM solicitudes_materiales
      WHERE id_usuario_solicitante = $1
    `,
      [idUsuario],
    );

    return resultado.rows[0];
  }

  // ENCARGADO DE INVENTARIO
  if (Number(idRol) === 3) {
    const resultado = await pool.query(`
      SELECT
        (SELECT COUNT(*)::integer
         FROM materiales) AS total_materiales,

        (SELECT COUNT(*)::integer
         FROM materiales
         WHERE stock_actual <= stock_minimo) AS stock_bajo,

        (SELECT COUNT(*)::integer
         FROM materiales
         WHERE stock_actual = 0) AS materiales_agotados,

        (SELECT COUNT(*)::integer
         FROM solicitudes_materiales
         WHERE estado = 'Pendiente') AS solicitudes_pendientes
    `);

    return resultado.rows[0];
  }

  throw new Error("Rol de usuario no válido");
};

// ========================================
// ACTIVIDADES RECIENTES
// ========================================

const listarActividades = async (idRol, idUsuario) => {
  // El jefe solamente consulta sus propias solicitudes.
  if (Number(idRol) === 2) {
    const resultado = await pool.query(
      `
      SELECT
        'Solicitud' AS tipo,
        s.id_solicitud AS id_referencia,
        CONCAT(
          'Solicitud #',
          s.id_solicitud,
          ' - ',
          o.nombre_obra
        ) AS descripcion,
        s.estado AS detalle,
        s.fecha_solicitud AS fecha,
        u.username AS usuario

      FROM solicitudes_materiales s

      INNER JOIN obras o
        ON s.id_obra = o.id_obra

      INNER JOIN usuarios u
        ON s.id_usuario_solicitante = u.id_usuario

      WHERE s.id_usuario_solicitante = $1

      ORDER BY s.fecha_solicitud DESC
      LIMIT 8
    `,
      [idUsuario],
    );

    return resultado.rows;
  }

  // Gerente y encargado: solicitudes y movimientos.
  const resultado = await pool.query(`
    SELECT *
    FROM (
      SELECT
        'Solicitud' AS tipo,
        s.id_solicitud AS id_referencia,
        CONCAT(
          'Solicitud #',
          s.id_solicitud,
          ' - ',
          o.nombre_obra
        ) AS descripcion,
        s.estado AS detalle,
        s.fecha_solicitud AS fecha,
        u.username AS usuario

      FROM solicitudes_materiales s

      INNER JOIN obras o
        ON s.id_obra = o.id_obra

      INNER JOIN usuarios u
        ON s.id_usuario_solicitante = u.id_usuario

      UNION ALL

      SELECT
        'Movimiento' AS tipo,
        mi.id_movimiento AS id_referencia,
        CONCAT(
          mi.tipo_movimiento,
          ' de ',
          mi.cantidad,
          ' ',
          m.nombre
        ) AS descripcion,
        COALESCE(o.nombre_obra, 'Sin obra') AS detalle,
        mi.fecha_movimiento AS fecha,
        u.username AS usuario

      FROM movimientos_inventario mi

      INNER JOIN materiales m
        ON mi.id_material = m.id_material

      INNER JOIN usuarios u
        ON mi.id_usuario = u.id_usuario

      LEFT JOIN obras o
        ON mi.id_obra = o.id_obra
    ) AS actividades

    ORDER BY fecha DESC
    LIMIT 8
  `);

  return resultado.rows;
};

module.exports = {
  obtenerResumen,
  listarActividades,
};
