
const obraModel = require("../models/obraModel");
const clienteModel = require("../models/clienteModel");

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
      personal_responsable,
      presupuesto_planificado,
      fecha_inicio,
      fecha_fin_prevista,
    } = req.body;

    if (
      !id_cliente ||
      !nombre_obra?.trim() ||
      !personal_responsable?.trim() ||
      presupuesto_planificado === undefined ||
      presupuesto_planificado === "" ||
      !fecha_inicio ||
      !fecha_fin_prevista
    ) {
      return res.status(400).json({
        mensaje: "Todos los campos obligatorios deben completarse",
      });
    }

    const cliente = await clienteModel.listarClientes();

    const clienteValido = cliente.some(
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
      !Number.isInteger(Number(id_cliente)) ||
      Number(id_cliente) <= 0
    ) {
      return res.status(400).json({
        mensaje: "El cliente seleccionado no es válido",
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
      personal_responsable: personal_responsable.trim(),
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
      personal_responsable,
      presupuesto_planificado,
      fecha_inicio,
      fecha_fin_prevista,
    } = req.body;

    if (
      !id_cliente ||
      !nombre_obra?.trim() ||
      !personal_responsable?.trim() ||
      presupuesto_planificado === undefined ||
      presupuesto_planificado === "" ||
      !fecha_inicio ||
      !fecha_fin_prevista
    ) {
      return res.status(400).json({
        mensaje: "Todos los campos obligatorios deben completarse",
      });
    }

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

    const cliente = await clienteModel.listarClientes();

    const clienteValido = cliente.some(
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

    if (
      !Number.isInteger(Number(id_cliente)) ||
      Number(id_cliente) <= 0 ||
      !Number.isFinite(presupuesto) ||
      presupuesto < 0
    ) {
      return res.status(400).json({
        mensaje: "El cliente o el presupuesto no son válidos",
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

    const obra = await obraModel.modificarObra(Number(id), {
      id_cliente: Number(id_cliente),
      nombre_obra: nombre_obra.trim(),
      personal_responsable: personal_responsable.trim(),
      presupuesto_planificado: presupuesto,
      fecha_inicio,
      fecha_fin_prevista,
    });

    return res.status(200).json({
      mensaje: "Obra modificada correctamente",
      obra,
    });
  } catch (error) {
    console.error("Error al modificar obra:", error);

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

    const estadosPermitidos = [
      "Planificada",
      "En ejecución",
      "Finalizada",
      "Cancelada",
    ];

    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        mensaje: "El estado seleccionado no es válido",
      });
    }

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

    const obra = await obraModel.cambiarEstadoObra(Number(id), estado);

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

module.exports = {
  listarObras,
  registrarObra,
  modificarObra,
  cambiarEstadoObra,
};
