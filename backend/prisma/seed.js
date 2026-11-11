require("dotenv").config();

const prisma = require("../src/config/database");
const libros = require("../data/libros");

async function main() {
  console.log("Iniciando carga de libros en PostgreSQL...");

  for (const libro of libros) {
    const book = await prisma.book.upsert({
      where: {
        id: libro.id,
      },
      update: {
        titulo: libro.titulo,
        autor: libro.autor,
        editorial: libro.editorial || null,
        isbn: libro.isbn || null,
        genero: libro.genero,
        anio: libro.anio || null,
        sinopsis: libro.sinopsis || null,
        portada: libro.portada || null,
        destacado: Boolean(libro.destacado),
      },
      create: {
        id: libro.id,
        titulo: libro.titulo,
        autor: libro.autor,
        editorial: libro.editorial || null,
        isbn: libro.isbn || null,
        genero: libro.genero,
        anio: libro.anio || null,
        sinopsis: libro.sinopsis || null,
        portada: libro.portada || null,
        destacado: Boolean(libro.destacado),
      },
    });

    const codigoInventario = `INV-${libro.id.replace("libro-", "")}`;

    await prisma.bookCopy.upsert({
      where: {
        codigoInventario,
      },
      update: {
        bookId: book.id,
        estado: libro.disponible ? "AVAILABLE" : "MAINTENANCE",
      },
      create: {
        bookId: book.id,
        codigoInventario,
        estado: libro.disponible ? "AVAILABLE" : "MAINTENANCE",
      },
    });

    console.log(`Libro procesado: ${libro.titulo}`);
  }

  console.log(`Carga finalizada. ${libros.length} libros procesados.`);
}

main()
  .catch((error) => {
    console.error("Error durante la carga inicial:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
