function bindAuthModal() {
  const modal = document.getElementById("auth-modal");
  const openButton = document.getElementById("open-auth-modal");
  const form = document.getElementById("auth-form");
  const logoutButton = document.getElementById("logout-button");

  if (!modal || !openButton || !form || !window.VetWebAuth) {
    return;
  }

  function openModal() {
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
  }

  openButton.addEventListener("click", openModal);

  modal.querySelectorAll("[data-close-modal='true']").forEach((el) => {
    el.addEventListener("click", closeModal);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitter = event.submitter;
    const action = submitter ? submitter.dataset.authAction : "login";
    const data = new FormData(form);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");
    const role = String(data.get("rolRegistro") || "ciudadano");

    if (!email || !password) {
      window.VetWebAuth.setFeedback("Completa tu correo y contraseña.", true);
      return;
    }

    try {
      if (action === "register") {
        await window.VetWebAuth.registerWithEmail(email, password, role);
        window.VetWebAuth.setFeedback("Tu cuenta fue creada con éxito.");
      } else {
        await window.VetWebAuth.loginWithEmail(email, password);
        window.VetWebAuth.setFeedback("Bienvenido. Sesión iniciada.");
      }
    } catch (_error) {
      window.VetWebAuth.setFeedback("No pudimos iniciar sesión. Verifica tus datos.", true);
    }
  });

  if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
      await window.VetWebAuth.logoutUser();
      window.VetWebAuth.setFeedback("Sesión cerrada.");
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

document.addEventListener("DOMContentLoaded", () => {
  if (window.VetWebAuth) {
    window.VetWebAuth.initFirebaseClient();
  }

  bindAuthModal();
  bindPublicCampaignList();
});
