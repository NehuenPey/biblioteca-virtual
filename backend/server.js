const express = require("express");

const logger = require("./middlewares/logger");

const librosRouter = require("./routers/libros");

const app = express();

const PORT = 4000;

// =========================================================
// MIDDLEWARES
// =========================================================

app.use(logger);

app.use(express.json());

// =========================================================
// RUTAS
// =========================================================

app.use("/api/libros", librosRouter);

// =========================================================
// RUTA PRINCIPAL
// =========================================================

app.get("/", (req, res) => {
  res.json({
    mensaje: "API de Biblioteca Virtual Papiro",
  });
});

// =========================================================
// MANEJADOR 404
// =========================================================

app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
  });
});

// =========================================================
// MANEJADOR CENTRALIZADO DE ERRORES
// =========================================================

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    error: "Error interno del servidor",
  });
});

// =========================================================
// INICIAR SERVIDOR
// =========================================================

app.listen(PORT, () => {
  console.log(`Servidor Papiro ejecutándose en http://localhost:${PORT}`);
});
