export const generateTripPlan = async (
  destination,
  budget,
  days,
  tripType,
  mood,
  hotelType
) => {

  const prompt = `

Create a JSON travel itinerary for ${destination}.

Trip Details:
- Budget: ₹${budget}
- Days: ${days}
- Trip Type: ${tripType}
- Mood: ${mood}
- Stay Preference: ${hotelType}

Return ONLY valid JSON.

Format:

{
  "tripTitle": "",
  "days": [
    {
      "day": 1,
      "title": "",
      "activities": [],
      "food": "",
      "hotelSuggestion": ""
    }
  ]
}

`;

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",

      headers: {
  Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,

  "Content-Type":
    "application/json",
},
      
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo",

        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    }
  );

  const data = await response.json();

  console.log(data);

  const text =
  data?.choices?.[0]
    ?.message?.content;

if (!text) {

  throw new Error(
    "AI response failed. Check OpenRouter API key."
  );

}

  try {

    const cleanText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleanText);

  } catch (error) {

    console.log("JSON Parse Error:", error);

    console.log("AI TEXT:", text);

    return {
      tripTitle: "AI Travel Plan",
      days: [
        {
          day: 1,
          title: "Trip Plan Error",
          activities: [
            "AI returned invalid format"
          ],
          food: "N/A",
          hotelSuggestion: "N/A"
        }
      ]
    };
  }
}