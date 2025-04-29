//code update completed.

const dotenv = require('dotenv');
dotenv.config();
console.log("🔑 Loaded API key:", process.env.OPENAI_API_KEY);
const express = require("express");
const path = require("path");
const OpenAI = require("openai");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Create OpenAI client without key - we'll check in the request handler
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
app.post("/chat", async (req, res) => {


  const userMessage = req.body.userMessage;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are an AI music production coach." },
        { role: "user", content: userMessage }
      ]
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });

  } catch (error) {
    console.error("OpenAI API Error:", error.message);
    res.status(500).json({ 
      reply: "Error connecting to OpenAI API. Please check your API key and try again."
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
