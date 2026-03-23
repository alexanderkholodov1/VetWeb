function bindAuthModal() {
  const modal = document.getElementById("auth-modal");
  const openButton = document.getElementById("open-auth-modal");
  const form = document.getElementById("auth-form");
  const logoutButton = document.getElementById("logout-button");

  if (!modal || !openButton || !form || !window.VetWebAuth) {
    return;
  }

  let selectedAction = "login";
  form.querySelectorAll("[data-auth-action]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedAction = button.dataset.authAction || "login";
    });
  });

  function openModal() {
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    const emailInput = form.querySelector("input[name='email']");
    if (emailInput) {
      emailInput.focus();
    }
  }

  function closeModal() {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  }

  openButton.addEventListener("click", openModal);

  modal.querySelectorAll("[data-close-modal='true']").forEach((el) => {
    el.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.classList.contains("hidden")) {
      closeModal();
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");
    const role = String(data.get("rolRegistro") || "ciudadano");

    if (!email || !password) {
      window.VetWebAuth.setFeedback("Completa tu correo y contrasena.", true);
      return;
    }

    try {
      if (selectedAction === "register") {
        await window.VetWebAuth.registerWithEmail(email, password, role);
        window.VetWebAuth.setFeedback("Tu cuenta fue creada con exito.");
      } else {
        await window.VetWebAuth.loginWithEmail(email, password);
        window.VetWebAuth.setFeedback("Sesion iniciada correctamente.");
      }

      const roleAfterAuth = await window.VetWebAuth.refreshCurrentRole();
      const portalPath = window.VetWebAuth.getPortalPathByRole(roleAfterAuth);
      const goPortalButton = document.getElementById("go-portal-button");
      if (goPortalButton) {
        goPortalButton.setAttribute("href", portalPath);
      }
      closeModal();
    } catch (error) {
      window.VetWebAuth.setFeedback(window.VetWebAuth.translateAuthError(error), true);
    }
  });

  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      await window.VetWebAuth.logoutUser();
      window.VetWebAuth.setFeedback("Sesion cerrada.");
    });
  }
}

function bindPublicCampaignList() {
  const list = document.getElementById("campaign-home-list");
  if (!list || !window.VetWebAuth?.state?.db) {
    return;
  }

  window.VetWebAuth.state.db
    .collection("campanas")
    .orderBy("fechaFin", "asc")
    .limit(3)
    .get()
    .then((snapshot) => {
      if (snapshot.empty) {
        return;
      }

      list.innerHTML = "";
      snapshot.forEach((doc) => {
        const item = document.createElement("li");
        const data = doc.data();
        item.innerHTML = `<strong>${data.titulo || "Campaña comunitaria"}</strong><span>${data.descripcion || "Próximamente"}</span>`;
        list.appendChild(item);
      });
    })
    .catch(() => {
      // Silent fallback for public users.
    });
}

function bindPortalButton() {
  const portalButton = document.getElementById("go-portal-button");
  if (!portalButton || !window.VetWebAuth) {
    return;
  }

  portalButton.addEventListener("click", async (event) => {
    await window.VetWebAuth.whenReady();
    const role = window.VetWebAuth.state.currentRole;
    if (!window.VetWebAuth.state.user) {
      event.preventDefault();
      const openButton = document.getElementById("open-auth-modal");
      if (openButton) {
        openButton.click();
      }
      return;
    }

    portalButton.setAttribute("href", window.VetWebAuth.getPortalPathByRole(role));
  });
}

function bindAuthAwareActions() {
  if (!window.VetWebAuth) {
    return;
  }

  window.VetWebAuth.onAuthChanged((state) => {
    const portalButton = document.getElementById("go-portal-button");
    if (portalButton && state.user) {
      portalButton.setAttribute("href", window.VetWebAuth.getPortalPathByRole(state.currentRole));
      portalButton.textContent = "Mi portal";
    }

    if (portalButton && !state.user) {
      portalButton.setAttribute("href", "portal.html");
      portalButton.textContent = "Portal";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.VetWebAuth) {
    window.VetWebAuth.initFirebaseClient();
  }

  bindAuthModal();
  bindPublicCampaignList();
  bindPortalButton();
  bindAuthAwareActions();
});
