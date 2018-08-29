import { introspectSchema, makeExecutableSchema, makeRemoteExecutableSchema, mergeSchemas } from 'graphql-tools';
import { HttpLink } from 'apollo-link-http';
import fetch from 'node-fetch';
import { ApolloServer } from 'apollo-server';
import knex from 'knex';
import pg from 'pg';

const PG_CONNECTION_STRING= process.env.PG_CONNECTION_STRING;

// Create knex client for connecting to Postgres
const createKnex = () => {
  pg.defaults.ssl = true;
  const knexClient = knex({
    client: 'pg',
    connection: PG_CONNECTION_STRING
  });
  return knexClient;
};

// Create executable schema from user GraphQL API
const createUserSchema = async () => {
  // Create an Apollo link with 'uri' of user API
  const link = new HttpLink({
    uri: `https://bazookaand.herokuapp.com/v1alpha1/graphql`,
    fetch
  });
  // Get remote schema
  const remoteUserSchema = await introspectSchema(link);
  // Make executable schema
  return makeRemoteExecutableSchema({
    schema: remoteUserSchema,
    link
  });
};

// Type def for user_average_age schema
const typeDefs = `
  type Query {
    user_average_age: Float
  }
`;

// Resolvers for user_average_age query
const resolvers = {
  Query: {
    user_average_age: async (root, args, context, info) => {
      const response = await context.knex('user')
        .avg('age');
      return response[0].avg;
    },
  }
};

const createNewSchema = async () => {
  // Make and get executable user Schema
  const userExecutableSchema = await createUserSchema();
  // Make executable user_average_age schema
  const averageAgeSchema = makeExecutableSchema({
    typeDefs,
    resolvers
  });
  // Merge the two schemas
  return mergeSchemas({
    schemas: [
      userExecutableSchema,
      averageAgeSchema
    ]
  });
};

const runServer = async () => {
  // Get newly merged schema
  const schema = await createNewSchema();
  // start server with the new schema
  const server = new ApolloServer({
    schema,
    context: {
      knex: createKnex()
    }
  });
  server.listen().then(({url}) => {
    console.log(`Running at ${url}`);
  });
}

try {
  runServer();
} catch (err) {
  console.error(err);
}