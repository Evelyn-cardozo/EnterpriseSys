
// ========================================
// ENTERPRISESYS - GESTIÓN DE INVENTARIO
// ========================================

document.addEventListener("DOMContentLoaded", () => {

  const API = "/materiales";

  // ========================================
  // ELEMENTOS DEL HTML
  // ========================================

  const $ = id => document.getElementById(id);

  const tablaMateriales = $("tablaMateriales");
  const totalMateriales = $("totalMateriales");
  const stockBajo = $("stockBajo");
  const buscarMaterial = $("buscarMaterial");
  const mensajeInventario = $("mensajeInventario");

  const tablaSolicitudes = $("tablaSolicitudes");
  const buscarSolicitud = $("buscarSolicitud");
  const filtroEstadoSolicitud = $("filtroEstadoSolicitud");
  const mensajeSolicitudes = $("mensajeSolicitudes");

  const tablaHistorial = $("tablaHistorial");
  const buscarHistorial = $("buscarHistorial");
  const mensajeHistorial = $("mensajeHistorial");

  const tablaMovimientos = $("tablaMovimientos");
  const buscarMovimiento = $("buscarMovimiento");
  const filtroTipoMovimiento = $("filtroTipoMovimiento");
  const mensajeMovimientos = $("mensajeMovimientos");

  const modalMaterial = $("modalMaterial");
  const modalDetalle = $("modalDetalleSolicitud");
  const modalEntrada = $("modalEntrada");

  const formMaterial = $("formMaterial");
  const formEntrada = $("formEntrada");

  let materiales = [];
  let solicitudes = [];
  let movimientos = [];

  let materialEditando = null;

  // ========================================
  // ESTILOS COMPLEMENTARIOS
  // ========================================

  const estilos = document.createElement("style");

  estilos.textContent = `
    .modal {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 1000;
      justify-content: center;
      align-items: center;
      padding: 20px;
      background: rgba(16,42,67,.55);
      overflow-y: auto;
    }

    .modal.visible {
      display: flex !important;
    }

    .modal-contenido {
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      padding: 25px;
      background: white;
      border-radius: 10px;
    }

    .modal-amplio {
      max-width: 850px;
    }

    .modal-encabezado {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .btn-cerrar {
      border: none;
      background: transparent;
      font-size: 26px;
      cursor: pointer;
    }

    .estado-stock,
    .estado-solicitud {
      display: inline-block;
      padding: 5px 9px;
      border-radius: 5px;
      font-size: 12px;
      font-weight: 600;
    }

    .stock-normal {
      color: #16803c;
      background: #e8f6ec;
    }

    .stock-bajo {
      color: #b86a08;
      background: #fff2dc;
    }

    .stock-agotado {
      color: #c62828;
      background: #fff0f0;
    }

    .estado-pendiente {
      color: #a16207;
      background: #fef3c7;
    }

    .estado-aprobada {
      color: #1d4ed8;
      background: #dbeafe;
    }

    .estado-parcial {
      color: #7c3aed;
      background: #ede9fe;
    }

    .estado-entregada {
      color: #16803c;
      background: #dcfce7;
    }

    .estado-rechazada {
      color: #c62828;
      background: #fee2e2;
    }

    .acciones-solicitud {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .acciones-solicitud button {
      padding: 7px 9px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 12px;
    }

    .btn-modificar,
    .btn-ver {
      background: #e8eff8;
      color: #17365d;
    }

    .btn-aprobar {
      background: #dcfce7;
      color: #166534;
    }

    .btn-rechazar {
      background: #fee2e2;
      color: #b91c1c;
    }

    .btn-entregar {
      background: #ede9fe;
      color: #6d28d9;
    }

    .detalle-solicitud {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }

    .detalle-solicitud th,
    .detalle-solicitud td {
      padding: 10px;
      border-bottom: 1px solid #e2e8f0;
      text-align: left;
      font-size: 13px;
    }

    .detalle-solicitud input {
      width: 85px;
      padding: 7px;
    }

    .informacion-solicitud {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .informacion-solicitud p {
      padding: 9px;
      background: #f4f7fb;
      border-radius: 5px;
    }

    .mensaje-error {
      color: #c62828;
    }

    .mensaje-exito {
      color: #16803c;
    }

    button:disabled {
      opacity: .6;
      cursor: not-allowed;
    }

    @media(max-width:500px) {
      .informacion-solicitud {
        grid-template-columns: 1fr;
      }

      .modal-contenido {
        padding: 16px;
      }
    }
  `;

  document.head.appendChild(estilos);

  // ========================================
  // FUNCIONES AUXILIARES
  // ========================================

  function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[caracter]);
  }

  function mostrarMensaje(elemento, texto, tipo = "") {
    if (!elemento) return;

    elemento.textContent = texto;
    elemento.className = `mensaje ${tipo}`.trim();
  }

  function formatearPrecio(valor) {
    return Number(valor || 0).toLocaleString("es-PY") + " Gs.";
  }

  function formatearFecha(fecha) {
    if (!fecha) return "Sin fecha";

    const valor = new Date(fecha);

    if (Number.isNaN(valor.getTime())) {
      return escaparHTML(fecha);
    }

    return valor.toLocaleString("es-PY");
  }

  async function procesarRespuesta(respuesta) {
    const texto = await respuesta.text();

    let resultado = {};

    if (texto) {
      try {
        resultado = JSON.parse(texto);
      } catch {
        resultado = { mensaje: texto };
      }
    }

    if (!respuesta.ok) {
      const error = new Error(
        resultado.mensaje ||
        resultado.error ||
        `Error del servidor (${respuesta.status})`
      );

      error.status = respuesta.status;

      throw error;
    }

    return resultado;
  }

  function obtenerDatos(resultado) {
    if (Array.isArray(resultado)) return resultado;

    if (!resultado || typeof resultado !== "object") {
      return [];
    }

    for (const propiedad of [
      "materiales",
      "solicitudes",
      "movimientos",
      "detalles",
      "data",
      "resultado"
    ]) {
      if (Array.isArray(resultado[propiedad])) {
        return resultado[propiedad];
      }
    }

    return [];
  }

  async function solicitar(url, opciones = {}) {
    const respuesta = await fetch(url, opciones);
    return procesarRespuesta(respuesta);
  }

  function obtenerEstadoVisual(solicitud) {
    if (solicitud.estado === "Aprobada") {
      const detalles = solicitud.detalles || [];

      const tieneEntrega = detalles.some(item =>
        Number(item.cantidad_entregada) > 0
      );

      if (tieneEntrega) {
        const completo = detalles.every(item =>
          Number(item.cantidad_entregada) >=
          Number(item.cantidad_aprobada)
        );

        return completo ? "Entregada" : "Parcial";
      }
    }

    return solicitud.estado;
  }

  function claseEstado(estado) {
    return {
      Pendiente: "estado-pendiente",
      Aprobada: "estado-aprobada",
      Parcial: "estado-parcial",
      Entregada: "estado-entregada",
      Rechazada: "estado-rechazada"
    }[estado] || "";
  }

  function abrirModal(modal) {
    modal?.classList.add("visible");
    modal?.setAttribute("aria-hidden", "false");
  }

  function cerrarModal(modal) {
    modal?.classList.remove("visible");
    modal?.setAttribute("aria-hidden", "true");
  }

  // ========================================
  // MANEJO DE PERMISOS DE MOVIMIENTOS
  // ========================================

  function ocultarSeccionMovimientos() {
    const seccion = $("seccionMovimientos");

    if (seccion) {
      seccion.style.display = "none";
    }

    const botonEntrada = $("btnRegistrarEntrada");
    const botonActualizar = $("btnActualizarMovimientos");

    if (botonEntrada) botonEntrada.style.display = "none";
    if (botonActualizar) botonActualizar.style.display = "none";

    movimientos = [];
  }

  // ========================================
  // MATERIALES: MODAL
  // ========================================

  function abrirFormularioMaterial(material = null) {
    if (!formMaterial) return;

    materialEditando = material
      ? material.id_material
      : null;

    formMaterial.reset();

    $("nombreMaterial").value = material?.nombre || "";
    $("descripcionMaterial").value = material?.descripcion || "";
    $("precioMaterial").value = material?.precio_actual ?? "";
    $("stockMaterial").value = material?.stock_actual ?? "";
    $("stockMinimoMaterial").value = material?.stock_minimo ?? "";
    $("ubicacionMaterial").value = material?.ubicacion_fisica || "";

    $("stockMaterial").disabled = Boolean(material);

    $("tituloModalMaterial").textContent = material
      ? "Modificar material"
      : "Nuevo material";

    abrirModal(modalMaterial);
  }

  function cerrarFormularioMaterial() {
    cerrarModal(modalMaterial);
    formMaterial?.reset();

    if ($("stockMaterial")) {
      $("stockMaterial").disabled = false;
    }

    materialEditando = null;
  }

  $("btnNuevoMaterial")?.addEventListener("click", () => {
    abrirFormularioMaterial();
  });

  $("cerrarModalMaterial")?.addEventListener(
    "click",
    cerrarFormularioMaterial
  );

  $("cancelarMaterial")?.addEventListener(
    "click",
    cerrarFormularioMaterial
  );

  modalMaterial?.addEventListener("click", evento => {
    if (evento.target === modalMaterial) {
      cerrarFormularioMaterial();
    }
  });

  // ========================================
  // MATERIALES: CARGAR
  // ========================================

  async function cargarMateriales() {
    if (!tablaMateriales) return;

    tablaMateriales.innerHTML =
      `<tr><td colspan="7">Cargando materiales...</td></tr>`;

    try {
      const resultado = await solicitar(API);

      materiales = obtenerDatos(resultado);

      actualizarResumen();
      mostrarMateriales();
      actualizarSelectMateriales();

      mostrarMensaje(mensajeInventario, "");

    } catch (error) {
      console.error("Error al cargar materiales:", error);

      tablaMateriales.innerHTML =
        `<tr><td colspan="7">No se pudieron cargar los materiales.</td></tr>`;

      mostrarMensaje(
        mensajeInventario,
        error.message,
        "mensaje-error"
      );
    }
  }

  function actualizarResumen() {
    if (totalMateriales) {
      totalMateriales.textContent = materiales.length;
    }

    if (stockBajo) {
      stockBajo.textContent = materiales.filter(material =>
        Number(material.stock_actual) <= Number(material.stock_minimo)
      ).length;
    }
  }

  function mostrarMateriales() {
    if (!tablaMateriales) return;

    const busqueda = (buscarMaterial?.value || "")
      .trim()
      .toLocaleLowerCase("es");

    const filtrados = materiales.filter(material => {
      const texto = [
        material.id_material,
        material.nombre,
        material.descripcion,
        material.ubicacion_fisica
      ].join(" ").toLocaleLowerCase("es");

      return texto.includes(busqueda);
    });

    if (!filtrados.length) {
      tablaMateriales.innerHTML = `
        <tr>
          <td colspan="7">
            ${materiales.length
              ? "No se encontraron materiales."
              : "Todavía no hay materiales registrados."}
          </td>
        </tr>
      `;
      return;
    }

    tablaMateriales.innerHTML = filtrados.map(material => {
      const stock = Number(material.stock_actual || 0);
      const minimo = Number(material.stock_minimo || 0);

      let clase = "stock-normal";
      let estado = "Normal";

      if (stock <= 0) {
        clase = "stock-agotado";
        estado = "Agotado";
      } else if (stock <= minimo) {
        clase = "stock-bajo";
        estado = "Stock bajo";
      }

      return `
        <tr>
          <td>${escaparHTML(material.nombre)}</td>

          <td>${escaparHTML(material.descripcion || "Sin descripción")}</td>

          <td>${formatearPrecio(material.precio_actual)}</td>

          <td>
            <span class="estado-stock ${clase}">
              ${stock} - ${estado}
            </span>
          </td>

          <td>${minimo}</td>

          <td>${escaparHTML(material.ubicacion_fisica || "Sin ubicación")}</td>

          <td>
            <button
              type="button"
              class="btn-modificar"
              data-accion="editar-material"
              data-id="${escaparHTML(material.id_material)}">
              Modificar
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  buscarMaterial?.addEventListener("input", mostrarMateriales);

  tablaMateriales?.addEventListener("click", evento => {
    const boton = evento.target.closest(
      '[data-accion="editar-material"]'
    );

    if (!boton) return;

    const material = materiales.find(item =>
      String(item.id_material) === String(boton.dataset.id)
    );

    if (material) abrirFormularioMaterial(material);
  });

  // ========================================
  // MATERIALES: GUARDAR
  // ========================================

  formMaterial?.addEventListener("submit", async evento => {
    evento.preventDefault();

    const datos = {
      nombre: $("nombreMaterial").value.trim(),
      descripcion: $("descripcionMaterial").value.trim(),
      precio_actual: Number($("precioMaterial").value),
      stock_minimo: Number($("stockMinimoMaterial").value),
      ubicacion_fisica: $("ubicacionMaterial").value.trim()
    };

    const editando = materialEditando !== null;

    if (!editando) {
      datos.stock_actual = Number($("stockMaterial").value);
    }

    if (!datos.nombre) {
      mostrarMensaje(
        mensajeInventario,
        "El nombre es obligatorio.",
        "mensaje-error"
      );
      return;
    }

    if (!Number.isFinite(datos.precio_actual) || datos.precio_actual < 0) {
      mostrarMensaje(
        mensajeInventario,
        "El precio no es válido.",
        "mensaje-error"
      );
      return;
    }

    if (!Number.isInteger(datos.stock_minimo) || datos.stock_minimo < 0) {
      mostrarMensaje(
        mensajeInventario,
        "El stock mínimo no es válido.",
        "mensaje-error"
      );
      return;
    }

    if (
      !editando &&
      (!Number.isInteger(datos.stock_actual) || datos.stock_actual < 0)
    ) {
      mostrarMensaje(
        mensajeInventario,
        "El stock inicial no es válido.",
        "mensaje-error"
      );
      return;
    }

    const boton = formMaterial.querySelector('[type="submit"]');

    if (boton) boton.disabled = true;

    try {
      const url = editando
        ? `${API}/${encodeURIComponent(materialEditando)}`
        : API;

      const resultado = await solicitar(url, {
        method: editando ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(datos)
      });

      cerrarFormularioMaterial();

      mostrarMensaje(
        mensajeInventario,
        resultado.mensaje || "Material guardado correctamente.",
        "mensaje-exito"
      );

      await cargarMateriales();

    } catch (error) {
      mostrarMensaje(
        mensajeInventario,
        error.message,
        "mensaje-error"
      );
    } finally {
      if (boton) boton.disabled = false;
    }
  });

  // ========================================
  // SOLICITUDES: CARGAR
  // ========================================

  async function cargarSolicitudes() {
    if (!tablaSolicitudes) return;

    tablaSolicitudes.innerHTML =
      `<tr><td colspan="7">Cargando solicitudes...</td></tr>`;

    try {
      const resultado = await solicitar(`${API}/solicitudes`);

      solicitudes = obtenerDatos(resultado);

      await Promise.all(solicitudes.map(async solicitud => {
        if (solicitud.estado !== "Aprobada") return;

        try {
          solicitud.detalles = await obtenerDetalleSolicitud(
            solicitud.id_solicitud
          );
        } catch (error) {
          console.error("Error al obtener detalle:", error);
        }
      }));

      mostrarSolicitudes();
      mostrarHistorial();

      mostrarMensaje(mensajeSolicitudes, "");

    } catch (error) {
      console.error("Error al cargar solicitudes:", error);

      tablaSolicitudes.innerHTML =
        `<tr><td colspan="7">No se pudieron cargar las solicitudes.</td></tr>`;

      mostrarMensaje(
        mensajeSolicitudes,
        error.message,
        "mensaje-error"
      );
    }
  }

  // ========================================
  // SOLICITUDES: MOSTRAR
  // ========================================

  function mostrarSolicitudes() {
    if (!tablaSolicitudes) return;

    const busqueda = (buscarSolicitud?.value || "")
      .trim()
      .toLocaleLowerCase("es");

    const estadoFiltro = filtroEstadoSolicitud?.value || "";

    const filtradas = solicitudes.filter(solicitud => {
      const estado = obtenerEstadoVisual(solicitud);

      const texto = [
        solicitud.id_solicitud,
        solicitud.nombre_obra,
        solicitud.usuario_solicitante,
        estado
      ].join(" ").toLocaleLowerCase("es");

      return texto.includes(busqueda) &&
        (!estadoFiltro || estado === estadoFiltro);
    });

    if (!filtradas.length) {
      tablaSolicitudes.innerHTML = `
        <tr>
          <td colspan="7">
            ${solicitudes.length
              ? "No se encontraron solicitudes."
              : "Todavía no hay solicitudes registradas."}
          </td>
        </tr>
      `;
      return;
    }

    tablaSolicitudes.innerHTML = filtradas.map(solicitud => {
      const estado = obtenerEstadoVisual(solicitud);
      const id = escaparHTML(solicitud.id_solicitud);

      let acciones = `
        <button
          type="button"
          class="btn-ver"
          data-accion="ver"
          data-id="${id}">
          Ver
        </button>
      `;

      if (solicitud.estado === "Pendiente") {
        acciones += `
          <button
            type="button"
            class="btn-aprobar"
            data-accion="aprobar"
            data-id="${id}">
            Aprobar
          </button>

          <button
            type="button"
            class="btn-rechazar"
            data-accion="rechazar"
            data-id="${id}">
            Rechazar
          </button>
        `;
      }

      if (solicitud.estado === "Aprobada") {
        acciones += `
          <button
            type="button"
            class="btn-entregar"
            data-accion="entregar"
            data-id="${id}">
            Entregar
          </button>
        `;
      }

      return `
        <tr>
          <td>${id}</td>
          <td>${escaparHTML(solicitud.nombre_obra)}</td>
          <td>${escaparHTML(solicitud.usuario_solicitante)}</td>
          <td>${formatearFecha(solicitud.fecha_solicitud)}</td>
          <td>${escaparHTML(solicitud.cantidad_items ?? "-")}</td>

          <td>
            <span class="estado-solicitud ${claseEstado(estado)}">
              ${escaparHTML(estado)}
            </span>
          </td>

          <td>
            <div class="acciones-solicitud">${acciones}</div>
          </td>
        </tr>
      `;
    }).join("");
  }

  buscarSolicitud?.addEventListener("input", mostrarSolicitudes);

  filtroEstadoSolicitud?.addEventListener(
    "change",
    mostrarSolicitudes
  );

  $("btnActualizarSolicitudes")?.addEventListener(
    "click",
    cargarSolicitudes
  );

  // ========================================
  // DETALLE DE SOLICITUD
  // ========================================

  async function obtenerDetalleSolicitud(id) {
    const resultado = await solicitar(
      `${API}/solicitudes/${encodeURIComponent(id)}`
    );

    return obtenerDatos(resultado);
  }

  function mostrarDetalleEnModal(id, detalles, modo = "ver") {
    if (!detalles.length) {
      throw new Error("La solicitud no contiene materiales.");
    }

    const primero = detalles[0];

    const filas = detalles.map(item => {
      let cantidad = "";

      if (modo === "aprobar") {
        cantidad = `
          <input
            type="number"
            class="cantidad-aprobada"
            data-id="${escaparHTML(item.id_detalle)}"
            min="0"
            max="${escaparHTML(item.cantidad_solicitada)}"
            value="${escaparHTML(item.cantidad_solicitada)}">
        `;
      } else if (modo === "entregar") {
        const restante = Math.max(
          0,
          Number(item.cantidad_aprobada) -
          Number(item.cantidad_entregada)
        );

        cantidad = `
          <input
            type="number"
            class="cantidad-entregada"
            data-id="${escaparHTML(item.id_detalle)}"
            min="0"
            max="${restante}"
            value="${restante}">
        `;
      } else {
        cantidad = escaparHTML(item.cantidad_solicitada);
      }

      return `
        <tr>
          <td>${escaparHTML(item.nombre_material)}</td>
          <td>${escaparHTML(item.cantidad_solicitada)}</td>
          <td>${escaparHTML(item.cantidad_aprobada)}</td>
          <td>${escaparHTML(item.cantidad_entregada)}</td>
          ${modo !== "ver" ? `<td>${cantidad}</td>` : ""}
        </tr>
      `;
    }).join("");

    $("contenidoDetalleSolicitud").innerHTML = `
      <div class="informacion-solicitud">
        <p><strong>Obra:</strong> ${escaparHTML(primero.nombre_obra)}</p>
        <p><strong>Solicitante:</strong> ${escaparHTML(primero.usuario_solicitante)}</p>
        <p><strong>Fecha:</strong> ${formatearFecha(primero.fecha_solicitud)}</p>
        <p><strong>Estado:</strong> ${escaparHTML(primero.estado)}</p>
      </div>

      <table class="detalle-solicitud">
        <thead>
          <tr>
            <th>Material</th>
            <th>Solicitado</th>
            <th>Aprobado</th>
            <th>Entregado</th>
            ${modo !== "ver"
              ? `<th>${modo === "aprobar" ? "Autorizar" : "Entregar ahora"}</th>`
              : ""}
          </tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>
    `;

    // El título es opcional para evitar errores si no existe en el HTML.
    const titulo = $("tituloModalDetalle");

    if (titulo) {
      titulo.textContent = `Solicitud N.º ${id}`;
    }

    abrirModal(modalDetalle);

    return primero;
  }

  function cerrarDetalle() {
    cerrarModal(modalDetalle);

    if ($("contenidoDetalleSolicitud")) {
      $("contenidoDetalleSolicitud").innerHTML = "";
    }
  }

  $("cerrarModalDetalle")?.addEventListener(
    "click",
    cerrarDetalle
  );

  modalDetalle?.addEventListener("click", evento => {
    if (evento.target === modalDetalle) {
      cerrarDetalle();
    }
  });

  // ========================================
  // SOLICITUDES: VER
  // ========================================

  async function verSolicitud(id) {
    try {
      const detalles = await obtenerDetalleSolicitud(id);

      mostrarDetalleEnModal(id, detalles, "ver");

    } catch (error) {
      mostrarMensaje(
        mensajeSolicitudes,
        error.message,
        "mensaje-error"
      );
    }
  }

  // ========================================
  // SOLICITUDES: APROBAR
  // ========================================

  async function aprobarSolicitud(id) {
    try {
      const detalles = await obtenerDetalleSolicitud(id);

      mostrarDetalleEnModal(id, detalles, "aprobar");

      const boton = document.createElement("button");

      boton.type = "button";
      boton.className = "btn btn-principal";
      boton.textContent = "Confirmar aprobación";

      $("contenidoDetalleSolicitud").appendChild(boton);

      boton.addEventListener("click", async () => {
        const entradas = [
          ...modalDetalle.querySelectorAll(".cantidad-aprobada")
        ];

        const detalleAprobado = [];

        for (const entrada of entradas) {
          const cantidad = Number(entrada.value);
          const maximo = Number(entrada.max);

          if (
            !Number.isInteger(cantidad) ||
            cantidad < 0 ||
            cantidad > maximo
          ) {
            mostrarMensaje(
              mensajeSolicitudes,
              "Verificá las cantidades aprobadas.",
              "mensaje-error"
            );
            return;
          }

          detalleAprobado.push({
            id_detalle: Number(entrada.dataset.id),
            cantidad_aprobada: cantidad
          });
        }

        // No permitir aprobar todos los materiales con cantidad cero.
        if (!detalleAprobado.some(item =>
          item.cantidad_aprobada > 0
        )) {
          mostrarMensaje(
            mensajeSolicitudes,
            "Debés aprobar al menos un material con cantidad mayor a cero.",
            "mensaje-error"
          );
          return;
        }

        boton.disabled = true;

        try {
          const resultado = await solicitar(
            `${API}/solicitudes/${encodeURIComponent(id)}/aprobar`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                detalles: detalleAprobado
              })
            }
          );

          cerrarDetalle();

          mostrarMensaje(
            mensajeSolicitudes,
            resultado.mensaje || "Solicitud aprobada correctamente.",
            "mensaje-exito"
          );

          await cargarSolicitudes();
          await cargarMateriales();

        } catch (error) {
          mostrarMensaje(
            mensajeSolicitudes,
            error.message,
            "mensaje-error"
          );

          boton.disabled = false;
        }
      });

    } catch (error) {
      mostrarMensaje(
        mensajeSolicitudes,
        error.message,
        "mensaje-error"
      );
    }
  }

  // ========================================
  // SOLICITUDES: RECHAZAR
  // ========================================

  async function rechazarSolicitud(id) {
    if (!window.confirm(`¿Rechazar la solicitud N.º ${id}?`)) {
      return;
    }

    try {
      const resultado = await solicitar(
        `${API}/solicitudes/${encodeURIComponent(id)}/rechazar`,
        {
          method: "PATCH"
        }
      );

      mostrarMensaje(
        mensajeSolicitudes,
        resultado.mensaje || "Solicitud rechazada.",
        "mensaje-exito"
      );

      await cargarSolicitudes();

    } catch (error) {
      mostrarMensaje(
        mensajeSolicitudes,
        error.message,
        "mensaje-error"
      );
    }
  }

  // ========================================
  // SOLICITUDES: ENTREGAR
  // ========================================

  async function entregarSolicitud(id) {
    try {
      const detalles = await obtenerDetalleSolicitud(id);

      const pendientes = detalles.filter(item =>
        Number(item.cantidad_aprobada) >
        Number(item.cantidad_entregada)
      );

      if (!pendientes.length) {
        throw new Error(
          "No hay cantidades pendientes de entrega."
        );
      }

      mostrarDetalleEnModal(id, pendientes, "entregar");

      const boton = document.createElement("button");

      boton.type = "button";
      boton.className = "btn btn-principal";
      boton.textContent = "Registrar entrega";

      $("contenidoDetalleSolicitud").appendChild(boton);

      boton.addEventListener("click", async () => {
        const entradas = [
          ...modalDetalle.querySelectorAll(".cantidad-entregada")
        ];

        const entregas = [];

        for (const entrada of entradas) {
          const cantidad = Number(entrada.value);
          const maximo = Number(entrada.max);

          if (
            !Number.isInteger(cantidad) ||
            cantidad < 0 ||
            cantidad > maximo
          ) {
            mostrarMensaje(
              mensajeSolicitudes,
              "Verificá las cantidades que se entregarán.",
              "mensaje-error"
            );
            return;
          }

          if (cantidad > 0) {
            entregas.push({
              id_detalle: Number(entrada.dataset.id),
              cantidad_entregada: cantidad
            });
          }
        }

        if (!entregas.length) {
          mostrarMensaje(
            mensajeSolicitudes,
            "Ingresá al menos una cantidad para entregar.",
            "mensaje-error"
          );
          return;
        }

        boton.disabled = true;

        try {
          const resultado = await solicitar(
            `${API}/solicitudes/${encodeURIComponent(id)}/entregar`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                detalles: entregas
              })
            }
          );

          cerrarDetalle();

          mostrarMensaje(
            mensajeSolicitudes,
            resultado.mensaje || "Entrega registrada correctamente.",
            "mensaje-exito"
          );

          await cargarSolicitudes();
          await cargarMateriales();
          await cargarMovimientos();

        } catch (error) {
          mostrarMensaje(
            mensajeSolicitudes,
            error.message,
            "mensaje-error"
          );

          boton.disabled = false;
        }
      });

    } catch (error) {
      mostrarMensaje(
        mensajeSolicitudes,
        error.message,
        "mensaje-error"
      );
    }
  }

  // ========================================
  // EVENTOS DE SOLICITUDES
  // ========================================

  tablaSolicitudes?.addEventListener("click", evento => {
    const boton = evento.target.closest("[data-accion]");

    if (!boton) return;

    const id = boton.dataset.id;

    switch (boton.dataset.accion) {
      case "ver":
        verSolicitud(id);
        break;

      case "aprobar":
        aprobarSolicitud(id);
        break;

      case "rechazar":
        rechazarSolicitud(id);
        break;

      case "entregar":
        entregarSolicitud(id);
        break;
    }
  });

  // ========================================
  // HISTORIAL DE SOLICITUDES
  // ========================================

  function mostrarHistorial() {
    if (!tablaHistorial) return;

    const busqueda = (buscarHistorial?.value || "")
      .trim()
      .toLocaleLowerCase("es");

    const procesadas = solicitudes.filter(solicitud => {
      const estado = obtenerEstadoVisual(solicitud);

      return estado !== "Pendiente";
    });

    const filtradas = procesadas.filter(solicitud => {
      const estado = obtenerEstadoVisual(solicitud);

      const texto = [
        solicitud.id_solicitud,
        solicitud.nombre_obra,
        solicitud.usuario_solicitante,
        estado
      ].join(" ").toLocaleLowerCase("es");

      return texto.includes(busqueda);
    });

    if (!filtradas.length) {
      tablaHistorial.innerHTML = `
        <tr>
          <td colspan="6">
            ${procesadas.length
              ? "No se encontraron solicitudes."
              : "Todavía no hay solicitudes procesadas."}
          </td>
        </tr>
      `;
      return;
    }

    tablaHistorial.innerHTML = filtradas.map(solicitud => {
      const estado = obtenerEstadoVisual(solicitud);

      return `
        <tr>
          <td>${escaparHTML(solicitud.id_solicitud)}</td>
          <td>${escaparHTML(solicitud.nombre_obra)}</td>
          <td>${escaparHTML(solicitud.usuario_solicitante)}</td>
          <td>${formatearFecha(solicitud.fecha_solicitud)}</td>

          <td>
            <span class="estado-solicitud ${claseEstado(estado)}">
              ${escaparHTML(estado)}
            </span>
          </td>

          <td>
            <button
              type="button"
              class="btn-ver"
              data-id="${escaparHTML(solicitud.id_solicitud)}">
              Consultar
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  buscarHistorial?.addEventListener("input", mostrarHistorial);

  $("btnActualizarHistorial")?.addEventListener(
    "click",
    cargarSolicitudes
  );

  tablaHistorial?.addEventListener("click", evento => {
    const boton = evento.target.closest("[data-id]");

    if (!boton) return;

    verSolicitud(boton.dataset.id);
  });

  // ========================================
  // MOVIMIENTOS: CARGAR
  // ========================================

  async function cargarMovimientos() {
    if (!tablaMovimientos) return;

    tablaMovimientos.innerHTML =
      `<tr><td colspan="7">Cargando movimientos...</td></tr>`;

    try {
      const resultado = await solicitar(`${API}/movimientos`);

      movimientos = obtenerDatos(resultado);

      mostrarMovimientos();

      mostrarMensaje(mensajeMovimientos, "");

    } catch (error) {
      console.error("Error al cargar movimientos:", error);

      if (error.status === 403) {
        ocultarSeccionMovimientos();
        return;
      }

      tablaMovimientos.innerHTML = `
        <tr>
          <td colspan="7">No se pudieron cargar los movimientos.</td>
        </tr>
      `;

      mostrarMensaje(
        mensajeMovimientos,
        error.message,
        "mensaje-error"
      );
    }
  }

  // ========================================
  // MOVIMIENTOS: MOSTRAR
  // ========================================

  function mostrarMovimientos() {
    if (!tablaMovimientos) return;

    const busqueda = (buscarMovimiento?.value || "")
      .trim()
      .toLocaleLowerCase("es");

    const tipoFiltro = filtroTipoMovimiento?.value || "";

    const filtrados = movimientos.filter(movimiento => {
      const texto = [
        movimiento.id_movimiento,
        movimiento.nombre_material,
        movimiento.usuario,
        movimiento.nombre_obra,
        movimiento.tipo_movimiento,
        movimiento.motivo
      ].join(" ").toLocaleLowerCase("es");

      return texto.includes(busqueda) &&
        (!tipoFiltro ||
          movimiento.tipo_movimiento === tipoFiltro);
    });

    if (!filtrados.length) {
      tablaMovimientos.innerHTML = `
        <tr>
          <td colspan="7">
            ${movimientos.length
              ? "No se encontraron movimientos."
              : "Todavía no hay movimientos registrados."}
          </td>
        </tr>
      `;
      return;
    }

    tablaMovimientos.innerHTML = filtrados.map(movimiento => {
      const entrada = movimiento.tipo_movimiento === "Entrada";

      return `
        <tr>
          <td>${escaparHTML(movimiento.nombre_material)}</td>

          <td>
            <span class="estado-solicitud ${
              entrada ? "estado-entregada" : "estado-rechazada"
            }">
              ${escaparHTML(movimiento.tipo_movimiento)}
            </span>
          </td>

          <td>${escaparHTML(movimiento.cantidad)}</td>

          <td>${escaparHTML(movimiento.nombre_obra || "Sin obra")}</td>

          <td>${escaparHTML(movimiento.usuario || "Sin usuario")}</td>

          <td>${formatearFecha(movimiento.fecha_movimiento)}</td>

          <td>${escaparHTML(movimiento.motivo || "Sin motivo")}</td>
        </tr>
      `;
    }).join("");
  }

  buscarMovimiento?.addEventListener(
    "input",
    mostrarMovimientos
  );

  filtroTipoMovimiento?.addEventListener(
    "change",
    mostrarMovimientos
  );

  $("btnActualizarMovimientos")?.addEventListener(
    "click",
    cargarMovimientos
  );

  // ========================================
  // ENTRADAS: ACTUALIZAR SELECT
  // ========================================

  function actualizarSelectMateriales() {
    const select = $("materialEntrada");

    if (!select) return;

    const seleccionado = select.value;

    select.innerHTML = `
      <option value="">Seleccione un material</option>

      ${materiales.map(material => `
        <option value="${escaparHTML(material.id_material)}">
          ${escaparHTML(material.nombre)}
          (Stock: ${escaparHTML(material.stock_actual)})
        </option>
      `).join("")}
    `;

    if (seleccionado) {
      select.value = seleccionado;
    }
  }

  // ========================================
  // ENTRADAS: ABRIR Y CERRAR MODAL
  // ========================================

  function abrirEntrada() {
    if (!materiales.length) {
      mostrarMensaje(
        mensajeMovimientos,
        "Primero debés registrar un material.",
        "mensaje-error"
      );
      return;
    }

    formEntrada?.reset();

    actualizarSelectMateriales();
    abrirModal(modalEntrada);
  }

  function cerrarEntrada() {
    cerrarModal(modalEntrada);
    formEntrada?.reset();
  }

  $("btnRegistrarEntrada")?.addEventListener(
    "click",
    abrirEntrada
  );

  $("cerrarModalEntrada")?.addEventListener(
    "click",
    cerrarEntrada
  );

  $("cancelarEntrada")?.addEventListener(
    "click",
    cerrarEntrada
  );

  modalEntrada?.addEventListener("click", evento => {
    if (evento.target === modalEntrada) {
      cerrarEntrada();
    }
  });

  // ========================================
  // ENTRADAS: REGISTRAR
  // ========================================

  formEntrada?.addEventListener("submit", async evento => {
    evento.preventDefault();

    const id_material = Number($("materialEntrada").value);
    const cantidad = Number($("cantidadEntrada").value);
    const motivo = $("motivoEntrada").value.trim();

    if (!Number.isInteger(id_material) || id_material <= 0) {
      mostrarMensaje(
        mensajeMovimientos,
        "Seleccioná un material.",
        "mensaje-error"
      );
      return;
    }

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      mostrarMensaje(
        mensajeMovimientos,
        "La cantidad debe ser un entero positivo.",
        "mensaje-error"
      );
      return;
    }

    if (!motivo) {
      mostrarMensaje(
        mensajeMovimientos,
        "Ingresá el motivo de la entrada.",
        "mensaje-error"
      );
      return;
    }

    const boton = formEntrada.querySelector('[type="submit"]');

    if (!boton) return;

    boton.disabled = true;
    boton.textContent = "Registrando...";

    try {
      const resultado = await solicitar(`${API}/movimientos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id_material,
          tipo_movimiento: "Entrada",
          cantidad,
          motivo
        })
      });

      cerrarEntrada();

      mostrarMensaje(
        mensajeMovimientos,
        resultado.mensaje || "Entrada registrada correctamente.",
        "mensaje-exito"
      );

      await cargarMateriales();
      await cargarMovimientos();

    } catch (error) {
      mostrarMensaje(
        mensajeMovimientos,
        error.message,
        "mensaje-error"
      );
    } finally {
      boton.disabled = false;
      boton.textContent = "Registrar entrada";
    }
  });

  // ========================================
  // CERRAR MODALES CON ESCAPE
  // ========================================

  document.addEventListener("keydown", evento => {
    if (evento.key !== "Escape") return;

    cerrarFormularioMaterial();
    cerrarDetalle();
    cerrarEntrada();
  });

  // ========================================
  // INICIAR MÓDULO
  // ========================================

  cargarMateriales();
  cargarSolicitudes();
  cargarMovimientos();

});
