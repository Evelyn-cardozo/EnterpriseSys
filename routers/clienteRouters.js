const express = require("express");
const router = express.Router();

const clienteController = require("../controllers/clienteController");

const {
  verificarSesion,
  verificarRol,
} = require("../middleware/authMiddleware");

// Todas las rutas requieren iniciar sesión
router.use(verificarSesion);

// GERENTE Y JEFE DE OBRA:
// pueden consultar clientes desde el módulo Obras
router.get("/", verificarRol(1, 2), clienteController.listarClientes);

// SOLAMENTE GERENTE:
// puede administrar clientes
router.post("/", verificarRol(1), clienteController.registrarCliente);

router.patch(
  "/:id/estado",
  verificarRol(1),
  clienteController.cambiarEstadoCliente,
);

router.put("/:id", verificarRol(1), clienteController.modificarCliente);

module.exports = router;
