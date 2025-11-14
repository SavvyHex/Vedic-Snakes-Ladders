const levelData = [ 
    {
        levelName: "Level 1",
        backgroundColor: '#000000',
        totalVedas: 3,
        vedas: [
            { x: 200, y: 300 },
            { x: 500, y: 150 },
            { x: 600, y: 450 }
        ],
        quiz: {
            question: "LEVEL 1: What is the first stage of spiritual growth?\n(Type 'Ignorance')",
            answer: "ignorance"
        }
    },
    {
        levelName: 'Desire',
        backgroundColor: '#001f3f', 
        totalVedas: 4,
        vedas: [
            { x: 100, y: 100 },
            { x: 700, y: 100 },
            { x: 100, y: 500 },
            { x: 700, y: 500 }
        ],
        quiz: {
            question: "LEVEL 2: What follows Ignorance?\n(Type 'Desire')",
            answer: "desire"
        }
    },
]

export default levelData
