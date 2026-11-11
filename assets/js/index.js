const contenedorDestacados = document.getElementById("contenedor-destacados");

function mostrarEstadoCarga() {
  contenedorDestacados.innerHTML = `
    <p class="estado-carga">Buscando una buena historia...</p>
  `;
}

function mostrarSinDestacados() {
  contenedorDestacados.innerHTML = `
    <p class="estado-carga">En este momento no hay libros destacados.</p>
  `;
}

function renderizarLibrosDestacados(librosDestacados) {
  contenedorDestacados.innerHTML = "";

  if (librosDestacados.length === 0) {
    mostrarSinDestacados();
    return;
  }

  librosDestacados.forEach((libro) => {
    const tarjeta = document.createElement("article");
    tarjeta.classList.add("tarjeta-libro");

    tarjeta.innerHTML = `
      <a href="libro.html?id=${encodeURIComponent(libro.id)}" class="tarjeta-enlace">
        <div class="portada-libro">
          <img src="${libro.portada}" alt="Portada de ${libro.titulo}" loading="lazy">
        </div>
        <div class="informacion-libro">
          <span class="etiqueta-destacado">Destacado</span>
          <h3>${libro.titulo}</h3>
          <p class="autor">${libro.autor}</p>
          <p class="genero">${libro.genero}</p>
          <span class="${libro.disponible ? "disponible" : "prestado"}">
            ${libro.disponible ? "Disponible" : "Prestado"}
          </span>
        </div>
      </a>
    `;

    contenedorDestacados.appendChild(tarjeta);
  });
}

async function iniciarInicio() {
  mostrarEstadoCarga();

  try {
    const todosLosLibros = await cargarLibros();
    const destacados = todosLosLibros.filter((libro) => libro.destacado);
    renderizarLibrosDestacados(destacados);
  } catch (error) {
    mostrarErrorCarga(contenedorDestacados);
  }
}

iniciarInicio();
