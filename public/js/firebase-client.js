/* =========================================================
 * VetWeb · Firebase client
 * ========================================================= */

const DEFAULT_API_BASE = "https://southamerica-east1-vetweb-917b9.cloudfunctions.net/api";

// Roles válidos en Firestore (ver functions/firestore.rules):
// - ciudadano, dueno, voluntario, donante  → registrables por el propio usuario
// - veterinario, administrador             → solo asignables por un admin
const SELF_REGISTERABLE_ROLES = ["dueno", "ciudadano", "voluntario", "donante"];
const ALL_ROLES = ["ciudadano", "dueno", "voluntario", "donante", "veterinario", "administrador"];

function normalizeRole(role) {
  const value = String(role || "").toLowerCase();
  if (value === "administrador" || value === "admin") return "admin";
  if (value === "veterinario" || value === "voluntario" || value === "staff") return "staff";
  if (ALL_ROLES.includes(value) || value === "user") return "user";
  return "user";
}

function roleLabel(role) {
  const map = {
    ciudadano: "Ciudadano",
    dueno: "Dueño de mascota",
    voluntario: "Voluntario",
    donante: "Donante",
    veterinario: "Veterinario",
    administrador: "Administrador"
  };
  return map[String(role || "").toLowerCase()] || "Cuenta";
}

const appState = {
  auth: null,
  db: null,
  user: null,
  userProfile: null,
  apiBase: DEFAULT_API_BASE,
  currentRole: null,    // "user" | "staff" | "admin"
  rawRole: null,        // role exacto tal como está en Firestore
  initialized: false
};

const authSubscribers = [];
let initPromise = null;
let authReadyResolver = null;
const authReady = new Promise((resolve) => { authReadyResolver = resolve; });

function isLocalHost() {
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}
function getApiBase() {
  if (isLocalHost()) return "http://127.0.0.1:5001/vetweb-917b9/southamerica-east1/api";
  return DEFAULT_API_BASE;
}

function setFeedback(message, isError = false) {
  const feedback = document.getElementById("auth-feedback");
  if (!feedback) return;
  feedback.textContent = message;
  feedback.classList.toggle("error", isError);
}

function translateAuthError(error) {
  const code = error?.code || "";
  const map = {
    "auth/invalid-email": "El correo no es válido.",
    "auth/user-disabled": "Esta cuenta se encuentra deshabilitada.",
    "auth/user-not-found": "No encontramos una cuenta con ese correo.",
    "auth/wrong-password": "La contraseña no coincide.",
    "auth/invalid-credential": "Correo o contraseña incorrectos.",
    "auth/email-already-in-use": "Este correo ya tiene una cuenta. Inicia sesión.",
    "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
    "auth/too-many-requests": "Demasiados intentos. Espera unos minutos."
  };
  return map[code] || "No pudimos completar la acción. Intenta nuevamente.";
}

async function fetchUserProfile(uid) {
  if (!appState.db || !uid) return null;
  try {
    const profile = await appState.db.collection("usuarios").doc(uid).get();
    return profile.exists ? (profile.data() || null) : null;
  } catch (_e) { return null; }
}

async function refreshCurrentRole() {
  if (!appState.user) {
    appState.userProfile = null;
    appState.currentRole = null;
    appState.rawRole = null;
    return null;
  }
  const profile = await fetchUserProfile(appState.user.uid);
  appState.userProfile = profile;
  appState.rawRole = profile?.rol || null;
  appState.currentRole = normalizeRole(profile?.rol);
  return appState.currentRole;
}

function renderSessionBadges() {
  document.querySelectorAll("#session-badge, .session-badge").forEach((el) => {
    if (appState.user) {
      const r = appState.rawRole ? roleLabel(appState.rawRole) : "Cuenta";
      el.textContent = `${appState.user.email} · ${r}`;
      el.classList.add("online");
    } else {
      el.textContent = "Sin sesión";
      el.classList.remove("online");
    }
  });
}

async function ensureUserProfile(user, role) {
  if (!appState.db) return;
  const safeRole = SELF_REGISTERABLE_ROLES.includes(role) ? role : "dueno";
  const ref = appState.db.collection("usuarios").doc(user.uid);
  const snapshot = await ref.get();
  if (snapshot.exists) return;

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
    throw new Error("Necesitas iniciar sesión para actualizar tu perfil.");
  }
  await appState.db.collection("usuarios").doc(appState.user.uid).update(fields);
  await refreshCurrentRole();
  renderSessionBadges();
}

function onAuthChanged(listener) {
  if (typeof listener !== "function") return () => undefined;
  authSubscribers.push(listener);
  // Fire immediately if state already known
  if (appState.initialized) {
    try { listener(appState); } catch (_e) {}
  }
  return () => {
    const idx = authSubscribers.indexOf(listener);
    if (idx >= 0) authSubscribers.splice(idx, 1);
  };
}

function notifyAuthSubscribers() {
  authSubscribers.forEach((fn) => { try { fn(appState); } catch (_e) {} });
}

async function getIdToken() {
  if (!appState.user) return null;
  return appState.user.getIdToken();
}

async function postToApi(path, payload, method = "POST") {
  const token = await getIdToken();
  if (!token) throw new Error("Necesitas iniciar sesión para continuar.");
  const response = await fetch(`${appState.apiBase}${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: method === "GET" ? undefined : JSON.stringify(payload || {})
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(json.message || "No se pudo completar la solicitud.");
  return json;
}

async function registerWithEmail(email, password, role) {
  const credential = await appState.auth.createUserWithEmailAndPassword(email, password);
  await ensureUserProfile(credential.user, role);
  await refreshCurrentRole();
  renderSessionBadges();
  notifyAuthSubscribers();
  return credential;
}

async function loginWithEmail(email, password) {
  const credential = await appState.auth.signInWithEmailAndPassword(email, password);
  await refreshCurrentRole();
  renderSessionBadges();
  notifyAuthSubscribers();
  return credential;
}

async function logoutUser() {
  if (!appState.auth) return;
  await appState.auth.signOut();
}

function getPortalPathByRole(role) {
  const r = normalizeRole(role);
  if (r === "admin") return "admin.html";
  if (r === "staff") return "staff.html";
  return "portal.html";
}

async function waitForFirebaseAndInit() {
  let attempts = 0;
  while (!window.firebase && attempts < 80) {
    attempts += 1;
    await new Promise((resolve) => setTimeout(resolve, 75));
  }
  if (!window.firebase) throw new Error("Firebase no cargó correctamente.");

  appState.apiBase = getApiBase();
  appState.auth = firebase.auth();
  appState.db = firebase.firestore();

  appState.auth.onAuthStateChanged(async (user) => {
    appState.user = user;
    await refreshCurrentRole();
    renderSessionBadges();
    notifyAuthSubscribers();
    if (authReadyResolver) {
      authReadyResolver(appState);
      authReadyResolver = null;
    }
  });

  appState.initialized = true;
}

function initFirebaseClient() {
  if (initPromise) return initPromise;
  initPromise = waitForFirebaseAndInit().catch((error) => {
    setFeedback("No pudimos cargar el sistema de cuentas en este momento.", true);
    console.error("[VetWeb] init", error);
    throw error;
  });
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
  setFeedback,
  normalizeRole,
  roleLabel,
  SELF_REGISTERABLE_ROLES,
  ALL_ROLES
};
