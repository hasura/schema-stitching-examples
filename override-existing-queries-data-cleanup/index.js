import {
  makeRemoteExecutableSchema,
  introspectSchema,
  mergeSchemas
} from 'graphql-tools';
import { HttpLink } from 'apollo-link-http';
import { ApolloServer } from 'apollo-server';
import fetch from 'node-fetch';

// Apollo link with the uri of GraphQL API
const link = new HttpLink({
  uri: 'https://schema-stitching-blog.herokuapp.com/v1alpha1/graphql',
  fetch
});

// create executable schemas from remote GraphQL API
const createRemoteExecutableSchema = async () => {
  const remoteSchema = await introspectSchema(link);
  const remoteExecutableSchema = makeRemoteExecutableSchema({
    schema: remoteSchema,
    link
  });
  return remoteExecutableSchema;
};

// custom validationFunction
const customValidation = () => {
  const date = new Date();
  const currentHour = date.getHours();
  return currentHour >= 17;
};

const createNewSchema = async () => {
  // get remote executable schema
  const schema = await createRemoteExecutableSchema();

  // write a resolver to customise the existing resolver
  const customResolvers = {
    Query: {
      game: (root, args, context, info) => {
        const validation = customValidation();
        // If validation fails, return empty, else delegate to parent schema
        if (!validation) {
          return [];
        } else {
          return info.mergeInfo.delegateToSchema({
            schema,
            operation: 'query',
            fieldName: 'game',
            args,
            context,
            info
          });
        }
      }
    }
  };

  // merge the schema along with custom resolvers
  return mergeSchemas({
    schemas: [ schema ],
    resolvers: customResolvers
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
