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
  const btnVolverConfiguracion = document.getElementById(
    "btnVolverConfiguracion",
  );

  let usuarioActual = null;
  let temaOscuro = false;

  // ========================================
  // FUNCIONES GENERALES
  // ========================================

  function obtenerNombreRol(idRol) {
    const roles = {
      1: "Gerente",
      2: "Jefe de Obra",
      3: "Encargado de Inventario",
    };

    return roles[Number(idRol)] || "Usuario";
  }

  function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, (caracter) => {
      const caracteres = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
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
  // NOTIFICACIONES
  // ========================================

  function notificar(mensaje, tipo = "info") {
    let contenedor = document.getElementById("contenedorNotificaciones");

    if (!contenedor) {
      contenedor = document.createElement("div");
      contenedor.id = "contenedorNotificaciones";
      contenedor.className = "contenedor-notificaciones";
      document.body.appendChild(contenedor);
    }

    const iconos = {
      exito: "fa-circle-check",
      error: "fa-circle-exclamation",
      info: "fa-circle-info",
    };

    const notificacion = document.createElement("div");
    notificacion.className = `notificacion ${tipo}`;

    notificacion.innerHTML = `
      <i class="fa-solid ${iconos[tipo] || iconos.info}"></i>
      <span>${escaparHTML(mensaje)}</span>
    `;

    contenedor.appendChild(notificacion);

    window.setTimeout(() => {
      notificacion.remove();

      if (!contenedor.children.length) {
        contenedor.remove();
      }
    }, 4000);
  }

  // ========================================
  // MODALES GENERALES
  // ========================================

  function crearModal(titulo, subtitulo, icono = "fa-gear") {
    const modal = document.createElement("div");

    modal.className = "modal-sistema";
    modal.setAttribute("role", "presentation");

    modal.innerHTML = `
      <section
        class="modal-contenido"
        role="dialog"
        aria-modal="true"
        aria-label="${escaparHTML(titulo)}"
      >
        <div class="modal-encabezado">
          <div class="modal-titulo-grupo">
            <div class="modal-icono">
              <i class="fa-solid ${icono}"></i>
            </div>

            <div>
              <h2>${escaparHTML(titulo)}</h2>
              <p>${escaparHTML(subtitulo)}</p>
            </div>
          </div>

          <button
            type="button"
            class="modal-cerrar"
            aria-label="Cerrar ventana"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div class="modal-cuerpo"></div>
      </section>
    `;

    document.body.appendChild(modal);

    const cerrar = () => modal.remove();

    modal.querySelector(".modal-cerrar").addEventListener("click", cerrar);

    modal.addEventListener("click", (evento) => {
      if (evento.target === modal) {
        cerrar();
      }
    });

    return {
      modal,
      cuerpo: modal.querySelector(".modal-cuerpo"),
      cerrar,
    };
  }

  function abrirFormulario({
    titulo,
    subtitulo,
    icono,
    campos,
    textoBoton = "Guardar",
    alEnviar,
  }) {
    const ventana = crearModal(titulo, subtitulo, icono);
    const formulario = document.createElement("form");

    formulario.className = "formulario-modal";

    formulario.innerHTML = `
      ${campos.join("")}

      <div class="modal-acciones">
        <button
          type="button"
          class="btn-modal btn-modal-secundario"
          data-cancelar
        >
          Cancelar
        </button>

        <button type="submit" class="btn-modal btn-modal-principal">
          ${escaparHTML(textoBoton)}
        </button>
      </div>
    `;

    ventana.cuerpo.appendChild(formulario);

    formulario
      .querySelector("[data-cancelar]")
      .addEventListener("click", ventana.cerrar);

    formulario.addEventListener("submit", async (evento) => {
      evento.preventDefault();

      if (!formulario.reportValidity()) {
        return;
      }

      const botonEnviar = formulario.querySelector('button[type="submit"]');

      botonEnviar.disabled = true;
      botonEnviar.textContent = "Procesando...";

      try {
        const datosFormulario = Object.fromEntries(
          new FormData(formulario).entries(),
        );

        const resultado = await alEnviar(datosFormulario);

        if (resultado !== false) {
          ventana.cerrar();
        }
      } catch (error) {
        notificar(
          error.message || "No se pudo completar la operación.",
          "error",
        );
      } finally {
        if (botonEnviar.isConnected) {
          botonEnviar.disabled = false;
          botonEnviar.textContent = textoBoton;
        }
      }
    });

    const primerCampo = formulario.querySelector("input, select");

    if (primerCampo) {
      primerCampo.focus();
    }

    return ventana;
  }

  function confirmarAccion({
    titulo,
    mensaje,
    textoConfirmar = "Confirmar",
    peligro = false,
    icono = "fa-circle-question",
  }) {
    return new Promise((resolve) => {
      const ventana = crearModal(titulo, "", icono);

      ventana.cuerpo.innerHTML = `
        <p class="confirmacion-mensaje">
          ${escaparHTML(mensaje)}
        </p>

        <div class="modal-acciones">
          <button
            type="button"
            class="btn-modal btn-modal-secundario"
            data-cancelar
          >
            Cancelar
          </button>

          <button
            type="button"
            class="btn-modal ${
              peligro ? "btn-modal-peligro" : "btn-modal-principal"
            }"
            data-confirmar
          >
            ${escaparHTML(textoConfirmar)}
          </button>
        </div>
      `;

      let resuelto = false;

      function finalizar(valor) {
        if (resuelto) return;

        resuelto = true;
        ventana.cerrar();
        resolve(valor);
      }

      ventana.cuerpo
        .querySelector("[data-cancelar]")
        .addEventListener("click", () => finalizar(false));

      ventana.cuerpo
        .querySelector("[data-confirmar]")
        .addEventListener("click", () => finalizar(true));

      ventana.modal.addEventListener("click", (evento) => {
        if (evento.target === ventana.modal) {
          finalizar(false);
        }
      });
    });
  }

  // ========================================
  // CARGAR SESIÓN
  // ========================================

  function actualizarDatosSuperiores() {
    if (!usuarioActual) return;

    nombreUsuario.textContent = usuarioActual.username || "Usuario";

    rolUsuario.textContent =
      usuarioActual.nombre_rol || obtenerNombreRol(usuarioActual.id_rol);

    avatarUsuario.textContent = (usuarioActual.username || "U")
      .charAt(0)
      .toUpperCase();

    seccionUsuarios.style.display =
      Number(usuarioActual.id_rol) === 1 ? "flex" : "none";
  }

  async function cargarUsuario() {
    try {
      const respuesta = await fetch("/usuarios/sesion", {
        method: "GET",
        credentials: "include",
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

      actualizarDatosSuperiores();
    } catch (error) {
      console.error("Error al cargar el usuario:", error);
      notificar("No se pudo cargar la información del usuario.", "error");
    }
  }

  // ========================================
  // GESTIÓN DE USUARIOS
  // ========================================

  btnUsuarios.addEventListener("click", async (evento) => {
    evento.preventDefault();

    if (!usuarioActual || Number(usuarioActual.id_rol) !== 1) {
      notificar("No tienes permiso para acceder a esta sección.", "error");
      return;
    }

    configuracionGrid.style.display = "none";
    panelUsuarios.classList.add("visible");

    await cargarUsuarios();
  });

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
        credentials: "include",
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

    tablaUsuarios.innerHTML = usuarios
      .map((usuario) => {
        const esActivo = usuario.estado === "Activo";

        const esMiCuenta =
          Number(usuario.id_usuario) === Number(usuarioActual.id_usuario);

        return `
        <tr>
          <td>${escaparHTML(usuario.id_usuario)}</td>
          <td>${escaparHTML(usuario.username)}</td>
          <td>${escaparHTML(usuario.email)}</td>

          <td>
            ${escaparHTML(
              usuario.nombre_rol || obtenerNombreRol(usuario.id_rol),
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
                data-id="${escaparHTML(usuario.id_usuario)}"
              >
                <i class="fa-solid fa-pen"></i>
                Editar
              </button>

              <button
                type="button"
                class="btn-accion btn-password"
                data-accion="password"
                data-id="${escaparHTML(usuario.id_usuario)}"
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
                      data-id="${escaparHTML(usuario.id_usuario)}"
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
      })
      .join("");
  }

  // ========================================
  // REGISTRAR USUARIO
  // ========================================

  btnNuevoUsuario.addEventListener("click", () => {
    abrirFormulario({
      titulo: "Nuevo usuario",
      subtitulo: "Completa los datos para registrar una cuenta.",
      icono: "fa-user-plus",
      textoBoton: "Registrar usuario",

      campos: [
        `
          <div class="campo-modal">
            <label for="nuevoUsername">Nombre de usuario</label>
            <input
              type="text"
              id="nuevoUsername"
              name="username"
              placeholder="Ingrese el nombre de usuario"
              maxlength="50"
              autocomplete="username"
              required
            >
          </div>
        `,
        `
          <div class="campo-modal">
            <label for="nuevoEmail">Correo electrónico</label>
            <input
              type="email"
              id="nuevoEmail"
              name="email"
              placeholder="ejemplo@correo.com"
              maxlength="100"
              autocomplete="email"
              required
            >
          </div>
        `,
        `
          <div class="campo-modal">
            <label for="nuevoPassword">Contraseña</label>
            <input
              type="password"
              id="nuevoPassword"
              name="password"
              placeholder="Mínimo 8 caracteres"
              minlength="8"
              autocomplete="new-password"
              required
            >
            <span class="ayuda-campo">
              La contraseña debe tener al menos 8 caracteres.
            </span>
          </div>
        `,
        `
          <div class="campo-modal">
            <label for="nuevoRol">Rol del usuario</label>
            <select id="nuevoRol" name="id_rol" required>
              <option value="">Seleccione un rol</option>
              <option value="1">Gerente</option>
              <option value="2">Jefe de Obra</option>
              <option value="3">Encargado de Inventario</option>
            </select>
          </div>
        `,
      ],

      alEnviar: async (datos) => {
        const username = datos.username.trim();
        const email = datos.email.trim();
        const password = datos.password;
        const id_rol = Number(datos.id_rol);

        if (!username || !email || !password.trim()) {
          throw new Error("Todos los campos son obligatorios.");
        }

        if (password.length < 8) {
          throw new Error("La contraseña debe tener al menos 8 caracteres.");
        }

        if (![1, 2, 3].includes(id_rol)) {
          throw new Error("El rol seleccionado no es válido.");
        }

        const respuesta = await fetch("/usuarios", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            username,
            email,
            password,
            id_rol,
          }),
        });

        const resultado = await procesarRespuesta(respuesta);

        notificar(
          resultado.mensaje || "Usuario creado correctamente.",
          "exito",
        );

        await cargarUsuarios();
      },
    });
  });

  // ========================================
  // ACCIONES DE LA TABLA
  // ========================================

  tablaUsuarios.addEventListener("click", async (evento) => {
    const boton = evento.target.closest("button[data-accion]");

    if (!boton) return;

    const id = boton.dataset.id;
    const accion = boton.dataset.accion;

    boton.disabled = true;

    try {
      if (accion === "editar") {
        await editarUsuario(id);
      }

      if (accion === "password") {
        cambiarPassword(id);
      }

      if (accion === "estado") {
        await cambiarEstado(id, boton.dataset.estado);
      }
    } catch (error) {
      notificar(error.message, "error");
    } finally {
      if (boton.isConnected) {
        boton.disabled = false;
      }
    }
  });

  // ========================================
  // OBTENER USUARIO POR ID
  // ========================================

  async function obtenerUsuario(id) {
    const respuesta = await fetch("/usuarios", {
      method: "GET",
      credentials: "include",
    });

    const datos = await procesarRespuesta(respuesta);

    return (datos.usuarios || []).find(
      (usuario) => Number(usuario.id_usuario) === Number(id),
    );
  }

  // ========================================
  // EDITAR USUARIO
  // ========================================

  async function editarUsuario(id) {
    let usuario;

    try {
      usuario = await obtenerUsuario(id);
    } catch (error) {
      notificar(error.message, "error");
      return;
    }

    if (!usuario) {
      notificar("No se encontró el usuario.", "error");
      return;
    }

    abrirFormulario({
      titulo: "Editar usuario",
      subtitulo: "Modifica los datos de la cuenta seleccionada.",
      icono: "fa-user-pen",
      textoBoton: "Guardar cambios",

      campos: [
        `
          <div class="campo-modal">
            <label for="editarUsername">Nombre de usuario</label>
            <input
              type="text"
              id="editarUsername"
              name="username"
              value="${escaparHTML(usuario.username)}"
              maxlength="50"
              autocomplete="username"
              required
            >
          </div>
        `,
        `
          <div class="campo-modal">
            <label for="editarEmail">Correo electrónico</label>
            <input
              type="email"
              id="editarEmail"
              name="email"
              value="${escaparHTML(usuario.email)}"
              maxlength="100"
              autocomplete="email"
              required
            >
          </div>
        `,
        `
          <div class="campo-modal">
            <label for="editarRol">Rol del usuario</label>
            <select id="editarRol" name="id_rol" required>
              <option value="1" ${
                Number(usuario.id_rol) === 1 ? "selected" : ""
              }>Gerente</option>

              <option value="2" ${
                Number(usuario.id_rol) === 2 ? "selected" : ""
              }>Jefe de Obra</option>

              <option value="3" ${
                Number(usuario.id_rol) === 3 ? "selected" : ""
              }>Encargado de Inventario</option>
            </select>
          </div>
        `,
      ],

      alEnviar: async (datos) => {
        const username = datos.username.trim();
        const email = datos.email.trim();
        const id_rol = Number(datos.id_rol);

        if (!username || !email) {
          throw new Error("El nombre de usuario y el correo son obligatorios.");
        }

        if (![1, 2, 3].includes(id_rol)) {
          throw new Error("El rol seleccionado no es válido.");
        }

        const respuesta = await fetch(`/usuarios/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            username,
            email,
            id_rol,
          }),
        });

        const resultado = await procesarRespuesta(respuesta);

        notificar(
          resultado.mensaje || "Usuario actualizado correctamente.",
          "exito",
        );

        await cargarUsuarios();

        // Actualizar los datos superiores si se editó la propia cuenta.
        if (Number(id) === Number(usuarioActual.id_usuario)) {
          const sesion = await fetch("/usuarios/sesion", {
            credentials: "include",
          });

          if (sesion.ok) {
            const datosSesion = await sesion.json();

            usuarioActual = datosSesion.usuario;

            actualizarDatosSuperiores();

            if (Number(usuarioActual.id_rol) !== 1) {
              window.location.href = "/inicio";
            }
          }
        }
      },
    });
  }

  // ========================================
  // CAMBIAR CONTRASEÑA
  // ========================================

  function cambiarPassword(id) {
    abrirFormulario({
      titulo: "Cambiar contraseña",
      subtitulo: "Establece una nueva contraseña para este usuario.",
      icono: "fa-key",
      textoBoton: "Actualizar contraseña",

      campos: [
        `
          <div class="campo-modal">
            <label for="nuevaPassword">Nueva contraseña</label>
            <input
              type="password"
              id="nuevaPassword"
              name="password"
              placeholder="Mínimo 8 caracteres"
              minlength="8"
              autocomplete="new-password"
              required
            >
          </div>
        `,
        `
          <div class="campo-modal">
            <label for="confirmarPassword">Confirmar contraseña</label>
            <input
              type="password"
              id="confirmarPassword"
              name="confirmarPassword"
              placeholder="Repita la nueva contraseña"
              minlength="8"
              autocomplete="new-password"
              required
            >
          </div>
        `,
      ],

      alEnviar: async (datos) => {
        if (datos.password.length < 8) {
          throw new Error("La contraseña debe tener al menos 8 caracteres.");
        }

        if (datos.password !== datos.confirmarPassword) {
          throw new Error("Las contraseñas no coinciden.");
        }

        const confirmar = await confirmarAccion({
          titulo: "Confirmar cambio",
          mensaje: "¿Deseas cambiar la contraseña de este usuario?",
          textoConfirmar: "Cambiar contraseña",
          icono: "fa-key",
        });

        if (!confirmar) {
          return false;
        }

        const respuesta = await fetch(`/usuarios/${id}/password`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            password: datos.password,
          }),
        });

        const resultado = await procesarRespuesta(respuesta);

        notificar(
          resultado.mensaje || "Contraseña actualizada correctamente.",
          "exito",
        );
      },
    });
  }

  // ========================================
  // ACTIVAR / DESACTIVAR USUARIO
  // ========================================

  async function cambiarEstado(id, estado) {
    const accion = estado === "Activo" ? "activar" : "desactivar";

    const confirmar = await confirmarAccion({
      titulo: estado === "Activo" ? "Activar usuario" : "Desactivar usuario",
      mensaje: `¿Deseas ${accion} este usuario?`,
      textoConfirmar: estado === "Activo" ? "Activar" : "Desactivar",
      peligro: estado !== "Activo",
      icono: estado === "Activo" ? "fa-user-check" : "fa-user-slash",
    });

    if (!confirmar) return;

    const respuesta = await fetch(`/usuarios/${id}/estado`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ estado }),
    });

    const resultado = await procesarRespuesta(respuesta);

    notificar(
      resultado.mensaje || "Estado actualizado correctamente.",
      "exito",
    );

    await cargarUsuarios();
  }

  // ========================================
  // MI CUENTA
  // ========================================

  btnMiCuenta.addEventListener("click", () => {
    if (!usuarioActual) return;

    if (document.getElementById("modalMiCuenta")) return;

    const modal = document.createElement("div");
    modal.id = "modalMiCuenta";
    modal.className = "modal-sistema";

    const username = escaparHTML(usuarioActual.username);
    const email = escaparHTML(usuarioActual.email || "No registrado");

    const rol = escaparHTML(
      usuarioActual.nombre_rol || obtenerNombreRol(usuarioActual.id_rol),
    );

    const estado = escaparHTML(usuarioActual.estado || "Activo");

    modal.innerHTML = `
      <div class="modal-cuenta-contenido" role="dialog" aria-modal="true">
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

    const cerrar = () => modal.remove();

    modal
      .querySelector("#cerrarModalMiCuenta")
      .addEventListener("click", cerrar);

    modal.addEventListener("click", (evento) => {
      if (evento.target === modal) {
        cerrar();
      }
    });
  });

  // ========================================
  // CAMBIAR TEMA
  // ========================================

  btnTema.addEventListener("click", () => {
    temaOscuro = !temaOscuro;

    document.body.classList.toggle("tema-oscuro", temaOscuro);

    btnTema.innerHTML = temaOscuro
      ? 'Activar tema claro <i class="fa-solid fa-sun"></i>'
      : 'Cambiar tema <i class="fa-solid fa-arrow-right"></i>';

    notificar(
      temaOscuro ? "Tema oscuro activado." : "Tema claro activado.",
      "exito",
    );
  });

  // ========================================
  // ACERCA DEL SISTEMA
  // ========================================

  btnAcerca.addEventListener("click", () => {
    if (document.getElementById("modalAcerca")) return;

    const modal = document.createElement("div");
    modal.id = "modalAcerca";
    modal.className = "modal-sistema";

    modal.innerHTML = `
      <div class="modal-acerca-contenido" role="dialog" aria-modal="true">
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

    const cerrar = () => modal.remove();

    modal.querySelector("#cerrarModalAcerca").addEventListener("click", cerrar);

    modal.addEventListener("click", (evento) => {
      if (evento.target === modal) {
        cerrar();
      }
    });
  });

  // ========================================
  // CERRAR SESIÓN
  // ========================================

  cerrarSesion.addEventListener("click", async () => {
    const confirmar = await confirmarAccion({
      titulo: "Cerrar sesión",
      mensaje: "¿Deseas cerrar tu sesión de EnterpriseSys?",
      textoConfirmar: "Cerrar sesión",
      peligro: true,
      icono: "fa-right-from-bracket",
    });

    if (!confirmar) return;

    cerrarSesion.disabled = true;

    try {
      const respuesta = await fetch("/usuarios/logout", {
        method: "POST",
        credentials: "include",
      });

      if (respuesta.ok) {
        window.location.href = "/login";
        return;
      }

      const datos = await respuesta.json().catch(() => ({}));

      throw new Error(datos.mensaje || "No se pudo cerrar la sesión.");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      notificar(error.message || "Ocurrió un error al cerrar sesión.", "error");
    } finally {
      cerrarSesion.disabled = false;
    }
  });

  // ========================================
  // INICIALIZAR
  // ========================================

  cargarUsuario();
});
