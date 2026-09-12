const express = require('express');

const cors = require('cors');
const path = require('path');

// Conexión con PostgreSQL
const pool = require('./Database/conexion.js');

// Rutas de usuarios
const usuarioRoutes = require('./routers/usuarioRouters.js');

const app = express();
// Permite acceder a archivos CSS, imágenes y JavaScript
app.use(express.static(path.join(__dirname, 'public')));


// ========================================
// CONFIGURACIÓN DEL SERVIDOR
// ========================================

// Permite conexiones desde otros orígenes
app.use(cors());

// Permite recibir datos en formato JSON
app.use(express.json());

// Permite recibir datos enviados desde formularios
app.use(express.urlencoded({ extended: true }));


// ========================================
// MOSTRAR PÁGINA DE LOGIN
// ========================================

// Cuando se accede a /login
// se muestra el archivo login.html
app.get('/login', (req, res) => {

    res.sendFile(
        path.join(__dirname, 'views', 'login.html')
    );

});

app.get('/inicio', (req, res) => {

    res.sendFile(
        path.join(__dirname, 'views', 'inicio.html')
    );

});
// ========================================
// RUTA DE PRUEBA
// ========================================

// Esta ruta sirve para comprobar
// que Node.js está conectado correctamente
// con PostgreSQL.
app.get('/', async (req, res) => {

    try {

        // Ejecutamos una consulta sencilla
        // para comprobar la conexión
        const resultado = await pool.query('SELECT NOW()');

        // Enviamos la respuesta
        res.json({
            mensaje: 'Conexion exitosa con PostgreSQL',
            fecha: resultado.rows[0].now
        });

    } catch (error) {

        // Mostramos el error en la consola
        console.error(error);

        // Enviamos un mensaje de error
        res.status(500).json({
            mensaje: 'Error al conectar con la base de datos'
        });

    }

});


// ========================================
// RUTAS DE USUARIOS
// ========================================

// Todas las rutas relacionadas con usuarios
// comenzarán con /usuarios
//
// Por ejemplo:
// POST /usuarios/login
app.use('/usuarios', usuarioRoutes);


// ========================================
// INICIAR SERVIDOR
// ========================================
const puerto = 3000;

console.log('1. Preparando servidor...');

const servidor = app.listen(puerto, () => {

    console.log('2. SERVIDOR INICIADO');
    console.log(`3. http://localhost:${puerto}`);

});

servidor.on('error', (error) => {

    console.error('4. ERROR DEL SERVIDOR:', error);

});