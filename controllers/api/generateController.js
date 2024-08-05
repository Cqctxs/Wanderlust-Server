const { Client } = require("@googlemaps/google-maps-services-js");
const client = new Client({});

const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
  FunctionDeclarationSchemaType,
} = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
  systemInstruction:
    "Generate travel itineraries in the following JSON format. The country/area the user wants to visit will be inputted, as well as a starting date and ending date. The itenerary should start exactly on the starting date and end on the ending date. Make sure to include the best attractions and activities from all across the area (popular and not well known), organized by days at which an attraction is visited. Keep the descriptions for the activities short and consice. Add the specific, searchable location name of each attraction, so that the location can be found with the Google Geocoding API. Make sure to include city name of the attractions in each day, and indicate the form of transportation that is needed to reach the location from the previous day. Write a brief overview of the activities in the day, almost like a preview of what is ahead.",
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
                "Date for the activites in the format YYYY-MM-DD, for example 2024-07-22.",
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
                "Array of strings listing the names of the attractions visited in the activities array. Please make sure the location name is able to be searched on google maps.",
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
                "A breif summary of the day, including activities, and any transportation",
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

const getItenerary = async (req, res) => {
  const { country, startDate, endDate } = req.body;
  if (!country || !startDate || !endDate)
    return res
      .status(400)
      .json({ message: "Missing fields, could not generate an itenerary." });
  const chatSession = model.startChat({
    generationConfig,
    // safetySettings: Adjust safety settings
    // See https://ai.google.dev/gemini-api/docs/safety-settings
    history: [
      {
        role: "user",
        parts: [{ text: "Japan, 2024-08-01, 2024-08-31" }],
      },
      {
        role: "model",
        parts: [
          {
            text: '{"country": "Japan", "itinerary": [{"activities": ["Explore the Senso-ji Temple and Nakamise Street", "Visit the Tokyo Skytree for panoramic city views", "Stroll through the colorful and fashionable Harajuku district"], "city": "Tokyo", "overview": "Welcome to Japan! Your adventure begins in Tokyo, where ancient traditions meet modern marvels. Explore the iconic Senso-ji Temple, wander down bustling Nakamise Street, and take in breathtaking views from the Tokyo Skytree. Get ready for a day of cultural immersion and urban exploration.", "transportation": "flight", "date": "2024-08-01"}, {"activities": ["Immerse yourself in the enchanting Hakone Open-Air Museum", "Cruise across Lake Ashi, surrounded by stunning volcanic landscapes", "Experience the rejuvenating Hakone Ropeway", "Visit the volcanic Owakudani Valley"], "": "Hakone", "overview": "Today, we escape the bustling city for the tranquility of Hakone, a mountain resort town known for its natural beauty. Explore the Hakone Open-Air Museum, enjoy a scenic cruise on Lake Ashi, and take a thrilling ride on the Hakone Ropeway, all while surrounded by breathtaking volcanic scenery.", "transportation": "train", "date": "2024-08-02"}, {"activities": ["Discover the iconic bamboo forest of Arashiyama", "Explore the Tenryu-ji Temple and its serene gardens", "Visit the Togetsukyo Bridge for picturesque views"], "city": "Kyoto", "overview": "Journey to Kyoto, the ancient capital of Japan, and immerse yourself in its rich history and culture. Today\'s itinerary takes you to Arashiyama, where you\'ll wander through the iconic bamboo forest, find tranquility at Tenryu-ji Temple, and enjoy stunning views from the Togetsukyo Bridge.", "transportation": "train", "date": "2024-08-03"}, {"activities": ["Explore the Fushimi Inari Shrine and its thousands of vermilion torii gates", "Visit Kiyomizu-dera Temple and its iconic wooden stage", "Wander through the Gion district, known for its traditional wooden buildings and geishas"], "city": "Kyoto", "overview": "Today, delve deeper into Kyoto\'s cultural treasures. Explore the mesmerizing Fushimi Inari Shrine with its seemingly endless torii gates, visit the iconic Kiyomizu-dera Temple with its panoramic views, and wander through the enchanting Gion district, hoping to catch a glimpse of a geisha.", "transportation": "bus", "date": "2024-08-04"}, {"activities": ["Hike to the summit of Mount Misen for breathtaking views", "Explore the historic Itsukushima Shrine and its floating torii gate", "Stroll through the charming town of Miyajima"], "city": "Miyajima", "overview": "Embark on a day trip to Miyajima, a sacred island known for its natural beauty and spiritual significance. Hike to the summit of Mount Misen for stunning panoramic views, visit the iconic Itsukushima Shrine with its floating torii gate, and enjoy the peaceful atmosphere of this enchanting island.", "transportation": "train", "date": "2024-08-05"}, {"activities": ["Explore the Hiroshima Peace Memorial Park and Museum, a poignant reminder of the atomic bombing", "Visit Hiroshima Castle and learn about its history", "Stroll through the Shukkei-en Garden, a tranquil oasis in the city"], "city": "Hiroshima", "overview": "Today, we travel to Hiroshima, a city forever marked by history. Visit the Hiroshima Peace Memorial Park and Museum to reflect on the past, explore Hiroshima Castle to learn about the city\'s resilience, and find tranquility in the Shukkei-en Garden.", "transportation": "train", "date": "2024-08-06"}, {"activities": ["Discover the art of bonsai at the Omiya Bonsai Village", "Explore the ancient Hikawa Shrine, known for its impressive architecture", "Stroll through the atmospheric streets of the Kawagoe Edo Period Town"], "city": "Kawagoe", "overview": "Venture just outside of Tokyo to experience the charms of Kawagoe, often called \\"Little Edo.\\" Discover the art of bonsai at the Omiya Bonsai Village, visit the ancient Hikawa Shrine with its impressive architecture, and step back in time as you wander through the streets of the Kawagoe Edo Period Town.", "transportation": "train", "date": "2024-08-07"}, {"activities": ["Explore the Matsumoto Castle, one of Japan\'s most impressive original castles", "Wander through the charming streets of the Nakamachi district", "Visit the Matsumoto City Museum of Art to see works by Yayoi Kusama"], "city": "Matsumoto", "overview": "Journey to Matsumoto, home to one of Japan\'s most impressive castles. Explore Matsumoto Castle, known as the \\"Crow Castle\\" for its black exterior, wander through the charming streets of the Nakamachi district with its traditional buildings, and visit the Matsumoto City Museum of Art to see works by renowned artist Yayoi Kusama.", "transportation": "train", "date": "2024-08-08"}, {"activities": ["Hike through the stunning Kamikochi Valley, surrounded by towering mountains", "Take a scenic walk along the Taisho Pond, known for its crystal-clear waters", "Visit the Kappa Bridge for picturesque views of the Hotaka Mountains"], "city": "Kamikochi", "overview": "Escape into the breathtaking beauty of the Japanese Alps with a visit to Kamikochi Valley. Hike through this stunning natural wonderland, surrounded by towering mountains, crystal-clear rivers, and lush forests. Capture the beauty of Taisho Pond, and enjoy the iconic views from Kappa Bridge.", "transportation": "bus", "date": "2024-08-09"}, {"activities": ["Explore the historic Shirakawa-go village, a UNESCO World Heritage Site known for its traditional gassho-style farmhouses", "Visit the Gokayama Gassho-style Village, another well-preserved example of this unique architecture", "Learn about the history and culture of these traditional villages"], "city": "Shirakawa-go and Gokayama", "overview": "Step back in time as you visit the historic villages of Shirakawa-go and Gokayama. Explore the UNESCO World Heritage Site of Shirakawa-go, with its charming gassho-style farmhouses, and continue to Gokayama Gassho-style Village to delve deeper into this unique architectural style and the history of these traditional communities.", "transportation": "bus", "date": "2024-08-10"}, {"activities": ["Explore Kanazawa Castle, with its impressive reconstructed structures", "Wander through Kenrokuen Garden, considered one of Japan\'s three most beautiful gardens", "Visit the Higashi Chaya District, known for its traditional teahouses"], "city": "Kanazawa", "overview": "Discover the beauty of Kanazawa, a city rich in history and culture. Explore Kanazawa Castle, with its impressive reconstructed structures, wander through the serene Kenrokuen Garden, considered one of Japan\'s three most beautiful gardens, and experience the charm of the Higashi Chaya District, known for its traditional teahouses.", "transportation": "train", "date": "2024-08-11"}, {"activities": ["Visit the iconic Great Buddha statue at Kotoku-in Temple", "Explore the Hase-dera Temple, known for its beautiful gardens and panoramic views", "Stroll along Yuigahama Beach, a popular spot for surfing and swimming"], "city": "Kamakura", "overview": "Escape the hustle and bustle of Tokyo with a day trip to Kamakura, a coastal town known for its numerous temples, shrines, and the iconic Great Buddha statue. Visit Kotoku-in Temple to see the Great Buddha, explore the beautiful Hase-dera Temple, and enjoy the relaxed atmosphere of Yuigahama Beach.", "transportation": "train", "date": "2024-08-12"}, {"activities": ["Explore the Hakone Open-Air Museum, featuring contemporary sculptures set against the backdrop of Hakone\'s natural beauty", "Cruise across Lake Ashi, surrounded by stunning mountain views", "Take a scenic ride on the Hakone Ropeway, offering panoramic views of volcanic hot springs and Mount Fuji"], "city": "Hakone", "overview": "Return to the tranquility of Hakone, this time focusing on its artistic side. Explore the Hakone Open-Air Museum, featuring contemporary sculptures amidst Hakone\'s natural beauty. Enjoy a leisurely cruise across Lake Ashi, surrounded by stunning mountain views, and take a scenic ride on the Hakone Ropeway, offering panoramic vistas of volcanic hot springs and, weather permitting, Mount Fuji.", "transportation": "train", "date": "2024-08-13"}, {"activities": ["Discover the vibrant street art and independent boutiques of Shibuya", "Indulge in some retail therapy at the iconic Shibuya 109 department store", "Enjoy a meal at one of Shibuya\'s many trendy cafes or restaurants"], "city": "Tokyo", "overview": "Head back to the vibrant metropolis of Tokyo and immerse yourself in the trendy atmosphere of Shibuya. Explore the district\'s vibrant street art, discover unique finds in independent boutiques, and indulge in some retail therapy at the iconic Shibuya 109 department store. Enjoy a meal at one of Shibuya\'s many trendy cafes or restaurants, soaking up the energetic ambiance.", "transportation": "train", "date": "2024-08-14"}, {"activities": ["Experience the bustling atmosphere of the Tsukiji Outer Market, known for its fresh seafood and local produce", "Immerse yourself in the world of anime and manga at the Akihabara district", "Enjoy a traditional Japanese tea ceremony"], "city": "Tokyo", "overview": "Today, delve into the culinary and cultural delights of Tokyo. Experience the bustling atmosphere of the Tsukiji Outer Market, known for its fresh seafood and local produce, and immerse yourself in the world of anime and manga at the Akihabara district. For a moment of tranquility, enjoy a traditional Japanese tea ceremony, experiencing the art and zen of this ancient ritual.", "transportation": "train", "date": "2024-08-15"}, {"activities": ["Visit the Edo-Tokyo Museum, offering insights into the city\'s history and culture", "Stroll through the Imperial Palace East Garden, a serene oasis in the heart of Tokyo", "Enjoy panoramic city views from the Tokyo Metropolitan Government Building"], "city": "Tokyo", "overview": "Journey through Tokyo\'s past, present, and future. Start at the Edo-Tokyo Museum for a captivating look at the city\'s history and culture. Stroll through the serene Imperial Palace East Garden, a tranquil oasis in the heart of Tokyo, and end your day with breathtaking panoramic city views from the Tokyo Metropolitan Government Building.", "transportation": "train", "date": "2024-08-16"}, {"activities": ["Explore the Ghibli Museum, celebrating the works of the renowned Studio Ghibli", "Wander through Inokashira Park, a picturesque green space with a zoo and a lake", "Experience the vibrant nightlife and live music scene of Kichijoji"], "city": "Mitaka and Kichijoji", "overview": "Venture just outside of central Tokyo to the charming areas of Mitaka and Kichijoji. Explore the whimsical Ghibli Museum, celebrating the works of the renowned Studio Ghibli, wander through the picturesque Inokashira Park, and experience the vibrant nightlife and live music scene of Kichijoji.", "transportation": "train", "date": "2024-08-17"}, {"activities": ["Visit the Sankeien Garden, renowned for its traditional Japanese landscapes", "Explore the Yokohama Cup Noodles Museum, a unique and interactive museum dedicated to instant ramen", "Stroll through Yokohama Chinatown, one of the largest Chinatowns in the world"], "city": "Yokohama", "overview": "Embark on a day trip to Yokohama, a vibrant port city located south of Tokyo. Visit the serene Sankeien Garden, explore the unique Yokohama Cup Noodles Museum dedicated to instant ramen, and immerse yourself in the bustling atmosphere of Yokohama Chinatown.", "transportation": "train", "date": "2024-08-18"}, {"activities": ["Explore the ancient temples and shrines of Nikko, including Toshogu Shrine and Rinno-ji Temple", "Hike to the scenic Lake Chuzenji and enjoy views of the surrounding mountains", "Visit the Kegon Falls, one of Japan\'s most beautiful waterfalls"], "city": "Nikko", "overview": "Journey to Nikko, a city renowned for its stunning natural beauty and UNESCO World Heritage-listed shrines and temples. Explore the intricate carvings and vibrant colors of Toshogu Shrine, discover the serenity of Rinno-ji Temple, and immerse yourself in the natural splendor of Lake Chuzenji and Kegon Falls.", "transportation": "train", "date": "2024-08-19"}, {"activities": ["Visit the Fuji-Q Highland amusement park, home to thrilling roller coasters and attractions", "Enjoy breathtaking views of Mount Fuji from the park\'s observation deck", "Experience a traditional Japanese onsen (hot spring)"], "city": "Mount Fuji (Fuji Five Lakes region)", "overview": "Today, experience the majesty of Mount Fuji, Japan\'s iconic peak. Visit the Fuji-Q Highland amusement park for thrilling rides and breathtaking views of the mountain. Afterward, unwind and rejuvenate with a relaxing soak in a traditional Japanese onsen (hot spring) while enjoying the serene surroundings.", "transportation": "train", "date": "2024-08-20"}, {"activities": ["Explore the charming streets of Hakone, browsing local shops and art galleries", "Relax and rejuvenate in a traditional Japanese onsen (hot spring)", "Enjoy a scenic hike in the surrounding mountains, taking in the fresh air and natural beauty"], "city": "Hakone", "overview": "Return to the tranquil mountain resort town of Hakone for a day of relaxation and exploration. Wander through the charming streets, browsing local shops and art galleries, and treat yourself to a rejuvenating soak in a traditional Japanese onsen (hot spring). For nature enthusiasts, a scenic hike in the surrounding mountains offers breathtaking views and a chance to connect with nature.", "transportation": "train", "date": "2024-08-21"}, {"activities": ["Explore the bustling streets of Osaka, known for its lively atmosphere and delicious street food", "Visit Osaka Castle, a symbol of the city\'s history and power", "Experience the vibrant nightlife of the Dotonbori district"], "city": "Osaka", "overview": "Journey to Osaka, Japan\'s second-largest city, known for its lively atmosphere, delicious street food, and vibrant nightlife. Explore Osaka Castle, a symbol of the city\'s history and power, and dive into the heart of Osaka\'s nightlife in the Dotonbori district.", "transportation": "train", "date": "2024-08-22"}, {"activities": ["Immerse yourself in the magical world of Universal Studios Japan, experiencing thrilling rides and entertainment", "Explore the Osaka Aquarium Kaiyukan, home to a diverse range of marine life", "Enjoy a relaxing stroll along the Tempozan Harbor Village"], "city": "Osaka", "overview": "Today, embrace the fun and excitement of Osaka\'s entertainment offerings. Immerse yourself in the magical world of Universal Studios Japan, experiencing thrilling rides and entertainment. Dive into the underwater world at the Osaka Aquarium Kaiyukan, and enjoy a relaxing stroll along the Tempozan Harbor Village.", "transportation": "train", "date": "2024-08-23"}, {"activities": ["Discover the ancient city of Nara, a UNESCO World Heritage Site", "Visit Todai-ji Temple, home to a giant bronze Buddha statue", "Wander through Nara Park, known for its friendly wild deer"], "city": "Nara", "overview": "Step back in time with a visit to Nara, an ancient city that served as Japan\'s capital in the 8th century. Explore Todai-ji Temple, home to a giant bronze Buddha statue, and wander through Nara Park, where friendly wild deer roam freely.", "transportation": "train", "date": "2024-08-24"}, {"activities": ["Explore the beautiful Himeji Castle, a UNESCO World Heritage Site and one of Japan\'s most impressive castles", "Wander through Koko-en Garden, a traditional Japanese garden adjacent to Himeji Castle", "Visit the Hyogo Prefectural Museum of Art, showcasing a diverse collection of art"], "city": "Himeji", "overview": "Today, journey to Himeji, home to the magnificent Himeji Castle. Explore this UNESCO World Heritage Site, considered one of Japan\'s most impressive castles. Wander through the serene Koko-en Garden, and immerse yourself in art at the Hyogo Prefectural Museum of Art.", "transportation": "train", "date": "2024-08-25"}, {"activities": ["Explore the historic city of Hiroshima, visiting the Hiroshima Peace Memorial Park and Museum", "Take a ferry to Miyajima Island and visit the iconic Itsukushima Shrine with its floating torii gate", "Enjoy a peaceful walk through the Momijidani Park, especially beautiful during autumn"], "city": "Hiroshima and Miyajima", "overview": "Return to Hiroshima for a deeper exploration of its historical significance and natural beauty. Revisit the Hiroshima Peace Memorial Park and Museum, reflecting on the city\'s resilience. Take a ferry to Miyajima Island to visit the iconic Itsukushima Shrine, and enjoy a peaceful walk through the Momijidani Park.", "transportation": "train", "date": "2024-08-26"}, {"activities": ["Discover the cultural heritage of Kyoto, visiting the Fushimi Inari Shrine with its thousands of vermilion torii gates", "Explore the serene Arashiyama Bamboo Grove and visit the Tenryu-ji Temple", "Experience a traditional tea ceremony at one of Kyoto\'s many teahouses"], "city": "Kyoto", "overview": "Return to the cultural heart of Japan with another visit to Kyoto. Revisit the mesmerizing Fushimi Inari Shrine, explore the serene Arashiyama Bamboo Grove and Tenryu-ji Temple, and immerse yourself in the tranquility of a traditional tea ceremony.", "transportation": "train", "date": "2024-08-27"}, {"activities": ["Wander through the Gion district, hoping to catch a glimpse of a geisha", "Visit Kiyomizu-dera Temple and admire its iconic wooden stage", "Explore the Nishiki Market, known as \\"Kyoto\'s Kitchen\\", and sample local delicacies"], "city": "Kyoto", "overview": "Continue your exploration of Kyoto, delving deeper into its cultural offerings. Wander through the enchanting Gion district, visit the iconic Kiyomizu-dera Temple, and tantalize your taste buds at the Nishiki Market, sampling local delicacies.", "transportation": "bus", "date": "2024-08-28"}, {"activities": ["Visit the Sagano Scenic Railway, enjoying breathtaking views of the Hozugawa River and surrounding mountains", "Experience a traditional Japanese onsen (hot spring) in the Arashiyama area", "Enjoy a farewell dinner at one of Kyoto\'s many acclaimed restaurants"], "city": "Kyoto", "overview": "As your journey through Japan nears its end, savor the final moments in the captivating city of Kyoto. Take a scenic ride on the Sagano Scenic Railway, relax and rejuvenate in a traditional Japanese onsen, and enjoy a farewell dinner, reflecting on the incredible experiences of your trip.", "transportation": "train", "date": "2024-08-29"}, {"activities": ["Return to Tokyo to prepare for your departure", "Enjoy some last-minute souvenir shopping at the Nakamise Shopping Street or the trendy boutiques of Shibuya and Harajuku", "Have a final taste of Japanese cuisine at one of Tokyo\'s many exceptional restaurants"], "city": "Tokyo", "overview": "Bid farewell to the Land of the Rising Sun as you return to Tokyo to prepare for your departure. Enjoy some last-minute souvenir shopping, savoring a final taste of Japanese cuisine, and cherish the memories made during your unforgettable journey through Japan.", "transportation": "train", "date": "2024-08-30"}, {"activities": ["Depart from Narita International Airport (NRT)"], "city": "Tokyo", "overview": "Departure from Japan", "transportation": "flight", "date": "2024-08-31"}]}',
          },
        ],
      },
      {
        role: "user",
        parts: [{ text: "France, 2024-07-23, 2024-07-30" }],
      },
      {
        role: "model",
        parts: [
          {
            text: '{"country": "France", "itinerary": [{"activities": ["Arrive at Charles de Gaulle Airport (CDG), Paris", "Check into your hotel near the Louvre Museum", "Enjoy a leisurely stroll through the Tuileries Garden", "Have dinner at a traditional Parisian bistro"], "city": "Paris", "overview": "Welcome to France! Your journey begins in the heart of Paris. Upon arrival, settle into your hotel and embark on a leisurely stroll through the enchanting Tuileries Garden before indulging in a delicious dinner at a charming Parisian bistro.", "transportation": "flight", "date": "2024-07-23"}, {"activities": ["Explore the Louvre Museum, home to masterpieces like the Mona Lisa", "Climb the Arc de Triomphe for panoramic city views", "Stroll along the Champs-Élysées, Paris\'s grand avenue"], "city": "Paris", "overview": "Today, immerse yourself in the artistic grandeur and iconic landmarks of Paris. Begin your day at the Louvre Museum, home to world-renowned masterpieces. Ascend the Arc de Triomphe for breathtaking panoramic views of the city and conclude your day with a leisurely stroll along the Champs-Élysées.", "transportation": "train", "date": "2024-07-24"}, {"activities": ["Visit the Eiffel Tower, an iconic symbol of Paris", "Take a scenic cruise along the Seine River", "Explore the charming neighborhood of Montmartre and visit the Sacré-Cœur Basilica"], "city": "Paris", "overview": "Prepare to be captivated by the charm and romance of Paris. Begin your day with a visit to the iconic Eiffel Tower, followed by a picturesque cruise along the Seine River. Conclude your day in the enchanting neighborhood of Montmartre, home to the stunning Sacré-Cœur Basilica.", "transportation": "bus", "date": "2024-07-25"}, {"activities": ["Explore the Palace of Versailles, the opulent former residence of French royalty", "Wander through the palace\'s magnificent gardens", "Enjoy a picnic lunch amidst the serene surroundings"], "city": "Versailles", "overview": "Today, step back in time and immerse yourself in the grandeur of the Palace of Versailles. Explore the opulent palace, once home to French royalty, and wander through its sprawling gardens. Indulge in a delightful picnic lunch surrounded by the serene beauty of this historical gem.", "transportation": "train", "date": "2024-07-26"}, {"activities": ["Travel to the charming city of Strasbourg", "Explore the historic Petite France district, with its canals and half-timbered houses", "Visit the Strasbourg Cathedral, a masterpiece of Gothic architecture"], "city": "Strasbourg", "overview": "Embark on a journey to Strasbourg, a city steeped in history and charm. Explore the historic Petite France district, with its picturesque canals and charming half-timbered houses. Marvel at the architectural grandeur of Strasbourg Cathedral, a masterpiece of Gothic design.", "transportation": "train", "date": "2024-07-27"}, {"activities": ["Discover the beauty of the Alsace Wine Route, winding through picturesque vineyards and villages", "Sample local wines at a traditional wine cellar", "Enjoy a traditional Alsatian lunch amidst the vineyards"], "city": "Alsace Region", "overview": "Today, immerse yourself in the beauty and flavors of the Alsace Wine Route. Journey through picturesque vineyards and charming villages, stopping at traditional wine cellars to sample exquisite local wines. Indulge in a delightful traditional Alsatian lunch surrounded by the rolling vineyards.", "transportation": "bus", "date": "2024-07-28"}, {"activities": ["Visit the medieval city of Colmar, with its colorful half-timbered houses and canals", "Explore the Unterlinden Museum, home to the Isenheim Altarpiece", "Enjoy a leisurely stroll along the Lauch River"], "city": "Colmar", "overview": "Step into a fairytale world in Colmar, a medieval city straight out of a storybook. Admire the colorful half-timbered houses and wander along the picturesque canals. Immerse yourself in art at the Unterlinden Museum, home to the renowned Isenheim Altarpiece.", "transportation": "train", "date": "2024-07-29"}, {"activities": ["Depart from Strasbourg Airport (SXB)", "Return home with wonderful memories of your French adventure"], "city": "Strasbourg", "overview": "As your unforgettable journey through France comes to an end, depart from Strasbourg Airport, carrying with you cherished memories of your French adventure. Au revoir!", "transportation": "flight", "date": "2024-07-30"}]}',
          },
        ],
      },
      {
        role: "user",
        parts: [{ text: "Brazil, 2024-09-20, 2024-09-28" }],
      },
      {
        role: "model",
        parts: [
          {
            text: '{"country": "Brazil", "itinerary": [{"activities": ["Arrive at Rio de Janeiro-Galeão International Airport (GIG)", "Check into your hotel in Copacabana", "Enjoy a relaxing walk along Copacabana Beach", "Have dinner at a traditional Brazilian Churrascaria"], "city": "Rio de Janeiro", "overview": "Welcome to Brazil! Your adventure starts in vibrant Rio de Janeiro. Settle into your hotel and soak up the lively atmosphere of Copacabana Beach before experiencing a true taste of Brazil at a Churrascaria.", "transportation": "flight", "date": "2024-09-20"}, {"activities": ["Visit Christ the Redeemer statue atop Corcovado Mountain for panoramic city views", "Take a cable car ride to Sugarloaf Mountain for more breathtaking vistas", "Explore the colorful neighborhood of Santa Teresa", "Enjoy dinner and samba at a traditional club in Lapa"], "city": "Rio de Janeiro", "overview": "Today is all about iconic Rio landmarks! Experience breathtaking views from Christ the Redeemer and Sugarloaf Mountain, explore the bohemian Santa Teresa, and immerse yourself in the rhythm of Brazilian Samba at Lapa.", "transportation": "bus", "date": "2024-09-21"}, {"activities": ["Relax on the famous Ipanema Beach", "Visit the Selarón Steps, a vibrant mosaic staircase", "Explore the trendy shops and cafes of Leblon", "Experience a lively night out in Ipanema"], "city": "Rio de Janeiro", "overview": "Soak up the sun and vibrant energy of Ipanema Beach, marvel at the artistic Selarón Steps, and explore the trendy district of Leblon. As night falls, embrace the lively spirit of Ipanema.", "transportation": "bus", "date": "2024-09-22"}, {"activities": ["Fly from Rio de Janeiro to Foz do Iguaçu", "Take a guided tour of the Brazilian side of Iguazu Falls", "Enjoy the panoramic views from the walkways and observation decks"], "city": "Foz do Iguaçu", "overview": "Prepare to be awestruck by the magnificent Iguazu Falls! After your flight, embark on a journey to witness the power and beauty of this natural wonder from the Brazilian side.", "transportation": "flight", "date": "2024-09-23"}, {"activities": ["Explore the Argentine side of Iguazu Falls, including the Devil\'s Throat", "Take a boat ride for a closer look at the cascading waterfalls", "Experience the rainforest ecosystem surrounding the falls"], "city": "Puerto Iguazú", "overview": "Cross the border into Argentina to experience a different perspective of Iguazu Falls, including the awe-inspiring Devil\'s Throat. Get up close and personal with a thrilling boat trip and immerse yourself in the surrounding rainforest.", "transportation": "bus", "date": "2024-09-24"}, {"activities": ["Fly from Foz do Iguaçu to Salvador", "Explore the Pelourinho, Salvador\'s historic city center, a UNESCO World Heritage site", "Experience the vibrant Afro-Brazilian culture, music, and cuisine", "Visit the São Francisco Church, known for its gilded interior"], "city": "Salvador", "overview": "Immerse yourself in the rich history and vibrant culture of Salvador. Explore the UNESCO-listed Pelourinho district, experience the energy of Afro-Brazilian traditions, and visit the magnificent São Francisco Church.", "transportation": "flight", "date": "2024-09-25"}, {"activities": ["Relax on the beaches of Praia do Forte or Praia do Flamengo", "Visit the Projeto Tamar sea turtle conservation project", "Enjoy fresh seafood at a beachfront restaurant"], "city": "Salvador", "overview": "Today, enjoy the beautiful beaches near Salvador. Relax on the sands of Praia do Forte or Praia do Flamengo, support sea turtle conservation at Projeto Tamar, and savor delicious seafood by the ocean.", "transportation": "bus", "date": "2024-09-26"}, {"activities": ["Explore the Mercado Modelo, a bustling marketplace for handicrafts and souvenirs", "Visit the Elevador Lacerda, a historic art deco elevator offering city views", "Enjoy a final taste of Bahian cuisine at a local restaurant"], "city": "Salvador", "overview": "Immerse yourself in the local life of Salvador at the bustling Mercado Modelo, catch city views from the Elevador Lacerda, and savor a final taste of Bahian flavors before bidding farewell to this vibrant city.", "transportation": "bus", "date": "2024-09-27"}, {"activities": ["Depart from Deputado Luís Eduardo Magalhães International Airport (SSA), Salvador"], "city": "Salvador", "overview": "Departure from Brazil, carrying unforgettable memories of your Brazilian adventure.", "transportation": "flight", "date": "2024-09-28"}]}',
          },
        ],
      },
    ],
  });
  const result = await chatSession.sendMessage(
    `${country}, ${startDate}, ${endDate}`
  );
  const gen = JSON.parse(result.response.text());

  // Use map to create an array of promises for geocoding both cities and locations within each day
  const promises = gen.itinerary.map(async (day) => {
    try {
      const cityResponse = await client.geocode({
        params: {
          address: day.city,
          key: process.env.MAPS_API_KEY,
        },
      });
      console.log(cityResponse.data.results[0].geometry.location);
      day.cityCoordinates = cityResponse.data.results[0].geometry.location; // Store city coordinates separately
    } catch (error) {
      console.log(`Error geocoding city: ${day.city}`);
    }
    day.locationCoordinates = []; // Create an array to store location coordinates

    const locationPromises = day.locations.map(async (location) => {
      try {
        const locationResponse = await client.geocode({
          params: {
            address: location,
            key: process.env.MAPS_API_KEY,
          },
        });
        console.log(locationResponse.data.results[0].geometry.location);
        day.locationCoordinates.push(
          locationResponse.data.results[0].geometry.location
        );
      } catch (error) {
        console.log(`Error geocoding location: ${location}`);
      }
    });
    await Promise.all(locationPromises);
  });

  // Use Promise.all to wait for all promises to resolve
  await Promise.all(promises);

  const hotelPromises = gen.itinerary.slice(0, -1).map(async (day) => {
    try {
      const hotelResponse = await client.placesNearby({
        params: {
          type: "lodging",
          location: day.cityCoordinates,
          radius: 5000, // Search within 5km of city center
          key: process.env.MAPS_API_KEY,
        },
      });
      console.log(hotelResponse.data.results[0]);
      day.hotel = hotelResponse.data.results[0]; // add hotel to day
    } catch (error) {
      console.log(`A hotel could not be found for ${day.city}`);
    }
  });

  await Promise.all(hotelPromises);

  //Send updated itinerary with geocoded locations and hotels
  res.status(200).json(gen.itinerary);
};

module.exports = { getItenerary };
