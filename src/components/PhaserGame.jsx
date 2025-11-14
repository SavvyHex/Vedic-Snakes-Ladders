import React, { useEffect, useRef } from 'react'
import Phaser from 'phaser'
import levelData from '../data/levelData'

export default function PhaserGame() {
  const containerRef = useRef(null)
  const gameRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return

    // ---GLOBAL-LIKE VARIABLES INSIDE SCENE---
    let player
    let keys
    let vedas
    let scoreText
    let score = 0
    let gate
    let currentLevelIndex = 0
    let totalVedas

    const config = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: containerRef.current,
      backgroundColor: levelData[0].backgroundColor,
      physics: {
        default: 'arcade',
        arcade: { debug: false }
      },
      scene: {
        preload: function () {},
        create: create,
        update: update
      }
    }

    function create() {
      score = 0

      const level = levelData[currentLevelIndex]
      totalVedas = level.totalVedas

      player = this.add.rectangle(100, 100, 30, 30, 0x00ff00)
      this.physics.add.existing(player)
      player.body.setCollideWorldBounds(true)

      // create vedas as simple rectangles and add static physics bodies
      vedas = []
      level.vedas.forEach(vedaPos => {
        const rect = this.add.rectangle(vedaPos.x, vedaPos.y, 20, 20, 0xffff00)
        this.physics.add.existing(rect, true) // true -> static body
        vedas.push(rect)
      })

      scoreText = this.add.text(10, 10, 'Vedas Collected: 0', {
        font: '24px Arial',
        fill: '#FFFFFF'
      })

      gate = this.add.rectangle(750, 275, 20, 50, 0xff0000)
      this.physics.add.existing(gate, true)

      keys = this.input.keyboard.addKeys('W,A,S,D')

  // register overlap with an array of GameObjects
  this.physics.add.overlap(player, vedas, collectVeda, null, this)
      this.physics.add.overlap(player, gate, touchGate, null, this)

      this.cameras.main.setBackgroundColor(level.backgroundColor)
    }

    function update() {
      if (!player || !player.body) return
      player.body.setVelocity(0)
      if (keys.A.isDown) {
        player.body.setVelocityX(-200)
      } else if (keys.D.isDown) {
        player.body.setVelocityX(200)
      }
      if (keys.W.isDown) {
        player.body.setVelocityY(-200)
      } else if (keys.S.isDown) {
        player.body.setVelocityY(200)
      }
    }

      function collectVeda(playerObj, veda) {
        // veda is a GameObject with a static body; hide and disable its body
        if (veda.body) {
          veda.body.enable = false
        }
        veda.setVisible(false)

        score++
        scoreText.setText('Vedas Collected: ' + score)

        if (score === totalVedas) {
          gate.setFillStyle(0x00ff00)
        }
      }

    function touchGate(playerObj, gateObj) {
      const level = levelData[currentLevelIndex]
      if (score !== level.totalVedas) return

      this.physics.pause()
      player.body.setVelocity(0)

      const answer = window.prompt(level.quiz.question)
      if (answer && answer.toLowerCase().trim() === level.quiz.answer) {
        window.alert('Correct! You have understood this realm.')
        currentLevelIndex++
        if (currentLevelIndex >= levelData.length) {
          this.add
            .text(400, 300, 'YOU HAVE REACHED LIBERATION!', {
              font: '36px Arial',
              fill: '#FFFF00'
            })
            .setOrigin(0.5)
          return
        }
        this.scene.restart()
      } else {
        window.alert("Incorrect. You must learn this realm's lesson again.")
        this.scene.restart()
      }
    }

    gameRef.current = new Phaser.Game(config)

    return () => {
      if (gameRef.current) {
        try {
          gameRef.current.destroy(true)
        } catch (e) {
          // ignore
        }
        gameRef.current = null
      }
    }
  }, [])

  return (
    <div className="phaser-container">
      <div ref={containerRef} />
    </div>
  )
}
