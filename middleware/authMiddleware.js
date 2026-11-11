
// ========================================
// VERIFICAR SI EL USUARIO INICIÓ SESIÓN
// ========================================

const verificarSesion = (req, res, next) => {
  if (!req.session || !req.session.usuario) {
    return res.status(401).json({
      mensaje: "Debés iniciar sesión para acceder",
    });
  }

  next();
};

// ========================================
// VERIFICAR PERMISOS SEGÚN EL ROL
// ========================================

const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.session || !req.session.usuario) {
      return res.status(401).json({
        mensaje: "Debés iniciar sesión",
      });
    }

    const idRol = Number(req.session.usuario.id_rol);

    if (!rolesPermitidos.includes(idRol)) {
      return res.status(403).json({
        mensaje: "No tenés permisos para realizar esta acción",
      });
    }

    next();
  };
};

module.exports = {
  verificarSesion,
  verificarRol,
};
