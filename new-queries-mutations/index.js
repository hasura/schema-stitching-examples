import { introspectSchema, makeExecutableSchema, makeRemoteExecutableSchema, mergeSchemas } from 'graphql-tools';
import { HttpLink } from 'apollo-link-http';
import fetch from 'node-fetch';
import { ApolloServer } from 'apollo-server';

const METAWEATHER_API_URL = "https://www.metaweather.com/api/location/";

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

// Pass the city and get the unique woeid for the city
const getWoeid = (place) => {
  return fetch(`${METAWEATHER_API_URL}search/?query=${place}`)
    .then(response => response.json())
    .then(jsonResponse => jsonResponse[0])
}

// Use the woeid of the city to get its weather
const getWeather = (data) => {
  return fetch(METAWEATHER_API_URL + data.woeid)
      .then(response => response.json())
};

const typeDefs = `
    type CityWeather {
      temp: String
      min_temp: String
      max_temp: String
      city_name: String!
      applicable_date: String!
    }
    type Query {
      cityWeather(city_name: String! applicable_date: String): CityWeather
    }
  `;

// Resolvers for cityWeather query
const resolvers = {
  Query: {
    cityWeather: (root, args, context, info) => {
      return getWoeid(args.city_name).then( function(response) {
        if (!response) {
          return null;
        }
        return getWeather(response).then( function(weather) {
          if (!weather) {
            return null;
          }
          let consolidated_weather = weather.consolidated_weather;
          // check for args applicable_date to apply filter
          consolidated_weather = args.applicable_date ? consolidated_weather.find(item => item.applicable_date === args.applicable_date) : consolidated_weather[0];
          const respObj = {'temp': consolidated_weather.the_temp.toString(), 'min_temp': consolidated_weather.min_temp.toString(), 'max_temp': consolidated_weather.max_temp.toString(), 'city_name': weather.title, 'applicable_date': consolidated_weather.applicable_date};
          return respObj;
        });
      });
    }
  },
};

const createNewSchema = async () => {
  // Make and get executable user Schema
  const userExecutableSchema = await createUserSchema();
  // Make executable weather schema
  const weatherExecutableSchema = makeExecutableSchema({
    typeDefs,
    resolvers
  });
  // Merge the two schemas
  return mergeSchemas({
    schemas: [
      userExecutableSchema,
      weatherExecutableSchema
    ]
  });
};

const runServer = async () => {
  // Get newly merged schema
  const schema = await createNewSchema();
  // start server with the new schema
  const server = new ApolloServer({ schema });
  server.listen().then(({url}) => {
    console.log(`Running at ${url}`);
  });
}

try {
  runServer();
} catch (err) {
  console.error(err);
}