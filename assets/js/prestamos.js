const contenedorPrestamos = document.getElementById("contenedor-prestamos");

function obtenerLibrosReservados() {
  const reservas = obtenerReservas();
  return libros.filter((libro) => reservas.includes(libro.id));
}

function mostrarSinPrestamos() {
  contenedorPrestamos.innerHTML = `
    <div class="sin-prestamos">
      <h2>No tenés libros reservados</h2>
      <p>Explorá nuestro catálogo y encontrá tu próxima lectura.</p>
      <a href="catalogo.html">Explorar catálogo</a>
    </div>
  `;
}

function renderizarPrestamos(librosReservados) {
  if (librosReservados.length === 0) {
    mostrarSinPrestamos();
    return;
  }

  contenedorPrestamos.innerHTML = "";

  librosReservados.forEach((libro) => {
    const tarjeta = document.createElement("article");
    tarjeta.classList.add("tarjeta-prestamo");

    tarjeta.innerHTML = `
      <div class="portada-prestamo">
        <img src="${libro.portada}" alt="Portada de ${libro.titulo}">
      </div>
      <div class="informacion-prestamo">
        <span class="estado-reserva">Reservado</span>
        <h2>${libro.titulo}</h2>
        <p class="autor">${libro.autor}</p>
        <p class="genero">${libro.genero}</p>
        <div class="acciones-prestamo">
          <a href="libro.html?id=${encodeURIComponent(libro.id)}" class="boton-ver-libro">Ver libro</a>
          <button class="boton-cancelar" data-id="${libro.id}">Cancelar reserva</button>
        </div>
      </div>
    `;

    contenedorPrestamos.appendChild(tarjeta);
  });

  configurarBotonesCancelar();
}

function configurarBotonesCancelar() {
  document.querySelectorAll(".boton-cancelar").forEach((boton) => {
    boton.addEventListener("click", () => {
      cancelarReserva(boton.dataset.id);
      actualizarContadorReservas();
      iniciarPrestamos();
    });
  });
}

async function iniciarPrestamos() {
  contenedorPrestamos.innerHTML = `
    <p class="estado-carga">Cargando tus préstamos...</p>
  `;

  try {
    await cargarLibros();
    renderizarPrestamos(obtenerLibrosReservados());
    actualizarResumenPrestamos();
  } catch (error) {
    mostrarErrorCarga(contenedorPrestamos);
  }
}

function actualizarResumenPrestamos() {
  const contadorResumen = document.getElementById("contador-resumen");
  if (contadorResumen) {
    contadorResumen.textContent = obtenerCantidadReservas();
  }
}

iniciarPrestamos();
