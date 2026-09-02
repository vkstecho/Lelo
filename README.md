# Lelo Sab Kuchh — Setup Guide

This is a working web-app prototype (single file: `index.html`) wired to your
Firebase project `lelovkstech2026`. It's built with React + Firebase loaded
from CDNs, so there's nothing to compile — just host the three files together.

**Files — upload all of these together to the same folder on your host (e.g. the root of `lelo.vkstech.com`):**
- `index.html` — **landing page** with the "Download the App" button (what people see first at lelo.vkstech.com)
- `app.html` — the actual app: login, user ordering flow, admin console
- `manifest.json` — makes the site installable as an app (name, icons, colors)
- `sw.js` — service worker; caches the app shell so it installs and loads fast
- `icon-192.png`, `icon-512.png` — app icons generated from your logo
- `lelo-logo.jpg` — your logo, used in-app
- `firestore.rules` — recommended security rules for your Firestore database

## 0. Why there was a blank white page
The previous single-file version created the invisible reCAPTCHA the moment the page loaded. If Phone Auth wasn't enabled yet, or the domain wasn't in Firebase's authorized-domains list, that throw happened before anything was drawn — with no error screen, the whole page just stayed blank. This version:
- only creates the reCAPTCHA when someone taps **Send OTP** (wrapped in a try/catch that shows a plain-English message instead of failing silently)
- shows a "Loading Lelo Sab Kuchh…" screen immediately, so you always see *something*
- catches any other runtime error and shows a "Something went wrong" screen with a Reload button, instead of a blank page

If you still see a blank page after this, it almost always means step 1 or step 2 below hasn't been done yet for your live domain — check the browser console (or use the on-screen error message this version now shows).

## 1. Turn on Phone Authentication
Firebase Console → **Build → Authentication → Sign-in method → Phone → Enable**.
- Phone sign-in needs the **Blaze (pay-as-you-go)** billing plan once you go past the free testing quota. On the free Spark plan you can add a few **test phone numbers** (Authentication → Sign-in method → Phone → Phone numbers for testing) to try the app without sending real SMS.
- Add your two admin numbers as test numbers first, so you can log into the admin console for free while building.

## 2. Turn on Firestore
Firebase Console → **Build → Firestore Database → Create database** (production mode is fine).
Then go to the **Rules** tab and paste in the contents of `firestore.rules` from this folder, and click **Publish**.

## 3. Host the files
Any static host works (Firebase Hosting is the easiest since it's the same project):
```
npm install -g firebase-tools
firebase login
firebase init hosting   # pick project lelovkstech2026, public dir = the folder with index.html
firebase deploy
```
Firebase Hosting also auto-adds your domain to the **Authorized domains** list that Phone Auth requires. If you host elsewhere, add that domain manually in Authentication → Settings → Authorized domains.

## 4. How the app is organized
- **Login:** mobile number → OTP (Firebase Phone Auth) → account created automatically on first login with **180 days** validity.
- **Admin numbers** `7497073993` and `8929394920` skip the regular user flow and land on the **Admin console** instead.
- **User app** (bottom tabs): Menu (grouped by category, add to cart), Cart (adjust quantities, Confirm order — this also grabs the phone's GPS location with permission), My Orders (live status), Delivery (call/WhatsApp the delivery contact the admin has set).
- **Admin console** (top tabs):
  - **Items** — add categories, add items (name, price, emoji icon, category), edit price or delete any item, and set the delivery person's name/number shown to users.
  - **Users** — every registered user, with join date, days remaining, a block toggle, and ±7/+30 day buttons to adjust their validity.
  - **Orders** — live order feed (badge shows how many are new), each with items, total, a tap-to-call link, a "View location" map link, and buttons to move the order through New → Preparing → Out for delivery → Delivered.

## 5. About notifications to the admin
While the admin console is **open in a browser tab**, new orders appear instantly (Firestore real-time listener) and trigger a toast + a browser notification. That's included and working out of the box.

Getting a notification when the admin's **app/phone is closed** needs a real push channel: Firebase Cloud Messaging (FCM) plus a small Cloud Function that fires on every new `orders` document. That's a separate, small build (mainly server-side) — happy to add it next if you want true background push to the admin's phone; it isn't something a static web page can do on its own.

## 6. The "Download the App" landing page
`lelo.vkstech.com` now serves `index.html` first — a landing page with a **Download the App** button.
- On Android/Chrome/Edge, tapping it triggers the real "Install app" prompt (via `manifest.json` + `sw.js`), and afterwards the person is dropped into `app.html` running as a standalone app icon on their home screen.
- On iPhone (Safari doesn't support that install prompt), tapping the button shows a short instruction to use Share → "Add to Home Screen" instead.
- "Continue in browser instead" skips installation and goes straight to `app.html`.
- **This must be served over HTTPS** (Firebase Hosting gives you this automatically) — install prompts don't work on plain HTTP.

## 8. Fixing the "shortcut with a Chrome badge" icon
If the icon on your home screen looks like your logo with a small Chrome badge in the corner, that's a plain **browser shortcut/bookmark**, not a real installed app — Chrome only drops that badge when it wasn't confident the site was a proper installable app at the moment it was added (manifest/service worker not ready yet, or an older cached version was used).

To fix it:
1. **Delete** that shortcut from your home screen.
2. In Chrome, open `https://lelo.vkstech.com`, tap the **⋮ menu → "Clear cache and reload"** (or clear site data for the domain) so it fetches the latest `manifest.json`, `sw.js`, and icons — not an old cached copy.
3. Confirm the padlock/HTTPS is present — installable PWAs require HTTPS.
4. Tap **Download the App** again. If Chrome recognizes it as installable, you'll see a genuine **"Install app"** dialog (with an Install/Cancel choice) rather than just adding a shortcut. That result has no browser badge and opens full-screen without an address bar.

You can also check installability yourself any time: open the site in Chrome, go to **⋮ → More tools → Developer tools → Application tab → Manifest**, and see if Chrome lists any errors — that will tell you exactly what's blocking a proper install if it still doesn't work.

## 9. Fixing "the app just shows Loading… forever"
`app.html` now has a watchdog: if the app hasn't finished starting within 8 seconds, the loading screen is replaced with an actual error message (instead of hanging silently), which will point to what failed — usually a blocked script (ad-blocker, restrictive mobile network/firewall) or no internet connection at that moment. If you see that message, share the red error text and I can pin down the exact fix.

## 10. Suggested next steps
- Add your real item photos instead of emoji icons if you'd like (swap `item.icon` for an image URL field).
- If you eventually want a real Android/iOS app (not just an installable web page), the same Firebase project can back a React Native or Flutter app — the data model here (`categories`, `items`, `users`, `orders`, `settings`) would carry over directly.
