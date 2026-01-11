import React, { useEffect, useRef } from 'react'
import Phaser from 'phaser'

// This component now only handles Physics and Inputs. 
// It sends signals (props) up to App.jsx when things happen.
export default function PhaserGame({ currentLevel, onCollectVeda, onReachGate, isQuizActive, restartKey, correctAnswersCount, totalBooksRequired }) {
    const containerRef = useRef(null)
    const gameRef = useRef(null)
    const correctAnswersRef = useRef(0);
    const walkingSoundRef = useRef(null);

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
        let walkingSound // Walking sound effect
        let bookSound // Book collection sound effect

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
            pixelArt: true,
            antialias: false,
            roundPixels: true,
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
            // Load door sprite
            scene.load.image('door', '/assets/door.png');
            // Load tilemap tiles
            scene.load.image('floor_1', '/assets/floor_1.png');
            scene.load.image('sand1', '/assets/sand1.png');
            scene.load.image('stone1', '/assets/stone1.png');
            scene.load.image('mossy1', '/assets/mossy1.png');
            // Load sound effects
            scene.load.audio('walking', '/assets/walking.mp3');
            scene.load.audio('bookCollect', '/assets/book.mp3');
        }

        function create() {
            const scene = this; 
            sceneRef = scene; // Store scene reference
            score = 0;
            
            // Create walking sound effect
            walkingSound = scene.sound.add('walking', { loop: true, volume: 0.3 });
            walkingSoundRef.current = walkingSound;
            
            // Create book collection sound effect
            bookSound = scene.sound.add('bookCollect', { volume: 0.5 });
            
            // --- TILEMAP BACKGROUND ---
            // Determine which tile to use based on level
            let tileKey;
            if (currentLevel === 1) {
                tileKey = 'floor_1';
            } else if (currentLevel === 2) {
                tileKey = 'sand1';
            } else if (currentLevel === 3) {
                tileKey = 'stone1';
            } else {
                tileKey = 'mossy1'; // Level 4
            }
            
            // Get tile dimensions (assuming square tiles)
            const tileTexture = scene.textures.get(tileKey);
            const tileWidth = tileTexture.source[0].width;
            const tileHeight = tileTexture.source[0].height;
            
            // Create repeating tilemap to cover entire screen with slight overlap to prevent gaps
            // Subtract 1 pixel to make tiles overlap and hide any gaps from untrimmed sprites
            const overlapX = 1;
            const overlapY = 1;
            
            for (let x = 0; x < GAME_WIDTH; x += (tileWidth - overlapX)) {
                for (let y = 0; y < GAME_HEIGHT; y += (tileHeight - overlapY)) {
                    const tile = scene.add.image(x, y, tileKey);
                    tile.setOrigin(0, 0); // Align to top-left corner
                    tile.setDepth(-1); // Place behind everything else
                }
            }
            
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
            
            // Only create a book if we haven't collected all required books yet
            if (correctAnswersCount < totalBooksRequired) {
                // Only create the current book that should be collectible
                // Don't create invisible books that can be accidentally collected
                const pos = generateBookPosition();
                
                const book = scene.add.sprite(pos.x, pos.y, 'book')
                book.setScale(1.0);
                book.setOrigin(0.5, 0.5);
                book.setDepth(1);
                
                // Create white glow behind the book, offset slightly for proper alignment
                const glow = scene.add.circle(book.x - 3, book.y - 3, 35, 0xffffff, 0.3);
                glow.setDepth(0);
                
                // Store the ID (index based on correct answers count)
                book.setData('id', correctAnswersCount);
                book.setData('glow', glow); // Store glow reference
                book.setVisible(true);
                vedasGroup.add(scene.physics.add.existing(book, true));
                vedaRects.push(book);
            }

            // --- GATE (DOUBLE DOOR) ---
            // Create a group for both door halves
            const gateGroup = scene.physics.add.staticGroup();
            
            // Left door (normal)
            const leftDoor = scene.add.sprite(GATE_POS.x - 15, GATE_POS.y, 'door');
            leftDoor.setOrigin(0.5, 0.5);
            scene.physics.add.existing(leftDoor, true);
            gateGroup.add(leftDoor);
            
            // Right door (flipped horizontally)
            const rightDoor = scene.add.sprite(GATE_POS.x + 15, GATE_POS.y, 'door');
            rightDoor.setOrigin(0.5, 0.5);
            rightDoor.setFlipX(true);
            scene.physics.add.existing(rightDoor, true);
            gateGroup.add(rightDoor);
            
            // Use the group as the gate for collision detection
            gate = gateGroup;

            // --- CONTROLS ---
            keys = scene.input.keyboard.addKeys('W,A,S,D')
            cursors = scene.input.keyboard.createCursorKeys()

            // --- COLLISIONS ---
            // 1. Player collides with gate - use collider callback to check for level completion
            scene.physics.add.collider(player, gate, () => {
                if (!gateTriggered) {
                    const currentCorrectAnswers = correctAnswersRef.current;
                    console.log('Touching gate! Correct answers:', currentCorrectAnswers, 'Required:', totalBooksRequired);
                    
                    if (currentCorrectAnswers >= totalBooksRequired) {
                        gateTriggered = true;
                        console.log('Level complete! Advancing...');
                        if(onReachGate) onReachGate();
                    } else {
                        console.log('Not enough correct answers yet. Need', totalBooksRequired - currentCorrectAnswers, 'more.');
                    }
                }
            });
            
            // 2. Collect Veda
            scene.physics.add.overlap(player, vedasGroup, (p, v) => {
                // Only collect if book hasn't been collected yet
                if (v.body.enable === false) return;
                
                // Play book collection sound
                if (bookSound) {
                    bookSound.play();
                }
                
                // Disable and hide the book and its glow
                v.body.enable = false; // 1. Turn off physics so you can't hit it again
                v.setVisible(false);   // 2. Make it invisible
                const glow = v.getData('glow');
                if (glow) {
                    glow.setVisible(false);
                }

                score++;
                
                // Signal React: "User collected a veda!" with the book index
                if(onCollectVeda) onCollectVeda(v.getData('id'));
            }, null, scene)

            // Note: Gate collision callback handles level progression
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
                // Play walking sound if not already playing
                if (walkingSound && !walkingSound.isPlaying) {
                    walkingSound.play();
                }
            } else {
                player.anims.play('idle', true);
                // Stop walking sound
                if (walkingSound && walkingSound.isPlaying) {
                    walkingSound.stop();
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
    }, [currentLevel, restartKey, totalBooksRequired]) // Only restart on level/penalty changes

    // Dynamically create new book when correct answers increase
    useEffect(() => {
        if (!gameRef.current || !gameRef.current.scene || !gameRef.current.scene.scenes[0]) return;
        
        const scene = gameRef.current.scene.scenes[0];
        
        // Only create a new book if we need one and don't have one already
        if (correctAnswersCount < totalBooksRequired) {
            // Check if a book already exists
            const existingBooks = scene.children.list.filter(child => 
                child.texture && child.texture.key === 'book' && child.body && child.body.enable !== false
            );
            
            if (existingBooks.length === 0) {
                // Generate random position
                const generatePosition = () => {
                    let x, y, validPosition = false, attempts = 0;
                    const GAME_WIDTH = 800, GAME_HEIGHT = 600;
                    const PLAYER_START = { x: 100, y: 500 };
                    const GATE_POS = { x: 750, y: 100 };
                    const MIN_DISTANCE = 150;
                    
                    while (!validPosition && attempts < 100) {
                        x = 100 + Math.random() * (GAME_WIDTH - 200);
                        y = 100 + Math.random() * (GAME_HEIGHT - 200);
                        
                        const distFromPlayer = Math.sqrt(Math.pow(x - PLAYER_START.x, 2) + Math.pow(y - PLAYER_START.y, 2));
                        const distFromGate = Math.sqrt(Math.pow(x - GATE_POS.x, 2) + Math.pow(y - GATE_POS.y, 2));
                        
                        if (distFromPlayer >= MIN_DISTANCE && distFromGate >= MIN_DISTANCE) {
                            validPosition = true;
                        }
                        attempts++;
                    }
                    return { x, y };
                };
                
                const pos = generatePosition();
                
                const book = scene.add.sprite(pos.x, pos.y, 'book');
                book.setScale(1.0);
                book.setOrigin(0.5, 0.5);
                book.setDepth(1);
                
                // Create white glow behind the book, offset slightly for proper alignment
                const glow = scene.add.circle(book.x - 3, book.y - 3, 35, 0xffffff, 0.3);
                glow.setDepth(0);
                
                book.setData('id', correctAnswersCount);
                book.setData('glow', glow); // Store glow reference
                book.setVisible(true);
                scene.physics.add.existing(book, true);
                
                // Add collision detection for the new book
                const player = scene.children.list.find(child => child.anims && child.anims.currentAnim);
                if (player) {
                    scene.physics.add.overlap(player, book, (p, v) => {
                        if (v.body.enable === false) return;
                        
                        // Play book collection sound
                        const bookSound = scene.sound.get('bookCollect');
                        if (bookSound) {
                            bookSound.play();
                        }
                        
                        v.body.enable = false;
                        v.setVisible(false);
                        const glow = v.getData('glow');
                        if (glow) {
                            glow.setVisible(false);
                        }
                        if (onCollectVeda) onCollectVeda(v.getData('id'));
                    }, null, scene);
                }
            }
        }
    }, [correctAnswersCount, totalBooksRequired, onCollectVeda]);

    // Handle disabling keyboard input and pausing physics when quiz is active
    useEffect(() => {
        if (gameRef.current && gameRef.current.scene && gameRef.current.scene.scenes[0]) {
            const scene = gameRef.current.scene.scenes[0];
            
            if (isQuizActive) {
                // Find the player and set to idle
                const player = scene.children.list.find(child => child.anims && child.anims.currentAnim);
                if (player) {
                    player.body.setVelocity(0);
                    player.anims.play('idle', true);
                }
                
                // Stop walking sound immediately
                if (walkingSoundRef.current && walkingSoundRef.current.isPlaying) {
                    walkingSoundRef.current.stop();
                }
                
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