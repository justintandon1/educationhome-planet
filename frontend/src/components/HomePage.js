import React from "react"
import { useNavigate } from "react-router-dom"
import "./HomePage.css"

function HomePage() {
  const navigate = useNavigate()

  const handleGetStarted = () => {
    navigate("/generate-dialogue")
  }

  const handleCard1Click = () => {
    navigate("/review-feedback")
  }

  const handleCard3Click = () => {
    navigate("/rehearse-text")
  }

  const handleCard4Click = () => {
    navigate("/rehearse-voice")
  }

  return (
    <div className="home-page">
      <h1>🍐 educationhome.planet</h1>
      <div className="hero-section">
        <h2>Pre-session Training Portal</h2>
        <p>Hope you're excited for your next session!</p>
      </div>
      
      <div className="features">
        <button onClick={handleCard1Click} className="feature-card">
          <h3>🎯 Review Feedback</h3>
        </button>
        <button onClick={handleGetStarted} className="feature-card cta-card">
          <h3>🧠 Sample Dialogues</h3>
        </button>
        <button onClick={handleCard3Click} className="feature-card">
          <h3>✍️ Rehearse with Text</h3>
        </button>
        <button onClick={handleCard4Click} className="feature-card">
          <h3>🎤 Rehearse with Voice</h3>
        </button>
      </div>
    </div>
  )
}

export default HomePage 