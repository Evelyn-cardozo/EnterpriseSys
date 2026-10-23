const tablaClientes = document.getElementById("tablaClientes");
const formulario = document.getElementById("formCliente");
const formularioContenedor = document.getElementById("formularioContenedor");
const buscarCliente = document.getElementById("buscarCliente");
const totalClientes = document.getElementById("totalClientes");
const mensaje = document.getElementById("mensaje");

const campoNombre = document.getElementById("nombre");
const campoRucCi = document.getElementById("ruc_ci");
const campoEmail = document.getElementById("email");

const errorNombre = document.getElementById("errorNombre");
const errorRucCi = document.getElementById("errorRucCi");
const errorEmail = document.getElementById("errorEmail");

let clientes = [];
let clienteEditandoId = null;

// Limpiar mensajes de validación
function limpiarErrores() {
  errorNombre.textContent = "";
  errorRucCi.textContent = "";
  errorEmail.textContent = "";

  campoNombre.classList.remove("input-error");
  campoRucCi.classList.remove("input-error");
  campoEmail.classList.remove("input-error");
}

// Preparar formulario para registrar un cliente nuevo
function prepararRegistro() {
  formulario.reset();
  limpiarErrores();

  clienteEditandoId = null;

  document.getElementById("tituloFormulario").textContent = "Registrar cliente";

  formulario.querySelector('[type="submit"]').textContent = "Guardar cliente";

  mensaje.textContent = "";
  formularioContenedor.classList.remove("oculto");
  campoNombre.focus();
}

// Botón Nuevo cliente
document.getElementById("btnNuevoCliente").addEventListener("click", () => {
  prepararRegistro();
});

// Botón Cancelar
document.getElementById("btnCancelar").addEventListener("click", () => {
  formulario.reset();
  limpiarErrores();

  clienteEditandoId = null;

  document.getElementById("tituloFormulario").textContent = "Registrar cliente";

  formulario.querySelector('[type="submit"]').textContent = "Guardar cliente";

  formularioContenedor.classList.add("oculto");
  mensaje.textContent = "";
});

// Cargar clientes desde el servidor
async function cargarClientes() {
  tablaClientes.innerHTML =
    '<tr><td colspan="8">Cargando clientes...</td></tr>';

  try {
    const respuesta = await fetch("/clientes");

    if (!respuesta.ok) {
      throw new Error("No se pudieron obtener los clientes.");
    }

    clientes = await respuesta.json();
    mostrarClientes();
  } catch (error) {
    tablaClientes.innerHTML =
      '<tr><td colspan="8">Error al cargar los clientes.</td></tr>';

    mensaje.textContent = error.message;
  }
}

// Mostrar clientes en la tabla

function mostrarClientes() {
  const busqueda = buscarCliente.value.trim().toLowerCase();

  const filtrados = clientes.filter((cliente) => {
    return [cliente.nombre_razon_social, cliente.ruc_ci, cliente.telefono].some(
      (valor) =>
        String(valor || "")
          .toLowerCase()
          .includes(busqueda),
    );
  });

  totalClientes.textContent = `${filtrados.length} ${filtrados.length === 1 ? "cliente" : "clientes"}`;

  tablaClientes.replaceChildren();

  if (filtrados.length === 0) {
    const fila = document.createElement("tr");
    const celda = document.createElement("td");

    celda.colSpan = 8;
    celda.textContent = "No se encontraron clientes.";

    fila.appendChild(celda);
    tablaClientes.appendChild(fila);
    return;
  }

  filtrados.forEach((cliente) => {
    const fila = document.createElement("tr");

    // Normalizar el estado para poder compararlo
    const estado = String(cliente.estado || "Activo")
      .trim()
      .toLowerCase();

    const estaActivo = estado !== "inactivo";

    // Aplicar gris si el cliente está inactivo
    if (!estaActivo) {
      fila.classList.add("cliente-inactivo");
    }

    // Mostrar el estado con la primera letra en mayúscula
    const estadoVisible = estaActivo ? "Activo" : "Inactivo";

    const valores = [
      cliente.id_cliente,
      cliente.nombre_razon_social,
      cliente.ruc_ci,
      cliente.telefono || "—",
      cliente.direccion || "—",
      cliente.email || "—",
      estadoVisible,
    ];

    valores.forEach((valor) => {
      const celda = document.createElement("td");
      celda.textContent = valor ?? "—";
      fila.appendChild(celda);
    });

    const celdaAcciones = document.createElement("td");

    // Botón Modificar
    const botonModificar = document.createElement("button");

    botonModificar.type = "button";
    botonModificar.textContent = "Modificar";
    botonModificar.className = "btn-modificar";

    botonModificar.addEventListener("click", () => {
      prepararModificacion(cliente);
    });

    celdaAcciones.appendChild(botonModificar);

    // Botón Activar o Desactivar
    const botonEstado = document.createElement("button");

    botonEstado.type = "button";
    botonEstado.textContent = estaActivo ? "Desactivar" : "Activar";
    botonEstado.className = estaActivo ? "btn-desactivar" : "btn-activar";

    botonEstado.addEventListener("click", () => {
      cambiarEstadoCliente(cliente);
    });

    celdaAcciones.appendChild(botonEstado);
    fila.appendChild(celdaAcciones);
    tablaClientes.appendChild(fila);
  });
}

// Cargar los datos de un cliente en el formulario
function prepararModificacion(cliente) {
  formulario.reset();
  limpiarErrores();

  clienteEditandoId = cliente.id_cliente;

  campoNombre.value = cliente.nombre_razon_social || "";
  campoRucCi.value = cliente.ruc_ci || "";
  document.getElementById("telefono").value = cliente.telefono || "";
  document.getElementById("direccion").value = cliente.direccion || "";
  campoEmail.value = cliente.email || "";

  document.getElementById("tituloFormulario").textContent = "Modificar cliente";

  formulario.querySelector('[type="submit"]').textContent = "Guardar cambios";

  mensaje.textContent = "";
  formularioContenedor.classList.remove("oculto");
  formularioContenedor.scrollIntoView({ behavior: "smooth" });
  campoNombre.focus();
}

// Activar o desactivar cliente
async function cambiarEstadoCliente(cliente) {
  const nuevoEstado = cliente.estado === "Activo" ? "Inactivo" : "Activo";

  const confirmar = window.confirm(
    `¿Querés ${nuevoEstado === "Inactivo" ? "desactivar" : "activar"} a ${cliente.nombre_razon_social}?`,
  );

  if (!confirmar) return;

  try {
    const respuesta = await fetch(`/clientes/${cliente.id_cliente}/estado`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ estado: nuevoEstado }),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(resultado.mensaje || "No se pudo cambiar el estado.");
    }

    mensaje.textContent = `Cliente ${nuevoEstado.toLowerCase()} correctamente.`;

    await cargarClientes();
  } catch (error) {
    mensaje.textContent = error.message;
  }
}

// Buscar clientes
buscarCliente.addEventListener("input", mostrarClientes);

// Validación del correo mientras se escribe
campoEmail.addEventListener("input", () => {
  if (campoEmail.value.trim() && campoEmail.validity.typeMismatch) {
    errorEmail.textContent = "Ingresá un correo electrónico válido.";

    campoEmail.classList.add("input-error");
  } else {
    errorEmail.textContent = "";
    campoEmail.classList.remove("input-error");
  }
});

// Registrar o modificar cliente
formulario.addEventListener("submit", async (event) => {
  event.preventDefault();
  limpiarErrores();

  // Validar nombre
  if (!campoNombre.value.trim()) {
    errorNombre.textContent = "Ingresá el nombre o razón social.";

    campoNombre.classList.add("input-error");
    campoNombre.focus();
    return;
  }

  // Validar CI/RUC
  if (!campoRucCi.value.trim()) {
    errorRucCi.textContent = "Ingresá el CI/RUC.";
    campoRucCi.classList.add("input-error");
    campoRucCi.focus();
    return;
  }

  // Validar correo electrónico
  if (campoEmail.value.trim() && campoEmail.validity.typeMismatch) {
    errorEmail.textContent = "Ingresá un correo electrónico válido.";

    campoEmail.classList.add("input-error");
    campoEmail.focus();
    return;
  }

  const datos = Object.fromEntries(new FormData(formulario).entries());

  // Evitar espacios al inicio y al final
  datos.nombre_razon_social = datos.nombre_razon_social.trim();
  datos.ruc_ci = datos.ruc_ci.trim();

  mensaje.textContent =
    clienteEditandoId !== null
      ? "Guardando cambios..."
      : "Guardando cliente...";

  const esModificacion = clienteEditandoId !== null;

  const url = esModificacion ? `/clientes/${clienteEditandoId}` : "/clientes";

  const metodo = esModificacion ? "PUT" : "POST";

  try {
    const respuesta = await fetch(url, {
      method: metodo,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datos),
    });

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      if (respuesta.status === 409) {
        errorRucCi.textContent = resultado.mensaje;
        campoRucCi.classList.add("input-error");
        campoRucCi.focus();
        return;
      }

      throw new Error(resultado.mensaje || "No se pudo guardar el cliente.");
    }

    const mensajeExito =
      resultado.mensaje ||
      (esModificacion
        ? "Cliente modificado correctamente."
        : "Cliente registrado correctamente.");

    clienteEditandoId = null;

    formulario.reset();
    limpiarErrores();
    formularioContenedor.classList.add("oculto");

    document.getElementById("tituloFormulario").textContent =
      "Registrar cliente";

    formulario.querySelector('[type="submit"]').textContent = "Guardar cliente";

    mensaje.textContent = mensajeExito;

    await cargarClientes();
  } catch (error) {
    mensaje.textContent =
      error.message || "Ocurrió un error al guardar el cliente.";
  }
});

// Cargar la tabla al abrir la página
cargarClientes();
