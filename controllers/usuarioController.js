
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

    req.session.usuario = {
      id_usuario: usuario.id_usuario,
      username: usuario.username,
      email: usuario.email,
      id_rol: usuario.id_rol,
      nombre_rol: usuario.nombre_rol,
    };

    req.session.save((error) => {
      if (error) {
        console.error(error);

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
    console.error("Error en login:", error);

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
// CONSULTAR SESIÓN
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

// ========================================
// LISTAR USUARIOS
// ========================================

const listarUsuarios = async (req, res) => {
  try {
    const usuarios = await usuarioModel.listarUsuarios();

    return res.json({ usuarios });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: "Error al consultar usuarios",
    });
  }
};

// ========================================
// CREAR USUARIO
// ========================================

const crearUsuario = async (req, res) => {
  try {
    const { username, email, password, id_rol } = req.body;

    if (!username || !email || !password || !id_rol) {
      return res.status(400).json({
        mensaje: "Todos los campos son obligatorios",
      });
    }

    const rol = Number(id_rol);

    if (![1, 2, 3].includes(rol)) {
      return res.status(400).json({
        mensaje: "El rol seleccionado no es válido",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        mensaje: "La contraseña debe tener al menos 8 caracteres",
      });
    }

    const existente = await usuarioModel.buscarPorUsername(username);

    if (existente) {
      return res.status(409).json({
        mensaje: "El nombre de usuario ya existe",
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const usuario = await usuarioModel.crearUsuario({
      username: username.trim(),
      email: email.trim(),
      password_hash,
      id_rol: rol,
    });

    return res.status(201).json({
      mensaje: "Usuario creado correctamente",
      usuario,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: "Error al crear usuario",
    });
  }
};

// ========================================
// EDITAR USUARIO
// ========================================

const modificarUsuario = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { username, email, id_rol } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        mensaje: "Identificador inválido",
      });
    }

    if (!username || !email || !id_rol) {
      return res.status(400).json({
        mensaje: "Todos los campos son obligatorios",
      });
    }

    const rol = Number(id_rol);

    if (![1, 2, 3].includes(rol)) {
      return res.status(400).json({
        mensaje: "El rol no es válido",
      });
    }

    const actual = await usuarioModel.buscarPorId(id);

    if (!actual) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado",
      });
    }

    if (id === req.session.usuario.id_usuario && rol !== 1) {
      return res.status(403).json({
        mensaje: "No podés cambiar tu propio rol de Gerente",
      });
    }

    const existente = await usuarioModel.buscarPorUsername(username.trim());

    if (existente && existente.id_usuario !== id) {
      return res.status(409).json({
        mensaje: "El nombre de usuario ya está registrado",
      });
    }

    const usuario = await usuarioModel.modificarUsuario(id, {
      username: username.trim(),
      email: email.trim(),
      id_rol: rol,
    });

    if (id === req.session.usuario.id_usuario) {
      const actualizado = await usuarioModel.buscarPorId(id);

      req.session.usuario = {
        ...req.session.usuario,
        username: actualizado.username,
        email: actualizado.email,
        id_rol: actualizado.id_rol,
        nombre_rol: actualizado.nombre_rol,
      };
    }

    return res.json({
      mensaje: "Usuario actualizado correctamente",
      usuario,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: "Error al modificar usuario",
    });
  }
};

// ========================================
// ACTIVAR / DESACTIVAR USUARIO
// ========================================

const cambiarEstado = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { estado } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        mensaje: "Identificador inválido",
      });
    }

    if (!["Activo", "Inactivo"].includes(estado)) {
      return res.status(400).json({
        mensaje: "Estado no válido",
      });
    }

    if (id === req.session.usuario.id_usuario) {
      return res.status(403).json({
        mensaje: "No podés desactivar tu propia cuenta",
      });
    }

    const actual = await usuarioModel.buscarPorId(id);

    if (!actual) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado",
      });
    }

    const usuario = await usuarioModel.cambiarEstado(id, estado);

    return res.json({
      mensaje: "Estado actualizado correctamente",
      usuario,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: "Error al cambiar el estado",
    });
  }
};

// ========================================
// RESTABLECER CONTRASEÑA
// ========================================

const cambiarPassword = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { password } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        mensaje: "Identificador inválido",
      });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({
        mensaje: "La contraseña debe tener al menos 8 caracteres",
      });
    }

    const actual = await usuarioModel.buscarPorId(id);

    if (!actual) {
      return res.status(404).json({
        mensaje: "Usuario no encontrado",
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    await usuarioModel.cambiarPassword(id, password_hash);

    return res.json({
      mensaje: "Contraseña actualizada correctamente",
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      mensaje: "Error al cambiar la contraseña",
    });
  }
};

module.exports = {
  login,
  logout,
  obtenerSesion,
  listarUsuarios,
  crearUsuario,
  modificarUsuario,
  cambiarEstado,
  cambiarPassword,
};
