import React, { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import "./RehearseVoice.css"

function RehearseVoice() {
  const [topic, setTopic] = useState("")
  const [currentScenario, setCurrentScenario] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [feedback, setFeedback] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [step, setStep] = useState("topic") // "topic", "scenario", "feedback"
  const [audioUrl, setAudioUrl] = useState("")
  const [userAudioUrl, setUserAudioUrl] = useState("")
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [isPlayingUserAudio, setIsPlayingUserAudio] = useState(false)
  const [feedbackReady, setFeedbackReady] = useState(false)
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recordingStartTimeRef = useRef(null)
  const userAudioRef = useRef(null)
  const navigate = useNavigate()

  // Cleanup function to stop microphone when component unmounts
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop()
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      }
    }
  }, [isRecording])

  const handleStartRehearsal = async (e) => {
    e.preventDefault()
    
    if (!topic.trim()) {
      setError("Please enter a topic")
      return
    }
    
    setLoading(true)
    setError("")
    
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/rehearse-voice-scenario`, { topic })
      setCurrentScenario(res.data.scenario)
      setAudioUrl(res.data.audioUrl)
      setStep("scenario")
    } catch (err) {
      console.error("Failed to generate voice scenario", err)
      setError("Failed to generate voice scenario. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        } 
      })
      
      // Try to use the most compatible format
      let mimeType = null
      const supportedTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/wav'
      ]
      
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type
          break
        }
      }
      
      if (!mimeType) {
        throw new Error("No supported audio format found")
      }
      
      console.log("Using MIME type:", mimeType)
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: mimeType
      })
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorderRef.current.onstop = async () => {
        if (audioChunksRef.current.length === 0) {
          setError("No audio data recorded. Please try again.")
          return
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType })
        console.log("Audio blob created:", {
          size: audioBlob.size,
          type: audioBlob.type
        })
        
        const url = URL.createObjectURL(audioBlob)
        setUserAudioUrl(url)
        
        // Send audio to backend for processing
        await submitVoiceResponse(audioBlob)
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      recordingStartTimeRef.current = Date.now()
    } catch (err) {
      console.error("Error starting recording:", err)
      setError("Failed to start recording. Please check microphone permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      const duration = Date.now() - recordingStartTimeRef.current
      setRecordingDuration(duration)
      
      if (duration < 1000) { // Less than 1 second
        setError("Recording too short. Please record for at least 1 second.")
        setIsRecording(false)
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
        return
      }
      
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
  }

  const submitVoiceResponse = async (audioBlob) => {
    setLoading(true)
    setError("")
    
    try {
      console.log("Audio blob size:", audioBlob.size, "bytes")
      console.log("Audio blob type:", audioBlob.type)
      
      // Determine the correct file extension based on MIME type
      let fileExtension = 'webm'
      if (audioBlob.type.includes('mp4')) {
        fileExtension = 'mp4'
      } else if (audioBlob.type.includes('wav')) {
        fileExtension = 'wav'
      }
      
      const formData = new FormData()
      formData.append('audio', audioBlob, `response.${fileExtension}`)
      formData.append('topic', topic)
      formData.append('scenario', JSON.stringify(currentScenario))

      console.log("Sending voice response to backend...")
      const res = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/evaluate-voice-response`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 second timeout
      })
      
      console.log("Voice evaluation response:", res.data)
      setFeedback(res.data.feedback)
      setFeedbackReady(true)
      setStep("scenario") // Stay on scenario step, don't go to feedback yet
    } catch (err) {
      console.error("Failed to evaluate voice response", err)
      console.error("Error details:", err.response?.data || err.message)
      
      if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error)
      } else if (err.code === 'ECONNABORTED') {
        setError("Request timed out. Please try again.")
      } else if (err.message.includes('Network Error')) {
        setError("Network error. Please check your connection and try again.")
      } else {
        setError("Failed to evaluate voice response. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGetFeedback = () => {
    setFeedbackLoading(true)
    
    // Pause user audio if it's playing
    if (userAudioRef.current && !userAudioRef.current.paused) {
      userAudioRef.current.pause()
      setIsPlayingUserAudio(false)
    }
    
    // Simulate a brief loading state for better UX
    setTimeout(() => {
      setFeedbackLoading(false)
      setStep("feedback")
    }, 500)
  }

  const playAudio = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl)
      setIsPlaying(true)
      audio.onended = () => setIsPlaying(false)
      audio.play()
    }
  }

  const playUserAudio = () => {
    if (userAudioUrl) {
      if (!userAudioRef.current) {
        userAudioRef.current = new Audio(userAudioUrl)
        userAudioRef.current.onended = () => setIsPlayingUserAudio(false)
        userAudioRef.current.onpause = () => setIsPlayingUserAudio(false)
        userAudioRef.current.onplay = () => setIsPlayingUserAudio(true)
      }
      
      if (userAudioRef.current.paused) {
        userAudioRef.current.play()
      } else {
        userAudioRef.current.pause()
      }
    }
  }

  const handleNewScenario = () => {
    setCurrentScenario(null)
    setAudioUrl("")
    setUserAudioUrl("")
    setFeedback("")
    setStep("topic")
    setIsPlayingUserAudio(false)
    setFeedbackReady(false)
    setFeedbackLoading(false)
    if (userAudioRef.current) {
      userAudioRef.current.pause()
      userAudioRef.current = null
    }
  }

  // Cleanup function to stop microphone when navigating away
  const handleBackToHome = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
    }
    if (userAudioRef.current) {
      userAudioRef.current.pause()
      userAudioRef.current = null
    }
    navigate("/")
  }

  return (
    <div className="rehearse-voice">
      <div className="header">
        <button onClick={handleBackToHome} className="back-button">
          ⬅️
        </button>
        <h1>🍐 educationhome.planet</h1>
      </div>
      
      <div className="page-content">
        <h2>Rehearse with Voice</h2>
        <p>Practice your tutoring skills with voice interaction! Enter a topic and respond to a student question using your voice. Get feedback on how well your question encourages student reasoning.</p>
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
            {loading ? "Generating..." : "Start Voice Rehearsal"}
          </button>
        </form>
      )}

      {step === "scenario" && currentScenario && (
        <div className="scenario-section">
          <div className="scenario-card">
            <h3>🎤 Voice Scenario</h3>
            <p><strong>Topic:</strong> {currentScenario.topic_problem}</p>
            
            <div className="audio-controls">
              <button 
                onClick={playAudio} 
                disabled={isPlaying}
                className="play-button"
              >
                {isPlaying ? "Playing..." : "▶️ Listen to Student"}
              </button>
            </div>
          </div>
          
          <div className="voice-response-section">
            <h3>🎙️ Your Voice Response</h3>
            <p>Click the microphone to record your response to the student's question:</p>
            
            <div className="recording-controls">
              {!isRecording ? (
                <button 
                  onClick={startRecording} 
                  disabled={loading}
                  className="record-button"
                >
                  🎤 Start Recording
                </button>
              ) : (
                <div>
                  <button 
                    onClick={stopRecording} 
                    className="stop-button"
                  >
                    ⏹️ Stop Recording
                  </button>
                  <p style={{ marginTop: '0.5rem', color: '#666', fontSize: '0.9rem' }}>
                    Recording... (speak clearly)
                  </p>
                </div>
              )}
            </div>

            {userAudioUrl && (
              <div className="user-audio">
                <p>Your recorded response:</p>
                <button onClick={playUserAudio} className="play-button">
                  {isPlayingUserAudio ? "⏸️ Pause Response" : "▶️ Play Your Response"}
                </button>
              </div>
            )}

            {loading && (
              <div className="processing">
                <p>Processing your voice response...</p>
              </div>
            )}

            {feedbackReady && !loading && (
              <div className="feedback-ready">
                <button 
                  onClick={handleGetFeedback} 
                  disabled={feedbackLoading}
                  className="feedback-button"
                >
                  {feedbackLoading ? "Loading Feedback..." : "🎯 Get Feedback"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {step === "feedback" && feedback && (
        <div className="feedback-section">
          <div className="feedback-card">
            <h3>🎯 Feedback on Your Voice Response</h3>
            <div className="feedback-content">
              <p>{feedback}</p>
            </div>
          </div>
          
          <div className="action-buttons">
            <button onClick={handleNewScenario} className="new-scenario-btn">
              Try Another Voice Scenario
            </button>
          </div>
        </div>
      )}

      {error && <div className="error">{error}</div>}
    </div>
  )
}

export default RehearseVoice 