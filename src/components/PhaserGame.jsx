import React, { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import levelData from '../data/levelData'

// This component now only handles Physics and Inputs. 
// It sends signals (props) up to App.jsx when things happen.
export default function PhaserGame({ currentLevel, onCollectVeda, onReachGate, isQuizActive, restartKey, answeredBooksCount, vedaPositions, totalVedas }) {
    const containerRef = useRef(null)
    const gameRef = useRef(null)

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
        let totalVedas
        let score = 0 // Internal score to know when to open gate
        let vedaRects = [] // Store references to reveal them sequentially

        const config = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: containerRef.current,
            backgroundColor: levelData[currentLevel]?.backgroundColor || '#000',
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
            score = 0;

            // Safety Check: If level data is missing, stop here to prevent crash
            const level = levelData[currentLevel - 1]; // levelData is 0-indexed array
            if (!level) {
                console.error("Level data missing for level:", currentLevel);
                return;
            }
            
            // Use passed totalVedas instead of level.totalVedas
            // This allows for dynamic penalty books
            const requiredVedas = totalVedas || level.totalVedas;

            // --- PLAYER ---
            player = scene.add.sprite(100, 100, 'walking')
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
            
            // Use passed vedaPositions instead of level.vedas
            const positions = vedaPositions || level.vedas;
            positions.forEach((vedaPos, index) => {
                const book = scene.add.sprite(vedaPos.x, vedaPos.y, 'book')
                book.setScale(1.0);
                // We store the ID so we can tell React exactly which veda was taken
                book.setData('id', index);
                // Only show the current book (based on how many have been answered)
                book.setVisible(index === 0); // Start with first book visible
                vedasGroup.add(scene.physics.add.existing(book, true));
                vedaRects.push(book);
            })

            // --- GATE ---
            const gate = scene.add.rectangle(750, 275, 20, 50, 0xff0000)
            scene.physics.add.existing(gate, true)

            // --- CONTROLS ---
            keys = scene.input.keyboard.addKeys('W,A,S,D')
            cursors = scene.input.keyboard.createCursorKeys()

            // --- COLLISIONS ---
            // 1. Collect Veda
            scene.physics.add.overlap(player, vedasGroup, (p, v) => {
                // Disable and hide the book
                v.body.enable = false; // 1. Turn off physics so you can't hit it again
                v.setVisible(false);   // 2. Make it invisible

                score++;
                
                // Signal React: "User collected a veda!" with the book index
                if(onCollectVeda) onCollectVeda(v.getData('id'));
            }, null, scene)

            // 2. Hit Gate
            scene.physics.add.collider(player, gate, () => {
                if (score >= requiredVedas) {
                    scene.physics.pause(); // Stop the game
                    // Signal React: "User finished level!"
                    if(onReachGate) onReachGate();
                }
            }, null, scene)
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
        }

        gameRef.current = new Phaser.Game(config)

        return () => {
            if (gameRef.current) {
                gameRef.current.destroy(true)
                gameRef.current = null
            }
        }
    }, [currentLevel, restartKey]) // Restart game when currentLevel or restartKey changes

    // Update book visibility when answeredBooksCount changes
    useEffect(() => {
        if (gameRef.current && gameRef.current.scene && gameRef.current.scene.scenes[0]) {
            const scene = gameRef.current.scene.scenes[0];
            // Get all book sprites and show only the next one to collect
            const books = scene.children.list.filter(child => child.texture && child.texture.key === 'book');
            books.forEach((book, index) => {
                if (index === answeredBooksCount && book.body && book.body.enable !== false) {
                    book.setVisible(true);
                }
            });
        }
    }, [answeredBooksCount]);

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