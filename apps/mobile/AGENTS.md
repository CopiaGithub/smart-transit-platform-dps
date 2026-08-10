# Expo HAS CHANGED

This project targets **Expo SDK 54** — pinned because the Expo Go build on the
Play Store / App Store supports SDK 54 only. Read the exact versioned docs at
https://docs.expo.dev/versions/v54.0.0/ before writing any code.

Bump this file whenever the SDK is upgraded.

# Where the knowledge is

This app is bound to a live ASP.NET Core API. Two things are worth reading
before changing anything, rather than re-deriving them:

- **`BINDING.md`** (this folder) — how the app talks to the API. Read it before
  touching `src/api/` or `src/services/apiClient.ts`. It covers the one thing
  that breaks naive clients: **every response is HTTP 200, including failures**,
  so the outcome is in the body, not the status.
- **`../backend/`** — the API. Its DTOs are the final word when docs disagree.

Run the backend from `apps/backend` with `dotnet run`. It listens on
`0.0.0.0:5199` so a phone on the same Wi-Fi can reach it. If it seems to exit
without saying why, the reason is in `apps/backend/Logs/bootstrap-*.txt` —
startup crashes go there, not to `log-*.txt`.
