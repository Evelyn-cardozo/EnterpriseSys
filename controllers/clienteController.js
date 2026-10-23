const clienteModel = require("../models/clienteModel");

// Mostrar todos los clientes
const listarClientes = async (req, res) => {
  try {
    const clientes = await clienteModel.listarClientes();

    return res.status(200).json(clientes);
  } catch (error) {
    console.error("Error al listar clientes:", error);

    return res.status(500).json({
      mensaje: "Error al obtener los clientes",
    });
  }
};

// Registrar un cliente

const registrarCliente = async (req, res) => {
  try {
    const { nombre_razon_social, ruc_ci, telefono, direccion, email } =
      req.body;

    if (!nombre_razon_social || !ruc_ci) {
      return res.status(400).json({
        mensaje: "El nombre y el RUC o CI son obligatorios",
      });
    }

    // Verificar si el CI/RUC ya está registrado
    const clienteExistente = await clienteModel.buscarPorRucCi(ruc_ci);

    if (clienteExistente) {
      return res.status(409).json({
        mensaje: "El CI/RUC ingresado ya está registrado.",
      });
    }

    const cliente = await clienteModel.registrarCliente({
      nombre_razon_social,
      ruc_ci,
      telefono,
      direccion,
      email,
    });

    return res.status(201).json({
      mensaje: "Cliente registrado correctamente",
      cliente,
    });
  } catch (error) {
    console.error("Error al registrar cliente:", error);

    return res.status(500).json({
      mensaje: "Error al registrar el cliente",
    });
  }
};

const modificarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_razon_social, ruc_ci, telefono, direccion, email } =
      req.body;

    if (!nombre_razon_social?.trim() || !ruc_ci?.trim()) {
      return res.status(400).json({
        mensaje: "El nombre y el RUC o CI son obligatorios",
      });
    }

    const clienteExistente = await clienteModel.buscarPorRucCiExceptoId(
      ruc_ci.trim(),
      id,
    );

    if (clienteExistente) {
      return res.status(409).json({
        mensaje: "El CI/RUC ingresado ya está registrado.",
      });
    }

    const cliente = await clienteModel.modificarCliente(id, {
      nombre_razon_social: nombre_razon_social.trim(),
      ruc_ci: ruc_ci.trim(),
      telefono,
      direccion,
      email,
    });

    if (!cliente) {
      return res.status(404).json({
        mensaje: "Cliente no encontrado",
      });
    }

    return res.status(200).json({
      mensaje: "Cliente modificado correctamente",
      cliente,
    });
  } catch (error) {
    console.error("Error al modificar cliente:", error);

    return res.status(500).json({
      mensaje: "Error al modificar el cliente",
    });
  }
};

// Cambiar el estado de un cliente
const cambiarEstadoCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!["Activo", "Inactivo"].includes(estado)) {
      return res.status(400).json({
        mensaje: "El estado debe ser Activo o Inactivo",
      });
    }

    const cliente = await clienteModel.cambiarEstadoCliente(id, estado);

    if (!cliente) {
      return res.status(404).json({
        mensaje: "Cliente no encontrado",
      });
    }

    return res.status(200).json({
      mensaje: "Estado del cliente actualizado correctamente",
      cliente,
    });
  } catch (error) {
    console.error("Error al cambiar el estado:", error);

    return res.status(500).json({
      mensaje: "Error al cambiar el estado del cliente",
    });
  }
};

module.exports = {
  listarClientes,
  registrarCliente,
  modificarCliente,
  cambiarEstadoCliente,
};
