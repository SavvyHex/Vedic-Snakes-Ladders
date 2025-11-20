const levelData = [ 
    {
        levelName: "Level 1",
        vedaCategory: "Ignorance (Avidya)",
        backgroundColor: '#000000',
        totalVedas: 3,
        vedas: [
            { x: 200, y: 300 },
            { x: 500, y: 150 },
            { x: 600, y: 450 }
        ],
        quiz: {
            question: "What is the first stage of spiritual growth?",
            answer: "ignorance"
        }
    },
    {
        levelName: "Level 2",
        vedaCategory: "Desire (Kama–Krodha)",
        backgroundColor: '#001f3f', 
        totalVedas: 4,
        vedas: [
            { x: 100, y: 100 },
            { x: 700, y: 100 },
            { x: 100, y: 500 },
            { x: 700, y: 500 }
        ],
        quiz: {
            question: "What follows Ignorance?",
            answer: "desire"
        }
    },
    {
        levelName: "Level 3",
        vedaCategory: "Ethics (Dharma)",
        backgroundColor: '#0b3d91',
        totalVedas: 4,
        vedas: [
            { x: 150, y: 120 },
            { x: 400, y: 220 },
            { x: 650, y: 120 },
            { x: 400, y: 480 }
        ],
        quiz: {
            question: "Which principle guides right action?",
            answer: "ethics"
        }
    },
    {
        levelName: "Level 4",
        vedaCategory: "Knowledge (Jnana)",
        backgroundColor: '#1e3d59',
        totalVedas: 4,
        vedas: [
            { x: 120, y: 200 },
            { x: 320, y: 120 },
            { x: 520, y: 420 },
            { x: 720, y: 220 }
        ],
        quiz: {
            question: "What opens the path of deep seeing?",
            answer: "knowledge"
        }
    },
    {
        levelName: "Level 5",
        vedaCategory: "Devotion (Bhakti)",
        backgroundColor: '#4b1f4f',
        totalVedas: 5,
        vedas: [
            { x: 100, y: 80 },
            { x: 700, y: 80 },
            { x: 400, y: 160 },
            { x: 200, y: 460 },
            { x: 600, y: 460 }
        ],
        quiz: {
            question: "Which path is about surrender and love?",
            answer: "devotion"
        }
    },
    {
        levelName: "Level 6",
        vedaCategory: "Meditation (Dhyana)",
        backgroundColor: '#013220',
        totalVedas: 4,
        vedas: [
            { x: 200, y: 140 },
            { x: 400, y: 260 },
            { x: 600, y: 140 },
            { x: 400, y: 420 }
        ],
        quiz: {
            question: "What practice cultivates stillness and presence?",
            answer: "meditation"
        }
    },
    {
        levelName: "Level 7",
        vedaCategory: "Liberation (Moksha)",
        backgroundColor: '#8b5a2b',
        totalVedas: 3,
        vedas: [
            { x: 200, y: 240 },
            { x: 400, y: 120 },
            { x: 600, y: 360 }
        ],
        quiz: {
            question: "What is the final freedom beyond becoming?",
            answer: "liberation"
        }
    },
]

export default levelData
