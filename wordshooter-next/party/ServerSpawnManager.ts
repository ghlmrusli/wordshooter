// ── Server-side spawning logic for multiplayer ──
// Stripped-down port of src/engine/SpawnManager.ts without any client-side deps.

import type { ServerInvader } from './types';

let _nextId = 0;
function genId(): string {
  return `mp_${++_nextId}_${Date.now()}`;
}

// ── Word lists (copy from SpawnManager) ──
const WORD_LIST = [
  // Animals
  'dog', 'cat', 'lion', 'tiger', 'bear', 'wolf', 'fox', 'deer',
  'rabbit', 'mouse', 'rat', 'snake', 'frog', 'fish', 'bird', 'eagle',
  'hawk', 'owl', 'crow', 'duck', 'goose', 'swan', 'horse', 'cow',
  'pig', 'sheep', 'goat', 'chicken', 'turkey', 'elephant', 'rhino', 'hippo',
  // Plants
  'rose', 'tulip', 'daisy', 'lily', 'orchid', 'violet', 'jasmine', 'sunflower',
  'oak', 'pine', 'maple', 'birch', 'willow', 'palm', 'bamboo', 'cactus',
  'fern', 'moss', 'ivy', 'grass', 'wheat', 'rice', 'corn', 'tomato',
  'potato', 'carrot', 'lettuce', 'spinach', 'basil', 'mint', 'sage', 'thyme',
  // Science
  'atom', 'cell', 'gene', 'solar', 'lunar', 'planet', 'orbit', 'energy',
  'force', 'gravity', 'matter', 'quantum', 'carbon', 'oxygen', 'nitrogen', 'hydrogen',
  'electron', 'proton', 'neutron', 'molecule', 'protein', 'enzyme', 'virus', 'bacteria',
  'plasma', 'crystal', 'magma', 'lava', 'fossil', 'mineral', 'climate', 'ocean',
  // Gen Z
  'slay', 'vibe', 'fire', 'lit', 'cap', 'bet', 'flex', 'goat',
  'yeet', 'mood', 'fam', 'bruh', 'bussin', 'drip', 'sus', 'valid',
  'cringe', 'toxic', 'savage', 'extra', 'basic', 'salty', 'vibes',
  'squad', 'goals', 'icon', 'legend', 'queen', 'king', 'epic', 'dope',
  // General
  'house', 'tree', 'water', 'fire', 'earth', 'wind', 'stone', 'metal',
  'wood', 'glass', 'paper', 'book', 'pen', 'desk', 'chair', 'table',
  'door', 'window', 'wall', 'floor', 'roof', 'garden', 'park', 'road',
  'bridge', 'river', 'lake', 'ocean', 'mountain', 'valley', 'forest', 'field',
  'cloud', 'rain', 'snow', 'sun', 'moon', 'star', 'night', 'day',
  'morning', 'evening', 'spring', 'summer', 'autumn', 'winter', 'season', 'year',
];

// Reference viewport width — clients scale x positions proportionally
export const REF_WIDTH = 1024;

/**
 * Generate a word invader for multiplayer.
 * @param usedWords words currently alive on the field (avoid duplicates)
 */
export function generateWordInvader(usedWords: string[], baseSpeed = 0.3): ServerInvader {
  let available = WORD_LIST.filter((w) => !usedWords.includes(w));
  if (available.length === 0) available = [...WORD_LIST];

  const word = available[Math.floor(Math.random() * available.length)];
  const estimatedWidth = word.length * 15 + 40;
  const x = Math.random() * Math.max(100, REF_WIDTH - estimatedWidth);
  const speed = baseSpeed * (0.8 + Math.random() * 0.4);
  const horizontalDrift = (Math.random() - 0.5) * 0.3;

  return {
    id: genId(),
    word,
    displayWord: word,
    answer: word,
    x,
    speed,
    horizontalDrift,
    invaderType: 'word',
    emoji: '👾',
    spawnTime: Date.now(),
  };
}

/**
 * Generate a math invader for multiplayer.
 */
export function generateMathInvader(baseSpeed = 0.35): ServerInvader {
  const ops = ['+', '-', '*'] as const;
  const op = ops[Math.floor(Math.random() * ops.length)];

  let num1: number, num2: number, answer: number, display: string;

  switch (op) {
    case '+':
      num1 = Math.floor(Math.random() * 50) + 1;
      num2 = Math.floor(Math.random() * 50) + 1;
      answer = num1 + num2;
      display = `${num1}+${num2}`;
      break;
    case '-':
      num1 = Math.floor(Math.random() * 50) + 20;
      num2 = Math.floor(Math.random() * (num1 - 1)) + 1;
      answer = num1 - num2;
      display = `${num1}-${num2}`;
      break;
    case '*':
      num1 = Math.floor(Math.random() * 12) + 1;
      num2 = Math.floor(Math.random() * 12) + 1;
      answer = num1 * num2;
      display = `${num1}x${num2}`;
      break;
  }

  const estimatedWidth = display!.length * 15 + 40;
  const x = Math.max(0, REF_WIDTH / 2 - estimatedWidth / 2);
  const speed = baseSpeed * (0.8 + Math.random() * 0.4);
  const horizontalDrift = (Math.random() - 0.5) * 0.3;

  return {
    id: genId(),
    word: answer!.toString(),
    displayWord: display!,
    answer: answer!.toString(),
    x,
    speed,
    horizontalDrift,
    invaderType: 'math',
    emoji: '👽',
    spawnTime: Date.now(),
  };
}
