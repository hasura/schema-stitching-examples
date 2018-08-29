import {
  makeRemoteExecutableSchema,
  introspectSchema,
  mergeSchemas
} from 'graphql-tools';
import { HttpLink } from 'apollo-link-http';
import { ApolloServer } from 'apollo-server';
import fetch from 'node-fetch';

// graphql API metadata
const graphqlApis = [
  {
    uri: 'https://bazookaand.herokuapp.com/v1alpha1/graphql',
  },
  {
    uri: 'https://schema-stitching-blog.herokuapp.com/v1alpha1/graphql',
  }
];




// create executable schemas from remote GraphQL APIs
const createRemoteExecutableSchemas = async () => {
  let schemas = [];
  for (const api of graphqlApis) {
    const link = new HttpLink({
      uri: api.uri,
      fetch
    });
    const remoteSchema = await introspectSchema(link);
    const remoteExecutableSchema = makeRemoteExecutableSchema({
      schema: remoteSchema,
      link
    });
    schemas.push(remoteExecutableSchema);
  }
  return schemas;
};

const createNewSchema = async () => {
  const schemas = await createRemoteExecutableSchemas();
  return mergeSchemas({
    schemas
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
