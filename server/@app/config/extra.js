process.env.DATABASE_URL = `postgres://${process.env.DATABASE_OWNER}:${process.env.DATABASE_OWNER_PASSWORD}@${process.env.DATABASE_HOST}/${process.env.DATABASE_NAME}`;
process.env.AUTH_DATABASE_URL = `postgres://${process.env.DATABASE_AUTHENTICATOR}:${process.env.DATABASE_AUTHENTICATOR_PASSWORD}@${process.env.DATABASE_HOST}/${process.env.DATABASE_NAME}`;
process.env.SHADOW_DATABASE_URL = `postgres://${process.env.DATABASE_OWNER}:${process.env.DATABASE_OWNER_PASSWORD}@${process.env.DATABASE_HOST}/${process.env.DATABASE_NAME}_shadow`;
process.env.SHADOW_AUTH_DATABASE_URL = `postgres://${process.env.DATABASE_AUTHENTICATOR}:${process.env.DATABASE_AUTHENTICATOR_PASSWORD}@${process.env.DATABASE_HOST}/${process.env.DATABASE_NAME}_shadow`;

const fs = require('fs');

fs.appendFileSync('.env', `DATABASE_URL=${process.env.DATABASE_URL}\n`);
fs.appendFileSync('.env', `AUTH_DATABASE_URL=${process.env.AUTH_DATABASE_URL}\n`);
fs.appendFileSync('.env', `SHADOW_DATABASE_URL=${process.env.SHADOW_DATABASE_URL}\n`);
fs.appendFileSync('.env', `SHADOW_AUTH_DATABASE_URL=${process.env.SHADOW_AUTH_DATABASE_URL}\n`);

