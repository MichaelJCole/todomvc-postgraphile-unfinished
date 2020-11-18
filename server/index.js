const express = require('express');
const morgan = require('morgan');

const { postgraphile } = require("postgraphile");
const app = new express();
const config = {
  JWT_SECRET: process.env.PORT || 'you_should_really_change_this',
  DATABASE_URL: process.env.DATABASE_URL || 'postgres://postgres:changepassword@localhost:5432/postgres',
  PORT: process.env.PORT || 5678
}

// log responses

app.use(morgan('combined'))

// response

app.use(
  postgraphile(
    config.DATABASE_URL,  // Postgres Database
    ["public"],             // GraphQL Schemas to use
    {
      // See https://www.graphile.org/postgraphile/usage-library/#for-development

      // Config
      graphqlRoute: '/gql/graphql', // Change to /graphql and mount app to /gql in http ingress
      graphiqlRoute: '/gql/graphiql', // Remove this feature in production

      // Features
      subscriptions: true,     // Enable GraphQL subscriptions and Websockets
      dynamicJson: true,       // Use raw JSON and skip parsing.  Web-style.
      ignoreRBAC: false,       // Default in next version. Read the
      ignoreIndexes: false,    // Default in next version. documentation
      legacyRelations: "omit", // Don't use deprecated feature
      exportGqlSchemaPath: "schemas/schema.graphql", // Save GraphQL schema here in repo

      // Development
      watchPg: true,           // Watch Postgres schema and rebuild GraphQL API
      graphiql: true,          // Development query web console
      allowExplain(req) { return true }, // Enable Explain
      showErrorStack: "json",  // Better error messages for debugging
      extendedErrors: ["hint", "detail", "errcode"],     // debugging
    }
  )
);

app.listen(3000);