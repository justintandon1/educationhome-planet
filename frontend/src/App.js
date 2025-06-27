import React from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import HomePage from "./components/HomePage"
import DialogueGenerator from "./components/DialogueGenerator"
import ReviewFeedback from "./components/ReviewFeedback"
import RehearseText from "./components/RehearseText"
import RehearseVoice from "./components/RehearseVoice"
import "./App.css"

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/generate-dialogue" element={<DialogueGenerator />} />
          <Route path="/review-feedback" element={<ReviewFeedback />} />
          <Route path="/rehearse-text" element={<RehearseText />} />
          <Route path="/rehearse-voice" element={<RehearseVoice />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
