// src/pages/student/AttemptQuiz.js
// AttemptQuiz.js - Shows both Placement Quiz and Quiz Journey options

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import studentService from "../../services/studentService";

export default function AttemptQuiz() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [placementCompleted, setPlacementCompleted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadQuizData();
    
    // ✅ AUTO-REFRESH when user navigates back to this page
    const handleFocus = () => {
      console.log('🔄 Page focus detected, refreshing quiz data...');
      loadQuizData();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [navigate]);

  const loadQuizData = async () => {
    if (!authService.isAuthenticated()) {
      navigate("/login");
      return;
    }

    setLoading(true);

    try {
      console.log("📡 Fetching placement status and math profile...");
      
      // Check placement status first
      const placementResult = await studentService.getPlacementStatus();
      const isPlacementDone = placementResult?.success && (placementResult?.placementCompleted || placementResult?.placement_completed);
      setPlacementCompleted(isPlacementDone);
      
      console.log("📥 Placement completed:", isPlacementDone);

      // Then fetch math profile for daily limits
      const result = await studentService.getMathProfile();
      console.log("📥 Profile result:", result);

      if (!result?.success) {
        setError("Failed to load quiz data");
        setProfileData(null);
        return;
      }

      const mp = result.mathProfile || null;

      if (mp) {
        // Backend daily limit is 2 quizzes/day
        const dailyLimit = 2;
        const quizzesToday = Number.isFinite(mp.quizzes_today) ? mp.quizzes_today : 0;
        const attemptsRemaining = Number.isFinite(mp.quizzes_remaining)
          ? mp.quizzes_remaining
          : Math.max(0, dailyLimit - quizzesToday);

        const currentProfile = Number.isFinite(mp.current_profile) ? mp.current_profile : 1;

        setProfileData({
          current_profile: currentProfile,
          profile_name: `Profile ${currentProfile}`,
          total_points: Number.isFinite(mp.total_points) ? mp.total_points : 0,
          quizzes_today: quizzesToday,
          attemptsRemaining,
          attemptsUsed: dailyLimit - attemptsRemaining,
          dailyLimit,
        });
      } else {
        // No profile yet - set defaults
        setProfileData({
          current_profile: 1,
          profile_name: "Profile 1",
          total_points: 0,
          quizzes_today: 0,
          attemptsRemaining: 2,
          attemptsUsed: 0,
          dailyLimit: 2,
        });
      }
    } catch (e) {
      console.error("❌ Load quiz data error:", e);
      setError("Failed to load quiz data");
      setProfileData(null);
    } finally {
      setLoading(false);
    }
  };

  // ✅ UNLIMITED ATTEMPTS - No restrictions on quiz taking
  const canTakeQuiz = true; // Always allow quiz attempts

  const handleStartQuizJourney = () => {
    if (!placementCompleted) {
      alert("⚠️ Please complete the Placement Quiz first before starting the Quiz Journey!");
      return;
    }
    // ✅ REMOVED DAILY LIMIT CHECK - Users can take unlimited quizzes
    // Navigate to Quiz Journey
    navigate("/student/quiz-journey");
  };

  const handleStartPlacement = () => {
    if (placementCompleted) {
      alert("✅ You have already completed the Placement Quiz!");
      return;
    }
    navigate("/student/quiz/placement");
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
    cardsContainer: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
      gap: "24px",
      marginTop: "24px",
    },
    quizCard: {
      background: "white",
      borderRadius: "16px",
      padding: "32px",
      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
      textAlign: "center",
      transition: "transform 0.3s, box-shadow 0.3s",
      cursor: "pointer",
    },
    quizCardHover: {
      transform: "translateY(-4px)",
      boxShadow: "0 8px 16px rgba(0, 0, 0, 0.15)",
    },
    quizIcon: { fontSize: "64px", marginBottom: "16px" },
    quizTitle: { fontSize: "24px", fontWeight: "700", color: "#1f2937", marginBottom: "12px" },
    quizDescription: { fontSize: "14px", color: "#6b7280", marginBottom: "20px", lineHeight: "1.6" },
    statusBadge: {
      display: "inline-block",
      padding: "6px 16px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "600",
      marginBottom: "16px",
    },
    completedBadge: {
      background: "#d1fae5",
      color: "#065f46",
    },
    pendingBadge: {
      background: "#fef3c7",
      color: "#92400e",
    },
    startButton: {
      padding: "14px 32px",
      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      color: "white",
      border: "none",
      borderRadius: "12px",
      fontSize: "16px",
      fontWeight: "700",
      cursor: "pointer",
      transition: "all 0.3s",
      width: "100%",
    },
    placementButton: {
      padding: "14px 32px",
      background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
      color: "white",
      border: "none",
      borderRadius: "12px",
      fontSize: "16px",
      fontWeight: "700",
      cursor: "pointer",
      transition: "all 0.3s",
      width: "100%",
    },
    disabledButton: {
      opacity: 0.5,
      cursor: "not-allowed",
    },
    infoBox: {
      background: "#f9fafb",
      borderRadius: "12px",
      padding: "16px",
      marginTop: "16px",
      fontSize: "13px",
      color: "#4b5563",
      border: "2px solid #e5e7eb",
    },
    attemptsBox: {
      padding: "16px",
      borderRadius: "12px",
      marginTop: "16px",
      border: "2px solid",
      fontSize: "14px",
      fontWeight: "600",
      textAlign: "center",
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
          <h1 style={styles.title}>📝 Primary 1 Math Quiz</h1>
          <button
            style={styles.backButton}
            onClick={() => navigate("/student")}
            onMouseEnter={(e) => (e.target.style.background = "#4b5563")}
            onMouseLeave={(e) => (e.target.style.background = "#6b7280")}
          >
            ← Back to Dashboard
          </button>
        </div>

        {error && <div style={styles.errorMessage}>⚠️ {error}</div>}

        <div style={styles.cardsContainer}>
          {/* PLACEMENT QUIZ CARD */}
          <div
            style={styles.quizCard}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
            }}
          >
            <div style={styles.quizIcon}>🎯</div>
            <h2 style={styles.quizTitle}>Placement Quiz</h2>
            
            <span
              style={{
                ...styles.statusBadge,
                ...(placementCompleted ? styles.completedBadge : styles.pendingBadge),
              }}
            >
              {placementCompleted ? "✅ Completed" : "⏳ Pending"}
            </span>

            <p style={styles.quizDescription}>
              {placementCompleted
                ? "You have completed the placement quiz! Your skill level has been assessed."
                : "Take this quiz first to assess your current math skill level. This helps us personalize your learning journey."}
            </p>

            <button
              style={{
                ...styles.placementButton,
                ...(placementCompleted ? styles.disabledButton : {}),
              }}
              onClick={handleStartPlacement}
              disabled={placementCompleted}
              onMouseEnter={(e) => {
                if (!placementCompleted) e.target.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "scale(1)";
              }}
            >
              {placementCompleted ? "✅ Already Completed" : "🚀 Start Placement Quiz"}
            </button>

            {!placementCompleted && (
              <div style={styles.infoBox}>
                📌 Complete this first to unlock the Quiz Journey!
              </div>
            )}
          </div>

          {/* QUIZ JOURNEY CARD */}
          <div
            style={styles.quizCard}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
            }}
          >
            <div style={styles.quizIcon}>🎮</div>
            <h2 style={styles.quizTitle}>Adaptive Quiz Journey</h2>
            
            <span
              style={{
                ...styles.statusBadge,
                ...(placementCompleted ? styles.completedBadge : styles.pendingBadge),
              }}
            >
              {placementCompleted ? "🔓 Unlocked" : "🔒 Locked"}
            </span>

            <p style={styles.quizDescription}>
              Progress through 10 levels of adaptive quizzes! Each level adapts to your skill and gets progressively challenging.
            </p>

            {/* ✅ REMOVED ATTEMPTS LIMIT DISPLAY - Unlimited quizzes now available! */}
            {placementCompleted && (
              <div style={{ 
                ...styles.infoBox,
                background: "#ecfdf5",
                color: "#065f46",
                border: "2px solid #10b981",
                fontWeight: "600"
              }}>
                ✅ Unlimited Attempts Available!
              </div>
            )}

            <button
              style={{
                ...styles.startButton,
                ...(!placementCompleted ? styles.disabledButton : {}),
              }}
              onClick={handleStartQuizJourney}
              disabled={!placementCompleted}
              onMouseEnter={(e) => {
                if (placementCompleted) e.target.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "scale(1)";
              }}
            >
              {!placementCompleted
                ? "🔒 Complete Placement First"
                : "🚀 Start Quiz Journey"}
            </button>

            {!placementCompleted && (
              <div style={styles.infoBox}>
                🔒 Complete the Placement Quiz to unlock this!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}