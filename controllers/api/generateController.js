const { Client } = require("@googlemaps/google-maps-services-js");
const client = new Client({});
const User = require("../../data/User");

const {
  GoogleGenerativeAI,
  FunctionDeclarationSchemaType,
} = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
  systemInstruction:
    "Generate travel itineraries in the following JSON format. The country/area the user wants to visit will be inputted, as well as a starting date and ending date. The itinerary should start exactly on the starting date and end on the ending date. Make sure to include the best attractions and activities from all across the area (popular and not well known), organized by days at which an attraction is visited. Keep the descriptions for the activities short and concise. Add the searchable location name of each attraction, keeping only the most important words and leaving behind unnecessary information which makes the location hard to find. Make sure to include city name of the attractions in each day, and indicate the form of transportation that is needed to reach the location from the previous day. Write a brief overview of the activities in the day, almost like a preview of what is ahead.",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
  responseSchema: {
    type: FunctionDeclarationSchemaType.OBJECT,
    properties: {
      country: {
        type: FunctionDeclarationSchemaType.STRING,
        description: "Name of the country the itinerary applies to.",
      },
      itinerary: {
        type: FunctionDeclarationSchemaType.ARRAY,
        description: "An array of objects representing each day of the trip.",
        items: {
          type: FunctionDeclarationSchemaType.OBJECT,
          properties: {
            date: {
              type: FunctionDeclarationSchemaType.STRING,
              description:
                "Date for the activities in the format YYYY-MM-DD, for example 2024-07-22.",
            },
            city: {
              type: FunctionDeclarationSchemaType.STRING,
              description: "Location for that day, city name.",
            },
            activities: {
              type: FunctionDeclarationSchemaType.ARRAY,
              description:
                "Array of strings listing suggested activities for that day.",
              items: {
                type: FunctionDeclarationSchemaType.STRING,
              },
            },
            locations: {
              type: FunctionDeclarationSchemaType.ARRAY,
              description:
                "Array of strings listing the names of the attractions visited in the activities array. Please make sure the location name is able to be searched on Google Maps.",
              items: {
                type: FunctionDeclarationSchemaType.STRING,
              },
            },
            transportation: {
              type: FunctionDeclarationSchemaType.STRING,
              description:
                "The type of transportation that is needed to reach the destination. One word only, either flight, train, or bus.",
              enum: ["flight", "train", "bus"],
            },
            overview: {
              type: FunctionDeclarationSchemaType.STRING,
              description:
                "A brief summary of the day, including activities, and any transportation",
            },
          },
          required: [
            "date",
            "city",
            "activities",
            "locations",
            "transportation",
            "overview",
          ],
        },
      },
    },
    required: ["country", "itinerary"],
  },
};

const updateUser = async (sub, itinerary) => {
  try {
    let user = await User.findOne({ sub: sub }).exec();
    if (!user) {
      user = new User({
        sub: sub,
        previousGenerations: [itinerary],
      });
      console.log(`new user with sub ${sub} created.`);
    } else {
      user.previousGenerations.push(itinerary);
    }
    const result = await user.save();
    console.log(result);
  } catch (error) {
    console.error(error);
  }
};

const getItinerary = async (req, res) => {
  const { country, startDate, endDate, sub } = req.body;
  if (!country || !startDate || !endDate)
    return res
      .status(400)
      .json({ error: "Missing fields, could not generate an itinerary." });
  if (!sub)
    return res
      .status(401)
      .json({ error: "No user sub, make sure the user is logged in." });
  const chatSession = model.startChat({
    generationConfig,
    // safetySettings: Adjust safety settings
    // See https://ai.google.dev/gemini-api/docs/safety-settings
    history: [

    ]
  });

  const result = await chatSession.sendMessage(
    `${country}, ${startDate}, ${endDate}`
  );
  const gen = JSON.parse(result.response.text());
  var access_token = ""
  // Use map to create an array of promises for geocoding both cities and locations within each day
  const promises = gen.itinerary.map(async (day) => {
    day.locationCoordinates = []; // Create an array to store location coordinates
    var lat = 0.0;
    var lng = 0.0;
    var cnt = 0.0;

    const locationPromises = day.locations.map(async (location) => {
      try {
        const locationResponse = await client.geocode({
          params: {
            address: location,
            key: process.env.MAPS_API_KEY,
          },
        });
        console.log("geocode")
        console.log(locationResponse.data.results[0].geometry.location)
        const latt = parseFloat(locationResponse.data.results[0].geometry.location.lat)
        const lngt = parseFloat(locationResponse.data.results[0].geometry.location.lng)
        lat = lat+latt
        lng = lng+lngt
        cnt++;
        day.locationCoordinates.push(
          locationResponse.data.results[0].geometry.location
        );
      } catch (error) {
        console.log(`Error geocoding location: ${location}`);
      }
    });
    await Promise.all(locationPromises);
    lat /= cnt;
    lng /= cnt;
    day.cityCoordinates = {lng, lat}
  });

  await Promise.all(promises);

  const accessCode = async () => {
    try {
      const options = {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: process.env.AMADEUS_API_KEY,
          client_secret: process.env.AMADEUS_API_SECRET
        })
      };
      
      const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', options);
      const json = await response.json();
      console.log(json);
      access_token = json.access_token;
    } catch (error) {
      console.log("Error in access code fetch:", error);
    }
  };
  
  // Call and await the accessCode function
  await accessCode();
  
  const hotelPromises = gen.itinerary.slice(0, -1).map(async (day) => {
    
    try {
      console.log(access_token)
      const options = {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + access_token
        }
      };
      console.log(day.cityCoordinates)
      console.log('https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-geocode?latitude='+day.cityCoordinates.lat+'&longitude='+day.cityCoordinates.lng)
      const response = fetch('https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-geocode?latitude='+day.cityCoordinates.lat+'&longitude='+day.cityCoordinates.lng, options)
      
      const json = await response.json()
      console.log(json)
      hotel = json.data[0]
      console.log(hotel)
      day.hotel = hotel; // add hotel to day
    } catch (error) {
      console.log(`A hotel could not be found for ${day.city}`);
    }
  });

    await Promise.all(hotelPromises);

  //Send updated itinerary with geocoded locations and hotels
  res.status(200).json(gen);
  await updateUser(sub, gen);
};

module.exports = { getItinerary, generationConfig, model };