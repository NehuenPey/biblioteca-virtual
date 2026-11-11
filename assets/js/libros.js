// URL de la API. Puede sobrescribirse antes de este script con window.PAPIRO_API_URL.
const API_LIBROS_URL =
  window.PAPIRO_API_URL || "http://localhost:4000/api/libros";

let libros = [];
let promesaCargaLibros = null;

async function cargarLibros() {
  if (!promesaCargaLibros) {
    promesaCargaLibros = fetch(API_LIBROS_URL)
      .then(async (respuesta) => {
        if (!respuesta.ok) {
          throw new Error(`La API respondió con estado ${respuesta.status}.`);
        }

        const datos = await respuesta.json();

        if (!Array.isArray(datos)) {
          throw new Error("La respuesta de la API no tiene el formato esperado.");
        }

        libros = datos;
        return libros;
      })
      .catch((error) => {
        promesaCargaLibros = null;
        console.error("No se pudo cargar el catálogo de Papiro:", error);
        throw error;
      });
  }

  return promesaCargaLibros;
}

function mostrarErrorCarga(contenedor, mensaje = "No pudimos cargar los libros.") {
  if (!contenedor) return;

  contenedor.innerHTML = `
    <p class="estado-carga" role="alert">
      ${mensaje}
      <br>
      Comprobá que el servidor de Papiro esté iniciado e intentá nuevamente.
    </p>
  `;
}
