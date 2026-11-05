
const express = require("express");
const router = express.Router();

const inventarioController = require("../controllers/inventarioController");

// ========================================
// CONSULTAS ESPECÍFICAS
// ========================================

router.get("/stock-bajo", inventarioController.listarMaterialesStockBajo);
router.get("/movimientos", inventarioController.listarMovimientos);

// ========================================
// SOLICITUDES DE MATERIALES
// ========================================

router.post("/solicitudes", inventarioController.registrarSolicitud);
router.get("/solicitudes", inventarioController.listarSolicitudes);
router.get("/solicitudes/:id", inventarioController.buscarSolicitud);
router.patch("/solicitudes/:id/aprobar", inventarioController.aprobarSolicitud);
router.patch("/solicitudes/:id/rechazar", inventarioController.rechazarSolicitud);
router.post("/solicitudes/:id/entregar", inventarioController.registrarEntrega);

// ========================================
// MOVIMIENTOS DE INVENTARIO
// ========================================

router.post("/movimientos", inventarioController.registrarMovimiento);

// ========================================
// GESTIÓN DE MATERIALES
// ========================================

router.get("/", inventarioController.listarMateriales);
router.get("/:id", inventarioController.buscarMaterialPorId);
router.post("/", inventarioController.registrarMaterial);
router.put("/:id", inventarioController.modificarMaterial);

module.exports = router;
