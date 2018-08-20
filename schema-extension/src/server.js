const fetch = require('node-fetch');
const { mergeSchemas } = require('graphql-tools');
const getUserSchema = require('./userSchema.js');
const {
  getWoeid,
  getWeather
} = require('./weatherAPI.js');
const { ApolloServer } = require('apollo-server');

const extendSchema = async () => {

  // extend type user with field city_weather
  const typeExtensions = `
    extend type user {
      city_weather: city_weather,
    }
    type city_weather {
      temp: String
      min_temp: String
      max_temp: String
      city_name: String!
      applicable_date: String!
    }
  `;

  // resolve field city_weather in root field user
  const schemaExtensionResolvers = {
    user: {
      city_weather: async (parent, args, context, info) => {
        const cityDetails = await getWoeid(parent.city);
        if (!cityDetails) {
          return null;
        }
        const weather = await getWeather(cityDetails);
        if (!weather) {
          return null;
        }
        let consolidated_weather = weather.consolidated_weather;
        // check for args applicable_date to apply filter
        consolidated_weather = args.applicable_date ? consolidated_weather.find(item => item.applicable_date === args.applicable_date) : consolidated_weather[0];
        const respObj = {'temp': consolidated_weather.the_temp.toString(), 'min_temp': consolidated_weather.min_temp.toString(), 'max_temp': consolidated_weather.max_temp.toString(), 'city_name': weather.title, 'applicable_date': consolidated_weather.applicable_date};
        return respObj;
      }
    }
  };

  const userSchema = await getUserSchema();
  const newSchema = mergeSchemas({
    schemas: [
      userSchema,
      typeExtensions
    ],
    resolvers: schemaExtensionResolvers
  });
  return newSchema;
};

const startServer = async () => {
  const schema = await extendSchema();
  const server = new ApolloServer({
    schema
  });
  server.listen().then(({ url }) => {
    console.log(`Server running at ${url}`);
  });
};

try {
  startServer();
} catch (e) {
  console.error(e);
}
