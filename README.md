# TodoMVC Quasar+PostGraphile.

Install Ubuntu Linux and nvm

# Make a project

```
# Install Quasar CLI to create project
npm install -g yarn
yarn global add @quasar/cli

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

Well, true that. You can't get there from here. Let's make a GraphQL server.

```
git add --all .
git commit -am "Create Quasar app"
```

# Create PostGraphile Backend

PostGraphile has a [CLI server](https://www.graphile.org/postgraphile/usage-cli/), similar to a [simple CLI web server for static files](https://www.npmjs.com/package/http-server).
