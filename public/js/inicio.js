document.addEventListener("DOMContentLoaded", () => {
  // Mostrar la fecha actual
  const fecha = new Date();

  const fechaFormateada = fecha.toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const elementoFecha = document.getElementById("fechaActual");

  if (elementoFecha) {
    elementoFecha.textContent = fechaFormateada;
  }

  // Cerrar sesión
  const botonCerrarSesion = document.getElementById("cerrarSesion");

  if (botonCerrarSesion) {
    botonCerrarSesion.addEventListener("click", async () => {
      try {
        const respuesta = await fetch("/usuarios/logout", {
          method: "POST",
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
});
