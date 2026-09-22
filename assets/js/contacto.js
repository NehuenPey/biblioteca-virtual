const formulario = document.getElementById("formulario-contacto");

const mensajeFormulario = document.getElementById("mensaje-formulario");

const nombre = document.getElementById("nombre");
const email = document.getElementById("email");
const socio = document.getElementById("socio");
const consulta = document.getElementById("consulta");
const mensaje = document.getElementById("mensaje");

function mostrarError(campo, mensaje) {
  const elementoError = document.getElementById(`error-${campo}`);

  elementoError.textContent = mensaje;

  document.getElementById(campo).classList.add("campo-invalido");
}

function limpiarError(campo) {
  const elementoError = document.getElementById(`error-${campo}`);

  elementoError.textContent = "";

  document.getElementById(campo).classList.remove("campo-invalido");
}

function validarEmail(email) {
  const expresion = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return expresion.test(email);
}

function validarFormulario() {
  let formularioValido = true;

  limpiarError("nombre");
  limpiarError("email");
  limpiarError("socio");
  limpiarError("consulta");
  limpiarError("mensaje");

  mensajeFormulario.textContent = "";
  mensajeFormulario.className = "mensaje-formulario";

  // NOMBRE

  if (nombre.value.trim() === "") {
    mostrarError("nombre", "Ingresá tu nombre completo.");

    formularioValido = false;
  } else if (nombre.value.trim().length < 3) {
    mostrarError("nombre", "El nombre debe tener al menos 3 caracteres.");

    formularioValido = false;
  }

  // EMAIL

  if (email.value.trim() === "") {
    mostrarError("email", "Ingresá tu dirección de email.");

    formularioValido = false;
  } else if (!validarEmail(email.value.trim())) {
    mostrarError("email", "Ingresá un email válido.");

    formularioValido = false;
  }

  // SOCIO

  if (socio.value.trim() === "") {
    mostrarError("socio", "Ingresá tu número de socio.");

    formularioValido = false;
  }

  // CONSULTA

  if (consulta.value.trim() === "") {
    mostrarError("consulta", "Indicá el motivo de tu consulta.");

    formularioValido = false;
  }

  // MENSAJE

  if (mensaje.value.trim() === "") {
    mostrarError("mensaje", "Escribí un mensaje.");

    formularioValido = false;
  } else if (mensaje.value.trim().length < 10) {
    mostrarError("mensaje", "El mensaje debe tener al menos 10 caracteres.");

    formularioValido = false;
  }

  return formularioValido;
}

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();

  const formularioValido = validarFormulario();

  if (!formularioValido) {
    return;
  }

  mensajeFormulario.textContent =
    "¡Consulta enviada correctamente! Gracias por contactarnos.";

  mensajeFormulario.classList.add("mensaje-exito");

  formulario.reset();
});
