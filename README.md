# Docmate

Node.js Server.

Contains:

- `/hasura` Hasura migrations and metadata
- `docker-compose.yaml` for local hasura dev env.
- `/src` Node.js server source `


## Build

```bash
yarn

# run hasura in docker
docker-compose up -d

# open hasura console
npm run console

# tsc
npm run tsc

# node server
npm run dev
```

## ENV

### server

- SENTRY_DSN
- SENDGRID_API_KEY
- ENABLE_PRO
- ENABLE_USER_VERIFY
- SUBDOMAIN_DOC
- GQL_URL

### EE

- DOCMATE_HASURA_SECRET
- DOCMATE_JWT_SECRET
