#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
FUNCTIONS_DIR="$ROOT_DIR/functions"
PROJECT_ID="${1:-${FIREBASE_PROJECT_ID:-demo-vet}}"

ensure_node_and_npm() {
  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    return 0
  fi

  if [ "$(uname -s)" != "Linux" ]; then
    echo "Este script ahora soporta solo Linux."
    exit 1
  fi

  echo "Node.js/npm no detectados. Intentando instalacion automatica en Linux..."

  if command -v apt-get >/dev/null 2>&1; then
    echo "Instalando Node.js y npm con apt-get..."
    if command -v sudo >/dev/null 2>&1; then
      sudo apt-get update
      sudo apt-get install -y nodejs npm
    else
      apt-get update
      apt-get install -y nodejs npm
    fi
  elif command -v dnf >/dev/null 2>&1; then
    echo "Instalando Node.js y npm con dnf..."
    if command -v sudo >/dev/null 2>&1; then
      sudo dnf install -y nodejs npm
    else
      dnf install -y nodejs npm
    fi
  elif command -v yum >/dev/null 2>&1; then
    echo "Instalando Node.js y npm con yum..."
    if command -v sudo >/dev/null 2>&1; then
      sudo yum install -y nodejs npm
    else
      yum install -y nodejs npm
    fi
  else
    echo "No se encontro un gestor compatible (apt-get, dnf, yum)."
    echo "Instala manualmente Node.js 20+ y npm, luego reintenta."
    exit 1
  fi

  if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    echo "La instalacion automatica no expuso node/npm en esta sesion de shell."
    echo "Abre una nueva terminal y ejecuta nuevamente el script."
    exit 1
  fi
}

ensure_node_and_npm

if ! command -v firebase >/dev/null 2>&1; then
  echo "Firebase CLI no encontrado. Se usara npx firebase-tools."
  FIREBASE_CMD=(npx --yes firebase-tools)
else
  FIREBASE_CMD=(firebase)
fi

echo "Proyecto Firebase: $PROJECT_ID"

cd "$FUNCTIONS_DIR"

if [ ! -d "node_modules" ]; then
  echo "Instalando dependencias..."
  npm install
fi

echo "Compilando TypeScript..."
npm run build

echo "Desplegando Cloud Functions..."
"${FIREBASE_CMD[@]}" deploy --only functions --project "$PROJECT_ID" --config firebase.json

echo "Despliegue completado correctamente."
