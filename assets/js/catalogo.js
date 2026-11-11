const contenedorLibros = document.getElementById("contenedor-libros");
const buscadorLibros = document.getElementById("buscador-libros");
const filtroGenero = document.getElementById("filtro-genero");
const filtroDisponibilidad = document.getElementById("filtro-disponibilidad");
const ordenCatalogo = document.getElementById("orden-catalogo");
const botonLimpiar = document.getElementById("limpiar-filtros");
const resumenResultados = document.getElementById("resumen-resultados");
const totalLibros = document.getElementById("total-libros");
const paginacion = document.getElementById("paginacion");

const LIBROS_POR_PAGINA = 8;
let paginaActual = 1;
let librosFiltrados = [];

function escaparHTML(valor = "") {
  return String(valor).replace(/[&<>"']/g, (caracter) => {
    const entidades = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return entidades[caracter];
  });
}

function normalizarTexto(valor = "") {
  return String(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();
}

function mostrarEstado(mensaje, tipo = "info") {
  contenedorLibros.innerHTML = "";
  const estado = document.createElement("p");
  estado.className = `estado-carga estado-${tipo}`;
  estado.textContent = mensaje;
  contenedorLibros.appendChild(estado);
}

function cargarOpcionesGenero(listaLibros) {
  const generos = [...new Set(listaLibros.map((libro) => libro.genero).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "es"));

  filtroGenero.innerHTML = '<option value="">Todos los géneros</option>';

  generos.forEach((genero) => {
    const opcion = document.createElement("option");
    opcion.value = genero;
    opcion.textContent = genero;
    filtroGenero.appendChild(opcion);
  });
}

function obtenerLibrosFiltrados() {
  const busqueda = normalizarTexto(buscadorLibros.value);
  const generoSeleccionado = filtroGenero.value;
  const disponibilidadSeleccionada = filtroDisponibilidad.value;

  const resultados = libros.filter((libro) => {
    const coincideBusqueda = [
      libro.titulo,
      libro.autor,
      libro.genero,
      libro.isbn,
    ].some((dato) => normalizarTexto(dato).includes(busqueda));

    const coincideGenero =
      !generoSeleccionado || libro.genero === generoSeleccionado;

    const coincideDisponibilidad =
      !disponibilidadSeleccionada ||
      (disponibilidadSeleccionada === "disponible" && libro.disponible) ||
      (disponibilidadSeleccionada === "prestado" && !libro.disponible);

    return coincideBusqueda && coincideGenero && coincideDisponibilidad;
  });

  return ordenarLibros(resultados);
}

function ordenarLibros(lista) {
  const orden = ordenCatalogo.value;
  const copia = [...lista];

  const comparadores = {
    "titulo-asc": (a, b) => a.titulo.localeCompare(b.titulo, "es"),
    "titulo-desc": (a, b) => b.titulo.localeCompare(a.titulo, "es"),
    "autor-asc": (a, b) => a.autor.localeCompare(b.autor, "es"),
    "anio-desc": (a, b) => Number(b.anio) - Number(a.anio),
    "anio-asc": (a, b) => Number(a.anio) - Number(b.anio),
  };

  return copia.sort(comparadores[orden] || comparadores["titulo-asc"]);
}

function crearTarjetaLibro(libro) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "tarjeta-libro";

  const disponibilidad = libro.disponible
    ? '<span class="disponible">Disponible</span>'
    : '<span class="prestado">No disponible</span>';

  tarjeta.innerHTML = `
    <a href="libro.html?id=${encodeURIComponent(libro.id)}" class="tarjeta-enlace">
      <div class="portada-libro">
        <img
          src="${escaparHTML(libro.portada)}"
          alt="Portada de ${escaparHTML(libro.titulo)}"
          loading="lazy"
        >
      </div>
      <div class="informacion-libro">
        <h2>${escaparHTML(libro.titulo)}</h2>
        <p class="autor">${escaparHTML(libro.autor)}</p>
        <p class="genero">${escaparHTML(libro.genero)}</p>
        ${disponibilidad}
      </div>
    </a>
  `;

  return tarjeta;
}

function renderizarLibros() {
  const totalResultados = librosFiltrados.length;
  const totalPaginas = Math.ceil(totalResultados / LIBROS_POR_PAGINA);

  if (totalResultados === 0) {
    mostrarEstado("No encontramos libros con esos criterios. Probá modificar o limpiar los filtros.");
    resumenResultados.textContent = "No hay resultados para mostrar.";
    paginacion.hidden = true;
    paginacion.innerHTML = "";
    return;
  }

  if (paginaActual > totalPaginas) {
    paginaActual = totalPaginas;
  }

  const inicio = (paginaActual - 1) * LIBROS_POR_PAGINA;
  const librosPagina = librosFiltrados.slice(inicio, inicio + LIBROS_POR_PAGINA);

  contenedorLibros.innerHTML = "";
  librosPagina.forEach((libro) => {
    contenedorLibros.appendChild(crearTarjetaLibro(libro));
  });

  const desde = inicio + 1;
  const hasta = Math.min(inicio + LIBROS_POR_PAGINA, totalResultados);
  resumenResultados.textContent =
    `Mostrando ${desde}–${hasta} de ${totalResultados} ${totalResultados === 1 ? "libro" : "libros"}`;

  renderizarPaginacion(totalPaginas);
}

function renderizarPaginacion(totalPaginas) {
  paginacion.innerHTML = "";

  if (totalPaginas <= 1) {
    paginacion.hidden = true;
    return;
  }

  paginacion.hidden = false;

  const crearBoton = (texto, pagina, etiqueta, deshabilitado = false, activo = false) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = activo ? "pagina-boton activo" : "pagina-boton";
    boton.textContent = texto;
    boton.setAttribute("aria-label", etiqueta);
    if (activo) boton.setAttribute("aria-current", "page");
    boton.disabled = deshabilitado;
    boton.addEventListener("click", () => {
      paginaActual = pagina;
      renderizarLibros();
      paginacion.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    return boton;
  };

  paginacion.appendChild(
    crearBoton("Anterior", paginaActual - 1, "Ir a la página anterior", paginaActual === 1)
  );

  for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
    paginacion.appendChild(
      crearBoton(String(pagina), pagina, `Ir a la página ${pagina}`, false, pagina === paginaActual)
    );
  }

  paginacion.appendChild(
    crearBoton("Siguiente", paginaActual + 1, "Ir a la página siguiente", paginaActual === totalPaginas)
  );
}

function aplicarFiltros() {
  paginaActual = 1;
  librosFiltrados = obtenerLibrosFiltrados();
  renderizarLibros();
}

function limpiarFiltros() {
  buscadorLibros.value = "";
  filtroGenero.value = "";
  filtroDisponibilidad.value = "";
  ordenCatalogo.value = "titulo-asc";
  aplicarFiltros();
  buscadorLibros.focus();
}

buscadorLibros.addEventListener("input", aplicarFiltros);
filtroGenero.addEventListener("change", aplicarFiltros);
filtroDisponibilidad.addEventListener("change", aplicarFiltros);
ordenCatalogo.addEventListener("change", aplicarFiltros);
botonLimpiar.addEventListener("click", limpiarFiltros);

async function iniciarCatalogo() {
  mostrarEstado("Cargando catálogo...");
  resumenResultados.textContent = "Cargando libros...";

  try {
    const librosCargados = await cargarLibros();
    totalLibros.textContent = librosCargados.length;
    cargarOpcionesGenero(librosCargados);
    librosFiltrados = obtenerLibrosFiltrados();
    renderizarLibros();
  } catch (error) {
    console.error("Error al iniciar el catálogo:", error);
    mostrarErrorCarga(contenedorLibros);
    resumenResultados.textContent = "No se pudo obtener el catálogo.";
    totalLibros.textContent = "—";
    paginacion.hidden = true;
  }
}

iniciarCatalogo();
