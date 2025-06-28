// api/coach.js

export default async function handler(req, res) {
    const OPENAI_KEY = process.env.OPENAI_API_KEY;
  
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
  
  Give 3 personalized habits that match their situation. Be concise but helpful.`;
  
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
      }),
    });
  
    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || "No response.";
  
    res.status(200).json({ reply: answer });
  }
  