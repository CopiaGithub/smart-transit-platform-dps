# Frontend

Angular app for Transit Display Platform (scaffolded from DMS frontend patterns).

## Stack

- Angular **21.2** (latest supported on Node 22.12; Angular 22 needs Node ≥ 22.22.3)
- Angular Material + CDK
- Argon theme tokens (`src/theme/`)
- CDS component library (`src/app/components/cds/`)
- Tailwind CSS 3

## Run

```bash
cd apps/frontend
npm start
```

Open http://localhost:4200/

Demo login: any non-empty username/password (stub auth).

## Structure

```
src/app/
  components/   # CDS, sidebar, mainlayout, popup, …
  pages/        # login, home
  services/     # auth, storage, page-header, …
  guards/       # AuthGuard
  interceptor/  # JWT interceptor
  environments/
```

## Notes

- LHS menu is static in `mainlayout` — replace with role-assigned API later.
- Auth login is stubbed in `AuthService.login()` — wire to backend when ready.
