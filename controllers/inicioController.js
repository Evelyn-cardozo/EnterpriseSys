const inicioModel = require("../models/inicioModel");

// ========================================
// OBTENER DATOS DEL PANEL INICIO
// ========================================

const obtenerDatosInicio = async (req, res) => {
  try {
    const usuario = req.session.usuario;

    const idUsuario = usuario.id_usuario;
    const idRol = Number(usuario.id_rol);

    const resumen = await inicioModel.obtenerResumen(idRol, idUsuario);

    const actividades = await inicioModel.listarActividades(idRol, idUsuario);

    return res.status(200).json({
      usuario: {
        username: usuario.username,
        nombre_rol: usuario.nombre_rol,
        id_rol: idRol,
      },
      resumen,
      actividades,
    });
  } catch (error) {
    console.error("Error al obtener los datos del inicio:", error);

    return res.status(500).json({
      mensaje: "Error al cargar los datos del panel",
    });
  }
};

module.exports = {
  obtenerDatosInicio,
};
