// ── InputHandler ──
// Port of all input handling logic from the original index.html:
//   handleKeyPress() (~line 6480),
//   _handleWordKey() (~line 6404),
//   _handleMathKey() (~line 6331),
//   handleSentenceInput() (~line 4940),
//   and the keydown event handler (~line 4626).
//
// Pure TypeScript, no React. Reads/writes Zustand store via getState()/setState().

import useGameStore from '@/store/gameStore';
import {
  hasPrefixMatch,
  findExactMatch,
  findMathMatch,
  findActiveMathInvader,
} from './CollisionDetector';
import { updateScore, resetCombo } from './ScoreManager';
import { getEffectiveMode } from './DifficultyManager';
import { checkJourneyPhaseTransition } from './JourneyManager';
import { InvaderData } from '@/types/game';

// ── Callback types for side effects the engine can't handle (DOM, audio) ──

export interface InputCallbacks {
  /** Play the shoot/laser sound effect */
  playShootSound: () => void;
  /** Play the success (ascending melody) sound */
  playSuccessSound: () => void;
  /** Play the error (low beep) sound */
  playErrorSound: () => void;
  /** Trigger the shoot animation: fire bullet at invader, returns travel time in ms */
  shoot: (invader: InvaderData) => number;
  /** Notify UI that score changed (for score animation) */
  onScoreChange: (oldScore: number, newScore: number, isIncrease: boolean) => void;
  /** Notify UI that a combo was updated */
  onComboUpdate: () => void;
  /** Update the word progress display on all invaders */
  updateWordProgress: () => void;
  /** Update the input display area */
  updateInputDisplay: () => void;
  /** Update on-screen keyboard highlighting */
  updateKeyboardHighlight: () => void;
  /** Rotate the rocket to face a target (or null to reset) */
  rotateRocketToTarget: (invaderId: string | null) => void;
  /** Called when an invader is killed - handles dying animation */
  onInvaderKilled: (invader: InvaderData, travelTime: number) => void;
  /** Notify that game is over */
  onGameOver: () => void;
  /** Called when a sentence is completed */
  onSentenceComplete: () => void;
  /** Called for journey phase transition */
  onPhaseTransition: (result: ReturnType<typeof checkJourneyPhaseTransition>) => void;
  /** Spawn next math invader after delay */
  scheduleNextMathSpawn: (delayMs: number) => void;
}

let callbacks: InputCallbacks | null = null;

/**
 * Register the callback functions. Must be called once during initialization.
 */
export function setInputCallbacks(cb: InputCallbacks): void {
  callbacks = cb;
}

/**
 * Main key press handler for the on-screen keyboard and mobile input.
 * Port of original handleKeyPress() (~line 6480).
 *
 * Routes input to the appropriate handler based on current mode.
 *
 * @param keyValue  The key value (single char, 'Backspace', ' ', etc.)
 */
export function handleKeyPress(keyValue: string): void {
  const state = useGameStore.getState();
  if (state.isGameOver || state.isPaused) return;

  const currentMode = getEffectiveMode();
  const isMath = currentMode === 'math' || state.isMathMode;

  // Sentences mode: route all keys through sentence handler
  if (currentMode === 'sentences' && state.isSentenceActive) {
    handleSentenceInput(keyValue);
    return;
  }

  if (keyValue === 'Backspace') {
    const newInput = state.currentInput.slice(0, -1);
    useGameStore.setState({ currentInput: newInput });
    callbacks?.updateWordProgress();
    callbacks?.updateInputDisplay();
    callbacks?.updateKeyboardHighlight();
  } else if (isMath && /^[0-9]$/.test(keyValue)) {
    _handleMathKey(keyValue);
  } else if (!isMath && keyValue.length === 1 && /[a-z0-9]/i.test(keyValue)) {
    _handleWordKey(keyValue.toLowerCase());
  }
}

/**
 * Handle keyboard events from the physical keyboard.
 * Port of original document keydown handler (~line 4626).
 *
 * @param e  The keyboard event
 * @param togglePause  Callback to toggle pause state
 */
export function handleKeyDown(
  e: KeyboardEvent,
  togglePause: () => void
): void {
  const state = useGameStore.getState();
  if (state.isGameOver) return;

  // Sentences mode
  const currentMode = getEffectiveMode();
  if (currentMode === 'sentences' && state.isSentenceActive) {
    handleSentenceInput(e.key);
    return;
  }

  // Spacebar = pause
  if (e.key === ' ' || e.key === 'Spacebar') {
    e.preventDefault();
    togglePause();
    return;
  }

  if (state.isPaused) return;

  const isMath = currentMode === 'math' || state.isMathMode;

  // Backspace
  if (e.key === 'Backspace') {
    const newInput = state.currentInput.slice(0, -1);
    useGameStore.setState({ currentInput: newInput });
    callbacks?.updateWordProgress();
    callbacks?.updateInputDisplay();
    callbacks?.updateKeyboardHighlight();
  }
  // Digits (math mode)
  else if (isMath && /^[0-9]$/.test(e.key)) {
    _handleMathKey(e.key);
  }
  // Letters/digits (word/letter mode)
  else if (!isMath && e.key.length === 1 && /[a-z0-9]/i.test(e.key)) {
    _handleWordKey(e.key.toLowerCase());
  }
}

/**
 * Handle math mode digit input.
 * Exact port of original _handleMathKey() (~line 6331).
 */
function _handleMathKey(digit: string): void {
  const state = useGameStore.getState();
  const newInput = state.currentInput + digit;

  useGameStore.getState().incrementTotalCharactersTyped();
  if (!state.wordStartTime) {
    useGameStore.getState().setWordStartTime(Date.now());
  }

  // Exact match -> auto-shoot immediately
  const mathInvader = findMathMatch(newInput, state.invaders);
  if (mathInvader) {
    callbacks?.playSuccessSound();

    // Mark as dying in store
    useGameStore.getState().setInvaderDying(mathInvader.id);

    // Shoot and get travel time
    const travelTime = callbacks?.shoot(mathInvader) ?? 0;

    // Notify UI about the kill
    callbacks?.onInvaderKilled(mathInvader, travelTime);

    // Update score
    const result = updateScore(mathInvader.word, mathInvader);

    // Track math solve time
    if (state.mathQuestionStartTime) {
      const solveTime = Date.now() - state.mathQuestionStartTime;
      useGameStore.getState().addMathSolveTime(solveTime);
      useGameStore.getState().incrementMathQuestionsAnswered();
      useGameStore.getState().setMathQuestionStartTime(null);
    }

    // Schedule next math invader spawn
    callbacks?.scheduleNextMathSpawn(travelTime + 500);

    // Clear input
    useGameStore.setState({
      currentInput: '',
      targetInvaderId: null,
      wordStartTime: null,
    });

    callbacks?.onScoreChange(result.oldScore, result.newScore, true);
    callbacks?.rotateRocketToTarget(null);
    callbacks?.updateWordProgress();
    callbacks?.updateInputDisplay();
    callbacks?.updateKeyboardHighlight();

    // Check journey phase transition
    const phaseResult = checkJourneyPhaseTransition();
    if (phaseResult?.changed) {
      callbacks?.onPhaseTransition(phaseResult);
    }

    if (result.isCelebration) {
      callbacks?.onGameOver();
    }

    return;
  }

  // Accumulate digit
  useGameStore.setState({ currentInput: newInput });

  // If typed as many digits as the answer length -> wrong answer, reset
  const activeInvader = findActiveMathInvader(state.invaders);
  if (activeInvader && newInput.length >= activeInvader.word.length) {
    useGameStore.getState().incrementIncorrectAttempts();
    resetCombo();
    callbacks?.playErrorSound();

    useGameStore.setState({
      currentInput: '',
      wordStartTime: null,
    });

    callbacks?.updateWordProgress();
    callbacks?.updateInputDisplay();
    callbacks?.updateKeyboardHighlight();
    return;
  }

  // Aim rocket at active math invader
  const aimTarget = state.invaders.find((z) => !z.isDying);
  useGameStore.setState({
    targetInvaderId: aimTarget?.id || null,
  });

  callbacks?.rotateRocketToTarget(aimTarget?.id || null);
  callbacks?.updateWordProgress();
  callbacks?.updateInputDisplay();
  callbacks?.updateKeyboardHighlight();
}

/**
 * Handle word/letter mode character input.
 * Exact port of original _handleWordKey() (~line 6404).
 */
function _handleWordKey(char: string): void {
  const state = useGameStore.getState();
  const newInput = state.currentInput + char;

  useGameStore.getState().incrementTotalCharactersTyped();

  // Prefix check: does any active invader's word start with this input?
  const hasMatch = hasPrefixMatch(newInput, state.invaders);

  if (!hasMatch) {
    // No prefix match - error
    useGameStore.getState().incrementIncorrectAttempts();
    resetCombo();
    callbacks?.playErrorSound();

    useGameStore.setState({
      currentInput: '',
      targetInvaderId: null,
    });

    callbacks?.rotateRocketToTarget(null);
    callbacks?.updateWordProgress();
    callbacks?.updateInputDisplay();
    callbacks?.updateKeyboardHighlight();

    // Journey stats tracking
    if (state.mode === 'journey') {
      const stats = { ...state.journeyStats };
      if (state.isLetterMode) {
        // Letters don't track incorrect keys separately in original
      } else {
        stats.words = { ...stats.words };
        stats.words.incorrectKeys++;
        useGameStore.getState().setJourneyStats(stats);
      }
    }

    return;
  }

  // Correct character
  useGameStore.getState().incrementCorrectCharacters();
  if (!state.wordStartTime) {
    useGameStore.getState().setWordStartTime(Date.now());
  }
  useGameStore.setState({ currentInput: newInput });

  // Exact match -> shoot
  const matchedInvader = findExactMatch(newInput, state.invaders);
  if (matchedInvader) {
    // Track fastest word time
    if (state.wordStartTime) {
      const wt = Date.now() - state.wordStartTime;
      useGameStore.getState().setFastestWordTime(wt);
      useGameStore.getState().setWordStartTime(null);
    }

    callbacks?.playSuccessSound();

    // Mark as dying
    useGameStore.getState().setInvaderDying(matchedInvader.id);

    // Shoot and get travel time
    const travelTime = callbacks?.shoot(matchedInvader) ?? 0;

    // Notify UI
    callbacks?.onInvaderKilled(matchedInvader, travelTime);

    // Update score
    const result = updateScore(matchedInvader.word, matchedInvader);

    // Clear input
    useGameStore.setState({
      currentInput: '',
      targetInvaderId: null,
    });

    callbacks?.onScoreChange(result.oldScore, result.newScore, true);
    callbacks?.rotateRocketToTarget(null);
    callbacks?.updateWordProgress();
    callbacks?.updateInputDisplay();
    callbacks?.updateKeyboardHighlight();

    // Check journey phase transition
    const phaseResult = checkJourneyPhaseTransition();
    if (phaseResult?.changed) {
      callbacks?.onPhaseTransition(phaseResult);
    }

    if (result.isCelebration) {
      callbacks?.onGameOver();
    }

    return;
  }

  // Partial match - update target tracking
  let targetInvader: InvaderData | null = null;
  for (const inv of state.invaders) {
    if (!inv.isDying && inv.word.startsWith(newInput)) {
      targetInvader = inv;
      break;
    }
  }

  useGameStore.setState({
    targetInvaderId: targetInvader?.id || null,
  });

  callbacks?.rotateRocketToTarget(targetInvader?.id || null);
  callbacks?.updateWordProgress();
  callbacks?.updateInputDisplay();
  callbacks?.updateKeyboardHighlight();
}

/**
 * Handle sentence mode input.
 * Exact port of original handleSentenceInput() (~line 4940).
 *
 * Character-by-character matching against the current sentence text.
 * Wrong keys increment incorrect attempts and reset combo.
 */
export function handleSentenceInput(key: string): void {
  const state = useGameStore.getState();
  if (!state.isSentenceActive || !state.currentSentenceText) return;

  const targetSentence = state.currentSentenceText;

  if (key === 'Backspace') {
    const newInput = state.currentInput.slice(0, -1);
    useGameStore.setState({ currentInput: newInput });
  } else if (key.length === 1) {
    const nextChar = targetSentence[state.currentInput.length];
    if (nextChar !== undefined && key.toLowerCase() === nextChar.toLowerCase()) {
      // Correct character
      const newInput = state.currentInput + nextChar;
      useGameStore.setState({ currentInput: newInput });
      useGameStore.getState().incrementCorrectCharacters();

      if (state.mode === 'journey') {
        const stats = { ...state.journeyStats };
        stats.sentences = { ...stats.sentences };
        stats.sentences.correctChars++;
        useGameStore.getState().setJourneyStats(stats);
      }
    } else if (nextChar !== undefined) {
      // Wrong key
      useGameStore.getState().incrementIncorrectAttempts();
      if (state.mode === 'journey') {
        const stats = { ...state.journeyStats };
        stats.sentences = { ...stats.sentences };
        stats.sentences.incorrectKeys++;
        useGameStore.getState().setJourneyStats(stats);
      }
      resetCombo();
      callbacks?.playErrorSound();
    }
  }

  // Check completion
  const currentInput = useGameStore.getState().currentInput;
  if (currentInput === targetSentence) {
    callbacks?.onSentenceComplete();
  }
}
