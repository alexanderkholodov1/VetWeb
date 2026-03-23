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
    showPageFeedback(feedbackId, "Necesitas iniciar sesion para realizar esta accion.", true);
    return false;
  }
  return true;
}

function normalizeRole(role) {
  const value = String(role || "").toLowerCase();

  if (value === "admin" || value === "administrador") {
    return "admin";
  }

  if (value === "staff" || value === "veterinario" || value === "voluntario") {
    return "staff";
  }

  return "user";
}

function hasAnyRole(role, allowedRoles) {
  const normalizedRole = normalizeRole(role);
  const normalizedAllowed = allowedRoles.map((item) => normalizeRole(item));
  return normalizedAllowed.includes(normalizedRole);
}

function requireRole(allowedRoles, feedbackId) {
  if (!requireSession(feedbackId)) {
    return false;
  }

  const role = window.VetWebAuth?.state?.currentRole;
  if (!hasAnyRole(role, allowedRoles)) {
    showPageFeedback(feedbackId, "Tu tipo de cuenta no tiene permiso para esta accion.", true);
    return false;
  }
  return true;
}

function bindCitaForm() {
  const form = document.getElementById("cita-form");
  if (!form || !window.VetWebAuth) {
    return;
  }

  const mascotaSelect = document.getElementById("mascota-select");
  const fallbackMascotaInput = form.querySelector("input[name='mascotaId']");

  async function loadMyPets() {
    if (!window.VetWebAuth.state.user || !window.VetWebAuth.state.db || !mascotaSelect) {
      return;
    }

    const snapshot = await window.VetWebAuth.state.db
      .collection("mascotas")
      .where("duenioUid", "==", window.VetWebAuth.state.user.uid)
      .get();

    mascotaSelect.innerHTML = "<option value=''>Selecciona una mascota</option>";
    snapshot.forEach((doc) => {
      const data = doc.data();
      const option = document.createElement("option");
      option.value = doc.id;
      option.textContent = `${data.nombre || "Mascota"} · ${data.especie || ""}`;
      mascotaSelect.appendChild(option);
    });
  }

  window.VetWebAuth.onAuthChanged(() => {
    loadMyPets().catch(() => {
      showPageFeedback("cita-feedback", "No pudimos cargar tus mascotas en este momento.", true);
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!requireRole(["user", "admin"], "cita-feedback")) {
      return;
    }

    const data = new FormData(form);
    const selectedMascotaId = mascotaSelect ? String(mascotaSelect.value || "").trim() : "";
    const typedMascotaId = String(data.get("mascotaId") || "").trim();
    const payload = {
      mascotaId: selectedMascotaId || typedMascotaId,
      fecha: String(data.get("fecha") || "").trim(),
      hora: String(data.get("hora") || "").trim()
    };

    if (!payload.mascotaId) {
      showPageFeedback("cita-feedback", "Selecciona una mascota antes de continuar.", true);
      return;
    }

    try {
      await window.VetWebAuth.postToApi("/veterinaria/citas", payload);
      form.reset();
      if (fallbackMascotaInput && mascotaSelect) {
        fallbackMascotaInput.value = "";
      }
      showPageFeedback("cita-feedback", "Tu solicitud fue enviada. Te confirmaremos por correo.");
    } catch (_error) {
      showPageFeedback("cita-feedback", "No pudimos registrar la cita ahora. Intentalo mas tarde.", true);
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
      showPageFeedback("reporte-feedback", "No se pudo enviar el reporte. Intentalo nuevamente.", true);
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

function bindClientPortal() {
  const wrapper = document.getElementById("client-portal-wrapper");
  if (!wrapper || !window.VetWebAuth) {
    return;
  }

  const guard = document.getElementById("client-portal-guard");
  const panel = document.getElementById("client-portal-panel");
  const petForm = document.getElementById("pet-form");
  const eventList = document.getElementById("event-list");
  const myPetsList = document.getElementById("my-pets-list");
  const myCitasList = document.getElementById("my-citas-list");
  const favoriteVetSelect = document.getElementById("favorite-vet-select");

  async function loadVeterinarios() {
    if (!favoriteVetSelect || !window.VetWebAuth.state.db) {
      return;
    }
    const snapshot = await window.VetWebAuth.state.db.collection("veterinarios").orderBy("nombre", "asc").get();
    favoriteVetSelect.innerHTML = "<option value=''>Sin preferencia</option>";
    snapshot.forEach((doc) => {
      const data = doc.data();
      const option = document.createElement("option");
      option.value = doc.id;
      option.textContent = `${data.nombre || "Veterinario"} · ${data.especialidad || "General"}`;
      favoriteVetSelect.appendChild(option);
    });

    const favoriteVet = window.VetWebAuth.state.userProfile?.veterinarioFavoritoUid || "";
    favoriteVetSelect.value = favoriteVet;
  }

  async function loadMyPets() {
    if (!myPetsList || !window.VetWebAuth.state.user || !window.VetWebAuth.state.db) {
      return;
    }
    const snapshot = await window.VetWebAuth.state.db
      .collection("mascotas")
      .where("duenioUid", "==", window.VetWebAuth.state.user.uid)
      .get();

    myPetsList.innerHTML = "";
    if (snapshot.empty) {
      myPetsList.innerHTML = "<li>Aun no registras mascotas.</li>";
      return;
    }

    snapshot.forEach((doc) => {
      const data = doc.data();
      const item = document.createElement("li");
      item.textContent = `${data.nombre || "Mascota"} · ${data.especie || ""} · ${data.raza || ""}`;
      myPetsList.appendChild(item);
    });
  }

  async function loadMyCitas() {
    if (!myCitasList || !window.VetWebAuth.state.user || !window.VetWebAuth.state.db) {
      return;
    }

    const snapshot = await window.VetWebAuth.state.db
      .collection("citas")
      .where("duenioUid", "==", window.VetWebAuth.state.user.uid)
      .limit(20)
      .get();

    myCitasList.innerHTML = "";
    if (snapshot.empty) {
      myCitasList.innerHTML = "<li>No hay citas registradas todavia.</li>";
      return;
    }

    snapshot.forEach((doc) => {
      const data = doc.data();
      const fecha = data.fecha?.toDate ? data.fecha.toDate().toLocaleDateString("es-EC") : "Sin fecha";
      const item = document.createElement("li");
      item.textContent = `${fecha} · ${data.hora || "--:--"} · Estado: ${data.estado || "pendiente"}`;
      myCitasList.appendChild(item);
    });
  }

  async function loadEvents() {
    if (!eventList || !window.VetWebAuth.state.db || !window.VetWebAuth.state.user) {
      return;
    }

    const campaigns = await window.VetWebAuth.state.db.collection("campanas").orderBy("fechaFin", "asc").limit(10).get();
    eventList.innerHTML = "";

    if (campaigns.empty) {
      eventList.innerHTML = "<li>Pronto publicaremos nuevos eventos.</li>";
      return;
    }

    campaigns.forEach((doc) => {
      const data = doc.data();
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-soft";
      button.textContent = "Inscribirme";
      button.addEventListener("click", async () => {
        try {
          await window.VetWebAuth.state.db.collection("inscripciones").add({
            campanaId: doc.id,
            usuarioUid: window.VetWebAuth.state.user.uid,
            creadoEn: firebase.firestore.FieldValue.serverTimestamp()
          });
          showPageFeedback("client-portal-feedback", "Te inscribiste al evento exitosamente.");
        } catch (_error) {
          showPageFeedback("client-portal-feedback", "No se pudo completar la inscripcion.", true);
        }
      });

      item.innerHTML = `<strong>${data.titulo || "Campana"}</strong><p>${data.descripcion || "Actividad comunitaria"}</p>`;
      item.appendChild(button);
      eventList.appendChild(item);
    });
  }

  if (petForm) {
    petForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!requireRole(["user", "admin"], "client-portal-feedback")) {
        return;
      }

      const data = new FormData(petForm);
      const payload = {
        nombre: String(data.get("nombre") || "").trim(),
        especie: String(data.get("especie") || "").trim(),
        raza: String(data.get("raza") || "").trim(),
        edad: Number(data.get("edad") || 0),
        fotoUrl: String(data.get("fotoUrl") || "").trim() || null
      };

      try {
        await window.VetWebAuth.postToApi("/veterinaria/mascotas", payload);
        petForm.reset();
        showPageFeedback("client-portal-feedback", "Perfil de mascota guardado.");
        await loadMyPets();
      } catch (_error) {
        showPageFeedback("client-portal-feedback", "No se pudo guardar el perfil de mascota.", true);
      }
    });
  }

  if (favoriteVetSelect) {
    favoriteVetSelect.addEventListener("change", async () => {
      if (!requireSession("client-portal-feedback")) {
        return;
      }

      try {
        await window.VetWebAuth.updateMyProfile({
          veterinarioFavoritoUid: String(favoriteVetSelect.value || "")
        });
        showPageFeedback("client-portal-feedback", "Veterinario favorito actualizado.");
      } catch (_error) {
        showPageFeedback("client-portal-feedback", "No se pudo actualizar tu preferencia.", true);
      }
    });
  }

  window.VetWebAuth.onAuthChanged(async () => {
    const user = window.VetWebAuth.state.user;
    const role = window.VetWebAuth.state.currentRole;

    if (!user) {
      if (guard) {
        guard.textContent = "Inicia sesion para ver tu portal de cliente.";
        guard.classList.remove("hidden");
      }
      if (panel) {
        panel.classList.add("hidden");
      }
      return;
    }

    if (!hasAnyRole(role, ["user", "admin"])) {
      if (guard) {
        guard.textContent = "Tu cuenta no corresponde al portal de cliente. Usa tu portal de staff.";
        guard.classList.remove("hidden");
      }
      if (panel) {
        panel.classList.add("hidden");
      }
      return;
    }

    if (guard) {
      guard.classList.add("hidden");
    }
    if (panel) {
      panel.classList.remove("hidden");
    }

    await Promise.all([loadVeterinarios(), loadMyPets(), loadMyCitas(), loadEvents()]);
  });
}

function bindStaffPortal() {
  const wrapper = document.getElementById("staff-portal-wrapper");
  if (!wrapper || !window.VetWebAuth) {
    return;
  }

  const guard = document.getElementById("staff-portal-guard");
  const panel = document.getElementById("staff-portal-panel");
  const citasList = document.getElementById("staff-citas-list");
  const clientesList = document.getElementById("staff-clientes-list");
  const disponibilidadForm = document.getElementById("staff-disponibilidad-form");
  const suministroForm = document.getElementById("staff-suministro-form");
  const ubicacionForm = document.getElementById("staff-ubicacion-form");

  async function loadStaffData() {
    const db = window.VetWebAuth.state.db;
    const user = window.VetWebAuth.state.user;
    if (!db || !user) {
      return;
    }

    if (citasList) {
      const citas = await db.collection("citas").orderBy("fecha", "asc").limit(30).get();
      citasList.innerHTML = "";
      citas.forEach((doc) => {
        const data = doc.data();
        const fecha = data.fecha?.toDate ? data.fecha.toDate().toLocaleDateString("es-EC") : "Sin fecha";
        const li = document.createElement("li");
        li.textContent = `${fecha} · ${data.hora || "--:--"} · Duenio: ${data.duenioUid || "-"} · ${data.estado || "pendiente"}`;
        citasList.appendChild(li);
      });
    }

    if (clientesList) {
      const mascotas = await db.collection("mascotas").orderBy("creadoEn", "desc").limit(25).get();
      clientesList.innerHTML = "";
      mascotas.forEach((doc) => {
        const data = doc.data();
        const li = document.createElement("li");
        li.textContent = `${data.nombre || "Mascota"} · ${data.especie || ""} · Cliente UID: ${data.duenioUid || "-"}`;
        clientesList.appendChild(li);
      });
    }
  }

  if (disponibilidadForm) {
    disponibilidadForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!requireRole(["staff", "admin"], "staff-feedback")) {
        return;
      }

      const data = new FormData(disponibilidadForm);
      try {
        await window.VetWebAuth.state.db.collection("disponibilidadStaff").add({
          staffUid: window.VetWebAuth.state.user.uid,
          fecha: String(data.get("fecha") || "").trim(),
          desde: String(data.get("desde") || "").trim(),
          hasta: String(data.get("hasta") || "").trim(),
          estado: String(data.get("estado") || "libre"),
          creadoEn: firebase.firestore.FieldValue.serverTimestamp()
        });
        disponibilidadForm.reset();
        showPageFeedback("staff-feedback", "Disponibilidad guardada.");
      } catch (_error) {
        showPageFeedback("staff-feedback", "No se pudo registrar tu disponibilidad.", true);
      }
    });
  }

  if (suministroForm) {
    suministroForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!requireRole(["staff", "admin"], "staff-feedback")) {
        return;
      }

      const data = new FormData(suministroForm);
      try {
        await window.VetWebAuth.state.db.collection("solicitudesSuministro").add({
          solicitanteUid: window.VetWebAuth.state.user.uid,
          item: String(data.get("item") || "").trim(),
          cantidad: Number(data.get("cantidad") || 0),
          detalle: String(data.get("detalle") || "").trim(),
          estado: "pendiente",
          creadoEn: firebase.firestore.FieldValue.serverTimestamp()
        });
        suministroForm.reset();
        showPageFeedback("staff-feedback", "Solicitud enviada al administrador.");
      } catch (_error) {
        showPageFeedback("staff-feedback", "No se pudo enviar la solicitud de suministros.", true);
      }
    });
  }

  if (ubicacionForm) {
    ubicacionForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!requireRole(["staff", "admin"], "staff-feedback")) {
        return;
      }

      const data = new FormData(ubicacionForm);
      try {
        await window.VetWebAuth.state.db.collection("ubicacionesVeterinarias").doc(window.VetWebAuth.state.user.uid).set({
          veterinarioUid: window.VetWebAuth.state.user.uid,
          nombreConsultorio: String(data.get("consultorio") || "").trim(),
          lat: Number(data.get("lat") || 0),
          lng: Number(data.get("lng") || 0),
          actualizadoEn: firebase.firestore.FieldValue.serverTimestamp()
        });
        showPageFeedback("staff-feedback", "Ubicacion actualizada para tus clientes.");
      } catch (_error) {
        showPageFeedback("staff-feedback", "No se pudo guardar la ubicacion.", true);
      }
    });
  }

  window.VetWebAuth.onAuthChanged(async () => {
    const user = window.VetWebAuth.state.user;
    const role = window.VetWebAuth.state.currentRole;
    if (!user) {
      if (guard) {
        guard.textContent = "Inicia sesion para acceder al portal de staff.";
        guard.classList.remove("hidden");
      }
      if (panel) {
        panel.classList.add("hidden");
      }
      return;
    }

    if (!hasAnyRole(role, ["staff", "admin"])) {
      if (guard) {
        guard.textContent = "Tu cuenta no tiene permisos para el portal de staff.";
        guard.classList.remove("hidden");
      }
      if (panel) {
        panel.classList.add("hidden");
      }
      return;
    }

    if (guard) {
      guard.classList.add("hidden");
    }
    if (panel) {
      panel.classList.remove("hidden");
    }

    await loadStaffData();
  });
}

function bindAdminView() {
  const guard = document.getElementById("admin-guard");
  const panel = document.getElementById("admin-panel");
  if (!guard || !panel || !window.VetWebAuth) {
    return;
  }

  const metrics = {
    usuarios: document.getElementById("metric-usuarios"),
    mascotas: document.getElementById("metric-mascotas"),
    citas: document.getElementById("metric-citas"),
    reportes: document.getElementById("metric-reportes"),
    donaciones: document.getElementById("metric-donaciones"),
    solicitudes: document.getElementById("metric-solicitudes")
  };

  const rolesForm = document.getElementById("admin-role-form");
  const logList = document.getElementById("admin-log-list");

  async function loadAdminSummary() {
    const db = window.VetWebAuth.state.db;
    if (!db) {
      return;
    }

    const [usuarios, mascotas, citas, reportes, donaciones, solicitudes] = await Promise.all([
      db.collection("usuarios").get(),
      db.collection("mascotas").get(),
      db.collection("citas").get(),
      db.collection("reportes").get(),
      db.collection("donaciones").get(),
      db.collection("solicitudesSuministro").get()
    ]);

    if (metrics.usuarios) metrics.usuarios.textContent = String(usuarios.size);
    if (metrics.mascotas) metrics.mascotas.textContent = String(mascotas.size);
    if (metrics.citas) metrics.citas.textContent = String(citas.size);
    if (metrics.reportes) metrics.reportes.textContent = String(reportes.size);
    if (metrics.donaciones) metrics.donaciones.textContent = String(donaciones.size);
    if (metrics.solicitudes) metrics.solicitudes.textContent = String(solicitudes.size);

    if (logList) {
      logList.innerHTML = "";
      reportes.docs.slice(0, 6).forEach((doc) => {
        const data = doc.data();
        const li = document.createElement("li");
        li.textContent = `Reporte ${doc.id} · ${data.estado || "pendiente"} · ${data.descripcion || "Sin descripcion"}`;
        logList.appendChild(li);
      });
    }
  }

  if (rolesForm) {
    rolesForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!requireRole(["admin"], "admin-feedback")) {
        return;
      }

      const data = new FormData(rolesForm);
      const uid = String(data.get("uid") || "").trim();
      const rol = String(data.get("rol") || "").trim();
      if (!uid || !rol) {
        showPageFeedback("admin-feedback", "Completa UID y rol.", true);
        return;
      }

      try {
        await window.VetWebAuth.postToApi(`/admin/usuarios/${uid}/rol`, { rol }, "PATCH");
        showPageFeedback("admin-feedback", "Rol actualizado correctamente.");
        rolesForm.reset();
        await loadAdminSummary();
      } catch (_error) {
        showPageFeedback("admin-feedback", "No se pudo actualizar el rol.", true);
      }
    });
  }

  const interval = setInterval(async () => {
    const role = window.VetWebAuth.state.currentRole;
    const user = window.VetWebAuth.state.user;

    if (!user) {
      guard.textContent = "Inicia sesion con una cuenta administradora para ver este panel.";
      panel.classList.add("hidden");
      return;
    }

    if (!hasAnyRole(role, ["admin"])) {
      guard.textContent = "Tu cuenta no tiene permisos de administracion.";
      panel.classList.add("hidden");
      return;
    }

    guard.classList.add("hidden");
    panel.classList.remove("hidden");
    await loadAdminSummary();
    clearInterval(interval);
  }, 700);
}

document.addEventListener("DOMContentLoaded", () => {
  bindCitaForm();
  bindReporteForm();
  bindDonacionForm();
  bindApadrinamientoForm();
  bindClientPortal();
  bindStaffPortal();
  bindAdminView();
});
