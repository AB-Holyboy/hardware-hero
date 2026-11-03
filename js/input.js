export class InputHandler {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = {
      left: false,
      right: false,
      shoot: false
    };

    this.shootPressedHandled = false;

    // Pointer state (works for mouse AND touchpad)
    this.mouseX = null;
    this.useMouse = false;

    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    
    if (this.canvas) {
      // Use PointerEvents instead of MouseEvents for better touchpad support
      this.canvas.addEventListener('pointermove', (e) => this.handleMouseMove(e));
      this.canvas.addEventListener('pointerdown', (e) => this.handleMouseDown(e));
      window.addEventListener('pointerup', (e) => this.handleMouseUp(e));
    }
  }

  handleKeyDown(event) {
    // If keyboard is used, switch back to keyboard mode
    if (['ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD'].includes(event.code)) {
      this.useMouse = false;
    }

    switch (event.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.keys.left = true;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.keys.right = true;
        break;
      case 'Space':
        event.preventDefault();
        this.keys.shoot = true;
        break;
    }
  }

  handleKeyUp(event) {
    switch (event.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.keys.left = false;
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.keys.right = false;
        break;
      case 'Space':
        this.keys.shoot = false;
        this.shootPressedHandled = false;
        break;
    }
  }

  handleMouseMove(event) {
    this.useMouse = true;
    
    // Scale physical cursor position to internal 800x600 resolution
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    this.mouseX = (event.clientX - rect.left) * scaleX;
  }

  handleMouseDown(event) {
    // Left click / tap only
    if (event.button === 0) {
      this.keys.shoot = true;
    }
  }

  handleMouseUp(event) {
    if (event.button === 0) {
      this.keys.shoot = false;
      this.shootPressedHandled = false;
    }
  }

  isShootJustPressed() {
    if (this.keys.shoot && !this.shootPressedHandled) {
      this.shootPressedHandled = true;
      return true;
    }
    return false;
  }

  reset() {
    this.keys.left = false;
    this.keys.right = false;
    this.keys.shoot = false;
    this.shootPressedHandled = false;
    this.mouseX = null;
    this.useMouse = false;
  }
}