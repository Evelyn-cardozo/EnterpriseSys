const express = require("express");
const router = express.Router();

const inicioController = require("../controllers/inicioController");

const {
  verificarSesion,
  verificarRol,
} = require("../middleware/authMiddleware");

// Proteger las consultas del panel
router.use(verificarSesion);
router.use(verificarRol(1, 2, 3));

// Obtener información del panel
router.get("/datos", inicioController.obtenerDatosInicio);

module.exports = router;
