
// ========================================
// ENTERPRISESYS - GESTIÓN DE INVENTARIO
// ========================================

document.addEventListener("DOMContentLoaded", () => {
  const tablaMateriales = document.getElementById("tablaMateriales");
  const totalMateriales = document.getElementById("totalMateriales");
  const stockBajo = document.getElementById("stockBajo");
  const buscarMaterial = document.getElementById("buscarMaterial");
  const btnNuevoMaterial = document.getElementById("btnNuevoMaterial");
  const mensajeInventario = document.getElementById("mensajeInventario");

  const API = "/materiales";

  let materiales = [];

  // ========================================
  // ESTILOS COMPLEMENTARIOS
  // ========================================

  const estilos = document.createElement("style");

  estilos.textContent = `
    .estado-stock {
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

    .modal-inventario {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
      background: rgba(16, 42, 67, 0.55);
    }

    .modal-inventario.oculto {
      display: none !important;
    }

    .contenido-modal-inventario {
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      padding: 25px;
      background: #fff;
      border-radius: 10px;
      box-shadow: 0 10px 35px rgba(0, 0, 0, 0.2);
    }

    .encabezado-modal-inventario {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 15px;
      margin-bottom: 22px;
      padding-bottom: 15px;
      border-bottom: 1px solid #dce3ec;
    }

    .encabezado-modal-inventario h2 {
      margin: 0;
      color: #102a43;
      font-size: 21px;
    }

    .cerrar-modal-inventario {
      padding: 5px 10px;
      background: transparent;
      color: #64748b;
      border: none;
      font-size: 25px;
      cursor: pointer;
    }

    .formulario-material {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 16px;
    }

    .formulario-material .campo-completo {
      grid-column: 1 / -1;
    }

    .formulario-material label {
      display: block;
      margin-bottom: 7px;
      color: #243047;
      font-size: 13px;
      font-weight: 600;
    }

    .formulario-material input,
    .formulario-material textarea {
      width: 100%;
      padding: 11px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-family: Arial, sans-serif;
      font-size: 14px;
    }

    .formulario-material input:focus,
    .formulario-material textarea:focus {
      outline: none;
      border-color: #17365d;
      box-shadow: 0 0 0 3px rgba(23, 54, 93, 0.1);
    }

    .formulario-material input:disabled {
      background: #e9edf3;
      color: #64748b;
      cursor: not-allowed;
    }

    .formulario-material textarea {
      min-height: 80px;
      resize: vertical;
    }

    .botones-formulario-material {
      grid-column: 1 / -1;
      display: flex;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 10px;
    }

    .botones-formulario-material button {
      padding: 11px 16px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-guardar-material {
      background: #17365d;
      color: white;
    }

    .btn-guardar-material:hover {
      background: #244a73;
    }

    .btn-cancelar-material {
      background: #e9edf3;
      color: #243047;
    }

    .tabla-contenedor .btn-modificar {
      padding: 7px 10px;
      border: none;
      border-radius: 5px;
      background: #e8eff8;
      color: #17365d;
      cursor: pointer;
    }

    .tabla-contenedor .btn-modificar:hover {
      background: #d8e5f5;
    }

    @media (max-width: 500px) {
      .formulario-material {
        grid-template-columns: 1fr;
      }

      .formulario-material .campo-completo,
      .botones-formulario-material {
        grid-column: 1;
      }

      .contenido-modal-inventario {
        padding: 18px;
      }
    }
  `;

  document.head.appendChild(estilos);

  // ========================================
  // CREAR FORMULARIO MODAL
  // ========================================

  const modal = document.createElement("div");

  modal.className = "modal-inventario oculto";
  modal.id = "modalInventario";

  modal.innerHTML = `
    <div
      class="contenido-modal-inventario"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tituloFormularioMaterial"
    >
      <div class="encabezado-modal-inventario">
        <h2 id="tituloFormularioMaterial">Nuevo material</h2>

        <button
          type="button"
          class="cerrar-modal-inventario"
          id="cerrarModalInventario"
          aria-label="Cerrar formulario"
        >
          &times;
        </button>
      </div>

      <form id="formularioMaterial" class="formulario-material">

        <div class="campo-completo">
          <label for="nombreMaterial">Nombre del material *</label>
          <input
            type="text"
            id="nombreMaterial"
            name="nombre"
            maxlength="150"
            required
          >
        </div>

        <div class="campo-completo">
          <label for="descripcionMaterial">Descripción</label>
          <textarea
            id="descripcionMaterial"
            name="descripcion"
            maxlength="500"
          ></textarea>
        </div>

        <div>
          <label for="precioMaterial">Precio actual (Gs.) *</label>
          <input
            type="number"
            id="precioMaterial"
            name="precio_actual"
            min="0"
            step="1"
            required
          >
        </div>

        <div>
          <label for="stockMaterial">Stock actual *</label>
          <input
            type="number"
            id="stockMaterial"
            name="stock_actual"
            min="0"
            step="1"
            required
          >
        </div>

        <div>
          <label for="stockMinimoMaterial">Stock mínimo *</label>
          <input
            type="number"
            id="stockMinimoMaterial"
            name="stock_minimo"
            min="0"
            step="1"
            required
          >
        </div>

        <div>
          <label for="ubicacionMaterial">Ubicación</label>
          <input
            type="text"
            id="ubicacionMaterial"
            name="ubicacion_fisica"
            maxlength="150"
          >
        </div>

        <div class="botones-formulario-material">
          <button
            type="button"
            class="btn-cancelar-material"
            id="cancelarFormularioMaterial"
          >
            Cancelar
          </button>

          <button
            type="submit"
            class="btn-guardar-material"
            id="guardarMaterial"
          >
            Guardar material
          </button>
        </div>

      </form>
    </div>
  `;

  document.body.appendChild(modal);

  const formulario = document.getElementById("formularioMaterial");

  const tituloFormulario = document.getElementById(
    "tituloFormularioMaterial"
  );

  const guardarMaterial = document.getElementById("guardarMaterial");

  const campoStock = document.getElementById("stockMaterial");

  let materialEditando = null;

  // ========================================
  // FUNCIONES AUXILIARES
  // ========================================

  function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, (caracter) => {
      const caracteres = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      };

      return caracteres[caracter];
    });
  }

  function mostrarMensaje(texto, tipo = "") {
    mensajeInventario.textContent = texto;
    mensajeInventario.className = tipo;
  }

  function formatearPrecio(valor) {
    return Number(valor || 0).toLocaleString("es-PY", {
      maximumFractionDigits: 0
    }) + " Gs.";
  }

  function obtenerDatos(respuesta) {
    if (Array.isArray(respuesta)) {
      return respuesta;
    }

    if (Array.isArray(respuesta.materiales)) {
      return respuesta.materiales;
    }

    if (Array.isArray(respuesta.data)) {
      return respuesta.data;
    }

    if (Array.isArray(respuesta.resultado)) {
      return respuesta.resultado;
    }

    return [];
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
      throw new Error(
        resultado.mensaje ||
        resultado.error ||
        `Error del servidor (${respuesta.status})`
      );
    }

    return resultado;
  }

  // ========================================
  // CARGAR MATERIALES
  // ========================================

  async function cargarMateriales() {
    tablaMateriales.innerHTML = `
      <tr>
        <td colspan="7">Cargando materiales...</td>
      </tr>
    `;

    try {
      const respuesta = await fetch(API);

      const resultado = await procesarRespuesta(respuesta);

      materiales = obtenerDatos(resultado);

      actualizarResumen();
      mostrarMateriales();

    } catch (error) {
      console.error("Error al cargar materiales:", error);

      tablaMateriales.innerHTML = `
        <tr>
          <td colspan="7">
            No se pudieron cargar los materiales.
          </td>
        </tr>
      `;

      mostrarMensaje(
        error.message || "Error al conectar con el servidor.",
        "mensaje-error"
      );
    }
  }

  // ========================================
  // ACTUALIZAR TARJETAS DE RESUMEN
  // ========================================

  function actualizarResumen() {
    totalMateriales.textContent = materiales.length;

    const cantidadStockBajo = materiales.filter((material) => {
      return Number(material.stock_actual) <=
        Number(material.stock_minimo);
    }).length;

    stockBajo.textContent = cantidadStockBajo;
  }

  // ========================================
  // MOSTRAR MATERIALES EN LA TABLA
  // ========================================

  function mostrarMateriales() {
    const busqueda = buscarMaterial.value
      .trim()
      .toLocaleLowerCase("es");

    const filtrados = materiales.filter((material) => {
      const nombre = String(material.nombre || "")
        .toLocaleLowerCase("es");

      const ubicacion = String(material.ubicacion_fisica || "")
        .toLocaleLowerCase("es");

      const id = String(material.id_material || "");

      return nombre.includes(busqueda) ||
        ubicacion.includes(busqueda) ||
        id.includes(busqueda);
    });

    if (filtrados.length === 0) {
      tablaMateriales.innerHTML = `
        <tr>
          <td colspan="7">
            ${
              materiales.length === 0
                ? "Todavía no hay materiales registrados."
                : "No se encontraron materiales."
            }
          </td>
        </tr>
      `;

      return;
    }

    tablaMateriales.innerHTML = filtrados.map((material) => {
      const stock = Number(material.stock_actual || 0);
      const minimo = Number(material.stock_minimo || 0);

      let claseStock = "stock-normal";
      let textoStock = "Normal";

      if (stock <= 0) {
        claseStock = "stock-agotado";
        textoStock = "Agotado";
      } else if (stock <= minimo) {
        claseStock = "stock-bajo";
        textoStock = "Stock bajo";
      }

      return `
        <tr>
          <td>${escaparHTML(material.id_material)}</td>

          <td>
            <strong>${escaparHTML(material.nombre)}</strong>
          </td>

          <td>${formatearPrecio(material.precio_actual)}</td>

          <td>
            <span class="estado-stock ${claseStock}">
              ${stock} · ${textoStock}
            </span>
          </td>

          <td>${minimo}</td>

          <td>
            ${escaparHTML(material.ubicacion_fisica || "Sin ubicación")}
          </td>

          <td>
            <button
              type="button"
              class="btn-modificar"
              data-accion="editar"
              data-id="${escaparHTML(material.id_material)}"
              title="Modificar material"
              aria-label="Modificar ${escaparHTML(material.nombre)}"
            >
              <i class="fa-solid fa-pen"></i>
              Modificar
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  // ========================================
  // ABRIR FORMULARIO
  // ========================================

  function abrirFormulario(material = null) {
    materialEditando = material
      ? material.id_material
      : null;

    formulario.reset();

    // IMPORTANTE:
    // El stock solo se puede establecer al registrar.
    // Al modificar, queda bloqueado.
    campoStock.disabled = Boolean(material);

    tituloFormulario.textContent = material
      ? "Modificar material"
      : "Nuevo material";

    guardarMaterial.textContent = material
      ? "Guardar cambios"
      : "Guardar material";

    if (material) {
      document.getElementById("nombreMaterial").value =
        material.nombre || "";

      document.getElementById("descripcionMaterial").value =
        material.descripcion || "";

      document.getElementById("precioMaterial").value =
        material.precio_actual ?? 0;

      campoStock.value = material.stock_actual ?? 0;

      document.getElementById("stockMinimoMaterial").value =
        material.stock_minimo ?? 0;

      document.getElementById("ubicacionMaterial").value =
        material.ubicacion_fisica || "";
    }

    modal.classList.remove("oculto");

    document.getElementById("nombreMaterial").focus();
  }

  // ========================================
  // CERRAR FORMULARIO
  // ========================================

  function cerrarFormulario() {
    modal.classList.add("oculto");

    formulario.reset();

    materialEditando = null;

    campoStock.disabled = false;

    guardarMaterial.disabled = false;
    guardarMaterial.textContent = "Guardar material";
  }

  // ========================================
  // EVENTOS DEL MODAL
  // ========================================

  btnNuevoMaterial.addEventListener("click", () => {
    abrirFormulario();
  });

  document.getElementById("cerrarModalInventario")
    .addEventListener("click", cerrarFormulario);

  document.getElementById("cancelarFormularioMaterial")
    .addEventListener("click", cerrarFormulario);

  modal.addEventListener("click", (evento) => {
    if (evento.target === modal) {
      cerrarFormulario();
    }
  });

  document.addEventListener("keydown", (evento) => {
    if (
      evento.key === "Escape" &&
      !modal.classList.contains("oculto")
    ) {
      cerrarFormulario();
    }
  });

  // ========================================
  // BUSCAR MATERIALES
  // ========================================

  buscarMaterial.addEventListener("input", mostrarMateriales);

  // ========================================
  // MODIFICAR MATERIAL
  // ========================================

  tablaMateriales.addEventListener("click", (evento) => {
    const boton = evento.target.closest('[data-accion="editar"]');

    if (!boton) {
      return;
    }

    const id = boton.dataset.id;

    const material = materiales.find((item) => {
      return String(item.id_material) === String(id);
    });

    if (material) {
      abrirFormulario(material);
    }
  });

  // ========================================
  // GUARDAR MATERIAL NUEVO O MODIFICADO
  // ========================================

  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const datos = Object.fromEntries(
      new FormData(formulario).entries()
    );

    // Limpiar campos de texto
    datos.nombre = datos.nombre.trim();
    datos.descripcion = datos.descripcion.trim();
    datos.ubicacion_fisica = datos.ubicacion_fisica.trim();

    // Validar campos obligatorios antes de convertir
    if (
      datos.nombre === "" ||
      datos.precio_actual === "" ||
      datos.stock_minimo === "" ||
      (materialEditando === null && datos.stock_actual === "")
    ) {
      mostrarMensaje(
        "Completá todos los campos obligatorios.",
        "mensaje-error"
      );
      return;
    }

    // Convertir valores numéricos
    datos.precio_actual = Number(datos.precio_actual);
    datos.stock_minimo = Number(datos.stock_minimo);

    const editando = materialEditando !== null;

    // El stock solo se envía cuando se registra un material.
    if (!editando) {
      datos.stock_actual = Number(datos.stock_actual);
    } else {
      delete datos.stock_actual;
    }

    // Validar precio
    if (
      !Number.isFinite(datos.precio_actual) ||
      datos.precio_actual < 0
    ) {
      mostrarMensaje(
        "El precio debe ser un número válido y no negativo.",
        "mensaje-error"
      );
      return;
    }

    // Validar stock mínimo
    if (
      !Number.isInteger(datos.stock_minimo) ||
      datos.stock_minimo < 0
    ) {
      mostrarMensaje(
        "El stock mínimo debe ser un número entero no negativo.",
        "mensaje-error"
      );
      return;
    }

    // Validar stock inicial
    if (
      !editando &&
      (
        !Number.isInteger(datos.stock_actual) ||
        datos.stock_actual < 0
      )
    ) {
      mostrarMensaje(
        "El stock inicial debe ser un número entero no negativo.",
        "mensaje-error"
      );
      return;
    }

    const url = editando
      ? `${API}/${encodeURIComponent(materialEditando)}`
      : API;

    const metodo = editando ? "PUT" : "POST";

    guardarMaterial.disabled = true;
    guardarMaterial.textContent = "Guardando...";

    try {
      const respuesta = await fetch(url, {
        method: metodo,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(datos)
      });

      const resultado = await procesarRespuesta(respuesta);

      cerrarFormulario();

      mostrarMensaje(
        resultado.mensaje ||
          (editando
            ? "Material modificado correctamente."
            : "Material registrado correctamente."),
        "mensaje-exito"
      );

      await cargarMateriales();

    } catch (error) {
      console.error("Error al guardar material:", error);

      mostrarMensaje(
        error.message || "No se pudo guardar el material.",
        "mensaje-error"
      );

    } finally {
      guardarMaterial.disabled = false;
      guardarMaterial.textContent = "Guardar material";
    }
  });

  // ========================================
  // INICIAR MÓDULO
  // ========================================

  cargarMateriales();

});
