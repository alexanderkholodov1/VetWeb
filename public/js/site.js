/* =========================================================
 * VetWeb · Site interactions
 * ========================================================= */

function bindMobileNav() {
  const toggle = document.getElementById("nav-toggle");
  const nav = document.querySelector(".main-nav");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
}

function bindAuthModal() {
  const modal = document.getElementById("auth-modal");
  const openButtons = document.querySelectorAll("[data-open-auth-modal], #open-auth-modal");
  const form = document.getElementById("auth-form");
  const logoutButton = document.getElementById("logout-button");

  if (!modal || !form || !window.VetWebAuth) return;

  let selectedAction = "login";
  const submitButton = form.querySelector("#auth-submit-button");
  const modeButtons = form.querySelectorAll("[data-auth-mode]");
  const rolePicker = form.querySelector("#role-picker");
  const titleEl = modal.querySelector("#auth-modal-title");
  const subtitleEl = modal.querySelector("#auth-modal-subtitle");

  const updateAuthModeUi = () => {
    modeButtons.forEach((button) => {
      const mode = button.dataset.authMode || "login";
      const isActive = mode === selectedAction;
      button.classList.toggle("btn-primary", isActive);
      button.classList.toggle("btn-soft", !isActive);
    });
    if (submitButton) {
      submitButton.textContent = selectedAction === "register" ? "Crear cuenta" : "Ingresar";
    }
    if (rolePicker) rolePicker.classList.toggle("show", selectedAction === "register");
    if (titleEl) titleEl.textContent = selectedAction === "register" ? "Crea tu cuenta" : "Ingresa a tu cuenta";
    if (subtitleEl) {
      subtitleEl.textContent = selectedAction === "register"
        ? "Selecciona el tipo de cuenta que mejor te describe."
        : "Bienvenido de nuevo. Continúa donde lo dejaste.";
    }
  };

  modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectedAction = button.dataset.authMode || "login";
      updateAuthModeUi();
      window.VetWebAuth.setFeedback("");
    });
  });
  updateAuthModeUi();

  function openModal() {
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    setTimeout(() => {
      const emailInput = form.querySelector("input[name='email']");
      if (emailInput) emailInput.focus();
    }, 60);
  }

  function closeModal() {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  openButtons.forEach((b) => b.addEventListener("click", (e) => { e.preventDefault(); openModal(); }));

  modal.querySelectorAll("[data-close-modal='true']").forEach((el) => {
    el.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.classList.contains("hidden")) closeModal();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");
    if (!email || !password) {
      window.VetWebAuth.setFeedback("Completa tu correo y contraseña.", true);
      return;
    }

    try {
      if (selectedAction === "register") {
        const requestedRole = String(data.get("rol") || "dueno");
        await window.VetWebAuth.registerWithEmail(email, password, requestedRole);
        window.VetWebAuth.setFeedback("Cuenta creada con éxito. Bienvenido.");
      } else {
        await window.VetWebAuth.loginWithEmail(email, password);
        window.VetWebAuth.setFeedback("Sesión iniciada correctamente.");
      }

      const role = await window.VetWebAuth.refreshCurrentRole();
      const portalPath = window.VetWebAuth.getPortalPathByRole(role);
      const goPortalButton = document.getElementById("go-portal-button");
      if (goPortalButton) goPortalButton.setAttribute("href", portalPath);
      setTimeout(closeModal, 350);
    } catch (error) {
      window.VetWebAuth.setFeedback(window.VetWebAuth.translateAuthError(error), true);
    }
  });

  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      try {
        await window.VetWebAuth.logoutUser();
        window.VetWebAuth.setFeedback("Sesión cerrada.");
        setTimeout(() => window.location.reload(), 400);
      } catch (_e) {
        window.VetWebAuth.setFeedback("No pudimos cerrar sesión.", true);
      }
    });
  }
}

function bindPublicCampaignList() {
  const list = document.getElementById("campaign-home-list");
  if (!list || !window.VetWebAuth) return;

  // Use whenReady so db is initialized
  window.VetWebAuth.whenReady().then(() => {
    if (!window.VetWebAuth.state.db) return;
    window.VetWebAuth.state.db
      .collection("campanas")
      .orderBy("fechaFin", "asc")
      .limit(4)
      .get()
      .then((snapshot) => {
        if (snapshot.empty) return;
        list.innerHTML = "";
        snapshot.forEach((doc) => {
          const data = doc.data();
          const item = document.createElement("li");
          const dt = data.fechaInicio?.toDate ? data.fechaInicio.toDate() : null;
          const day = dt ? dt.getDate() : "—";
          const month = dt ? dt.toLocaleDateString("es-EC", { month: "short" }).toUpperCase() : "";
          item.innerHTML = `
            <div class="date">${day}<small>${month}</small></div>
            <div>
              <strong>${data.titulo || "Campaña comunitaria"}</strong>
              <span>${data.descripcion || "Próximamente"}</span>
            </div>
            <a class="btn btn-soft btn-sm" href="eventos.html">Ver</a>
          `;
          list.appendChild(item);
        });
      })
      .catch(() => {});
  });
}

function bindPortalButton() {
  const portalButton = document.getElementById("go-portal-button");
  if (!portalButton || !window.VetWebAuth) return;

  portalButton.addEventListener("click", async (event) => {
    await window.VetWebAuth.whenReady();
    const role = window.VetWebAuth.state.currentRole;
    if (!window.VetWebAuth.state.user) {
      event.preventDefault();
      const openButton = document.getElementById("open-auth-modal");
      if (openButton) openButton.click();
      return;
    }
    portalButton.setAttribute("href", window.VetWebAuth.getPortalPathByRole(role));
  });
}

function bindAuthAwareUi() {
  if (!window.VetWebAuth) return;
  window.VetWebAuth.onAuthChanged((state) => {
    const portalButton = document.getElementById("go-portal-button");
    if (portalButton) {
      if (state.user) {
        portalButton.setAttribute("href", window.VetWebAuth.getPortalPathByRole(state.currentRole));
        portalButton.textContent = "Mi portal";
      } else {
        portalButton.setAttribute("href", "portal.html");
        portalButton.textContent = "Portal";
      }
    }

    // Toggle log-in / log-out buttons
    document.querySelectorAll("[data-auth-show='in']").forEach((el) => {
      el.classList.toggle("hidden", !state.user);
    });
    document.querySelectorAll("[data-auth-show='out']").forEach((el) => {
      el.classList.toggle("hidden", !!state.user);
    });
  });
}

function bindRevealOnScroll() {
  if (!("IntersectionObserver" in window)) return;
  const items = document.querySelectorAll("[data-reveal]");
  if (!items.length) return;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.setAttribute("data-animate", "");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  items.forEach((el) => io.observe(el));
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.VetWebAuth) window.VetWebAuth.initFirebaseClient();
  bindMobileNav();
  bindAuthModal();
  bindPublicCampaignList();
  bindPortalButton();
  bindAuthAwareUi();
  bindRevealOnScroll();
});
