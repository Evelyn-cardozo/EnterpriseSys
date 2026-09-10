// Importamos bcrypt para comparar la contraseña
// escrita por el usuario con el hash guardado en PostgreSQL.
const bcrypt = require('bcrypt');

// Importamos el modelo de usuario para buscar
// los datos del usuario en PostgreSQL.
const usuarioModel = require('../models/usuarioModel');


// Función para iniciar sesión
const login = async (req, res) => {

    try {

        // Recibimos los datos enviados desde el formulario
        const { username, password } = req.body;


        // Verificamos que los campos no estén vacíos
        if (!username || !password) {

            return res.status(400).json({
                mensaje: 'Usuario y contraseña son obligatorios'
            });

        }


        // Buscamos el usuario en PostgreSQL
        const usuario = await usuarioModel.buscarPorUsername(username);


        // Si no encontramos el usuario
        if (!usuario) {

            return res.status(401).json({
                mensaje: 'Usuario o contraseña incorrectos'
            });

        }


        // Verificamos si el usuario está activo
        if (usuario.estado !== 'activo') {

            return res.status(403).json({
                mensaje: 'El usuario está inactivo'
            });

        }


        // Comparamos la contraseña escrita por el usuario
        // con el hash almacenado en la base de datos.
        const passwordValida = await bcrypt.compare(
            password,
            usuario.password_hash
        );


        // Si la contraseña no coincide
        if (!passwordValida) {

            return res.status(401).json({
                mensaje: 'Usuario o contraseña incorrectos'
            });

        }


        // Si todo está correcto
        return res.status(200).json({

            mensaje: 'Inicio de sesión exitoso',

            usuario: {
                id_usuario: usuario.id_usuario,
                username: usuario.username,
                email: usuario.email,
                id_rol: usuario.id_rol,
                nombre_rol: usuario.nombre_rol
            }

        });


    } catch (error) {

        // Mostramos el error en la consola
        console.error('Error en el login:', error);

        // Respondemos con error interno del servidor
        return res.status(500).json({
            mensaje: 'Error interno del servidor'
        });

    }

};


// Exportamos la función login
module.exports = {
    login
};