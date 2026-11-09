import { HARDWARE_ITEMS } from './data/hardware-items.js';

export class Player {
  constructor(canvasWidth, canvasHeight, texture) {
    this.w = 54;
    this.h = 86;
    this.x = canvasWidth / 2;
    this.y = canvasHeight - 110; // Changed from 60 to 110 to move the ship up
    this.speed = 450; 
    this.texture = texture;
    this.bounds = { width: canvasWidth, height: canvasHeight };
  }

  update(deltaTime, input) {
    if (input.useMouse && input.mouseX !== null) {
      // Smoothly move towards the mouse X position
      const diff = input.mouseX - this.x;
      const maxMove = this.speed * deltaTime;
      
      if (Math.abs(diff) <= maxMove) {
        this.x = input.mouseX; // Snap to cursor if close enough
      } else {
        this.x += Math.sign(diff) * maxMove; // Glide towards cursor
      }
    } else {
      // Fallback to keyboard
      if (input.keys.left) this.x -= this.speed * deltaTime;
      if (input.keys.right) this.x += this.speed * deltaTime;
    }

    // Keep player within screen bounds
    const halfWidth = this.w / 2;
    this.x = Math.max(halfWidth, Math.min(this.bounds.width - halfWidth, this.x));
  }

  draw(renderer) {
    renderer.drawSprite(this.texture, this.x, this.y, this.w, this.h);
  }
}

export class Bullet {
  constructor(x, y, texture = null) {
    this.x = x;
    this.y = y;
    this.w = 8;
    this.h = 18;
    this.speed = 700;
    this.texture = texture;
    this.markedForDeletion = false;
  }

  update(deltaTime) {
    this.y -= this.speed * deltaTime;
    if (this.y < -20) this.markedForDeletion = true;
  }

  draw(renderer) {
    // Draw a bright magenta laser
    renderer.drawSprite(this.texture, this.x, this.y, this.w, this.h, 0, [1, 0.2, 1, 1]);
  }
}

export class TargetItem {
  constructor(canvasWidth, itemData, renderer) {
    this.itemData = itemData;
    this.w = 48;
    this.h = 48;
    this.x = Math.random() * (canvasWidth - this.w) + this.w / 2;
    this.y = -30;
    this.speed = 100 + Math.random() * 60;
    this.texture = renderer.loadTexture(itemData.image);
    this.markedForDeletion = false;
    
    // Parse hex color for the glowing halo
    const hex = itemData.color.replace('#', '');
    this.r = parseInt(hex.substring(0, 2), 16) / 255;
    this.g = parseInt(hex.substring(2, 4), 16) / 255;
    this.b = parseInt(hex.substring(4, 6), 16) / 255;
  }

  update(deltaTime, canvasHeight) {
    this.y += this.speed * deltaTime;
    if (this.y > canvasHeight + 40) this.markedForDeletion = true;
  }

  draw(renderer) {
    // Draw a pulsing colored halo behind the item
    const haloSize = this.w + 12 + Math.sin(performance.now() * 0.005) * 6;
    renderer.drawSprite(null, this.x, this.y, haloSize, haloSize, 0, [this.r, this.g, this.b, 0.35]);
    
    // Draw the item on top
    renderer.drawSprite(this.texture, this.x, this.y, this.w, this.h);
  }
}