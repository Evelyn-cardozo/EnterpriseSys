//Importamos la conexion se coloca .. para subir el nivel de capa del archivo
const pool = require('../Database/conexion');

//creamos una funcion para buscar por el nombre
const buscarPorUsername = async(username) => {

    //el await significa espera a que PostgreSQL termine la consulta antes de continuar
 const result = await pool.query(
//quiero obtener estos datos del usuario
    `SELECT
    u.id_usuario,
    u.id_rol,
    u.username,
    u.password_hash,
    u.email,
    u.intentos_fallidos,
    u.estado,
    r.nombre_rol
    FROM usuarios u
    INNER JOIN roles r ON u.id_rol = r.id_rol
    WHERE u.username = $1`, [username]
    //buscar el usuario cuyo usuario sea igual al valor que recibio en la variable username
 );
//este codigo retorna la primera fila encontrada asi que devuelve un solo usuario
 return result.rows[0];

};
//esto permite que otro archivo pueda usaer esta funcion
module.exports = {

    buscarPorUsername
};