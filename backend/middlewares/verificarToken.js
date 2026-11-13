const prisma = require("../src/config/database");
const { verificarJWT } = require("../src/utils/jwt");

const verificarToken = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Se requiere un token de autenticación.",
      });
    }

    const token = authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        error: "El token no es válido.",
      });
    }

    const payload = verificarJWT(token);

    if (!payload.id || !payload.role) {
      return res.status(401).json({
        error: "El token no contiene información válida.",
      });
    }

    const usuario = await prisma.user.findUnique({
      where: {
        id: payload.id,
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        role: true,
        activo: true,
      },
    });

    if (!usuario || !usuario.activo) {
      return res.status(401).json({
        error: "El usuario no existe o su cuenta está deshabilitada.",
      });
    }

    req.usuario = {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      role: usuario.role,
    };

    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        error: "El token es inválido o ha expirado.",
      });
    }

    console.error("Error al verificar el token:", error);

    return res.status(500).json({
      error: "Error interno al verificar la autenticación.",
    });
  }
};

module.exports = verificarToken;
