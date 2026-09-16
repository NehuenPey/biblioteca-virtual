const contenedorDetalle = document.getElementById("detalle-libro");

function obtenerIdLibro() {
  const parametros = new URLSearchParams(window.location.search);

  return parametros.get("id");
}

function buscarLibro(id) {
  return libros.find((libro) => libro.id === id);
}

function mostrarLibroNoEncontrado() {
  contenedorDetalle.innerHTML = `
        <div class="libro-no-encontrado">
            <h1>Libro no encontrado</h1>

            <p>
                El libro que estás buscando no existe o fue eliminado.
            </p>

            <a href="catalogo.html">
                Volver al catálogo
            </a>
        </div>
    `;
}

function renderizarDetalleLibro(libro) {
  const reservado = estaReservado(libro.id);

  contenedorDetalle.innerHTML = `
        <div class="detalle-contenido">

            <div class="detalle-portada">
                <img
                    src="${libro.portada}"
                    alt="Portada de ${libro.titulo}"
                >
            </div>


            <article class="detalle-informacion">

                <span class="detalle-genero">
                    ${libro.genero}
                </span>

                <h1>
                    ${libro.titulo}
                </h1>

                <p class="detalle-autor">
                    ${libro.autor}
                </p>


                <div class="detalle-datos">

                    <p>
                        <strong>Año de publicación:</strong>
                        ${libro.anio}
                    </p>

                    <p>
                        <strong>Editorial:</strong>
                        ${libro.editorial}
                    </p>

                    <p>
                        <strong>ISBN:</strong>
                        ${libro.isbn}
                    </p>

                    <p>
                        <strong>Estado:</strong>

                        <span class="${
                          libro.disponible ? "disponible" : "prestado"
                        }">

                            ${libro.disponible ? "Disponible" : "Prestado"}

                        </span>
                    </p>

                </div>


                <section class="detalle-sinopsis">

                    <h2>Sinopsis</h2>

                    <p>
                        ${libro.sinopsis}
                    </p>

                </section>


                <button
                    id="boton-reservar"
                    class="boton-reservar"
                    ${!libro.disponible || reservado ? "disabled" : ""}
                >
                    ${
                      reservado
                        ? "Libro reservado"
                        : libro.disponible
                          ? "Reservar libro"
                          : "No disponible"
                    }
                </button>

            </article>

        </div>
    `;

  configurarBotonReserva(libro);
}

function configurarBotonReserva(libro) {
  const boton = document.getElementById("boton-reservar");

  if (!boton) {
    return;
  }

  if (!libro.disponible || estaReservado(libro.id)) {
    return;
  }

  boton.addEventListener("click", () => {
    const reservaCreada = reservarLibro(libro.id);

    if (!reservaCreada) {
      return;
    }

    boton.textContent = "Libro reservado";
    boton.disabled = true;

    actualizarContadorReservas();
  });
}

function iniciarDetalleLibro() {
  const idLibro = obtenerIdLibro();

  const libro = buscarLibro(idLibro);

  if (!libro) {
    mostrarLibroNoEncontrado();
    return;
  }

  renderizarDetalleLibro(libro);
}

iniciarDetalleLibro();
