# Building NetScope APK with GitHub Actions

This doc explains how to generate a signed release APK from GitHub Actions.

---

## How the build works

1. **`expo prebuild`** — generates the native `android/` project from `app.json`
2. **`scripts/patch-gradle-signing.js`** — injects the keystore signing config into `android/app/build.gradle`
3. **`./gradlew assembleRelease`** — compiles and signs the APK
4. The signed APK is uploaded as a GitHub Actions artifact

---

## First-time setup: configure your signing key

### Option A — Quick start (no setup, auto-generated temp key)

Push to `main` without configuring any secrets. The workflow auto-generates a
temporary keystore and builds a signed APK. The APK works and installs, but
**each build is signed with a different key** — meaning you cannot release
consecutive updates to the Play Store with this approach.

Use this to verify the build pipeline works before setting up a permanent key.

---

### Option B — Permanent release key (recommended)

#### Step 1: Generate a keystore (run once locally)

```bash
cd artifacts/netscope
chmod +x scripts/generate-keystore.sh
./scripts/generate-keystore.sh
```

This outputs the 4 GitHub secret values you need.

**Alternatively, use `keytool` directly:**

```bash
keytool -genkeypair -v \
  -keystore netscope-release.keystore \
  -alias netscope-key \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass YOUR_STORE_PASS -keypass YOUR_KEY_PASS \
  -dname "CN=Your Name, OU=Mobile, O=Your Company, L=City, ST=State, C=US"

# Get base64 for the secret:
base64 < netscope-release.keystore   # macOS / Linux
```

#### Step 2: Add GitHub repository secrets

Go to **GitHub → your repo → Settings → Secrets and variables → Actions → New repository secret**

| Secret name | Value |
|-------------|-------|
| `KEYSTORE_BASE64` | Full base64 output of the `.keystore` file |
| `KEYSTORE_PASSWORD` | The store password you used |
| `KEY_ALIAS` | `netscope-key` (or whatever alias you used) |
| `KEY_PASSWORD` | The key password you used |

#### Step 3: Push to trigger a build

```bash
git push origin main
# or create a tag for a versioned release:
git tag v1.0.0 && git push origin v1.0.0
```

---

## Where to find the APK

After the workflow succeeds:

1. Go to **GitHub → Actions → your workflow run**
2. Scroll to **Artifacts** at the bottom
3. Download `NetScope-v1.0.0-build42-abc1234.apk`

The APK is kept for **30 days** by default.

---

## Replacing the keystore later

1. Generate a new keystore using the same steps above
2. Update the 4 GitHub secrets with the new values
3. The next push will use the new key

> ⚠️ **Play Store warning**: If you've already published to the Play Store,
> you **cannot** change your signing key without losing the ability to update
> the app for existing users. Google Play App Signing can help — enroll during
> your first upload.

---

## Updating the app version

Edit `artifacts/netscope/app.json`:

```json
{
  "expo": {
    "version": "1.1.0",
    "android": {
      "versionCode": 2
    }
  }
}
```

Always increment `versionCode` by 1 for each Play Store upload.

---

## Build troubleshooting

| Problem | Fix |
|---------|-----|
| `expo prebuild` fails | Check `app.json` for syntax errors |
| `patch-gradle-signing.js` can't find `build.gradle` | Ensure prebuild ran successfully first |
| Gradle build OOM | Add `-Xmx4g` to `$GRADLE_OPTS` or reduce workers |
| `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | Different key from previous install — uninstall first |
| APK not found after build | Check Gradle output for actual errors |

---

## Triggering builds manually

Go to **GitHub → Actions → Build Android Release APK → Run workflow**.
