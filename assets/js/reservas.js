const CLAVE_RESERVAS = "bibliotecaReservas";

function obtenerReservas() {
  const reservasGuardadas = localStorage.getItem(CLAVE_RESERVAS);

  if (!reservasGuardadas) {
    return [];
  }

  return JSON.parse(reservasGuardadas);
}

function guardarReservas(reservas) {
  localStorage.setItem(CLAVE_RESERVAS, JSON.stringify(reservas));
}

function estaReservado(idLibro) {
  const reservas = obtenerReservas();

  return reservas.includes(idLibro);
}

function reservarLibro(idLibro) {
  const reservas = obtenerReservas();

  if (reservas.includes(idLibro)) {
    return false;
  }

  reservas.push(idLibro);

  guardarReservas(reservas);

  return true;
}

function cancelarReserva(idLibro) {
  const reservas = obtenerReservas();

  const nuevasReservas = reservas.filter((id) => id !== idLibro);

  guardarReservas(nuevasReservas);

  return true;
}

function obtenerCantidadReservas() {
  return obtenerReservas().length;
}

function actualizarContadorReservas() {
  const contador = document.getElementById("contador-prestamos");

  if (!contador) {
    return;
  }

  contador.textContent = obtenerCantidadReservas();
}

actualizarContadorReservas();
