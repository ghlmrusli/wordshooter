// ── React hook for managing PartySocket connection ──

'use client';

import { useEffect, useRef, useCallback } from 'react';
import PartySocket from 'partysocket';
import type { ServerMessage, ClientMessage } from '../../party/types';

const PARTY_HOST =
  process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? 'localhost:1999';

interface UsePartySocketOptions {
  roomCode: string;
  onMessage: (msg: ServerMessage) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (err: Event) => void;
  enabled?: boolean;
}

export function usePartySocket({
  roomCode,
  onMessage,
  onOpen,
  onClose,
  onError,
  enabled = true,
}: UsePartySocketOptions) {
  const socketRef = useRef<PartySocket | null>(null);
  const onMessageRef = useRef(onMessage);
  const onOpenRef = useRef(onOpen);
  const onCloseRef = useRef(onClose);
  const onErrorRef = useRef(onError);

  // Keep refs up to date without reconnecting
  onMessageRef.current = onMessage;
  onOpenRef.current = onOpen;
  onCloseRef.current = onClose;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!enabled || !roomCode) return;

    const socket = new PartySocket({
      host: PARTY_HOST,
      room: roomCode,
    });

    socket.addEventListener('open', () => {
      onOpenRef.current?.();
    });

    socket.addEventListener('message', (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data);
        onMessageRef.current(msg);
      } catch {
        // Ignore malformed messages
      }
    });

    socket.addEventListener('close', () => {
      onCloseRef.current?.();
    });

    socket.addEventListener('error', (e) => {
      onErrorRef.current?.(e);
    });

    socketRef.current = socket;

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [enabled, roomCode]);

  const send = useCallback((msg: ClientMessage) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.close();
    socketRef.current = null;
  }, []);

  return { send, disconnect, socketRef };
}
