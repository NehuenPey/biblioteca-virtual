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

module.exports = router;
