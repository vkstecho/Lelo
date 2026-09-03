# Lelo — Setup & Deployment Guide

Files in this package:

```
index.html          the entire app (storefront + cart + checkout + admin dashboard)
manifest.json        PWA manifest (install button, icons, name)
sw.js                 service worker (offline caching, installability)
firestore.rules       copy-paste into Firebase Console
storage.rules          copy-paste into Firebase Console
icons/                 app icons generated from your logo
```

Upload all of these to the **root** of your `lelo` GitHub repo, keeping the
`icons/` folder as a folder (don't flatten it).

---

## ⚠️ Before anything else: enable Blaze billing

Your admin OTP login uses **Firebase Phone Authentication**, and product
photo uploads use **Firebase Storage**. As of 2026, Google requires both of
these to run on the **Blaze (pay-as-you-go) plan** — a free Spark project
cannot use them at all, even at zero volume. You must attach a billing
card to the `lelo-sab-kuchh` project.

This does **not** mean you'll be charged in normal use:
- The first 10 SMS/day for phone auth are free; beyond that it's roughly ₹0.5–1 per OTP (only admin logs in, so this will basically never be hit).
- Storage has a generous always-free quota (5 GB stored, 100 GB/month downloaded in eligible regions).

**To enable:** Firebase Console → gear icon → **Usage and billing** → **Modify plan** → select **Blaze** → attach a card.

---

## Step 1 — Create the Firebase Web App & get your config

1. Go to the [Firebase Console](https://console.firebase.google.com) → open **lelo-sab-kuchh**.
2. Click the **gear icon → Project settings**.
3. Under "Your apps", click the **`</>`** (Web) icon to register a new web app. Name it `Lelo Web`.
4. Firebase will show you a `firebaseConfig` object. Copy it.
5. Open `index.html` in this package, find this block near the top of the `<script>` section, and paste your real values in:

```js
const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY",
  authDomain: "lelo-sab-kuchh.firebaseapp.com",
  projectId: "lelo-sab-kuchh",
  storageBucket: "lelo-sab-kuchh.appspot.com",
  messagingSenderId: "PASTE_SENDER_ID",
  appId: "PASTE_APP_ID"
};
```

---

## Step 2 — Enable Authentication (Phone)

1. Firebase Console → **Build → Authentication → Get started**.
2. Under **Sign-in method**, enable **Phone**.
3. Go to **Authentication → Settings → Authorized domains** and add:
   - `lelo.vkstech.com`
   - your GitHub Pages default domain if you also test there (e.g. `yourusername.github.io`)
   - `localhost` (already there by default — for local testing)

No need to add the admin number as a "test number" — since you want real
OTPs, it'll just receive a genuine SMS.

---

## Step 3 — Enable Firestore

1. **Build → Firestore Database → Create database**.
2. Choose **Production mode**.
3. Pick a location close to your users (e.g. `asia-south1` — Mumbai).
4. Once created, go to the **Rules** tab, delete the default contents, and paste in everything from `firestore.rules` in this package. Click **Publish**.

## Step 4 — Enable Storage

1. **Build → Storage → Get started**. Choose **Production mode**, region **asia-south1**.
2. Go to the **Rules** tab, delete the defaults, paste in `storage.rules`, click **Publish**.

---

## Step 5 — Upload files to GitHub

Push/upload these files to the root of your `lelo` repo:
`index.html`, `manifest.json`, `sw.js`, `icons/*`

### If using GitHub Pages (matches your `lelo.vkstech.com` domain):
1. Repo → **Settings → Pages**.
2. Source: **Deploy from branch**, branch `main`, folder `/ (root)`.
3. Under **Custom domain**, enter `lelo.vkstech.com` and save — this creates a `CNAME` file in your repo automatically. Make sure your DNS has a `CNAME` record for `lelo` pointing to `<yourusername>.github.io`.
4. Wait a few minutes for the SSL certificate to provision.

### About Vercel
You mentioned Vercel is also connected to the same repo — that's fine, but
**pick one as your live domain** to avoid confusion, since both will
auto-deploy from the same `main` branch. Since `lelo.vkstech.com` already
points at GitHub Pages, I'd disconnect/ignore the Vercel deployment (or use
it purely as a staging preview) unless you'd rather move the custom domain
to Vercel instead — either works technically, just not both at once for the
same domain.

---

## Step 6 — Test it

1. Visit `https://lelo.vkstech.com`. You should see the **Install** banner
   pop in from the top within a second or two (on Chrome/Edge/Android;
   iOS Safari doesn't support `beforeinstallprompt` — there it's "Share →
   Add to Home Screen", which works automatically since the manifest is linked).
2. As a customer: browse, add items to cart, place an order — you'll be
   asked to share location and a phone number (no OTP, no login).
3. As admin: scroll down and tap **Admin login**, or go to
   `https://lelo.vkstech.com/#admin`. Enter `8929394920`, get the real
   OTP by SMS, log in.
4. In the admin dashboard, go to the **Categories** tab and tap
   **🌱 Seed sample categories & products** once — this populates
   Vegetables, Fruits, Dairy, Atta/Rice/Dal, Snacks, and Beverages with a
   few sample items so the store isn't empty. Edit/replace freely after.
5. Place a test order from another browser/incognito tab while the admin
   dashboard is open — you should hear a beep, see a toast, and the order
   should flash and appear at the top of the **Orders** tab in real time.

Note on the notification: this is a **live, in-app alert** — it only fires
while the admin has the dashboard open in a browser tab (as you chose,
this needs no paid Cloud Functions). If you later want true push
notifications when the admin's phone is locked/app closed, that requires
upgrading to Firebase Cloud Messaging + a Cloud Function — happy to add
that later if you need it.

---

## Ongoing maintenance

- **Every time you redeploy `index.html` or `sw.js`**, bump `CACHE_NAME` in
  `sw.js` (e.g. `lelo-v1` → `lelo-v2`), or returning visitors will keep
  seeing the old cached version.
- **Adding more admins**: edit the `ADMIN_PHONES` array near the top of
  `index.html`'s script, *and* update the phone number list inside
  `firestore.rules` / `storage.rules` (both the `isAdmin()` function and
  the storage rule) to match, then re-publish the rules in the Firebase
  Console.
