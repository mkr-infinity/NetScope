#!/usr/bin/env bash
# =============================================================================
# generate-keystore.sh
#
# Generates a release keystore for NetScope and prints the base64-encoded
# content you can paste directly into GitHub → Settings → Secrets.
#
# Run this ONCE locally. Keep the .keystore file safe — you'll need it to
# update the app on the Play Store later.
#
# Requirements: Java (keytool) must be installed.
#   macOS:  brew install java
#   Linux:  sudo apt install default-jdk
#   Windows: download JDK from adoptium.net, run in Git Bash
#
# Usage:
#   chmod +x scripts/generate-keystore.sh
#   ./scripts/generate-keystore.sh
# =============================================================================

set -e

KEYSTORE_FILE="netscope-release.keystore"
KEY_ALIAS="netscope-key"
VALIDITY_DAYS=10000   # ~27 years

# ── Prompt for credentials ────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║       NetScope Release Keystore Generator            ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
echo "This creates a PERMANENT release key for signing NetScope APKs."
echo "⚠️  Keep the generated .keystore file — losing it means you can't"
echo "    update the app on the Play Store."
echo ""

read -rp "Store password (min 6 chars): " STORE_PASS
read -rp "Key password  (min 6 chars): " KEY_PASS
read -rp "Your name (CN): " CN_NAME
read -rp "Organization  (O): " ORG_NAME
read -rp "Country code  (C, e.g. US): " COUNTRY

if [ -z "$STORE_PASS" ] || [ "${#STORE_PASS}" -lt 6 ]; then
  echo "❌ Store password must be at least 6 characters." && exit 1
fi
if [ -z "$KEY_PASS" ] || [ "${#KEY_PASS}" -lt 6 ]; then
  echo "❌ Key password must be at least 6 characters." && exit 1
fi

DNAME="CN=${CN_NAME:-NetScope}, OU=Mobile, O=${ORG_NAME:-MKR Infinity}, L=Unknown, ST=Unknown, C=${COUNTRY:-US}"

# ── Generate keystore ─────────────────────────────────────────────────────────
echo ""
echo "Generating keystore..."
keytool -genkeypair -v \
  -keystore "$KEYSTORE_FILE" \
  -alias "$KEY_ALIAS" \
  -keyalg RSA -keysize 2048 \
  -validity "$VALIDITY_DAYS" \
  -storepass "$STORE_PASS" \
  -keypass "$KEY_PASS" \
  -dname "$DNAME" \
  -noprompt

echo ""
echo "✅ Keystore generated: $KEYSTORE_FILE"
echo ""

# ── Verify ────────────────────────────────────────────────────────────────────
echo "Keystore details:"
keytool -list -v -keystore "$KEYSTORE_FILE" -storepass "$STORE_PASS" 2>/dev/null | \
  grep -E "Alias|Valid|Owner|SHA"

# ── Base64 encode ─────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════════════════════"
echo "  Copy these values into GitHub → Settings → Secrets:"
echo "══════════════════════════════════════════════════════════"
echo ""
echo "Secret name : KEYSTORE_BASE64"
echo "Secret value: (see below — copy the ENTIRE block)"
echo ""
if command -v base64 &>/dev/null; then
  base64 < "$KEYSTORE_FILE"
else
  openssl base64 -in "$KEYSTORE_FILE"
fi
echo ""
echo "──────────────────────────────────────────────────────────"
echo "Secret name : KEYSTORE_PASSWORD"
echo "Secret value: $STORE_PASS"
echo ""
echo "Secret name : KEY_ALIAS"
echo "Secret value: $KEY_ALIAS"
echo ""
echo "Secret name : KEY_PASSWORD"
echo "Secret value: $KEY_PASS"
echo "══════════════════════════════════════════════════════════"
echo ""
echo "⚠️  Store '$KEYSTORE_FILE' somewhere safe (e.g. encrypted backup)."
echo "    You need it to sign future Play Store updates."
echo ""
