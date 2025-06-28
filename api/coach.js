export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST allowed" });
  }

  const { user } = req.body;

  const prompt = `
You are a friendly and practical habit coach.

Here's the user info:
- Goal: ${user.goal}
- Current habits: ${user.currentHabits.join(", ")}
- Struggles: ${user.struggles.join(", ")}
- Available time: ${user.timePerDay} minutes/day

Give 3 personalized habits that match their situation. Be concise but helpful.
`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://habit-coach-api.vercel.app", // or your domain
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "anthropic/claude-3-haiku", // ✅ CORRECT model name
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();
    console.log("🧠 OpenAI raw response:", JSON.stringify(data, null, 2));

    const reply = data?.choices?.[0]?.message?.content ?? "⚠️ GPT did not return a message.";
    res.status(200).json({ reply });

  } catch (err) {
    console.error("❌ OpenRouter API Error:", err);
    res.status(500).json({ error: "Something went wrong with AI response." });
  }
}
