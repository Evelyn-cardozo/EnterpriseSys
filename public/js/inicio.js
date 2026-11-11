
document.addEventListener("DOMContentLoaded", () => {

  // ========================================
  // ELEMENTOS DEL DOM
  // ========================================

  const elementoFecha = document.getElementById("fechaActual");
  const nombreUsuario = document.getElementById("nombreUsuario");
  const rolUsuario = document.getElementById("rolUsuario");
  const avatarUsuario = document.getElementById("avatarUsuario");

  const tituloBienvenida = document.getElementById("tituloBienvenida");
  const textoResumen = document.getElementById("textoResumen");
  const descripcionBienvenida = document.getElementById(
    "descripcionBienvenida"
  );

  const contenedorTarjetas = document.getElementById(
    "contenedorTarjetas"
  );

  const listaActividades = document.getElementById(
    "listaActividades"
  );

  const tituloActividades = document.getElementById(
    "tituloActividades"
  );

  const seccionAlertas = document.getElementById(
    "seccionAlertas"
  );

  const listaAlertas = document.getElementById(
    "listaAlertas"
  );

  const cantidadAlertas = document.getElementById(
    "cantidadAlertas"
  );

  // ========================================
  // MOSTRAR FECHA ACTUAL
  // ========================================

  const mostrarFecha = () => {
    const fecha = new Date();

    if (elementoFecha) {
      elementoFecha.textContent = fecha.toLocaleDateString("es-PY", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }
  };

  // ========================================
  // FUNCIONES AUXILIARES
  // ========================================

  const obtenerNumero = (valor) => {
    const numero = Number(valor);

    return Number.isFinite(numero) ? numero : 0;
  };

  const obtenerNombreRol = (idRol, nombre) => {

    const roles = {
      1: "Gerente",
      2: "Jefe de Obra",
      3: "Encargado de Inventario",
    };

    return nombre || roles[idRol] || "Usuario";
  };

  const formatearTexto = (texto) => {
    if (!texto) return "";

    return texto.charAt(0).toUpperCase() + texto.slice(1);
  };

  // ========================================
  // MOSTRAR INFORMACIÓN DEL USUARIO
  // ========================================

  const mostrarUsuario = (usuario) => {

    const username = usuario.username || "Usuario";
    const rol = obtenerNombreRol(
      usuario.id_rol,
      usuario.nombre_rol
    );

    if (nombreUsuario) {
      nombreUsuario.textContent = username;
    }

    if (rolUsuario) {
      rolUsuario.textContent = rol;
    }

    if (avatarUsuario) {
      avatarUsuario.textContent = username
        .charAt(0)
        .toUpperCase();
    }

    if (tituloBienvenida) {
      tituloBienvenida.textContent =
        `¡BIENVENIDO DE NUEVO, ${username.toUpperCase()}!`;
    }

    if (textoResumen) {
      textoResumen.textContent = `PANEL DE ${rol.toUpperCase()}`;
    }

    if (descripcionBienvenida) {

      const descripciones = {
        1: "Aquí puedes consultar el estado general de EnterpriseSys.",
        2: "Aquí puedes consultar tus solicitudes de materiales y su estado.",
        3: "Aquí puedes administrar el inventario y las solicitudes de materiales.",
      };

      descripcionBienvenida.textContent =
        descripciones[Number(usuario.id_rol)] ||
        "Aquí puedes consultar la información del sistema.";
    }

    if (tituloActividades && Number(usuario.id_rol) === 2) {
      tituloActividades.textContent = "Mis solicitudes recientes";
    }

    // Mostrar únicamente los elementos correspondientes al rol.
    document.querySelectorAll("[data-roles]").forEach((elemento) => {

      const rolesPermitidos = elemento.dataset.roles
        .split(",")
        .map(Number);

      elemento.style.display = rolesPermitidos.includes(
        Number(usuario.id_rol)
      ) ? "" : "none";

    });
  };

  // ========================================
  // CREAR TARJETAS
  // ========================================

  const crearTarjeta = (numero, titulo, enlace, textoEnlace, icono, clase) => {

    return `
      <div class="tarjeta">

        <div class="tarjeta-icono ${clase}">
          <i class="${icono}"></i>
        </div>

        <div class="tarjeta-info">

          <span class="numero">
            ${numero}
          </span>

          <span class="titulo">
            ${titulo}
          </span>

          <a href="${enlace}">
            ${textoEnlace} →
          </a>

        </div>

      </div>
    `;
  };

  // ========================================
  // DASHBOARD DEL GERENTE
  // ========================================

  const mostrarPanelGerente = (resumen) => {

    contenedorTarjetas.innerHTML = `

      ${crearTarjeta(
        obtenerNumero(resumen.total_clientes),
        "Total de clientes",
        "/clientes-pagina",
        "Ver clientes",
        "fa-solid fa-users",
        "clientes"
      )}

      ${crearTarjeta(
        obtenerNumero(resumen.obras_en_ejecucion),
        "Obras en ejecución",
        "/obras-pagina",
        "Ver obras",
        "fa-solid fa-helmet-safety",
        "obras"
      )}

      ${crearTarjeta(
        obtenerNumero(resumen.stock_bajo),
        "Materiales con stock bajo",
        "/inventario-pagina",
        "Ver inventario",
        "fa-solid fa-box",
        "inventario"
      )}

      ${crearTarjeta(
        obtenerNumero(resumen.materiales_agotados),
        "Materiales agotados",
        "/inventario-pagina",
        "Ver inventario",
        "fa-solid fa-triangle-exclamation",
        "inventario"
      )}

      ${crearTarjeta(
        obtenerNumero(resumen.solicitudes_pendientes),
        "Solicitudes pendientes",
        "/inventario-pagina",
        "Ver solicitudes",
        "fa-solid fa-clipboard-list",
        "obras"
      )}

    `;
  };

  // ========================================
  // DASHBOARD DEL JEFE DE OBRA
  // ========================================

  const mostrarPanelJefe = (resumen) => {

    contenedorTarjetas.innerHTML = `

      ${crearTarjeta(
        obtenerNumero(resumen.total_solicitudes),
        "Total de mis solicitudes",
        "/inventario-pagina",
        "Ver solicitudes",
        "fa-solid fa-clipboard-list",
        "obras"
      )}

      ${crearTarjeta(
        obtenerNumero(resumen.solicitudes_pendientes),
        "Solicitudes pendientes",
        "/inventario-pagina",
        "Ver solicitudes",
        "fa-solid fa-clock",
        "inventario"
      )}

      ${crearTarjeta(
        obtenerNumero(resumen.solicitudes_aprobadas),
        "Solicitudes aprobadas",
        "/inventario-pagina",
        "Ver solicitudes",
        "fa-solid fa-circle-check",
        "clientes"
      )}

      ${crearTarjeta(
        obtenerNumero(resumen.solicitudes_rechazadas),
        "Solicitudes rechazadas",
        "/inventario-pagina",
        "Ver solicitudes",
        "fa-solid fa-circle-xmark",
        "inventario"
      )}

      ${crearTarjeta(
        obtenerNumero(resumen.solicitudes_entregadas),
        "Solicitudes entregadas",
        "/inventario-pagina",
        "Ver solicitudes",
        "fa-solid fa-truck",
        "obras"
      )}

    `;

    // El jefe de obra no necesita alertas generales de inventario.
    seccionAlertas.style.display = "none";
  };

  // ========================================
  // DASHBOARD DEL ENCARGADO DE INVENTARIO
  // ========================================

  const mostrarPanelInventario = (resumen) => {

    contenedorTarjetas.innerHTML = `

      ${crearTarjeta(
        obtenerNumero(resumen.total_materiales),
        "Total de materiales",
        "/inventario-pagina",
        "Ver inventario",
        "fa-solid fa-boxes-stacked",
        "inventario"
      )}

      ${crearTarjeta(
        obtenerNumero(resumen.stock_bajo),
        "Materiales con stock bajo",
        "/inventario-pagina",
        "Ver inventario",
        "fa-solid fa-triangle-exclamation",
        "obras"
      )}

      ${crearTarjeta(
        obtenerNumero(resumen.materiales_agotados),
        "Materiales agotados",
        "/inventario-pagina",
        "Ver inventario",
        "fa-solid fa-circle-exclamation",
        "clientes"
      )}

      ${crearTarjeta(
        obtenerNumero(resumen.solicitudes_pendientes),
        "Solicitudes pendientes",
        "/inventario-pagina",
        "Gestionar solicitudes",
        "fa-solid fa-clipboard-list",
        "obras"
      )}

    `;
  };

  // ========================================
  // MOSTRAR ALERTAS DE INVENTARIO
  // ========================================

  const mostrarAlertas = (resumen) => {

    const stockBajo = obtenerNumero(resumen.stock_bajo);
    const agotados = obtenerNumero(resumen.materiales_agotados);

    const totalAlertas = stockBajo + agotados;

    // Los agotados ya están incluidos en stock_bajo.
    // Por eso el indicador muestra el total de materiales
    // que requieren atención, sin sumar dos veces.

    cantidadAlertas.textContent = stockBajo;

    listaAlertas.innerHTML = "";

    if (stockBajo === 0) {

      listaAlertas.innerHTML = `
        <div class="alerta-item">
          <div class="alerta-icono">
            <i class="fa-solid fa-circle-check"></i>
          </div>

          <div>
            <strong>Inventario en buen estado</strong>
            <span>No hay materiales con stock bajo.</span>
          </div>
        </div>
      `;

      return;
    }

    if (agotados > 0) {

      listaAlertas.innerHTML += `
        <div class="alerta-item">

          <div class="alerta-icono">⚠</div>

          <div>
            <strong>Materiales agotados</strong>
            <span>${agotados} materiales sin existencias.</span>
          </div>

        </div>
      `;
    }

    const disponiblesConStockBajo = stockBajo - agotados;

    if (disponiblesConStockBajo > 0) {

      listaAlertas.innerHTML += `
        <div class="alerta-item">

          <div class="alerta-icono">⚠</div>

          <div>
            <strong>Stock bajo</strong>
            <span>${disponiblesConStockBajo} materiales necesitan reposición.</span>
          </div>

        </div>
      `;
    }
  };

  // ========================================
  // MOSTRAR ACTIVIDADES RECIENTES
  // ========================================

  const mostrarActividades = (actividades) => {

    listaActividades.innerHTML = "";

    if (!Array.isArray(actividades) || actividades.length === 0) {

      listaActividades.innerHTML = `
        <p>No hay actividades registradas todavía.</p>
      `;

      return;
    }

    actividades.forEach((actividad) => {

      const item = document.createElement("div");
      item.className = "actividad-item";

      const icono = document.createElement("div");
      icono.className = "actividad-icono";

      const iconoElemento = document.createElement("i");

      if (actividad.tipo === "Solicitud") {
        iconoElemento.className = "fa-solid fa-clipboard-list";
      } else {
        iconoElemento.className = "fa-solid fa-box";
      }

      icono.appendChild(iconoElemento);

      const contenido = document.createElement("div");

      const titulo = document.createElement("strong");
      titulo.textContent = actividad.descripcion || "Actividad registrada";

      const detalle = document.createElement("span");

      const fecha = actividad.fecha
        ? new Date(actividad.fecha).toLocaleString("es-PY", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "Fecha no disponible";

      const usuario = actividad.usuario
        ? ` | Usuario: ${actividad.usuario}`
        : "";

      detalle.textContent =
        `${actividad.detalle || ""} | ${fecha}${usuario}`;

      contenido.appendChild(titulo);
      contenido.appendChild(detalle);

      item.appendChild(icono);
      item.appendChild(contenido);

      listaActividades.appendChild(item);

    });
  };

  // ========================================
  // CARGAR DATOS DEL DASHBOARD
  // ========================================

  const cargarDatosInicio = async () => {

    try {

      const respuesta = await fetch("/inicio/datos", {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
        credentials: "same-origin",
      });

      if (respuesta.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!respuesta.ok) {
        throw new Error("No se pudieron obtener los datos del inicio.");
      }

      const datos = await respuesta.json();

      const usuario = datos.usuario;
      const resumen = datos.resumen || {};
      const actividades = datos.actividades || [];

      if (!usuario) {
        throw new Error("No se encontró información del usuario.");
      }

      // Mostrar usuario y rol.
      mostrarUsuario(usuario);

      // Mostrar el dashboard correspondiente.
      const idRol = Number(usuario.id_rol);

      switch (idRol) {

        case 1:
          mostrarPanelGerente(resumen);
          mostrarAlertas(resumen);
          break;

        case 2:
          mostrarPanelJefe(resumen);
          break;

        case 3:
          mostrarPanelInventario(resumen);
          mostrarAlertas(resumen);
          break;

        default:
          throw new Error("El rol del usuario no es válido.");
      }

      // Mostrar actividades recientes.
      mostrarActividades(actividades);

    } catch (error) {

      console.error("Error al cargar el inicio:", error);

      contenedorTarjetas.innerHTML = `
        <p>No se pudo cargar la información del panel.</p>
      `;

      listaActividades.innerHTML = `
        <p>No se pudieron cargar las actividades recientes.</p>
      `;

      listaAlertas.innerHTML = `
        <p>No se pudo consultar el inventario.</p>
      `;
    }
  };

  // ========================================
  // CERRAR SESIÓN
  // ========================================

  const botonCerrarSesion = document.getElementById("cerrarSesion");

  if (botonCerrarSesion) {

    botonCerrarSesion.addEventListener("click", async () => {

      try {

        const respuesta = await fetch("/usuarios/logout", {
          method: "POST",
          credentials: "same-origin",
        });

        if (respuesta.ok) {
          window.location.href = "/login";
        } else {
          alert("No se pudo cerrar la sesión. Intentá nuevamente.");
        }

      } catch (error) {

        console.error("Error al cerrar sesión:", error);

        alert("No se pudo conectar con el servidor.");
      }
    });
  }

  // ========================================
  // INICIALIZAR DASHBOARD
  // ========================================

  mostrarFecha();
  cargarDatosInicio();

});
