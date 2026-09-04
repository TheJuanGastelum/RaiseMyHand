# RaiseMyHand

A live digital hand-raise queue for a classroom. Students press **Space** or
tap a button on their own device to line up; the teacher watches one live
queue instead of a sea of raised hands.

This version is a real, publicly hostable website — anyone with the link can
use it, no Claude or Google account required to *use* the site (students
never see a login). Getting it live takes about 10–15 minutes of one-time
setup in the Firebase console plus a GitHub repo. You only do this once;
after that, every `git push` to `main` redeploys automatically.

## How it works

- **Teacher**: starts a session (optional class name), gets a 4-character
  code, watches students queue up live, marks people "helped" to remove
  them, ends the session when done.
- **Student**: enters the class code + a name or seat number, then presses
  Space or taps "Raise hand" to join the line. Sees a live position (#N of
  M) and wait timer, can lower their own hand, and is notified the moment
  they're marked helped or the session ends.
- All of it syncs in real time across every device via Firestore (Google's
  realtime database), which is also what makes the whole thing free to run
  at classroom scale.

## One-time setup

### 1. Create a Firebase project
1. Go to <https://console.firebase.google.com> and click **Add project**.
2. Name it anything (e.g. `raisemyhand`). You can disable Google Analytics —
   not needed here.

### 2. Turn on Firestore
1. In the left sidebar: **Build → Firestore Database → Create database**.
2. Choose **production mode** and pick a region close to you.

### 3. Turn on anonymous sign-in
1. **Build → Authentication → Get started**.
2. Under **Sign-in method**, enable **Anonymous**.
   (This is what quietly lets the app tell "someone real using the site"
   apart from a bot, without ever showing anyone a login screen.)

### 4. Register a web app and grab its config
1. Project settings (gear icon) → **General** → scroll to **Your apps** →
   click the **</>** (web) icon → give it any nickname → **Register app**.
2. You'll see a `firebaseConfig` object. Copy it.
3. Open `public/firebase-config.js` in this project and paste your real
   values in place of the `"REPLACE_ME"` placeholders.

### 5. Publish the security rules
1. **Build → Firestore Database → Rules**.
2. Replace the contents with everything in this project's `firestore.rules`
   file, then click **Publish**.
   (These rules let anyone read the live queue, but only a signed-in — even
   anonymously signed-in — visitor can create a session or a queue entry,
   and only in the exact shape the app writes. That's what keeps a random
   bot that finds the URL from filling your queue with junk.)

### 6. Get your Project ID
Project settings → **General** → **Project ID** (not the project *name* —
the ID, e.g. `raisemyhand-a1b2c`). You'll need it twice below.

Edit `.firebaserc` and `.github/workflows/deploy.yml` in this project,
replacing `REPLACE_WITH_YOUR_FIREBASE_PROJECT_ID` with that ID in both
places.

### 7. Create a service account key (for automatic deploys)
1. Project settings → **Service accounts** → **Generate new private key**.
   This downloads a `.json` file — keep it private, don't commit it to git.

### 8. Push this project to GitHub
```bash
cd raisemyhand-web
git init
git add .
git commit -m "Initial RaiseMyHand site"
```
Create a new empty repo on GitHub (no README/gitignore — you already have
one), then:
```bash
git remote add origin https://github.com/<you>/<repo>.git
git branch -M main
git push -u origin main
```

### 9. Add the service account as a GitHub secret
1. On GitHub: your repo → **Settings → Secrets and variables → Actions →
   New repository secret**.
2. Name: `FIREBASE_SERVICE_ACCOUNT`
3. Value: paste the **entire contents** of the JSON file from step 7.
4. Save.

### 10. Deploy
Push again (or re-push if you already pushed before adding the secret):
```bash
git commit --allow-empty -m "Trigger deploy"
git push
```
Check the **Actions** tab on GitHub — when the workflow finishes, your site
is live at:
```
https://<your-project-id>.web.app
```
(also reachable at `https://<your-project-id>.firebaseapp.com`)

From then on, any push to `main` redeploys automatically — no manual steps.

## Trying it locally first (optional)

You don't need Firebase to preview the layout — any static file server
works, e.g. from this folder:
```bash
cd public && python3 -m http.server 8080
```
then open `http://localhost:8080`. It won't be able to actually create or
join sessions until `firebase-config.js` has real values and the rules are
published, but you'll see the screens render.

There's also `test/` — a small offline smoke test (Playwright + a fake,
localStorage-backed Firestore stand-in) that exercises the full teacher +
student flow without touching real Firebase, used while building this. Not
required for deployment; safe to delete or ignore.

## Cost

Firebase's free "Spark" tier includes 50K document reads and 20K writes per
day and 10 GB of hosting bandwidth per month — enough for many classes a
day, indefinitely, without ever entering a credit card. If you somehow blow
past that, Firebase just stops writes rather than silently billing you
(Spark tier has no billing attached at all).

## Customizing

- Colors, fonts, copy: `public/index.html` (inline `<style>` and markup)
  and `public/app.js` (screen text lives in the template strings).
- Session code length/characters, queue behavior, security rules: `public/app.js`
  and `firestore.rules`.
- Want a custom domain instead of `*.web.app`? Firebase Hosting supports
  this for free — **Hosting → Add custom domain** in the console, then
  follow its DNS instructions.
