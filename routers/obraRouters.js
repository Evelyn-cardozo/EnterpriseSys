
const express = require("express");
const router = express.Router();

const obraController = require("../controllers/obraController");

// ===============================
// OBRAS
// ===============================

// Listar todas las obras
router.get("/", obraController.listarObras);

// Registrar una obra
router.post("/", obraController.registrarObra);

// Cambiar el estado de una obra
router.patch("/:id/estado", obraController.cambiarEstadoObra);

// Modificar una obra
router.put("/:id", obraController.modificarObra);


// ===============================
// TRABAJADORES
// ===============================

// Listar todos los trabajadores
router.get("/trabajadores", obraController.listarTrabajadores);

// Listar trabajadores de una obra específica
router.get("/:id/trabajadores", obraController.listarTrabajadoresPorObra);

// Registrar trabajador
router.post("/trabajadores", obraController.registrarTrabajador);

// Modificar trabajador
router.put("/trabajadores/:id", obraController.modificarTrabajador);

// Eliminar trabajador
router.delete("/trabajadores/:id", obraController.eliminarTrabajador);

module.exports = router;
