#!/usr/bin/env bash
set -euo pipefail

export CLOUDSDK_CORE_DISABLE_PROMPTS=1

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEY_FILE="$ROOT/api/.openai-key.secret"
PROJECT_ID="${GCP_PROJECT_ID:-tactical-grid-454202-h6}"
REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="${GCP_SERVICE_NAME:-posteriograph-api}"
SECRET_NAME="openai-api-key"

if [[ ! -f "$KEY_FILE" ]]; then
  echo "Missing $KEY_FILE — paste your OpenAI API key there (one line, sk-...)." >&2
  exit 1
fi

KEY="$(tr -d '\r\n' < "$KEY_FILE")"
if [[ -z "$KEY" || "$KEY" == "sk-REPLACE_ME" ]]; then
  echo "Edit $KEY_FILE and replace sk-REPLACE_ME with your real OpenAI API key." >&2
  exit 1
fi

echo "Using project: $PROJECT_ID region: $REGION service: $SERVICE_NAME"
gcloud config set project "$PROJECT_ID"

echo "Enabling APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  --quiet

PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)')"
RUNTIME_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

echo "Uploading secret to Secret Manager..."
if gcloud secrets describe "$SECRET_NAME" --project="$PROJECT_ID" &>/dev/null; then
  printf '%s' "$KEY" | gcloud secrets versions add "$SECRET_NAME" --data-file=-
else
  printf '%s' "$KEY" | gcloud secrets create "$SECRET_NAME" --data-file=-
fi

echo "Granting secret access to $RUNTIME_SA..."
gcloud secrets add-iam-policy-binding "$SECRET_NAME" \
  --member="serviceAccount:${RUNTIME_SA}" \
  --role="roles/secretmanager.secretAccessor" \
  --quiet

ENV_VARS_FILE="$(mktemp)"
trap 'rm -f "$ENV_VARS_FILE"' EXIT
cat > "$ENV_VARS_FILE" <<'EOF'
OPENAI_MODEL: gpt-4o-mini
ALLOWED_ORIGINS: https://hospitalistops-admin.github.io,http://127.0.0.1:5173,http://localhost:5173
RATE_LIMIT_PER_MINUTE: "20"
HOST: 0.0.0.0
EOF

echo "Deploying to Cloud Run (this may take several minutes)..."
gcloud run deploy "$SERVICE_NAME" \
  --source "$ROOT" \
  --region "$REGION" \
  --allow-unauthenticated \
  --env-vars-file "$ENV_VARS_FILE" \
  --set-secrets "OPENAI_API_KEY=${SECRET_NAME}:latest" \
  --quiet

SERVICE_URL="$(gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format='value(status.url)')"
echo ""
echo "Deployed: $SERVICE_URL"
echo ""
echo "Health check:"
curl -sf "$SERVICE_URL/health" && echo ""
echo ""
echo "Next: add GitHub Actions secret VITE_API_BASE_URL=$SERVICE_URL (no trailing slash)"
echo "      then re-run Deploy GitHub Pages workflow."
