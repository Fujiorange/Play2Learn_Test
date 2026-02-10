// src/pages/student/AttemptQuiz.js
// AttemptQuiz.js - Adaptive Quiz with Gameboard Integration

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import Gameboard from "./Gameboard";

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin);

export default function AttemptQuiz() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStudentData = async () => {
      if (!authService.isAuthenticated()) {
        navigate("/login");
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/adaptive-quiz/student/level`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const result = await response.json();
        
        if (!result?.success) {
          setError("Failed to load student data");
          return;
        }

        setStudentData(result.data);
      } catch (e) {
        console.error("❌ Load student data error:", e);
        setError("Failed to load student data");
      } finally {
        setLoading(false);
      }
    };

    loadStudentData();
  }, [navigate]);

  const handleStartQuiz = async () => {
    try {
      const currentLevel = studentData?.currentLevel || 1;
      const token = localStorage.getItem('token');
      
      // Get quiz for current level
      const response = await fetch(
        `${API_BASE_URL}/api/adaptive-quiz/quizzes/level/${currentLevel}`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      const data = await response.json();
      
      if (data.success && data.data?._id) {
        // Navigate to quiz taking interface with quizId
        navigate(`/student/quiz/take?quizId=${data.data._id}&level=${currentLevel}`);
      } else {
        setError(data.error || "No quiz available for your level");
      }
    } catch (e) {
      console.error("Error starting quiz:", e);
      setError("Failed to start quiz");
    }
  };

  const styles = {
    container: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)",
      padding: "32px",
    },
    content: { maxWidth: "1200px", margin: "0 auto" },
    header: {
      background: "white",
      borderRadius: "16px",
      padding: "32px",
      marginBottom: "24px",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "16px",
    },
    title: { fontSize: "28px", fontWeight: "700", color: "#1f2937", margin: 0 },
    backButton: {
      padding: "10px 20px",
      background: "#6b7280",
      color: "white",
      border: "none",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.3s",
    },
    errorMessage: {
      padding: "12px 16px",
      background: "#fee2e2",
      color: "#991b1b",
      borderRadius: "8px",
      marginBottom: "16px",
      fontSize: "14px",
      width: "100%",
    },
    statsCard: {
      background: "white",
      borderRadius: "16px",
      padding: "24px",
      marginBottom: "24px",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
    },
    statsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "16px",
      marginTop: "16px",
    },
    statBox: {
      padding: "16px",
      background: "#f9fafb",
      borderRadius: "12px",
      border: "2px solid #e5e7eb",
      textAlign: "center",
    },
    statLabel: {
      fontSize: "13px",
      color: "#6b7280",
      fontWeight: "600",
      marginBottom: "8px",
      textTransform: "uppercase",
    },
    statValue: {
      fontSize: "24px",
      color: "#1f2937",
      fontWeight: "700",
    },
    startButton: {
      width: "100%",
      padding: "16px",
      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      color: "white",
      border: "none",
      borderRadius: "12px",
      fontSize: "18px",
      fontWeight: "700",
      cursor: "pointer",
      transition: "all 0.3s",
      marginTop: "24px",
    },
    loadingContainer: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #e8eef5 0%, #dce4f0 100%)",
    },
    loadingText: { fontSize: "24px", color: "#6b7280", fontWeight: "600" },
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingText}>Loading quiz data...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>📝 Adaptive Quiz Journey</h1>
          <button
            style={styles.backButton}
            onClick={() => navigate("/student")}
            onMouseEnter={(e) => (e.target.style.background = "#4b5563")}
            onMouseLeave={(e) => (e.target.style.background = "#6b7280")}
          >
            ← Back to Dashboard
          </button>

          {error && <div style={styles.errorMessage}>⚠️ {error}</div>}
        </div>

        {studentData && (
          <>
            {/* Gameboard Display */}
            <Gameboard
              currentLevel={studentData.currentLevel}
              characterType={studentData.character_type}
              showAnimation={false}
            />

            {/* Stats Card */}
            <div style={styles.statsCard}>
              <h3 style={{ margin: "0 0 16px 0", fontSize: "20px", fontWeight: "700" }}>
                📊 Your Progress
              </h3>
              <div style={styles.statsGrid}>
                <div style={styles.statBox}>
                  <div style={styles.statLabel}>Current Level</div>
                  <div style={styles.statValue}>{studentData.currentLevel}</div>
                </div>
                <div style={styles.statBox}>
                  <div style={styles.statLabel}>Total Points</div>
                  <div style={styles.statValue}>{studentData.totalPoints || 0}</div>
                </div>
                <div style={styles.statBox}>
                  <div style={styles.statLabel}>Quizzes Completed</div>
                  <div style={styles.statValue}>{studentData.quiz_history?.length || 0}</div>
                </div>
                <div style={styles.statBox}>
                  <div style={styles.statLabel}>Character</div>
                  <div style={styles.statValue}>
                    {studentData.character_type === 'male' ? '👦' : 
                     studentData.character_type === 'female' ? '👧' : '😊'}
                  </div>
                </div>
              </div>

              <button
                style={styles.startButton}
                onClick={handleStartQuiz}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "none";
                }}
              >
                🚀 Start Level {studentData.currentLevel} Quiz
              </button>
            </div>

            {/* Recent Quiz History */}
            {studentData.quiz_history && studentData.quiz_history.length > 0 && (
              <div style={styles.statsCard}>
                <h3 style={{ margin: "0 0 16px 0", fontSize: "20px", fontWeight: "700" }}>
                  📈 Recent Quiz History
                </h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: "#f9fafb", borderBottom: "2px solid #e5e7eb" }}>
                        <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#6b7280" }}>
                          Level Attempted
                        </th>
                        <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#6b7280" }}>
                          P-Score
                        </th>
                        <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#6b7280" }}>
                          Next Level
                        </th>
                        <th style={{ padding: "12px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#6b7280" }}>
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentData.quiz_history.slice(-5).reverse().map((quiz, index) => (
                        <tr key={index} style={{ borderBottom: "1px solid #e5e7eb" }}>
                          <td style={{ padding: "12px", fontSize: "14px" }}>Level {quiz.level_attempted}</td>
                          <td style={{ padding: "12px", fontSize: "14px", fontWeight: "600", color: quiz.P_score > 2.4 ? "#10b981" : quiz.P_score > 1.7 ? "#3b82f6" : "#ef4444" }}>
                            {quiz.P_score.toFixed(2)}
                          </td>
                          <td style={{ padding: "12px", fontSize: "14px" }}>
                            Level {quiz.next_level}
                            {quiz.next_level > quiz.level_attempted && " 📈"}
                            {quiz.next_level < quiz.level_attempted && " 📉"}
                          </td>
                          <td style={{ padding: "12px", fontSize: "14px", color: "#6b7280" }}>
                            {new Date(quiz.timestamp).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
