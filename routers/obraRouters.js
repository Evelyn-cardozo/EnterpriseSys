
const express = require("express");
const router = express.Router();

const obraController = require("../controllers/obraController");

// Listar todas las obras
router.get("/", obraController.listarObras);

// Registrar una obra
router.post("/", obraController.registrarObra);

// Cambiar el estado de una obra
router.patch("/:id/estado", obraController.cambiarEstadoObra);

// Modificar una obra
router.put("/:id", obraController.modificarObra);

module.exports = router;
