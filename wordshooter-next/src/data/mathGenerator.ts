// ---------------------------------------------------------------------------
// Word Shooter - Math question generator
// Ported from the original generateMathQuestion() function.
//
// Generates random arithmetic problems with three operation types:
//   + : addition      (1-50) + (1-50)
//   - : subtraction    (20-69) - (1 to num1-1), always positive result
//   * : multiplication (1-12) x (1-12)
// ---------------------------------------------------------------------------

import type { MathQuestion } from '@/types/game';

export function generateMathQuestion(): MathQuestion {
  const operations = ['+', '-', '*'] as const;
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
  }

  return {
    question: `${num1}${displayOperation}${num2}`,
    answer: answer.toString(),
  };
}
