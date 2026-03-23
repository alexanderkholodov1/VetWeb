function showPageFeedback(id, text, isError = false) {
  const el = document.getElementById(id);
  if (!el) {
    return;
  }
  el.textContent = text;
  el.classList.toggle("error", isError);
}

function requireSession(feedbackId) {
  if (!window.VetWebAuth?.state?.user) {
    showPageFeedback(feedbackId, "Necesitas iniciar sesión para realizar esta acción.", true);
    return false;
  }
  return true;
}

function bindCitaForm() {
  const form = document.getElementById("cita-form");
  if (!form || !window.VetWebAuth) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!requireSession("cita-feedback")) {
      return;
    }

    const data = new FormData(form);
    const payload = {
      mascotaId: String(data.get("mascotaId") || "").trim(),
      fecha: String(data.get("fecha") || "").trim(),
      hora: String(data.get("hora") || "").trim()
    };

    try {
      await window.VetWebAuth.postToApi("/veterinaria/citas", payload);
      form.reset();
      showPageFeedback("cita-feedback", "Tu solicitud fue enviada. Te confirmaremos por correo.");
    } catch (_error) {
      showPageFeedback("cita-feedback", "No pudimos registrar la cita ahora. Inténtalo más tarde.", true);
    }
  });
}

function bindReporteForm() {
  const form = document.getElementById("reporte-form");
  if (!form || !window.VetWebAuth) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!requireSession("reporte-feedback")) {
      return;
    }

    const data = new FormData(form);
    const payload = {
      descripcion: String(data.get("descripcion") || "").trim(),
      fotoUrl: String(data.get("fotoUrl") || "").trim() || null,
      ubicacion: {
        lat: Number(data.get("lat") || 0),
        lng: Number(data.get("lng") || 0)
      }
    };

    try {
      await window.VetWebAuth.postToApi("/rescate/reportes", payload);
      form.reset();
      showPageFeedback("reporte-feedback", "Gracias. Tu reporte fue enviado al equipo de rescate.");
    } catch (_error) {
      showPageFeedback("reporte-feedback", "No se pudo enviar el reporte. Inténtalo nuevamente.", true);
    }
  });
}

function bindDonacionForm() {
  const form = document.getElementById("donacion-form");
  if (!form || !window.VetWebAuth) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!requireSession("donacion-feedback")) {
      return;
    }

    const data = new FormData(form);
    const monto = Number(data.get("monto") || 0);

    try {
      await window.VetWebAuth.postToApi("/donaciones", {
        monto,
        metodoPago: "pasarela_web"
      });

      form.reset();
      showPageFeedback("donacion-feedback", "Gracias por tu aporte. Tu donación fue registrada.");
    } catch (_error) {
      showPageFeedback("donacion-feedback", "No pudimos procesar la donación en este momento.", true);
    }
  });
}

function bindApadrinamientoForm() {
  const form = document.getElementById("apadrinamiento-form");
  if (!form || !window.VetWebAuth) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!requireSession("apadrinamiento-feedback")) {
      return;
    }

    const data = new FormData(form);

    try {
      await window.VetWebAuth.postToApi("/donaciones/apadrinamientos", {
        animalId: String(data.get("animalId") || "").trim(),
        montoMensual: Number(data.get("montoMensual") || 0),
        metodoPago: "pasarela_web"
      });

      form.reset();
      showPageFeedback("apadrinamiento-feedback", "Tu apadrinamiento fue registrado con éxito.");
    } catch (_error) {
      showPageFeedback("apadrinamiento-feedback", "No pudimos completar el apadrinamiento ahora.", true);
    }
  });
}

function bindAdminView() {
  const guard = document.getElementById("admin-guard");
  const panel = document.getElementById("admin-panel");
  if (!guard || !panel || !window.VetWebAuth) {
    return;
  }

  const interval = setInterval(() => {
    const role = window.VetWebAuth.state.currentRole;
    const user = window.VetWebAuth.state.user;

    if (!user) {
      guard.textContent = "Inicia sesión con una cuenta administradora para ver este panel.";
      panel.classList.add("hidden");
      return;
    }

    if (role !== "administrador") {
      guard.textContent = "Tu cuenta no tiene permisos de administración.";
      panel.classList.add("hidden");
      return;
    }

    guard.classList.add("hidden");
    panel.classList.remove("hidden");
    clearInterval(interval);
  }, 700);
}

document.addEventListener("DOMContentLoaded", () => {
  bindCitaForm();
  bindReporteForm();
  bindDonacionForm();
  bindApadrinamientoForm();
  bindAdminView();
});
