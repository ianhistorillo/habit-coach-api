export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    // Handle preflight CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const user = req.body?.user;

  if (!user) {
    return res.status(400).json({ error: 'Missing user data' });
  }

  const { goal, currentHabits, struggles, timePerDay, profile, followUpMessage, conversationHistory } = user;

  const systemPrompt = `
You are a helpful, encouraging, and practical AI habit coach. 
Always personalize advice based on the user's goal, struggles, and habit history. 
Avoid repeating past suggestions unless directly relevant. Keep responses friendly and easy to follow.
`;

  let messages = [
    { role: "system", content: systemPrompt }
  ];

  // If it's a follow-up message, reconstruct the conversation
  if (followUpMessage && conversationHistory?.length > 0) {
    const history = conversationHistory.map(m => ({
      role: m.type === "user" ? "user" : "assistant",
      content: m.content
    }));
    messages = [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: followUpMessage }
    ];
  } else {
    // Initial prompt
    const initialPrompt = `
User goal: ${goal}
Current habits: ${currentHabits?.join(", ") || "None"}
Struggles: ${struggles?.join(", ") || "None"}
Time available: ${timePerDay || 15} minutes/day
${profile ? `Profile: Age ${profile.age || "N/A"}, Occupation: ${profile.occupation || "N/A"}, Focus: ${profile.lifestyleFocus || "N/A"}` : ""}

Suggest 3 simple, specific, and personalized habit changes. 
Give helpful, motivating advice based on their situation.
    `.trim();

    messages.push({ role: "user", content: initialPrompt });
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://habit-coach-api.vercel.app",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "anthropic/claude-3-haiku",
        messages
      })
    });

    const data = await response.json();
    console.log("🧠 OpenRouter response:", JSON.stringify(data, null, 2));

    const reply = data?.choices?.[0]?.message?.content ?? "⚠️ GPT did not return a message.";
    res.status(200).json({ reply });

  } catch (err) {
    console.error("❌ OpenRouter API Error:", err);
    res.status(500).json({ error: "Something went wrong with AI response." });
  }
}
