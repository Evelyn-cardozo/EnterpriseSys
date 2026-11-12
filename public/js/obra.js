// ========================================
// ELEMENTOS DEL MÓDULO DE OBRAS
// ========================================

const tablaObras = document.getElementById("tablaObras");
const formulario = document.getElementById("formObra");
const formularioContenedor = document.getElementById("formularioContenedor");
const buscarObra = document.getElementById("buscarObra");
const totalObras = document.getElementById("totalObras");
const mensaje = document.getElementById("mensaje");

const campoCliente = document.getElementById("id_cliente");
const campoNombreObra = document.getElementById("nombre_obra");
const campoPresupuesto = document.getElementById("presupuesto_planificado");
const campoFechaInicio = document.getElementById("fecha_inicio");
const campoFechaFin = document.getElementById("fecha_fin_prevista");

const errorCliente = document.getElementById("errorCliente");
const errorNombreObra = document.getElementById("errorNombreObra");
const errorPresupuesto = document.getElementById("errorPresupuesto");
const errorFechas = document.getElementById("errorFechas");

// ========================================
// ELEMENTOS DEL PANEL DE PERSONAL
// ========================================

const panelPersonal = document.getElementById("panelPersonal");
const formularioPersonal = document.getElementById("formPersonal");

const tablaPersonal = document.getElementById("tablaPersonal");
const tablaRegistroPersonal = document.getElementById("tablaRegistroPersonal");

const mensajePersonal = document.getElementById("mensajePersonal");

const totalPersonal = document.getElementById("totalPersonal");
const totalRegistroPersonal = document.getElementById("totalRegistroPersonal");

const idPersonal = document.getElementById("id_personal");

const nombreTrabajador = document.getElementById("nombre_trabajador");
const cargoTrabajador = document.getElementById("cargo");
const telefonoTrabajador = document.getElementById("telefono");
const gmailTrabajador = document.getElementById("gmail");
const direccionTrabajador = document.getElementById("direccion");

const buscarPersonalRegistro = document.getElementById(
  "buscarPersonalRegistro",
);

// ========================================
// ELEMENTOS DEL PANEL DE MATERIALES
// ========================================

const panelMateriales = document.getElementById("panelMateriales");

const selectorMaterial = document.getElementById("materialSeleccionado");
const cantidadMaterial = document.getElementById("cantidadMaterial");
const tablaDetalleSolicitud = document.getElementById("tablaDetalleSolicitud");
const formularioSolicitudMateriales = document.getElementById(
  "formSolicitudMateriales",
);

const btnAgregarMaterial = document.getElementById("btnAgregarMaterial");
const btnEnviarSolicitud = document.getElementById("btnEnviarSolicitud");

const observacionSolicitud = document.getElementById("observacionSolicitud");
const mensajeMateriales = document.getElementById("mensajeMateriales");

const tablaSolicitudes = document.getElementById("tablaSolicitudes");
const tablaHistorialEntregas = document.getElementById(
  "tablaHistorialEntregas",
);

// ========================================
// VARIABLES GLOBALES
// ========================================

let obras = [];
let clientes = [];
let obraEditandoId = null;

let obraPersonalActual = null;
let trabajadores = [];
let todosTrabajadores = [];
let personalSoloLectura = false;

let obraMaterialesActual = null;
let materialesDisponibles = [];
let materialesSolicitud = [];

let solicitudesObra = [];
let movimientosObra = [];

// ========================================
// FUNCIONES GENERALES
// ========================================

async function leerRespuesta(respuesta) {
  const texto = await respuesta.text();

  if (!texto) {
    return {};
  }

  try {
    return JSON.parse(texto);
  } catch {
    throw new Error("El servidor devolvió una respuesta no válida.");
  }
}

function formatearImporte(valor) {
  return new Intl.NumberFormat("es-PY", {
    style: "currency",
    currency: "PYG",
    maximumFractionDigits: 0,
  }).format(Number(valor) || 0);
}

function formatearFecha(fecha) {
  if (!fecha) return "—";

  const fechaTexto = String(fecha).slice(0, 10);
  const partes = fechaTexto.split("-");

  if (partes.length !== 3) return fechaTexto;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function normalizarTexto(valor) {
  return String(valor ?? "")
    .trim()
    .toLowerCase();
}

function obraBloqueada(obra) {
  if (!obra) return false;

  const estado = normalizarTexto(obra.estado);

  return estado === "finalizada" || estado === "cancelada";
}

function mostrarMensajePersonal(texto) {
  if (mensajePersonal) {
    mensajePersonal.textContent = texto;
  }
}

function mostrarMensajeMateriales(texto) {
  if (mensajeMateriales) {
    mensajeMateriales.textContent = texto;
  }
}

function crearCelda(valor) {
  const celda = document.createElement("td");
  celda.textContent = valor ?? "—";
  return celda;
}

function crearBotonIcono(icono, descripcion, clase = "btn-icono") {
  const boton = document.createElement("button");

  boton.type = "button";
  boton.className = clase;
  boton.title = descripcion;
  boton.setAttribute("aria-label", descripcion);
  boton.innerHTML = `<i data-lucide="${icono}"></i>`;

  return boton;
}

function actualizarIconos() {
  if (window.lucide) {
    lucide.createIcons();
  }
}

// ========================================
// GESTIÓN DE CLIENTES
// ========================================

async function cargarClientes() {
  const respuesta = await fetch("/clientes");
  const datos = await leerRespuesta(respuesta);

  if (!respuesta.ok || !Array.isArray(datos)) {
    throw new Error("No se pudieron cargar los clientes.");
  }

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

// ========================================
// FORMULARIO DE OBRAS
// ========================================

function limpiarErrores() {
  errorCliente.textContent = "";
  errorNombreObra.textContent = "";
  errorPresupuesto.textContent = "";
  errorFechas.textContent = "";

  [
    campoCliente,
    campoNombreObra,
    campoPresupuesto,
    campoFechaInicio,
    campoFechaFin,
  ].forEach((campo) => campo.classList.remove("input-error"));
}

function mostrarError(campo, elementoError, texto) {
  elementoError.textContent = texto;
  campo.classList.add("input-error");
  campo.focus();
}

async function prepararRegistro() {
  formulario.reset();
  limpiarErrores();

  obraEditandoId = null;

  document.getElementById("tituloFormulario").textContent = "Registrar obra";

  formulario.querySelector('[type="submit"]').textContent = "Guardar obra";

  mensaje.textContent = "";

  panelMateriales.classList.add("oculto");
  panelPersonal.classList.add("oculto");

  formularioContenedor.classList.remove("oculto");

  try {
    await cargarClientes();

    campoCliente.focus();

    formularioContenedor.scrollIntoView({
      behavior: "smooth",
    });
  } catch (error) {
    mensaje.textContent = error.message;
  }
}

document
  .getElementById("btnNuevaObra")
  .addEventListener("click", prepararRegistro);

document.getElementById("btnCancelar").addEventListener("click", () => {
  formulario.reset();
  limpiarErrores();

  obraEditandoId = null;

  formularioContenedor.classList.add("oculto");

  mensaje.textContent = "";

  document.getElementById("tituloFormulario").textContent = "Registrar obra";

  formulario.querySelector('[type="submit"]').textContent = "Guardar obra";
});

// ========================================
// LISTAR OBRAS
// ========================================

async function cargarObras() {
  tablaObras.innerHTML = '<tr><td colspan="9">Cargando obras...</td></tr>';

  try {
    const respuesta = await fetch("/obras");
    const datos = await leerRespuesta(respuesta);

    if (!respuesta.ok || !Array.isArray(datos)) {
      throw new Error("No se pudieron obtener las obras.");
    }

    obras = datos;
    mostrarObras();
  } catch (error) {
    tablaObras.innerHTML =
      '<tr><td colspan="9">Error al cargar las obras.</td></tr>';

    mensaje.textContent = error.message;
  }
}

// ========================================
// MOSTRAR OBRAS
// ========================================

function mostrarObras() {
  const busqueda = normalizarTexto(buscarObra.value);

  const filtradas = obras.filter((obra) => {
    return [
      obra.id_obra,
      obra.nombre_obra,
      obra.nombre_cliente,
      obra.estado,
    ].some((valor) => normalizarTexto(valor).includes(busqueda));
  });

  totalObras.textContent = `${filtradas.length} ${filtradas.length === 1 ? "obra" : "obras"}`;

  tablaObras.replaceChildren();

  if (filtradas.length === 0) {
    const fila = document.createElement("tr");
    const celda = crearCelda("No se encontraron obras.");

    celda.colSpan = 9;

    fila.appendChild(celda);
    tablaObras.appendChild(fila);

    return;
  }

  filtradas.forEach((obra) => {
    const fila = document.createElement("tr");
    const estado = normalizarTexto(obra.estado);

    const clasesEstado = {
      planificada: "estado-planificada",
      "en ejecución": "estado-ejecucion",
      finalizada: "estado-finalizada",
      cancelada: "estado-cancelada",
    };

    const valores = [
      obra.id_obra,
      obra.nombre_obra,
      obra.nombre_cliente,
      formatearImporte(obra.presupuesto_planificado),
    ];

    valores.forEach((valor) => {
      fila.appendChild(crearCelda(valor));
    });

    fila.appendChild(crearCelda(formatearFecha(obra.fecha_inicio)));
    fila.appendChild(crearCelda(formatearFecha(obra.fecha_fin_prevista)));

    const celdaEstado = document.createElement("td");
    const etiquetaEstado = document.createElement("span");

    etiquetaEstado.textContent = obra.estado || "Planificada";
    etiquetaEstado.className = clasesEstado[estado] || "estado-planificada";

    celdaEstado.appendChild(etiquetaEstado);
    fila.appendChild(celdaEstado);

    // Materiales
    const celdaMateriales = document.createElement("td");

    const botonMateriales = crearBotonIcono("package", "Materiales");

    botonMateriales.addEventListener("click", () => {
      abrirPanelMateriales(obra);
    });

    celdaMateriales.appendChild(botonMateriales);
    fila.appendChild(celdaMateriales);

    // Acciones
    const celdaAcciones = document.createElement("td");
    const contenedorAcciones = document.createElement("div");

    contenedorAcciones.className = "acciones";

    const botonPersonal = crearBotonIcono("users", "Personal");

    botonPersonal.addEventListener("click", () => {
      abrirPersonal(obra);
    });

    contenedorAcciones.appendChild(botonPersonal);

    if (!obraBloqueada(obra)) {
      const botonModificar = crearBotonIcono("pencil", "Modificar obra");

      botonModificar.addEventListener("click", () => {
        prepararModificacion(obra);
      });

      contenedorAcciones.appendChild(botonModificar);

      const esPlanificada = estado === "planificada";

      const botonEstado = crearBotonIcono(
        esPlanificada ? "play" : "check-circle",
        esPlanificada ? "Iniciar obra" : "Finalizar obra",
      );

      botonEstado.addEventListener("click", () => {
        cambiarEstadoObra(obra);
      });

      contenedorAcciones.appendChild(botonEstado);
    }

    celdaAcciones.appendChild(contenedorAcciones);
    fila.appendChild(celdaAcciones);

    tablaObras.appendChild(fila);
  });

  actualizarIconos();
}

// ========================================
// MODIFICAR OBRA
// ========================================

async function prepararModificacion(obra) {
  if (obraBloqueada(obra)) {
    mensaje.textContent =
      "No se puede modificar una obra finalizada o cancelada.";

    return;
  }

  formulario.reset();
  limpiarErrores();

  obraEditandoId = obra.id_obra;

  panelMateriales.classList.add("oculto");
  panelPersonal.classList.add("oculto");

  try {
    await cargarClientes();

    const clienteActualExiste = Array.from(campoCliente.options).some(
      (opcion) => opcion.value === String(obra.id_cliente),
    );

    if (!clienteActualExiste && obra.id_cliente) {
      const opcion = document.createElement("option");

      opcion.value = obra.id_cliente;
      opcion.textContent = `${obra.nombre_cliente} (Inactivo)`;

      campoCliente.appendChild(opcion);
    }

    campoCliente.value = obra.id_cliente || "";
    campoNombreObra.value = obra.nombre_obra || "";
    campoPresupuesto.value = obra.presupuesto_planificado ?? "";

    campoFechaInicio.value = obra.fecha_inicio
      ? String(obra.fecha_inicio).slice(0, 10)
      : "";

    campoFechaFin.value = obra.fecha_fin_prevista
      ? String(obra.fecha_fin_prevista).slice(0, 10)
      : "";

    document.getElementById("tituloFormulario").textContent = "Modificar obra";

    formulario.querySelector('[type="submit"]').textContent = "Guardar cambios";

    mensaje.textContent = "";

    formularioContenedor.classList.remove("oculto");

    formularioContenedor.scrollIntoView({
      behavior: "smooth",
    });

    campoNombreObra.focus();
  } catch (error) {
    mensaje.textContent = error.message;
  }
}

// ========================================
// CAMBIAR ESTADO DE OBRA
// ========================================

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
      body: JSON.stringify({
        estado: nuevoEstado,
      }),
    });

    const resultado = await leerRespuesta(respuesta);

    if (!respuesta.ok) {
      throw new Error(resultado.mensaje || "No se pudo cambiar el estado.");
    }

    mensaje.textContent =
      resultado.mensaje || "Estado actualizado correctamente.";

    await cargarObras();
  } catch (error) {
    mensaje.textContent = error.message;
  }
}

// ========================================
// VALIDACIONES DE OBRAS
// ========================================

buscarObra.addEventListener("input", mostrarObras);

campoPresupuesto.addEventListener("input", () => {
  if (campoPresupuesto.value !== "" && Number(campoPresupuesto.value) < 0) {
    errorPresupuesto.textContent = "El presupuesto no puede ser negativo.";

    campoPresupuesto.classList.add("input-error");
  } else {
    errorPresupuesto.textContent = "";
    campoPresupuesto.classList.remove("input-error");
  }
});

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

// ========================================
// REGISTRAR O MODIFICAR OBRA
// ========================================

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
      "Ingresá ambas fechas.",
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
  datos.presupuesto_planificado = Number(datos.presupuesto_planificado);

  const esModificacion = obraEditandoId !== null;

  if (esModificacion) {
    const obraActual = obras.find(
      (obra) => Number(obra.id_obra) === Number(obraEditandoId),
    );

    if (!obraActual || obraBloqueada(obraActual)) {
      mensaje.textContent =
        "No se puede modificar una obra finalizada o cancelada.";

      obraEditandoId = null;
      formularioContenedor.classList.add("oculto");

      return;
    }
  }

  const url = esModificacion ? `/obras/${obraEditandoId}` : "/obras";

  const metodo = esModificacion ? "PUT" : "POST";

  const botonGuardar = formulario.querySelector('[type="submit"]');

  botonGuardar.disabled = true;

  mensaje.textContent = esModificacion
    ? "Guardando cambios..."
    : "Registrando obra...";

  try {
    const respuesta = await fetch(url, {
      method: metodo,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datos),
    });

    const resultado = await leerRespuesta(respuesta);

    if (!respuesta.ok) {
      throw new Error(resultado.mensaje || "No se pudo guardar la obra.");
    }

    mensaje.textContent = resultado.mensaje || "Obra guardada correctamente.";

    obraEditandoId = null;

    formulario.reset();
    limpiarErrores();

    formularioContenedor.classList.add("oculto");

    document.getElementById("tituloFormulario").textContent = "Registrar obra";

    botonGuardar.textContent = "Guardar obra";

    await cargarObras();
  } catch (error) {
    mensaje.textContent = error.message;
  } finally {
    botonGuardar.disabled = false;
  }
});

// ==================================================
// GESTIÓN DE TRABAJADORES
// ==================================================

// ========================================
// CONFIGURAR PERSONAL SEGÚN ESTADO DE OBRA
// ========================================

function configurarPersonalSoloLectura(obra) {
  personalSoloLectura = obraBloqueada(obra);

  const subsecciones = panelPersonal.querySelectorAll(".subseccion");

  // La primera subsección contiene el formulario.
  // La segunda contiene el personal asignado.
  // La tercera contiene el registro general.

  if (subsecciones[0]) {
    subsecciones[0].classList.toggle("oculto", personalSoloLectura);
  }

  if (subsecciones[2]) {
    subsecciones[2].classList.toggle("oculto", personalSoloLectura);
  }

  // En obras cerradas se conserva visible la tabla
  // de trabajadores asignados, pero sin acciones.
}

// ========================================
// ABRIR PANEL DE PERSONAL
// ========================================

async function abrirPersonal(obra) {
  obraPersonalActual = obra;

  trabajadores = [];
  todosTrabajadores = [];

  configurarPersonalSoloLectura(obra);

  document.getElementById("nombreObraPersonal").textContent =
    `Obra: ${obra.nombre_obra}`;

  formularioContenedor.classList.add("oculto");
  panelMateriales.classList.add("oculto");

  panelPersonal.classList.remove("oculto");

  limpiarFormularioPersonal();

  if (personalSoloLectura) {
    mostrarMensajePersonal(
      "Obra cerrada: el personal asignado está disponible únicamente para consulta.",
    );
  } else {
    mostrarMensajePersonal("Cargando información del personal...");
  }

  const tareas = [cargarTrabajadores(obra.id_obra)];

  if (!personalSoloLectura) {
    tareas.push(cargarRegistroGeneral());
  } else {
    tablaRegistroPersonal.replaceChildren();
    totalRegistroPersonal.textContent = "Consulta no disponible";
  }

  await Promise.all(tareas);

  if (!personalSoloLectura) {
    mostrarMensajePersonal("");
  }

  panelPersonal.scrollIntoView({
    behavior: "smooth",
  });
}

// ========================================
// CERRAR PANEL
// ========================================

document.getElementById("btnCerrarPersonal").addEventListener("click", () => {
  panelPersonal.classList.add("oculto");

  limpiarFormularioPersonal();

  // Restaurar la visibilidad de las subsecciones
  panelPersonal
    .querySelectorAll(".subseccion")
    .forEach((seccion) => seccion.classList.remove("oculto"));

  obraPersonalActual = null;
  personalSoloLectura = false;

  trabajadores = [];
  todosTrabajadores = [];
});

// ========================================
// CARGAR PERSONAL ASIGNADO A LA OBRA
// ========================================

async function cargarTrabajadores(id_obra) {
  tablaPersonal.innerHTML =
    '<tr><td colspan="7">Cargando trabajadores...</td></tr>';

  try {
    const respuesta = await fetch(`/obras/${id_obra}/trabajadores`);

    const datos = await leerRespuesta(respuesta);

    if (!respuesta.ok || !Array.isArray(datos)) {
      throw new Error(
        datos.mensaje || "No se pudieron cargar los trabajadores de la obra.",
      );
    }

    trabajadores = datos;

    mostrarTrabajadores();
  } catch (error) {
    trabajadores = [];

    tablaPersonal.innerHTML =
      '<tr><td colspan="7">Error al cargar trabajadores.</td></tr>';

    mostrarMensajePersonal(error.message);
  }
}

// ========================================
// CARGAR REGISTRO GENERAL DE TRABAJADORES
// ========================================

async function cargarRegistroGeneral() {
  tablaRegistroPersonal.innerHTML =
    '<tr><td colspan="7">Cargando registro de personal...</td></tr>';

  try {
    const respuesta = await fetch("/obras/trabajadores");

    const datos = await leerRespuesta(respuesta);

    if (!respuesta.ok || !Array.isArray(datos)) {
      throw new Error(
        datos.mensaje || "No se pudo cargar el registro general.",
      );
    }

    todosTrabajadores = datos;

    mostrarRegistroGeneral();
  } catch (error) {
    todosTrabajadores = [];

    tablaRegistroPersonal.innerHTML =
      '<tr><td colspan="7">Error al cargar el registro general.</td></tr>';

    mostrarMensajePersonal(error.message);
  }
}

// ========================================
// MOSTRAR PERSONAL ASIGNADO
// ========================================

function mostrarTrabajadores() {
  tablaPersonal.replaceChildren();

  totalPersonal.textContent = `${trabajadores.length} ${
    trabajadores.length === 1 ? "trabajador" : "trabajadores"
  }`;

  if (trabajadores.length === 0) {
    const fila = document.createElement("tr");

    const celda = crearCelda(
      "Esta obra todavía no tiene trabajadores asignados.",
    );

    celda.colSpan = 7;

    fila.appendChild(celda);
    tablaPersonal.appendChild(fila);

    return;
  }

  trabajadores.forEach((trabajador) => {
    const fila = document.createElement("tr");

    const valores = [
      trabajador.id_personal,
      trabajador.nombre_trabajador,
      trabajador.cargo,
      trabajador.telefono,
      trabajador.gmail,
      trabajador.direccion,
    ];

    valores.forEach((valor) => {
      fila.appendChild(crearCelda(valor));
    });

    const celdaAcciones = document.createElement("td");

    if (personalSoloLectura) {
      const etiqueta = document.createElement("span");

      etiqueta.textContent = "Solo consulta";
      etiqueta.className = "estado-finalizada";

      celdaAcciones.appendChild(etiqueta);
    } else {
      const botonModificar = crearBotonIcono("pencil", "Modificar trabajador");

      botonModificar.addEventListener("click", () => {
        prepararModificacionPersonal(trabajador);
      });

      celdaAcciones.appendChild(botonModificar);
    }

    fila.appendChild(celdaAcciones);
    tablaPersonal.appendChild(fila);
  });

  actualizarIconos();
}

// ========================================
// MOSTRAR REGISTRO GENERAL
// ========================================

function mostrarRegistroGeneral() {
  tablaRegistroPersonal.replaceChildren();

  const busqueda = normalizarTexto(buscarPersonalRegistro?.value);

  const trabajadoresFiltrados = todosTrabajadores.filter((trabajador) => {
    return [
      trabajador.id_personal,
      trabajador.nombre_trabajador,
      trabajador.cargo,
      trabajador.telefono,
      trabajador.gmail,
      trabajador.direccion,
    ].some((valor) => normalizarTexto(valor).includes(busqueda));
  });

  totalRegistroPersonal.textContent = `${trabajadoresFiltrados.length} ${
    trabajadoresFiltrados.length === 1
      ? "trabajador registrado"
      : "trabajadores registrados"
  }`;

  if (trabajadoresFiltrados.length === 0) {
    const fila = document.createElement("tr");

    const celda = crearCelda(
      todosTrabajadores.length === 0
        ? "Todavía no hay trabajadores registrados."
        : "No se encontraron trabajadores.",
    );

    celda.colSpan = 7;

    fila.appendChild(celda);
    tablaRegistroPersonal.appendChild(fila);

    return;
  }

  trabajadoresFiltrados.forEach((trabajador) => {
    const fila = document.createElement("tr");

    const valores = [
      trabajador.id_personal,
      trabajador.nombre_trabajador,
      trabajador.cargo,
      trabajador.telefono,
      trabajador.gmail,
      trabajador.direccion,
    ];

    valores.forEach((valor) => {
      fila.appendChild(crearCelda(valor));
    });

    const celdaAcciones = document.createElement("td");

    const yaAsignado = trabajadores.some(
      (asignado) =>
        Number(asignado.id_personal) === Number(trabajador.id_personal),
    );

    if (yaAsignado) {
      const etiqueta = document.createElement("span");

      etiqueta.textContent = "Ya asignado";
      etiqueta.className = "estado-finalizada";

      celdaAcciones.appendChild(etiqueta);
    } else if (obraBloqueada(obraPersonalActual)) {
      const etiqueta = document.createElement("span");

      etiqueta.textContent = "Obra cerrada";
      etiqueta.className = "estado-finalizada";

      celdaAcciones.appendChild(etiqueta);
    } else {
      const botonAsignar = document.createElement("button");

      botonAsignar.type = "button";
      botonAsignar.className = "btn-secundario";
      botonAsignar.textContent = "Asignar";

      botonAsignar.addEventListener("click", () => {
        asignarTrabajador(trabajador);
      });

      celdaAcciones.appendChild(botonAsignar);
    }

    fila.appendChild(celdaAcciones);
    tablaRegistroPersonal.appendChild(fila);
  });

  actualizarIconos();
}

// Buscar en el registro general
if (buscarPersonalRegistro) {
  buscarPersonalRegistro.addEventListener("input", mostrarRegistroGeneral);
}

// ========================================
// ASIGNAR TRABAJADOR A LA OBRA
// ========================================

async function asignarTrabajador(trabajador) {
  if (!obraPersonalActual) {
    mostrarMensajePersonal("No se seleccionó ninguna obra.");
    return;
  }

  if (personalSoloLectura || obraBloqueada(obraPersonalActual)) {
    mostrarMensajePersonal(
      "No se pueden asignar trabajadores a una obra finalizada o cancelada.",
    );
    return;
  }

  const yaAsignado = trabajadores.some(
    (asignado) =>
      Number(asignado.id_personal) === Number(trabajador.id_personal),
  );

  if (yaAsignado) {
    mostrarMensajePersonal("Este trabajador ya está asignado a esta obra.");
    return;
  }

  const confirmar = window.confirm(
    `¿Querés asignar a ${trabajador.nombre_trabajador} a la obra "${obraPersonalActual.nombre_obra}"?`,
  );

  if (!confirmar) return;

  try {
    const respuesta = await fetch(
      `/obras/${obraPersonalActual.id_obra}/trabajadores`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id_personal: Number(trabajador.id_personal),
        }),
      },
    );

    const resultado = await leerRespuesta(respuesta);

    if (!respuesta.ok) {
      throw new Error(resultado.mensaje || "No se pudo asignar el trabajador.");
    }

    mostrarMensajePersonal(
      resultado.mensaje || "Trabajador asignado correctamente.",
    );

    await Promise.all([
      cargarTrabajadores(obraPersonalActual.id_obra),
      cargarRegistroGeneral(),
    ]);
  } catch (error) {
    mostrarMensajePersonal(error.message);
  }
}

// ========================================
// LIMPIAR FORMULARIO DE PERSONAL
// ========================================

function limpiarFormularioPersonal() {
  formularioPersonal.reset();

  idPersonal.value = "";

  document.getElementById("tituloFormularioPersonal").textContent =
    "Registrar trabajador";

  document.getElementById("btnGuardarPersonal").textContent =
    "Registrar trabajador";

  mostrarMensajePersonal("");
}

// ========================================
// CANCELAR FORMULARIO
// ========================================

document.getElementById("btnCancelarPersonal").addEventListener("click", () => {
  if (personalSoloLectura) return;

  limpiarFormularioPersonal();
});

// ========================================
// PREPARAR MODIFICACIÓN
// ========================================

function prepararModificacionPersonal(trabajador) {
  if (personalSoloLectura || obraBloqueada(obraPersonalActual)) {
    mostrarMensajePersonal(
      "No se puede modificar personal de una obra finalizada o cancelada.",
    );
    return;
  }

  idPersonal.value = trabajador.id_personal;

  nombreTrabajador.value = trabajador.nombre_trabajador || "";

  cargoTrabajador.value = trabajador.cargo || "";

  telefonoTrabajador.value = trabajador.telefono || "";

  gmailTrabajador.value = trabajador.gmail || "";

  direccionTrabajador.value = trabajador.direccion || "";

  document.getElementById("tituloFormularioPersonal").textContent =
    "Modificar trabajador";

  document.getElementById("btnGuardarPersonal").textContent = "Guardar cambios";

  formularioPersonal.scrollIntoView({
    behavior: "smooth",
  });

  nombreTrabajador.focus();
}

// ========================================
// REGISTRAR O MODIFICAR TRABAJADOR
// ========================================

formularioPersonal.addEventListener("submit", async (event) => {
  event.preventDefault();

  // Protección adicional para obras cerradas
  if (personalSoloLectura || obraBloqueada(obraPersonalActual)) {
    mostrarMensajePersonal(
      "No se puede registrar ni modificar personal en una obra finalizada o cancelada.",
    );
    return;
  }

  const datos = {
    nombre_trabajador: nombreTrabajador.value.trim(),
    cargo: cargoTrabajador.value.trim(),
    telefono: telefonoTrabajador.value.trim(),
    gmail: gmailTrabajador.value.trim() || null,
    direccion: direccionTrabajador.value.trim() || null,
  };

  if (!datos.nombre_trabajador || !datos.cargo || !datos.telefono) {
    mostrarMensajePersonal("Completá el nombre, el cargo y el teléfono.");

    return;
  }

  const esModificacion = idPersonal.value !== "";

  const url = esModificacion
    ? `/obras/trabajadores/${idPersonal.value}`
    : "/obras/trabajadores";

  const metodo = esModificacion ? "PUT" : "POST";

  const botonGuardar = document.getElementById("btnGuardarPersonal");

  botonGuardar.disabled = true;

  mostrarMensajePersonal(
    esModificacion ? "Guardando cambios..." : "Registrando trabajador...",
  );

  try {
    const respuesta = await fetch(url, {
      method: metodo,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datos),
    });

    const resultado = await leerRespuesta(respuesta);

    if (!respuesta.ok) {
      throw new Error(resultado.mensaje || "No se pudo guardar el trabajador.");
    }

    mostrarMensajePersonal(
      resultado.mensaje || "Trabajador guardado correctamente.",
    );

    limpiarFormularioPersonal();

    await cargarRegistroGeneral();

    if (obraPersonalActual) {
      await cargarTrabajadores(obraPersonalActual.id_obra);
    }
  } catch (error) {
    mostrarMensajePersonal(error.message);
  } finally {
    botonGuardar.disabled = false;
  }
});

// ==================================================
// GESTIÓN DE MATERIALES DE LAS OBRAS
// ==================================================

// ========================================
// ABRIR PANEL DE MATERIALES
// ========================================

async function abrirPanelMateriales(obra) {
  if (!panelMateriales || !obra || !obra.id_obra) {
    console.error("No se encontró el panel o la obra no es válida.");
    return;
  }

  obraMaterialesActual = obra;

  materialesDisponibles = [];
  materialesSolicitud = [];
  solicitudesObra = [];
  movimientosObra = [];

  const soloConsulta = obraBloqueada(obra);

  document.getElementById("tituloMateriales").textContent = soloConsulta
    ? "Historial de materiales"
    : "Materiales de la obra";

  document.getElementById("nombreObraMateriales").textContent =
    obra.nombre_obra;

  formularioContenedor.classList.add("oculto");
  panelPersonal.classList.add("oculto");
  panelMateriales.classList.remove("oculto");

  const pestanaSolicitar = document.querySelector(
    '.pestana-material[data-pestana="solicitar"]',
  );

  if (pestanaSolicitar) {
    pestanaSolicitar.classList.toggle("oculto", soloConsulta);
  }

  selectorMaterial.disabled = soloConsulta;
  cantidadMaterial.disabled = soloConsulta;
  observacionSolicitud.disabled = soloConsulta;
  btnAgregarMaterial.disabled = soloConsulta;
  btnEnviarSolicitud.disabled = soloConsulta;

  materialesSolicitud = [];

  formularioSolicitudMateriales.reset();

  cantidadMaterial.value = 1;

  mostrarDetalleSolicitud();

  mostrarMensajeMateriales("");

  try {
    const tareas = [cargarSolicitudesObra(), cargarHistorialEntregas()];

    if (!soloConsulta) {
      tareas.push(cargarMaterialesDisponibles());
    } else {
      selectorMaterial.replaceChildren();

      const opcion = document.createElement("option");
      opcion.value = "";
      opcion.textContent = "Consulta no disponible";

      selectorMaterial.appendChild(opcion);
    }

    await Promise.all(tareas);

    cambiarPestanaMaterial(soloConsulta ? "solicitudes" : "solicitar");
  } catch (error) {
    mostrarMensajeMateriales(error.message);
  }

  panelMateriales.scrollIntoView({
    behavior: "smooth",
  });
}

// ========================================
// CERRAR PANEL DE MATERIALES
// ========================================

document.getElementById("btnCerrarMateriales").addEventListener("click", () => {
  panelMateriales.classList.add("oculto");

  obraMaterialesActual = null;

  materialesSolicitud = [];
  materialesDisponibles = [];
  solicitudesObra = [];
  movimientosObra = [];
});

// ========================================
// CARGAR MATERIALES DISPONIBLES
// ========================================

async function cargarMaterialesDisponibles() {
  selectorMaterial.disabled = true;

  const respuesta = await fetch("/materiales");
  const datos = await leerRespuesta(respuesta);

  if (!respuesta.ok || !Array.isArray(datos)) {
    throw new Error("No se pudieron cargar los materiales.");
  }

  materialesDisponibles = datos.filter(
    (material) => Number(material.stock_actual) > 0,
  );

  selectorMaterial.replaceChildren();

  const opcionInicial = document.createElement("option");

  opcionInicial.value = "";
  opcionInicial.textContent = "Seleccioná un material";

  selectorMaterial.appendChild(opcionInicial);

  materialesDisponibles.forEach((material) => {
    const opcion = document.createElement("option");

    opcion.value = material.id_material;

    opcion.textContent = `${material.nombre} (Stock: ${material.stock_actual})`;

    selectorMaterial.appendChild(opcion);
  });

  if (materialesDisponibles.length === 0) {
    selectorMaterial.replaceChildren();

    const opcion = document.createElement("option");
    opcion.value = "";
    opcion.textContent = "No hay materiales disponibles";

    selectorMaterial.appendChild(opcion);
  }

  selectorMaterial.disabled = materialesDisponibles.length === 0;
}

// ========================================
// MOSTRAR DETALLE DE LA NUEVA SOLICITUD
// ========================================

function mostrarDetalleSolicitud() {
  tablaDetalleSolicitud.replaceChildren();

  if (materialesSolicitud.length === 0) {
    const fila = document.createElement("tr");
    const celda = crearCelda("Todavía no agregaste materiales.");

    celda.colSpan = 4;

    fila.appendChild(celda);
    tablaDetalleSolicitud.appendChild(fila);

    return;
  }

  materialesSolicitud.forEach((item, indice) => {
    const fila = document.createElement("tr");

    fila.appendChild(crearCelda(item.nombre));
    fila.appendChild(crearCelda(item.stock));
    fila.appendChild(crearCelda(item.cantidad));

    const celdaAcciones = document.createElement("td");

    const botonEliminar = document.createElement("button");

    botonEliminar.type = "button";
    botonEliminar.textContent = "Eliminar";
    botonEliminar.className = "btn-secundario";

    botonEliminar.addEventListener("click", () => {
      if (obraBloqueada(obraMaterialesActual)) return;

      materialesSolicitud.splice(indice, 1);
      mostrarDetalleSolicitud();
    });

    celdaAcciones.appendChild(botonEliminar);

    fila.appendChild(celdaAcciones);

    tablaDetalleSolicitud.appendChild(fila);
  });
}

// ========================================
// AGREGAR MATERIAL A LA SOLICITUD
// ========================================

btnAgregarMaterial.addEventListener("click", () => {
  mostrarMensajeMateriales("");

  if (obraBloqueada(obraMaterialesActual)) {
    mostrarMensajeMateriales(
      "No se pueden agregar materiales a una obra cerrada.",
    );
    return;
  }

  const idMaterial = selectorMaterial.value;
  const cantidad = Number(cantidadMaterial.value);

  if (!idMaterial) {
    mostrarMensajeMateriales("Seleccioná un material del inventario.");

    selectorMaterial.focus();
    return;
  }

  if (
    cantidadMaterial.value.trim() === "" ||
    !Number.isInteger(cantidad) ||
    cantidad <= 0
  ) {
    mostrarMensajeMateriales("Ingresá una cantidad entera mayor que cero.");

    cantidadMaterial.focus();
    return;
  }

  const material = materialesDisponibles.find(
    (item) => String(item.id_material) === String(idMaterial),
  );

  if (!material) {
    mostrarMensajeMateriales("El material seleccionado no está disponible.");
    return;
  }

  const stock = Number(material.stock_actual);

  const materialExistente = materialesSolicitud.find(
    (item) => String(item.id_material) === String(idMaterial),
  );

  const cantidadAcumulada =
    cantidad + (materialExistente ? materialExistente.cantidad : 0);

  if (cantidadAcumulada > stock) {
    mostrarMensajeMateriales(
      `Stock insuficiente. Disponible: ${stock}. Ya agregaste: ${
        materialExistente ? materialExistente.cantidad : 0
      }.`,
    );
    return;
  }

  if (materialExistente) {
    materialExistente.cantidad = cantidadAcumulada;
  } else {
    materialesSolicitud.push({
      id_material: material.id_material,
      nombre: material.nombre,
      stock,
      cantidad,
    });
  }

  mostrarDetalleSolicitud();

  selectorMaterial.value = "";
  cantidadMaterial.value = 1;

  mostrarMensajeMateriales("Material agregado a la lista correctamente.");
});

// ========================================
// REGISTRAR SOLICITUD DE MATERIALES
// ========================================

formularioSolicitudMateriales.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!obraMaterialesActual) {
    mostrarMensajeMateriales("No se seleccionó una obra.");
    return;
  }

  if (obraBloqueada(obraMaterialesActual)) {
    mostrarMensajeMateriales(
      "No se pueden registrar solicitudes en una obra finalizada o cancelada.",
    );
    return;
  }

  if (materialesSolicitud.length === 0) {
    mostrarMensajeMateriales("Agregá al menos un material a la solicitud.");
    return;
  }

  const datos = {
    id_obra: Number(obraMaterialesActual.id_obra),
    observacion: observacionSolicitud.value.trim(),
    detalles: materialesSolicitud.map((item) => ({
      id_material: Number(item.id_material),
      cantidad_solicitada: Number(item.cantidad),
    })),
  };

  btnEnviarSolicitud.disabled = true;

  mostrarMensajeMateriales("Registrando solicitud...");

  try {
    const respuesta = await fetch("/materiales/solicitudes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datos),
    });

    const resultado = await leerRespuesta(respuesta);

    if (!respuesta.ok) {
      throw new Error(
        resultado.mensaje || "No se pudo registrar la solicitud.",
      );
    }

    materialesSolicitud = [];

    formularioSolicitudMateriales.reset();

    cantidadMaterial.value = 1;

    mostrarDetalleSolicitud();

    mostrarMensajeMateriales(
      resultado.mensaje || "Solicitud registrada correctamente.",
    );

    await Promise.all([cargarSolicitudesObra(), cargarMaterialesDisponibles()]);
  } catch (error) {
    mostrarMensajeMateriales(error.message);
  } finally {
    btnEnviarSolicitud.disabled = false;
  }
});

// ========================================
// PESTAÑAS DE MATERIALES
// ========================================

function cambiarPestanaMaterial(nombrePestana) {
  if (
    nombrePestana === "solicitar" &&
    obraMaterialesActual &&
    obraBloqueada(obraMaterialesActual)
  ) {
    return;
  }

  const pestanas = document.querySelectorAll(".pestana-material");

  pestanas.forEach((pestana) => {
    const seleccionada = pestana.dataset.pestana === nombrePestana;

    pestana.classList.toggle("activa", seleccionada);
    pestana.setAttribute("aria-selected", seleccionada ? "true" : "false");
  });

  const contenidos = {
    solicitar: "contenido-solicitar",
    solicitudes: "contenido-solicitudes",
    historial: "contenido-historial",
  };

  Object.entries(contenidos).forEach(([nombre, id]) => {
    const contenido = document.getElementById(id);

    if (contenido) {
      contenido.classList.toggle("oculto", nombre !== nombrePestana);
    }
  });

  if (nombrePestana === "solicitudes") {
    cargarSolicitudesObra();
  }

  if (nombrePestana === "historial") {
    cargarHistorialEntregas();
  }
}

document.querySelectorAll(".pestana-material").forEach((pestana) => {
  pestana.addEventListener("click", () => {
    cambiarPestanaMaterial(pestana.dataset.pestana);
  });
});

// ========================================
// LISTAR SOLICITUDES DE LA OBRA
// ========================================

async function cargarSolicitudesObra() {
  if (!obraMaterialesActual) return;

  tablaSolicitudes.innerHTML =
    '<tr><td colspan="5">Cargando solicitudes...</td></tr>';

  try {
    const respuesta = await fetch("/materiales/solicitudes");

    const datos = await leerRespuesta(respuesta);

    if (!respuesta.ok || !Array.isArray(datos)) {
      throw new Error("No se pudieron cargar las solicitudes.");
    }

    solicitudesObra = datos.filter(
      (solicitud) =>
        Number(solicitud.id_obra) === Number(obraMaterialesActual.id_obra),
    );

    mostrarSolicitudesObra();
  } catch (error) {
    tablaSolicitudes.innerHTML =
      '<tr><td colspan="5">Error al cargar las solicitudes.</td></tr>';

    mostrarMensajeMateriales(error.message);
  }
}

// ========================================
// MOSTRAR SOLICITUDES
// ========================================

function mostrarSolicitudesObra() {
  tablaSolicitudes.replaceChildren();

  if (solicitudesObra.length === 0) {
    const fila = document.createElement("tr");
    const celda = crearCelda("Esta obra todavía no tiene solicitudes.");

    celda.colSpan = 5;

    fila.appendChild(celda);
    tablaSolicitudes.appendChild(fila);

    return;
  }

  solicitudesObra.forEach((solicitud) => {
    const fila = document.createElement("tr");

    fila.appendChild(crearCelda(solicitud.id_solicitud));

    fila.appendChild(crearCelda(formatearFecha(solicitud.fecha_solicitud)));

    fila.appendChild(crearCelda(solicitud.usuario_solicitante));

    const celdaEstado = document.createElement("td");
    const etiqueta = document.createElement("span");

    etiqueta.textContent = solicitud.estado || "Pendiente";

    etiqueta.className = `estado-${normalizarTexto(solicitud.estado).replace(/\s+/g, "-")}`;

    celdaEstado.appendChild(etiqueta);
    fila.appendChild(celdaEstado);

    const celdaDetalles = document.createElement("td");

    const textoCantidad = document.createElement("span");

    textoCantidad.textContent = `${solicitud.cantidad_items || 0} material(es) `;

    celdaDetalles.appendChild(textoCantidad);

    const botonVer = document.createElement("button");

    botonVer.type = "button";
    botonVer.textContent = "Ver detalles";
    botonVer.className = "btn-secundario";

    botonVer.addEventListener("click", () => {
      verDetallesSolicitud(solicitud.id_solicitud, fila);
    });

    celdaDetalles.appendChild(botonVer);
    fila.appendChild(celdaDetalles);

    tablaSolicitudes.appendChild(fila);
  });
}

// ========================================
// VER DETALLES DE UNA SOLICITUD
// ========================================

async function verDetallesSolicitud(idSolicitud, filaPrincipal) {
  const filaExistente = filaPrincipal.nextElementSibling;

  if (
    filaExistente &&
    filaExistente.classList.contains("fila-detalle-solicitud")
  ) {
    filaExistente.remove();
    return;
  }

  try {
    const respuesta = await fetch(`/materiales/solicitudes/${idSolicitud}`);

    const detalles = await leerRespuesta(respuesta);

    if (!respuesta.ok || !Array.isArray(detalles)) {
      throw new Error("No se pudieron obtener los detalles.");
    }

    const filaDetalle = document.createElement("tr");

    filaDetalle.className = "fila-detalle-solicitud";

    const celda = document.createElement("td");

    celda.colSpan = 5;

    const tabla = document.createElement("table");
    const encabezado = document.createElement("thead");
    const filaEncabezado = document.createElement("tr");

    ["Material", "Solicitado", "Aprobado", "Entregado", "Pendiente"].forEach(
      (texto) => {
        const th = document.createElement("th");
        th.textContent = texto;
        filaEncabezado.appendChild(th);
      },
    );

    encabezado.appendChild(filaEncabezado);
    tabla.appendChild(encabezado);

    const cuerpo = document.createElement("tbody");

    detalles.forEach((detalle) => {
      const fila = document.createElement("tr");

      const solicitado = Number(detalle.cantidad_solicitada) || 0;
      const aprobado = Number(detalle.cantidad_aprobada) || 0;
      const entregado = Number(detalle.cantidad_entregada) || 0;

      const valores = [
        detalle.nombre_material,
        solicitado,
        aprobado,
        entregado,
        Math.max(0, aprobado - entregado),
      ];

      valores.forEach((valor) => {
        const celdaDetalle = document.createElement("td");
        celdaDetalle.textContent = valor ?? "—";
        fila.appendChild(celdaDetalle);
      });

      cuerpo.appendChild(fila);
    });

    tabla.appendChild(cuerpo);

    celda.appendChild(tabla);
    filaDetalle.appendChild(celda);

    filaPrincipal.after(filaDetalle);
  } catch (error) {
    mostrarMensajeMateriales(error.message);
  }
}

// ========================================
// HISTORIAL DE ENTREGAS DE LA OBRA
// ========================================

async function cargarHistorialEntregas() {
  if (!obraMaterialesActual) return;

  tablaHistorialEntregas.innerHTML =
    '<tr><td colspan="4">Cargando historial...</td></tr>';

  try {
    const respuesta = await fetch("/materiales/movimientos");

    const datos = await leerRespuesta(respuesta);

    if (!respuesta.ok || !Array.isArray(datos)) {
      throw new Error("No se pudo cargar el historial.");
    }

    movimientosObra = datos.filter((movimiento) => {
      return (
        Number(movimiento.id_obra) === Number(obraMaterialesActual.id_obra) &&
        normalizarTexto(movimiento.tipo_movimiento) === "salida"
      );
    });

    mostrarHistorialEntregas();
  } catch (error) {
    tablaHistorialEntregas.innerHTML =
      '<tr><td colspan="4">Error al cargar el historial.</td></tr>';

    mostrarMensajeMateriales(error.message);
  }
}

// ========================================
// MOSTRAR HISTORIAL
// ========================================

function mostrarHistorialEntregas() {
  tablaHistorialEntregas.replaceChildren();

  if (movimientosObra.length === 0) {
    const fila = document.createElement("tr");

    const celda = crearCelda(
      "Todavía no hay materiales entregados a esta obra.",
    );

    celda.colSpan = 4;

    fila.appendChild(celda);
    tablaHistorialEntregas.appendChild(fila);

    return;
  }

  movimientosObra.forEach((movimiento) => {
    const fila = document.createElement("tr");

    fila.appendChild(crearCelda(formatearFecha(movimiento.fecha_movimiento)));

    fila.appendChild(crearCelda(movimiento.nombre_material));

    fila.appendChild(crearCelda(movimiento.cantidad));

    fila.appendChild(crearCelda(movimiento.usuario));

    tablaHistorialEntregas.appendChild(fila);
  });
}

// ==================================================
// INICIALIZAR MÓDULO DE OBRAS
// ==================================================

async function inicializarObras() {
  await cargarObras();
}

inicializarObras();
