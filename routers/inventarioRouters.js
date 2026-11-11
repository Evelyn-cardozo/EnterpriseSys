
const express = require("express");
const router = express.Router();

const inventarioController = require("../controllers/inventarioController");

const {
  verificarSesion,
  verificarRol,
} = require("../middleware/authMiddleware");

// ========================================
// PROTECCIÓN GENERAL
// ========================================

router.use(verificarSesion);

// ========================================
// CONSULTAS DE INVENTARIO
// GERENTE, JEFE DE OBRA E INVENTARIO
// ========================================

router.get(
  "/stock-bajo",
  verificarRol(1, 2, 3),
  inventarioController.listarMaterialesStockBajo
);

// Movimientos: gerente e inventario
router.get(
  "/movimientos",
  verificarRol(1, 3),
  inventarioController.listarMovimientos
);

// ========================================
// SOLICITUDES DE MATERIALES
// ========================================

// Registrar solicitud: gerente y jefe de obra
router.post(
  "/solicitudes",
  verificarRol(1, 2),
  inventarioController.registrarSolicitud
);

// Consultar solicitudes
router.get(
  "/solicitudes",
  verificarRol(1, 2, 3),
  inventarioController.listarSolicitudes
);

// Buscar solicitud
router.get(
  "/solicitudes/:id",
  verificarRol(1, 2, 3),
  inventarioController.buscarSolicitud
);

// Aprobar solicitud: gerente e inventario
router.patch(
  "/solicitudes/:id/aprobar",
  verificarRol(1, 3),
  inventarioController.aprobarSolicitud
);

// Rechazar solicitud: gerente e inventario
router.patch(
  "/solicitudes/:id/rechazar",
  verificarRol(1, 3),
  inventarioController.rechazarSolicitud
);

// Registrar entrega: gerente e inventario
router.post(
  "/solicitudes/:id/entregar",
  verificarRol(1, 3),
  inventarioController.registrarEntrega
);

// ========================================
// MOVIMIENTOS DE INVENTARIO
// GERENTE E INVENTARIO
// ========================================

router.post(
  "/movimientos",
  verificarRol(1, 3),
  inventarioController.registrarMovimiento
);

// ========================================
// GESTIÓN DE MATERIALES
// ========================================

// Consultar materiales: todos los roles
router.get(
  "/",
  verificarRol(1, 2, 3),
  inventarioController.listarMateriales
);

// Buscar material: todos los roles
router.get(
  "/:id",
  verificarRol(1, 2, 3),
  inventarioController.buscarMaterialPorId
);

// Registrar material: gerente e inventario
router.post(
  "/",
  verificarRol(1, 3),
  inventarioController.registrarMaterial
);

// Modificar material: gerente e inventario
router.put(
  "/:id",
  verificarRol(1, 3),
  inventarioController.modificarMaterial
);

module.exports = router;
