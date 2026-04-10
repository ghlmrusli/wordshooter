// ── CollisionDetector ──
// Matching/collision logic for finding invaders that match typed input.
// Port of the original prefix/exact matching used in _handleWordKey and _handleMathKey.

import { InvaderData } from '@/types/game';

/**
 * Find the first active invader whose word starts with the given input.
 * Used during word/letter mode to determine if the player's input so far
 * is a valid prefix of any on-screen invader's word.
 *
 * @param input  The player's current typed input
 * @param invaders  Array of all active invaders
 * @returns The first invader whose word starts with `input`, or null
 */
export function findPrefixMatch(
  input: string,
  invaders: InvaderData[]
): InvaderData | null {
  if (!input || input.length === 0) return null;

  for (const inv of invaders) {
    if (!inv.isDying && inv.word.startsWith(input)) {
      return inv;
    }
  }
  return null;
}

/**
 * Check whether ANY active invader's word starts with the given input.
 * Lighter version of findPrefixMatch for boolean checks.
 *
 * @param input  The player's current typed input
 * @param invaders  Array of all active invaders
 * @returns true if at least one invader's word starts with `input`
 */
export function hasPrefixMatch(
  input: string,
  invaders: InvaderData[]
): boolean {
  if (!input || input.length === 0) return false;

  return invaders.some((inv) => !inv.isDying && inv.word.startsWith(input));
}

/**
 * Find the first active invader whose word exactly matches the given input.
 * Used to trigger the shoot action when the player finishes typing a word.
 *
 * @param input  The player's current typed input
 * @param invaders  Array of all active invaders
 * @returns The first invader whose word exactly equals `input`, or null
 */
export function findExactMatch(
  input: string,
  invaders: InvaderData[]
): InvaderData | null {
  if (!input || input.length === 0) return null;

  for (const inv of invaders) {
    if (!inv.isDying && inv.word === input) {
      return inv;
    }
  }
  return null;
}

/**
 * Find the first active math invader whose answer matches the given input.
 * Math invaders store the answer in the `word` field (same as original).
 *
 * @param input  The player's numeric input string
 * @param invaders  Array of all active invaders
 * @returns The matching math invader, or null
 */
export function findMathMatch(
  input: string,
  invaders: InvaderData[]
): InvaderData | null {
  if (!input || input.length === 0) return null;

  for (const inv of invaders) {
    if (!inv.isDying && inv.isMathQuestion && inv.word === input) {
      return inv;
    }
  }
  return null;
}

/**
 * Find the active math invader (there should be at most 1 at a time).
 * Used for length comparison when determining wrong answers.
 *
 * @param invaders  Array of all active invaders
 * @returns The active math invader, or null
 */
export function findActiveMathInvader(
  invaders: InvaderData[]
): InvaderData | null {
  for (const inv of invaders) {
    if (!inv.isDying && inv.isMathQuestion) {
      return inv;
    }
  }
  return null;
}

/**
 * Count the number of active (non-dying) invaders.
 *
 * @param invaders  Array of all invaders
 * @returns Number of active invaders
 */
export function countActiveInvaders(invaders: InvaderData[]): number {
  return invaders.filter((inv) => !inv.isDying).length;
}
