const express = require("express");
const prisma = require("../src/config/database");

const verificarToken = require("../middlewares/verificarToken");
const verificarRol = require("../middlewares/verificarRol");

const router = express.Router();

const ESTADOS_ABIERTOS = ["PENDING", "APPROVED", "ACTIVE", "OVERDUE"];
const DIAS_PRESTAMO = 14;

// POST /api/prestamos
// Registra una solicitud de préstamo.
router.post("/", verificarToken, verificarRol("READER"), async (req, res) => {
  try {
    const { bookCopyId } = req.body ?? {};

    if (typeof bookCopyId !== "string" || !bookCopyId.trim()) {
      return res.status(400).json({
        error: "El ID del ejemplar es obligatorio.",
      });
    }

    const solicitud = await prisma.$transaction(
      async (tx) => {
        const ejemplar = await tx.bookCopy.findUnique({
          where: {
            id: bookCopyId.trim(),
          },
          select: {
            id: true,
            codigoInventario: true,
            estado: true,
            book: {
              select: {
                id: true,
                titulo: true,
                autor: true,
              },
            },
          },
        });

        if (!ejemplar) {
          const error = new Error("EJEMPLAR_NO_EXISTE");
          throw error;
        }

        if (ejemplar.estado !== "AVAILABLE") {
          const error = new Error("EJEMPLAR_NO_DISPONIBLE");
          throw error;
        }

        const prestamoExistente = await tx.loan.findFirst({
          where: {
            bookCopyId: ejemplar.id,
            estado: {
              in: ESTADOS_ABIERTOS,
            },
          },
        });

        if (prestamoExistente) {
          const error = new Error("EJEMPLAR_CON_SOLICITUD_ABIERTA");
          throw error;
        }

        return await tx.loan.create({
          data: {
            userId: req.usuario.id,
            bookCopyId: ejemplar.id,
            estado: "PENDING",
          },
          include: {
            bookCopy: {
              select: {
                id: true,
                codigoInventario: true,
                book: {
                  select: {
                    titulo: true,
                    autor: true,
                  },
                },
              },
            },
          },
        });
      },
      {
        isolationLevel: "Serializable",
      },
    );

    return res.status(201).json({
      mensaje: "Solicitud de préstamo registrada correctamente.",
      prestamo: solicitud,
    });
  } catch (error) {
    if (error.message === "EJEMPLAR_NO_EXISTE") {
      return res.status(404).json({
        error: "El ejemplar solicitado no existe.",
      });
    }

    if (
      error.message === "EJEMPLAR_NO_DISPONIBLE" ||
      error.message === "EJEMPLAR_CON_SOLICITUD_ABIERTA"
    ) {
      return res.status(409).json({
        error: "El ejemplar no está disponible para una nueva solicitud.",
      });
    }

    // Conflicto de serialización por operaciones simultáneas.
    if (error.code === "P2034") {
      return res.status(409).json({
        error: "El ejemplar está siendo solicitado. Intentá nuevamente.",
      });
    }

    console.error("Error al solicitar préstamo:", error);

    return res.status(500).json({
      error: "Error interno al registrar la solicitud.",
    });
  }
});

// GET /api/prestamos/mis-prestamos
// Consulta los préstamos del usuario autenticado.
router.get(
  "/mis-prestamos",
  verificarToken,
  verificarRol("READER"),
  async (req, res) => {
    try {
      const prestamos = await prisma.loan.findMany({
        where: {
          userId: req.usuario.id,
        },
        include: {
          bookCopy: {
            select: {
              id: true,
              codigoInventario: true,
              estado: true,
              book: {
                select: {
                  id: true,
                  titulo: true,
                  autor: true,
                  portada: true,
                },
              },
            },
          },
        },
        orderBy: {
          fechaSolicitud: "desc",
        },
      });

      return res.status(200).json({
        total: prestamos.length,
        prestamos,
      });
    } catch (error) {
      console.error("Error al consultar préstamos:", error);

      return res.status(500).json({
        error: "Error interno al consultar los préstamos.",
      });
    }
  },
);
// GET /api/prestamos
// Consulta todos los préstamos de la biblioteca (ADMIN).
router.get("/", verificarToken, verificarRol("ADMIN"), async (req, res) => {
  try {
    const prestamos = await prisma.loan.findMany({
      include: {
        user: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        bookCopy: {
          select: {
            id: true,
            codigoInventario: true,
            estado: true,
            book: {
              select: {
                id: true,
                titulo: true,
                autor: true,
              },
            },
          },
        },
      },
      orderBy: {
        fechaSolicitud: "desc",
      },
    });

    return res.status(200).json({
      total: prestamos.length,
      prestamos,
    });
  } catch (error) {
    console.error("Error al consultar todos los préstamos:", error);

    return res.status(500).json({
      error: "Error interno al consultar los préstamos.",
    });
  }
});

// PATCH /api/prestamos/:id/aprobar
// Aprueba una solicitud de préstamo (ADMIN).
router.patch(
  "/:id/aprobar",
  verificarToken,
  verificarRol("ADMIN"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || !id.trim()) {
        return res.status(400).json({
          error: "El ID del préstamo es obligatorio.",
        });
      }

      const prestamo = await prisma.$transaction(async (tx) => {
        const existente = await tx.loan.findUnique({
          where: { id },
          include: {
            bookCopy: true,
          },
        });

        if (!existente) {
          throw new Error("PRESTAMO_NO_EXISTE");
        }

        if (existente.estado !== "PENDING") {
          throw new Error("ESTADO_INVALIDO");
        }

        if (existente.bookCopy.estado !== "AVAILABLE") {
          throw new Error("EJEMPLAR_NO_DISPONIBLE");
        }

        return await tx.loan.update({
          where: { id },
          data: {
            estado: "APPROVED",
          },
          include: {
            user: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                email: true,
              },
            },
            bookCopy: {
              include: {
                book: true,
              },
            },
          },
        });
      });

      return res.status(200).json({
        mensaje: "Solicitud de préstamo aprobada correctamente.",
        prestamo,
      });
    } catch (error) {
      if (error.message === "PRESTAMO_NO_EXISTE") {
        return res.status(404).json({
          error: "El préstamo solicitado no existe.",
        });
      }

      if (error.message === "ESTADO_INVALIDO") {
        return res.status(409).json({
          error: "Solo se pueden aprobar solicitudes pendientes.",
        });
      }

      if (error.message === "EJEMPLAR_NO_DISPONIBLE") {
        return res.status(409).json({
          error: "El ejemplar ya no está disponible.",
        });
      }

      if (error.code === "P2034") {
        return res.status(409).json({
          error:
            "El préstamo fue modificado simultáneamente. Intentá nuevamente.",
        });
      }

      console.error("Error al aprobar préstamo:", error);

      return res.status(500).json({
        error: "Error interno al aprobar el préstamo.",
      });
    }
  },
);

// PATCH /api/prestamos/:id/entregar
// Registra la entrega física de un ejemplar (ADMIN).
router.patch(
  "/:id/entregar",
  verificarToken,
  verificarRol("ADMIN"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || !id.trim()) {
        return res.status(400).json({
          error: "El ID del préstamo es obligatorio.",
        });
      }

      const prestamo = await prisma.$transaction(
        async (tx) => {
          const existente = await tx.loan.findUnique({
            where: { id },
            include: {
              bookCopy: true,
            },
          });

          if (!existente) {
            throw new Error("PRESTAMO_NO_EXISTE");
          }

          if (existente.estado !== "APPROVED") {
            throw new Error("ESTADO_INVALIDO");
          }

          if (existente.bookCopy.estado !== "AVAILABLE") {
            throw new Error("EJEMPLAR_NO_DISPONIBLE");
          }

          const fechaPrestamo = new Date();
          const fechaVencimiento = new Date(fechaPrestamo);

          fechaVencimiento.setUTCDate(
            fechaVencimiento.getUTCDate() + DIAS_PRESTAMO,
          );

          // Actualización condicional del préstamo.
          const prestamoActualizado = await tx.loan.updateMany({
            where: {
              id,
              estado: "APPROVED",
            },
            data: {
              estado: "ACTIVE",
              fechaPrestamo,
              fechaVencimiento,
            },
          });

          if (prestamoActualizado.count !== 1) {
            throw new Error("PRESTAMO_MODIFICADO");
          }

          // Actualización condicional del ejemplar.
          const ejemplarActualizado = await tx.bookCopy.updateMany({
            where: {
              id: existente.bookCopyId,
              estado: "AVAILABLE",
            },
            data: {
              estado: "LOANED",
            },
          });

          if (ejemplarActualizado.count !== 1) {
            throw new Error("EJEMPLAR_NO_DISPONIBLE");
          }

          return await tx.loan.findUnique({
            where: { id },
            include: {
              user: {
                select: {
                  id: true,
                  nombre: true,
                  apellido: true,
                  email: true,
                },
              },
              bookCopy: {
                include: {
                  book: true,
                },
              },
            },
          });
        },
        {
          isolationLevel: "Serializable",
        },
      );

      return res.status(200).json({
        mensaje: "Entrega del préstamo registrada correctamente.",
        diasPrestamo: DIAS_PRESTAMO,
        prestamo,
      });
    } catch (error) {
      if (error.message === "PRESTAMO_NO_EXISTE") {
        return res.status(404).json({
          error: "El préstamo solicitado no existe.",
        });
      }

      if (error.message === "ESTADO_INVALIDO") {
        return res.status(409).json({
          error: "Solo se pueden entregar préstamos aprobados.",
        });
      }

      if (error.message === "EJEMPLAR_NO_DISPONIBLE") {
        return res.status(409).json({
          error: "El ejemplar ya no está disponible.",
        });
      }

      if (error.message === "PRESTAMO_MODIFICADO") {
        return res.status(409).json({
          error: "El préstamo fue modificado. Intentá nuevamente.",
        });
      }

      if (error.code === "P2034") {
        return res.status(409).json({
          error:
            "El préstamo o ejemplar fue modificado simultáneamente. Intentá nuevamente.",
        });
      }

      console.error("Error al registrar entrega:", error);

      return res.status(500).json({
        error: "Error interno al registrar la entrega.",
      });
    }
  },
);
// PATCH /api/prestamos/:id/devolver
// Registra la devolución de un ejemplar (ADMIN).
router.patch(
  "/:id/devolver",
  verificarToken,
  verificarRol("ADMIN"),
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!id || !id.trim()) {
        return res.status(400).json({
          error: "El ID del préstamo es obligatorio.",
        });
      }

      const prestamo = await prisma.$transaction(
        async (tx) => {
          const existente = await tx.loan.findUnique({
            where: { id },
            include: {
              bookCopy: true,
            },
          });

          if (!existente) {
            throw new Error("PRESTAMO_NO_EXISTE");
          }

          if (!["ACTIVE", "OVERDUE"].includes(existente.estado)) {
            throw new Error("ESTADO_INVALIDO");
          }

          if (existente.bookCopy.estado !== "LOANED") {
            throw new Error("EJEMPLAR_ESTADO_INVALIDO");
          }

          const fechaDevolucion = new Date();

          const prestamoActualizado = await tx.loan.updateMany({
            where: {
              id,
              estado: {
                in: ["ACTIVE", "OVERDUE"],
              },
            },
            data: {
              estado: "RETURNED",
              fechaDevolucion,
            },
          });

          if (prestamoActualizado.count !== 1) {
            throw new Error("PRESTAMO_MODIFICADO");
          }

          const ejemplarActualizado = await tx.bookCopy.updateMany({
            where: {
              id: existente.bookCopyId,
              estado: "LOANED",
            },
            data: {
              estado: "AVAILABLE",
            },
          });

          if (ejemplarActualizado.count !== 1) {
            throw new Error("EJEMPLAR_ESTADO_INVALIDO");
          }

          return await tx.loan.findUnique({
            where: { id },
            include: {
              user: {
                select: {
                  id: true,
                  nombre: true,
                  apellido: true,
                  email: true,
                },
              },
              bookCopy: {
                include: {
                  book: true,
                },
              },
            },
          });
        },
        {
          isolationLevel: "Serializable",
        },
      );

      return res.status(200).json({
        mensaje: "Devolución registrada correctamente.",
        prestamo,
      });
    } catch (error) {
      if (error.message === "PRESTAMO_NO_EXISTE") {
        return res.status(404).json({
          error: "El préstamo solicitado no existe.",
        });
      }

      if (error.message === "ESTADO_INVALIDO") {
        return res.status(409).json({
          error: "Solo se pueden devolver préstamos activos o vencidos.",
        });
      }

      if (error.message === "EJEMPLAR_ESTADO_INVALIDO") {
        return res.status(409).json({
          error: "El ejemplar no se encuentra registrado como prestado.",
        });
      }

      if (error.message === "PRESTAMO_MODIFICADO") {
        return res.status(409).json({
          error: "El préstamo fue modificado. Intentá nuevamente.",
        });
      }

      if (error.code === "P2034") {
        return res.status(409).json({
          error:
            "El préstamo o ejemplar fue modificado simultáneamente. Intentá nuevamente.",
        });
      }

      console.error("Error al registrar devolución:", error);

      return res.status(500).json({
        error: "Error interno al registrar la devolución.",
      });
    }
  },
);

module.exports = router;
