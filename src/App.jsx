import {
  useState,
  useEffect,
  useRef
} from "react";
import axios from "axios";
import HotelCard from "./components/HotelCard";
import { generateTripPlan } from "./services/gemini";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

import {
  auth,
  provider,
  db
} from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc
} from "firebase/firestore";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ChartTooltip,
  ResponsiveContainer
} from "recharts";

function App() {
  const GOOGLE_API_KEY = "AIzaSyBoJZOkHefMvlHbPsLWKAzsWLqKzy9LjM0";
  const [destination, setDestination] = useState("");
  const [startingCity,
setStartingCity] =
useState("");
  const [budget, setBudget] = useState("");
  const [days, setDays] = useState("");
  const [tripType, setTripType] = useState("");
  const [hotelType, setHotelType] = useState("");
  const [mood, setMood] = useState("");
  const [tripPlan, setTripPlan] = useState([]);
  const [weather, setWeather] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [destinationImages, setDestinationImages] = useState([]);
  const [heroImage, setHeroImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [savedTrips, setSavedTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [placeMarkers, setPlaceMarkers] =
    useState([]);
  const [travelTips, setTravelTips] =
    useState([]);
  const [travelCost,
    setTravelCost] =
    useState(null);
  const [notifications,
setNotifications] =
useState([]);
  const [budgetAdvice, setBudgetAdvice] =
    useState(null);
  const [scamAlerts, setScamAlerts] =
    useState([]);
  const [expenses, setExpenses] =
    useState([]);

  const [expenseLabel, setExpenseLabel] =
    useState("");

  const [expenseAmount,
    setExpenseAmount] =
    useState("");

  const [expenseDay,
    setExpenseDay] =
    useState("Day 1");;
  const [editingIndex, setEditingIndex] =
    useState(null);

  const [editLabel, setEditLabel] =
    useState("");

  const [editAmount, setEditAmount] =
    useState("");
  const [user, setUser] = useState(null);
  const homeRef = useRef(null);
  const tripsRef = useRef(null);
  useEffect(() => {
    const storedTrips = localStorage.getItem("savedTrips");
    if (storedTrips) {
      setSavedTrips(JSON.parse(storedTrips));
    }

  }, []);
  useEffect(() => {

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {

          setUser(currentUser);

          if (!currentUser) {
            setSavedTrips([]);
            return;
          }

          try {

            const q = query(
              collection(db, "trips"),
              where(
                "userId",
                "==",
                currentUser.uid
              )
            );

            const querySnapshot =
              await getDocs(q);

            const trips = [];

            querySnapshot.forEach((doc) => {

              trips.push({
                id: doc.id,
                ...doc.data(),
              });

            });
            trips.reverse();
            setSavedTrips(trips);

          } catch (error) {

            console.log(error);

          }

        }
      );

    return () => unsubscribe();

  }, []);
  
  const saveTrip = async () => {

    if (!tripPlan?.tripTitle) return;

    if (!user) {
      alert("Please login first");
      return;
    }

    const newTrip = {
      userId: user.uid,
      destination,
      budget,
      days,
      mood,
      hotelType,
      tripPlan,
      createdAt: new Date(),
    };

    try {
      const docRef = await addDoc(
        collection(db, "trips"),
        newTrip
      );

      setSavedTrips((prev) => [
        ...prev,
        {
          id: docRef.id,
          ...newTrip,
        }
      ]);

      alert("Trip Saved Successfully!");

    } catch (error) {

      console.log(error);

      alert("Error saving trip");

    }

  };
  

  const login = async () => {

    try {

      const result = await signInWithPopup(
        auth,
        provider
      );

      setUser(result.user);

    } catch (error) {

      console.log(error);

    }

  };

  const logout = async () => {

    await signOut(auth);

    setUser(null);

  };

  const loadSavedTrips = async () => {

    if (!user) return;

    try {

      const q = query(
        collection(db, "trips"),
        where("userId", "==", user.uid)
      );

      const querySnapshot =
        await getDocs(q);

      const trips = [];

      querySnapshot.forEach((doc) => {

        trips.push({
          id: doc.id,
          ...doc.data(),
        });

      });

      setSavedTrips(trips);

    } catch (error) {

      console.log(error);
    }

  };

  const deleteTrip = async (tripId) => {

    try {

      console.log("Deleting:", tripId);

      const tripRef = doc(
        db,
        "trips",
        tripId
      );

      await deleteDoc(tripRef);

      const updatedTrips =
        savedTrips.filter(
          (trip) =>
            trip.id !== tripId
        );

      setSavedTrips(updatedTrips);

      alert("Trip Deleted Successfully!");

    } catch (error) {

      console.log(
        "Delete Error:",
        error
      );

      alert(
        error.message
      );
    }

  };
  
  const toggleFavorite = async (
    tripId,
    currentStatus
  ) => {

    try {

      const tripRef = doc(
        db,
        "trips",
        tripId
      );

      await updateDoc(
        tripRef,
        {
          favorite: !currentStatus
        }
      );

      const updatedTrips =
        savedTrips.map((trip) =>

          trip.id === tripId
            ? {
              ...trip,
              favorite:
                !currentStatus
            }
            : trip
        );

      setSavedTrips(updatedTrips);

    } catch (error) {

      console.log(error);

    }

  };

    const shareTrip = async () => {

      if (!tripPlan?.tripTitle) return;

      const dayWisePlan =
        tripPlan.days
          ?.map((day) => {

            const activities =
              day.activities
                ?.map(
                  (activity) =>
                    `   • ${activity}`
                )
                .join("\n");

            return `
📅 Day ${day.day}: ${day.title}

🎯 Activities:
${activities}

🍽 Food:
${day.food}

🏨 Hotel:
${day.hotelSuggestion}
`;
          })
          .join("\n━━━━━━━━━━━━━━\n");

      const tripText = `

✈ *${tripPlan.tripTitle}*

📍 Destination: ${destination}
💰 Budget: ₹${budget}
📅 Total Days: ${days}
🏨 Stay: ${hotelType}
🌴 Mood: ${mood}
🧳 Trip Type: ${tripType}

━━━━━━━━━━━━━━

${dayWisePlan}

━━━━━━━━━━━━━━

🤖 Planned with AI Travel Planner
`;

      try {

        if (navigator.share) {

          await navigator.share({
            title: tripPlan.tripTitle,
            text: tripText,
          });

        } else {

          const whatsappURL =
            `https://wa.me/?text=${encodeURIComponent(tripText)}`;

          window.open(
            whatsappURL,
            "_blank"
          );
        }

      } catch (error) {

        console.log(
          "Share cancelled",
          error
        );

      }

    };
    const addExpense = () => {

      if (
        !expenseLabel ||
        !expenseAmount
      ) {
        alert("Fill all fields");
        return;
      }

      const newExpense = {
        label: expenseLabel,

        amount: Number(
          expenseAmount
        ),

        day: expenseDay,
      };

      setExpenses((prev) => [
        ...prev,
        newExpense
      ]);
      setExpenseLabel("");
      setExpenseAmount("");
      setExpenseDay("Day 1");
    };
  
    const editExpense = (index) => {

      setEditingIndex(index);

      setEditLabel(
        expenses[index].label
      );

      setEditAmount(
        expenses[index].amount
      );
    };

    const saveExpense = () => {

      const updatedExpenses =
        [...expenses];

      updatedExpenses[
        editingIndex
      ] = {
        label: editLabel,
        amount: Number(editAmount),
      };

      setExpenses(
        updatedExpenses
      );

      setEditingIndex(null);

      setEditLabel("");
      setEditAmount("");
    };

    const deleteExpense = (
      index
    ) => {

      setExpenses(
        expenses.filter(
          (_, i) => i !== index
        )
      );
    };
    const handleSubmit = async () => {

      try {

        setLoading(true);

        if (
          !startingCity ||
          !destination ||
          !budget ||
          !days ||
          !tripType ||
          !hotelType ||
          !mood
        ) {

          alert(
            "Please fill all fields"
          );

          setLoading(false);

          return;

        }

        const aiResponse = await generateTripPlan(
          destination,
          budget,
          days,
          tripType,
          mood,
          hotelType
        );

        setTripPlan(aiResponse);

        try {

          const famousPlacesResponse =
            await fetch(
              "https://openrouter.ai/api/v1/chat/completions",
              {
                method: "POST",

                headers: {
                  Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
                  "Content-Type":
                    "application/json",
                },

                body: JSON.stringify({
                  model:
                    "openai/gpt-3.5-turbo",

                  messages: [
                    {
                      role: "user",
                      content:
                        `Give me only 8 famous tourist places of ${destination} as JSON array. Example:
["Hawa Mahal","Amer Fort","Jal Mahal"]`
                    },
                  ],
                }),
              }
            );

          const famousPlacesData =
            await famousPlacesResponse.json();

          const aiText =
            famousPlacesData
              ?.choices?.[0]
              ?.message?.content;

          let places = [];

          try {

            places =
              JSON.parse(aiText);

          } catch {

            places = [
              `${destination} tourist places`,
              `${destination} famous fort`,
              `${destination} city view`,
              `${destination} palace`,
              `${destination} tourist attraction`,
              `${destination} temple`,
              `${destination} mountain`,
              `${destination} famous market`
            ];

          }

          const imagePromises =
            (places || []).map(
              async (place) => {

                const imgResponse =
                  await axios.get(
                    "https://api.unsplash.com/search/photos",
                    {
                      params: {
                        query: place,
                        per_page: 1,
                      },

                      headers: {
                        Authorization:
                          "Client-ID RDnrSjPvOny0CGOyhiInUl9YUHPjiAnj6icTkaHvupk",
                      },
                    }
                  );

                return {

                  image:
                    imgResponse.data
                      ?.results?.[0]
                      ?.urls?.regular ||

                    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",

                  title:
                    place,

                };

              }
            );

          const finalImages =
            await Promise.all(
              imagePromises
            );

          setDestinationImages(
            finalImages
          );

          const markerPromises =
            (places || []).map(
              async (place) => {

                try {

                  const geoResponse =
                    await axios.get(
                      "https://api.geoapify.com/v1/geocode/search",
                      {
                        params: {
                          text: `${place}, ${destination}`,
                          apiKey:
                            "a079693256694f49b8bb54515c5606bc",
                        },
                      }
                    );

                  const feature =
                    geoResponse?.data
                      ?.features?.[0];

                  return {

                    name: place,

                    lat:
                      feature?.properties
                        ?.lat,

                    lon:
                      feature?.properties
                        ?.lon,
                  };

                } catch {

                  return null;

                }

              }
            );

          const finalMarkers =
            await Promise.all(
              markerPromises
            );

          setPlaceMarkers(
            finalMarkers.filter(Boolean)
          );

          setHeroImage(
            finalImages?.[0]
              ?.image || ""
          );

          try {

            const tipsResponse =
              await fetch(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                  method: "POST",

                  headers: {
                    Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,

                    "Content-Type":
                      "application/json",
                  },

                  body: JSON.stringify({
                    model:
                      "openai/gpt-3.5-turbo",

                    messages: [
                      {
                        role: "user",
                        content: `
Give me only 5 travel tips for ${destination}.

Trip Type: ${tripType}
Mood: ${mood}

Return ONLY JSON array.

Example:
[
"Use metro for travel",
"Try local food"
]
`
                      },
                    ],
                  }),
                }
              );

            const tipsData =
              await tipsResponse.json();

            const tipsText =
              tipsData?.choices?.[0]
                ?.message?.content;

            try {

              setTravelTips(
                JSON.parse(tipsText)
              );

            } catch {

              setTravelTips([
                "Explore local markets",
                "Try local food",
                "Carry water bottle",
                "Use local transport",
                "Check weather before travel"
              ]);

            }

          } catch (error) {

            console.log(
              "Travel Tips Error:",
              error
            );

          }
          try {

            const budgetAIResponse =
              await fetch(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                  method: "POST",

                  headers: {
                    Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,

                    "Content-Type":
                      "application/json",
                  },

                  body: JSON.stringify({
                    model:
                      "openai/gpt-3.5-turbo",

                    messages: [
                      {
                        role: "user",
                        content: `
Analyze this trip budget.

Destination: ${destination}
Budget: ₹${budget}
Days: ${days}
Trip Type: ${tripType}
Hotel Type: ${hotelType}
Mood: ${mood}

Return ONLY JSON.

Example:

{
 "risk":"Medium",
 "dailyBudget":"2500",
 "tips":[
   "Use metro instead of taxi",
   "Avoid overspending on hotels",
   "Keep emergency cash"
 ]
}
`
                      }
                    ]
                  })
                }
              );

            const budgetData =
              await budgetAIResponse.json();

            const budgetText =
              budgetData?.choices?.[0]
                ?.message?.content;

            try {

              setBudgetAdvice(
                JSON.parse(
                  budgetText
                )
              );

            } catch {

              setBudgetAdvice({
                risk: "Low",
                dailyBudget:
                  Math.round(
                    budget / days
                  ),
                tips: [
                  "Track daily expenses",
                  "Avoid overspending",
                  "Use local transport"
                ]
              });

            }

          } catch (error) {

            console.log(
              "Budget AI Error:",
              error
            );

          }

        } catch (error) {

          console.log(
            "Destination Image Error:",
            error
          );

        }
        try {

          const scamResponse =
            await fetch(
              "https://openrouter.ai/api/v1/chat/completions",
              {
                method: "POST",

                headers: {
                  Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
                  "Content-Type":
                    "application/json",
                },

                body: JSON.stringify({
                  model:
                    "openai/gpt-3.5-turbo",

                  messages: [
                    {
                      role: "user",

                      content: `
Give me only 5 common tourist scam alerts in ${destination}.

Trip Type: ${tripType}

Return ONLY JSON array.

Example:
[
"Beware of fake taxi drivers",
"Avoid overpriced tourist shops"
]
`
                    },
                  ],
                }),
              }
            );

          const scamData =
            await scamResponse.json();

          const scamText =
            scamData?.choices?.[0]
              ?.message?.content;

          try {

            setScamAlerts(
              JSON.parse(scamText)
            );

          } catch {

            setScamAlerts([
              "Avoid overpriced taxis",
              "Beware of fake tour guides",
              "Check payment before booking",
              "Avoid unofficial agents",
              "Keep belongings safe"
            ]);

          }

        } catch (error) {

          console.log(
            "Scam Alerts Error:",
            error
          );

        }
        try {

          const travelResponse =
            await fetch(
              "https://openrouter.ai/api/v1/chat/completions",
              {
                method: "POST",

                headers: {
                  Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
                  "Content-Type":
                    "application/json",
                },

                body: JSON.stringify({
                  model:
                    "openai/gpt-3.5-turbo",

                  messages: [
                    {
                      role: "user",

                      content: `
Give estimated travel cost from ${startingCity} to ${destination}

Return ONLY JSON.

Example:

{
"flight":"₹5000 - ₹8000",
"train":"₹1200 - ₹2500",
"bus":"₹1000 - ₹3000",
"selfDrive":"₹4500"
}
`
                    }
                  ]
                })
              }
            );

          const travelData =
            await travelResponse.json();

          const travelText =
            travelData?.choices?.[0]
              ?.message?.content;

          try {

            setTravelCost(
              JSON.parse(
                travelText
              )
            );

          } catch {

            setTravelCost({
              flight:
                "₹5000 - ₹8000",

              train:
                "₹1200 - ₹2500",

              bus:
                "₹1000 - ₹2500",

              selfDrive:
                "₹4500"
            });

          }

        } catch (error) {

          console.log(
            "Travel Cost Error:",
            error
          );

        }

        let weatherData = null;

        try {

          const weatherResponse =
            await fetch(
              `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(destination)}&appid=7a4f810a427cb7dc3b5bd564da3d2970&units=metric`
            );

          weatherData =
            await weatherResponse.json();

          if (
            weatherData.cod !== 200
          ) {

            console.log(
              "Weather Error:",
              weatherData
            );

          } else {

            setWeather(weatherData);

          }

        } catch (error) {

          console.log(
            "Weather API Error:",
            error
          );

        }

        let filteredHotels = [];

        try {

          const hotelResponse =
            await axios.get(
              "https://api.geoapify.com/v2/places",
              {
                params: {
                 categories:
hotelType === "Hostel"
  ? "accommodation"
  : "accommodation",
                  text:
                    destination || "hotel",

                  limit: 6,

                  apiKey:
                    "a079693256694f49b8bb54515c5606bc",
                },
              }
            );

          const hotelResults =
            hotelResponse?.data?.features || [];

          filteredHotels =
            hotelResults.slice(0, 6).map(
              (hotel) => ({

                name:
                  hotel?.properties?.name
                  || "Hotel",

                image:
                  `https://source.unsplash.com/600x400/?hotel,${destination}`,

                rating:
                  Number(budget) > 50000
                    ? "5 ⭐"
                    : Number(budget) > 20000
                      ? "4 ⭐"
                      : "3 ⭐",

                area:
                  hotel?.properties?.formatted
                  || "Location unavailable",
              
                latitude:
                  hotel?.properties?.lat,

                longitude:
                  hotel?.properties?.lon,

                price:
                  Number(budget) > 50000
                    ? "₹15000/night"
                    : Number(budget) > 20000
                      ? "₹7000/night"
                      : "₹2500/night",

              })
            );

          setHotels(filteredHotels);

        } catch (error) {

          console.log(
            "Hotel API Error:",
            error
          );

          setHotels([]);

        }

      } catch (error) {

        console.log(error);

        alert(error.message || "Something went wrong");

      } finally {

        setLoading(false);

      }
    };

    const weatherCondition =
      weather?.weather?.[0]?.main || "";

    const weatherBg =
      weatherCondition === "Clear"
        ? "from-yellow-300 via-orange-300 to-amber-500"

        : weatherCondition === "Clouds"
          ? "from-slate-300 via-gray-400 to-slate-500"

          : weatherCondition === "Rain"
            ? "from-blue-400 via-sky-500 to-indigo-700"

            : weatherCondition === "Thunderstorm"
              ? "from-purple-600 via-slate-800 to-black"

              : weatherCondition === "Snow"
                ? "from-cyan-100 via-blue-200 to-slate-300"

                : "from-blue-200 via-sky-300 to-indigo-400";
  
    const totalBudget =
      Number(budget) || 0;

    // FINAL CALCULATIONS

    let hotelPercent = 0.35;
    let foodPercent = 0.20;
    let transportPercent = 0.15;
    let activitiesPercent = 0.20;
    let miscPercent = 0.10;

    // HOTEL TYPE BASED

    if (hotelType === "Luxury Hotel") {
      hotelPercent += 0.15;
      miscPercent += 0.05;
    }

    if (hotelType === "Budget Hotel") {
      hotelPercent -= 0.05;
    }

    if (hotelType === "Hostel") {
      hotelPercent -= 0.15;
      activitiesPercent += 0.10;
    }

    // TRIP TYPE BASED

    if (tripType === "Adventure") {
      activitiesPercent += 0.15;
      transportPercent += 0.05;
      hotelPercent -= 0.10;
    }

    if (tripType === "Family") {
      foodPercent += 0.10;
      hotelPercent += 0.05;
    }

    if (tripType === "Romantic") {
      foodPercent += 0.05;
      miscPercent += 0.05;
    }

    // MOOD BASED

    if (mood === "Luxury") {
      hotelPercent += 0.10;
      miscPercent += 0.05;
    }

    if (mood === "Budget Friendly") {
      hotelPercent -= 0.10;
      transportPercent += 0.05;
    }

    // FINAL CALCULATION

    const hotelBudget =
      Math.round(budget * hotelPercent);

    const foodBudget =
      Math.round(budget * foodPercent);

    const transportBudget =
      Math.round(
        budget * transportPercent
      );

    const activitiesBudget =
      Math.round(
        budget * activitiesPercent
      );

    const miscBudget =
      Math.round(budget * miscPercent);

    const totalSpent =
      expenses.reduce(
        (sum, expense) =>
          sum + Number(expense.amount),
        0
      );
  
    const dayWiseExpenses =
      expenses.reduce(
        (acc, expense) => {

          if (
            !acc[
            expense.day
            ]
          ) {

            acc[
              expense.day
            ] = 0;
          }

          acc[
            expense.day
          ] += Number(
            expense.amount
          );

          return acc;

        },
        {}
      );

    const remainingBudget =
      
      totalBudget - totalSpent;
  
  const smartNotifications = [];

// Budget warning

if (
  remainingBudget <
  budget * 0.3
) {

  smartNotifications.push({
    type: "budget",

    message:
      "⚠ Budget running low"
  });

}

// Overspending

if (
  totalSpent >
  budget * 0.8
) {

  smartNotifications.push({
    type: "expense",

    message:
      "💸 High spending detected"
  });

}

// Weather alert

if (
  weather?.weather?.[0]
    ?.main
    ?.toLowerCase()
    .includes("rain")
) {

  smartNotifications.push({
    type: "weather",

    message:
      "☔ Rain expected — carry umbrella"
  });

}

// Scam alert

if (
  scamAlerts.length > 0
) {

  smartNotifications.push({
    type: "scam",

    message:
      `🚨 ${
        scamAlerts[0]
      }`
  });

}
  
    const categorizedExpenses = {
      Hotel: 0,
      Travel: 0,
      Food: 0,
      Tickets: 0,
      Shopping: 0,
      Others: 0,
    };

    expenses.forEach((expense) => {

      const label =
        expense.label.toLowerCase();

      const amount =
        Number(expense.amount);

      if (
        label.includes("hotel") ||
        label.includes("stay") ||
        label.includes("room")
      ) {

        categorizedExpenses.Hotel +=
          amount;

      } else if (

        label.includes("flight") ||
        label.includes("train") ||
        label.includes("cab") ||
        label.includes("taxi") ||
        label.includes("uber") ||
        label.includes("bus") ||
        label.includes("travel")

      ) {

        categorizedExpenses.Travel +=
          amount;

      } else if (

        label.includes("food") ||
        label.includes("tea") ||
        label.includes("coffee") ||
        label.includes("dinner") ||
        label.includes("breakfast") ||
        label.includes("lunch") ||
        label.includes("snack")

      ) {

        categorizedExpenses.Food +=
          amount;

      } else if (

        label.includes("ticket") ||
        label.includes("entry") ||
        label.includes("museum")

      ) {

        categorizedExpenses.Tickets +=
          amount;

      } else if (

        label.includes("shopping") ||
        label.includes("cloth") ||
        label.includes("gift")

      ) {

        categorizedExpenses.Shopping +=
          amount;

      } else {

        categorizedExpenses.Others +=
          amount;
      }

    });

    const expenseChartData =
      Object.entries(
        categorizedExpenses
      )
    
        .filter(
          ([_, value]) =>
            value > 0
        )
        .map(
          ([name, value]) => ({
            name,
            value,
          })
        );
  
    const chartColors = [
      "#2563EB", // blue
      "#16A34A", // green
      "#F97316", // orange
      "#E11D48", // pink
      "#9333EA", // purple
      "#6B7280", // gray
    ];
    return (
    
      
      <div
        className={`min-h-screen transition duration-500 ${darkMode
            ? "bg-slate-950 text-white"
            : "bg-gradient-to-br from-slate-100 via-blue-100 to-slate-200"
          }`}
      >

        <nav className="flex justify-between items-center bg-white/70 backdrop-blur-lg p-6 rounded-3xl shadow-2xl border border-white/20 mb-10 sticky top-4 z-50">

          <h1
            onClick={() => {

              setTripPlan(null);
              setSelectedTrip(null);
              setDestination("");
              setHotels([]);
              setWeather(null);
              setImageUrl("");

            }}
            className="text-3xl font-bold cursor-pointer hover:text-blue-600 transition"
          >
            AI Travel Planner
          </h1>
          <div>

            {
              user ? (

                <div className="flex items-center gap-4">

                  <img
                    src={user.photoURL}
                    alt="user"
                    className="w-10 h-10 rounded-full"
                  />

                  <button
                    onClick={logout}
                    className="bg-red-500 text-white px-4 py-2 rounded-xl"
                  >
                    Logout
                  </button>

                </div>

              ) : (

                <button
                  onClick={login}
                  className="bg-blue-600 text-white px-5 py-3 rounded-xl"
                >
                  Login with Google
                </button>

              )
            }

          </div>

          <div className="space-x-6 text-lg">

            <button
              onClick={() =>
                homeRef.current?.scrollIntoView({
                  behavior: "smooth"
                })
              }
              className="hover:text-blue-500"
            >
              Home
            </button>

            <button
              onClick={() =>
                tripsRef.current?.scrollIntoView({
                  behavior: "smooth"
                })
              }
              className="hover:text-blue-500"
            >
              Trips
            </button>
          
            <button
              onClick={() =>
                setDarkMode(!darkMode)
              }
              className="bg-gray-200 px-5 py-3 rounded-2xl font-bold hover:scale-105 transition"
            >
              {
                darkMode
                  ? "☀ Light"
                  : "🌙 Dark"
              }
            </button>
          
          </div>
 
        </nav>

        <div
          ref={homeRef}
          className={`backdrop-blur-xl border shadow-2xl rounded-[40px] p-10 w-full max-w-5xl mx-auto transition duration-500 ${darkMode
              ? "bg-slate-900/90 border-slate-700 text-white"
              : "bg-white/70 border-white/30 text-black"
            }`}
        >

          <h1 className="text-5xl font-bold text-center mb-8">
            AI Travel Planner
          </h1>
          <div className="relative mb-10">

            <img
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e"
              alt="travel"
              className="w-full h-[420px] rounded-[40px] object-cover shadow-2xl"
            />

            <div className="absolute inset-0 bg-black/40 rounded-[40px] flex flex-col justify-center items-center text-center p-8">

              <h1 className="text-6xl font-bold text-white mb-5">
                Explore The World
              </h1>

              <p className="text-white text-2xl max-w-2xl">
                AI-powered smart trip planning
                for unforgettable journeys
              </p>

            </div>

          </div>
          {
            heroImage && (

              <div className="mb-10 relative overflow-hidden rounded-[40px] shadow-2xl">

                <img
                  src={heroImage || imageUrl}
                  alt="Travel Destination"
                  className="w-full h-[450px] object-cover hover:scale-110 transition duration-700"
                />

                <div className="absolute inset-0 bg-black/30 flex items-end p-10">

                  <div>

                    <h2 className="text-5xl font-bold text-white mb-2">
                      Explore {destination}
                    </h2>

                    <p className="text-white text-xl">
                      Discover beautiful places,
                      hotels, and unforgettable memories
                    </p>

                  </div>

                </div>

              </div>

            )
          }
          {
            destinationImages.length > 0 && (

              <div className="mb-12">

                <h2 className="text-4xl font-bold mb-8">
                  Explore More of {destination}
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">

                  {
                    destinationImages.map(
                      (item, index) => (

                        <div
                          key={index}
                          className="overflow-hidden rounded-[30px] shadow-xl bg-white hover:scale-105 transition duration-300"
                        >

                          <img
                            src={item.image}
                            alt="destination"
                            className="w-full h-72 object-cover"
                          />

                          <div
                            className={`p-4 ${darkMode
                                ? "bg-slate-800 text-white"
                                : "bg-white text-black"
                              }`}
                          >
                            <h3 className="text-xl font-bold">
                              {item.title}
                            </h3>
                          </div>

                        </div>

                      )
                    )
                  }

                </div>

              </div>

            )
          }
          <div className="space-y-5">

            <input
  type="text"
  placeholder="Enter Starting City"
  value={startingCity}
  onChange={(e) =>
    setStartingCity(
      e.target.value
    )
  }
  className={`w-full p-5 rounded-[25px] border outline-none transition ${
    darkMode
      ? "bg-slate-800 text-white border-slate-600 placeholder:text-gray-400"
      : "bg-white text-black border-gray-300"
  }`}
/>

            <input
              type="text"
              placeholder="Enter Destination"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className={`w-full p-5 rounded-[25px] border outline-none transition ${darkMode
                  ? "bg-slate-800 text-white border-slate-600 placeholder:text-gray-400"
                  : "bg-white text-black border-gray-300"
                }`}
            />

            <input
              type="number"
              placeholder="Enter Budget"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className={`w-full p-5 rounded-[25px] border outline-none transition ${darkMode
                  ? "bg-slate-800 text-white border-slate-600 placeholder:text-gray-400"
                  : "bg-white text-black border-gray-300"
                }`}
            />

            <input
              type="number"
              placeholder="Number of Days"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className={`w-full p-5 rounded-[25px] border outline-none transition ${darkMode
                  ? "bg-slate-800 text-white border-slate-600 placeholder:text-gray-400"
                  : "bg-white text-black border-gray-300"
                }`}
            />
            <select
              value={tripType}
              onChange={(e) => setTripType(e.target.value)}
              className={`w-full p-5 rounded-[25px] border outline-none transition ${darkMode
                  ? "bg-slate-800 text-white border-slate-600"
                  : "bg-white text-black border-gray-300"
                }`}
            >

              <option value="">
                Select Trip Type
              </option>

              <option value="Family Trip">
                Family Trip
              </option>

              <option value="Honeymoon">
                Honeymoon
              </option>

              <option value="Friends Trip">
                Friends Trip
              </option>

              <option value="Solo Trip">
                Solo Trip
              </option>
  
              <option value="Business Trip">
                Business Trip
              </option>

            </select>
            <select
              value={hotelType}
              onChange={(e) => setHotelType(e.target.value)}
              className={`w-full p-5 rounded-[25px] border outline-none transition ${darkMode
                  ? "bg-slate-800 text-white border-slate-600"
                  : "bg-white text-black border-gray-300"
                }`}
            >

              <option value="">
                Select Stay Preference
              </option>

              <option value="Luxury Hotel">
                Luxury Hotel
              </option>

              <option value="Budget Hotel">
                Budget Hotel
              </option>

              <option value="Hostel">
                Hostel
              </option>

              <option value="Resort">
                Resort
              </option>

            </select>
            <select
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              className={`w-full p-5 rounded-[25px] border outline-none transition ${darkMode
                  ? "bg-slate-800 text-white border-slate-600"
                  : "bg-white text-black border-gray-300"
                }`}
            >

              <option value="">
                Select Travel Mood
              </option>

              <option value="Relaxing">
                Relaxing
              </option>

              <option value="Adventure">
                Adventure
              </option>

              <option value="Party">
                Party
              </option>

              <option value="Nature">
                Nature
              </option>

            </select>


            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-black text-white py-5 rounded-2xl text-xl font-bold transition hover:scale-[1.02]"
            >
              {loading ? (
                <div className="flex flex-col items-center gap-2">

                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>

                  <span>
                    🌍 Planning Your Dream Trip...
                  </span>

                  <span className="text-sm opacity-80">
                    🏨 Hotels • 🌦 Weather • 📸 Photos • 🤖 AI
                  </span>

                </div>
              ) : (
                "Generate AI Trip"
              )}
            </button>

            

            {
              tripPlan?.days && (

                <>
                  <button
                    onClick={shareTrip}
                    className="w-full bg-purple-600 text-white py-4 rounded-xl text-lg mt-4"
                  >
                    📤 Share Trip
                  </button>
                  <button
                    onClick={saveTrip}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl text-lg mt-4"
                  >
                    Save Trip
                  </button>

                </>

              )
            }
          </div>

          {
            selectedTrip && (

              <div className="mt-10">

                <h2 className="text-4xl font-bold mb-5">

                  Saved Trip Details

                </h2>

                <h3 className="text-2xl font-bold mb-5">

                  {
                    selectedTrip.tripPlan
                      ?.tripTitle
                  }

                </h3>

                <div className="grid gap-5">

                  {
                    selectedTrip.tripPlan
                      ?.days?.map(
                        (day, index) => (

                          <div
                            key={index}
                            className="bg-white p-5 rounded-2xl shadow-lg"
                          >

                            <h3 className="text-xl font-bold">

                              Day {day.day}:
                              {day.title}

                            </h3>

                            <ul className="list-disc ml-5 mt-3">

                              {
                                day?.activities?.map(
                                  (activity, i) => (

                                    <li key={i}>
                                      {activity}
                                    </li>

                                  )
                                )
                              }

                            </ul>

                          </div>

                        )
                      )
                  }

                </div>

              </div>

            )
          }
          {
            savedTrips.length > 0 && (

              <div
                ref={tripsRef}
                className={`mt-10 ${darkMode
                    ? "text-white"
                    : "text-black"
                  }`}
              >

                <h2 className="text-3xl font-bold mb-5">
                  Saved Trips
                </h2>

                <div className="grid md:grid-cols-2 gap-5">

                  {
                    savedTrips.map((trip, index) => (

                      <div
                        key={index}
                        onClick={() => {

  setSelectedTrip(trip);

  setDestination(
    trip.destination || ""
  );

  setBudget(
    trip.budget || ""
  );

  setDays(
    trip.days || ""
  );

  setMood(
    trip.mood || ""
  );

  setHotelType(
    trip.hotelType || ""
  );

  setTripPlan(
    trip.tripPlan || null
  );

  // Optional reset
  setExpenses([]);

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}}
                        className={`rounded-[35px] p-8 shadow-xl transition ${darkMode
                            ? "bg-slate-800 text-white"
                            : "bg-white text-black"
                          }`}
                      >
        

                        <h3 className="text-2xl font-bold mb-2">
                          {trip.destination}
                        </h3>

                        <p>
                          💰 Budget: ₹{trip.budget}
                        </p>

                        <p>
                          📅 Days: {trip.days}
                        </p>

                        <p>
                          🌴 Mood: {trip.mood}
                        </p>

                        <button
  onClick={(e) => {

    e.stopPropagation();

    setDestination(
      trip.destination || ""
    );

    setBudget(
      trip.budget || ""
    );

    setDays(
      trip.days || ""
    );

    setMood(
      trip.mood || ""
    );

    setHotelType(
      trip.hotelType || ""
    );

    setTripPlan(
      trip.tripPlan || null
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

  }}

  className="mt-4 bg-green-600 text-white px-4 py-2 rounded-xl mr-3"
>
  Resume Trip
                        </button>
                        
                        <button
                          onClick={(e) => {

                            e.stopPropagation();

                            deleteTrip(trip.id);

                          }}
                          className="mt-4 bg-red-500 text-white px-4 py-2 rounded-xl"

                          
                        >
                          Delete Trip
                        </button>

                      </div>

                    ))
                  }

                </div>

              </div>

            )
          }

          {
            weather &&
            weather.main &&
            weather.weather && (

              <div
                className={`bg-gradient-to-br ${weatherBg}
      rounded-[40px]
      p-10
      shadow-2xl
      my-10
      text-white`}
              >

                <div className="flex justify-between items-center mb-10">

                  <div>

                    <h2 className="text-5xl font-extrabold">
                      🌦 Weather Information
                    </h2>

                    <p className="text-xl mt-2 opacity-90">
                      Current weather in {destination}
                    </p>

                  </div>

                  <h1 className="text-7xl font-black">
                    {weather?.main?.temp ?? "N/A"}°
                  </h1>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                  <div className="bg-white/20 backdrop-blur-xl rounded-[30px] p-8">

                    <p className="text-2xl font-semibold">
                      🌡 Temperature
                    </p>

                    <h3 className="text-4xl font-bold mt-4">
                      {weather?.main?.temp ?? "N/A"}°C
                    </h3>

                  </div>

                  <div className="bg-white/20 backdrop-blur-xl rounded-[30px] p-8">

                    <p className="text-2xl font-semibold">
                      💨 Wind Speed
                    </p>

                    <h3 className="text-4xl font-bold mt-4">
                      {weather?.wind?.speed ?? "N/A"} km/h
                    </h3>

                  </div>

                  <div className="bg-white/20 backdrop-blur-xl rounded-[30px] p-8">

                    <p className="text-2xl font-semibold">
                      💧 Humidity
                    </p>

                    <h3 className="text-4xl font-bold mt-4">
                      {weather?.main?.humidity ?? "N/A"}%
                    </h3>

                  </div>

                  <div className="bg-white/20 backdrop-blur-xl rounded-[30px] p-8">

                    <p className="text-2xl font-semibold">
                      ☁ Condition
                    </p>

                    <h3 className="text-4xl font-bold mt-4">
                      {weather?.weather?.[0]?.main || "N/A"}
                    </h3>

                  </div>

                </div>

              </div>

            )
          }
          
          {
            budget && (

              <div
                className={`rounded-[35px] p-8 shadow-xl transition ${darkMode
                    ? "bg-slate-800 text-white"
                    : "bg-white text-black"
                  }`}
              >

                <div className="flex justify-between items-center mb-8">

                  <div>

                    <h2 className="text-4xl font-bold">
                      💰 Budget Analytics
                    </h2>

                    <p className="text-gray-500 mt-2">
                      AI estimated spending breakdown
                    </p>

                  </div>

                  <h1 className="text-5xl font-black text-blue-600">
                    ₹{totalBudget.toLocaleString()}
                  </h1>

                </div>

                <div className="space-y-6">

                  {/* Hotel */}

                  <div>

                    <div className="flex justify-between mb-2">

                      <span className="font-bold">
                        🏨 Hotels
                      </span>

                      <span>
                        ₹{hotelBudget}
                      </span>

                    </div>

                    <div className="bg-gray-200 rounded-full h-4 overflow-hidden">

                      <div
                        className="bg-blue-600 h-full rounded-full"
                        style={{
                          width: `${hotelPercent * 100}%`
                        }}
                      ></div>

                    </div>

                  </div>

                  {/* Food */}

                  <div>

                    <div className="flex justify-between mb-2">

                      <span className="font-bold">
                        🍔 Food
                      </span>

                      <span>
                        ₹{foodBudget}
                      </span>

                    </div>

                    <div className="bg-gray-200 rounded-full h-4 overflow-hidden">

                      <div
                        className="bg-green-500 h-full rounded-full"
                        style={{
                          width: `${foodPercent * 100}%`
                        }}
                      ></div>

                    </div>

                  </div>

                  {/* Travel */}

                  <div>

                    <div className="flex justify-between mb-2">

                      <span className="font-bold">
                        🚕 Transport
                      </span>

                      <span>
                        ₹{transportBudget}
                      </span>

                    </div>

                    <div className="bg-gray-200 rounded-full h-4 overflow-hidden">

                      <div
                        className="bg-purple-500 h-full rounded-full"
                        style={{
                          width: `${transportPercent * 100}%`
                        }}
                      ></div>

                    </div>

                  </div>

                  {/* Activities */}

                  <div>

                    <div className="flex justify-between mb-2">

                      <span className="font-bold">
                        🎟 Activities
                      </span>

                      <span>
                        ₹{activitiesBudget}
                      </span>

                    </div>

                    <div className="bg-gray-200 rounded-full h-4 overflow-hidden">

                      <div
                        className="bg-orange-500 h-full rounded-full"
                        style={{
                          width: `${activitiesPercent * 100}%`
                        }}
                      ></div>

                    </div>

                  </div>

                  {/* Misc */}

                  <div>

                    <div className="flex justify-between mb-2">

                      <span className="font-bold">
                        💸 Miscellaneous
                      </span>

                      <span>
                        ₹{miscBudget}
                      </span>

                    </div>

                    <div className="bg-gray-200 rounded-full h-4 overflow-hidden">

                      <div
                        className="bg-red-500 h-full rounded-full"
                        style={{
                          width: `${miscPercent * 100}%`
                        }}
                      ></div>

                    </div>

                  </div>

                </div>

              </div>

            )
          }
          {
            budget && (

              <div
                className={`my-10 rounded-[35px] p-8 shadow-2xl ${darkMode
                    ? "bg-slate-800 text-white"
                    : "bg-white text-black"
                  }`}
              >

                <h2 className="text-4xl font-bold mb-6">
                  🧾 Expense Tracker
                </h2>

                <div className="grid md:grid-cols-2 gap-4 mb-5">

                  <input
                    type="text"
                    placeholder="Expense Label"
                    value={expenseLabel}
                    onChange={(e) =>
                      setExpenseLabel(
                        e.target.value
                      )
                    }
                    className={`p-4 rounded-2xl border ${darkMode
                        ? "bg-slate-700 border-slate-600"
                        : "bg-white"
                      }`}
                  />

                  <input
                    type="number"
                    placeholder="Amount"
                    value={expenseAmount}
                    onChange={(e) =>
                      setExpenseAmount(
                        e.target.value
                      )
                    }
                    className={`p-4 rounded-2xl border ${darkMode
                        ? "bg-slate-700 border-slate-600"
                        : "bg-white"
                      }`}
                  />
                  <select
                    value={expenseDay}
                    onChange={(e) =>
                      setExpenseDay(
                        e.target.value
                      )
                    }
                    className={`p-4 rounded-2xl border ${darkMode
                        ? "bg-slate-700 border-slate-600 text-white"
                        : "bg-white text-black"
                      }`}
                  >

                    {
                      Array.from(
                        { length: Number(days) || 1 },
                        (_, i) => (
                          <option
                            key={i}
                          >
                            Day {i + 1}
                          </option>
                        )
                      )
                    }

                  </select>
                
                </div>

                <button
                  onClick={addExpense}
                  className="bg-blue-600 text-white px-6 py-4 rounded-2xl mb-6"
                >
                  + Add Expense
                </button>

                <div className="space-y-4 mb-6">

                  {
                    expenses.map(
                      (expense, index) => (

                        <div
                          key={index}
                          className={`rounded-2xl p-4 ${darkMode
                              ? "bg-slate-700"
                              : "bg-slate-100"
                            }`}
                        >

                          {
                            editingIndex ===
                              index ? (

                              <div className="space-y-3">

                                <input
                                  type="text"
                                  value={
                                    editLabel
                                  }
                                  onChange={(e) =>
                                    setEditLabel(
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 rounded-xl text-black"
                                />

                                <input
                                  type="number"
                                  value={
                                    editAmount
                                  }
                                  onChange={(e) =>
                                    setEditAmount(
                                      e.target.value
                                    )
                                  }
                                  className="w-full p-3 rounded-xl text-black"
                                />

                                <button
                                  onClick={
                                    saveExpense
                                  }
                                  className="bg-green-600 text-white px-5 py-2 rounded-xl"
                                >
                                  Save
                                </button>

                              </div>

                            ) : (

                              <div className="flex justify-between items-center">

                                <div>

                                  <h3 className="font-bold text-lg">
                                    {
                                      expense.label
                                    }
                                  </h3>

                                  <p>
                                    ₹
                                    {
                                      expense.amount
                                    }
                                  </p>

                                </div>

                                <div className="flex gap-3">

                                  <button
                                    onClick={() =>
                                      editExpense(
                                        index
                                      )
                                    }
                                    className="bg-yellow-500 text-white px-4 py-2 rounded-xl"
                                  >
                                    Edit
                                  </button>

                                  <button
                                    onClick={() =>
                                      deleteExpense(
                                        index
                                      )
                                    }
                                    className="bg-red-500 text-white px-4 py-2 rounded-xl"
                                  >
                                    Delete
                                  </button>

                                </div>

                              </div>

                            )
                          }

                        </div>

                      )
                    )
                  }

                </div>

                <div className="grid md:grid-cols-2 gap-5">

                  <div
                    className="bg-red-500 text-white rounded-[30px] p-6"
                  >
                    <h3 className="text-xl font-bold">
                      Total Spent
                    </h3>

                    <p className="text-4xl font-black mt-2">
                      ₹{totalSpent}
                    </p>
                  </div>

                  <div
                    className="bg-green-600 text-white rounded-[30px] p-6"
                  >
                    <h3 className="text-xl font-bold">
                      Remaining Budget
                    </h3>

                    <p className="text-4xl font-black mt-2">
                      ₹{remainingBudget}
                    </p>
                  </div>

                </div>

              </div>

            )
          }
          {
            Object.keys(
              dayWiseExpenses
            ).length > 0 && (

              <div
                className={`my-10 rounded-[35px] p-8 shadow-2xl ${darkMode
                    ? "bg-slate-800 text-white"
                    : "bg-white text-black"
                  }`}
              >

                <div className="flex justify-between items-center mb-8">

                  <div>

                    <h2 className="text-4xl font-black">
                      📅 Day Wise Spending
                    </h2>

                    <p
                      className={`mt-2 ${darkMode
                          ? "text-slate-300"
                          : "text-gray-500"
                        }`}
                    >
                      Track daily travel expenses
                    </p>

                  </div>

                </div>

                <div className="grid md:grid-cols-3 gap-5">

                  {
                    Object.entries(
                      dayWiseExpenses
                    ).map(
                      (
                        [day,
                          amount]
                      ) => (

                        <div
                          key={day}
                          className={`rounded-[30px] p-6 shadow-lg transition hover:scale-105 ${darkMode
                              ? "bg-slate-700"
                              : "bg-slate-100"
                            }`}
                        >

                          <h3 className="text-2xl font-bold">
                            {day}
                          </h3>

                          <p className="text-4xl font-black mt-4 text-blue-600">
                            ₹{amount}
                          </p>

                        </div>

                      )
                    )
                  }

                </div>

              </div>

            )
          }
          {
            expenses.length > 0 && (

              <div
                className={`mt-8 rounded-[35px] p-6 shadow-xl ${darkMode
                    ? "bg-slate-800 text-white"
                    : "bg-white text-black"
                  }`}
              >

                <div className="flex justify-between items-center mb-6">

                  <div>
                    {
                      Object.keys(
                        dayWiseExpenses
                      ).length > 0 && (

                        <div
                          className={`my-10 rounded-[35px] p-8 shadow-2xl ${darkMode
                              ? "bg-slate-800 text-white"
                              : "bg-white text-black"
                            }`}
                        >

                          <h2 className="text-4xl font-black mb-6">
                            📅 Day Wise Spending
                          </h2>

                          <div className="grid md:grid-cols-3 gap-5">

                            {
                              Object.entries(
                                dayWiseExpenses
                              ).map(
                                (
                                  [day,
                                    amount]
                                ) => (

                                  <div
                                    key={day}

                                    className={`rounded-[25px] p-6 ${darkMode
                                        ? "bg-slate-700"
                                        : "bg-slate-100"
                                      }`}
                                  >

                                    <h3 className="text-2xl font-bold">
                                      {day}
                                    </h3>

                                    <p className="text-3xl font-black mt-3">
                                      ₹{amount}
                                    </p>

                                  </div>

                                )
                              )
                            }

                          </div>

                        </div>

                      )
                    }

                    <h2 className="text-4xl font-black">
                      📊 Expense Analytics
                    </h2>

                    <p
                      className={`mt-2 ${darkMode
                          ? "text-slate-300"
                          : "text-gray-500"
                        }`}
                    >
                      Smart spending breakdown
                    </p>

                  </div>

                  <div
                    className="bg-blue-600 text-white px-6 py-4 rounded-[25px] shadow-xl"
                  >
                    ₹{totalSpent}
                  </div>

                </div>

                <div
                  style={{
                    width: "100%",
                    height: 350,
                  }}
                >

                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >

                    <PieChart>

                      <Pie
                        data={expenseChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={130}
                        innerRadius={70}
                        dataKey="value"
                        nameKey="name"
                        paddingAngle={4}
                        label={({
                          name,
                          percent
                        }) =>
                          `${name} ${(
                            percent * 100
                          ).toFixed(0)}%`
                        }
                      >

                        {
                          expenseChartData.map(
                            (
                              entry,
                              index
                            ) => (

                              <Cell
                                key={index}
                                fill={
                                  chartColors[
                                  index %
                                  chartColors.length
                                  ]
                                }
                              />

                            )
                          )
                        }

                      </Pie>

                      <ChartTooltip />

                    </PieChart>

                  </ResponsiveContainer>
                </div>

              </div>

            )
          }
          {
            scamAlerts.length > 0 && (

              <div
                className={`my-10 rounded-[35px] p-8 shadow-2xl ${darkMode
                    ? "bg-red-950 text-white"
                    : "bg-red-50 text-black"
                  }`}
              >
              
                {
                  travelCost && (

                    <div
                      className={`my-10 rounded-[35px] p-8 shadow-2xl ${darkMode
                          ? "bg-slate-800 text-white"
                          : "bg-white text-black"
                        }`}
                    >

                      <h2 className="text-4xl font-black mb-6">
                        ✈ Travel Cost Estimator
                      </h2>

                      <p
  className={`mb-6 ${
    darkMode
      ? "text-slate-300"
      : "text-gray-500"
  }`}
>
  {startingCity} → {destination}
</p>

                      <div className="grid md:grid-cols-2 gap-5">

                        <div className="rounded-[30px] bg-blue-600 text-white p-6">
                          ✈ Flight
                          <h3 className="text-3xl font-black mt-2">
                            {travelCost.flight}
                          </h3>
                        </div>

                        <div className="rounded-[30px] bg-green-600 text-white p-6">
                          🚆 Train
                          <h3 className="text-3xl font-black mt-2">
                            {travelCost.train}
                          </h3>
                        </div>

                        <div className="rounded-[30px] bg-orange-600 text-white p-6">
                          🚌 Bus
                          <h3 className="text-3xl font-black mt-2">
                            {travelCost.bus}
                          </h3>
                        </div>

                        <div className="rounded-[30px] bg-purple-600 text-white p-6">
                          ⛽ Self Drive
                          <h3 className="text-3xl font-black mt-2">
                            {travelCost.selfDrive}
                          </h3>
                        </div>

                      </div>

                    </div>

                  )
                }

                <h2 className="text-4xl font-bold mb-6">
                  🚨 Scam Alerts
                </h2>

                <p
                  className={`mb-6 ${darkMode
                      ? "text-red-200"
                      : "text-red-700"
                    }`}
                >
                  Stay aware of common tourist scams in {destination}
                </p>

                <div className="grid md:grid-cols-2 gap-5">

                  {
                    scamAlerts.map(
                      (alert, index) => (

                        <div
                          key={index}
                          className={`rounded-[25px] p-5 border-l-[6px] border-red-500 ${darkMode
                              ? "bg-slate-800"
                              : "bg-white"
                            }`}
                        >
                          ⚠ {alert}
                        </div>

                      )
                    )
                  }

                </div>

              </div>

            )
          }
          {
            budgetAdvice && (

              <div
                className={`my-10 rounded-[35px] p-8 shadow-2xl ${darkMode
                    ? "bg-yellow-900 text-white"
                    : "bg-yellow-50 text-black"
                  }`}
              >

                {
  smartNotifications
    .length > 0 && (

    <div
      className={`my-10 rounded-[35px] p-8 shadow-2xl ${
        darkMode
          ? "bg-slate-800 text-white"
          : "bg-white text-black"
      }`}
    >

      <h2 className="text-4xl font-black mb-6">
        🔔 Smart Alerts
      </h2>

      <div className="grid md:grid-cols-2 gap-5">

        {
          smartNotifications.map(
            (
              item,
              index
            ) => (

              <div
                key={index}
                className={`rounded-[25px] p-5 border-l-[6px] ${
                  darkMode
                    ? "bg-slate-700 border-blue-500"
                    : "bg-slate-100 border-blue-600"
                }`}
              >
                {item.message}
              </div>

            )
          )
        }

      </div>

    </div>

  )
}

                <h2 className="text-4xl font-bold mb-6">
                  🧠 Smart Budget AI
                </h2>

                <div className="grid md:grid-cols-2 gap-5">

                  <div
                    className={`rounded-[25px] p-6 ${darkMode
                        ? "bg-slate-800"
                        : "bg-white"
                      }`}
                  >

                    <h3 className="text-xl font-bold mb-2">
                      ⚠ Budget Risk
                    </h3>

                    <p className="text-3xl font-black">
                      {budgetAdvice.risk}
                    </p>

                  </div>

                  <div
                    className={`rounded-[25px] p-6 ${darkMode
                        ? "bg-slate-800"
                        : "bg-white"
                      }`}
                  >

                    <h3 className="text-xl font-bold mb-2">
                      💰 Daily Limit
                    </h3>

                    <p className="text-3xl font-black">
                      ₹
                      {
                        budgetAdvice.dailyBudget
                      }
                      /day
                    </p>

                  </div>

                </div>

                <div className="mt-6">

                  <h3 className="text-2xl font-bold mb-4">
                    🤖 AI Suggestions
                  </h3>

                  <div className="grid md:grid-cols-2 gap-4">

                    {
                      budgetAdvice.tips?.map(
                        (tip, index) => (

                          <div
                            key={index}
                            className={`rounded-[25px] p-5 ${darkMode
                                ? "bg-slate-800"
                                : "bg-white"
                              }`}
                          >
                            💡 {tip}
                          </div>

                        )
                      )
                    }

                  </div>

                </div>

              </div>

            )
          }

          {
            travelTips.length > 0 && (

              <div
                className={`my-10 rounded-[35px] p-8 shadow-2xl ${darkMode
                    ? "bg-slate-800 text-white"
                    : "bg-white text-black"
                  }`}
              >

                <h2 className="text-4xl font-bold mb-6">
                  🤖 AI Travel Tips
                </h2>

                <div className="grid md:grid-cols-2 gap-5">

                  {
                    travelTips.map(
                      (tip, index) => (

                        <div
                          key={index}
                          className={`rounded-[25px] p-5 ${darkMode
                              ? "bg-slate-700"
                              : "bg-slate-100"
                            }`}
                        >
                          ✈ {tip}
                        </div>

                      )
                    )
                  }

                </div>

              </div>

            )
          }
          {
            weather && weather.coord && (

              <div className="my-10">

                <h2 className="text-3xl font-bold mb-5">
                  Destination Map
                </h2>

{
  weather?.coord?.lat &&
  weather?.coord?.lon && (

    <div className="my-10">

      <h2 className="text-3xl font-bold mb-5">
        Destination Map
      </h2>

      <MapContainer
        center={[
          weather.coord.lat,
          weather.coord.lon
        ]}
        zoom={12}
        style={{
          height: "400px",
          width: "100%",
          borderRadius: "20px"
        }}
      >

        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {
          placeMarkers?.map(
            (place, index) => (

              place?.lat &&
              place?.lon && (

                <Marker
                  key={index}
                  position={[
                    place.lat,
                    place.lon
                  ]}
                >
                  <Popup>
                    📍 {place.name}
                  </Popup>
                </Marker>

              )
            )
          )
        }

      </MapContainer>

    </div>

  )
}

              </div>

            )
          }

          {
            hotels.length > 0 && (

              <div className="my-10">

                <h2 className="text-3xl font-bold mb-5">
                  Recommended Hotels
                </h2>

                <div className="grid md:grid-cols-3 gap-5">

                  {
                    hotels.map((hotel, index) => (

                      <HotelCard
                        key={index}
                        hotel={hotel}
                        hotelType={hotelType}
                        mood={mood}
                        budget={budget}
                      />

                    ))
                  }
                </div>

              </div>

            )
          }
          
          {
            tripPlan?.days && (
            

              <div className="mt-10">

                <h2 className="text-4xl font-bold mb-8">
                  {tripPlan.tripTitle}
                </h2>

                <div className="grid gap-6">

                  {
                    tripPlan.days.map((dayPlan, index) => (

                      <div
                        key={index}
                        className="relative flex gap-6"
                      >

                        {/* Timeline line */}

                        <div className="flex flex-col items-center">

                          <div className="w-8 h-8 rounded-full bg-blue-600 border-4 border-white shadow-lg z-10"></div>

                          {
                            index !==
                            tripPlan.days.length - 1 && (

                              <div className="w-1 flex-1 bg-blue-300 min-h-[120px]"></div>

                            )
                          }

                        </div>

                        {/* Day Card */}

                        <div
                          className={`shadow-2xl rounded-[35px] p-8 flex-1 transition ${darkMode
                              ? "bg-slate-800 text-white"
                              : "bg-white text-black"
                            }`}
                        >

                          <div className="flex justify-between items-center mb-6">

                            <div>

                              <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-bold">

                                Day {dayPlan.day}

                              </span>

                              <h3 className="text-3xl font-bold mt-4">

                                {dayPlan.title}

                              </h3>

                            </div>

                          </div>

                          {/* Activities */}

                          <div className="mb-6">

                            <h4 className="font-bold text-xl mb-4">
                              🎯 Activities
                            </h4>

                            <div className="space-y-3">

                              {
                                dayPlan?.activities?.map(
                                  (activity, i) => (

                                    <div
                                      key={i}
                                      className={`rounded-2xl p-4 transition ${darkMode
                                          ? "bg-slate-700 text-white"
                                          : "bg-slate-100 text-black hover:bg-slate-200"
                                        }`}
                                    >

                                      ✅ {activity}

                                    </div>

                                  )
                                )
                              }

                            </div>

                          </div>

                          {/* Food & Hotel */}

                          <div className="grid md:grid-cols-2 gap-4">

                            <div
                              className={`rounded-[25px] p-5 ${darkMode
                                  ? "bg-blue-900/30 text-white"
                                  : "bg-blue-100 text-black"
                                }`}
                            >

                              <p className="font-semibold text-orange-700 mb-2">
                                🍴 Recommended Food
                              </p>

                              <h4 className="text-lg font-bold">
                                {dayPlan.food}
                              </h4>

                            </div>

                            <div className="bg-blue-100 rounded-[25px] p-5">

                              <p className="font-semibold text-blue-700 mb-2">
                                🏨 Hotel Suggestion
                              </p>

                              <h4 className="text-lg font-bold">
                                {dayPlan.hotelSuggestion}
                              </h4>

                            </div>

                          </div>

                        </div>

                      </div>

                    ))
                  }

                </div>

              </div>

            )
          }

        </div>

      </div>

    );
  }
export default App;