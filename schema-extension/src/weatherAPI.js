const fetch = require('node-fetch');

const METAWEATHER_API_URL = "https://www.metaweather.com/api/location/";

const getWeather = async (data) => {
  if (data.length === 0) {
    return null;
  }
  const response = await fetch(METAWEATHER_API_URL + data[0].woeid);
  const respObj = await response.json();
  return respObj;
};

const getWoeid = async (city) => {
  const response = await fetch(`${METAWEATHER_API_URL}search/?query=${city}`);
  const respObj = await response.json();
  return respObj;
};


module.exports = {
  getWeather,
  getWoeid
};
