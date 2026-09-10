//obtener la herramienta pool de la libreria pg
//require es lo que nos permite obtener pg
//Pool sirve para administrar las conexiones entre tu aplicación y PostgreSQL.
const {Pool} = require('pg');
//dotenv es una libreria de node.js que sirve para guarda datos de configuracion en un archivo .env, en lugar de escribirlo directamente
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER, 
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});
//esto hace que podemos usar la conexion en otros archivos
module.exports = pool;

