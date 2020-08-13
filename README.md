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

- SENTRY_DSN
- SENDGRID_API_KEY
- IMAGES_PATH
- ENABLE_PRO
- ENABLE_USER_VERIFY
- SUBDOMAIN_DOC
- READ_ENV
- GQL_URL