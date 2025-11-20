import React, { useState } from 'react';
import PhaserGame from './components/PhaserGame';
import levelData from './data/levelData';
import vedaTexts from './data/vedas.json'; // Ensure this file exists
import './index.css'; 

export default function App() {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [collectedText, setCollectedText] = useState([]); 
  const [showQuiz, setShowQuiz] = useState(false);
  const [score, setScore] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [usedQuoteIndices, setUsedQuoteIndices] = useState([]);

  // Safety Check: Ensure we have data for the current level
  const currentLevelData = levelData[currentLevel];

  if (!currentLevelData) {
      return <div style={{color: 'white'}}>Error: No data for level {currentLevel}</div>;
  }

  // --- HANDLERS ---
  const handleVedaCollection = () => {
    setScore(prev => prev + 1);

    // Pick a random quote from the current level's category (without repetition)
    if (vedaTexts && currentLevelData.vedaCategory) {
        const quotes = vedaTexts[currentLevelData.vedaCategory];
        
        if (quotes && quotes.length > 0) {
            // Get available quotes (those not yet used)
            const availableIndices = quotes
                .map((_, idx) => idx)
                .filter(idx => !usedQuoteIndices.includes(idx));
            
            let randomIndex;
            
            if (availableIndices.length > 0) {
                // Pick from available quotes
                randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
            } else {
                // All quotes used, reset and pick any
                randomIndex = Math.floor(Math.random() * quotes.length);
                setUsedQuoteIndices([]);
            }
            
            const randomQuote = quotes[randomIndex];
            setCollectedText(prev => [{ category: currentLevelData.vedaCategory, text: randomQuote }, ...prev]);
            setUsedQuoteIndices(prev => [...prev, randomIndex]);
        }
    }
  };

  const handleReachGate = () => {
    setShowQuiz(true);
  };

  const handleSubmitAnswer = () => {
    // Compare answer (case-insensitive) - accept both English and Sanskrit versions
    const correctAnswers = {
      0: ['ignorance', 'avidya'],
      1: ['desire', 'kama', 'krodha'],
      2: ['ethics', 'dharma'],
      3: ['knowledge', 'jnana'],
      4: ['devotion', 'bhakti'],
      5: ['meditation', 'dhyana'],
      6: ['liberation', 'moksha']
    };
    
    const validAnswers = correctAnswers[currentLevel] || [];
    const userLower = userAnswer.trim().toLowerCase();
    const isCorrect = validAnswers.some(answer => userLower === answer);
    
    if (isCorrect) {
      alert("Correct! Ascending to the next realm...");
      
      // Reset State for Next Level
      setShowQuiz(false);
      setUserAnswer("");
      setCollectedText([]); 
      setScore(0);
      setUsedQuoteIndices([]);
      
      // Advance Level
      if (currentLevel + 1 < levelData.length) {
          setCurrentLevel(prev => prev + 1);
      } else {
          alert("You have reached Ultimate Liberation!");
          setCurrentLevel(0); // Loop back to start
      }
    } else {
      alert("Incorrect. Seek the answer within.");
    }
  };

  return (
    <div style={{ display: 'flex', padding: '20px', backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
      
      {/* LEFT SIDE: GAME AREA */}
      <div style={{ flex: 2 }}>
        <h2 style={{ color: '#ffd700', fontFamily: 'monospace' }}>
          {currentLevelData.levelName} - Vedas: {score}/{currentLevelData.totalVedas}
        </h2>
        {/* We pass the level and handlers down to the game */}
        <PhaserGame 
          currentLevel={currentLevel}
          onCollectVeda={handleVedaCollection}
          onReachGate={handleReachGate}
          isQuizActive={showQuiz}
        />
      </div>

      {/* RIGHT SIDE: WISDOM SIDEBAR */}
      <div style={{ flex: 1, marginLeft: '20px', color: 'white', borderLeft: '2px solid #333', paddingLeft: '20px', minWidth: '400px', width: '400px' }}>
        <h3 style={{ borderBottom: '1px solid #ffd700' }}>Collected Wisdom</h3>
        <div style={{ maxHeight: '600px', overflowY: 'auto', wordWrap: 'break-word', overflow: 'hidden' }}>
          {collectedText.length === 0 && <p style={{color: '#777'}}>Collect yellow Vedas to reveal wisdom...</p>}
          {collectedText.map((item, i) => (
            <div key={i} style={{ marginBottom: '15px', background: '#333', padding: '10px', borderRadius: '5px' }}>
              <p style={{ margin: '5px 0', fontStyle: 'italic' }}>"{item.text}"</p>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: QUIZ OVERLAY */}
      {showQuiz && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div style={{ background: '#222', padding: '40px', border: '2px solid #ffd700', borderRadius: '10px', textAlign: 'center', color: 'white', width: '400px' }}>
            <h2>Gatekeeper's Test</h2>
            <p style={{ whiteSpace: 'pre-wrap', fontSize: '1.2em', marginBottom: '20px' }}>
                {currentLevelData.quiz.question}
            </p>
            
            <input 
                type="text" 
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your answer..."
                style={{ padding: '10px', width: '80%', marginBottom: '20px', fontSize: '1rem' }}
            />
            <br />
            
            <button 
                onClick={handleSubmitAnswer}
                style={{ padding: '10px 30px', cursor: 'pointer', fontSize: '1rem', background: '#ffd700', color: '#000', border: 'none', fontWeight: 'bold' }}
            >
                Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}