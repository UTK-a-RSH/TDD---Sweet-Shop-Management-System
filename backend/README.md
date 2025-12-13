# Incubyte Backend (Express + TypeScript)

This is a small TypeScript + Express template with a couple of example REST endpoints.

Quick start

1. From the repository root:

```bash
cd backend
npm install
npm run dev       # development (ts-node-dev)
# or
npm run build
npm start         # run compiled JS
```

Endpoints

- GET /api/health -> { status: 'ok', timestamp }
- GET /api/users -> list users
- GET /api/users/:id -> get user
- POST /api/users -> create user { name, email }

Notes

- This project uses `nvm` for Node version management. You installed Node via nvm earlier in this session. If you want the LTS version instead, run:

```bash
nvm install --lts --reinstall-packages-from=current --latest-npm
nvm alias default lts/*
```

- To uninstall nvm, see the nvm README.
