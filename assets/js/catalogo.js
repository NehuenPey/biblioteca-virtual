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

const PARAMETROS_URL = {
  busqueda: "q",
  genero: "genero",
  disponibilidad: "disponibilidad",
  orden: "orden",
  pagina: "pagina",
};

const ORDENES_VALIDOS = [
  "titulo-asc",
  "titulo-desc",
  "autor-asc",
  "anio-desc",
  "anio-asc",
];

function leerEstadoURL() {
  const parametros = new URLSearchParams(window.location.search);

  buscadorLibros.value = parametros.get(PARAMETROS_URL.busqueda) || "";
  filtroGenero.value = parametros.get(PARAMETROS_URL.genero) || "";
  filtroDisponibilidad.value = ["disponible", "prestado"].includes(
    parametros.get(PARAMETROS_URL.disponibilidad)
  )
    ? parametros.get(PARAMETROS_URL.disponibilidad)
    : "";

  const ordenURL = parametros.get(PARAMETROS_URL.orden);
  ordenCatalogo.value = ORDENES_VALIDOS.includes(ordenURL)
    ? ordenURL
    : "titulo-asc";

  const paginaURL = Number.parseInt(parametros.get(PARAMETROS_URL.pagina), 10);
  paginaActual = Number.isInteger(paginaURL) && paginaURL > 0 ? paginaURL : 1;
}

function actualizarURL() {
  const parametros = new URLSearchParams();

  if (buscadorLibros.value.trim()) {
    parametros.set(PARAMETROS_URL.busqueda, buscadorLibros.value.trim());
  }
  if (filtroGenero.value) {
    parametros.set(PARAMETROS_URL.genero, filtroGenero.value);
  }
  if (filtroDisponibilidad.value) {
    parametros.set(PARAMETROS_URL.disponibilidad, filtroDisponibilidad.value);
  }
  if (ordenCatalogo.value !== "titulo-asc") {
    parametros.set(PARAMETROS_URL.orden, ordenCatalogo.value);
  }
  if (paginaActual > 1) {
    parametros.set(PARAMETROS_URL.pagina, String(paginaActual));
  }

  const query = parametros.toString();
  const nuevaURL = query
    ? `${window.location.pathname}?${query}`
    : window.location.pathname;

  window.history.replaceState({}, "", nuevaURL);
}

function aplicarEstadoURL() {
  leerEstadoURL();

  // Si el género de la URL ya no existe en el catálogo, se descarta.
  const existeGenero = [...filtroGenero.options].some(
    (opcion) => opcion.value === filtroGenero.value
  );
  if (!existeGenero) filtroGenero.value = "";

  librosFiltrados = obtenerLibrosFiltrados();
  const totalPaginas = Math.ceil(librosFiltrados.length / LIBROS_POR_PAGINA);
  paginaActual = totalPaginas
    ? Math.min(paginaActual, totalPaginas)
    : 1;

  renderizarLibros();
  actualizarURL();
}

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
      actualizarURL();
      paginacion.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    return boton;
  };

  const agregarSeparador = () => {
    const separador = document.createElement("span");
    separador.className = "pagina-separador";
    separador.textContent = "…";
    separador.setAttribute("aria-hidden", "true");
    paginacion.appendChild(separador);
  };

  paginacion.appendChild(
    crearBoton("Anterior", paginaActual - 1, "Ir a la página anterior", paginaActual === 1)
  );

  // Siempre muestra primera y última, más la página actual y sus vecinas.
  const paginasVisibles = [];
  for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
    if (
      pagina === 1 ||
      pagina === totalPaginas ||
      Math.abs(pagina - paginaActual) <= 1
    ) {
      paginasVisibles.push(pagina);
    }
  }

  let paginaAnterior = 0;
  paginasVisibles.forEach((pagina) => {
    if (paginaAnterior && pagina - paginaAnterior > 1) {
      agregarSeparador();
    }

    paginacion.appendChild(
      crearBoton(String(pagina), pagina, `Ir a la página ${pagina}`, false, pagina === paginaActual)
    );
    paginaAnterior = pagina;
  });

  paginacion.appendChild(
    crearBoton("Siguiente", paginaActual + 1, "Ir a la página siguiente", paginaActual === totalPaginas)
  );
}

function aplicarFiltros() {
  paginaActual = 1;
  librosFiltrados = obtenerLibrosFiltrados();
  renderizarLibros();
  actualizarURL();
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

window.addEventListener("popstate", () => {
  aplicarEstadoURL();
});

async function iniciarCatalogo() {
  mostrarEstado("Cargando catálogo...");
  resumenResultados.textContent = "Cargando libros...";

  try {
    const librosCargados = await cargarLibros();
    totalLibros.textContent = librosCargados.length;
    cargarOpcionesGenero(librosCargados);
    aplicarEstadoURL();
  } catch (error) {
    console.error("Error al iniciar el catálogo:", error);
    mostrarErrorCarga(contenedorLibros);
    resumenResultados.textContent = "No se pudo obtener el catálogo.";
    totalLibros.textContent = "—";
    paginacion.hidden = true;
  }
}

iniciarCatalogo();
