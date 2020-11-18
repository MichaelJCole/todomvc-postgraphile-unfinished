# TodoMVC Quasar+PostGraphile.

This guide works in Ubuntu 20.04. Windows users can:

- install Ubuntu 20.04 from the Windows Store using WSL2.
- install Docker Desktop for Windows for easy Docker/Kubernetes integration.

Then configure Ubuntu 20.04 in a terminal:

- `sudo apt install git curl build-essential`
- Install [Node Version Manager (nvm)](https://github.com/nvm-sh/nvm)

# Make a new project folder

```
# Make project
mkdir -p myproject
cd myproject
git init

# Set default node version and install
nvm install 12
echo "12" > .nvmrc
nvm use

# Facebook's package manager
npm install -g yarn
```

# Create the Front-end w/ Quasar

Quasar is an attractive front-end web framework, built on Vue, which compiles to SPA, SSR, Electron, Cordova, et all.

## Setup Quasar w/ Apollo graphql extension

```
# Make a sub-project folder
mkdir -p browser
cd browser

# Install Quasar CLI to create project
yarn global add @quasar/cli

# Create Quasar project (accept defaults)
quasar create

# Add GraphQL client and integration
quasar ext add @quasar/apollo

# Configure your endpoint here
cat quasar.extensions.json

# Start project, check browser
quasar dev
(leave this running and open a new terminal)
```

## How Quasar works

Great! Read that Quasar documentation on the left, why don't you?

TLDR;

- Web app has a `src/router/routes.js`
- `/` route directs Vue to render `src/layouts/MainLayout.vue` with `src/pages/Index.vue` content

Replace `pages/Index.vue` with this code merged from [Vue Apollo's documentation](https://apollo.vuejs.org/guide/apollo/#queries)

```
<Index.vue>
```

Save `Index.vue` and your app should rebuild. Check the console and you'll see some errors:

```
POST http://api.example.com/ net::ERR_NAME_NOT_RESOLVED
Error sending the query 'hello' TypeError: Failed to fetch
Error sending the query 'hello' TypeError: Failed to fetch
```

Well, true, that. We need a GraphQL server. Let's save our work and get to that.

```
git add --all .
git commit -am "Create web app front-end with Quasar"
```

## Deploying Quasar

[Quasar has a nifty SSR w/ PWA takeover](https://quasar.dev/quasar-cli/developing-ssr/ssr-with-pwa#Introduction) feature that creates it's own [node server](https://quasar.dev/quasar-cli/developing-ssr/deploying) which is easy to Dockerize.

To deploy, we can use a Kubernetes nginx ingress in a ["fan-out" configuration](https://kubernetes.io/docs/concepts/services-networking/ingress/#simple-fanout). Nginx will inspect HTTP headers to route requests based on path. See [here for rewrite](https://kubernetes.github.io/ingress-nginx/examples/rewrite/) and [here for websockets](https://gist.github.com/jsdevtom/7045c03c021ce46b08cb3f41db0d76da#file-ingress-service-yaml).

- `/gql` -> PostGraphile (`/graphql`, `/graphiql`)
- `/` -> Quasar SSR server (`/`, `/css`, `/fonts`, `/icons`, `/js`, and 404s)

# Creating the Backend

See also: https://www.graphile.org/postgraphile/quick-start-guide/

## First we need a Postgres 13 "superuser" connection string

We need a "superuser" connection string to enable extensions on new databases, etc.

Simplest thing that could possibly work is to use Docker:

```
# Create docker network for postgres and pgadmin to share
docker network create --driver bridge pgnetwork

# Start postgres 13 in docker container
docker run -d -p 5432:5432 --network="pgnetwork" --name postgres -e POSTGRES_PASSWORD=changepassword postgres:13-alpine

# Start pgadmin in docker container
docker run -d -p 5555:80 --network="pgnetwork" --name pgadmin4 -e PGADMIN_DEFAULT_EMAIL=pgadmin@example.com -e PGADMIN_DEFAULT_PASSWORD=pgadminpassword dpage/pgadmin4:4.28

# Login and make connection.  Use "postgres" as the host (--name postgres)
sensible-browser http://localhost:5555/browser/#
```

You can also verify your install from the Ubuntu command line with `psql`:

```
# Install postgres 13 client
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
echo "deb http://apt.postgresql.org/pub/repos/apt/ `lsb_release -cs`-pgdg main" |sudo tee  /etc/apt/sources.list.d/postgresql.list
sudo apt update
sudo apt install postgresql-client-13

# VERIFY:  authenticated connection to your Postgres 13 database
psql "postgres://postgres:changepassword@localhost:5432/postgres" -c "select version();"
```

To continue, you will need a (working) Postgres 13 "superuser" connection string:

```
postgres://postgres:changepassword@localhost:5432/postgres
```

## Create Express server w/ PostGraphile middleware

PostGraphile has a [CLI server](https://www.graphile.org/postgraphile/usage-cli/), similar to a [simple CLI web server for static files](https://www.npmjs.com/package/http-server).

PostGraphile also has a [middleware library](https://www.graphile.org/postgraphile/usage-library/) for Express, Koa, and Connect. Fastify, and Restify are supported as well.

```
# Make a sub-project folder
cd ..
mkdir -p server
cd server
echo node_modules >> .gitignore
```

Copy/paste `package.json`

```
<see package.json>
```

Copy/paste `index.js` from this kitbash of the [PostGraphile middleware](https://www.graphile.org/postgraphile/usage-library/).

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
```

Groovy. PostGraphile uses Postgres' schema to create the GraphQL API. Iterating our GraphQL API is done by iterating our database schema.

## Initialize our app using Starter project schema

We can build upon the fully-featured auth system built for the [PostGraphile Starter project]().

- [Authenticate and manage jwt tokens](https://github.com/graphile/starter/blob/main/%40app/db/migrations/committed/000001.sql#L497).
- [Sends welcome and reset emails]()
- [Create a Jobs queue for workers]()

We're going to use the "Graphile Starter" project's setup scripts and database.

```
cd ../server

# Get Starter scripts to setup .env file and configure database
git clone git@github.com:graphile/starter.git
(cd starter && git checkout ccb7d45a024fdf123d55a1de4bcff32908833f1e)
mv starter/scripts .

# Save this file for later
cp starter/@app/db/migrations/afterReset.sql .

# if you're into Next.js, you should really check that out repo.
# the Nuxt.js version didn't work so I made this.

# This tool will clean Postgres and migrate .sql into the schema.  We will use this alot.
npm install -g graphile-migrate

# The setup scripts need this to run:
git init
git add .
git commit -m 'Graphile Starter base'

# Hacking overtime!  More settings
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
npm install

# If asked for your "superuser connection", enter your postgres connection
# from way back in the beginning: postgres://postgres:changepassword@localhost:5432/postgres
node ./scripts/setup_env.js auto
node ./scripts/setup_db.js

# Woe to the vanquished.
rm -rf .git
rm -rf starter
```

Great! You now have a `.env` file with a bunch of settings and some database magic.

You can load them into your shell with `set -a; . ./.env; set +a`, and into Node.js with `require('dotenv').config();`

These `.env` values can also be replaced into `.sql` code, by configuring `.gmrc` below.

## Checkpoint. You should have these processes running:

- `quasar dev` serving your web app, http://localhost:8081
- `npm run dev` serving your GraphQL API, http://localhost:5678
- Postgres running somewhere running databases.
- A terminal with your `.env` values loaded (`set -a; . ./.env; set +a`)

## IMPORTANT: Postgraphile development workflow:

PostGraphile has an [integrated migration system called "graphile-migrate"](https://github.com/graphile/migrate) and [you should read it's documentation now](https://github.com/graphile/migrate#setup).

1. `npm run dev` watches Postgres schema and updates GraphQL API
2. `graphile-migrate watch` watches `migrations/current.sql` and updates Postgres schema
3. You edit and save `migrations/current.sql` file
4. `current.sql` -> Postgres Schema -> GraphQL API -> Graphiql Web Admin / Web app
5. Repeat until satisfied with GraphQL API feature
6. `graphile-migrate commit` to commit feature and start a new one

You can decorate your `.sql` with [annotations to control GraphQL](https://www.graphile.org/postgraphile/custom-mutations/).

## Setup `graphile-migrate`

Let's get familiar with `graphile-migrate`

```
# Load our project config into the shell
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

Now edit your `.gmrc` and change "placeholders" to this. This connects `.env` values to `.sql` template variables:

```
  "placeholders": {
    ":DATABASE_AUTHENTICATOR": "!ENV",
    ":DATABASE_VISITOR": "!ENV"
  },
```

Also in `.gmrc`, replace this section. `afterReset.sql` contains superuser commands to enable extensions.

```
  "afterReset": [
    "afterReset.sql",
    // { "_": "command", "command": "graphile-worker --schema-only" },
  ],
```

Move the `afterReset.sql` we saved into place:

```
mv afterReset.sql migrations
```

## Reset your database

Resetting your database:

- drops and creates all your databases
- runs `afterReset.sql`
- run `committed/*.sql`

Run this command:

```
graphile-migrate reset --erase
```

Run this command to watch `current.sql`. Leave this running in your terminal.

```
graphile-migrate watch
```

Now, [view your current GraphQL API using the integrated Graphiql web admin](http://localhost:5678/gql/graphiql)

## Load the starter schema

When you save your `current.sql` work it gets committed or blows up.

We can quickly add functionality by pulling the committed `000001.sql` from the starter that we know works.

```
# import Starter project SQL
wget -O migrations/current.sql https://raw.githubusercontent.com/graphile/starter/main/%40app/db/migrations/committed/000001.sql
```

Your `graphile-migrate watch` tab should have some new output. `current.sql` ran successfully.

```
graphile-migrate: Up to date — no committed migrations to run
[2020-11-18T06:05:39.313Z]: Running current.sql
[2020-11-18T06:05:39.465Z]: Finished (151ms)
[2020-11-18T06:29:21.036Z]: Running current.sql
[2020-11-18T06:29:21.085Z]: current.sql unchanged, skipping migration
[2020-11-18T06:29:21.090Z]: Finished (53ms)
```

You should see significant changes to [your GraphQL API](http://localhost:5678/gql/graphiql)

Let's commit our work to the database:

```
$ graphile-migrate commit

graphile-migrate[shadow]: dropped database 'graphile_starter_shadow'
graphile-migrate[shadow]: recreated database 'graphile_starter_shadow'
graphile-migrate[shadow]: Up to date — no committed migrations to run
graphile-migrate: New migration '000001.sql' created
graphile-migrate[shadow]: Running migration '000001.sql'
graphile-migrate[shadow]: 1 committed migrations executed
graphile-migrate: Running migration '000001.sql'
graphile-migrate: 1 committed migrations executed
```

Commit these files to `git` and let's try this out.

# GraphiQL

Open the [graphiql web console](http://localhost:5678/gql/graphiql), and let's run some queries:

```
query MyQuery {
  currentUser {
    id
  }
}
--- response
{
  "data": {
    "currentUser": null
  }
}
```

Great, let's create an account and log in.

```

```
