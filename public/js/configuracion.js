
document.addEventListener("DOMContentLoaded", () => {

  // ========================================
  // ELEMENTOS
  // ========================================

  const nombreUsuario = document.getElementById("nombreUsuario");
  const rolUsuario = document.getElementById("rolUsuario");
  const avatarUsuario = document.getElementById("avatarUsuario");

  const seccionUsuarios = document.getElementById("seccionUsuarios");
  const btnUsuarios = document.getElementById("btnUsuarios");
  const btnMiCuenta = document.getElementById("btnMiCuenta");
  const btnTema = document.getElementById("btnTema");
  const btnAcerca = document.getElementById("btnAcerca");
  const cerrarSesion = document.getElementById("cerrarSesion");

  const configuracionGrid = document.getElementById("configuracionGrid");
  const panelUsuarios = document.getElementById("panelUsuarios");
  const tablaUsuarios = document.getElementById("tablaUsuarios");

  const btnNuevoUsuario = document.getElementById("btnNuevoUsuario");
  const btnVolverConfiguracion = document.getElementById("btnVolverConfiguracion");

  let usuarioActual = null;
  let temaOscuro = false;

  // ========================================
  // FUNCIONES GENERALES
  // ========================================

  function obtenerNombreRol(idRol) {
    const roles = {
      1: "Gerente",
      2: "Jefe de Obra",
      3: "Encargado de Inventario"
    };

    return roles[Number(idRol)] || "Usuario";
  }

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

  async function procesarRespuesta(respuesta) {
    const datos = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
      throw new Error(datos.mensaje || "Ocurrió un error.");
    }

    return datos;
  }

  // ========================================
  // CARGAR SESIÓN
  // ========================================

  async function cargarUsuario() {
    try {
      const respuesta = await fetch("/usuarios/sesion", {
        method: "GET",
        credentials: "include"
      });

      if (!respuesta.ok) {
        window.location.href = "/login";
        return;
      }

      const datos = await respuesta.json();

      usuarioActual = datos.usuario;

      if (!usuarioActual) {
        window.location.href = "/login";
        return;
      }

      nombreUsuario.textContent = usuarioActual.username;

      rolUsuario.textContent =
        usuarioActual.nombre_rol ||
        obtenerNombreRol(usuarioActual.id_rol);

      avatarUsuario.textContent =
        usuarioActual.username.charAt(0).toUpperCase();

      if (Number(usuarioActual.id_rol) === 1) {
        seccionUsuarios.style.display = "flex";
      } else {
        seccionUsuarios.style.display = "none";
      }

    } catch (error) {
      console.error("Error al cargar el usuario:", error);
      alert("No se pudo cargar la información del usuario.");
    }
  }

  // ========================================
  // MOSTRAR GESTIÓN DE USUARIOS
  // ========================================

  btnUsuarios.addEventListener("click", async (e) => {
    e.preventDefault();

    if (!usuarioActual || Number(usuarioActual.id_rol) !== 1) {
      alert("No tienes permiso para acceder a esta sección.");
      return;
    }

    configuracionGrid.style.display = "none";
    panelUsuarios.classList.add("visible");

    await cargarUsuarios();
  });

  // ========================================
  // VOLVER A CONFIGURACIÓN
  // ========================================

  btnVolverConfiguracion.addEventListener("click", () => {
    panelUsuarios.classList.remove("visible");
    configuracionGrid.style.display = "grid";
  });

  // ========================================
  // LISTAR USUARIOS
  // ========================================

  async function cargarUsuarios() {
    tablaUsuarios.innerHTML = `
      <tr>
        <td colspan="6" class="mensaje-tabla">
          Cargando usuarios...
        </td>
      </tr>
    `;

    try {
      const respuesta = await fetch("/usuarios", {
        method: "GET",
        credentials: "include"
      });

      const datos = await procesarRespuesta(respuesta);

      mostrarUsuarios(datos.usuarios || []);

    } catch (error) {
      console.error("Error al listar usuarios:", error);

      tablaUsuarios.innerHTML = `
        <tr>
          <td colspan="6" class="mensaje-tabla">
            ${escaparHTML(error.message)}
          </td>
        </tr>
      `;
    }
  }

  // ========================================
  // MOSTRAR USUARIOS EN LA TABLA
  // ========================================

  function mostrarUsuarios(usuarios) {

    if (usuarios.length === 0) {
      tablaUsuarios.innerHTML = `
        <tr>
          <td colspan="6" class="mensaje-tabla">
            No hay usuarios registrados.
          </td>
        </tr>
      `;
      return;
    }

    tablaUsuarios.innerHTML = usuarios.map(usuario => {

      const esActivo = usuario.estado === "Activo";
      const esMiCuenta =
        Number(usuario.id_usuario) === Number(usuarioActual.id_usuario);

      return `
        <tr>

          <td>${usuario.id_usuario}</td>

          <td>${escaparHTML(usuario.username)}</td>

          <td>${escaparHTML(usuario.email)}</td>

          <td>
            ${escaparHTML(
              usuario.nombre_rol || obtenerNombreRol(usuario.id_rol)
            )}
          </td>

          <td>
            <span class="estado-usuario ${
              esActivo ? "estado-activo" : "estado-inactivo"
            }">
              ${escaparHTML(usuario.estado)}
            </span>
          </td>

          <td>
            <div class="acciones-usuario">

              <button
                type="button"
                class="btn-accion btn-editar"
                data-accion="editar"
                data-id="${usuario.id_usuario}"
              >
                <i class="fa-solid fa-pen"></i>
                Editar
              </button>

              <button
                type="button"
                class="btn-accion btn-password"
                data-accion="password"
                data-id="${usuario.id_usuario}"
              >
                <i class="fa-solid fa-key"></i>
                Contraseña
              </button>

              ${
                esMiCuenta
                  ? ""
                  : `
                    <button
                      type="button"
                      class="btn-accion ${
                        esActivo ? "btn-desactivar" : "btn-estado"
                      }"
                      data-accion="estado"
                      data-id="${usuario.id_usuario}"
                      data-estado="${esActivo ? "Inactivo" : "Activo"}"
                    >
                      <i class="fa-solid ${
                        esActivo ? "fa-ban" : "fa-check"
                      }"></i>
                      ${esActivo ? "Desactivar" : "Activar"}
                    </button>
                  `
              }

            </div>
          </td>

        </tr>
      `;

    }).join("");
  }

  // ========================================
  // REGISTRAR USUARIO
  // ========================================

  btnNuevoUsuario.addEventListener("click", async () => {

    const username = prompt("Ingrese el nombre de usuario:");

    if (username === null) return;

    const email = prompt("Ingrese el correo electrónico:");

    if (email === null) return;

    const password = prompt("Ingrese la contraseña (mínimo 8 caracteres):");

    if (password === null) return;

    const id_rol = prompt(
      "Seleccione el rol:\n\n" +
      "1 - Gerente\n" +
      "2 - Jefe de Obra\n" +
      "3 - Encargado de Inventario\n\n" +
      "Ingrese el número del rol:"
    );

    if (id_rol === null) return;

    if (!username.trim() || !email.trim() || !password.trim()) {
      alert("Todos los campos son obligatorios.");
      return;
    }

    if (password.length < 8) {
      alert("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (![1, 2, 3].includes(Number(id_rol))) {
      alert("El rol seleccionado no es válido.");
      return;
    }

    try {
      const respuesta = await fetch("/usuarios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password,
          id_rol: Number(id_rol)
        })
      });

      const datos = await procesarRespuesta(respuesta);

      alert(datos.mensaje || "Usuario creado correctamente.");

      await cargarUsuarios();

    } catch (error) {
      alert(error.message);
    }

  });

  // ========================================
  // ACCIONES DE LA TABLA
  // ========================================

  tablaUsuarios.addEventListener("click", async (e) => {

    const boton = e.target.closest("button[data-accion]");

    if (!boton) return;

    const id = boton.dataset.id;
    const accion = boton.dataset.accion;

    if (accion === "editar") {
      await editarUsuario(id);
    }

    if (accion === "password") {
      await cambiarPassword(id);
    }

    if (accion === "estado") {
      await cambiarEstado(id, boton.dataset.estado);
    }

  });

  // ========================================
  // EDITAR USUARIO
  // ========================================

  async function editarUsuario(id) {

    const respuestaActual = await fetch("/usuarios", {
      method: "GET",
      credentials: "include"
    });

    let usuarios;

    try {
      const datos = await procesarRespuesta(respuestaActual);
      usuarios = datos.usuarios || [];
    } catch (error) {
      alert(error.message);
      return;
    }

    const usuario = usuarios.find(
      u => Number(u.id_usuario) === Number(id)
    );

    if (!usuario) {
      alert("No se encontró el usuario.");
      return;
    }

    const username = prompt(
      "Nombre de usuario:",
      usuario.username
    );

    if (username === null) return;

    const email = prompt(
      "Correo electrónico:",
      usuario.email
    );

    if (email === null) return;

    const id_rol = prompt(
      "Seleccione el rol:\n\n" +
      "1 - Gerente\n" +
      "2 - Jefe de Obra\n" +
      "3 - Encargado de Inventario",
      usuario.id_rol
    );

    if (id_rol === null) return;

    if (!username.trim() || !email.trim()) {
      alert("El nombre de usuario y el correo son obligatorios.");
      return;
    }

    if (![1, 2, 3].includes(Number(id_rol))) {
      alert("El rol seleccionado no es válido.");
      return;
    }

    try {
      const respuesta = await fetch(`/usuarios/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          id_rol: Number(id_rol)
        })
      });

      const datos = await procesarRespuesta(respuesta);

      alert(datos.mensaje || "Usuario actualizado correctamente.");

      await cargarUsuarios();

      // Actualizar datos superiores si se modificó la propia cuenta.
      if (Number(id) === Number(usuarioActual.id_usuario)) {
        const sesion = await fetch("/usuarios/sesion", {
          credentials: "include"
        });

        if (sesion.ok) {
          const datosSesion = await sesion.json();

          usuarioActual = datosSesion.usuario;

          nombreUsuario.textContent = usuarioActual.username;
          rolUsuario.textContent =
            usuarioActual.nombre_rol ||
            obtenerNombreRol(usuarioActual.id_rol);

          avatarUsuario.textContent =
            usuarioActual.username.charAt(0).toUpperCase();

          if (Number(usuarioActual.id_rol) !== 1) {
            window.location.href = "/inicio";
          }
        }
      }

    } catch (error) {
      alert(error.message);
    }

  }

  // ========================================
  // CAMBIAR CONTRASEÑA
  // ========================================

  async function cambiarPassword(id) {

    const password = prompt(
      "Ingrese la nueva contraseña (mínimo 8 caracteres):"
    );

    if (password === null) return;

    if (password.length < 8) {
      alert("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    const confirmar = confirm(
      "¿Deseas cambiar la contraseña de este usuario?"
    );

    if (!confirmar) return;

    try {
      const respuesta = await fetch(`/usuarios/${id}/password`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ password })
      });

      const datos = await procesarRespuesta(respuesta);

      alert(datos.mensaje || "Contraseña actualizada correctamente.");

    } catch (error) {
      alert(error.message);
    }

  }

  // ========================================
  // ACTIVAR / DESACTIVAR USUARIO
  // ========================================

  async function cambiarEstado(id, estado) {

    const accion = estado === "Activo" ? "activar" : "desactivar";

    const confirmar = confirm(
      `¿Deseas ${accion} este usuario?`
    );

    if (!confirmar) return;

    try {
      const respuesta = await fetch(`/usuarios/${id}/estado`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ estado })
      });

      const datos = await procesarRespuesta(respuesta);

      alert(datos.mensaje || "Estado actualizado correctamente.");

      await cargarUsuarios();

    } catch (error) {
      alert(error.message);
    }

  }

 
  // ========================================
  // MI CUENTA
  // ========================================

  btnMiCuenta.addEventListener("click", () => {

    if (!usuarioActual) return;

    // Evitar abrir dos ventanas al mismo tiempo
    if (document.getElementById("modalMiCuenta")) return;

    const modal = document.createElement("div");

    modal.id = "modalMiCuenta";

    const username = escaparHTML(usuarioActual.username);
    const email = escaparHTML(
      usuarioActual.email || "No registrado"
    );

    const rol = escaparHTML(
      usuarioActual.nombre_rol ||
      obtenerNombreRol(usuarioActual.id_rol)
    );

    const estado = escaparHTML(
      usuarioActual.estado || "Activo"
    );

    modal.innerHTML = `
      <div class="modal-cuenta-contenido">

        <div class="modal-cuenta-avatar">
          <i class="fa-solid fa-user"></i>
        </div>

        <h2>Mi cuenta</h2>

        <p class="modal-cuenta-subtitulo">
          Información de tu usuario en EnterpriseSys
        </p>

        <div class="modal-cuenta-detalles">

          <div>
            <i class="fa-solid fa-user"></i>
            <span>Usuario</span>
            <strong>${username}</strong>
          </div>

          <div>
            <i class="fa-solid fa-envelope"></i>
            <span>Correo</span>
            <strong>${email}</strong>
          </div>

          <div>
            <i class="fa-solid fa-user-tag"></i>
            <span>Rol</span>
            <strong>${rol}</strong>
          </div>

          <div>
            <i class="fa-solid fa-circle-check"></i>
            <span>Estado</span>
            <strong>${estado}</strong>
          </div>

        </div>

        <button type="button" id="cerrarModalMiCuenta">
          Cerrar
        </button>

      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById("cerrarModalMiCuenta")
      .addEventListener("click", () => {
        modal.remove();
      });

    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

  });

  // ========================================
  // CAMBIAR TEMA
  // ========================================

  function prepararTemaOscuro() {

    if (document.getElementById("estilosTemaOscuro")) return;

    const estilos = document.createElement("style");

    estilos.id = "estilosTemaOscuro";

    estilos.textContent = `

      body.tema-oscuro {
        background-color: #111827;
        color: #f9fafb;
      }

      body.tema-oscuro .barra-superior {
        background-color: #1f2937;
        border-color: #374151;
      }

      body.tema-oscuro .dashboard {
        color: #f9fafb;
      }

      body.tema-oscuro .encabezado-pagina h1,
      body.tema-oscuro .config-info h2,
      body.tema-oscuro .informacion-sistema strong {
        color: #f9fafb;
      }

      body.tema-oscuro .encabezado-pagina p,
      body.tema-oscuro .config-info p,
      body.tema-oscuro .informacion-sistema p,
      body.tema-oscuro .informacion-sistema span {
        color: #cbd5e1;
      }

      body.tema-oscuro .config-card,
      body.tema-oscuro .informacion-sistema {
        background-color: #1f2937;
        border-color: #374151;
      }

      body.tema-oscuro .datos-usuario strong {
        color: #f9fafb;
      }

      body.tema-oscuro .datos-usuario span {
        color: #cbd5e1;
      }

    `;

    document.head.appendChild(estilos);
  }

  btnTema.addEventListener("click", () => {

    temaOscuro = !temaOscuro;

    if (temaOscuro) {

      prepararTemaOscuro();
      document.body.classList.add("tema-oscuro");

      btnTema.innerHTML =
        'Activar tema claro <i class="fa-solid fa-sun"></i>';

    } else {

      document.body.classList.remove("tema-oscuro");

      btnTema.innerHTML =
        'Cambiar tema <i class="fa-solid fa-arrow-right"></i>';

    }

  });

  // ========================================
// ACERCA DEL SISTEMA
// ========================================

btnAcerca.addEventListener("click", () => {

  const modal = document.createElement("div");

  modal.id = "modalAcerca";

  modal.innerHTML = `
    <div class="modal-acerca-contenido">

      <div class="modal-acerca-icono">
        <i class="fa-solid fa-building"></i>
      </div>

      <h2>EnterpriseSys</h2>

      <p class="modal-acerca-subtitulo">
        Sistema de gestión empresarial
      </p>

      <div class="modal-acerca-detalles">

        <div>
          <i class="fa-solid fa-code"></i>
          <span>Versión</span>
          <strong>1.0</strong>
        </div>

        <div>
          <i class="fa-solid fa-users"></i>
          <span>Módulos</span>
          <strong>Clientes, Obras e Inventario</strong>
        </div>

        <div>
          <i class="fa-solid fa-shield-halved"></i>
          <span>Acceso</span>
          <strong>Controlado por roles</strong>
        </div>

      </div>

      <button type="button" id="cerrarModalAcerca">
        Cerrar
      </button>

    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById("cerrarModalAcerca")
    .addEventListener("click", () => {
      modal.remove();
    });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

});

  // ========================================
  // CERRAR SESIÓN
  // ========================================

  cerrarSesion.addEventListener("click", async () => {

    const confirmar = confirm("¿Deseas cerrar sesión?");

    if (!confirmar) return;

    try {
      const respuesta = await fetch("/usuarios/logout", {
        method: "POST",
        credentials: "include"
      });

      if (respuesta.ok) {
        window.location.href = "/login";
      } else {
        const datos = await respuesta.json().catch(() => ({}));
        alert(datos.mensaje || "No se pudo cerrar la sesión.");
      }

    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      alert("Ocurrió un error al cerrar sesión.");
    }

  });

  // ========================================
  // INICIALIZAR
  // ========================================

  cargarUsuario();

});
