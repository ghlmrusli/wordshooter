'use client';

import styles from '@/styles/keyboard.module.css';
import clsx from 'clsx';

interface KeyButtonProps {
  keyValue: string;
  label?: string;
  className?: string;
  onKeyPress: (key: string) => void;
}

export default function KeyButton({ keyValue, label, className, onKeyPress }: KeyButtonProps) {
  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    onKeyPress(keyValue);
  };

  return (
    <button
      className={clsx(styles.key, className)}
      data-key={keyValue}
      onMouseDown={handleClick}
      onTouchStart={handleClick}
    >
      {label || keyValue.toUpperCase()}
    </button>
  );
}
