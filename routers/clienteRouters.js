const express = require("express");
const router = express.Router();

const clienteController = require("../controllers/clienteController");

router.get("/", clienteController.listarClientes);
router.post("/", clienteController.registrarCliente);
router.patch("/:id/estado", clienteController.cambiarEstadoCliente);
router.put("/:id", clienteController.modificarCliente);
module.exports = router;
