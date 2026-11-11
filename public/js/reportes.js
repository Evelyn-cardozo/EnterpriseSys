
// ========================================
// REPORTES - ENTERPRISESYS
// ========================================

// ========================================
// ELEMENTOS DEL HTML
// ========================================

const botonesReportes = document.querySelectorAll("[data-reporte]");
const seccionesReportes = document.querySelectorAll(".contenido-reporte");

// Clientes
const buscarCliente = document.getElementById("buscarCliente");
const btnBuscarClientes = document.getElementById("btnBuscarClientes");
const tablaReporteClientes = document.getElementById("tablaReporteClientes");

// Obras
const buscarObra = document.getElementById("buscarObra");
const filtroEstadoObra = document.getElementById("filtroEstadoObra");
const btnBuscarObras = document.getElementById("btnBuscarObras");
const tablaReporteObras = document.getElementById("tablaReporteObras");

// Inventario
const buscarMaterial = document.getElementById("buscarMaterial");
const filtroStock = document.getElementById("filtroStock");
const btnBuscarMateriales = document.getElementById("btnBuscarMateriales");
const tablaReporteInventario = document.getElementById("tablaReporteInventario");

// ========================================
// VARIABLES
// ========================================

let clientes = [];
let obras = [];
let materiales = [];
let movimientos = [];

// ========================================
// FUNCIONES GENERALES
// ========================================

// Obtener datos de una ruta del servidor
async function obtenerDatos(ruta) {
    const respuesta = await fetch(ruta);

    if (!respuesta.ok) {
        throw new Error(`Error al consultar ${ruta}: ${respuesta.status}`);
    }

    const datos = await respuesta.json();

    // Permite trabajar con respuestas que devuelven
    // directamente un array o un objeto con un array.
    if (Array.isArray(datos)) return datos;

    if (Array.isArray(datos.datos)) return datos.datos;
    if (Array.isArray(datos.rows)) return datos.rows;
    if (Array.isArray(datos.clientes)) return datos.clientes;
    if (Array.isArray(datos.obras)) return datos.obras;
    if (Array.isArray(datos.materiales)) return datos.materiales;
    if (Array.isArray(datos.movimientos)) return datos.movimientos;

    return [];
}

// Mostrar mensaje en una tabla
function mostrarMensajeTabla(tabla, columnas, mensaje) {
    if (!tabla) return;

    tabla.innerHTML = `
        <tr>
            <td colspan="${columnas}" class="mensaje-tabla">
                ${mensaje}
            </td>
        </tr>
    `;
}

// Normalizar texto para búsquedas y filtros
function normalizarTexto(texto) {
    return String(texto ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

// Formatear fechas
function formatearFecha(fecha) {
    if (!fecha) return "-";

    const fechaObjeto = new Date(fecha);

    if (Number.isNaN(fechaObjeto.getTime())) {
        return fecha;
    }

    return fechaObjeto.toLocaleDateString("es-PY");
}

// Formatear dinero en guaraníes
function formatearDinero(valor) {
    return Number(valor || 0).toLocaleString("es-PY", {
        maximumFractionDigits: 0
    }) + " Gs.";
}

// Evitar insertar HTML peligroso proveniente de los datos
function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caracter => {
        const caracteres = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return caracteres[caracter];
    });
}

// ========================================
// CAMBIAR ENTRE REPORTES
// ========================================

botonesReportes.forEach(boton => {
    boton.addEventListener("click", () => {
        const reporteSeleccionado = boton.dataset.reporte;

        botonesReportes.forEach(item => {
            item.classList.remove("activo");
        });

        seccionesReportes.forEach(seccion => {
            seccion.classList.remove("activo");
        });

        boton.classList.add("activo");

        const seccion = document.getElementById(
            `reporte-${reporteSeleccionado}`
        );

        if (seccion) {
            seccion.classList.add("activo");
        }
    });
});

// ========================================
// REPORTE DE CLIENTES
// ========================================

async function cargarClientes() {
    try {
        mostrarMensajeTabla(
            tablaReporteClientes,
            4,
            "Cargando clientes..."
        );

        const [datosClientes, datosObras] = await Promise.all([
            obtenerDatos("/clientes"),
            obtenerDatos("/obras")
        ]);

        clientes = datosClientes;
        obras = datosObras;

        renderizarClientes();

    } catch (error) {
        console.error("Error al cargar reporte de clientes:", error);

        mostrarMensajeTabla(
            tablaReporteClientes,
            4,
            "No se pudieron cargar los clientes."
        );
    }
}

function renderizarClientes() {
    if (!tablaReporteClientes) return;

    const busqueda = normalizarTexto(buscarCliente?.value);

    const clientesFiltrados = clientes.filter(cliente => {
        const nombre = normalizarTexto(cliente.nombre_razon_social);
        const documento = normalizarTexto(cliente.ruc_ci);
        const telefono = normalizarTexto(cliente.telefono);

        return (
            nombre.includes(busqueda) ||
            documento.includes(busqueda) ||
            telefono.includes(busqueda)
        );
    });

    if (clientesFiltrados.length === 0) {
        mostrarMensajeTabla(
            tablaReporteClientes,
            4,
            "No se encontraron clientes."
        );
        return;
    }

    tablaReporteClientes.innerHTML = clientesFiltrados.map(cliente => {

        const cantidadObras = obras.filter(obra =>
            Number(obra.id_cliente) === Number(cliente.id_cliente)
        ).length;

        return `
            <tr>
                <td>${escaparHTML(cliente.nombre_razon_social)}</td>
                <td>${escaparHTML(cliente.ruc_ci)}</td>
                <td>${escaparHTML(cliente.telefono || "-")}</td>
                <td>${cantidadObras}</td>
            </tr>
        `;
    }).join("");
}

// ========================================
// REPORTE DE OBRAS
// ========================================

async function cargarObras() {
    try {
        mostrarMensajeTabla(
            tablaReporteObras,
            6,
            "Cargando obras..."
        );

        obras = await obtenerDatos("/obras");

        renderizarObras();

    } catch (error) {
        console.error("Error al cargar reporte de obras:", error);

        mostrarMensajeTabla(
            tablaReporteObras,
            6,
            "No se pudieron cargar las obras."
        );
    }
}

function renderizarObras() {
    if (!tablaReporteObras) return;

    const busqueda = normalizarTexto(buscarObra?.value);
    const estadoSeleccionado = normalizarTexto(filtroEstadoObra?.value);

    const obrasFiltradas = obras.filter(obra => {

        const nombreObra = normalizarTexto(obra.nombre_obra);
        const cliente = normalizarTexto(obra.nombre_razon_social);
        const estado = normalizarTexto(obra.estado);

        const coincideBusqueda =
            nombreObra.includes(busqueda) ||
            cliente.includes(busqueda);

        const coincideEstado =
            !estadoSeleccionado ||
            estadoSeleccionado === "todos" ||
            estado === estadoSeleccionado;

        return coincideBusqueda && coincideEstado;
    });

    if (obrasFiltradas.length === 0) {
        mostrarMensajeTabla(
            tablaReporteObras,
            6,
            "No se encontraron obras."
        );
        return;
    }

    tablaReporteObras.innerHTML = obrasFiltradas.map(obra => {

        return `
            <tr>
                <td>${escaparHTML(obra.nombre_obra)}</td>
                <td>${escaparHTML(obra.nombre_razon_social || "-")}</td>
                <td>${formatearFecha(obra.fecha_inicio)}</td>
                <td>${formatearFecha(obra.fecha_fin_prevista)}</td>
                <td>${formatearDinero(obra.presupuesto_planificado)}</td>
                <td>
                    <span class="estado-reporte">
                        ${escaparHTML(obra.estado)}
                    </span>
                </td>
            </tr>
        `;
    }).join("");
}

// ========================================
// REPORTE DE INVENTARIO
// ========================================

async function cargarInventario() {
    try {
        mostrarMensajeTabla(
            tablaReporteInventario,
            6,
            "Cargando inventario..."
        );

        materiales = await obtenerDatos("/materiales");

        // Los movimientos son opcionales.
        // Si todavía no existe esta ruta, se carga el inventario
        // igualmente, pero las entradas y salidas aparecerán en cero.
        try {
            movimientos = await obtenerDatos("/materiales/movimientos");
        } catch (error) {
            console.warn(
                "No se pudieron cargar los movimientos del inventario:",
                error.message
            );

            movimientos = [];
        }

        renderizarInventario();

    } catch (error) {
        console.error("Error al cargar reporte de inventario:", error);

        mostrarMensajeTabla(
            tablaReporteInventario,
            6,
            "No se pudo cargar el inventario."
        );
    }
}

function renderizarInventario() {
    if (!tablaReporteInventario) return;

    const busqueda = normalizarTexto(buscarMaterial?.value);
    const filtro = normalizarTexto(filtroStock?.value);

    const materialesFiltrados = materiales.filter(material => {

        const nombre = normalizarTexto(material.nombre);

        const stock = Number(material.stock_actual || 0);
        const stockMinimo = Number(material.stock_minimo || 0);

        let coincideStock = true;

        if (filtro === "con stock" || filtro === "constock") {
            coincideStock = stock > 0;
        } else if (filtro === "stock bajo" || filtro === "stockbajo") {
            coincideStock = stock > 0 && stock <= stockMinimo;
        } else if (filtro === "agotado") {
            coincideStock = stock <= 0;
        }

        return nombre.includes(busqueda) && coincideStock;
    });

    if (materialesFiltrados.length === 0) {
        mostrarMensajeTabla(
            tablaReporteInventario,
            6,
            "No se encontraron materiales."
        );
        return;
    }

    tablaReporteInventario.innerHTML = materialesFiltrados.map(material => {

        const stock = Number(material.stock_actual || 0);
        const stockMinimo = Number(material.stock_minimo || 0);

        const movimientosMaterial = movimientos.filter(movimiento =>
            Number(movimiento.id_material) === Number(material.id_material)
        );

        const entradas = movimientosMaterial
            .filter(movimiento =>
                normalizarTexto(movimiento.tipo_movimiento) === "entrada"
            )
            .reduce((total, movimiento) => {
                return total + Number(movimiento.cantidad || 0);
            }, 0);

        const salidas = movimientosMaterial
            .filter(movimiento =>
                normalizarTexto(movimiento.tipo_movimiento) === "salida"
            )
            .reduce((total, movimiento) => {
                return total + Number(movimiento.cantidad || 0);
            }, 0);

        let disponibilidad = "Disponible";

        if (stock <= 0) {
            disponibilidad = "Agotado";
        } else if (stock <= stockMinimo) {
            disponibilidad = "Stock bajo";
        }

        return `
            <tr>
                <td>${escaparHTML(material.nombre)}</td>
                <td>${escaparHTML(material.unidad || "-")}</td>
                <td>${stock}</td>
                <td>${entradas}</td>
                <td>${salidas}</td>
                <td>
                    <span class="estado-reporte">
                        ${disponibilidad}
                    </span>
                </td>
            </tr>
        `;
    }).join("");
}

// ========================================
// BOTONES DE BÚSQUEDA
// ========================================

btnBuscarClientes?.addEventListener("click", renderizarClientes);

btnBuscarObras?.addEventListener("click", renderizarObras);

btnBuscarMateriales?.addEventListener("click", renderizarInventario);

// Filtrar al presionar Enter
buscarCliente?.addEventListener("keydown", evento => {
    if (evento.key === "Enter") renderizarClientes();
});

buscarObra?.addEventListener("keydown", evento => {
    if (evento.key === "Enter") renderizarObras();
});

buscarMaterial?.addEventListener("keydown", evento => {
    if (evento.key === "Enter") renderizarInventario();
});

// Aplicar filtros al cambiar las opciones
filtroEstadoObra?.addEventListener("change", renderizarObras);
filtroStock?.addEventListener("change", renderizarInventario);

// ========================================
// OBTENER REPORTE ACTIVO
// ========================================

function obtenerReporteActivo() {

    const reporte = document.querySelector(
        ".contenido-reporte.activo"
    );

    if (!reporte) {
        alert("Primero seleccioná un reporte.");
        return null;
    }

    const tabla = reporte.querySelector("table");

    if (!tabla) {
        alert("No se encontró la tabla del reporte.");
        return null;
    }

    const titulo = reporte.querySelector("h2")?.innerText.trim()
        || "Reporte";

    return {
        elemento: reporte,
        tabla,
        titulo
    };
}

// ========================================
// IMPRIMIR REPORTE
// ========================================

function imprimirReporte() {

    const reporte = obtenerReporteActivo();

    if (!reporte) return;

    const filas = reporte.tabla.querySelectorAll("tbody tr");

    if (
        filas.length === 0 ||
        (filas.length === 1 && filas[0].querySelector("[colspan]"))
    ) {
        alert("No hay datos para imprimir.");
        return;
    }

    window.print();
}

// ========================================
// DESCARGAR REPORTE PDF
// ========================================

function descargarPDF() {

    const reporte = obtenerReporteActivo();

    if (!reporte) return;

    const filas = reporte.tabla.querySelectorAll("tbody tr");

    if (
        filas.length === 0 ||
        (filas.length === 1 && filas[0].querySelector("[colspan]"))
    ) {
        alert("No hay datos para descargar.");
        return;
    }

    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert("No se pudo cargar la biblioteca para generar PDF.");
        return;
    }

    const { jsPDF } = window.jspdf;

    const esClientes = reporte.elemento.id === "reporte-clientes";

    const pdf = new jsPDF({
        orientation: esClientes ? "portrait" : "landscape",
        unit: "mm",
        format: "a4"
    });

    const fechaActual = new Date();

    const fechaTexto = fechaActual.toLocaleDateString("es-PY");

    const fechaArchivo = fechaActual.toISOString().split("T")[0];

    // Título
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(17);
    pdf.text("EnterpriseSys", 14, 18);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    pdf.text(reporte.titulo, 14, 28);

    pdf.setFontSize(9);
    pdf.text(`Fecha de generación: ${fechaTexto}`, 14, 36);

    // Filtros aplicados
    let filtros = "";

    if (reporte.elemento.id === "reporte-clientes") {
        filtros = `Búsqueda: ${buscarCliente?.value || "Todos"}`;
    }

    if (reporte.elemento.id === "reporte-obras") {
        filtros = `Búsqueda: ${buscarObra?.value || "Todas"} | Estado: ${filtroEstadoObra?.value || "Todos"}`;
    }

    if (reporte.elemento.id === "reporte-inventario") {
        filtros = `Búsqueda: ${buscarMaterial?.value || "Todos"} | Stock: ${filtroStock?.value || "Todos"}`;
    }

    pdf.text(filtros, 14, 43);

    // Generar tabla
    if (typeof pdf.autoTable !== "function") {
        alert("No se pudo cargar el complemento de tablas para PDF.");
        return;
    }

    pdf.autoTable({
        html: reporte.tabla,
        startY: 50,
        theme: "grid",

        styles: {
            font: "helvetica",
            fontSize: 8,
            cellPadding: 3,
            overflow: "linebreak"
        },

        headStyles: {
            fillColor: [37, 99, 235],
            textColor: 255,
            fontStyle: "bold"
        },

        alternateRowStyles: {
            fillColor: [245, 248, 252]
        },

        margin: {
            left: 14,
            right: 14,
            bottom: 18
        },

        didDrawPage: function () {
            const altoPagina = pdf.internal.pageSize.height;

            pdf.setFontSize(8);
            pdf.setFont("helvetica", "normal");

            pdf.text(
                "EnterpriseSys - Reporte generado por el sistema",
                14,
                altoPagina - 10
            );
        }
    });

    const nombreArchivo = reporte.elemento.id.replace("reporte-", "");

    pdf.save(`Reporte_${nombreArchivo}_${fechaArchivo}.pdf`);
}

// Hacer accesibles las funciones desde los botones HTML
window.imprimirReporte = imprimirReporte;
window.descargarPDF = descargarPDF;

// ========================================
// CARGA INICIAL
// ========================================

document.addEventListener("DOMContentLoaded", () => {

    cargarClientes();
    cargarObras();
    cargarInventario();

});
