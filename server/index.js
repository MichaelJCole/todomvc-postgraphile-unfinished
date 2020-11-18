require('dotenv').config();

const express = require('express');
const morgan = require('morgan');
const passport = require('passport');
LocalStrategy = require('passport-local').Strategy;
const { postgraphile } = require('postgraphile');

const app = new express();
const config = {
  JWT_SECRET: process.env.PORT || 'you_should_really_change_this',
  DATABASE_URL: process.env.DATABASE_URL || 'postgres://postgres:changepassword@localhost:5432/postgres',
  PORT: process.env.PORT || 5678,
  SESSION_SECRET: process.env.SECRET || 'you_should_really_change_this_as_well'
}

// log responses

app.use(morgan('combined'))

// response

app.use(
  postgraphile(
    config.DATABASE_URL,  // Postgres Database
    ["public", "app_public"],  // GraphQL Schemas to use
    {
      // See https://www.graphile.org/postgraphile/usage-library/#for-development

      // Config
      graphqlRoute: '/gql/graphql', // Change to /graphql and mount app to /gql in http ingress
      graphiqlRoute: '/gql/graphiql', // Remove this feature in production
      disableQueryLog: true,   // we use morgan above

      // Features
      //subscriptions: true,     // Enable GraphQL subscriptions and Websockets, see @graphile/pg-pubsub
      dynamicJson: true,       // Use raw JSON and skip parsing.  Web-style.
      ignoreRBAC: false,       // Default in next version. Read the
      ignoreIndexes: false,    // Default in next version. documentation
      setofFunctionsContainNulls: false, // Reduce nulls in schema
      legacyRelations: "omit", // Don't use deprecated feature
      exportGqlSchemaPath: "schemas/schema.graphql", // Save GraphQL schema here in repo

      // Development
      watchPg: true,           // Watch Postgres schema and rebuild GraphQL API
      graphiql: true,          // Development query web console
      //allowExplain(req) { return true }, // Enable Explain in GraphiQL results
      showErrorStack: "json",  // Better error messages for debugging
      extendedErrors: ["hint", "detail", "errcode"],     // debugging
      appendPlugins: [
        require('./src/PassportLoginPlugin'),
      ],
    }
  )
);

// REST Authentication API w/ Passport

app.use(require('cookie-parser'));
app.use(require('body-parser'));
app.use(require('express-session')({ secret: config.SESSION_SECRET, resave: false, saveUninitialized: false }));

app.use(passport.initialize());
app.use(passport.session());	// Required for persistent login sessions (optional, but recommended)

// More passport setup



// Express/Passport setup here...

passport.use(new LocalStrategy(
	{
		usernameField: 'email',
        passwordField: 'password'
	},
	function(email, password, done) {
        User.loadOne({ email: email }).then(function(user) {
            if (!user || !user.authenticate(password)) {
                return done(null, false, { message: 'Incorrect email or password.' });
            }

            done(null, user);
        });
    })
);

app.listen(config.PORT, () => {
  console.log(`GraphQL api endpoint: http://localhost:${config.PORT}/gql/graphql`);
  console.log(`GraphQL web console: http://localhost:${config.PORT}/gql/graphiql`);
});