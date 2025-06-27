// backend/index.js
import express from "express"
import dotenv from "dotenv"
import { OpenAI } from "openai"
import cors from "cors"
import fileUpload from "express-fileupload"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app = express()
const port = process.env.PORT || 3001

// CORS configuration for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://educationhome-planet.vercel.app'] 
    : ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions))
app.use(express.json())
app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
}))

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

app.post("/api/generate-dialogue", async (req, res) => {
  const { topic } = req.body
  
  if (!topic || !topic.trim()) {
    return res.status(400).json({ error: "Topic is required" })
  }
  
  const prompt = `# Prompt for Generating Tutor-Student Dialogues that Encourage Reasoning

You are a teaching expert who designs realistic 1-on-1 tutoring conversations that encourage student reasoning.

---

## Instructions

For the topic: **"${topic}"**

Generate **3 short 1-on-1 student-tutor dialogues** as a **JSON array** of 3 entries. Each should follow this format:

- **topic_problem**: A brief scenario or question relevant to the topic  
- **student_question**: What a student might say or ask (it can include a mistake, misconception, or partial understanding)  
- **tutor_question**: A high-quality question that presses for reasoning, encourages reflection, or elicits elaboration and clarification.  
  - It must NOT simply funnel the student to the correct answer.  
  - It should **acknowledge the student's current thinking**, and help them build on it rather than skip to the final answer.  
  - Use techniques such as:  
    - "Why does this method work?"  
    - "Can you explain why…?"  
    - "What's the purpose of…?"  
    - "How do you know…?"  
    - "How does this connect to…?"  
    - "What would that look like if we represented it differently?"  
- **student_response**: A thoughtful clarification, explanation, or correction.  
  - The response should show **incremental reasoning**, based on the tutor's question and the student's prior thinking.  
  - Avoid unrealistic "aha!" moments where the student suddenly gives a perfect answer without working through the idea.

---

## Guidelines

Please avoid:
- Generic or overly simple tutor questions  
- Perfect, instant "lightbulb" student responses  
- Overly long or unnatural dialogue

Focus on:
- **Dialogic** moves that promote **student sense-making**  
- Tutor tone that is **supportive and encouraging**  
- Realistic progression in reasoning

---

## Output Format

Output your results in a **structured JSON array**.

These sample entries from different subjects are provided as a guide. Your output should follow a similar tone, format, and quality — but all 3 examples must be based on the input topic.

[
  {
    "topic_problem": "Interpreting box plots",
    "student_question": "The median is the same for both plots, so the data is probably the same too.",
    "tutor_question": "That's a good observation — what else besides the median might help us understand how the data is spread out?",
    "student_response": "Hmm... maybe the range? Or like, how far apart the data is from the middle?"
  },
  {
    "topic_problem": "Balancing chemical equations",
    "student_question": "I just added a 2 in front of H₂O to make the numbers work.",
    "tutor_question": "What do you think it would mean if there were more hydrogen atoms on one side than the other?",
    "student_response": "That maybe we're creating atoms that weren't there before? But I thought that wasn't allowed."
  },
  {
    "topic_problem": "Expanding expressions with the distributive property",
    "student_question": "I thought 3(x + 2) was 3x + 2.",
    "tutor_question": "Let's try plugging in a number for x in both versions. What do you get if x is 2?",
    "student_response": "Okay… in 3x + 2, it's 6 + 2 = 8. But in 3(x + 2), it's 3 times 4, so 12. Oh! I forgot to multiply the 3 by the 2."
  },
  {
    "topic_problem": "Understanding sine on the unit circle",
    "student_question": "Sine is always positive since the radius can't be negative, right?",
    "tutor_question": "Interesting — where is the sine value taken from on the unit circle: the x or y coordinate?",
    "student_response": "Oh, I think it's the y part. And the y value can be negative in some quadrants... so sine can too?"
  },
  {
    "topic_problem": "Fixing subject-verb agreement in compound subjects",
    "student_question": "The sentence says 'The teacher and the students was tired', and I'm not sure what's wrong.",
    "tutor_question": "How many people are we talking about in the subject of that sentence?",
    "student_response": "Well, the teacher and the students — that's more than one. So maybe the verb should be 'were'?"
  }
]

`
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a teaching expert AI." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    })

    const raw = completion.choices[0].message.content
    let parsed
    
    try {
      parsed = JSON.parse(raw)
    } catch (e) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = raw.match(/```(?:json)?\n([\s\S]*?)```/)
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[1])
        } catch (e2) {
          console.error("Failed to parse JSON from code block:", e2)
          return res.status(500).json({ error: "Failed to parse AI response" })
        }
      } else {
        console.error("No valid JSON found in response:", raw)
        return res.status(500).json({ error: "Invalid response format from AI" })
      }
    }

    // Validate the parsed response
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return res.status(500).json({ error: "Invalid response structure from AI" })
    }

    res.json({ examples: parsed })
  } catch (error) {
    console.error("Error generating dialogues:", error)
    res.status(500).json({ error: "Failed to generate examples." })
  }
})

app.post("/api/rehearse-scenario", async (req, res) => {
  const { topic } = req.body
  
  if (!topic || !topic.trim()) {
    return res.status(400).json({ error: "Topic is required" })
  }
  
  console.log("Generating rehearsal scenario for topic:", topic)
  
  if (!process.env.OPENAI_API_KEY) {
    console.error("OpenAI API key not found in environment variables")
    return res.status(500).json({ error: "OpenAI API key not configured" })
  }
  
  const prompt = `You are a teaching expert creating realistic tutoring scenarios for practice.

For the topic: **"${topic}"**

Generate **1 realistic tutoring scenario** as a JSON object with this format:

{
  "topic_problem": "A brief description of the problem or concept",
  "student_question": "What a student might say or ask (include a mistake, misconception, or partial understanding)"
}

The scenario should be realistic and challenging enough for a tutor to practice responding with effective questions that encourage student reasoning.

Output only the JSON object, no additional text.`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a teaching expert AI." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    })

    const raw = completion.choices[0].message.content
    let parsed
    
    try {
      parsed = JSON.parse(raw)
    } catch (e) {
      const jsonMatch = raw.match(/```(?:json)?\n([\s\S]*?)```/)
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[1])
        } catch (e2) {
          console.error("Failed to parse JSON from code block:", e2)
          return res.status(500).json({ error: "Failed to parse AI response" })
        }
      } else {
        console.error("No valid JSON found in response:", raw)
        return res.status(500).json({ error: "Invalid response format from AI" })
      }
    }

    if (!parsed.topic_problem || !parsed.student_question) {
      return res.status(500).json({ error: "Invalid scenario structure from AI" })
    }

    res.json({ scenario: parsed })
  } catch (error) {
    console.error("Error generating scenario:", error)
    res.status(500).json({ error: "Failed to generate scenario." })
  }
})

app.post("/api/evaluate-response", async (req, res) => {
  const { topic, scenario, userResponse } = req.body
  
  if (!topic || !scenario || !userResponse) {
    return res.status(400).json({ error: "Topic, scenario, and user response are required" })
  }
  
  console.log("Evaluating user response for topic:", topic)
  
  if (!process.env.OPENAI_API_KEY) {
    console.error("OpenAI API key not found in environment variables")
    return res.status(500).json({ error: "OpenAI API key not configured" })
  }
  
  const prompt = `You are a teaching expert evaluating a tutor's response to a student question.

**Topic:** ${topic}
**Problem:** ${scenario.topic_problem}
**Student Question:** ${scenario.student_question}
**Tutor's Response:** ${userResponse}

Evaluate the tutor's response based on these criteria:
1. Does it encourage student reasoning rather than just giving the answer?
2. Is it a good "focusing question" that helps the student think through the problem?
3. Does it promote critical thinking and deeper understanding?

Provide constructive feedback in 2-3 sentences. Be encouraging but honest about areas for improvement. Focus on the quality of the question and how well it promotes student learning.

Output only the feedback text, no additional formatting.`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a teaching expert AI providing constructive feedback." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    })

    const feedback = completion.choices[0].message.content.trim()
    res.json({ feedback })
  } catch (error) {
    console.error("Error evaluating response:", error)
    res.status(500).json({ error: "Failed to evaluate response." })
  }
})

app.post("/api/rehearse-voice-scenario", async (req, res) => {
  const { topic } = req.body
  
  if (!topic || !topic.trim()) {
    return res.status(400).json({ error: "Topic is required" })
  }
  
  console.log("Generating voice rehearsal scenario for topic:", topic)
  
  if (!process.env.OPENAI_API_KEY) {
    console.error("OpenAI API key not found in environment variables")
    return res.status(500).json({ error: "OpenAI API key not configured" })
  }
  
  const prompt = `You are a teaching expert creating realistic tutoring scenarios for voice practice.

For the topic: **"${topic}"**

Generate **1 realistic tutoring scenario** as a JSON object with this format:

{
  "topic_problem": "A brief description of the problem or concept",
  "student_question": "What a student might say or ask (include a mistake, misconception, or partial understanding)",
  "voice_prompt": "A natural-sounding student question that would be spoken aloud"
}

The scenario should be realistic and challenging enough for a tutor to practice responding with effective questions that encourage student reasoning.

Output only the JSON object, no additional text.`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a teaching expert AI." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    })

    const raw = completion.choices[0].message.content
    let parsed
    
    try {
      parsed = JSON.parse(raw)
    } catch (e) {
      const jsonMatch = raw.match(/```(?:json)?\n([\s\S]*?)```/)
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[1])
        } catch (e2) {
          console.error("Failed to parse JSON from code block:", e2)
          return res.status(500).json({ error: "Failed to parse AI response" })
        }
      } else {
        console.error("No valid JSON found in response:", raw)
        return res.status(500).json({ error: "Invalid response format from AI" })
      }
    }

    if (!parsed.topic_problem || !parsed.student_question || !parsed.voice_prompt) {
      return res.status(500).json({ error: "Invalid scenario structure from AI" })
    }

    // Generate voice audio using OpenAI's TTS API
    try {
      const audioResponse = await openai.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: parsed.voice_prompt,
      })

      const buffer = Buffer.from(await audioResponse.arrayBuffer())
      const audioUrl = `data:audio/mp3;base64,${buffer.toString('base64')}`

      res.json({ 
        scenario: parsed,
        audioUrl: audioUrl
      })
    } catch (audioError) {
      console.error("Error generating audio:", audioError)
      // Return scenario without audio if TTS fails
      res.json({ 
        scenario: parsed,
        audioUrl: null
      })
    }
  } catch (error) {
    console.error("Error generating voice scenario:", error)
    res.status(500).json({ error: "Failed to generate voice scenario." })
  }
})

app.post("/api/evaluate-voice-response", async (req, res) => {
  if (!req.files || !req.files.audio) {
    console.error("No audio file received")
    return res.status(400).json({ error: "Audio file is required" })
  }

  const { topic, scenario } = req.body
  const audioFile = req.files.audio
  
  if (!topic || !scenario) {
    console.error("Missing topic or scenario")
    return res.status(400).json({ error: "Topic and scenario are required" })
  }
  
  console.log("Evaluating voice response for topic:", topic)
  console.log("Audio file details:", {
    name: audioFile.name,
    mimetype: audioFile.mimetype,
    size: audioFile.size,
    dataLength: audioFile.data.length
  })
  
  if (!process.env.OPENAI_API_KEY) {
    console.error("OpenAI API key not found in environment variables")
    return res.status(500).json({ error: "OpenAI API key not configured" })
  }

  // Save the uploaded file to disk
  const tempDir = path.join(__dirname, 'temp')
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true })
  }
  const fileExt = path.extname(audioFile.name) || '.webm'
  const tempFilePath = path.join(tempDir, `audio_${Date.now()}${fileExt}`)
  fs.writeFileSync(tempFilePath, audioFile.data)
  console.log('Saved audio file to:', tempFilePath)
  console.log('File extension:', fileExt)
  console.log('File mimetype:', audioFile.mimetype)
  const fileBuffer = fs.readFileSync(tempFilePath)
  console.log('First 16 bytes of file:', fileBuffer.slice(0, 16))

  try {
    const fileStream = fs.createReadStream(tempFilePath)
    // Log before sending to OpenAI
    console.log('Sending file to OpenAI:', tempFilePath)
    const transcription = await openai.audio.transcriptions.create({
      file: fileStream,
      model: 'whisper-1',
    })

    // Clean up the temporary file
    fs.unlinkSync(tempFilePath)
    console.log("Cleaned up temporary file")

    const userResponse = transcription.text
    console.log("Transcribed user response:", userResponse)

    if (!userResponse || userResponse.trim() === '') {
      return res.status(400).json({ error: "Could not transcribe audio. Please try speaking more clearly." })
    }

    // Evaluate the transcribed response
    const scenarioObj = JSON.parse(scenario)
    const prompt = `You are a teaching expert evaluating a tutor's voice response to a student question.

**Topic:** ${topic}
**Problem:** ${scenarioObj.topic_problem}
**Student Question:** ${scenarioObj.student_question}
**Tutor's Voice Response:** ${userResponse}

Evaluate the tutor's response based on these criteria:
1. Does it encourage student reasoning rather than just giving the answer?
2. Is it a good "focusing question" that helps the student think through the problem?
3. Does it promote critical thinking and deeper understanding?

Provide constructive feedback in 2-3 sentences. Be encouraging but honest about areas for improvement. Focus on the quality of the question and how well it promotes student learning.

Output only the feedback text, no additional formatting.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a teaching expert AI providing constructive feedback." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    })

    const feedback = completion.choices[0].message.content.trim()
    res.json({ feedback })
  } catch (error) {
    console.error("Error evaluating voice response:", error)
    res.status(500).json({ error: "Failed to evaluate voice response. Please try again." })
  } finally {
    // Ensure file is deleted even if error occurs
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath)
      console.log("Cleaned up temporary file (finally block)")
    }
  }
})

app.listen(port, () => {
  console.log(`Server listening on port ${port}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})
