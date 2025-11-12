// --- LEVEL DATA ---
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
];

// --- GAME CONFIGURATION ---
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: levelData[0].backgroundColor, 
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// ---GLOBAL VARIABLES ---
let player;
let keys;
let vedas;
let scoreText;
let score = 0;
let gate;
let currentLevelIndex = 0; 
let totalVedas; 

// ---CREATE THE GAME INSTANCE ---
const game = new Phaser.Game(config);

// ---PRELOAD FUNCTION ---
function preload() {
    

// ---CREATE FUNCTION ---
function create() {
    score = 0; 
    
   
    const level = levelData[currentLevelIndex];
    totalVedas = level.totalVedas;

    // --- Create Player ---
    player = this.add.rectangle(100, 100, 30, 30, 0x00ff00); 
    this.physics.add.existing(player);
    player.body.setCollideWorldBounds(true);

   
    vedas = this.physics.add.staticGroup();

    // Loop through the vedas array for the current level
    level.vedas.forEach(vedaPos => {
        vedas.create(vedaPos.x, vedaPos.y, 'rectangle', 20, 20, 0xffff00); 
    });

    // --- Create Score Text ---
    scoreText = this.add.text(10, 10, 'Vedas Collected: 0', {
        font: '24px Arial',
        fill: '#FFFFFF'
    });

  
    gate = this.add.rectangle(750, 275, 20, 50, 0xff0000); // Red
    this.physics.add.existing(gate, true);

    keys = this.input.keyboard.addKeys('W,A,S,D');


    this.physics.add.overlap(player, vedas, collectVeda, null, this);
    this.physics.add.overlap(player, gate, touchGate, null, this);
    

    this.cameras.main.setBackgroundColor(level.backgroundColor);
}

// --- UPDATE FUNCTION (The Game Loop) ---
function update() {

    player.body.setVelocity(0);

    if (keys.A.isDown) {
        player.body.setVelocityX(-200);
    } else if (keys.D.isDown) {
        player.body.setVelocityX(200);
    }

    if (keys.W.isDown) {
        player.body.setVelocityY(-200);
    } else if (keys.S.isDown) {
        player.body.setVelocityY(200);
    }
}

// --- FUNTION TO PROCESS COLLECTING VEDAS ---
function collectVeda(player, veda) {
    
    veda.disableBody(true, true);

    score++;
    scoreText.setText('Vedas Collected: ' + score);

    if (score === totalVedas) { 
        gate.setFillStyle(0x00ff00); 
    }
}

// --- 'touchGate' Function ---
function touchGate(player, gate) {
    
    const level = levelData[currentLevelIndex];

    
    if (score !== level.totalVedas) {
        return; 
    }

    this.physics.pause();
    player.body.setVelocity(0);

    const answer = window.prompt(level.quiz.question);

   
    if (answer && answer.toLowerCase().trim() === level.quiz.answer) {
       
        window.alert("Correct! You have understood this realm.");
        
        
        currentLevelIndex++;

       
        if (currentLevelIndex >= levelData.length) {
            this.add.text(400, 300, 'YOU HAVE REACHED LIBERATION!', {
                font: '36px Arial',
                fill: '#FFFF00'
            }).setOrigin(0.5);
            
            return; 
        } 
      
        this.scene.restart();

    } else {
        window.alert("Incorrect. You must learn this realm's lesson again.");
        this.scene.restart();
    }
}
}
