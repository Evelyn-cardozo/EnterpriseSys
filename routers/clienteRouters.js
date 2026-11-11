
const express = require("express");
const router = express.Router();

const clienteController = require("../controllers/clienteController");

// Middleware de autenticación y permisos
const {
  verificarSesion,
  verificarRol,
} = require("../middleware/authMiddleware");

// Todas las rutas requieren iniciar sesión
router.use(verificarSesion);

// GERENTE (1): acceso exclusivo a clientes
router.get("/", verificarRol(1), clienteController.listarClientes);

router.post("/", verificarRol(1), clienteController.registrarCliente);

router.patch(
  "/:id/estado",
  verificarRol(1),
  clienteController.cambiarEstadoCliente
);

router.put(
  "/:id",
  verificarRol(1),
  clienteController.modificarCliente
);

module.exports = router;
