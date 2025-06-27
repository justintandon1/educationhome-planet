import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import "./RehearseText.css"

function RehearseText() {
  const [topic, setTopic] = useState("")
  const [currentScenario, setCurrentScenario] = useState(null)
  const [userResponse, setUserResponse] = useState("")
  const [feedback, setFeedback] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [step, setStep] = useState("topic") // "topic", "scenario", "feedback"
  const navigate = useNavigate()

  const handleStartRehearsal = async (e) => {
    e.preventDefault()
    
    if (!topic.trim()) {
      setError("Please enter a topic")
      return
    }
    
    setLoading(true)
    setError("")
    
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/rehearse-scenario`, { topic })
      setCurrentScenario(res.data.scenario)
      setStep("scenario")
    } catch (err) {
      console.error("Failed to generate scenario", err)
      setError("Failed to generate scenario. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitResponse = async (e) => {
    e.preventDefault()
    
    if (!userResponse.trim()) {
      setError("Please enter your response")
      return
    }
    
    setLoading(true)
    setError("")
    
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/evaluate-response`, {
        topic,
        scenario: currentScenario,
        userResponse
      })
      setFeedback(res.data.feedback)
      setStep("feedback")
    } catch (err) {
      console.error("Failed to evaluate response", err)
      setError("Failed to evaluate response. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleNewScenario = () => {
    setCurrentScenario(null)
    setUserResponse("")
    setFeedback("")
    setStep("topic")
  }

  const handleBackToHome = () => {
    navigate("/")
  }

  return (
    <div className="rehearse-text">
      <div className="header">
        <button onClick={handleBackToHome} className="back-button">
          ⬅️
        </button>
        <h1>🍐 educationhome.planet</h1>
      </div>
      
      <div className="page-content">
        <h2>Rehearse with Text</h2>
        <p>Practice your tutoring skills! Enter a topic and respond to a student's question with a focusing question. Get feedback on how well your question encourages student reasoning.</p>
      </div>

      {step === "topic" && (
        <form onSubmit={handleStartRehearsal}>
          <input
            type="text"
            placeholder="Enter a topic (e.g., Quadratic Equations)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={loading || !topic.trim()}>
            {loading ? "Generating..." : "Try a Rehearsal"} 
          </button>
        </form>
      )}

      {step === "scenario" && currentScenario && (
        <div className="scenario-section">
          <div className="scenario-card">
            <h3>📚 Problem Scenario</h3>
            <p><strong>Topic:</strong> {currentScenario.topic_problem}</p>
            <p><strong>Student Question:</strong> {currentScenario.student_question}</p>
          </div>
          
          <form onSubmit={handleSubmitResponse}>
            <label htmlFor="user-response">Your Response (ask a question to help the student):</label>
            <textarea
              id="user-response"
              placeholder="Type your question here..."
              value={userResponse}
              onChange={(e) => setUserResponse(e.target.value)}
              disabled={loading}
              rows={4}
            />
            <button type="submit" disabled={loading || !userResponse.trim()}>
              {loading ? "Evaluating..." : "Submit Response"}
            </button>
          </form>
        </div>
      )}

      {step === "feedback" && feedback && (
        <div className="feedback-section">
          <div className="feedback-card">
            <h3>🎯 Feedback on Your Response</h3>
            <div className="feedback-content">
              <p>{feedback}</p>
            </div>
          </div>
          
          <div className="action-buttons">
            <button onClick={handleNewScenario} className="new-scenario-btn">
              Try Another Scenario
            </button>
          </div>
        </div>
      )}

      {error && <div className="error">{error}</div>}
    </div>
  )
}

export default RehearseText 