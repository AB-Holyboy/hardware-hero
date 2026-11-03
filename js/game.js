import { HARDWARE_ITEMS } from './data/hardware-items.js';
import { WebGLRenderer } from './webgl-renderer.js';
import { InputHandler } from './input.js';
import { AudioManager } from './audio.js';
import { rectCollide } from './collision.js';
import { Player, Bullet, TargetItem } from './entities.js';

class Game {
  constructor() {
    // 1. Initialize Canvas & Renderer FIRST
    this.canvas = document.getElementById('gameCanvas');
    this.renderer = new WebGLRenderer(this.canvas);
    
    // 2. Initialize Input SECOND (so it can receive the canvas)
    this.input = new InputHandler(this.canvas);
    this.audio = new AudioManager();

    // 3. UI Elements
    this.hud = document.getElementById('hud');                               // NEW
    this.descriptionBox = document.getElementById('descriptionBox');         // NEW
    this.scoreDisplay = document.getElementById('scoreDisplay');
    this.targetNameLabel = document.getElementById('targetName');
    this.targetCategoryLabel = document.getElementById('targetCategory');
    this.targetDescriptionLabel = document.getElementById('targetDescription');
    this.livesDisplay = document.getElementById('livesDisplay');
    this.feedbackDisplay = document.getElementById('feedback');
    
    this.menuScreen = document.getElementById('menu');
    this.pauseScreen = document.getElementById('pause');
    this.gameOverScreen = document.getElementById('gameover');
    
    this.finalScoreLabel = document.getElementById('finalScore');
    this.bestScoreLabel = document.getElementById('bestScore');
    this.startBtn = document.getElementById('startBtn');
    this.restartBtn = document.getElementById('restartBtn');

    // 4. Game State Variables
    this.state = 'MENU'; // 'MENU', 'PLAYING', 'PAUSED', 'GAMEOVER'
    this.score = 0;
    this.lives = 3;
    this.best = parseInt(localStorage.getItem('hardwareHero.best') || '0', 10) || 0;
    
    this.currentTarget = null;
    this.correctStreak = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 2.0; 
    this.lastTime = 0;
    this._feedbackTimer = null;

    // 5. Entities
    this.player = null;
    this.bullets = [];
    this.targets = [];

    this.playerTexture = this.renderer.loadTexture('assets/sprites/player.png');

    this.initEventListeners();
  }

  initEventListeners() {
    this.startBtn.addEventListener('click', () => this.startGame());
    this.restartBtn.addEventListener('click', () => this.startGame());

    // Global hotkeys for Pause and Mute
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyP' || e.code === 'Escape') this.togglePause();
      if (e.code === 'KeyM') this.audio.toggleMute();
    });

    // Auto-pause when the user clicks away to another tab
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'PLAYING') this.togglePause();
    });
  }

  startGame() {
    this.audio.init();
    this.input.reset();
    
    this.score = 0;
    this.lives = 3;
    this.spawnInterval = 2.0;
    this.correctStreak = 0;
    this.bullets = [];
    this.targets = [];
    this.spawnTimer = 0;

    this.player = new Player(this.canvas.width, this.canvas.height, this.playerTexture);
    this.selectNextTarget();

    // UI Management
    this.menuScreen.classList.add('hidden');
    this.gameOverScreen.classList.add('hidden');
    this.pauseScreen.classList.add('hidden');
    
    // Show Game UI
    this.hud.style.opacity = '1'; 
    this.descriptionBox.style.opacity = '1'; 
    this.updateHUD();

    this.state = 'PLAYING';
    this.lastTime = performance.now();
    this.audio.startMusic();
    
    requestAnimationFrame((time) => this.gameLoop(time));
  }

  selectNextTarget() {
    let next;
    // Prevent selecting the exact same item twice in a row
    do {
      next = HARDWARE_ITEMS[Math.floor(Math.random() * HARDWARE_ITEMS.length)];
    } while (HARDWARE_ITEMS.length > 1 && this.currentTarget && next.id === this.currentTarget.id);

    this.currentTarget = next;
    
    // Update the HUD with the new target data
    this.targetNameLabel.textContent = this.currentTarget.name;
    this.targetCategoryLabel.textContent = `(${this.currentTarget.category})`;
    this.targetDescriptionLabel.textContent = this.currentTarget.description;
  }

  spawnTarget() {
    let selectedItem;
    // 40% chance to spawn the correct target, 60% chance for a distractor
    if (Math.random() < 0.4) {
      selectedItem = this.currentTarget;
    } else {
      const randomIndex = Math.floor(Math.random() * HARDWARE_ITEMS.length);
      selectedItem = HARDWARE_ITEMS[randomIndex];
    }
    this.targets.push(new TargetItem(this.canvas.width, selectedItem, this.renderer));
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.pauseScreen.classList.remove('hidden');
      this.audio.stopMusic();
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.pauseScreen.classList.add('hidden');
      this.audio.startMusic();
      this.lastTime = performance.now(); // Prevent massive delta jump
    }
  }

  update(deltaTime) {
    if (this.state !== 'PLAYING') return;

    this.player.update(deltaTime, this.input);

    // Firing logic
    if (this.input.isShootJustPressed()) {
      this.bullets.push(new Bullet(this.player.x, this.player.y - this.player.h / 2));
      this.audio.playLaser();
    }

    // Update entities
    this.bullets.forEach((bullet) => bullet.update(deltaTime));
    this.targets.forEach((target) => target.update(deltaTime, this.canvas.height));

    // Spawning logic
    this.spawnTimer += deltaTime;
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTarget();
      this.spawnTimer = 0;
    }

    // Collision: Bullets vs Targets
    for (const bullet of this.bullets) {
      for (const target of this.targets) {
        if (!bullet.markedForDeletion && !target.markedForDeletion && rectCollide(bullet, target)) {
          bullet.markedForDeletion = true;
          target.markedForDeletion = true;
          this.handleHit(target.itemData);
        }
      }
    }

    // Collision: Player vs Targets
    for (const target of this.targets) {
      if (!target.markedForDeletion && rectCollide(this.player, target)) {
        target.markedForDeletion = true;
        this.handleHit(target.itemData);
      }
    }

    // Cleanup
    this.bullets = this.bullets.filter((b) => !b.markedForDeletion);
    this.targets = this.targets.filter((t) => !t.markedForDeletion);
  }

  handleHit(itemData) {
    if (itemData.id === this.currentTarget.id) {
      // Correct hit
      this.score += 100;
      this.correctStreak++;
      this.audio.playCorrect();
      this.showFeedback('✅ Correct! +100', 'correct');
      
      // Difficulty Ramp: Every 5 correct hits, speed up the spawn rate
      if (this.correctStreak % 5 === 0) {
        this.spawnInterval = Math.max(0.7, this.spawnInterval * 0.9);
        setTimeout(() => this.showFeedback('⚡ Speed up!', 'correct'), 1300);
      }
      
      this.selectNextTarget();
    } else {
      // Wrong hit
      this.lives -= 1;
      this.correctStreak = 0;
      this.audio.playWrong();
      this.showFeedback(`❌ Wrong! That was ${itemData.name}`, 'wrong');
      
      if (this.lives <= 0) this.gameOver();
    }
    this.updateHUD();
  }

  showFeedback(text, type) {
    clearTimeout(this._feedbackTimer); // Prevents overlapping timers from hiding text early
    this.feedbackDisplay.textContent = text;
    this.feedbackDisplay.className = type;
    this.feedbackDisplay.style.opacity = '1';

    this._feedbackTimer = setTimeout(() => {
      this.feedbackDisplay.style.opacity = '0';
    }, 1200);
  }

  updateHUD() {
    this.scoreDisplay.textContent = `🏆 ${this.score}`;
    this.livesDisplay.textContent = '❤️ '.repeat(Math.max(0, this.lives));
  }

  gameOver() {
    this.state = 'GAMEOVER';
    this.audio.stopMusic();
    
    // Hide Game UI
    this.hud.style.opacity = '0';
    this.descriptionBox.style.opacity = '0'; 
    
    // High score logic
    if (this.score > this.best) {
      this.best = this.score;
      try { localStorage.setItem('hardwareHero.best', String(this.best)); } catch (e) {}
    }

    this.finalScoreLabel.textContent = this.score;
    this.bestScoreLabel.textContent = this.best;
    this.gameOverScreen.classList.remove('hidden');
  }

  render() {
    this.renderer.clear();
    
    // Draw even when paused so the screen doesn't go black
    if (!this.player) return; 
    
    this.player.draw(this.renderer);
    this.bullets.forEach((bullet) => bullet.draw(this.renderer));
    this.targets.forEach((target) => target.draw(this.renderer));
  }

  gameLoop(currentTime) {
    // Cap delta time to avoid massive jumps if tab is inactive
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;
    
    this.update(deltaTime);
    this.render();

    // Keep the RAF loop alive during PLAYING and PAUSED states
    if (this.state === 'PLAYING' || this.state === 'PAUSED') {
      requestAnimationFrame((time) => this.gameLoop(time));
    }
  }
}

// Initialize game on window load
window.addEventListener('load', () => {
  new Game();
});