const express = require("express");
const path = require("path");

const logger = require("./middlewares/logger");
const librosRouter = require("./routers/libros");

const app = express();
const PORT = process.env.PORT || 4000;

// Permite que el frontend servido por Live Server consulte la API.
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(logger);
app.use(express.json());

app.use("/assets", express.static(path.join(__dirname, "../assets")));
app.use("/api/libros", librosRouter);

app.get("/", (req, res) => {
  res.json({
    mensaje: "API de Biblioteca Virtual Papiro",
    endpoints: ["/api/libros", "/api/libros/:id"],
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
  });
});

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    error: "Error interno del servidor",
  });
});

app.listen(PORT, () => {
  console.log(`Servidor Papiro ejecutándose en http://localhost:${PORT}`);
});
