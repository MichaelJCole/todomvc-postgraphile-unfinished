# TodoMVC Quasar+PostGraphile.

Install Ubuntu Linux and nvm. Install build tools for node-gyp native compilation

```
$ sudo apt install git curl build-essential
```

# Make a project

```
# Make project
mkdir -p myproject
cd myproject
git init

# Set default node version and install
nvm install 12
echo "12" > .nvmrc
nvm use
```

# Create Quasar Front-end

```
# Make a sub-project folder
mkdir -p browser
cd browser

# Install Quasar CLI to create project
npm install -g yarn
yarn global add @quasar/cli

# Create Quasar project (accept defaults)
quasar create

# Start project, check browser
quasar dev
(leave this running and open a new terminal)

# Add GraphQL client and integration
quasar ext add @quasar/apollo

# Configure your endpoint here
cat quasar.extensions.json
```

Great! Read that Quasar documentation on the left, why don't you?

TLDR; You're web app has a `src/router/routes.js` that directs `/` to render `pages/Index.vue` inside `layouts/MainLayout.vue`.

Replace `pages/Index.vue` with this code merged from [Vue Apollo's documentation](https://apollo.vuejs.org/guide/apollo/#queries)

Save and your app should rebuild. Check the console and you'll see some errors:

```
POST http://api.example.com/ net::ERR_NAME_NOT_RESOLVED
Error sending the query 'hello' TypeError: Failed to fetch
Error sending the query 'hello' TypeError: Failed to fetch
```

Well, true, that. You can't get there from here. Let's make a GraphQL server.

```
git add --all .
git commit -am "Create Quasar app"
```

My strategy is to use [Quasar w/ SSR+PWA](https://quasar.dev/quasar-cli/developing-ssr/ssr-with-pwa#Introduction). This creates it's own [node server](https://quasar.dev/quasar-cli/developing-ssr/deploying) which I'll Dockerize.

To deploy, I'll use an nginx ingress in Kubernetes with a "fan-out" configuration

- /data/ -> PostGraphile
- / -> Quasar SSR server (/, /css, /fonts, /icons, /js, and 404s)

# Get a Postgres DB Connection string

See: https://www.graphile.org/postgraphile/quick-start-guide/

```
# Start postgres 13 in docker container
docker run -d -p 5432:5432 --name postgraphile -e POSTGRES_PASSWORD=changepassword postgres:13-alpine

# Install postgres 13 client
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
echo "deb http://apt.postgresql.org/pub/repos/apt/ `lsb_release -cs`-pgdg main" |sudo tee  /etc/apt/sources.list.d/postgresql.list
sudo apt update
sudo apt install postgresql-client-13

# VERIFY:  authenticated connection to your Postgres 13 database
psql "postgres://postgres:changepassword@localhost:5432/postgres" -c "select version();"
```

Build, buy, borrow, or beg, you will need a (working) Postgres "superuser" connection string:

```
postgres://postgres:changepassword@localhost:5432/postgres
```

# Create PostGraphile Backend

PostGraphile has a [CLI server](https://www.graphile.org/postgraphile/usage-cli/), similar to a [simple CLI web server for static files](https://www.npmjs.com/package/http-server).

My application also has a REST API, so we'll use PostGraphile as a [middleware library](https://www.graphile.org/postgraphile/usage-library/) to Koa. Express, Connect, Fastify, and Restify are supported as well.

```
# Make a sub-project folder
cd ..

mkdir -p server
cd server
echo node_modules >> .gitignore
```

Create `package.json`

```
<see package.json>
```

Create `index.js` from this mashup of the [PostGraphile middleware](https://www.graphile.org/postgraphile/usage-library/) and [Koa documentation](https://koajs.com/#cascading)

```
<see index.js>
```

Now run the server:

```
npm install
npm run dev

> server@1.0.0 dev /home/michael/todomvc/server
> nodemon index.js

[nodemon] 2.0.6
[nodemon] to restart at any time, enter `rs`
[nodemon] watching path(s): *.*
[nodemon] watching extensions: js,mjs,json
[nodemon] starting `node index.js`
WARNING: jwtSecret provided, however jwtPgTypeIdentifier (token identifier) not provided.
```

Well, true, that. PostGraphile uses Postgres' schema to create the GraphQL API. Iterating our API is iterating our database.

## But wait, there's more.

We're going to use the "Graphile Starter" project's setup scripts.

```
cd ../server
git clone git@github.com:graphile/starter.git
(cd starter && git checkout ccb7d45a024fdf123d55a1de4bcff32908833f1e)
mv starter/scripts .
# if you're into Next.js, you should really check that out.
# the Nuxt.js version didn't start when I ran it.
```

We'll need this configured to import the Starter project's example database and auth system.

```
# We will use this alot
npm install -g graphile-migrate

# The scripts need this to run:
git init
git add .
git commit -m 'Graphile Starter base'

# It's hacking time.
mkdir -p @app/config
cat << 'EOF' > @app/config/extra.js
process.env.DATABASE_URL = `postgres://${process.env.DATABASE_OWNER}:${process.env.DATABASE_OWNER_PASSWORD}@${process.env.DATABASE_HOST}/${process.env.DATABASE_NAME}`;
process.env.AUTH_DATABASE_URL = `postgres://${process.env.DATABASE_AUTHENTICATOR}:${process.env.DATABASE_AUTHENTICATOR_PASSWORD}@${process.env.DATABASE_HOST}/${process.env.DATABASE_NAME}`;
process.env.SHADOW_DATABASE_URL = `postgres://${process.env.DATABASE_OWNER}:${process.env.DATABASE_OWNER_PASSWORD}@${process.env.DATABASE_HOST}/${process.env.DATABASE_NAME}_shadow`;
process.env.SHADOW_AUTH_DATABASE_URL = `postgres://${process.env.DATABASE_AUTHENTICATOR}:${process.env.DATABASE_AUTHENTICATOR_PASSWORD}@${process.env.DATABASE_HOST}/${process.env.DATABASE_NAME}_shadow`;

const fs = require('fs');

fs.appendFileSync('.env', `DATABASE_URL=${process.env.DATABASE_URL}\n`);
fs.appendFileSync('.env', `AUTH_DATABASE_URL=${process.env.AUTH_DATABASE_URL}\n`);
fs.appendFileSync('.env', `SHADOW_AUTH_DATABASE_URL=${process.env.SHADOW_AUTH_DATABASE_URL}\n`);

EOF

# Run the scripts

# When it asks for your "superuser connection", enter your postgres connection
# from way back in the beginning: postgres://postgres:changepassword@localhost:5432/postgres
npm install
node ./scripts/setup_env.js auto
node ./scripts/setup_db.js

# Woe to the vanquished
rm -rf .git
rm -rf starter
```

Great! You now have a `.env` file and some databases. Test them now:

```
set -a; . ./.env; set +a
cat .env
```

You will see these `.env` values in variables in the next sections `.sql` code.

# Create Postgres DB Schema so PostGraphile can recreate GraphQL API

Checkpoint. You should have these processes running:

- `quasar dev` serving your web app, http://localhost:8081
- `npm run dev` serving your GraphQL API, http://localhost:5678
- Postgres running somewhere running databases.
- A terminal with your `.env` values loaded (`set -a; . ./.env; set +a`)

## IMPORTANT: This is the Postgraphile development workflow:

1. You edit and save `migrations/current.sql` file
2. `graphile-migrate watch` watches `current.sql` and updates Postgres schema
3. `postgraphile watch` watches Postgres schema changes and updates GraphQL schema
4. Repeat until satisfied with GraphQL schema
5. `graphile-migrate commit` and start again

PostGraphile has an [integrated migration system called "graphile-migrate"](https://github.com/graphile/migrate) and [you should read it's documentation now](https://github.com/graphile/migrate#setup).

You can decorate your sql with annotations. For example, [this `volatile` annotation]() [makes "Login" a GraphQL mutation](https://www.graphile.org/postgraphile/custom-mutations/).

## Setup `graphile-migrate`

```
sudo service postgresql start
set -a; . ./.env; set +a

# run this once
graphile-migrate init
```

Which creates these files (in our working directory `server`):

```
.gmrc <- graphile-migrate config file
migrations/committed <- files already committed
migrations/current.sql <- your current work
```

Now edit your .gmrc and change "placeholders" to this. This connects the `.env` to the `.sql` we'll run next:

```
  "placeholders": {
    ":DATABASE_AUTHENTICATOR": "!ENV",
    ":DATABASE_VISITOR": "!ENV"
  },
```

## Reset your databases to factory defaults and re-load `committed/*.sql`

Deletes all your data, and recommits `committed/*.sql`

```
graphile-migrate reset --erase
```

Watches and commits `current.sql`. Leave this running in your terminal.

```
graphile-migrate watch
```

## Load the starter schema

We can build upon the fully-featured auth system from the [PostGraphile Starter project]().

- [Authenticate and manage jwt tokens](https://github.com/graphile/starter/blob/main/%40app/db/migrations/committed/000001.sql#L497).
- [Sends welcome and reset emails]()
- [Create a Jobs queue for workers]()

In a new terminal

```
cd ../server
set -a; . ./.env; set +a

# import Starter project SQL
wget -O migrations/current.sql https://raw.githubusercontent.com/graphile/starter/main/%40app/db/migrations/committed/000001.sql
```

# Some links to documentation.
