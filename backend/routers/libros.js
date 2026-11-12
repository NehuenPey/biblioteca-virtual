const express = require("express");
const prisma = require("../src/config/database");

const router = express.Router();

// Convierte un registro de PostgreSQL al formato que espera el frontend.
function formatearLibro(libro) {
  return {
    id: libro.id,
    titulo: libro.titulo,
    autor: libro.autor,
    editorial: libro.editorial,
    isbn: libro.isbn,
    genero: libro.genero,
    anio: libro.anio,
    destacado: libro.destacado,
    sinopsis: libro.sinopsis,
    portada: libro.portada,
    disponible: libro.copies.some((copia) => copia.estado === "AVAILABLE"),
  };
}

// GET /api/libros
// Obtiene todos los libros desde PostgreSQL.
router.get("/", async (req, res) => {
  const libros = await prisma.book.findMany({
    include: {
      copies: {
        select: {
          estado: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  res.json(libros.map(formatearLibro));
});

// GET /api/libros/:id
// Obtiene un libro específico por su ID.
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  const libro = await prisma.book.findUnique({
    where: {
      id,
    },
    include: {
      copies: {
        select: {
          estado: true,
        },
      },
    },
  });

  if (!libro) {
    return res.status(404).json({
      error: "Libro no encontrado",
    });
  }

  res.json(formatearLibro(libro));
});

router.post("/", async (req, res) => {
  const {
    titulo,
    autor,
    editorial,
    isbn,
    genero,
    anio,
    sinopsis,
    portada,
    destacado,
  } = req.body;

  // Validar campos obligatorios.
  if (
    typeof titulo !== "string" ||
    !titulo.trim() ||
    typeof autor !== "string" ||
    !autor.trim() ||
    typeof genero !== "string" ||
    !genero.trim()
  ) {
    return res.status(400).json({
      error: "Título, autor y género son obligatorios.",
    });
  }

  // Validar año, si fue proporcionado.
  if (
    anio !== undefined &&
    anio !== null &&
    (!Number.isInteger(anio) || anio < 0)
  ) {
    return res.status(400).json({
      error: "El año debe ser un número entero válido.",
    });
  }

  try {
    const libro = await prisma.book.create({
      data: {
        titulo: titulo.trim(),
        autor: autor.trim(),
        editorial: editorial?.trim() || null,
        isbn: isbn?.trim() || null,
        genero: genero.trim(),
        anio: anio ?? null,
        sinopsis: sinopsis?.trim() || null,
        portada: portada?.trim() || null,
        destacado: destacado ?? false,
      },
      include: {
        copies: {
          select: {
            estado: true,
          },
        },
      },
    });

    return res.status(201).json(formatearLibro(libro));
  } catch (error) {
    // ISBN duplicado.
    if (error.code === "P2002") {
      return res.status(409).json({
        error: "Ya existe un libro con ese ISBN.",
      });
    }

    throw error;
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;

  const camposPermitidos = [
    "titulo",
    "autor",
    "editorial",
    "isbn",
    "genero",
    "anio",
    "sinopsis",
    "portada",
    "destacado",
  ];

  const datos = {};

  // Solo aceptar campos permitidos.
  for (const campo of camposPermitidos) {
    if (Object.prototype.hasOwnProperty.call(req.body, campo)) {
      datos[campo] = req.body[campo];
    }
  }

  if (Object.keys(datos).length === 0) {
    return res.status(400).json({
      error: "Debés proporcionar al menos un campo para actualizar.",
    });
  }

  // Validar campos de texto.
  for (const campo of ["titulo", "autor", "genero"]) {
    if (
      campo in datos &&
      (typeof datos[campo] !== "string" || !datos[campo].trim())
    ) {
      return res.status(400).json({
        error: `El campo ${campo} debe ser un texto no vacío.`,
      });
    }
  }

  // Normalizar textos.
  for (const campo of camposPermitidos) {
    if (campo in datos && typeof datos[campo] === "string") {
      datos[campo] = datos[campo].trim();
    }
  }

  // Convertir textos opcionales vacíos a null.
  for (const campo of ["editorial", "isbn", "sinopsis", "portada"]) {
    if (campo in datos && datos[campo] === "") {
      datos[campo] = null;
    }
  }

  // Validar año.
  if (
    "anio" in datos &&
    datos.anio !== null &&
    (!Number.isInteger(datos.anio) || datos.anio < 0)
  ) {
    return res.status(400).json({
      error: "El año debe ser un número entero válido.",
    });
  }

  // Validar destacado.
  if ("destacado" in datos && typeof datos.destacado !== "boolean") {
    return res.status(400).json({
      error: "El campo destacado debe ser booleano.",
    });
  }

  // Validar campos opcionales.
  for (const campo of ["editorial", "isbn", "sinopsis", "portada"]) {
    if (
      campo in datos &&
      datos[campo] !== null &&
      typeof datos[campo] !== "string"
    ) {
      return res.status(400).json({
        error: `El campo ${campo} debe ser un texto o null.`,
      });
    }
  }

  try {
    const libro = await prisma.book.update({
      where: { id },
      data: datos,
      include: {
        copies: {
          select: {
            estado: true,
          },
        },
      },
    });

    return res.json(formatearLibro(libro));
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        error: "Libro no encontrado.",
      });
    }

    if (error.code === "P2002") {
      return res.status(409).json({
        error: "Ya existe un libro con ese ISBN.",
      });
    }

    throw error;
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const libro = await prisma.book.findUnique({
      where: { id },
      include: {
        copies: {
          include: {
            loans: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!libro) {
      return res.status(404).json({
        error: "Libro no encontrado.",
      });
    }

    const tienePrestamos = libro.copies.some((copia) => copia.loans.length > 0);

    if (tienePrestamos) {
      return res.status(409).json({
        error:
          "No se puede eliminar el libro porque tiene préstamos registrados.",
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.bookCopy.deleteMany({
        where: {
          bookId: id,
        },
      });

      await tx.book.delete({
        where: {
          id,
        },
      });
    });

    return res.json({
      mensaje: "Libro eliminado correctamente.",
      id,
    });
  } catch (error) {
    console.error("Error al eliminar libro:", error);

    return res.status(500).json({
      error: "No se pudo eliminar el libro.",
    });
  }
});

module.exports = router;
