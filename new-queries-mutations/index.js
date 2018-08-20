import {
  makeRemoteExecutableSchema,
  makeExecutableSchema,
  introspectSchema,
  mergeSchemas
} from 'graphql-tools';
import { HttpLink } from 'apollo-link-http';
import { ApolloServer } from 'apollo-server';
import fetch from 'node-fetch';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '5940911256dfc2227e5b458606a465a239b350b0';

// Initial counter state
let count = 0;

// Typedefs for hello world query
const helloTypeDefs = `
  type Query {
    hello: String,
		count: Int
  }

  type Mutation {
		increment_counter: counter_mutation_result
  }

  type counter_mutation_result {
    new_count: Int
  }
`;

// Resolvers for hello world query
const helloResolvers = {
  Query: {
    hello: (root, args, context) => {
      return 'Hello world!';
    },
    count: (root, args, context) => {
      return count;
    }
  },
  Mutation: {
    increment_counter: (root, args, context, info) => {
      return { "new_count": ++count };
    }
  }
};

// Create executable schema from Github GraphQL API
const createGithubSchema = async () => {
  // Create an Apollo link with 'uri' of Github API
  const link = new HttpLink({
    uri: `https://api.github.com/graphql`,
    fetch,
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}` 
    }
  });
  // Get remote schema
  const remoteGithubSchema = await introspectSchema(link);
  // Make executable schema
  return makeRemoteExecutableSchema({
    schema: remoteGithubSchema,
    link
  });
};

// Merge schemas
const createNewSchema = async () => {
  // Make and get executable Github Schema
  const githubExecutableSchema = await createGithubSchema();
  // Make executable hello-world schema
  const helloExecutableSchema = makeExecutableSchema({
    typeDefs: helloTypeDefs,
    resolvers: helloResolvers
  });
  // Merge the two schemas
  return mergeSchemas({
    schemas: [
      githubExecutableSchema,
      helloExecutableSchema
    ]
  });
};

const runServer = async () => {
  // Get newly merged schema
  const schema = await createNewSchema();
  // start server with the new schema
  const server = new ApolloServer({
    schema
  });
  server.listen().then(({url}) => {
    console.log(`Running at ${url}`);
  });
};

try {
  runServer();
} catch (err) {
  console.error(err);
}
