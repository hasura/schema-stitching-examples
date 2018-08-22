import { ApolloServer, gql } from 'apollo-server';
import {
  makeRemoteExecutableSchema,
  introspectSchema,
  mergeSchemas,
} from 'graphql-tools';
import fetch from 'node-fetch';
import { HttpLink } from 'apollo-link-http';
// To satisfy Extend peer dependencies
import 'apollo-link';

const makeCustomResolver = (userSchema) => {
  // Create custom resolvers
  const customResolver = {
    Mutation: {
      insert_user(parent, args, context, info){
        let newArgs = { objects:[] };
        // Convert the email to lower case and append each object to the new arguments array
        for (const user of args.objects) {
          user.email = user.email.toLowerCase();
          newArgs.objects.push(user);
        }
        // Delegate after sanitization
        return info.mergeInfo.delegateToSchema({
          schema: userSchema,
          operation: 'mutation',
          fieldName: 'insert_user',
          args: newArgs,
          context,
          info,
        });
      }
    } 
  };
  return customResolver;
};

const createRemoteExecutableSchema = async () => {

  // Create remote executable user schema
  const userLink = new HttpLink({ 
    uri: 'https://bazookaand.herokuapp.com/v1alpha1/graphql',
    fetch,
  });
  const userSchema = makeRemoteExecutableSchema({
    schema: await introspectSchema(userLink),
    link: userLink,
  });

  return userSchema;

};

const makeMergedSchema = async () => {

  const userSchema = await createRemoteExecutableSchema();
  const customResolver = makeCustomResolver(userSchema);

  // merge the schema with new resolver
  const mergedSchema = mergeSchemas({
    schemas: [userSchema],
    resolvers: customResolver
  });

  return mergedSchema;

};

// serve the merged schema
makeMergedSchema().then(mergedSchema => {

  // Create a  new apollo server
  const server = new ApolloServer({ schema:mergedSchema });

  server.listen()
    .then(({ url }) => {
      console.log(`Running at ${url}`);
    })
    .catch(err => console.log(err));

});
