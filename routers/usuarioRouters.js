
const express = require("express");
const router = express.Router();

const usuarioController = require("../controllers/usuarioController");

const {
  verificarSesion,
  verificarRol,
} = require("../middleware/authMiddleware");

// ========================================
// AUTENTICACIÓN
// ========================================

// Iniciar sesión (no requiere sesión previa)
router.post("/login", usuarioController.login);

// Cerrar sesión
router.post(
  "/logout",
  verificarSesion,
  usuarioController.logout
);

// Consultar cuenta actual
router.get(
  "/sesion",
  verificarSesion,
  usuarioController.obtenerSesion
);

// ========================================
// GESTIÓN DE USUARIOS
// EXCLUSIVA DEL GERENTE (ROL 1)
// ========================================

// Listar usuarios
router.get(
  "/",
  verificarSesion,
  verificarRol(1),
  usuarioController.listarUsuarios
);

// Crear usuario
router.post(
  "/",
  verificarSesion,
  verificarRol(1),
  usuarioController.crearUsuario
);

// Modificar datos y roles
router.put(
  "/:id",
  verificarSesion,
  verificarRol(1),
  usuarioController.modificarUsuario
);

// Activar o desactivar usuario
router.patch(
  "/:id/estado",
  verificarSesion,
  verificarRol(1),
  usuarioController.cambiarEstado
);

// Restablecer contraseña
router.patch(
  "/:id/password",
  verificarSesion,
  verificarRol(1),
  usuarioController.cambiarPassword
);

module.exports = router;
