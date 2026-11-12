const express = require("express");
require("dotenv").config();
const session = require("express-session");
const path = require("path");

// Conexión con PostgreSQL
const pool = require("./Database/conexion.js");

// Middleware de autenticación
const {
  verificarSesion,
  verificarRol,
} = require("./middleware/authMiddleware");

// Rutas
const usuarioRouters = require("./routers/usuarioRouters.js");
const clienteRouters = require("./routers/clienteRouters.js");
const obraRouters = require("./routers/obraRouters.js");
const inventarioRouters = require("./routers/inventarioRouters.js");
const inicioRouters = require("./routers/inicioRouters.js");
const app = express();

// ========================================
// CONFIGURACIÓN DEL SERVIDOR
// ========================================

// Permite acceder a CSS, imágenes y JavaScript
app.use(express.static(path.join(__dirname, "public")));

// Permite recibir JSON
app.use(express.json());

// Permite recibir formularios
app.use(express.urlencoded({ extended: true }));

// Configuración de sesiones
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60,
    },
  }),
);

// ========================================
// PROTECCIÓN DE PÁGINAS SEGÚN EL ROL
// ========================================

const protegerPagina = (...rolesPermitidos) => {
  return (req, res, next) => {
    // Verificar sesión
    if (!req.session || !req.session.usuario) {
      return res.redirect("/login");
    }

    // Obtener el rol del usuario
    const idRol = Number(req.session.usuario.id_rol);

    // Verificar permisos
    if (!rolesPermitidos.includes(idRol)) {
      return res.redirect("/inicio");
    }

    next();
  };
};

// ========================================
// PÁGINA DE LOGIN
// ========================================

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

// ========================================
// PÁGINA PRINCIPAL
// TODOS LOS ROLES
// ========================================

app.get("/inicio", protegerPagina(1, 2, 3), (req, res) => {
  res.sendFile(path.join(__dirname, "views", "inicio.html"));
});

// ========================================
// CLIENTES
// SOLO GERENTE
// ========================================

app.get("/clientes-pagina", protegerPagina(1), (req, res) => {
  res.sendFile(path.join(__dirname, "views", "cliente.html"));
});

// ========================================
// OBRAS
// GERENTE Y JEFE DE OBRA
// ========================================

app.get("/obras-pagina", protegerPagina(1, 2), (req, res) => {
  res.sendFile(path.join(__dirname, "views", "obra.html"));
});

// ========================================
// INVENTARIO
// LOS TRES ROLES
// ========================================

app.get("/inventario-pagina", protegerPagina(1, 2, 3), (req, res) => {
  res.sendFile(path.join(__dirname, "views", "inventario.html"));
});

// ========================================
// RUTA DE PRUEBA DE POSTGRESQL
// ========================================

app.get("/", async (req, res) => {
  try {
    const resultado = await pool.query("SELECT NOW()");

    res.json({
      mensaje: "Conexion exitosa con PostgreSQL",
      fecha: resultado.rows[0].now,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      mensaje: "Error al conectar con la base de datos",
    });
  }
});

// ========================================
// RUTAS DE USUARIOS Y INICIO
// ========================================
app.use("/inicio", inicioRouters);
app.use("/usuarios", usuarioRouters);

// ========================================
// RUTAS DE CLIENTES
// ========================================

app.use("/clientes", clienteRouters);

app.get("/prueba-clientes", (req, res) => {
  res.send("La ruta de prueba funciona");
});

// ========================================
// RUTAS DE OBRAS
// ========================================

app.use("/obras", obraRouters);

// ========================================
// RUTAS DE INVENTARIO
// ========================================

app.use("/materiales", inventarioRouters);

// PRUEBA DE REPORTES

// ========================================
// REPORTES
// TODOS LOS ROLES
// ========================================

app.get("/reportes-pagina", protegerPagina(1, 2, 3), (req, res) => {
  const archivo = path.join(__dirname, "views", "reportes.html");

  console.log("Solicitando página de reportes:", archivo);

  res.sendFile(archivo, (error) => {
    if (error) {
      console.error("Error al enviar reportes.html:", error);

      if (!res.headersSent) {
        res
          .status(error.statusCode || 500)
          .send("No se pudo cargar la página de reportes.");
      }
    }
  });
});
// ========================================
// CONFIGURACIÓN
// TODOS LOS ROLES
// ========================================

app.get("/configuracion-pagina", protegerPagina(1, 2, 3), (req, res) => {
  res.sendFile(path.join(__dirname, "views", "configuracion.html"));
});
// ========================================
// INICIAR SERVIDOR
// ========================================

const puerto = 3000;

console.log("1. Preparando servidor...");

const servidor = app.listen(puerto, () => {
  console.log("2. SERVIDOR INICIADO");
  console.log(`3. http://localhost:${puerto}`);
});

servidor.on("error", (error) => {
  console.error("4. ERROR DEL SERVIDOR:", error);
});
