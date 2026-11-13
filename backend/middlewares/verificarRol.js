const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({
        error: "Se requiere autenticación para acceder a este recurso.",
      });
    }

    if (!rolesPermitidos.includes(req.usuario.role)) {
      return res.status(403).json({
        error: "No tenés permisos para realizar esta operación.",
      });
    }

    next();
  };
};

module.exports = verificarRol;
