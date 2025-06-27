import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import "./DialogueGenerator.css"

function DialogueGenerator() {
  const [topic, setTopic] = useState("")
  const [examples, setExamples] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!topic.trim()) {
      setError("Please enter a topic")
      return
    }
    
    setLoading(true)
    setError("")
    
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/generate-dialogue`, { topic })
      setExamples(res.data.examples)
      setLoading(false)
    } catch (err) {
      console.error("Failed to generate dialogue", err)
      setError("Failed to generate dialogue. Please try again.")
      setLoading(false)
    }
  }

  const handleBackToHome = () => {
    navigate("/")
  }

  return (
    <div className="dialogue-generator">
      <div className="header">
        <button onClick={handleBackToHome} className="back-button">
          ⬅️
        </button>
        <h1>🍐 educationhome.planet</h1>
      </div>
      
      <div className="page-content">
        <h2>Sample Tutoring Dialogues</h2>
        <p>During your lessons, we encourage you to ask <strong>focusing questions</strong> - questions that encourage student reasoning and critical thinking. Enter an educational topic below to generate realistic tutoring dialogues with such focusing questions.</p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter a topic (e.g., Quadratic Equations)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={loading}
        />
        <button type="submit" disabled={loading || !topic.trim()}>
          {loading ? "Generating..." : "See Sample Dialogues"}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      <div className="results">
        {examples.map((ex, idx) => (
          <div key={idx} className="example-card">
            <p><strong>Topic:</strong> <i>{ex.topic_problem}</i></p>
            <p><strong>Student:</strong> {ex.student_question}</p>
            <p style={{backgroundColor: "#ffeb3b"}}><strong>Tutor:</strong> {ex.tutor_question}</p>
            <p><strong>Student:</strong> {ex.student_response}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DialogueGenerator 