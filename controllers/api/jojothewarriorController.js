const { Client } = require("@googlemaps/google-maps-services-js");
const {
    GoogleGenerativeAI,
    FunctionDeclarationSchemaType,
  } = require("@google/generative-ai");

// initializing variables
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

const getItinerary = async (req, res) => {
    const { country, startDate, endDate } = req.query;
    console.log(`${country}, ${startDate}, ${endDate}`);

    // handle error; for now pretend it's error trapped
    const chatSession = model.startChat({
        generationConfig,
        history: [
            
        ]
    });

    // sample request
    const result = await chatSession.sendMessage(
        `${country}, ${startDate}, ${endDate}`
    );

    const gen = JSON.parse(result.response.text());

    res.status(200).json(gen);
}

module.exports = { getItinerary };