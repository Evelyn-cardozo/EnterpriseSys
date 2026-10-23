// Importamos Express
const express = require("express");

// Creamos el router
const router = express.Router();

// Importamos el controlador de usuarios
const usuarioController = require("../controllers/usuarioController");

// Ruta para iniciar sesión
router.post("/login", usuarioController.login);
router.post("/logout", usuarioController.logout);

// Exportamos las rutas
module.exports = router;
