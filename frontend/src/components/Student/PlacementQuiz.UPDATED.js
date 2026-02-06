// PlacementQuiz.js - UPDATED with placement completion marking
/* Import statements remain the same */

export default function PlacementQuiz() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadQuiz = async () => {
      if (!authService.isAuthenticated()) {
        navigate('/login');
        return;
      }

      try {
        // Load placement quiz data from backend
        const response = await fetch(
          `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/student/quiz/placement`,
          { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }
        );
        const data = await response.json();
        if (data.success) {
          setQuizData(data.data);
          setAnswers(Array(data.data.total_questions).fill(''));
        }
      } catch (error) {
        console.error('Error loading quiz:', error);
        setError('Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [navigate]);

  const handleAnswerChange = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < quizData.total_questions - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    // Check if all questions answered
    const unanswered = answers.filter(a => a === '').length;
    if (unanswered > 0) {
      setError('Please answer all questions before submitting');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      // Submit the quiz answers
      const submitRes = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/student/quiz/submit-placement`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            quiz_id: quizData.quiz_id,
            answers: answers
          })
        }
      );

      const submitData = await submitRes.json();

      if (submitData.success) {
        // ✅ Backend marks placementQuizCompleted: true automatically
        // Navigate to results page
        navigate('/student/quiz-result', {
          state: {
            result: submitData.data.result,
            quizType: 'placement',
            profile: submitData.data.profile
          }
        });
      } else {
        setError(submitData.error || 'Failed to submit quiz');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      setError('Failed to submit quiz. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ... rest of styles and JSX remain the same
}
