const pool = require("../Database/conexion.js");

// ========================================
// MATERIALES
// ========================================

// Listar todos los materiales
const listarMateriales = async () => {
  const resultado = await pool.query(`
    SELECT
      id_material,
      nombre,
      descripcion,
      precio_actual,
      stock_actual,
      stock_minimo,
      ubicacion_fisica
    FROM materiales
    ORDER BY nombre ASC
  `);

  return resultado.rows;
};

// Buscar un material por su ID
const buscarMaterialPorId = async (id) => {
  const resultado = await pool.query(
    `SELECT *
     FROM materiales
     WHERE id_material = $1
     LIMIT 1`,
    [id],
  );

  return resultado.rows[0];
};

// Registrar un material
const registrarMaterial = async (material) => {
  const {
    nombre,
    descripcion,
    precio_actual,
    stock_actual = 0,
    stock_minimo = 5,
    ubicacion_fisica,
  } = material;

  const resultado = await pool.query(
    `INSERT INTO materiales (
      nombre,
      descripcion,
      precio_actual,
      stock_actual,
      stock_minimo,
      ubicacion_fisica
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *`,
    [
      nombre,
      descripcion || null,
      precio_actual,
      stock_actual,
      stock_minimo,
      ubicacion_fisica || null,
    ],
  );

  return resultado.rows[0];
};

// Modificar un material sin alterar directamente el stock
const modificarMaterial = async (id, material) => {
  const camposPermitidos = {
    nombre: "nombre",
    descripcion: "descripcion",
    precio_actual: "precio_actual",
    stock_minimo: "stock_minimo",
    ubicacion_fisica: "ubicacion_fisica",
  };

  const campos = Object.keys(material).filter(
    (campo) => camposPermitidos[campo],
  );

  if (campos.length === 0) {
    throw new Error("No hay datos válidos para modificar");
  }

  const valores = [];
  const asignaciones = campos.map((campo, indice) => {
    valores.push(material[campo] ?? null);
    return `${camposPermitidos[campo]} = $${indice + 1}`;
  });

  valores.push(id);

  const resultado = await pool.query(
    `UPDATE materiales
     SET ${asignaciones.join(", ")}
     WHERE id_material = $${valores.length}
     RETURNING *`,
    valores,
  );

  return resultado.rows[0];
};

// Consultar materiales con stock bajo
const listarMaterialesStockBajo = async () => {
  const resultado = await pool.query(`
    SELECT
      id_material,
      nombre,
      stock_actual,
      stock_minimo
    FROM materiales
    WHERE stock_actual <= stock_minimo
    ORDER BY stock_actual ASC, nombre ASC
  `);

  return resultado.rows;
};

// ========================================
// OBRAS DISPONIBLES PARA MOVIMIENTOS
// ========================================

const listarObrasDisponibles = async () => {
  const resultado = await pool.query(`
    SELECT
      id_obra,
      nombre_obra
    FROM obras
    ORDER BY nombre_obra ASC
  `);

  return resultado.rows;
};

// ========================================
// MOVIMIENTOS DE INVENTARIO
// ========================================

// Registrar una entrada o salida y actualizar el stock
const registrarMovimiento = async (movimiento) => {
  const {
    id_material,
    id_usuario,
    id_obra,
    tipo_movimiento,
    cantidad,
    motivo,
  } = movimiento;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (!Number.isInteger(Number(cantidad)) || Number(cantidad) <= 0) {
      throw new Error("La cantidad debe ser un entero positivo");
    }

    if (!["Entrada", "Salida"].includes(tipo_movimiento)) {
      throw new Error("El tipo de movimiento no es válido");
    }

    // Bloquear el material para evitar modificaciones simultáneas
    const material = await client.query(
      `SELECT stock_actual
       FROM materiales
       WHERE id_material = $1
       FOR UPDATE`,
      [id_material],
    );

    if (material.rowCount === 0) {
      throw new Error("El material no existe");
    }

    const stockActual = Number(material.rows[0].stock_actual);
    const cantidadMovimiento = Number(cantidad);

    let nuevoStock;

    if (tipo_movimiento === "Entrada") {
      nuevoStock = stockActual + cantidadMovimiento;
    } else {
      if (cantidadMovimiento > stockActual) {
        throw new Error("No hay stock suficiente para realizar la salida");
      }

      nuevoStock = stockActual - cantidadMovimiento;
    }

    // Actualizar stock
    await client.query(
      `UPDATE materiales
       SET stock_actual = $1
       WHERE id_material = $2`,
      [nuevoStock, id_material],
    );

    // Registrar movimiento
    const resultado = await client.query(
      `INSERT INTO movimientos_inventario (
        id_material,
        id_usuario,
        id_obra,
        tipo_movimiento,
        cantidad,
        motivo
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        id_material,
        id_usuario,
        id_obra || null,
        tipo_movimiento,
        cantidadMovimiento,
        motivo || null,
      ],
    );

    await client.query("COMMIT");

    return resultado.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// Consultar el historial de movimientos
const listarMovimientos = async () => {
  const resultado = await pool.query(`
    SELECT
      mi.id_movimiento,
      mi.id_material,
      m.nombre AS nombre_material,
      mi.id_usuario,
      u.username AS usuario,
      mi.id_obra,
      o.nombre_obra,
      mi.tipo_movimiento,
      mi.cantidad,
      mi.fecha_movimiento,
      mi.motivo
    FROM movimientos_inventario mi
    INNER JOIN materiales m
      ON mi.id_material = m.id_material
    INNER JOIN usuarios u
      ON mi.id_usuario = u.id_usuario
    LEFT JOIN obras o
      ON mi.id_obra = o.id_obra
    ORDER BY mi.fecha_movimiento DESC, mi.id_movimiento DESC
  `);

  return resultado.rows;
};

// ========================================
// SOLICITUDES DE MATERIALES
// ========================================

// Registrar una solicitud con sus detalles
const registrarSolicitud = async (solicitud) => {
  const { id_obra, id_usuario_solicitante, observacion, detalles } = solicitud;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Registrar encabezado de la solicitud
    const resultadoSolicitud = await client.query(
      `INSERT INTO solicitudes_materiales (
        id_obra,
        id_usuario_solicitante,
        observacion
      )
      VALUES ($1, $2, $3)
      RETURNING *`,
      [id_obra, id_usuario_solicitante, observacion || null],
    );

    const nuevaSolicitud = resultadoSolicitud.rows[0];

    // Registrar los materiales solicitados
    for (const detalle of detalles) {
      await client.query(
        `INSERT INTO detalle_solicitud_materiales (
          id_solicitud,
          id_material,
          cantidad_solicitada
        )
        VALUES ($1, $2, $3)`,
        [
          nuevaSolicitud.id_solicitud,
          detalle.id_material,
          detalle.cantidad_solicitada,
        ],
      );
    }

    await client.query("COMMIT");

    return nuevaSolicitud;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// Listar solicitudes
const listarSolicitudes = async () => {
  const resultado = await pool.query(`
    SELECT
      s.id_solicitud,
      s.id_obra,
      o.nombre_obra,
      s.id_usuario_solicitante,
      u.username AS usuario_solicitante,
      s.fecha_solicitud,
      s.estado,
      s.observacion,
      COUNT(d.id_detalle)::integer AS cantidad_items
    FROM solicitudes_materiales s
    INNER JOIN obras o
      ON s.id_obra = o.id_obra
    INNER JOIN usuarios u
      ON s.id_usuario_solicitante = u.id_usuario
    LEFT JOIN detalle_solicitud_materiales d
      ON s.id_solicitud = d.id_solicitud
    GROUP BY
      s.id_solicitud,
      o.nombre_obra,
      u.username
    ORDER BY s.fecha_solicitud DESC
  `);

  return resultado.rows;
};

// Consultar una solicitud y sus materiales
const buscarSolicitud = async (id) => {
  const resultado = await pool.query(
    `SELECT
      s.id_solicitud,
      s.id_obra,
      o.nombre_obra,
      s.id_usuario_solicitante,
      u.username AS usuario_solicitante,
      s.fecha_solicitud,
      s.estado,
      s.observacion,
      d.id_detalle,
      d.id_material,
      m.nombre AS nombre_material,
      m.stock_actual,
      d.cantidad_solicitada,
      d.cantidad_aprobada,
      d.cantidad_entregada
    FROM solicitudes_materiales s
    INNER JOIN obras o
      ON s.id_obra = o.id_obra
    INNER JOIN usuarios u
      ON s.id_usuario_solicitante = u.id_usuario
    INNER JOIN detalle_solicitud_materiales d
      ON s.id_solicitud = d.id_solicitud
    INNER JOIN materiales m
      ON d.id_material = m.id_material
    WHERE s.id_solicitud = $1
    ORDER BY d.id_detalle`,
    [id],
  );

  return resultado.rows;
};

// Aprobar una solicitud con las cantidades autorizadas
const aprobarSolicitud = async (id, detalles) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const solicitud = await client.query(
      `SELECT estado
       FROM solicitudes_materiales
       WHERE id_solicitud = $1
       FOR UPDATE`,
      [id],
    );

    if (solicitud.rowCount === 0) {
      throw new Error("La solicitud no existe");
    }

    if (solicitud.rows[0].estado !== "Pendiente") {
      throw new Error("La solicitud ya fue procesada");
    }

    const existentes = await client.query(
      `SELECT id_detalle, cantidad_solicitada
       FROM detalle_solicitud_materiales
       WHERE id_solicitud = $1
       FOR UPDATE`,
      [id],
    );

    if (existentes.rowCount === 0) {
      throw new Error("La solicitud no tiene materiales");
    }

    if (!Array.isArray(detalles) || detalles.length !== existentes.rowCount) {
      throw new Error("Debés indicar la cantidad aprobada de cada material");
    }

    const idsRecibidos = detalles.map((detalle) => Number(detalle.id_detalle));

    if (new Set(idsRecibidos).size !== idsRecibidos.length) {
      throw new Error("Hay materiales repetidos en la aprobación");
    }

    for (const detalle of detalles) {
      const idDetalle = Number(detalle.id_detalle);

      const original = existentes.rows.find(
        (item) => item.id_detalle === idDetalle,
      );

      const cantidad = Number(detalle.cantidad_aprobada);

      if (
        !original ||
        !Number.isInteger(cantidad) ||
        cantidad < 0 ||
        cantidad > original.cantidad_solicitada
      ) {
        throw new Error("Hay una cantidad aprobada inválida");
      }

      await client.query(
        `UPDATE detalle_solicitud_materiales
         SET cantidad_aprobada = $1
         WHERE id_detalle = $2
           AND id_solicitud = $3`,
        [cantidad, idDetalle, id],
      );
    }

    await client.query(
      `UPDATE solicitudes_materiales
       SET estado = 'Aprobada'
       WHERE id_solicitud = $1`,
      [id],
    );

    await client.query("COMMIT");

    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// Rechazar una solicitud pendiente
const rechazarSolicitud = async (id) => {
  const resultado = await pool.query(
    `UPDATE solicitudes_materiales
     SET estado = 'Rechazada'
     WHERE id_solicitud = $1
       AND estado = 'Pendiente'
     RETURNING *`,
    [id],
  );

  return resultado.rows[0];
};

// Registrar la entrega y descontar el inventario
const registrarEntrega = async (id, id_usuario, detalles) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (!Array.isArray(detalles) || detalles.length === 0) {
      throw new Error("Debés indicar al menos un material para entregar");
    }

    const idsRecibidos = detalles.map((detalle) => Number(detalle.id_detalle));

    if (new Set(idsRecibidos).size !== idsRecibidos.length) {
      throw new Error("Hay detalles repetidos en la entrega");
    }

    const solicitud = await client.query(
      `SELECT id_obra, estado
       FROM solicitudes_materiales
       WHERE id_solicitud = $1
       FOR UPDATE`,
      [id],
    );

    if (solicitud.rowCount === 0) {
      throw new Error("La solicitud no existe");
    }

    if (solicitud.rows[0].estado !== "Aprobada") {
      throw new Error("La solicitud no está disponible para entrega");
    }

    const id_obra = solicitud.rows[0].id_obra;

    for (const detalle of detalles) {
      const idDetalle = Number(detalle.id_detalle);
      const cantidad = Number(detalle.cantidad_entregada);

      if (!Number.isInteger(cantidad) || cantidad <= 0) {
        throw new Error("La cantidad entregada debe ser un entero positivo");
      }

      const detalleDB = await client.query(
        `SELECT id_material, cantidad_aprobada, cantidad_entregada
         FROM detalle_solicitud_materiales
         WHERE id_detalle = $1
           AND id_solicitud = $2
         FOR UPDATE`,
        [idDetalle, id],
      );

      if (detalleDB.rowCount === 0) {
        throw new Error("El material no pertenece a esta solicitud");
      }

      const item = detalleDB.rows[0];

      const pendiente =
        Number(item.cantidad_aprobada) - Number(item.cantidad_entregada);

      if (cantidad > pendiente) {
        throw new Error("La cantidad supera lo que falta entregar");
      }

      // Bloquear el material para evitar descontar stock simultáneamente
      const material = await client.query(
        `SELECT stock_actual
         FROM materiales
         WHERE id_material = $1
         FOR UPDATE`,
        [item.id_material],
      );

      if (
        material.rowCount === 0 ||
        Number(material.rows[0].stock_actual) < cantidad
      ) {
        throw new Error("No hay stock suficiente para realizar la entrega");
      }

      // Descontar stock
      await client.query(
        `UPDATE materiales
         SET stock_actual = stock_actual - $1
         WHERE id_material = $2`,
        [cantidad, item.id_material],
      );

      // Actualizar cantidad entregada
      await client.query(
        `UPDATE detalle_solicitud_materiales
         SET cantidad_entregada = cantidad_entregada + $1
         WHERE id_detalle = $2`,
        [cantidad, idDetalle],
      );

      // Registrar salida en el historial
      await client.query(
        `INSERT INTO movimientos_inventario (
          id_material,
          id_usuario,
          id_obra,
          tipo_movimiento,
          cantidad,
          motivo
        )
        VALUES ($1, $2, $3, 'Salida', $4, $5)`,
        [
          item.id_material,
          id_usuario,
          id_obra,
          cantidad,
          `Entrega de solicitud ${id}`,
        ],
      );
    }

    // Comprobar si todos los materiales fueron entregados
    const pendientes = await client.query(
      `SELECT COUNT(*)::integer AS cantidad
       FROM detalle_solicitud_materiales
       WHERE id_solicitud = $1
         AND cantidad_entregada < cantidad_aprobada`,
      [id],
    );

    if (pendientes.rows[0].cantidad === 0) {
      await client.query(
        `UPDATE solicitudes_materiales
         SET estado = 'Entregada'
         WHERE id_solicitud = $1`,
        [id],
      );
    }

    await client.query("COMMIT");

    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// ========================================
// EXPORTACIONES
// ========================================

module.exports = {
  listarMateriales,
  buscarMaterialPorId,
  registrarMaterial,
  modificarMaterial,
  listarMaterialesStockBajo,
  registrarMovimiento,
  listarMovimientos,
  listarObrasDisponibles,

  // Solicitudes de materiales
  registrarSolicitud,
  listarSolicitudes,
  buscarSolicitud,
  aprobarSolicitud,
  rechazarSolicitud,
  registrarEntrega,
};
