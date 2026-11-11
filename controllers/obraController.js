
const obraModel = require("../models/obraModel");
const clienteModel = require("../models/clienteModel");

// ===============================
// OBRAS
// ===============================

// Mostrar todas las obras
const listarObras = async (req, res) => {
  try {
    const obras = await obraModel.listarObras();

    return res.status(200).json(obras);
  } catch (error) {
    console.error("Error al listar obras:", error);

    return res.status(500).json({
      mensaje: "Error al obtener las obras",
    });
  }
};

// Registrar una obra
const registrarObra = async (req, res) => {
  try {
    const {
      id_cliente,
      nombre_obra,
      presupuesto_planificado,
      fecha_inicio,
      fecha_fin_prevista,
    } = req.body;

    if (
      !id_cliente ||
      !nombre_obra?.trim() ||
      presupuesto_planificado === undefined ||
      presupuesto_planificado === "" ||
      !fecha_inicio ||
      !fecha_fin_prevista
    ) {
      return res.status(400).json({
        mensaje: "Todos los campos obligatorios deben completarse",
      });
    }

    if (!Number.isInteger(Number(id_cliente)) || Number(id_cliente) <= 0) {
      return res.status(400).json({
        mensaje: "El cliente seleccionado no es válido",
      });
    }

    const clientes = await clienteModel.listarClientes();

    const clienteValido = clientes.some(
      (c) =>
        Number(c.id_cliente) === Number(id_cliente) &&
        String(c.estado).trim().toLowerCase() === "activo"
    );

    if (!clienteValido) {
      return res.status(400).json({
        mensaje: "El cliente seleccionado no existe o está inactivo",
      });
    }

    const presupuesto = Number(presupuesto_planificado);

    if (!Number.isFinite(presupuesto) || presupuesto < 0) {
      return res.status(400).json({
        mensaje: "El presupuesto debe ser un número válido igual o mayor a cero",
      });
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(fecha_inicio) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(fecha_fin_prevista)
    ) {
      return res.status(400).json({
        mensaje: "Las fechas deben tener un formato válido",
      });
    }

    const inicio = new Date(`${fecha_inicio}T00:00:00Z`);
    const fin = new Date(`${fecha_fin_prevista}T00:00:00Z`);

    if (
      Number.isNaN(inicio.getTime()) ||
      Number.isNaN(fin.getTime()) ||
      inicio.toISOString().slice(0, 10) !== fecha_inicio ||
      fin.toISOString().slice(0, 10) !== fecha_fin_prevista
    ) {
      return res.status(400).json({
        mensaje: "Una o ambas fechas no son válidas",
      });
    }

    if (fin < inicio) {
      return res.status(400).json({
        mensaje: "La fecha de finalización no puede ser anterior a la fecha de inicio",
      });
    }

    const obra = await obraModel.registrarObra({
      id_cliente: Number(id_cliente),
      nombre_obra: nombre_obra.trim(),
      presupuesto_planificado: presupuesto,
      fecha_inicio,
      fecha_fin_prevista,
    });

    return res.status(201).json({
      mensaje: "Obra registrada correctamente",
      obra,
    });
  } catch (error) {
    console.error("Error al registrar obra:", error);

    return res.status(500).json({
      mensaje: "Error al registrar la obra",
    });
  }
};

// Modificar una obra
const modificarObra = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      id_cliente,
      nombre_obra,
      presupuesto_planificado,
      fecha_inicio,
      fecha_fin_prevista,
    } = req.body;

    // Validar identificador
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        mensaje: "El identificador de la obra no es válido",
      });
    }

    // Buscar obra existente
    const obraExistente = await obraModel.buscarObraPorId(Number(id));

    if (!obraExistente) {
      return res.status(404).json({
        mensaje: "Obra no encontrada",
      });
    }

    // Bloquear obras finalizadas o canceladas
    const estadoActual = String(obraExistente.estado)
      .trim()
      .toLowerCase();

    if (["finalizada", "cancelada"].includes(estadoActual)) {
      return res.status(409).json({
        mensaje: `No se puede modificar una obra ${estadoActual}.`,
      });
    }

    // Validar campos obligatorios
    if (
      !id_cliente ||
      !nombre_obra?.trim() ||
      presupuesto_planificado === undefined ||
      presupuesto_planificado === "" ||
      !fecha_inicio ||
      !fecha_fin_prevista
    ) {
      return res.status(400).json({
        mensaje: "Todos los campos obligatorios deben completarse",
      });
    }

    // Validar cliente
    if (!Number.isInteger(Number(id_cliente)) || Number(id_cliente) <= 0) {
      return res.status(400).json({
        mensaje: "El cliente seleccionado no es válido",
      });
    }

    const clientes = await clienteModel.listarClientes();

    const clienteValido = clientes.some(
      (c) =>
        Number(c.id_cliente) === Number(id_cliente) &&
        String(c.estado).trim().toLowerCase() === "activo"
    );

    if (!clienteValido) {
      return res.status(400).json({
        mensaje: "El cliente seleccionado no existe o está inactivo",
      });
    }

    // Validar presupuesto
    const presupuesto = Number(presupuesto_planificado);

    if (!Number.isFinite(presupuesto) || presupuesto < 0) {
      return res.status(400).json({
        mensaje: "El presupuesto debe ser un número válido igual o mayor a cero",
      });
    }

    // Validar formato de fechas
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(fecha_inicio) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(fecha_fin_prevista)
    ) {
      return res.status(400).json({
        mensaje: "Las fechas deben tener un formato válido",
      });
    }

    const inicio = new Date(`${fecha_inicio}T00:00:00Z`);
    const fin = new Date(`${fecha_fin_prevista}T00:00:00Z`);

    if (
      Number.isNaN(inicio.getTime()) ||
      Number.isNaN(fin.getTime()) ||
      inicio.toISOString().slice(0, 10) !== fecha_inicio ||
      fin.toISOString().slice(0, 10) !== fecha_fin_prevista
    ) {
      return res.status(400).json({
        mensaje: "Una o ambas fechas no son válidas",
      });
    }

    if (fin < inicio) {
      return res.status(400).json({
        mensaje: "La fecha de finalización no puede ser anterior a la fecha de inicio",
      });
    }

    // Ejecutar modificación
    const obra = await obraModel.modificarObra(Number(id), {
      id_cliente: Number(id_cliente),
      nombre_obra: nombre_obra.trim(),
      presupuesto_planificado: presupuesto,
      fecha_inicio,
      fecha_fin_prevista,
    });

    if (!obra) {
      return res.status(404).json({
        mensaje: "Obra no encontrada",
      });
    }

    return res.status(200).json({
      mensaje: "Obra modificada correctamente",
      obra,
    });

  } catch (error) {
    console.error("Error al modificar obra:", error);

    if (error.codigo === "OBRA_NO_MODIFICABLE") {
      return res.status(409).json({
        mensaje: error.message,
      });
    }

    return res.status(500).json({
      mensaje: "Error al modificar la obra",
    });
  }
};

// Cambiar el estado de una obra
const cambiarEstadoObra = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        mensaje: "El identificador de la obra no es válido",
      });
    }

    const obraExistente = await obraModel.buscarObraPorId(Number(id));

    if (!obraExistente) {
      return res.status(404).json({
        mensaje: "Obra no encontrada",
      });
    }

    const estadoActual = String(obraExistente.estado)
      .trim()
      .toLowerCase();

    const nuevoEstado = String(estado || "").trim();

    const transicionesPermitidas = {
      "planificada": ["En ejecución", "Cancelada"],
      "en ejecución": ["Finalizada", "Cancelada"],
      "finalizada": [],
      "cancelada": [],
    };

    if (!transicionesPermitidas[estadoActual]) {
      return res.status(400).json({
        mensaje: "El estado actual de la obra no es válido",
      });
    }

    if (!transicionesPermitidas[estadoActual].includes(nuevoEstado)) {
      return res.status(409).json({
        mensaje: `No se permite cambiar una obra de "${obraExistente.estado}" a "${nuevoEstado}".`,
      });
    }

    const obra = await obraModel.cambiarEstadoObra(
      Number(id),
      nuevoEstado
    );

    return res.status(200).json({
      mensaje: "Estado de la obra actualizado correctamente",
      obra,
    });

  } catch (error) {
    console.error("Error al cambiar el estado de la obra:", error);

    return res.status(500).json({
      mensaje: "Error al cambiar el estado de la obra",
    });
  }
};


 // ===============================
 // TRABAJADORES
 // ===============================

// Listar todos los trabajadores registrados
const listarTrabajadores = async (req, res) => {
  try {
    const trabajadores = await obraModel.listarTodosLosTrabajadores();

    return res.status(200).json(trabajadores);
  } catch (error) {
    console.error("Error al listar trabajadores:", error);

    return res.status(500).json({
      mensaje: "Error al obtener los trabajadores",
    });
  }
};

// Listar trabajadores activos de una obra
const listarTrabajadoresPorObra = async (req, res) => {
  try {
    const { id } = req.params;

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        mensaje: "El identificador de la obra no es válido",
      });
    }

    const obra = await obraModel.buscarObraPorId(Number(id));

    if (!obra) {
      return res.status(404).json({
        mensaje: "Obra no encontrada",
      });
    }

    const trabajadores = await obraModel.listarTrabajadoresPorObra(Number(id));

    return res.status(200).json(trabajadores);
  } catch (error) {
    console.error("Error al listar trabajadores de la obra:", error);

    return res.status(500).json({
      mensaje: "Error al obtener los trabajadores de la obra",
    });
  }
};

// Registrar trabajador sin asignarlo a una obra
const registrarTrabajador = async (req, res) => {
  try {
    const {
      nombre_trabajador,
      cargo,
      telefono,
      gmail,
      direccion,
    } = req.body;

    if (
      !nombre_trabajador?.trim() ||
      !cargo?.trim() ||
      !telefono?.trim()
    ) {
      return res.status(400).json({
        mensaje: "Nombre, cargo y teléfono son obligatorios",
      });
    }

    const trabajador = await obraModel.registrarTrabajador({
      nombre_trabajador: nombre_trabajador.trim(),
      cargo: cargo.trim(),
      telefono: telefono.trim(),
      gmail: gmail?.trim() || null,
      direccion: direccion?.trim() || null,
    });

    return res.status(201).json({
      mensaje: "Trabajador registrado correctamente",
      trabajador,
    });
  } catch (error) {
    console.error("Error al registrar trabajador:", error);

    return res.status(500).json({
      mensaje: "Error al registrar el trabajador",
    });
  }
};

// Modificar datos personales del trabajador
const modificarTrabajador = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      nombre_trabajador,
      cargo,
      telefono,
      gmail,
      direccion,
    } = req.body;

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        mensaje: "El identificador del trabajador no es válido",
      });
    }

    if (
      !nombre_trabajador?.trim() ||
      !cargo?.trim() ||
      !telefono?.trim()
    ) {
      return res.status(400).json({
        mensaje: "Nombre, cargo y teléfono son obligatorios",
      });
    }

    const trabajadorExistente =
      await obraModel.buscarTrabajadorPorId(Number(id));

    if (!trabajadorExistente) {
      return res.status(404).json({
        mensaje: "Trabajador no encontrado",
      });
    }

    const trabajador = await obraModel.modificarTrabajador(Number(id), {
      nombre_trabajador: nombre_trabajador.trim(),
      cargo: cargo.trim(),
      telefono: telefono.trim(),
      gmail: gmail?.trim() || null,
      direccion: direccion?.trim() || null,
    });

    return res.status(200).json({
      mensaje: "Trabajador modificado correctamente",
      trabajador,
    });
  } catch (error) {
    console.error("Error al modificar trabajador:", error);

    return res.status(500).json({
      mensaje: "Error al modificar el trabajador",
    });
  }
};

// Asignar un trabajador registrado a una obra
const asignarTrabajadorAObra = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_personal } = req.body;

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        mensaje: "El identificador de la obra no es válido",
      });
    }

    if (
      !Number.isInteger(Number(id_personal)) ||
      Number(id_personal) <= 0
    ) {
      return res.status(400).json({
        mensaje: "El trabajador seleccionado no es válido",
      });
    }

    const asignacion = await obraModel.asignarTrabajadorAObra(
      Number(id),
      Number(id_personal)
    );

    return res.status(201).json({
      mensaje: "Trabajador asignado correctamente a la obra",
      asignacion,
    });
  } catch (error) {
    console.error("Error al asignar trabajador:", error);

    if (error.message.includes("ya está asignado")) {
      return res.status(409).json({
        mensaje: error.message,
      });
    }

    if (
      error.message.includes("no existe") ||
      error.message.includes("No se pueden asignar")
    ) {
      return res.status(400).json({
        mensaje: error.message,
      });
    }

    return res.status(500).json({
      mensaje: "Error al asignar el trabajador a la obra",
    });
  }
};

// Eliminar trabajador
const eliminarTrabajador = async (req, res) => {
  try {
    const { id } = req.params;

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
      return res.status(400).json({
        mensaje: "El identificador del trabajador no es válido",
      });
    }

    const trabajadorExistente =
      await obraModel.buscarTrabajadorPorId(Number(id));

    if (!trabajadorExistente) {
      return res.status(404).json({
        mensaje: "Trabajador no encontrado",
      });
    }

    const trabajador = await obraModel.eliminarTrabajador(Number(id));

    if (!trabajador) {
      return res.status(409).json({
        mensaje: "No se puede eliminar un trabajador que tiene historial de asignaciones.",
      });
    }

    return res.status(200).json({
      mensaje: "Trabajador eliminado correctamente",
      trabajador,
    });
  } catch (error) {
    console.error("Error al eliminar trabajador:", error);

    return res.status(500).json({
      mensaje: "Error al eliminar el trabajador",
    });
  }
};


// ===============================
// EXPORTAR FUNCIONES
// ===============================

module.exports = {
  listarObras,
  registrarObra,
  modificarObra,
  cambiarEstadoObra,

  listarTrabajadores,
  listarTrabajadoresPorObra,
  registrarTrabajador,
  modificarTrabajador,
  eliminarTrabajador,
  asignarTrabajadorAObra,
};

