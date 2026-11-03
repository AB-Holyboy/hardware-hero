// js/data/hardware-items.js

export const HARDWARE_ITEMS = [
  // --- INPUT DEVICES ---
  {
    id: 'mouse',
    name: 'Mouse',
    category: 'Input',
    image: 'assets/sprites/mouse.png',
    description: 'A handheld pointing device that detects 2D motion to control a cursor.',
    color: '#ff6b6b'
  },
  {
    id: 'keyboard',
    name: 'Keyboard',
    category: 'Input',
    image: 'assets/sprites/keyboard.png',
    description: 'An alphanumeric input device using keys to enter text and commands.',
    color: '#ffa94d'
  },
  {
    id: 'webcam',
    name: 'Webcam',
    category: 'Input',
    image: 'assets/sprites/webcam.png',
    description: 'A digital video camera that captures real-time moving images.',
    color: '#ffd93d'
  },
  {
    id: 'microphone',
    name: 'Microphone',
    category: 'Input',
    image: 'assets/sprites/microphone.png',
    description: 'Converts sound waves into electrical signals for recording.',
    color: '#e74c3c'
  },

  // --- PROCESSING ---
  {
    id: 'cpu',
    name: 'CPU',
    category: 'Processing',
    image: 'assets/sprites/cpu.png',
    description: 'The Central Processing Unit (the "brain") that executes instructions.',
    color: '#6bcb77'
  },
  {
    id: 'gpu',
    name: 'GPU',
    category: 'Processing',
    image: 'assets/sprites/gpu.png',
    description: 'Graphics Processing Unit designed for fast parallel processing and 3D rendering.',
    color: '#4d96ff'
  },
  {
    id: 'motherboard',
    name: 'Motherboard',
    category: 'Processing',
    image: 'assets/sprites/motherboard.png',
    description: 'The main printed circuit board that connects all components together.',
    color: '#2ecc71'
  },

  // --- NETWORKING ---
  {
    id: 'router',
    name: 'Router',
    category: 'Networking',
    image: 'assets/sprites/router.png',
    description: 'Forwards data packets between networks, routing internet traffic.',
    color: '#9b59b6'
  },

  // --- STORAGE ---
  {
    id: 'ssd',
    name: 'SSD',
    category: 'Storage',
    image: 'assets/sprites/ssd.png',
    description: 'Solid-State Drive using flash memory for fast, persistent data storage.',
    color: '#1abc9c'
  },
  {
    id: 'usb',
    name: 'USB Drive',
    category: 'Storage',
    image: 'assets/sprites/usb.png',
    description: 'A portable flash memory device used for data transfer and backup.',
    color: '#f1c40f'
  },

  // --- OUTPUT DEVICES ---
  {
    id: 'monitor',
    name: 'Monitor',
    category: 'Output',
    image: 'assets/sprites/monitor.png',
    description: 'The primary display output device presenting visual feedback.',
    color: '#3498db'
  },
  {
    id: 'printer',
    name: 'Printer',
    category: 'Output',
    image: 'assets/sprites/printer.png',
    description: 'Transfers digital text and images onto physical paper.',
    color: '#e67e22'
  },
  {
    id: 'speaker',
    name: 'Speaker',
    category: 'Output',
    image: 'assets/sprites/speaker.png',
    description: 'Converts electrical audio signals into sound waves.',
    color: '#e84393'
  }
];