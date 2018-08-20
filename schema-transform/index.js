import {
  makeRemoteExecutableSchema,
  introspectSchema,
  mergeSchemas,
  transformSchema,
  FilterRootFields,
  RenameTypes,
  RenameRootFields
} from 'graphql-tools';
import { HttpLink } from 'apollo-link-http';
import fetch from 'node-fetch';
import { ApolloServer } from 'apollo-server';


const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Create github schema with renamed types
const createRenamedGithubSchema = async () => {
  const link = new HttpLink({
    uri: 'https://api.github.com/graphql',
    fetch,
    headers: { 'Authorization': `Bearer ${GITHUB_TOKEN}`}
  });
  // introspect schema
  const remoteSchema = await introspectSchema(link);
  const remoteExecutableSchema = makeRemoteExecutableSchema({
    schema: remoteSchema,
    link
  });
  const renamedSchema = transformSchema(
    remoteExecutableSchema,
    [
      new RenameTypes((type) => `github_${type}`),
      new RenameRootFields((operation, name) => `github_${name}`)
    ]
  );
  return renamedSchema;
};

// Transform schema by renaming types and fields
const createNewSchema = async () => {
  const renamedGithubSchema = await createRenamedGithubSchema();
  return renamedGithubSchema;
};

const runServer = async () => {
  const schema = await createNewSchema();
  const server = new ApolloServer({
    schema
  });
  server.listen().then(({url}) => {
    console.log(`Running at ${url}`);
  });
};

try {
  runServer();
} catch (e) {
  console.error(e);
}
