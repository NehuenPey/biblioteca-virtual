const contenedorLibros = document.getElementById("contenedor-libros");
const buscadorLibros = document.getElementById("buscador-libros");

function mostrarEstadoCarga() {
  contenedorLibros.innerHTML = `
    <p class="estado-carga">Cargando catálogo...</p>
  `;
}

function mostrarSinResultados() {
  contenedorLibros.innerHTML = `
    <p class="estado-carga">No se encontraron libros.</p>
  `;
}

function renderizarLibros(librosAMostrar) {
  contenedorLibros.innerHTML = "";

  if (librosAMostrar.length === 0) {
    mostrarSinResultados();
    return;
  }

  librosAMostrar.forEach((libro) => {
    const tarjeta = document.createElement("article");
    tarjeta.classList.add("tarjeta-libro");

    tarjeta.innerHTML = `
      <a href="libro.html?id=${encodeURIComponent(libro.id)}" class="tarjeta-enlace">
        <div class="portada-libro">
          <img src="${libro.portada}" alt="Portada de ${libro.titulo}" loading="lazy">
        </div>
        <div class="informacion-libro">
          <h2>${libro.titulo}</h2>
          <p class="autor">${libro.autor}</p>
          <p class="genero">${libro.genero}</p>
          <span class="${libro.disponible ? "disponible" : "prestado"}">
            ${libro.disponible ? "Disponible" : "Prestado"}
          </span>
        </div>
      </a>
    `;

    contenedorLibros.appendChild(tarjeta);
  });
}

function buscarLibros() {
  const textoBusqueda = buscadorLibros.value.toLowerCase().trim();
  const resultados = libros.filter((libro) => {
    const coincideTitulo = libro.titulo.toLowerCase().includes(textoBusqueda);
    const coincideAutor = libro.autor.toLowerCase().includes(textoBusqueda);
    return coincideTitulo || coincideAutor;
  });

  renderizarLibros(resultados);
}

buscadorLibros.addEventListener("input", buscarLibros);

async function iniciarCatalogo() {
  mostrarEstadoCarga();

  try {
    const librosCargados = await cargarLibros();
    renderizarLibros(librosCargados);
  } catch (error) {
    mostrarErrorCarga(contenedorLibros);
  }
}

iniciarCatalogo();
