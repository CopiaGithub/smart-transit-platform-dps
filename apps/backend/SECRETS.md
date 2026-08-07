# Secrets

Nothing secret belongs in `appsettings*.json` — this repository is public.
The keys are present but empty; the values come from user secrets locally and
from environment variables in a deployment.

The app refuses to start if the connection string or the JWT key is missing,
with a message naming the command to run.

## Local setup

Run once, from `apps/backend`:

```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=<host>;Database=<db>;User Id=<user>;Password=<password>;TrustServerCertificate=True;"
dotnet user-secrets set "JwtSettings:SecretKey" "<64+ random characters>"
dotnet user-secrets set "Seed:AdminPassword" "<seed password>"
```

Ask a teammate for the current values — they are not written down here.

Check what you have:

```bash
dotnet user-secrets list
```

Secrets are stored outside the repository, per user, at
`%APPDATA%\Microsoft\UserSecrets\<UserSecretsId>\secrets.json`.

## Keys

| Key | What it is |
|---|---|
| `ConnectionStrings:DefaultConnection` | SQL Server connection string |
| `JwtSettings:SecretKey` | Token signing key. Anyone holding it can mint a token for any user and any role — treat it as the most sensitive value here |
| `Seed:AdminPassword` | Password given to demo accounts on first seed |
| `Seed:DevPassword` | Only used when `Seed:SimpleDevLogins` is on, which is Development-only |

## In a deployment

Use environment variables — double underscore replaces the colon:

```
ConnectionStrings__DefaultConnection=...
JwtSettings__SecretKey=...
```

## These values are in the git history

Blanking the files does not remove what was already committed. Anyone with
the repository can read the old values from any earlier commit.

**Both must be rotated:**

1. Change the SQL Server password, then update user secrets and the deployment.
2. Generate a new `JwtSettings:SecretKey`. Every existing token stops working,
   so everyone signs in again — do it at a quiet time.

Rewriting history would also work but breaks every clone and open branch; on a
key that is already public, rotating is the change that actually helps.
