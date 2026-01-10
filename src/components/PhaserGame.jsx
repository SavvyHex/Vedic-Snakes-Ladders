import React, { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import levelData from '../data/levelData'

// This component now only handles Physics and Inputs. 
// It sends signals (props) up to App.jsx when things happen.
export default function PhaserGame({ currentLevel, onCollectVeda, onReachGate, isQuizActive, restartKey }) {
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
        }

        function create() {
            const scene = this; 
            score = 0;

            // Safety Check: If level data is missing, stop here to prevent crash
            const level = levelData[currentLevel];
            if (!level) {
                console.error("Level data missing for index:", currentLevel);
                return;
            }
            
            totalVedas = level.totalVedas

            // --- PLAYER ---
            player = scene.add.sprite(100, 100, 'walking')
            player.setScale(0.5) // Adjust scale if needed
            scene.physics.add.existing(player)
            player.body.setCollideWorldBounds(true)

            // Create walking animation
            scene.anims.create({
                key: 'walk',
                frames: scene.anims.generateFrameNumbers('walking', { start: 0, end: 3 }),
                frameRate: 10,
                repeat: -1 // Loop indefinitely
            });

            // --- VEDAS ---
            vedasGroup = scene.physics.add.staticGroup();
            vedaRects = []; // Reset array for new level
            
            level.vedas.forEach((vedaPos, index) => {
                const rect = scene.add.rectangle(vedaPos.x, vedaPos.y, 20, 20, 0xffff00)
                // We store the ID so we can tell React exactly which veda was taken
                rect.setData('id', index);
                // Initially hide all vedas except the first one
                if (index === 0) {
                    rect.setVisible(true);
                } else {
                    rect.setVisible(false);
                }
                vedasGroup.add(scene.physics.add.existing(rect, true));
                vedaRects.push(rect);
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
                // --- THIS IS THE FIX ---
                // Old crashy code was: v.disableBody(true, true);
                
                // New working code:
                v.body.enable = false; // 1. Turn off physics so you can't hit it again
                v.setVisible(false);   // 2. Make it invisible
                // -----------------------

                score++;
                
                // Reveal the next veda (if there is one)
                if (score < vedaRects.length) {
                    vedaRects[score].setVisible(true);
                }
                
                // Signal React: "User collected a veda!"
                if(onCollectVeda) onCollectVeda(v.getData('id'));
            }, null, scene)

            // 2. Hit Gate
            scene.physics.add.collider(player, gate, () => {
                if (score >= totalVedas) {
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
                isMoving = true;
            }
            else if (keys.D.isDown || (cursors && cursors.right.isDown)) {
                player.body.setVelocityX(200)
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
                player.anims.stop();
                player.setFrame(0); // Reset to first frame when idle
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

    // Handle disabling keyboard input when quiz is active
    useEffect(() => {
        if (gameRef.current && gameRef.current.input && gameRef.current.input.keyboard) {
            if (isQuizActive) {
                gameRef.current.input.keyboard.enabled = false;
            } else {
                gameRef.current.input.keyboard.enabled = true;
            }
        }
    }, [isQuizActive])

    return <div ref={containerRef} style={{ width: '800px', height: '600px' }} />
}