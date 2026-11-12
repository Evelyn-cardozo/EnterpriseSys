const inventarioModel = require("../models/inventarioModel");

// ========================================
// FUNCIONES AUXILIARES
// ========================================

const obtenerUsuarioId = (req) => {
  return req.session?.usuario?.id_usuario;
};

const esEnteroPositivo = (valor) => {
  return Number.isInteger(Number(valor)) && Number(valor) > 0;
};

const solicitudExiste = (solicitud) => {
  if (Array.isArray(solicitud)) {
    return solicitud.length > 0;
  }

  return Boolean(solicitud);
};

// Determinar el código HTTP según el error
const obtenerEstadoError = (error) => {
  if (error.statusCode) {
    return error.statusCode;
  }

  const mensajesValidacion = [
    "La cantidad debe ser un entero positivo",
    "El tipo de movimiento no es válido",
    "No hay stock suficiente para realizar la salida",
    "No hay stock suficiente para realizar la entrega",
    "La cantidad supera lo que falta entregar",
    "La cantidad entregada debe ser un entero positivo",
    "La solicitud ya fue procesada",
    "La solicitud no está disponible para entrega",
    "Hay una cantidad aprobada inválida",
    "Debés aprobar al menos un material con cantidad mayor a cero",
    "Debés indicar la cantidad aprobada de cada material",
    "Hay materiales repetidos en la aprobación",
    "La solicitud no tiene materiales",
    "El material no pertenece a esta solicitud",
    "Hay detalles repetidos en la entrega",
    "Debés indicar al menos un material para entregar",
  ];

  if (mensajesValidacion.includes(error.message)) {
    return 400;
  }

  if (
    error.message === "El material no existe" ||
    error.message === "La solicitud no existe"
  ) {
    return 404;
  }

  return 500;
};
// ========================================
// OBRAS DISPONIBLES
// ========================================

const listarObrasDisponibles = async (req, res) => {
  try {
    const obras = await inventarioModel.listarObrasDisponibles();

    return res.status(200).json(obras);
  } catch (error) {
    console.error("Error al listar obras disponibles:", error);

    return res.status(500).json({
      mensaje: "Error al obtener las obras",
    });
  }
};

// ========================================
// MATERIALES
// ========================================

// Listar todos los materiales
const listarMateriales = async (req, res) => {
  try {
    const materiales = await inventarioModel.listarMateriales();

    return res.status(200).json(materiales);
  } catch (error) {
    console.error("Error al listar materiales:", error);

    return res.status(500).json({
      mensaje: "Error al obtener los materiales",
    });
  }
};

// Buscar material por ID
const buscarMaterialPorId = async (req, res) => {
  try {
    const { id } = req.params;

    if (!esEnteroPositivo(id)) {
      return res.status(400).json({
        mensaje: "El ID del material no es válido",
      });
    }

    const material = await inventarioModel.buscarMaterialPorId(id);

    if (!material) {
      return res.status(404).json({
        mensaje: "Material no encontrado",
      });
    }

    return res.status(200).json(material);
  } catch (error) {
    console.error("Error al buscar material:", error);

    return res.status(500).json({
      mensaje: "Error al buscar el material",
    });
  }
};

// Registrar material
const registrarMaterial = async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      precio_actual,
      stock_actual = 0,
      stock_minimo = 5,
      ubicacion_fisica,
    } = req.body;

    if (typeof nombre !== "string" || !nombre.trim() || precio_actual == null) {
      return res.status(400).json({
        mensaje: "El nombre y el precio actual son obligatorios",
      });
    }

    if (!Number.isFinite(Number(precio_actual)) || Number(precio_actual) < 0) {
      return res.status(400).json({
        mensaje: "El precio debe ser un número válido y no negativo",
      });
    }

    if (
      !Number.isInteger(Number(stock_actual)) ||
      Number(stock_actual) < 0 ||
      !Number.isInteger(Number(stock_minimo)) ||
      Number(stock_minimo) < 0
    ) {
      return res.status(400).json({
        mensaje: "Las cantidades de stock deben ser enteros no negativos",
      });
    }

    const material = await inventarioModel.registrarMaterial({
      nombre: nombre.trim(),
      descripcion,
      precio_actual: Number(precio_actual),
      stock_actual: Number(stock_actual),
      stock_minimo: Number(stock_minimo),
      ubicacion_fisica,
    });

    return res.status(201).json({
      mensaje: "Material registrado correctamente",
      material,
    });
  } catch (error) {
    console.error("Error al registrar material:", error);

    return res.status(500).json({
      mensaje: "Error al registrar el material",
    });
  }
};

// Modificar material
const modificarMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    if (!esEnteroPositivo(id)) {
      return res.status(400).json({
        mensaje: "El ID del material no es válido",
      });
    }

    const material = await inventarioModel.buscarMaterialPorId(id);

    if (!material) {
      return res.status(404).json({
        mensaje: "Material no encontrado",
      });
    }

    const {
      nombre,
      descripcion,
      precio_actual,
      stock_minimo,
      ubicacion_fisica,
      stock_actual,
    } = req.body;

    // El stock solamente se modifica mediante movimientos.
    if (stock_actual !== undefined) {
      return res.status(400).json({
        mensaje: "El stock debe modificarse mediante movimientos de inventario",
      });
    }

    const datos = {};

    if (nombre !== undefined) {
      if (typeof nombre !== "string" || !nombre.trim()) {
        return res.status(400).json({
          mensaje: "El nombre del material no es válido",
        });
      }

      datos.nombre = nombre.trim();
    }

    if (descripcion !== undefined) {
      datos.descripcion = descripcion;
    }

    if (precio_actual !== undefined) {
      if (
        !Number.isFinite(Number(precio_actual)) ||
        Number(precio_actual) < 0
      ) {
        return res.status(400).json({
          mensaje: "El precio debe ser válido y no negativo",
        });
      }

      datos.precio_actual = Number(precio_actual);
    }

    if (stock_minimo !== undefined) {
      if (!Number.isInteger(Number(stock_minimo)) || Number(stock_minimo) < 0) {
        return res.status(400).json({
          mensaje: "El stock mínimo debe ser un entero no negativo",
        });
      }

      datos.stock_minimo = Number(stock_minimo);
    }

    if (ubicacion_fisica !== undefined) {
      datos.ubicacion_fisica = ubicacion_fisica;
    }

    if (Object.keys(datos).length === 0) {
      return res.status(400).json({
        mensaje: "No se enviaron datos para modificar",
      });
    }

    const actualizado = await inventarioModel.modificarMaterial(id, datos);

    return res.status(200).json({
      mensaje: "Material actualizado correctamente",
      material: actualizado,
    });
  } catch (error) {
    console.error("Error al modificar material:", error);

    return res.status(500).json({
      mensaje: "Error al modificar el material",
    });
  }
};

// Listar materiales con stock bajo
const listarMaterialesStockBajo = async (req, res) => {
  try {
    const materiales = await inventarioModel.listarMaterialesStockBajo();

    return res.status(200).json(materiales);
  } catch (error) {
    console.error("Error al consultar stock bajo:", error);

    return res.status(500).json({
      mensaje: "Error al consultar los materiales con stock bajo",
    });
  }
};

// ========================================
// MOVIMIENTOS DE INVENTARIO
// ========================================

// Registrar movimiento
const registrarMovimiento = async (req, res) => {
  try {
    const {
      id_material,
      id_obra,
      tipo_movimiento,
      cantidad,
      observacion,
      motivo,
    } = req.body;

    const id_usuario = obtenerUsuarioId(req);

    if (!id_usuario) {
      return res.status(401).json({
        mensaje: "Debe iniciar sesión para registrar movimientos",
      });
    }

    if (
      !esEnteroPositivo(id_material) ||
      !esEnteroPositivo(cantidad) ||
      !tipo_movimiento
    ) {
      return res.status(400).json({
        mensaje: "Los datos del movimiento son inválidos",
      });
    }

    if (!["Entrada", "Salida"].includes(tipo_movimiento)) {
      return res.status(400).json({
        mensaje: "El tipo de movimiento debe ser Entrada o Salida",
      });
    }

    if (id_obra != null && !esEnteroPositivo(id_obra)) {
      return res.status(400).json({
        mensaje: "El ID de la obra no es válido",
      });
    }

    const material = await inventarioModel.buscarMaterialPorId(id_material);

    if (!material) {
      return res.status(404).json({
        mensaje: "Material no encontrado",
      });
    }

    const movimiento = await inventarioModel.registrarMovimiento({
      id_material: Number(id_material),
      id_usuario: Number(id_usuario),
      id_obra: id_obra ? Number(id_obra) : null,
      tipo_movimiento,
      cantidad: Number(cantidad),
      motivo: motivo || observacion || null,
    });

    return res.status(201).json({
      mensaje: "Movimiento registrado y stock actualizado correctamente",
      movimiento,
    });
  } catch (error) {
    console.error("Error al registrar movimiento:", error);

    return res.status(obtenerEstadoError(error)).json({
      mensaje: error.message || "Error al registrar el movimiento",
    });
  }
};

// Listar movimientos
const listarMovimientos = async (req, res) => {
  try {
    const movimientos = await inventarioModel.listarMovimientos();

    return res.status(200).json(movimientos);
  } catch (error) {
    console.error("Error al listar movimientos:", error);

    return res.status(500).json({
      mensaje: "Error al obtener los movimientos",
    });
  }
};

// ========================================
// SOLICITUDES DE MATERIALES
// ========================================

// Registrar solicitud desde Obras
const registrarSolicitud = async (req, res) => {
  try {
    const { id_obra, observacion, detalles } = req.body;

    const id_usuario_solicitante = obtenerUsuarioId(req);

    if (!id_usuario_solicitante) {
      return res.status(401).json({
        mensaje: "Debe iniciar sesión para registrar una solicitud",
      });
    }

    if (
      !esEnteroPositivo(id_obra) ||
      !Array.isArray(detalles) ||
      detalles.length === 0
    ) {
      return res.status(400).json({
        mensaje: "Debe indicar una obra y al menos un material",
      });
    }

    const materialesRepetidos = new Set();

    for (const detalle of detalles) {
      if (
        !esEnteroPositivo(detalle.id_material) ||
        !esEnteroPositivo(detalle.cantidad_solicitada)
      ) {
        return res.status(400).json({
          mensaje: "Los materiales y las cantidades deben ser válidos",
        });
      }

      const idMaterial = Number(detalle.id_material);

      if (materialesRepetidos.has(idMaterial)) {
        return res.status(400).json({
          mensaje: "No se debe repetir un material en la misma solicitud",
        });
      }

      materialesRepetidos.add(idMaterial);

      const material = await inventarioModel.buscarMaterialPorId(idMaterial);

      if (!material) {
        return res.status(404).json({
          mensaje: `No se encontró el material ${idMaterial}`,
        });
      }
    }

    const solicitud = await inventarioModel.registrarSolicitud({
      id_obra: Number(id_obra),
      id_usuario_solicitante: Number(id_usuario_solicitante),
      observacion: observacion || null,
      detalles: detalles.map((detalle) => ({
        id_material: Number(detalle.id_material),
        cantidad_solicitada: Number(detalle.cantidad_solicitada),
      })),
    });

    return res.status(201).json({
      mensaje: "Solicitud registrada correctamente",
      solicitud,
    });
  } catch (error) {
    console.error("Error al registrar solicitud:", error);

    return res.status(500).json({
      mensaje: error.message || "Error al registrar la solicitud",
    });
  }
};

// Listar todas las solicitudes
const listarSolicitudes = async (req, res) => {
  try {
    const solicitudes = await inventarioModel.listarSolicitudes();

    return res.status(200).json(solicitudes);
  } catch (error) {
    console.error("Error al listar solicitudes:", error);

    return res.status(500).json({
      mensaje: "Error al obtener las solicitudes",
    });
  }
};

// Buscar solicitud por ID
const buscarSolicitud = async (req, res) => {
  try {
    const { id } = req.params;

    if (!esEnteroPositivo(id)) {
      return res.status(400).json({
        mensaje: "El ID de la solicitud no es válido",
      });
    }

    const solicitud = await inventarioModel.buscarSolicitud(id);

    if (!solicitudExiste(solicitud)) {
      return res.status(404).json({
        mensaje: "Solicitud no encontrada",
      });
    }

    return res.status(200).json(solicitud);
  } catch (error) {
    console.error("Error al buscar solicitud:", error);

    return res.status(500).json({
      mensaje: "Error al consultar la solicitud",
    });
  }
};

// Aprobar solicitud
const aprobarSolicitud = async (req, res) => {
  try {
    const { id } = req.params;
    const { detalles } = req.body;

    if (!esEnteroPositivo(id)) {
      return res.status(400).json({
        mensaje: "El ID de la solicitud no es válido",
      });
    }

    const solicitud = await inventarioModel.buscarSolicitud(id);

    if (!solicitudExiste(solicitud)) {
      return res.status(404).json({
        mensaje: "Solicitud no encontrada",
      });
    }

    if (!Array.isArray(detalles) || detalles.length === 0) {
      return res.status(400).json({
        mensaje: "Debe indicar las cantidades aprobadas",
      });
    }

    for (const detalle of detalles) {
      if (
        !esEnteroPositivo(detalle.id_detalle) ||
        !Number.isInteger(Number(detalle.cantidad_aprobada)) ||
        Number(detalle.cantidad_aprobada) < 0
      ) {
        return res.status(400).json({
          mensaje: "Los detalles y las cantidades aprobadas no son válidos",
        });
      }
    }

    await inventarioModel.aprobarSolicitud(
      Number(id),
      detalles.map((detalle) => ({
        id_detalle: Number(detalle.id_detalle),
        cantidad_aprobada: Number(detalle.cantidad_aprobada),
      })),
    );

    // Obtener los datos actualizados de la solicitud
    const solicitudActualizada = await inventarioModel.buscarSolicitud(id);

    return res.status(200).json({
      mensaje: "Solicitud aprobada correctamente",
      solicitud: solicitudActualizada,
    });
  } catch (error) {
    console.error("Error al aprobar solicitud:", error);

    return res.status(obtenerEstadoError(error)).json({
      mensaje: error.message || "Error al aprobar la solicitud",
    });
  }
};

// Rechazar solicitud
const rechazarSolicitud = async (req, res) => {
  try {
    const { id } = req.params;

    if (!esEnteroPositivo(id)) {
      return res.status(400).json({
        mensaje: "El ID de la solicitud no es válido",
      });
    }

    const solicitud = await inventarioModel.buscarSolicitud(id);

    if (!solicitudExiste(solicitud)) {
      return res.status(404).json({
        mensaje: "Solicitud no encontrada",
      });
    }

    const resultado = await inventarioModel.rechazarSolicitud(Number(id));

    if (!resultado) {
      return res.status(409).json({
        mensaje: "La solicitud ya fue procesada y no puede rechazarse",
      });
    }

    return res.status(200).json({
      mensaje: "Solicitud rechazada correctamente",
      solicitud: resultado,
    });
  } catch (error) {
    console.error("Error al rechazar solicitud:", error);

    return res.status(500).json({
      mensaje: error.message || "Error al rechazar la solicitud",
    });
  }
};

// Registrar entrega y descontar stock
const registrarEntrega = async (req, res) => {
  try {
    const { id } = req.params;
    const { detalles } = req.body;

    if (!esEnteroPositivo(id)) {
      return res.status(400).json({
        mensaje: "El ID de la solicitud no es válido",
      });
    }

    const solicitud = await inventarioModel.buscarSolicitud(id);

    if (!solicitudExiste(solicitud)) {
      return res.status(404).json({
        mensaje: "Solicitud no encontrada",
      });
    }

    const id_usuario = obtenerUsuarioId(req);

    if (!id_usuario) {
      return res.status(401).json({
        mensaje: "Debe iniciar sesión para registrar la entrega",
      });
    }

    if (!Array.isArray(detalles) || detalles.length === 0) {
      return res.status(400).json({
        mensaje: "Debe indicar los materiales entregados",
      });
    }

    const detallesRepetidos = new Set();

    for (const detalle of detalles) {
      if (
        !esEnteroPositivo(detalle.id_detalle) ||
        !esEnteroPositivo(detalle.cantidad_entregada)
      ) {
        return res.status(400).json({
          mensaje: "Los detalles y las cantidades entregadas no son válidos",
        });
      }

      const idDetalle = Number(detalle.id_detalle);

      if (detallesRepetidos.has(idDetalle)) {
        return res.status(400).json({
          mensaje: "No se debe repetir un detalle en la misma entrega",
        });
      }

      detallesRepetidos.add(idDetalle);
    }

    const entrega = await inventarioModel.registrarEntrega(
      Number(id),
      Number(id_usuario),
      detalles.map((detalle) => ({
        id_detalle: Number(detalle.id_detalle),
        cantidad_entregada: Number(detalle.cantidad_entregada),
      })),
    );

    return res.status(200).json({
      mensaje: "Entrega registrada y stock actualizado correctamente",
      entrega,
    });
  } catch (error) {
    console.error("Error al registrar entrega:", error);

    return res.status(obtenerEstadoError(error)).json({
      mensaje: error.message || "Error al registrar la entrega",
    });
  }
};

// ========================================
// EXPORTAR CONTROLADORES
// ========================================

module.exports = {
  listarObrasDisponibles,
  listarMateriales,
  buscarMaterialPorId,
  registrarMaterial,
  modificarMaterial,
  listarMaterialesStockBajo,

  registrarMovimiento,
  listarMovimientos,

  registrarSolicitud,
  listarSolicitudes,
  buscarSolicitud,
  aprobarSolicitud,
  rechazarSolicitud,
  registrarEntrega,
};
