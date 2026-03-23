const DEFAULT_API_BASE = "https://southamerica-east1-vetweb-917b9.cloudfunctions.net/api";

const appState = {
  auth: null,
  db: null,
  user: null,
  apiBase: DEFAULT_API_BASE,
  currentRole: null
};

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

async function fetchCurrentRole(uid) {
  if (!appState.db) {
    return null;
  }

  try {
    const profile = await appState.db.collection("usuarios").doc(uid).get();
    if (!profile.exists) {
      return null;
    }
    const data = profile.data();
    return data?.rol || null;
  } catch (_error) {
    return null;
  }
}

async function ensureUserProfile(user, role) {
  const allowedRoles = ["ciudadano", "dueno", "voluntario", "donante"];
  const safeRole = allowedRoles.includes(role) ? role : "ciudadano";

  if (!appState.db) {
    return;
  }

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
    creadoEn: firebase.firestore.FieldValue.serverTimestamp()
  });
}

async function getIdToken() {
  if (!appState.user) {
    return null;
  }
  return appState.user.getIdToken();
}

async function postToApi(path, payload) {
  const token = await getIdToken();
  if (!token) {
    throw new Error("Necesitas iniciar sesión para continuar.");
  }

  const response = await fetch(`${appState.apiBase}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
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
  return credential;
}

async function loginWithEmail(email, password) {
  return appState.auth.signInWithEmailAndPassword(email, password);
}

async function logoutUser() {
  if (!appState.auth) {
    return;
  }
  await appState.auth.signOut();
}

function initFirebaseClient() {
  if (!window.firebase) {
    return;
  }

  appState.apiBase = getApiBase();
  appState.auth = firebase.auth();
  appState.db = firebase.firestore();

  appState.auth.onAuthStateChanged(async (user) => {
    appState.user = user;
    appState.currentRole = user ? await fetchCurrentRole(user.uid) : null;

    const badge = document.getElementById("session-badge");
    if (badge) {
      if (user) {
        badge.textContent = `${user.email} ${appState.currentRole ? `· ${appState.currentRole}` : ""}`;
      } else {
        badge.textContent = "Sin sesión";
      }
    }
  });
}

window.VetWebAuth = {
  state: appState,
  initFirebaseClient,
  postToApi,
  registerWithEmail,
  loginWithEmail,
  logoutUser,
  setFeedback
};
