const DEFAULT_API_BASE = "https://southamerica-east1-vetweb-917b9.cloudfunctions.net/api";
const allowedPublicRoles = ["user", "staff", "admin", "ciudadano", "dueno", "voluntario", "donante", "veterinario", "administrador"];

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

const appState = {
  auth: null,
  db: null,
  user: null,
  userProfile: null,
  apiBase: DEFAULT_API_BASE,
  currentRole: null,
  initialized: false
};

const authSubscribers = [];
let initPromise = null;
let authReadyResolver = null;
const authReady = new Promise((resolve) => {
  authReadyResolver = resolve;
});

function isLocalHost() {
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

function getApiBase() {
  if (isLocalHost()) {
    return "http://127.0.0.1:5001/vetweb-917b9/southamerica-east1/api";
  }
  return DEFAULT_API_BASE;
}

function setFeedback(message, isError = false) {
  const feedback = document.getElementById("auth-feedback");
  if (!feedback) {
    return;
  }
  feedback.textContent = message;
  feedback.classList.toggle("error", isError);
}

function translateAuthError(error) {
  const code = error?.code || "";
  const map = {
    "auth/invalid-email": "El correo no es valido.",
    "auth/user-disabled": "Esta cuenta se encuentra deshabilitada.",
    "auth/user-not-found": "No encontramos una cuenta con ese correo.",
    "auth/wrong-password": "La contrasena no coincide.",
    "auth/email-already-in-use": "Este correo ya tiene una cuenta.",
    "auth/weak-password": "La contrasena debe tener al menos 6 caracteres.",
    "auth/too-many-requests": "Demasiados intentos. Espera unos minutos e intentalo otra vez."
  };
  return map[code] || "No pudimos completar la accion. Intentalo nuevamente.";
}

async function fetchUserProfile(uid) {
  if (!appState.db || !uid) {
    return null;
  }

  try {
    const profile = await appState.db.collection("usuarios").doc(uid).get();
    if (!profile.exists) {
      return null;
    }
    return profile.data() || null;
  } catch (_error) {
    return null;
  }
}

async function refreshCurrentRole() {
  if (!appState.user) {
    appState.userProfile = null;
    appState.currentRole = null;
    return null;
  }

  const profile = await fetchUserProfile(appState.user.uid);
  appState.userProfile = profile;
  appState.currentRole = normalizeRole(profile?.rol);
  return appState.currentRole;
}

function renderSessionBadge() {
  const badge = document.getElementById("session-badge");
  if (!badge) {
    return;
  }

  if (appState.user) {
    const role = appState.currentRole ? ` · ${appState.currentRole}` : "";
    badge.textContent = `${appState.user.email}${role}`;
  } else {
    badge.textContent = "Sin sesion";
  }
}

async function ensureUserProfile(user, role) {
  if (!appState.db) {
    return;
  }

  const safeRole = allowedPublicRoles.includes(role) ? normalizeRole(role) : "user";
  const ref = appState.db.collection("usuarios").doc(user.uid);
  const snapshot = await ref.get();

  if (snapshot.exists) {
    return;
  }

  await ref.set({
    rol: safeRole,
    email: user.email || "",
    nombre: user.displayName || "",
    telefono: "",
    sector: "",
    fcmToken: "",
    fotoUrl: user.photoURL || "",
    veterinarioFavoritoUid: "",
    creadoEn: firebase.firestore.FieldValue.serverTimestamp()
  });
}

async function updateMyProfile(fields) {
  if (!appState.db || !appState.user) {
    throw new Error("Necesitas iniciar sesion para actualizar tu perfil.");
  }

  await appState.db.collection("usuarios").doc(appState.user.uid).update(fields);
  await refreshCurrentRole();
  renderSessionBadge();
}

function onAuthChanged(listener) {
  if (typeof listener !== "function") {
    return () => undefined;
  }
  authSubscribers.push(listener);
  return () => {
    const index = authSubscribers.indexOf(listener);
    if (index >= 0) {
      authSubscribers.splice(index, 1);
    }
  };
}

function notifyAuthSubscribers() {
  authSubscribers.forEach((listener) => {
    try {
      listener(appState);
    } catch (_error) {
      // Ignore listener errors to avoid breaking auth flow.
    }
  });
}

async function getIdToken() {
  if (!appState.user) {
    return null;
  }
  return appState.user.getIdToken();
}

async function postToApi(path, payload, method = "POST") {
  const token = await getIdToken();
  if (!token) {
    throw new Error("Necesitas iniciar sesion para continuar.");
  }

  const response = await fetch(`${appState.apiBase}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: method === "GET" ? undefined : JSON.stringify(payload || {})
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json.message || "No se pudo completar la solicitud en este momento.");
  }

  return json;
}

async function registerWithEmail(email, password, role) {
  const credential = await appState.auth.createUserWithEmailAndPassword(email, password);
  await ensureUserProfile(credential.user, role);
  await refreshCurrentRole();
  renderSessionBadge();
  notifyAuthSubscribers();
  return credential;
}

async function loginWithEmail(email, password) {
  const credential = await appState.auth.signInWithEmailAndPassword(email, password);
  await refreshCurrentRole();
  renderSessionBadge();
  notifyAuthSubscribers();
  return credential;
}

async function logoutUser() {
  if (!appState.auth) {
    return;
  }
  await appState.auth.signOut();
}

function getPortalPathByRole(role) {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === "admin") {
    return "admin.html";
  }
  if (normalizedRole === "staff") {
    return "staff.html";
  }
  return "portal.html";
}

async function waitForFirebaseAndInit() {
  let attempts = 0;
  while (!window.firebase && attempts < 60) {
    attempts += 1;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  if (!window.firebase) {
    throw new Error("Firebase no cargo correctamente.");
  }

  appState.apiBase = getApiBase();
  appState.auth = firebase.auth();
  appState.db = firebase.firestore();

  appState.auth.onAuthStateChanged(async (user) => {
    appState.user = user;
    await refreshCurrentRole();
    renderSessionBadge();
    notifyAuthSubscribers();

    if (authReadyResolver) {
      authReadyResolver(appState);
      authReadyResolver = null;
    }
  });

  appState.initialized = true;
}

function initFirebaseClient() {
  if (appState.initialized && initPromise) {
    return initPromise;
  }

  if (!initPromise) {
    initPromise = waitForFirebaseAndInit().catch((error) => {
      setFeedback("No pudimos cargar el sistema de cuentas en este momento.", true);
      throw error;
    });
  }

  return initPromise;
}

window.VetWebAuth = {
  state: appState,
  initFirebaseClient,
  whenReady: () => authReady,
  onAuthChanged,
  getPortalPathByRole,
  refreshCurrentRole,
  updateMyProfile,
  postToApi,
  registerWithEmail,
  loginWithEmail,
  logoutUser,
  translateAuthError,
  setFeedback
};
