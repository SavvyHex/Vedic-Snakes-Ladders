import React, { useEffect, useRef } from 'react'
import Phaser from 'phaser'

// This component now only handles Physics and Inputs. 
// It sends signals (props) up to App.jsx when things happen.
export default function PhaserGame({ currentLevel, onCollectVeda, onReachGate, isQuizActive, restartKey, correctAnswersCount, totalBooksRequired }) {
    const containerRef = useRef(null)
    const gameRef = useRef(null)
    const correctAnswersRef = useRef(0);

    // Keep track of correct answers in a ref
    useEffect(() => {
        correctAnswersRef.current = correctAnswersCount || 0;
    }, [correctAnswersCount]);

    useEffect(() => {
        if (!containerRef.current) return

        // Cleanup old game instance strictly before creating a new one
        if (gameRef.current) {
            gameRef.current.destroy(true);
        }

        // --- VARIABLES ---
        let player
        let keys
        let cursors
        let vedasGroup 
        let score = 0 // Internal score to know when to open gate
        let vedaRects = [] // Store references to reveal them sequentially
        let gate // Gate reference for continuous checking
        let gateTriggered = false // Prevent multiple triggers
        let sceneRef // Reference to scene for update function

        // Define game dimensions and spawn areas
        const GAME_WIDTH = 800;
        const GAME_HEIGHT = 600;
        const PLAYER_START = { x: 100, y: 500 }; // Bottom left
        const GATE_POS = { x: 750, y: 100 }; // Top right
        const MIN_DISTANCE_FROM_GATE = 150; // Books can't spawn too close to gate
        const MIN_DISTANCE_FROM_PLAYER = 150; // Books can't spawn too close to player start

        const config = {
            type: Phaser.AUTO,
            width: GAME_WIDTH,
            height: GAME_HEIGHT,
            parent: containerRef.current,
            backgroundColor: '#000',
            render: {
                pixelArt: true
            },
            physics: {
                default: 'arcade',
                arcade: { debug: false }
            },
            scene: {
                preload: preload,
                create: create,
                update: update
            }
        }

        function preload() {
            const scene = this;
            // Load the walking spritesheet
            scene.load.spritesheet('walking', '/assets/walking.png', {
                frameWidth: 64,
                frameHeight: 64
            });
            // Load the idle spritesheet
            scene.load.spritesheet('idle', '/assets/idle.png', {
                frameWidth: 64,
                frameHeight: 64
            });
            // Load the book sprite
            scene.load.image('book', '/assets/book.png');
        }

        function create() {
            const scene = this; 
            sceneRef = scene; // Store scene reference
            score = 0;
            
            // Helper function to generate random position avoiding player and gate
            const generateBookPosition = () => {
                let validPosition = false;
                let x, y;
                let attempts = 0;
                const maxAttempts = 100;
                
                while (!validPosition && attempts < maxAttempts) {
                    x = 100 + Math.random() * (GAME_WIDTH - 200);  // Random x with margins
                    y = 100 + Math.random() * (GAME_HEIGHT - 200); // Random y with margins
                    
                    // Check distance from player start
                    const distFromPlayer = Math.sqrt(
                        Math.pow(x - PLAYER_START.x, 2) + Math.pow(y - PLAYER_START.y, 2)
                    );
                    
                    // Check distance from gate
                    const distFromGate = Math.sqrt(
                        Math.pow(x - GATE_POS.x, 2) + Math.pow(y - GATE_POS.y, 2)
                    );
                    
                    if (distFromPlayer >= MIN_DISTANCE_FROM_PLAYER && distFromGate >= MIN_DISTANCE_FROM_GATE) {
                        validPosition = true;
                    }
                    attempts++;
                }
                
                return { x, y };
            };

            // --- PLAYER ---
            player = scene.add.sprite(PLAYER_START.x, PLAYER_START.y, 'walking')
            player.setScale(1.0) // Adjust scale if needed
            scene.physics.add.existing(player)
            player.body.setCollideWorldBounds(true)

            // Create walking animation
            scene.anims.create({
                key: 'walk',
                frames: scene.anims.generateFrameNumbers('walking', { start: 0, end: 3 }),
                frameRate: 10,
                repeat: -1 // Loop indefinitely
            });

            // Create idle animation
            scene.anims.create({
                key: 'idle',
                frames: scene.anims.generateFrameNumbers('idle', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1 // Loop indefinitely
            });

            // --- VEDAS ---
            vedasGroup = scene.physics.add.staticGroup();
            vedaRects = []; // Reset array for new level
            
            // Only create the current book that should be collectible
            // Don't create invisible books that can be accidentally collected
            const pos = generateBookPosition();
            const book = scene.add.sprite(pos.x, pos.y, 'book')
            book.setScale(1.0);
            // Store the ID (index based on correct answers count)
            book.setData('id', correctAnswersCount);
            book.setVisible(true);
            vedasGroup.add(scene.physics.add.existing(book, true));
            vedaRects.push(book);

            // --- GATE ---
            gate = scene.add.rectangle(GATE_POS.x, GATE_POS.y, 30, 60, 0xff0000)
            scene.physics.add.existing(gate, true)

            // --- CONTROLS ---
            keys = scene.input.keyboard.addKeys('W,A,S,D')
            cursors = scene.input.keyboard.createCursorKeys()

            // --- COLLISIONS ---
            // 1. Collect Veda
            scene.physics.add.overlap(player, vedasGroup, (p, v) => {
                // Only collect if book hasn't been collected yet
                if (v.body.enable === false) return;
                
                // Disable and hide the book
                v.body.enable = false; // 1. Turn off physics so you can't hit it again
                v.setVisible(false);   // 2. Make it invisible

                score++;
                
                // Signal React: "User collected a veda!" with the book index
                if(onCollectVeda) onCollectVeda(v.getData('id'));
            }, null, scene)

            // Note: Gate collision now checked in update() function
        }

        function update() {
            if (!player || !player.body) return
            player.body.setVelocity(0)

            let isMoving = false;

            // Movement Logic
            if (keys.A.isDown || (cursors && cursors.left.isDown)) {
                player.body.setVelocityX(-200)
                player.setFlipX(true);
                isMoving = true;
            }
            else if (keys.D.isDown || (cursors && cursors.right.isDown)) {
                player.body.setVelocityX(200)
                player.setFlipX(false);
                isMoving = true;
            }

            if (keys.W.isDown || (cursors && cursors.up.isDown)) {
                player.body.setVelocityY(-200)
                isMoving = true;
            }
            else if (keys.S.isDown || (cursors && cursors.down.isDown)) {
                player.body.setVelocityY(200)
                isMoving = true;
            }

            // Play or stop walking animation
            if (isMoving) {
                player.anims.play('walk', true);
            } else {
                player.anims.play('idle', true);
            }

            // Check gate collision continuously
            if (gate && !gateTriggered && sceneRef && sceneRef.physics.overlap(player, gate)) {
                console.log('At gate! Correct answers:', correctAnswersRef.current, 'Required:', totalBooksRequired);
                
                if (correctAnswersRef.current >= totalBooksRequired) {
                    gateTriggered = true; // Prevent multiple triggers
                    console.log('Level complete! Advancing...');
                    // Signal React: "User finished level!"
                    if(onReachGate) onReachGate();
                }
            }
        }

        gameRef.current = new Phaser.Game(config)

        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true)
                gameRef.current = null
            }
        }
    }, [currentLevel, restartKey, totalBooksRequired, correctAnswersCount]) // Restart game when book should change

    // Handle disabling keyboard input and pausing physics when quiz is active
    useEffect(() => {
        if (gameRef.current && gameRef.current.scene && gameRef.current.scene.scenes[0]) {
            const scene = gameRef.current.scene.scenes[0];
            
            if (isQuizActive) {
                // Disable keyboard input
                if (gameRef.current.input && gameRef.current.input.keyboard) {
                    gameRef.current.input.keyboard.enabled = false;
                }
                // Pause physics
                if (scene.physics && scene.physics.world) {
                    scene.physics.pause();
                }
            } else {
                // Enable keyboard input
                if (gameRef.current.input && gameRef.current.input.keyboard) {
                    gameRef.current.input.keyboard.enabled = true;
                }
                // Resume physics
                if (scene.physics && scene.physics.world) {
                    scene.physics.resume();
                }
            }
        }
    }, [isQuizActive])

    return <div ref={containerRef} style={{ width: '800px', height: '600px' }} />
}