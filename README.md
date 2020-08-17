# Docmate

Node.js Server.

Contains:

- `/hasura` Hasura migrations and metadata
- `docker-compose.yaml` for local hasura dev env.
- `/src` Node.js server source `


## Build

### Docker setup

Create a `.env` file at root redirectory:

```
ACTION_HANDLER_URL=http://localhost:3000
DOCMATE_JWT_SECRET=myadminsecretkey
DOCMATE_HASURA_SECRET={"type": "HS256", "key": "6&#X6((t>:^v>CM3g5NYfY63Z4=KN4Hx"}
IMAGES_PATH=/tmp
```

```bash
docker-compose up -d
```

This creates a postgresql, hasura container.

### Run Nodejs server

```bash
yarn

# open hasura console
npm run console

# tsc
npm run tsc

# node server
npm run dev
```
