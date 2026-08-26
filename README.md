# Bet on It

A free, no-money multiplayer game app — **Ludo** (2–6 players) and **Snakes & Ladders**
(2–4 players) — for **Android, iOS, and Web** from a single Expo/React Native codebase.
Players sign in with **Google** and play together in real time using short room codes.

> No real-money betting, wagering, or payments of any kind. "Bet on It" is just the app's name.

---

## Stack

| Layer          | Technology                                                              |
|----------------|---------------------------------------------------------------------------|
| App            | Expo (React Native) — one codebase for Android, iOS, and Web              |
| Auth           | Firebase Authentication — Google Sign-In on all three platforms           |
| Realtime data  | Cloud Firestore — game rooms, turn state, presence                        |
| Hosting (web)  | Firebase Hosting                                                          |
| Game logic     | Hand-written, pure, unit-simulated engines in `src/game-engine/`          |
| CI/CD          | GitHub Actions — Android debug APK build + web deploy on every push       |

Firebase project: **bet-on-it-781e1** (already created, live, under your Google account).

---

## Project layout

```
src/
  auth/            Google Sign-In (Firebase Auth) context
  firebase/        Firebase app + config (public client IDs — safe to commit)
  game-engine/      Pure, deterministic Ludo & Snakes-and-Ladders rules engines
  services/rooms.ts  Firestore room create/join/sync
  components/       Dice, player badges, SVG game boards
  screens/          Sign-in, Home, Lobby, Game
  navigation/       React Navigation stack
scripts/simulate.ts  Headless playthrough simulator used to verify the engines
.github/workflows/   CI: Android APK build, Firebase Hosting deploy
```

---

## Running locally

```bash
npm install --legacy-peer-deps
npx expo start          # then press w (web), a (Android), i (iOS)
```

`--legacy-peer-deps` is needed once because a couple of Expo's own transitive
dependencies briefly disagree on the exact React patch version; it's harmless.

---

## One-time setup still needed from you

Everything in Firebase/Google Cloud (project, Firestore, Google Sign-In, OAuth
client IDs) is already configured. Two things need a real human with a browser
and an account, which is why they weren't done automatically:

### 1. Let GitHub Actions deploy the web app for you

The workflow `.github/workflows/deploy-web.yml` deploys to Firebase Hosting on
every push to `main`, but it needs a Firebase service-account key stored as a
GitHub secret (this is standard practice — an AI session should never hold or
transmit that key itself):

1. Go to [Google Cloud Console → IAM & Admin → Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts?project=bet-on-it-781e1) for this project.
2. Open `firebase-adminsdk-fbsvc@bet-on-it-781e1.iam.gserviceaccount.com` → **Keys** → **Add key** → **Create new key** → **JSON**. A file downloads.
3. In your GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**.
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Value: paste the entire contents of the downloaded JSON file.
4. Push to `main` (or re-run the workflow) — your site goes live at
   `https://bet-on-it-781e1.web.app`.

### 2. Building for iOS

Apple requires a real Apple Developer account ($99/yr) and code signing that
only Apple's own tools can do — nothing in any cloud sandbox can substitute
for this. Once you have an account:

```bash
npm install -g eas-cli
eas login
eas build:configure          # links this repo to your Expo/EAS account
eas build --platform ios --profile preview
```

`eas.json` already has `preview`/`production` build profiles set up. EAS
Build (free tier available) handles the macOS/Xcode signing for you in the
cloud — you don't need a Mac.

### 3. Publishing to the Play Store / App Store

- **Android**: the CI workflow builds a debug APK on every push (see the
  "Actions" tab → download the `bet-on-it-debug-apk` artifact) — good for
  installing on a phone and testing today. For a **Play Store** release you
  need a signed **AAB**, which means a Google Play Console account
  ($25 one-time) and either `eas build --platform android --profile production`
  or a local release keystore. Play Console → Release → Production → upload
  the AAB.
- **iOS**: `eas submit --platform ios` after the build above, once you have
  an Apple Developer account.

---

## Google Sign-In — what's already configured

| Platform | OAuth client                                                          |
|----------|------------------------------------------------------------------------|
| Web      | `420155966557-ku317ls22tq2cgnh28uidj4q1gcsgqe5.apps.googleusercontent.com` |
| iOS      | `420155966557-0qpplsst4d3fd3690uno0hbs33l9ndb5.apps.googleusercontent.com` |
| Android (debug) | `420155966557-t85phb2s2an48jt9l3uiebl2hm8g4i74.apps.googleusercontent.com`, keyed to the debug keystore SHA-1 `A9:A3:23:35:9F:77:C6:CB:40:3B:73:0F:DF:1A:38:46:E4:19:32:6C` |

**Important:** the Android OAuth client above only works with the **debug**
keystore (used by `expo prebuild` / the CI APK / Expo Go-style local builds).
Before shipping a **release** build (Play Store, or `eas build --profile
production`), you must add that build's own SHA-1 fingerprint as a *second*
Android OAuth client in
[Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials?project=bet-on-it-781e1),
same package name (`com.betonit.app`), or Google Sign-In will fail on that
build with a `DEVELOPER_ERROR`. Get the release SHA-1 with:

```bash
keytool -list -v -keystore your-release.keystore -alias your-alias
# or, once EAS manages signing for you:
eas credentials
```

---

## Game rules implemented

- **Ludo (2–6 players):** a generalized version of the classic board — the
  usual 4-arm, 52-square board scales up to N arms of 13 squares for more
  players, so a 4-player game is byte-for-byte the real board, and 5–6
  players get a fair, symmetric extension of the same rules. Roll a 6 to
  leave the yard, safe squares block capture, rolling 6 or capturing grants
  an extra turn, all 4 tokens home to win.
- **Snakes & Ladders (2–4 players):** classic 100-square board, must roll the
  exact number to land on 100, rolling a 6 grants another turn.

Both engines are pure functions (`src/game-engine/*.ts`) with no UI or
network code, verified by `scripts/simulate.ts`, which plays thousands of
randomized full games per player-count and confirms every game reaches a
winner. Run it yourself with `npx tsx scripts/simulate.ts`.

---

## Security notes

- Firestore rules (`firestore.rules`) require sign-in for all room reads/writes.
  Move legality itself is enforced by the shared client-side engine rather
  than duplicated in rules — appropriate for a free, no-stakes casual game,
  but not a substitute for server-side validation if this were ever to involve
  real money or sensitive data.
- The `firebaseConfig` values in `src/firebase/config.ts` (API key, app IDs)
  are public client identifiers — Firebase's design assumes these ship inside
  the app bundle and are not secret. Real access control lives in Firestore
  Security Rules, not in hiding these values.
