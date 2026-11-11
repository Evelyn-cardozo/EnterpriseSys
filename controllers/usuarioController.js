
const bcrypt = require("bcrypt");
const usuarioModel = require("../models/usuarioModel");

// ========================================
// INICIAR SESIÓN
// ========================================

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        mensaje: "Usuario y contraseña son obligatorios",
      });
    }

    const usuario = await usuarioModel.buscarPorUsername(username);

    if (!usuario) {
      return res.status(401).json({
        mensaje: "Usuario o contraseña incorrectos",
      });
    }

    if (usuario.estado !== "Activo") {
      return res.status(403).json({
        mensaje: "El usuario está inactivo",
      });
    }

    const passwordValida = await bcrypt.compare(
      password,
      usuario.password_hash
    );

    if (!passwordValida) {
      return res.status(401).json({
        mensaje: "Usuario o contraseña incorrectos",
      });
    }

    // Guardar los datos del usuario en la sesión
    req.session.usuario = {
      id_usuario: usuario.id_usuario,
      username: usuario.username,
      email: usuario.email,
      id_rol: usuario.id_rol,
      nombre_rol: usuario.nombre_rol,
    };

    req.session.save((error) => {
      if (error) {
        console.error("Error al guardar la sesión:", error);

        return res.status(500).json({
          mensaje: "No se pudo guardar la sesión",
        });
      }

      return res.status(200).json({
        mensaje: "Inicio de sesión exitoso",
        usuario: req.session.usuario,
      });
    });

  } catch (error) {
    console.error("Error en el login:", error);

    return res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
};

// ========================================
// CERRAR SESIÓN
// ========================================

const logout = (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Error al cerrar sesión:", error);

      return res.status(500).json({
        mensaje: "No se pudo cerrar la sesión",
      });
    }

    res.clearCookie("connect.sid");

    return res.status(200).json({
      mensaje: "Sesión cerrada correctamente",
    });
  });
};
// ========================================
// OBTENER USUARIO DE LA SESIÓN ACTUAL
// ========================================

const obtenerSesion = (req, res) => {
  if (!req.session || !req.session.usuario) {
    return res.status(401).json({
      mensaje: "No hay una sesión activa",
    });
  }

  return res.status(200).json({
    usuario: req.session.usuario,
  });
};
module.exports = {
  login,
  logout,
  obtenerSesion
};
