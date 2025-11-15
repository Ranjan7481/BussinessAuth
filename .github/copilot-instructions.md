## Purpose
Short, actionable guidance for AI coding agents working on this repository (Node.js + Express + Mongoose backend).

## Big picture (what this repo is)
- Runtime: Node.js (CommonJS, see `package.json` with "type": "commonjs").
- Entry point: `server.js` (main app bootstrap). Expect dotenv, DB connect, middleware, routes to be wired here.
- Structure: `src/` follows a small MVC-ish layout: `src/config/` (DB + config), `src/models/` (Mongoose schemas, e.g. `user.js`), `src/controllers/` (request handlers).
- Data layer: MongoDB via `mongoose` (check `src/config/db.js` for connection code).
- Auth & security: `passport` (+ Google OAuth), `jsonwebtoken` (JWT), `express-session`, `cookie-parser`, `bcryptjs` (password hashing), `express-rate-limit`, `cors`.
- Email: `nodemailer` is included for outgoing mails.

## How to run (developer workflows)
- Install deps: `npm install`.
- Start in dev: `npm run dev` (uses `nodemon server.js`).
- Start production-like: `npm start` (runs `node server.js`).
- Expect an `.env` file with at least these keys: `MONGO_URI`, `JWT_SECRET`, `SESSION_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and email SMTP credentials (`EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS`). If missing, ask the maintainer.

Example quick check (dev):
```bash
npm install
npm run dev
# then open http://localhost:3000 or run a health check endpoint if present
```

## Project-specific conventions and patterns
- Use CommonJS requires/exports (do not convert to ES modules). Files in `src/` generally `require(...)` and `module.exports`.
- Mongoose models live in `src/models/` and are singular (e.g., `User` in `user.js`). Follow existing naming when creating new models.
- Controllers live in `src/controllers/`. Prefer exporting handler functions (req, res) and keep routing in server.js or a `routes/` file if added.
- Config & connection: `src/config/db.js` should export a function that connects to MongoDB; `server.js` is expected to call it during bootstrapping.
- Authentication: look for patterns using both session-based (`express-session` + `passport`) and token-based (`jsonwebtoken`) approaches; new auth code should preserve backward compatibility.

## Integration points to check first
- Passport Google OAuth: search for `passport-google-oauth20` usage and `passport.use(...)` setup.
- JWT usage: grep for `jsonwebtoken` to find sign/verify locations (auth middleware).
- Email flows: search for `nodemailer` to locate sign-up / password-reset flows.
- DB schemas: open `src/models/*.js` to see fields and validation. Example: `src/models/user.js`.

## Investigation checklist for new PRs or features
1. Open `server.js` to confirm middleware ordering (dotenv, DB connect, body parsers, cookie/session, passport initialize/session, routes).
2. Confirm `src/config/db.js` handles connection errors and exports the connection or connect function.
3. Inspect `src/models/user.js` for password hashing and token fields before changing auth logic.
4. When adding endpoints, follow existing folder patterns: place business logic in controllers and keep route wiring minimal.

## Helpful quick searches (use these to find integration code fast)
- grep -R "passport" -n
- grep -R "jsonwebtoken" -n
- grep -R "nodemailer" -n
- grep -R "mongoose" -n

## Known gaps / things to confirm with maintainers
- Several repo files appear incomplete (e.g., `server.js`, `src/config/db.js`, `src/models/user.js`) — verify intended structure and environment.
- Tests: there are no automated tests present; add small unit/integration tests for new features.

## Examples (how to wire common tasks)
- DB connect (expected pattern): `const connectDB = require('./src/config/db'); connectDB(process.env.MONGO_URI);`
- Hash password: use `bcryptjs.hash(password, saltRounds)` before saving User.
- Issue JWT: `jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' })` and verify in middleware.

## If you change or add files
- Keep using CommonJS. Add new models under `src/models/` and controllers under `src/controllers/`.
- Update README or add short notes in `src/config/` if you add new required env vars.

---
If any section here is unclear or you want the file to include more repository-specific examples (once core files are completed), tell me which files to inspect and I will update this guidance.
