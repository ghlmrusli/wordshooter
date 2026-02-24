// ---------------------------------------------------------------------------
// Word Shooter - Word categories
// Ported from the original index.html wordCategories object.
// All words are real English words grouped by theme.
// ---------------------------------------------------------------------------

import type { WordCategory } from '@/types/game';

export const wordCategories: Record<WordCategory, string[]> = {
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
    // Physics & Chemistry
    'atom', 'molecule', 'electron', 'proton', 'neutron', 'photon', 'quark', 'ion',
    'plasma', 'nucleus', 'isotope', 'catalyst', 'enzyme', 'polymer', 'crystal', 'alloy',
    'quantum', 'particle', 'matter', 'energy', 'entropy', 'velocity', 'momentum', 'friction',
    'gravity', 'radiation', 'magnetic', 'electric', 'thermal', 'kinetic', 'potential', 'force',

    // Biology & Medicine
    'cell', 'tissue', 'organ', 'genome', 'gene', 'protein', 'amino', 'lipid',
    'membrane', 'mitosis', 'meiosis', 'nucleus', 'ribosome', 'organelle', 'cytoplasm', 'chloroplast',
    'bacteria', 'virus', 'pathogen', 'antibody', 'antigen', 'immune', 'vaccine', 'syndrome',
    'neuron', 'synapse', 'hormone', 'insulin', 'cortisol', 'dopamine', 'serotonin', 'adrenaline',

    // Earth & Space Sciences
    'asteroid', 'comet', 'nebula', 'galaxy', 'planet', 'orbit', 'eclipse', 'cosmos',
    'meteor', 'crater', 'lunar', 'solar', 'stellar', 'cosmic', 'quasar', 'pulsar',
    'geology', 'mineral', 'crystal', 'fossil', 'sediment', 'magma', 'lava', 'tectonic',
    'seismic', 'volcano', 'erosion', 'glacier', 'ocean', 'climate', 'ozone', 'carbon',

    // Advanced Scientific Terms
    'algorithm', 'quantum', 'spectrum', 'frequency', 'wavelength', 'amplitude', 'resonance', 'diffraction',
    'osmosis', 'diffusion', 'synthesis', 'analysis', 'hypothesis', 'theory', 'axiom', 'theorem',
    'vector', 'matrix', 'exponential', 'logarithm', 'calculus', 'topology', 'entropy', 'equilibrium',
  ],

  genz: [
    // Gen Z slang and expressions
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

/** Default word list (the "all" category). */
export const defaultWords = wordCategories.all;
