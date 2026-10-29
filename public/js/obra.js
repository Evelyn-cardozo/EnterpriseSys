
const tablaObras = document.getElementById("tablaObras");
const formulario = document.getElementById("formObra");
const formularioContenedor = document.getElementById("formularioContenedor");
const buscarObra = document.getElementById("buscarObra");
const totalObras = document.getElementById("totalObras");
const mensaje = document.getElementById("mensaje");

const campoCliente = document.getElementById("id_cliente");
const campoNombreObra = document.getElementById("nombre_obra");
const campoResponsable = document.getElementById("personal_responsable");
const campoPresupuesto = document.getElementById("presupuesto_planificado");
const campoFechaInicio = document.getElementById("fecha_inicio");
const campoFechaFin = document.getElementById("fecha_fin_prevista");

const errorCliente = document.getElementById("errorCliente");
const errorNombreObra = document.getElementById("errorNombreObra");
const errorResponsable = document.getElementById("errorResponsable");
const errorPresupuesto = document.getElementById("errorPresupuesto");
const errorFechas = document.getElementById("errorFechas");

let obras = [];
let clientes = [];
let obraEditandoId = null;

// Formatear importes en guaraníes
function formatearImporte(valor) {
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(Number(valor) || 0);
}

// Formatear fechas para mostrar en la tabla
function formatearFecha(fecha) {
  if (!fecha) return "—";

  const fechaTexto = String(fecha).slice(0, 10);
  const partes = fechaTexto.split("-");

  if (partes.length !== 3) return fechaTexto;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

// Normalizar texto
function normalizarTexto(valor) {
  return String(valor || "").trim().toLowerCase();
}

// Limpiar errores de validación
function limpiarErrores() {
  errorCliente.textContent = "";
  errorNombreObra.textContent = "";
  errorResponsable.textContent = "";
  errorPresupuesto.textContent = "";
  errorFechas.textContent = "";

  [
    campoCliente,
    campoNombreObra,
    campoResponsable,
    campoPresupuesto,
    campoFechaInicio,
    campoFechaFin,
  ].forEach((campo) => campo.classList.remove("input-error"));
}

// Mostrar un error en un campo
function mostrarError(campo, elementoError, texto) {
  elementoError.textContent = texto;
  campo.classList.add("input-error");
  campo.focus();
}

// Cargar clientes activos en el selector
async function cargarClientes() {
  const respuesta = await fetch("/clientes");

  if (!respuesta.ok) {
    throw new Error("No se pudieron cargar los clientes.");
  }

  const datos = await respuesta.json();

  clientes = datos.filter(
    (cliente) => normalizarTexto(cliente.estado) === "activo",
  );

  campoCliente.replaceChildren();

  const opcionInicial = document.createElement("option");
  opcionInicial.value = "";
  opcionInicial.textContent = "Seleccioná un cliente";
  campoCliente.appendChild(opcionInicial);

  clientes.forEach((cliente) => {
    const opcion = document.createElement("option");
    opcion.value = cliente.id_cliente;
    opcion.textContent = cliente.nombre_razon_social;
    campoCliente.appendChild(opcion);
  });
}

// Preparar el formulario para registrar
async function prepararRegistro() {
  formulario.reset();
  limpiarErrores();
  obraEditandoId = null;

  document.getElementById("tituloFormulario").textContent =
    "Registrar obra";

  formulario.querySelector('[type="submit"]').textContent =
    "Guardar obra";

  mensaje.textContent = "";
  formularioContenedor.classList.remove("oculto");

  try {
    await cargarClientes();

    campoCliente.focus();
    formularioContenedor.scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    mensaje.textContent = error.message;
  }
}

// Botón Nueva obra
document.getElementById("btnNuevaObra").addEventListener("click", () => {
  prepararRegistro();
});

// Botón Cancelar
document.getElementById("btnCancelar").addEventListener("click", () => {
  formulario.reset();
  limpiarErrores();
  obraEditandoId = null;

  document.getElementById("tituloFormulario").textContent =
    "Registrar obra";

  formulario.querySelector('[type="submit"]').textContent =
    "Guardar obra";

  formularioContenedor.classList.add("oculto");
  mensaje.textContent = "";
});

// Cargar obras desde el servidor
async function cargarObras() {
  tablaObras.innerHTML =
    '<tr><td colspan="11">Cargando obras...</td></tr>';

  try {
    const respuesta = await fetch("/obras");

    if (!respuesta.ok) {
      throw new Error("No se pudieron obtener las obras.");
    }

    obras = await respuesta.json();
    mostrarObras();
  } catch (error) {
    tablaObras.innerHTML =
      '<tr><td colspan="11">Error al cargar las obras.</td></tr>';

    mensaje.textContent = error.message;
  }
}

// Mostrar las obras en la tabla
function mostrarObras() {
  const busqueda = normalizarTexto(buscarObra.value);

  const filtradas = obras.filter((obra) => {
    return [
      obra.id_obra,
      obra.nombre_obra,
      obra.nombre_cliente,
      obra.personal_responsable,
      obra.estado,
    ].some((valor) => normalizarTexto(valor).includes(busqueda));
  });

  totalObras.textContent =
    `${filtradas.length} ${filtradas.length === 1 ? "obra" : "obras"}`;

  tablaObras.replaceChildren();

  if (filtradas.length === 0) {
    const fila = document.createElement("tr");
    const celda = document.createElement("td");

    celda.colSpan = 11;
    celda.textContent = "No se encontraron obras.";

    fila.appendChild(celda);
    tablaObras.appendChild(fila);
    return;
  }

  filtradas.forEach((obra) => {
    const fila = document.createElement("tr");

    const estado = normalizarTexto(obra.estado);
    const clasesEstado = {
      "planificada": "estado-planificada",
      "en ejecución": "estado-ejecucion",
      "finalizada": "estado-finalizada",
      "cancelada": "estado-cancelada",
    };

    const estadoVisible = obra.estado || "Planificada";

    const valores = [
      obra.id_obra,
      obra.nombre_obra,
      obra.nombre_cliente,
      obra.personal_responsable,
      formatearImporte(obra.presupuesto_planificado),
      formatearImporte(obra.costo_real_acumulado),
    ];

    valores.forEach((valor) => {
      const celda = document.createElement("td");
      celda.textContent = valor ?? "—";
      fila.appendChild(celda);
    });

    // Porcentaje de avance y barra visual
    const celdaAvance = document.createElement("td");
    const contenedorProgreso = document.createElement("div");
    contenedorProgreso.className = "progreso-contenedor";

    const barra = document.createElement("div");
    barra.className = "progreso-barra";

    const relleno = document.createElement("div");
    relleno.className = "progreso-relleno";

    const porcentaje = Math.min(
      100,
      Math.max(0, Number(obra.porcentaje_avance) || 0),
    );

    relleno.style.width = `${porcentaje}%`;
    barra.appendChild(relleno);

    const textoAvance = document.createElement("span");
    textoAvance.textContent = `${porcentaje}%`;

    contenedorProgreso.append(barra, textoAvance);
    celdaAvance.appendChild(contenedorProgreso);
    fila.appendChild(celdaAvance);

    // Fechas
    const celdaInicio = document.createElement("td");
    celdaInicio.textContent = formatearFecha(obra.fecha_inicio);
    fila.appendChild(celdaInicio);

    const celdaFin = document.createElement("td");
    celdaFin.textContent = formatearFecha(obra.fecha_fin_prevista);
    fila.appendChild(celdaFin);

    // Estado
    const celdaEstado = document.createElement("td");
    const etiquetaEstado = document.createElement("span");

    etiquetaEstado.textContent = estadoVisible;
    etiquetaEstado.className =
      clasesEstado[estado] || "estado-planificada";

    celdaEstado.appendChild(etiquetaEstado);
    fila.appendChild(celdaEstado);

    // Acciones
    const celdaAcciones = document.createElement("td");

    const botonModificar = document.createElement("button");
    botonModificar.type = "button";
    botonModificar.textContent = "Modificar";
    botonModificar.className = "btn-modificar";

    botonModificar.addEventListener("click", () => {
      prepararModificacion(obra);
    });

    celdaAcciones.appendChild(botonModificar);

    if (estado !== "finalizada" && estado !== "cancelada") {
      const botonEstado = document.createElement("button");
      botonEstado.type = "button";
      botonEstado.textContent =
        estado === "planificada" ? "Iniciar" : "Finalizar";
      botonEstado.className =
        estado === "planificada" ? "btn-activar" : "btn-desactivar";

      botonEstado.addEventListener("click", () => {
        cambiarEstadoObra(obra);
      });

      celdaAcciones.appendChild(botonEstado);
    }

    fila.appendChild(celdaAcciones);
    tablaObras.appendChild(fila);
  });
}

// Cargar una obra en el formulario para modificar
async function prepararModificacion(obra) {
  formulario.reset();
  limpiarErrores();
  obraEditandoId = obra.id_obra;

  try {
    await cargarClientes();

    // Si el cliente de la obra ya está inactivo, mostrarlo
    // para conservar la relación existente al modificarla.
    const clienteActualExiste = Array.from(campoCliente.options).some(
      (opcion) => opcion.value === String(obra.id_cliente),
    );

    if (!clienteActualExiste && obra.id_cliente) {
      const opcion = document.createElement("option");
      opcion.value = obra.id_cliente;
      opcion.textContent = obra.nombre_cliente + " (Inactivo)";
      campoCliente.appendChild(opcion);
    }

    campoCliente.value = obra.id_cliente || "";
    campoNombreObra.value = obra.nombre_obra || "";
    campoResponsable.value = obra.personal_responsable || "";
    campoPresupuesto.value = obra.presupuesto_planificado ?? "";
    campoFechaInicio.value = obra.fecha_inicio
      ? String(obra.fecha_inicio).slice(0, 10)
      : "";
    campoFechaFin.value = obra.fecha_fin_prevista
      ? String(obra.fecha_fin_prevista).slice(0, 10)
      : "";

    document.getElementById("tituloFormulario").textContent =
      "Modificar obra";

    formulario.querySelector('[type="submit"]').textContent =
      "Guardar cambios";

    mensaje.textContent = "";
    formularioContenedor.classList.remove("oculto");
    formularioContenedor.scrollIntoView({ behavior: "smooth" });
    campoNombreObra.focus();
  } catch (error) {
    mensaje.textContent = error.message;
  }
}

// Cambiar estado de una obra
async function cambiarEstadoObra(obra) {
  const estadoActual = normalizarTexto(obra.estado);

  let nuevoEstado;

  if (estadoActual === "planificada") {
    nuevoEstado = "En ejecución";
  } else if (estadoActual === "en ejecución") {
    nuevoEstado = "Finalizada";
  } else {
    return;
  }

  const confirmar = window.confirm(
    `¿Querés cambiar el estado de "${obra.nombre_obra}" a "${nuevoEstado}"?`,
  );

  if (!confirmar) return;

  try {
    const respuesta = await fetch(`/obras/${obra.id_obra}/estado`, {
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

    mensaje.textContent =
      resultado.mensaje || "Estado de la obra actualizado correctamente.";

    await cargarObras();
  } catch (error) {
    mensaje.textContent = error.message;
  }
}

// Búsqueda de obras
buscarObra.addEventListener("input", mostrarObras);

// Validación del presupuesto mientras se escribe
campoPresupuesto.addEventListener("input", () => {
  const presupuesto = campoPresupuesto.value;

  if (presupuesto !== "" && Number(presupuesto) < 0) {
    errorPresupuesto.textContent =
      "El presupuesto no puede ser negativo.";
    campoPresupuesto.classList.add("input-error");
  } else {
    errorPresupuesto.textContent = "";
    campoPresupuesto.classList.remove("input-error");
  }
});

// Validar fechas
function validarFechas() {
  if (
    campoFechaInicio.value &&
    campoFechaFin.value &&
    campoFechaFin.value < campoFechaInicio.value
  ) {
    errorFechas.textContent =
      "La fecha prevista de finalización no puede ser anterior a la fecha de inicio.";

    campoFechaInicio.classList.add("input-error");
    campoFechaFin.classList.add("input-error");
    return false;
  }

  errorFechas.textContent = "";
  campoFechaInicio.classList.remove("input-error");
  campoFechaFin.classList.remove("input-error");

  return true;
}

campoFechaInicio.addEventListener("change", validarFechas);
campoFechaFin.addEventListener("change", validarFechas);

// Registrar o modificar una obra
formulario.addEventListener("submit", async (event) => {
  event.preventDefault();
  limpiarErrores();

  if (!campoCliente.value) {
    mostrarError(campoCliente, errorCliente, "Seleccioná un cliente.");
    return;
  }

  if (!campoNombreObra.value.trim()) {
    mostrarError(
      campoNombreObra,
      errorNombreObra,
      "Ingresá el nombre de la obra.",
    );
    return;
  }

  if (!campoResponsable.value.trim()) {
    mostrarError(
      campoResponsable,
      errorResponsable,
      "Ingresá el personal responsable.",
    );
    return;
  }

  if (
    campoPresupuesto.value === "" ||
    !Number.isFinite(Number(campoPresupuesto.value)) ||
    Number(campoPresupuesto.value) < 0
  ) {
    mostrarError(
      campoPresupuesto,
      errorPresupuesto,
      "Ingresá un presupuesto válido igual o mayor que cero.",
    );
    return;
  }

  if (!campoFechaInicio.value || !campoFechaFin.value) {
    mostrarError(
      !campoFechaInicio.value ? campoFechaInicio : campoFechaFin,
      errorFechas,
      "Ingresá la fecha de inicio y la fecha prevista de finalización.",
    );
    return;
  }

  if (!validarFechas()) {
    campoFechaFin.focus();
    return;
  }

  const datos = Object.fromEntries(new FormData(formulario).entries());

  datos.id_cliente = Number(datos.id_cliente);
  datos.nombre_obra = datos.nombre_obra.trim();
  datos.personal_responsable = datos.personal_responsable.trim();
  datos.presupuesto_planificado = Number(datos.presupuesto_planificado);

  const esModificacion = obraEditandoId !== null;
  const url = esModificacion ? `/obras/${obraEditandoId}` : "/obras";
  const metodo = esModificacion ? "PUT" : "POST";

  mensaje.textContent = esModificacion
    ? "Guardando cambios..."
    : "Registrando obra...";

  const botonGuardar = formulario.querySelector('[type="submit"]');
  botonGuardar.disabled = true;

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
      throw new Error(resultado.mensaje || "No se pudo guardar la obra.");
    }

    mensaje.textContent =
      resultado.mensaje ||
      (esModificacion
        ? "Obra modificada correctamente."
        : "Obra registrada correctamente.");

    obraEditandoId = null;
    formulario.reset();
    limpiarErrores();
    formularioContenedor.classList.add("oculto");

    document.getElementById("tituloFormulario").textContent =
      "Registrar obra";

    botonGuardar.textContent = "Guardar obra";

    await cargarObras();
  } catch (error) {
    mensaje.textContent = error.message;
  } finally {
    botonGuardar.disabled = false;
  }
});

// Inicializar la página
async function inicializarObras() {
  try {
    await cargarClientes();
    await cargarObras();
  } catch (error) {
    mensaje.textContent = error.message;
  }
}

inicializarObras();
