import React, { useState, useEffect, useRef, useCallback } from 'react';
import PhaserGame from './components/PhaserGame';
import { loadQuizQuestions } from './data/quizParser';
import './index.css'; 

export default function App() {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [showQuiz, setShowQuiz] = useState(false);
  const [score, setScore] = useState(0);
  const [restartKey, setRestartKey] = useState(0); // Key to force game restart
  const [quizQuestions, setQuizQuestions] = useState({}); // All quiz questions loaded from file
  const [answeredBooks, setAnsweredBooks] = useState([]); // Track which books have been answered correctly
  const [collectedBooks, setCollectedBooks] = useState([]); // Track which books have been collected (touched)
  const [currentBookIndex, setCurrentBookIndex] = useState(null); // Which book was just collected
  const [currentQuestion, setCurrentQuestion] = useState(null); // Current question being asked
  const [penaltyBooks, setPenaltyBooks] = useState(0); // Extra books needed due to wrong answers
  const [usedQuestionIndices, setUsedQuestionIndices] = useState([]); // Track which questions have been used
  const [booksPerLevel] = useState(3); // Base number of books per level

  // Use refs to store the latest values for use in Phaser callbacks
  const quizQuestionsRef = useRef({});
  const answeredBooksRef = useRef([]);
  const collectedBooksRef = useRef([]);
  const currentLevelRef = useRef(currentLevel);
  const usedQuestionIndicesRef = useRef([]);

  // Keep refs in sync with state
  useEffect(() => {
    quizQuestionsRef.current = quizQuestions;
  }, [quizQuestions]);

  useEffect(() => {
    answeredBooksRef.current = answeredBooks;
  }, [answeredBooks]);

  useEffect(() => {
    collectedBooksRef.current = collectedBooks;
  }, [collectedBooks]);

  useEffect(() => {
    currentLevelRef.current = currentLevel;
  }, [currentLevel]);

  useEffect(() => {
    usedQuestionIndicesRef.current = usedQuestionIndices;
  }, [usedQuestionIndices]);

  // Debug: Log whenever quizQuestions changes
  useEffect(() => {
    console.log('quizQuestions state changed:', quizQuestions, 'Keys:', Object.keys(quizQuestions));
  }, [quizQuestions]);

  // Load quiz questions on mount
  useEffect(() => {
    console.log('Loading quiz questions...');
    loadQuizQuestions()
      .then(questions => {
        console.log('Quiz questions loaded in App:', questions);
        setQuizQuestions(questions);
      })
      .catch(error => {
        console.error('Error loading quiz questions:', error);
      });
  }, []);

  // Check if we have questions for current level
  const hasQuestionsForLevel = quizQuestions && quizQuestions[String(currentLevel)] && quizQuestions[String(currentLevel)].length > 0;
  
  if (!hasQuestionsForLevel && Object.keys(quizQuestions).length > 0) {
    return <div style={{color: 'white', padding: '20px'}}>No questions available for level {currentLevel}</div>;
  }

  const totalBooksRequired = booksPerLevel + penaltyBooks;

  // --- HANDLERS ---
  const handleVedaCollection = useCallback((bookIndex) => {
    console.log('Book collected:', bookIndex);
    console.log('Answered books:', answeredBooksRef.current);
    console.log('Quiz questions available:', quizQuestionsRef.current);
    console.log('Type of quizQuestions:', typeof quizQuestionsRef.current);
    const keys = Object.keys(quizQuestionsRef.current);
    console.log('Keys array:', keys);
    console.log('Keys length:', keys.length);
    console.log('Is quizQuestions empty?', keys.length === 0);
    
    // Check if quiz questions are loaded yet
    if (!quizQuestionsRef.current || keys.length === 0) {
      console.error('Quiz questions not loaded yet!');
      alert('Please wait for quiz questions to load...');
      return;
    }
    
    // Check if this book has already been collected (touched)
    if (collectedBooksRef.current.includes(bookIndex)) {
      console.log('Book already collected, skipping');
      return; // Already collected, don't show quiz again 
    }

    // Mark as collected immediately
    setCollectedBooks(prev => [...prev, bookIndex]);

    // Get a question for this book (convert level to string for key access)
    const levelKey = String(currentLevelRef.current);
    console.log('Looking for level key:', levelKey);
    console.log('Available keys:', Object.keys(quizQuestionsRef.current));
    const levelQuestions = quizQuestionsRef.current[levelKey];
    console.log('Current level:', currentLevelRef.current, 'Level questions:', levelQuestions);
    
    if (levelQuestions && levelQuestions.length > 0) {
      // Get available questions that haven't been used yet
      const availableIndices = levelQuestions
        .map((_, idx) => idx)
        .filter(idx => !usedQuestionIndicesRef.current.includes(idx));
      
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
      console.error('No questions available for level', currentLevelRef.current);
    }
  }, []); // Empty deps because we use refs

  const handleReachGate = () => {
    console.log('handleReachGate called! Advancing to next level!');
    // PhaserGame already verified we have enough correct answers using the ref
    // No need to check again here with potentially stale state
    advanceToNextLevel();
  };

  const handleSubmitAnswer = (selectedAnswer) => {
    if (!currentQuestion) return;

    // Check if answer is correct (match the letter A, B, C, or D)
    const isCorrect = selectedAnswer === currentQuestion.answer;
    
    if (isCorrect) {
      alert("Correct! Continue your journey...");
      
      // Mark this book as answered correctly
      setAnsweredBooks(prev => [...prev, currentBookIndex]);
      setScore(prev => prev + 1);
      
      // Close quiz
      setShowQuiz(false);
      setCurrentQuestion(null);
      setCurrentBookIndex(null);
      
      // Check if all books are answered (including penalties)
      if (answeredBooks.length + 1 >= totalBooksRequired) {
        // Show message that gate is now open
        setTimeout(() => {
          alert("All wisdom collected! The gate is now open. Proceed to ascend!");
        }, 500);
      }
    } else {
      // Get the correct answer text
      const correctOption = currentQuestion.options.find(opt => opt.letter === currentQuestion.answer);
      const correctText = correctOption ? `${currentQuestion.answer}) ${correctOption.text}` : currentQuestion.answer;
      
      alert(`Incorrect! The correct answer is: ${correctText}\n\nPenalty: You must collect and answer one additional book correctly.`);
      
      // Add penalty book
      setPenaltyBooks(prev => prev + 1);
      
      // Close quiz - next book will appear automatically
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
    setCollectedBooks([]);
    setCurrentQuestion(null);
    setCurrentBookIndex(null);
    setPenaltyBooks(0);
    setUsedQuestionIndices([]);
    
    // Check if next level has questions (use ref to get latest data)
    const nextLevel = currentLevel + 1;
    console.log('Checking for next level:', nextLevel);
    console.log('Available levels:', Object.keys(quizQuestionsRef.current));
    
    if (quizQuestionsRef.current[String(nextLevel)] && quizQuestionsRef.current[String(nextLevel)].length > 0) {
        console.log('Advancing to level', nextLevel);
        setCurrentLevel(nextLevel);
    } else {
        console.log('No more levels available');
        alert("You have completed all available levels!");
        setCurrentLevel(1); // Loop back to start
    }
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '20px', backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
      
      {/* GAME AREA */}
      <div>
        <h2 style={{ color: '#ffd700', fontFamily: 'monospace' }}>
          Level {currentLevel} - Books: {collectedBooks.length} collected | Correct: {answeredBooks.length}/{totalBooksRequired}
          {penaltyBooks > 0 && <span style={{ color: '#ff6b6b', marginLeft: '10px' }}>(+{penaltyBooks} penalty)</span>}
        </h2>
        {/* We pass the level and handlers down to the game */}
        <PhaserGame 
          currentLevel={currentLevel}
          onCollectVeda={handleVedaCollection}
          onReachGate={handleReachGate}
          isQuizActive={showQuiz}
          restartKey={restartKey}
          answeredBooksCount={collectedBooks.length}
          correctAnswersCount={answeredBooks.length}
          totalBooksRequired={totalBooksRequired}
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
                {currentQuestion.question}
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