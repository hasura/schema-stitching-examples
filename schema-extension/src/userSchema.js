const { makeRemoteExecutableSchema, introspectSchema } = require('graphql-tools');
const { HttpLink } = require('apollo-link-http');
const fetch = require('node-fetch');

const GRAPHQL_ENDPOINT = `https://bazookaand.herokuapp.com/v1alpha1/graphql`;

const getUserSchema = async () => {
  const link = new HttpLink({
    uri: GRAPHQL_ENDPOINT,
    fetch
  });
  const hasuraRemoteSchema = await introspectSchema(link);
  const executableHasuraSchema = makeRemoteExecutableSchema({
    schema: hasuraRemoteSchema,
    link
  });
  return executableHasuraSchema;
};

module.exports = getUserSchema;
