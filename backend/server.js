const express = require("express");
const path = require("path");

const logger = require("./middlewares/logger");
const librosRouter = require("./routers/libros");

const app = express();
const PORT = 4000;

app.use(logger);
app.use(express.json());

app.use("/assets", express.static(path.join(__dirname, "../assets")));

app.use("/api/libros", librosRouter);

app.get("/", (req, res) => {
  res.json({
    mensaje: "API de Biblioteca Virtual Papiro",
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
