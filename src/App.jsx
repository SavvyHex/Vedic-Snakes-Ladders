import React, { useState, useEffect } from 'react';
import PhaserGame from './components/PhaserGame';
import levelData from './data/levelData';
import { loadQuizQuestions } from './data/quizParser';
import './index.css'; 

export default function App() {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [showQuiz, setShowQuiz] = useState(false);
  const [score, setScore] = useState(0);
  const [restartKey, setRestartKey] = useState(0); // Key to force game restart
  const [quizQuestions, setQuizQuestions] = useState({}); // All quiz questions loaded from file
  const [answeredBooks, setAnsweredBooks] = useState([]); // Track which books have been answered correctly
  const [currentBookIndex, setCurrentBookIndex] = useState(null); // Which book was just collected
  const [currentQuestion, setCurrentQuestion] = useState(null); // Current question being asked
  const [penaltyBooks, setPenaltyBooks] = useState(0); // Extra books needed due to wrong answers
  const [usedQuestionIndices, setUsedQuestionIndices] = useState([]); // Track which questions have been used

  // Load quiz questions on mount
  useEffect(() => {
    console.log('Loading quiz questions...');
    loadQuizQuestions()
      .then(questions => {
        console.log('Quiz questions loaded in App:', questions);
        console.log('Type:', typeof questions);
        console.log('Keys:', Object.keys(questions));
        setQuizQuestions(questions);
      })
      .catch(error => {
        console.error('Error loading quiz questions:', error);
      });
  }, []);

  // Safety Check: Ensure we have data for the current level
  const currentLevelData = levelData[currentLevel - 1]; // levelData is 0-indexed array

  if (!currentLevelData) {
      return <div style={{color: 'white'}}>Error: No data for level {currentLevel}</div>;
  }

  // --- HANDLERS ---
  const handleVedaCollection = (bookIndex) => {
    console.log('Book collected:', bookIndex);
    console.log('Answered books:', answeredBooks);
    console.log('Quiz questions available:', quizQuestions);
    
    // Check if this book has already been answered correctly
    if (answeredBooks.includes(bookIndex)) {
      console.log('Book already answered, skipping');
      return; // Already answered, don't show quiz again 
    }

    // Get a question for this book (convert level to string for key access)
    const levelQuestions = quizQuestions[String(currentLevel)];
    console.log('Current level:', currentLevel, 'Level questions:', levelQuestions);
    
    if (levelQuestions && levelQuestions.length > 0) {
      // Get available questions that haven't been used yet
      const availableIndices = levelQuestions
        .map((_, idx) => idx)
        .filter(idx => !usedQuestionIndices.includes(idx));
      
      let questionIndex;
      if (availableIndices.length > 0) {
        // Pick a random unused question
        questionIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
      } else {
        // All questions used, pick any random question
        questionIndex = Math.floor(Math.random() * levelQuestions.length);
      }
      
      const question = levelQuestions[questionIndex];
      console.log('Selected question:', question);
      setUsedQuestionIndices(prev => [...prev, questionIndex]);
      
      setCurrentBookIndex(bookIndex);
      setCurrentQuestion(question);
      setShowQuiz(true);
      console.log('Quiz should now be shown');
    } else {
      console.error('No questions available for level', currentLevel);
    }
  };

  const handleReachGate = () => {
    const requiredBooks = currentLevelData.totalVedas + penaltyBooks;
    // Only allow through gate if all books have been answered (including penalties)
    if (answeredBooks.length >= requiredBooks) {
      // All books answered, proceed to next level
      advanceToNextLevel();
    }
  };

  const handleSubmitAnswer = (selectedAnswer) => {
    if (!currentQuestion) return;

    // Check if answer is correct (match the letter A, B, C, or D)
    const isCorrect = selectedAnswer === currentQuestion.answer;
    
    if (isCorrect) {
      alert("Correct! Continue your journey...");
      
      // Mark this book as answered
      setAnsweredBooks(prev => [...prev, currentBookIndex]);
      setScore(prev => prev + 1);
      
      // Close quiz
      setShowQuiz(false);
      setCurrentQuestion(null);
      setCurrentBookIndex(null);
      
      // Check if all books are answered (including penalties)
      const requiredBooks = currentLevelData.totalVedas + penaltyBooks;
      if (answeredBooks.length + 1 >= requiredBooks) {
        // Show message that gate is now open
        setTimeout(() => {
          alert("All wisdom collected! The gate is now open. Proceed to ascend!");
        }, 500);
      }
    } else {
      // Get the correct answer text
      const correctOption = currentQuestion.options.find(opt => opt.letter === currentQuestion.answer);
      const correctText = correctOption ? `${currentQuestion.answer}) ${correctOption.text}` : currentQuestion.answer;
      
      alert(`Incorrect! The correct answer is: ${correctText}\n\nPenalty: You must collect one additional book.`);
      
      // Add penalty book
      setPenaltyBooks(prev => prev + 1);
      
      // Close quiz - player needs to find another book
      setShowQuiz(false);
      setCurrentQuestion(null);
      setCurrentBookIndex(null);
    }
  };

  const advanceToNextLevel = () => {
    alert("Ascending to the next realm...");
    
    // Reset State for Next Level
    setShowQuiz(false);
    setScore(0);
    setAnsweredBooks([]);
    setCurrentQuestion(null);
    setCurrentBookIndex(null);
    setPenaltyBooks(0);
    setUsedQuestionIndices([]);
    
    // Advance Level (game will restart automatically when currentLevel changes)
    if (currentLevel < levelData.length) {
        setCurrentLevel(prev => prev + 1);
    } else {
        alert("You have reached Ultimate Liberation!");
        setCurrentLevel(1); // Loop back to start
    }
  };

  const requiredBooks = currentLevelData.totalVedas + penaltyBooks;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '20px', backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
      
      {/* GAME AREA */}
      <div>
        <h2 style={{ color: '#ffd700', fontFamily: 'monospace' }}>
          {currentLevelData.levelName} - Books Answered: {answeredBooks.length}/{requiredBooks}
          {penaltyBooks > 0 && <span style={{ color: '#ff6b6b', marginLeft: '10px' }}>(+{penaltyBooks} penalty)</span>}
        </h2>
        {/* We pass the level and handlers down to the game */}
        <PhaserGame 
          currentLevel={currentLevel}
          onCollectVeda={handleVedaCollection}
          onReachGate={handleReachGate}
          isQuizActive={showQuiz}
          restartKey={restartKey}
        />
      </div>

      {/* MODAL: QUIZ OVERLAY */}
      {showQuiz && currentQuestion && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#222', padding: '40px', border: '2px solid #ffd700', borderRadius: '10px', textAlign: 'left', color: 'white', maxWidth: '600px', width: '90%' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Book of Wisdom Question</h2>
            <p style={{ fontSize: '1.1em', marginBottom: '20px', lineHeight: '1.5' }}>
                <strong>Q{currentQuestion.number}:</strong> {currentQuestion.question}
            </p>
            
            <div style={{ marginBottom: '20px' }}>
              {currentQuestion.options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSubmitAnswer(option.letter)}
                  style={{
                    display: 'block',
                    width: '100%',
                    marginBottom: '10px',
                    padding: '15px',
                    background: '#333',
                    borderRadius: '5px',
                    border: '2px solid #555',
                    color: 'white',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#444';
                    e.target.style.borderColor = '#ffd700';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#333';
                    e.target.style.borderColor = '#555';
                  }}
                >
                  <strong>{option.letter})</strong> {option.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}