/* =========================================================
 * VetWeb · Forms (escritura directa a Firestore)
 * Las reglas (functions/firestore.rules) ya autorizan al
 * cliente cuando coincide el campo de propietario y el rol.
 * ========================================================= */

function showPageFeedback(id, text, isError = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.classList.toggle("error", isError);
}

function rawRole() { return window.VetWebAuth?.state?.rawRole || ""; }
function nRole()   { return window.VetWebAuth?.state?.currentRole || null; }
function db()      { return window.VetWebAuth?.state?.db || null; }
function uid()     { return window.VetWebAuth?.state?.user?.uid || null; }

function requireSession(feedbackId) {
  if (!window.VetWebAuth?.state?.user) {
    showPageFeedback(feedbackId, "Necesitas iniciar sesión para continuar.", true);
    const openBtn = document.getElementById("open-auth-modal");
    if (openBtn) openBtn.click();
    return false;
  }
  return true;
}

function requireRawRole(allowedRoles, feedbackId) {
  if (!requireSession(feedbackId)) return false;
  const r = rawRole().toLowerCase();
  if (!allowedRoles.includes(r)) {
    showPageFeedback(
      feedbackId,
      `Esta acción requiere un rol distinto al actual (${r || "sin rol"}). ` +
      `Pide a un administrador que ajuste tu cuenta.`,
      true
    );
    return false;
  }
  return true;
}

const FieldValue = () => firebase.firestore.FieldValue;

/* ----------------------------- CITAS ----------------------------- */
function bindCitaForm() {
  const form = document.getElementById("cita-form");
  if (!form || !window.VetWebAuth) return;

  const mascotaSelect = document.getElementById("mascota-select");
  const fallbackInput = form.querySelector("input[name='mascotaId']");

  async function loadMyPets() {
    if (!uid() || !db() || !mascotaSelect) return;
    const snapshot = await db().collection("mascotas").where("duenioUid", "==", uid()).get();
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
    loadMyPets().catch(() => {});
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!requireRawRole(["dueno", "administrador"], "cita-feedback")) return;

    const data = new FormData(form);
    const selected = mascotaSelect ? String(mascotaSelect.value || "").trim() : "";
    const typed = String(data.get("mascotaId") || "").trim();
    const mascotaId = selected || typed;
    const fechaStr = String(data.get("fecha") || "").trim();
    const hora = String(data.get("hora") || "").trim();

    if (!mascotaId) {
      showPageFeedback("cita-feedback", "Selecciona o ingresa el ID de tu mascota.", true);
      return;
    }
    if (!fechaStr || !hora) {
      showPageFeedback("cita-feedback", "Indica fecha y hora para la cita.", true);
      return;
    }

    try {
      const fechaDate = new Date(`${fechaStr}T${hora}:00`);
      await db().collection("citas").add({
        duenioUid: uid(),
        mascotaId,
        fecha: firebase.firestore.Timestamp.fromDate(fechaDate),
        hora,
        estado: "pendiente",
        creadoEn: FieldValue().serverTimestamp()
      });
      form.reset();
      if (fallbackInput) fallbackInput.value = "";
      showPageFeedback("cita-feedback", "¡Listo! Tu solicitud fue registrada. Te confirmaremos por correo.");
    } catch (e) {
      console.error("[cita]", e);
      showPageFeedback("cita-feedback", "No pudimos registrar la cita ahora. Intenta más tarde.", true);
    }
  });
}

/* ----------------------------- REPORTES ----------------------------- */
function bindReporteForm() {
  const form = document.getElementById("reporte-form");
  if (!form || !window.VetWebAuth) return;

  const useMyLocation = document.getElementById("use-my-location");
  if (useMyLocation) {
    useMyLocation.addEventListener("click", () => {
      if (!navigator.geolocation) {
        showPageFeedback("reporte-feedback", "Tu navegador no soporta geolocalización.", true);
        return;
      }
      navigator.geolocation.getCurrentPosition((pos) => {
        form.querySelector("input[name='lat']").value = pos.coords.latitude.toFixed(6);
        form.querySelector("input[name='lng']").value = pos.coords.longitude.toFixed(6);
        showPageFeedback("reporte-feedback", "Ubicación capturada.");
      }, () => {
        showPageFeedback("reporte-feedback", "No pudimos obtener tu ubicación.", true);
      });
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!requireRawRole(["ciudadano", "dueno", "voluntario", "administrador"], "reporte-feedback")) return;

    const data = new FormData(form);
    const descripcion = String(data.get("descripcion") || "").trim();
    if (!descripcion) {
      showPageFeedback("reporte-feedback", "Describe brevemente el caso.", true);
      return;
    }

    try {
      await db().collection("reportes").add({
        reportadoPorUid: uid(),
        descripcion,
        fotoUrl: String(data.get("fotoUrl") || "").trim() || null,
        ubicacion: {
          lat: Number(data.get("lat") || 0),
          lng: Number(data.get("lng") || 0)
        },
        estado: "pendiente",
        creadoEn: FieldValue().serverTimestamp()
      });
      form.reset();
      showPageFeedback("reporte-feedback", "Gracias. Tu reporte fue enviado al equipo de rescate.");
    } catch (e) {
      console.error("[reporte]", e);
      showPageFeedback("reporte-feedback", "No se pudo enviar el reporte. Intenta nuevamente.", true);
    }
  });
}

/* ----------------------------- DONACIONES ----------------------------- */
function bindDonacionForm() {
  const form = document.getElementById("donacion-form");
  if (!form || !window.VetWebAuth) return;

  // Quick amount buttons
  form.querySelectorAll("[data-set-monto]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const monto = btn.dataset.setMonto;
      const input = form.querySelector("input[name='monto']");
      if (input) input.value = monto;
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!requireRawRole(["donante", "ciudadano", "dueno", "administrador"], "donacion-feedback")) return;

    const data = new FormData(form);
    const monto = Number(data.get("monto") || 0);
    if (!monto || monto < 1) {
      showPageFeedback("donacion-feedback", "Ingresa un monto válido en USD.", true);
      return;
    }

    try {
      await db().collection("donaciones").add({
        donorUid: uid(),
        monto,
        metodoPago: String(data.get("metodoPago") || "pasarela_web"),
        creadoEn: FieldValue().serverTimestamp()
      });
      form.reset();
      showPageFeedback("donacion-feedback", `Gracias por tu aporte de $${monto.toFixed(2)}. ¡Hace una gran diferencia!`);
    } catch (e) {
      console.error("[donacion]", e);
      showPageFeedback("donacion-feedback", "No pudimos procesar la donación en este momento.", true);
    }
  });
}

/* ----------------------------- APADRINAMIENTO ----------------------------- */
function bindApadrinamientoForm() {
  const form = document.getElementById("apadrinamiento-form");
  if (!form || !window.VetWebAuth) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!requireRawRole(["donante", "ciudadano", "dueno", "administrador"], "apadrinamiento-feedback")) return;

    const data = new FormData(form);
    const animalId = String(data.get("animalId") || "").trim();
    const montoMensual = Number(data.get("montoMensual") || 0);
    if (!animalId || !montoMensual) {
      showPageFeedback("apadrinamiento-feedback", "Completa el ID del animal y el monto mensual.", true);
      return;
    }

    try {
      await db().collection("apadrinamientos").add({
        padrinoUid: uid(),
        animalId,
        montoMensual,
        metodoPago: "pasarela_web",
        creadoEn: FieldValue().serverTimestamp()
      });
      form.reset();
      showPageFeedback("apadrinamiento-feedback", "Tu apadrinamiento fue registrado. ¡Gracias!");
    } catch (e) {
      console.error("[apadrinamiento]", e);
      showPageFeedback("apadrinamiento-feedback", "No pudimos completar el apadrinamiento ahora.", true);
    }
  });
}

/* ----------------------------- PORTAL CLIENTE ----------------------------- */
function bindClientPortal() {
  const wrapper = document.getElementById("client-portal-wrapper");
  if (!wrapper || !window.VetWebAuth) return;

  const guard = document.getElementById("client-portal-guard");
  const panel = document.getElementById("client-portal-panel");
  const petForm = document.getElementById("pet-form");
  const eventList = document.getElementById("event-list");
  const myPetsList = document.getElementById("my-pets-list");
  const myCitasList = document.getElementById("my-citas-list");
  const favoriteVetSelect = document.getElementById("favorite-vet-select");

  async function loadVeterinarios() {
    if (!favoriteVetSelect || !db()) return;
    const snapshot = await db().collection("veterinarios").orderBy("nombre", "asc").get();
    favoriteVetSelect.innerHTML = "<option value=''>Sin preferencia</option>";
    snapshot.forEach((doc) => {
      const data = doc.data();
      const option = document.createElement("option");
      option.value = doc.id;
      option.textContent = `${data.nombre || "Veterinario"} · ${data.especialidad || "General"}`;
      favoriteVetSelect.appendChild(option);
    });
    favoriteVetSelect.value = window.VetWebAuth.state.userProfile?.veterinarioFavoritoUid || "";
  }

  async function loadMyPets() {
    if (!myPetsList || !uid() || !db()) return;
    const snapshot = await db().collection("mascotas").where("duenioUid", "==", uid()).get();
    myPetsList.innerHTML = "";
    if (snapshot.empty) {
      myPetsList.innerHTML = "<li><span>Aún no registras mascotas.</span></li>";
      return;
    }
    snapshot.forEach((doc) => {
      const data = doc.data();
      const li = document.createElement("li");
      li.innerHTML = `<span><strong>${data.nombre || "Mascota"}</strong> · ${data.especie || ""} ${data.raza ? "· " + data.raza : ""}</span><span class="meta">${data.edad ? data.edad + " años" : ""}</span>`;
      myPetsList.appendChild(li);
    });
  }

  async function loadMyCitas() {
    if (!myCitasList || !uid() || !db()) return;
    const snapshot = await db().collection("citas").where("duenioUid", "==", uid()).limit(20).get();
    myCitasList.innerHTML = "";
    if (snapshot.empty) {
      myCitasList.innerHTML = "<li><span>No hay citas registradas todavía.</span></li>";
      return;
    }
    snapshot.forEach((doc) => {
      const data = doc.data();
      const fecha = data.fecha?.toDate ? data.fecha.toDate().toLocaleDateString("es-EC") : "Sin fecha";
      const li = document.createElement("li");
      li.innerHTML = `<span>${fecha} · ${data.hora || "--:--"}</span><span class="tag tone-${data.estado === "confirmada" ? "amber" : "gray"}">${data.estado || "pendiente"}</span>`;
      myCitasList.appendChild(li);
    });
  }

  async function loadEvents() {
    if (!eventList || !db()) return;
    const campaigns = await db().collection("campanas").orderBy("fechaFin", "asc").limit(10).get();
    eventList.innerHTML = "";
    if (campaigns.empty) {
      eventList.innerHTML = "<li><span>Pronto publicaremos nuevos eventos.</span></li>";
      return;
    }
    campaigns.forEach((doc) => {
      const data = doc.data();
      const li = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btn btn-soft btn-sm";
      button.textContent = "Inscribirme";
      button.addEventListener("click", async () => {
        try {
          await db().collection("inscripciones").add({
            campanaId: doc.id,
            usuarioUid: uid(),
            creadoEn: FieldValue().serverTimestamp()
          });
          showPageFeedback("client-portal-feedback", "¡Te inscribiste al evento!");
        } catch (_e) {
          showPageFeedback("client-portal-feedback", "No se pudo completar la inscripción.", true);
        }
      });
      li.innerHTML = `<strong>${data.titulo || "Campaña"}</strong><p class="muted" style="margin:0">${data.descripcion || "Actividad comunitaria"}</p>`;
      li.appendChild(button);
      eventList.appendChild(li);
    });
  }

  if (petForm) {
    petForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!requireRawRole(["dueno", "administrador"], "client-portal-feedback")) return;
      const data = new FormData(petForm);
      try {
        await db().collection("mascotas").add({
          duenioUid: uid(),
          nombre: String(data.get("nombre") || "").trim(),
          especie: String(data.get("especie") || "").trim(),
          raza: String(data.get("raza") || "").trim(),
          edad: Number(data.get("edad") || 0),
          fotoUrl: String(data.get("fotoUrl") || "").trim() || null,
          creadoEn: FieldValue().serverTimestamp()
        });
        petForm.reset();
        showPageFeedback("client-portal-feedback", "Perfil de mascota guardado.");
        await loadMyPets();
      } catch (e) {
        console.error("[mascota]", e);
        showPageFeedback("client-portal-feedback", "No se pudo guardar el perfil de mascota.", true);
      }
    });
  }

  if (favoriteVetSelect) {
    favoriteVetSelect.addEventListener("change", async () => {
      if (!requireSession("client-portal-feedback")) return;
      try {
        await window.VetWebAuth.updateMyProfile({
          veterinarioFavoritoUid: String(favoriteVetSelect.value || "")
        });
        showPageFeedback("client-portal-feedback", "Veterinario favorito actualizado.");
      } catch (_e) {
        showPageFeedback("client-portal-feedback", "No se pudo actualizar tu preferencia.", true);
      }
    });
  }

  window.VetWebAuth.onAuthChanged(async (state) => {
    if (!state.user) {
      if (guard) { guard.textContent = "Inicia sesión para ver tu portal de cliente."; guard.classList.remove("hidden"); }
      if (panel) panel.classList.add("hidden");
      return;
    }
    if (!["dueno", "ciudadano", "donante", "administrador"].includes(rawRole().toLowerCase())) {
      if (guard) { guard.textContent = "Tu cuenta no corresponde al portal de cliente. Usa el portal de staff."; guard.classList.remove("hidden"); }
      if (panel) panel.classList.add("hidden");
      return;
    }
    if (guard) guard.classList.add("hidden");
    if (panel) panel.classList.remove("hidden");
    await Promise.all([loadVeterinarios(), loadMyPets(), loadMyCitas(), loadEvents()]);
  });
}

/* ----------------------------- PORTAL STAFF ----------------------------- */
function bindStaffPortal() {
  const wrapper = document.getElementById("staff-portal-wrapper");
  if (!wrapper || !window.VetWebAuth) return;

  const guard = document.getElementById("staff-portal-guard");
  const panel = document.getElementById("staff-portal-panel");
  const citasList = document.getElementById("staff-citas-list");
  const clientesList = document.getElementById("staff-clientes-list");
  const disponibilidadForm = document.getElementById("staff-disponibilidad-form");
  const suministroForm = document.getElementById("staff-suministro-form");
  const ubicacionForm = document.getElementById("staff-ubicacion-form");

  async function loadStaffData() {
    if (!db() || !uid()) return;

    if (citasList) {
      const citas = await db().collection("citas").orderBy("fecha", "asc").limit(30).get();
      citasList.innerHTML = "";
      if (citas.empty) {
        citasList.innerHTML = "<li><span>No hay citas próximas.</span></li>";
      } else {
        citas.forEach((doc) => {
          const data = doc.data();
          const fecha = data.fecha?.toDate ? data.fecha.toDate().toLocaleDateString("es-EC") : "Sin fecha";
          const li = document.createElement("li");
          li.innerHTML = `<span>${fecha} · ${data.hora || "--:--"}</span><span class="tag tone-gray">${data.estado || "pendiente"}</span>`;
          citasList.appendChild(li);
        });
      }
    }

    if (clientesList) {
      const mascotas = await db().collection("mascotas").orderBy("creadoEn", "desc").limit(25).get();
      clientesList.innerHTML = "";
      if (mascotas.empty) {
        clientesList.innerHTML = "<li><span>Aún no hay mascotas registradas.</span></li>";
      } else {
        mascotas.forEach((doc) => {
          const data = doc.data();
          const li = document.createElement("li");
          li.innerHTML = `<span><strong>${data.nombre || "Mascota"}</strong> · ${data.especie || ""}</span><span class="meta">UID ${(data.duenioUid || "").slice(0, 8)}…</span>`;
          clientesList.appendChild(li);
        });
      }
    }
  }

  if (disponibilidadForm) {
    disponibilidadForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!requireRawRole(["voluntario", "veterinario", "administrador"], "staff-feedback")) return;
      const data = new FormData(disponibilidadForm);
      try {
        await db().collection("disponibilidadStaff").add({
          staffUid: uid(),
          fecha: String(data.get("fecha") || "").trim(),
          desde: String(data.get("desde") || "").trim(),
          hasta: String(data.get("hasta") || "").trim(),
          estado: String(data.get("estado") || "libre"),
          creadoEn: FieldValue().serverTimestamp()
        });
        disponibilidadForm.reset();
        showPageFeedback("staff-feedback", "Disponibilidad guardada.");
      } catch (e) {
        console.error("[disponibilidad]", e);
        showPageFeedback("staff-feedback", "No se pudo registrar tu disponibilidad.", true);
      }
    });
  }

  if (suministroForm) {
    suministroForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!requireRawRole(["voluntario", "veterinario", "administrador"], "staff-feedback")) return;
      const data = new FormData(suministroForm);
      try {
        await db().collection("solicitudesSuministro").add({
          solicitanteUid: uid(),
          item: String(data.get("item") || "").trim(),
          cantidad: Number(data.get("cantidad") || 0),
          detalle: String(data.get("detalle") || "").trim(),
          estado: "pendiente",
          creadoEn: FieldValue().serverTimestamp()
        });
        suministroForm.reset();
        showPageFeedback("staff-feedback", "Solicitud enviada al administrador.");
      } catch (e) {
        console.error("[suministro]", e);
        showPageFeedback("staff-feedback", "No se pudo enviar la solicitud de suministros.", true);
      }
    });
  }

  if (ubicacionForm) {
    ubicacionForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!requireRawRole(["veterinario", "administrador"], "staff-feedback")) return;
      const data = new FormData(ubicacionForm);
      try {
        await db().collection("ubicacionesVeterinarias").doc(uid()).set({
          veterinarioUid: uid(),
          nombreConsultorio: String(data.get("consultorio") || "").trim(),
          lat: Number(data.get("lat") || 0),
          lng: Number(data.get("lng") || 0),
          actualizadoEn: FieldValue().serverTimestamp()
        });
        showPageFeedback("staff-feedback", "Ubicación actualizada para tus clientes.");
      } catch (e) {
        console.error("[ubicacion]", e);
        showPageFeedback("staff-feedback", "No se pudo guardar la ubicación.", true);
      }
    });
  }

  window.VetWebAuth.onAuthChanged(async (state) => {
    if (!state.user) {
      if (guard) { guard.textContent = "Inicia sesión para acceder al portal de staff."; guard.classList.remove("hidden"); }
      if (panel) panel.classList.add("hidden");
      return;
    }
    if (!["voluntario", "veterinario", "administrador"].includes(rawRole().toLowerCase())) {
      if (guard) { guard.textContent = "Tu cuenta no tiene permisos para el portal de staff."; guard.classList.remove("hidden"); }
      if (panel) panel.classList.add("hidden");
      return;
    }
    if (guard) guard.classList.add("hidden");
    if (panel) panel.classList.remove("hidden");
    try { await loadStaffData(); } catch (_e) {}
  });
}

/* ----------------------------- ADMIN ----------------------------- */
function bindAdminView() {
  const guard = document.getElementById("admin-guard");
  const panel = document.getElementById("admin-panel");
  if (!guard || !panel || !window.VetWebAuth) return;

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
    if (!db()) return;
    try {
      const [usuarios, mascotas, citas, reportes, donaciones, solicitudes] = await Promise.all([
        db().collection("usuarios").get(),
        db().collection("mascotas").get(),
        db().collection("citas").get(),
        db().collection("reportes").get(),
        db().collection("donaciones").get(),
        db().collection("solicitudesSuministro").get()
      ]);
      if (metrics.usuarios) metrics.usuarios.textContent = String(usuarios.size);
      if (metrics.mascotas) metrics.mascotas.textContent = String(mascotas.size);
      if (metrics.citas) metrics.citas.textContent = String(citas.size);
      if (metrics.reportes) metrics.reportes.textContent = String(reportes.size);
      if (metrics.donaciones) metrics.donaciones.textContent = String(donaciones.size);
      if (metrics.solicitudes) metrics.solicitudes.textContent = String(solicitudes.size);
      if (logList) {
        logList.innerHTML = "";
        if (reportes.empty) {
          logList.innerHTML = "<li><span>No hay reportes recientes.</span></li>";
        } else {
          reportes.docs.slice(0, 8).forEach((doc) => {
            const data = doc.data();
            const li = document.createElement("li");
            li.innerHTML = `<span>📍 ${data.descripcion ? data.descripcion.slice(0, 80) : "Sin descripción"}</span><span class="tag tone-gray">${data.estado || "pendiente"}</span>`;
            logList.appendChild(li);
          });
        }
      }
    } catch (e) {
      console.error("[admin-summary]", e);
    }
  }

  if (rolesForm) {
    rolesForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!requireRawRole(["administrador"], "admin-feedback")) return;
      const data = new FormData(rolesForm);
      const targetUid = String(data.get("uid") || "").trim();
      const rol = String(data.get("rol") || "").trim().toLowerCase();
      if (!targetUid || !rol) {
        showPageFeedback("admin-feedback", "Completa UID y rol.", true);
        return;
      }
      if (!window.VetWebAuth.ALL_ROLES.includes(rol)) {
        showPageFeedback("admin-feedback", "Rol no válido.", true);
        return;
      }
      try {
        await db().collection("usuarios").doc(targetUid).update({ rol });
        showPageFeedback("admin-feedback", "Rol actualizado correctamente.");
        rolesForm.reset();
        await loadAdminSummary();
      } catch (e) {
        console.error("[admin-role]", e);
        showPageFeedback("admin-feedback", "No se pudo actualizar el rol. Verifica el UID.", true);
      }
    });
  }

  window.VetWebAuth.onAuthChanged(async (state) => {
    if (!state.user) {
      guard.textContent = "Inicia sesión con una cuenta administradora para ver este panel.";
      panel.classList.add("hidden");
      guard.classList.remove("hidden");
      return;
    }
    if (rawRole().toLowerCase() !== "administrador") {
      guard.textContent = "Tu cuenta no tiene permisos de administración.";
      panel.classList.add("hidden");
      guard.classList.remove("hidden");
      return;
    }
    guard.classList.add("hidden");
    panel.classList.remove("hidden");
    await loadAdminSummary();
  });
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
