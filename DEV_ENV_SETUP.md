# Setup Evaluation Development Environment

This is a "guide" for experienced developers to evaluate PostGraphile. It's purpose is to demonstrate how to quickly setup, evaluate, and start developing features with PostGraphile.

This guide:

1. Setup a PostGraphile development environment
2. Demonstrate JWT authentication
3. Demonstrate how to iterate development

Development workflow:

1. Change Postgres schema using SQL, comments, and annotations
2. PostGraphile watches for schema changes and updates GraphQL api automatically
3. Backup Postgres schema to backup your work
4. Use database migration scripts for rolling updates

## About this guide

The commands below are meant to be run on Ubuntu 20.04.

While not required, [Docker Desktop for Windows/Mac](https://docs.docker.com/docker-for-windows/install/) adds Kubernetes/Docker-compose cluster for rapid micro-service development and prototypeing.

The code samples below are for Ubuntu's terminal prompt called "bash".

- `# Comment` indicates a comment.
- `$ command some arg` are commands.
- - `$` is the terminal prompt (your prompt will be different).
- - Type `command some arg` into the terminal to execute the command.
- Other lines are expected output. If no expected output is shown, check it is free of errors.

## Install Ubuntu 20.04

Linux, Mac, and BSD users may need to modify the syntax slightly.

Windows users can [install Ubuntu 20.04 from the Windows Store using WSL2](https://www.microsoft.com/en-us/p/ubuntu-2004-lts/9n6svws3rx71).

Open Ubuntu and verify:

```
# VERIFY: bash
$ echo $SHELL
/usr/bin/bash
```

## Install node and nvm

Recommended: [use nvm to install node versions](https://github.com/nvm-sh/nvm#installing-and-updating)

```
# Install nvm
$ curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.0/install.sh | bash

# VERIFY:  node
$ node -v
v14.15.0
$ npm -v
6.14.8
```

Your versions may be different. Postgraphile requires Node version 8+

## Install Postgres on dev machine

See: https://www.graphile.org/postgraphile/quick-start-guide/

```
# Install postgres and build tools
$ sudo apt install postgresql postgresql-contrib git curl build-essential

# Start postgres background service
$ sudo service postgresql start

# VERIFY:  connection between postgres server <-> psql client
sudo -u postgres psql "postgres:///" -c "select 1 + 1 as two;"

# Configure admin user `postgres`
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'changepassword';"

# Create a database
sudo -u postgres createdb demo

# VERIFY:  authenticated connection to your database
sudo -u postgres psql "postgres://postgres:changepassword@localhost:5432/demo" -c "select 1 + 1 as two;"
```

Mac will be different, but ultimately you need the database connection string in the last command to work.

## Install Postgraphile

For evaluation, we install postgraphile globally, allowing us to run an unmodified server from the command line.

Once started, the unmodified server will connect to a database, inspect it's schema, and create a GraphQL service from the schema, commends, and annotations.

```
# Install Postgraph
$ npm install -g postgraphile
```

## Start Postgraphile

```
# Start Postgres
$ sudo service postgresql start

# Run Postgraphile
$ postgraphile -c "postgres://postgres:changepassword@localhost:5432/demo"
PostGraphile v4.9.2 server listening on port 5000
```

Open another bash terminal and test your GraphQL endpoint (this error is appropriate):

```
# Verify Postgraphile
$ curl http://localhost:5000/graphql
{"errors":[{"message":"Only `POST` requests are allowed."}]}
```

Using your browser, open the [enhanced GraphiQL development console](http://localhost:5000/graphiql).

#### Special challenges on Windows 10 w/ WSL2

If you cannot open [GraphiQL development console](http://localhost:5000/graphiql), it may be [one of many issues with Microsoft's networking integration](https://github.com/microsoft/WSL/issues/5298#issuecomment-695181844).

As a workaround, we will configure Ubuntu to see "localhost" as the ip6 loopback address "::1", instead of "127.0.0.1" using Ubuntu's /etc/hosts file.

In bash, run `sudo nano /etc/hosts`. Then edit this line:

```
127.0.0.1      localhost
```

To look like this line (Ctrl-s to save. Ctrl-x to exit):

```
::1            localhost
```

Reboot everything and try again:

```
$ sudo service postgresql start
$ postgraphile -c "postgres://postgres:changepassword@localhost:5432/demo"
```

## Iteration #1: Run the "Graphile Starter" project

You will need:

1. A bash terminal to run PostGraphile
2. A second bash terminal to run other commands
3. A web browser
4. [To read this documentation](https://github.com/graphile/starter).

We will:

1. Load the starter example database into PostGraphile
2. Build and run the web app

```
# Get source
$ git clone git@github.com:graphile/starter.git
$ cd starter
$ la
```

Now, install and build the application

```
# The cool kids use yarn
$ npm install -g yarn

# Install project packages
$ yarn

# Setup the database
$ yarn run setup
# - What would you like to call your database? graphile_starter
# - What's the hostname of your database server (include :port if it's not the default :5432)? localhost
# - "superuser connection string": postgres://postgres:changepassword@localhost:5432/demo
# - We're going to drop (if necesary): y
...

# Start the server
$ yarn start
...
@app/graphql: [12:46:09] Parse configuration [started]
...
(RUN) @app/server: My_Project_Here listening on port 5678
(RUN) @app/server:   Site:     http://localhost:5678
(RUN) @app/server:   GraphiQL: http://localhost:5678/graphiql
...
(TEST) graphile-migrate[shadow]: dropped database 'graphile_starter_test'
(TEST) graphile-migrate[shadow]: recreated database 'graphile_starter_test'
(TEST) Schema updated
(TEST)
(TEST) graphile-migrate[shadow]: Running migration '000001.sql'
(TEST) graphile-migrate[shadow]: 1 committed migrations executed
(TEST) graphile-migrate[shadow]: Already up to date
(TEST) [2020-11-16T18:46:31.259Z]: Running current.sql
(TEST) [2020-11-16T18:46:31.325Z]: Finished (66ms; excluding actions: 6ms)
...
(TEST) [jest]
(TEST) [jest] Test Suites: 10 passed, 10 total
(TEST) [jest] Tests:       68 passed, 68 total
(TEST) [jest] Snapshots:   32 passed, 32 total
(TEST) [jest] Time:        3.501s
(TEST) [jest] Ran all test suites related to changed files.
(TEST) [jest]
... Server output continues
```

From here, you can:

- View the [database web console](http://localhost:5678/graphiql)
- View the [GraphQL endpoint](http://localhost:5678/graphql)
- View the [web application with your browser](http://localhost:5678/)

The demo app includes a solid auth implementation and a multi-tenant "organization" template.

To continue, make a test account:

- Open web app -> Signin (top right) -> Create an account button
- Logout
- Log back in
- Create an organization

Using the [database web console](http://localhost:5678/graphiql), query "organizations" to find your new organization. [Learn more about GraphQL](https://graphql.org/graphql-js/)

## Iteration #2: jwt tokens

A "login" is represented by a jwt_token.  
A jwt_token is generated from a GraphQL mutation.
A GraphQL mutation is executed by posting JSON to the endpoint: http://localhost:5678/graphql

```
{
    "operationName":"Login",

    "variables":{"username":"test@michaelcole.com","password":"password"},

    "query":"mutation Login($username: String!, $password: String!) {\n  login(input: {username: $username, password: $password}) {\n    user {\n      id\n      username\n      name\n      __typename\n    }\n    __typename\n  }\n}\n"}
}
```

However our GraphQL endpoint is protected by CSRF:

```
$ curl -d '{"hello":"world"}' http://localhost:5678/graphql
{"errors":[{"message":"ERROR: Invalid CSRF token: please reload the page.","code":"EBADCSRFTOKEN"}]}
```

CSRF protection is provided by `csruf` in this call stack:

- https://github.com/graphile/starter/blob/main/%40app/server/src/middleware/installCSRFProtection.ts#L5
- https://github.com/graphile/starter/blob/main/%40app/server/src/middleware/index.ts#L16
- https://github.com/graphile/starter/blob/main/%40app/server/src/app.ts#L107

The CSRF token is packaged using SSR here:

- https://github.com/graphile/starter/blob/main/%40app/server/src/middleware/installSSR.ts#L38

And can be found highlighted in the output like this:

```
curl http://localhost:5678 | grep CSRF_TOKEN
```

The CSRF token updates unpredictable, so We can fix this by setting the `referer` header. Remember the browser prevents web applications from setting `referer` to prevent cross-site scripting. Note that `\` below allows multi-line commands):

```
curl http://localhost:5678/graphql \
  --cookie-jar cookies.txt --cookie cookies.txt \
  -H "Content-Type: application/json" \
  --referer http://localhost:5678/graphiql \
  --data '{ "query": "{ currentUser { id, name, isVerified, isAdmin } }"}'

{"data":{"currentUser":null}}
```

Now, let's login:

```
curl http://localhost:5678/graphql \
  --cookie-jar cookies.txt --cookie cookies.txt \
  -H "Content-Type: application/json" \
  --referer http://localhost:5678/graphiql \
  -d '{"variables":{"username":"test@michaelcole.com","password":"password"},"query":"mutation Login($username: String!, $password: String!) {\n  login(input: {username: $username, password: $password}) {\n    user {\n      id\n      username\n      name\n      __typename\n    }\n    __typename\n  }\n}\n"}'

{"data":{"currentUser":{"id":"e60dfc01-8693-4917-8763-2356b51928fb","name":"test","isVerified":true,"isAdmin":false}}}
```

```
curl http://localhost:5678/graphql \
  --cookie-jar cookies.txt --cookie cookies.txt \
  -H "Content-Type: application/json" \
  --referer http://localhost:5678/graphiql \
  --data '{ "query": "{ currentUser { id, name, isVerified, isAdmin } }"}'

{"data":{"currentUser":{"id":"e60dfc01-8693-4917-8763-2356b51928fb","name":"test","isVerified":true,"isAdmin":false}}}
```

## Iteration #2: Add Todo list

Your application's database is defined in: `graphile-starter/@app/db/migrations/committed/000001.sql`

It includes:

- user accounts (w/ verification and password reset)
- job_queue (used for sending emails)
- jwt tokens (for web app authentication)
- multi-tenant organization+invite template
