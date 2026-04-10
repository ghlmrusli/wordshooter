// ── SpawnManager ──
// Port of all spawning logic from the original index.html:
//   spawnInvader(), spawnMathInvader(), spawnSentence() (~lines 3370-3750),
//   and the Invader constructor (~lines 3297-3375).
// Creates InvaderData objects (pure data) rather than DOM elements.

import useGameStore from '@/store/gameStore';
import { InvaderData, MathQuestion } from '@/types/game';
import { getEffectiveMode } from './DifficultyManager';
import { countActiveInvaders } from './CollisionDetector';

let _nextInvaderId = 0;

function generateId(): string {
  return `inv_${++_nextInvaderId}_${Date.now()}`;
}

// ── Letters for letter mode ──
const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

// ── Word categories (exact copy from original) ──
export const wordCategories: Record<string, string[]> = {
  all: [
    // Common animals
    'dog', 'cat', 'lion', 'tiger', 'bear', 'wolf', 'fox', 'deer',
    'rabbit', 'mouse', 'rat', 'snake', 'frog', 'fish', 'bird', 'eagle',
    'hawk', 'owl', 'crow', 'duck', 'goose', 'swan', 'horse', 'cow',
    'pig', 'sheep', 'goat', 'chicken', 'turkey', 'elephant', 'rhino', 'hippo',
    // Common plants
    'rose', 'tulip', 'daisy', 'lily', 'orchid', 'violet', 'jasmine', 'sunflower',
    'oak', 'pine', 'maple', 'birch', 'willow', 'palm', 'bamboo', 'cactus',
    'fern', 'moss', 'ivy', 'grass', 'wheat', 'rice', 'corn', 'tomato',
    'potato', 'carrot', 'lettuce', 'spinach', 'basil', 'mint', 'sage', 'thyme',
    // Common science words
    'atom', 'cell', 'gene', 'solar', 'lunar', 'planet', 'orbit', 'energy',
    'force', 'gravity', 'matter', 'quantum', 'carbon', 'oxygen', 'nitrogen', 'hydrogen',
    'electron', 'proton', 'neutron', 'molecule', 'protein', 'enzyme', 'virus', 'bacteria',
    'plasma', 'crystal', 'magma', 'lava', 'fossil', 'mineral', 'climate', 'ocean',
    // Common Gen Z words
    'slay', 'vibe', 'fire', 'lit', 'cap', 'bet', 'flex', 'goat',
    'yeet', 'mood', 'fam', 'bruh', 'bussin', 'drip', 'sus', 'valid',
    'cringe', 'toxic', 'savage', 'extra', 'basic', 'salty', 'vibes', 'energy',
    'squad', 'goals', 'icon', 'legend', 'queen', 'king', 'epic', 'dope',
    // General words
    'house', 'tree', 'water', 'fire', 'earth', 'wind', 'stone', 'metal',
    'wood', 'glass', 'paper', 'book', 'pen', 'desk', 'chair', 'table',
    'door', 'window', 'wall', 'floor', 'roof', 'garden', 'park', 'road',
    'bridge', 'river', 'lake', 'ocean', 'mountain', 'valley', 'forest', 'field',
    'cloud', 'rain', 'snow', 'sun', 'moon', 'star', 'night', 'day',
    'morning', 'evening', 'spring', 'summer', 'autumn', 'winter', 'season', 'year',
  ],
  animals: [
    'dog', 'cat', 'lion', 'tiger', 'bear', 'wolf', 'fox', 'deer',
    'rabbit', 'mouse', 'rat', 'hamster', 'guinea', 'squirrel', 'beaver', 'otter',
    'snake', 'lizard', 'turtle', 'frog', 'toad', 'newt', 'salamander', 'gecko',
    'fish', 'shark', 'whale', 'dolphin', 'seal', 'walrus', 'octopus', 'squid',
    'bird', 'eagle', 'hawk', 'falcon', 'owl', 'crow', 'raven', 'parrot',
    'duck', 'goose', 'swan', 'penguin', 'ostrich', 'emu', 'peacock', 'heron',
    'horse', 'donkey', 'zebra', 'cow', 'bull', 'buffalo', 'bison', 'ox',
    'pig', 'boar', 'sheep', 'ram', 'goat', 'llama', 'alpaca', 'camel',
    'chicken', 'rooster', 'turkey', 'pheasant', 'quail', 'pigeon', 'dove', 'sparrow',
    'elephant', 'rhino', 'hippo', 'giraffe', 'zebra', 'antelope', 'gazelle', 'impala',
    'monkey', 'ape', 'gorilla', 'chimp', 'lemur', 'baboon', 'gibbon', 'orangutan',
    'kangaroo', 'koala', 'wombat', 'wallaby', 'platypus', 'echidna', 'possum', 'bandicoot',
    'bee', 'wasp', 'ant', 'beetle', 'butterfly', 'moth', 'fly', 'mosquito',
    'spider', 'scorpion', 'mantis', 'cricket', 'grasshopper', 'dragonfly', 'ladybug', 'firefly',
  ],
  plants: [
    'rose', 'tulip', 'daisy', 'lily', 'orchid', 'violet', 'jasmine', 'sunflower',
    'poppy', 'peony', 'iris', 'carnation', 'marigold', 'zinnia', 'petunia', 'begonia',
    'oak', 'pine', 'maple', 'birch', 'willow', 'elm', 'ash', 'beech',
    'palm', 'cedar', 'spruce', 'fir', 'cypress', 'redwood', 'sequoia', 'mahogany',
    'bamboo', 'cactus', 'succulent', 'aloe', 'agave', 'yucca', 'jade', 'ficus',
    'fern', 'moss', 'lichen', 'algae', 'seaweed', 'kelp', 'ivy', 'vine',
    'grass', 'wheat', 'rice', 'corn', 'barley', 'oats', 'rye', 'millet',
    'tomato', 'potato', 'carrot', 'onion', 'garlic', 'pepper', 'cucumber', 'lettuce',
    'spinach', 'cabbage', 'broccoli', 'cauliflower', 'celery', 'radish', 'turnip', 'beet',
    'basil', 'mint', 'sage', 'thyme', 'oregano', 'parsley', 'cilantro', 'dill',
    'lavender', 'rosemary', 'chamomile', 'hibiscus', 'lotus', 'azalea', 'camellia', 'magnolia',
    'apple', 'orange', 'banana', 'grape', 'cherry', 'peach', 'pear', 'plum',
    'mango', 'papaya', 'coconut', 'pineapple', 'melon', 'berry', 'lemon', 'lime',
  ],
  science: [
    'atom', 'molecule', 'electron', 'proton', 'neutron', 'photon', 'quark', 'ion',
    'plasma', 'nucleus', 'isotope', 'catalyst', 'enzyme', 'polymer', 'crystal', 'alloy',
    'quantum', 'particle', 'matter', 'energy', 'entropy', 'velocity', 'momentum', 'friction',
    'gravity', 'radiation', 'magnetic', 'electric', 'thermal', 'kinetic', 'potential', 'force',
    'cell', 'tissue', 'organ', 'genome', 'gene', 'protein', 'amino', 'lipid',
    'membrane', 'mitosis', 'meiosis', 'nucleus', 'ribosome', 'organelle', 'cytoplasm', 'chloroplast',
    'bacteria', 'virus', 'pathogen', 'antibody', 'antigen', 'immune', 'vaccine', 'syndrome',
    'neuron', 'synapse', 'hormone', 'insulin', 'cortisol', 'dopamine', 'serotonin', 'adrenaline',
    'asteroid', 'comet', 'nebula', 'galaxy', 'planet', 'orbit', 'eclipse', 'cosmos',
    'meteor', 'crater', 'lunar', 'solar', 'stellar', 'cosmic', 'quasar', 'pulsar',
    'geology', 'mineral', 'crystal', 'fossil', 'sediment', 'magma', 'lava', 'tectonic',
    'seismic', 'volcano', 'erosion', 'glacier', 'ocean', 'climate', 'ozone', 'carbon',
    'algorithm', 'quantum', 'spectrum', 'frequency', 'wavelength', 'amplitude', 'resonance', 'diffraction',
    'osmosis', 'diffusion', 'synthesis', 'analysis', 'hypothesis', 'theory', 'axiom', 'theorem',
    'vector', 'matrix', 'exponential', 'logarithm', 'calculus', 'topology', 'entropy', 'equilibrium',
  ],
  genz: [
    'slay', 'vibe', 'fire', 'lit', 'cap', 'bet', 'flex', 'goat',
    'yeet', 'stan', 'simp', 'mood', 'fam', 'bruh', 'lowkey', 'highkey',
    'bussin', 'sheesh', 'drip', 'sus', 'valid', 'rent', 'snatched', 'slaps',
    'hits', 'ghosts', 'cringe', 'toxic', 'savage', 'extra', 'basic', 'salty',
    'shook', 'woke', 'clout', 'hype', 'ghost', 'finsta', 'main', 'spam',
    'tea', 'shade', 'glow', 'snack', 'ship', 'squad', 'goals', 'vibes',
    'energy', 'aura', 'serves', 'period', 'icon', 'legend', 'queen', 'king',
    'bop', 'slap', 'banger', 'tracks', 'tunes', 'jams', 'beats', 'bars',
    'fire', 'flames', 'heat', 'hot', 'cold', 'fresh', 'clean', 'smooth',
    'crisp', 'sharp', 'tight', 'solid', 'dope', 'sick', 'ill', 'wicked',
    'crazy', 'insane', 'mental', 'wild', 'epic', 'mega', 'ultra', 'super',
    'hyper', 'turbo', 'nitro', 'blast', 'boom', 'pow', 'bang', 'blast',
  ],
};

// ── Sentences (exact copy from original) ──
export const SENTENCES: string[] = [
  'The quick brown fox jumps over the lazy dog.',
  'Pack my box with five dozen liquor jugs today.',
  'How vexingly quick daft zebras jump in the fog.',
  'The five boxing wizards jump quickly at dawn.',
  'Sphinx of black quartz, judge my solemn vow.',
  'Two driven jocks help fax my big quiz paper.',
  'Five quacking zephyrs jolt my wax bed badly.',
  'The jay, pig, fox, zebra and my wolves quack.',
  'Crazy Fredrick bought many very exquisite jewels.',
  'We promptly judged antique ivory buckles for prizes.',
  'A wizard job is to vex chumps quickly in fog.',
  'Watch Jeopardy, Alex Trebek hosted fun TV quiz games.',
  'Public buildings facing hazards jeopardize workers.',
  'Few black taxis drive up major roads on quiet nights.',
  'The job requires extra pluck and zeal from every worker.',
];

// ── Current word list (defaults to 'all') ──
let currentCategory = 'all';
let words = wordCategories.all;

/**
 * Set the active word category.
 */
export function setWordCategory(category: string): void {
  if (wordCategories[category]) {
    currentCategory = category;
    words = wordCategories[category];
  }
}

/**
 * Get the active word list.
 */
export function getWords(): string[] {
  return words;
}

// ── Math question generation ──
// Exact port of original generateMathQuestion()

export function generateMathQuestion(): MathQuestion {
  const operations = ['+', '-', '*'];
  const operation = operations[Math.floor(Math.random() * operations.length)];

  let num1: number;
  let num2: number;
  let answer: number;
  let displayOperation: string;

  switch (operation) {
    case '+':
      num1 = Math.floor(Math.random() * 50) + 1;
      num2 = Math.floor(Math.random() * 50) + 1;
      answer = num1 + num2;
      displayOperation = '+';
      break;
    case '-':
      num1 = Math.floor(Math.random() * 50) + 20;
      num2 = Math.floor(Math.random() * (num1 - 1)) + 1;
      answer = num1 - num2;
      displayOperation = '-';
      break;
    case '*':
      num1 = Math.floor(Math.random() * 12) + 1;
      num2 = Math.floor(Math.random() * 12) + 1;
      answer = num1 * num2;
      displayOperation = 'x'; // Use 'x' instead of '*' for display
      break;
    default:
      num1 = 1;
      num2 = 1;
      answer = 2;
      displayOperation = '+';
  }

  return {
    question: `${num1}${displayOperation}${num2}`,
    answer: answer.toString(),
  };
}

// ── Spawn functions ──

/**
 * Spawn a word or letter invader.
 * Port of the Invader constructor for words/letters mode (~lines 3334-3375).
 *
 * @param viewportWidth  Window inner width, passed in to avoid direct DOM access
 */
export function spawnWordInvader(viewportWidth: number): InvaderData | null {
  const state = useGameStore.getState();
  if (state.isGameOver) return null;

  const currentMode = getEffectiveMode();

  // Don't spawn word invaders in sentences or math mode
  if (currentMode === 'sentences' || currentMode === 'math') return null;

  const active = countActiveInvaders(state.invaders);

  if (state.isLetterMode) {
    // Letter mode: higher cap (10)
    if (active >= 10) return null;
  } else {
    // Normal word mode: respect maxInvaders
    if (active >= state.maxInvaders) return null;
  }

  let word: string;
  let emoji: string;
  let isLetter = false;

  if (state.isLetterMode) {
    // Single random letter
    word = LETTERS[Math.floor(Math.random() * LETTERS.length)];
    emoji = '\u2B50'; // star emoji
    isLetter = true;
  } else {
    // Word mode: pick random word not already on screen
    const usedWords = state.invaders
      .filter((z) => !z.isDying)
      .map((z) => z.word);

    let availableWords = words.filter((w) => !usedWords.includes(w));
    if (availableWords.length === 0) {
      availableWords = words;
    }
    word = availableWords[Math.floor(Math.random() * availableWords.length)];
    emoji = '\uD83D\uDC7E'; // alien invader emoji
  }

  const estimatedWidth = isLetter ? 60 : word.length * 15 + 40;
  const x = Math.random() * Math.max(100, viewportWidth - estimatedWidth);
  const speed =
    state.invaderSpeed *
    (0.8 + Math.random() * 0.4) *
    state.speedMultiplier;
  const horizontalDrift = (Math.random() - 0.5) * 0.3;

  const invader: InvaderData = {
    id: generateId(),
    word,
    displayWord: word,
    answer: word,
    x,
    y: 0,
    speed,
    horizontalDrift,
    type: isLetter ? 'letter' : 'word',
    isDying: false,
    spawnTime: Date.now(),
    isMathQuestion: false,
    isLetter,
    isSentence: false,
    emoji,
    elementRef: null,
    wordElementRef: null,
  };

  useGameStore.getState().addInvader(invader);
  return invader;
}

/**
 * Spawn a math invader.
 * Port of spawnMathInvader() and the math branch of the Invader constructor (~lines 3315-3333).
 *
 * Math invaders spawn at the center horizontally and have bouncing horizontal movement.
 *
 * @param viewportWidth  Window inner width
 */
export function spawnMathInvader(viewportWidth: number): InvaderData | null {
  const state = useGameStore.getState();
  if (state.isGameOver) return null;

  // Only spawn if no active math invaders
  const active = countActiveInvaders(state.invaders);
  if (active > 0) return null;

  const mathQuestion = generateMathQuestion();

  // Store the question in the store for tracking
  useGameStore.getState().setCurrentMathQuestion(mathQuestion);
  useGameStore.getState().setMathQuestionStartTime(Date.now());

  const estimatedWidth = mathQuestion.question.length * 15 + 40;
  const x = Math.max(0, viewportWidth / 2 - estimatedWidth / 2);
  const speed =
    state.invaderSpeed *
    (0.8 + Math.random() * 0.4) *
    state.speedMultiplier;
  const horizontalDrift = (Math.random() - 0.5) * 0.3;

  const invader: InvaderData = {
    id: generateId(),
    word: mathQuestion.answer, // answer stored in word for matching
    displayWord: mathQuestion.question, // question displayed to player
    answer: mathQuestion.answer,
    x,
    y: 0,
    speed,
    horizontalDrift,
    type: 'math',
    isDying: false,
    spawnTime: Date.now(),
    isMathQuestion: true,
    isLetter: false,
    isSentence: false,
    emoji: '\uD83D\uDC7D', // alien emoji for math
    elementRef: null,
    wordElementRef: null,
  };

  useGameStore.getState().addInvader(invader);
  return invader;
}

/**
 * Main spawn dispatcher.
 * Port of original spawnInvader() (~lines 3642-3680).
 * Routes to the appropriate spawn function based on current mode.
 *
 * @param viewportWidth  Window inner width
 * @returns The spawned invader data, or null if no spawn occurred
 */
export function spawnInvader(
  viewportWidth: number
): InvaderData | null {
  const state = useGameStore.getState();
  if (state.isGameOver) return null;

  const currentMode = getEffectiveMode();

  // Sentences mode - sentence spawning is handled separately by the sentence system
  if (currentMode === 'sentences') {
    // Return null; sentence spawning is triggered by spawnSentence() externally
    return null;
  }

  // Math mode - only spawn if no active invaders
  if (state.isMathMode) {
    const active = countActiveInvaders(state.invaders);
    if (active === 0) {
      return spawnMathInvader(viewportWidth);
    }
    return null;
  }

  // Words/letters mode
  return spawnWordInvader(viewportWidth);
}

/**
 * Pick a sentence for sentence mode.
 * Port of the sentence selection logic from spawnSentence() (~lines 3694-3727).
 *
 * Avoids repeating recently used sentences. Resets if all have been used.
 *
 * @returns Object with the sentence text, its original index, and calculated duration
 */
export function pickSentence(): {
  text: string;
  index: number;
} {
  const state = useGameStore.getState();

  let availableSentences = SENTENCES.filter(
    (_, i) => !state.usedSentences.includes(i)
  );

  if (availableSentences.length === 0) {
    useGameStore.getState().clearUsedSentences();
    availableSentences = [...SENTENCES];
  }

  const randomIdx = Math.floor(Math.random() * availableSentences.length);
  const text = availableSentences[randomIdx];
  const originalIndex = SENTENCES.indexOf(text);

  useGameStore.getState().addUsedSentence(originalIndex);

  return { text, index: originalIndex };
}
