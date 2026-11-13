const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../src/config/database");

const router = express.Router();
const { generarToken } = require("../src/utils/jwt");
const verificarToken = require("../middlewares/verificarToken");
const verificarRol = require("../middlewares/verificarRol");

const SALT_ROUNDS = 12;

// POST /api/auth/registro
// Registra un nuevo usuario con rol READER.
router.post("/registro", async (req, res) => {
  try {
    const { nombre, apellido, email, password } = req.body ?? {};

    // Validar campos obligatorios.
    if (
      typeof nombre !== "string" ||
      typeof apellido !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !nombre.trim() ||
      !apellido.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        error: "Todos los campos son obligatorios.",
      });
    }

    const emailNormalizado = email.trim().toLowerCase();

    // Validar formato básico del email.
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado);

    if (!emailValido) {
      return res.status(400).json({
        error: "El formato del email no es válido.",
      });
    }

    // Validar longitud de contraseña.
    if (password.length < 8) {
      return res.status(400).json({
        error: "La contraseña debe tener al menos 8 caracteres.",
      });
    }

    // Comprobar si el email ya está registrado.
    const usuarioExistente = await prisma.user.findUnique({
      where: {
        email: emailNormalizado,
      },
    });

    if (usuarioExistente) {
      return res.status(409).json({
        error: "Ya existe una cuenta registrada con ese email.",
      });
    }

    // Hashear contraseña.
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Crear usuario.
    const usuario = await prisma.user.create({
      data: {
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: emailNormalizado,
        passwordHash,
        role: "READER",
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        role: true,
        activo: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      mensaje: "Usuario registrado correctamente.",
      usuario,
    });
  } catch (error) {
    console.error("Error al registrar usuario:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        error: "Ya existe una cuenta registrada con ese email.",
      });
    }

    return res.status(500).json({
      error: "Error interno al registrar el usuario.",
    });
  }
});

// POST /api/auth/login
// Autentica un usuario y devuelve un JWT.
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    // Validar campos obligatorios.
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        error: "Email y contraseña son obligatorios.",
      });
    }

    const emailNormalizado = email.trim().toLowerCase();

    // Buscar usuario.
    const usuario = await prisma.user.findUnique({
      where: {
        email: emailNormalizado,
      },
    });

    // Mismo mensaje para email inexistente y contraseña incorrecta.
    if (!usuario) {
      return res.status(401).json({
        error: "Email o contraseña incorrectos.",
      });
    }

    // Comprobar que la cuenta esté activa.
    if (!usuario.activo) {
      return res.status(403).json({
        error: "La cuenta se encuentra deshabilitada.",
      });
    }

    // Comparar contraseña con el hash almacenado.
    const passwordValida = await bcrypt.compare(password, usuario.passwordHash);

    if (!passwordValida) {
      return res.status(401).json({
        error: "Email o contraseña incorrectos.",
      });
    }

    // Generar JWT.
    const token = generarToken({
      id: usuario.id,
      role: usuario.role,
    });

    return res.status(200).json({
      mensaje: "Inicio de sesión exitoso.",
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        role: usuario.role,
      },
    });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);

    return res.status(500).json({
      error: "Error interno al iniciar sesión.",
    });
  }
});

router.get("/perfil", verificarToken, (req, res) => {
  return res.status(200).json({
    mensaje: "Autenticación verificada correctamente.",
    usuario: req.usuario,
  });
});
router.get("/admin", verificarToken, verificarRol("ADMIN"), (req, res) => {
  return res.status(200).json({
    mensaje: "Acceso administrativo autorizado.",
    usuario: req.usuario,
  });
});

module.exports = router;
