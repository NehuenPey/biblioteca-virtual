const express = require("express");
const prisma = require("../src/config/database");

const router = express.Router();

const ESTADOS_PERMITIDOS = ["AVAILABLE", "MAINTENANCE", "RETIRED"];

// POST /api/libros/:id/ejemplares
// Registra un nuevo ejemplar para un libro.
router.post("/libros/:id/ejemplares", async (req, res) => {
  const { id: bookId } = req.params;
  const { codigoInventario, estado = "AVAILABLE" } = req.body ?? {};

  // Validar código de inventario.
  if (typeof codigoInventario !== "string" || !codigoInventario.trim()) {
    return res.status(400).json({
      error: "El código de inventario es obligatorio.",
    });
  }

  // No se permite crear ejemplares LOANED sin un préstamo asociado.
  if (!ESTADOS_PERMITIDOS.includes(estado)) {
    return res.status(400).json({
      error: "El estado inicial no es válido.",
    });
  }

  try {
    // Verificar que el libro exista.
    const libro = await prisma.book.findUnique({
      where: { id: bookId },
      select: { id: true },
    });

    if (!libro) {
      return res.status(404).json({
        error: "Libro no encontrado.",
      });
    }

    // Crear el ejemplar.
    const ejemplar = await prisma.bookCopy.create({
      data: {
        bookId,
        codigoInventario: codigoInventario.trim(),
        estado,
      },
      select: {
        id: true,
        bookId: true,
        codigoInventario: true,
        estado: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(201).json(ejemplar);
  } catch (error) {
    // Código de inventario duplicado.
    if (error.code === "P2002") {
      return res.status(409).json({
        error: "Ya existe un ejemplar con ese código de inventario.",
      });
    }

    throw error;
  }
});

// GET /api/libros/:id/ejemplares
// Obtiene todos los ejemplares asociados a un libro.
router.get("/libros/:id/ejemplares", async (req, res) => {
  const { id: bookId } = req.params;

  // Verificar que el libro exista.
  const libro = await prisma.book.findUnique({
    where: { id: bookId },
    select: { id: true },
  });

  if (!libro) {
    return res.status(404).json({
      error: "Libro no encontrado.",
    });
  }

  // Buscar los ejemplares del libro.
  const ejemplares = await prisma.bookCopy.findMany({
    where: { bookId },
    select: {
      id: true,
      bookId: true,
      codigoInventario: true,
      estado: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return res.json({
    libroId: bookId,
    total: ejemplares.length,
    ejemplares,
  });
});

const ESTADOS_CON_PRESTAMO = ["PENDING", "APPROVED", "ACTIVE", "OVERDUE"];

// PATCH /api/ejemplares/:id/estado
// Actualiza el estado de un ejemplar respetando sus préstamos.
router.patch("/ejemplares/:id/estado", async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body ?? {};

  const estadosPermitidos = ["AVAILABLE", "LOANED", "MAINTENANCE", "RETIRED"];

  if (!estadosPermitidos.includes(estado)) {
    return res.status(400).json({
      error: "El estado proporcionado no es válido.",
    });
  }

  try {
    const ejemplar = await prisma.bookCopy.findUnique({
      where: { id },
      include: {
        loans: {
          where: {
            estado: {
              in: ESTADOS_CON_PRESTAMO,
            },
          },
          select: {
            id: true,
            estado: true,
          },
        },
      },
    });

    if (!ejemplar) {
      return res.status(404).json({
        error: "Ejemplar no encontrado.",
      });
    }

    const prestamosActivos = ejemplar.loans.filter(
      (prestamo) =>
        prestamo.estado === "ACTIVE" || prestamo.estado === "OVERDUE",
    );

    const tieneSolicitudPendienteAprobada = ejemplar.loans.some(
      (prestamo) =>
        prestamo.estado === "PENDING" || prestamo.estado === "APPROVED",
    );

    const tienePrestamoBloqueante = ejemplar.loans.length > 0;

    // LOANED requiere un préstamo activo o vencido.
    if (
      estado === "LOANED" &&
      (prestamosActivos.length !== 1 || tieneSolicitudPendienteAprobada)
    ) {
      return res.status(409).json({
        error:
          "LOANED requiere exactamente un préstamo activo o vencido y ninguna solicitud pendiente o aprobada.",
      });
    }

    // Los otros estados no son compatibles con préstamos pendientes,
    // aprobados, activos o vencidos.
    if (estado !== "LOANED" && tienePrestamoBloqueante) {
      return res.status(409).json({
        error:
          "No se puede cambiar el estado: el ejemplar tiene préstamos pendientes, aprobados o activos.",
      });
    }

    const ejemplarActualizado = await prisma.bookCopy.update({
      where: { id },
      data: { estado },
      select: {
        id: true,
        bookId: true,
        codigoInventario: true,
        estado: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.json(ejemplarActualizado);
  } catch (error) {
    console.error("Error al actualizar el estado del ejemplar:", error);

    return res.status(500).json({
      error: "No se pudo actualizar el estado del ejemplar.",
    });
  }
});

module.exports = router;
