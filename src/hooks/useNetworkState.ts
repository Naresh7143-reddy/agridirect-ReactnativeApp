/**
 * useNetworkState
 *
 * Lightweight network-awareness hook that doesn't require
 * @react-native-community/netinfo (not installed).
 *
 * Strategy: poll a cheap HEAD request against the API health endpoint
 * every POLL_MS ms. Updates instantly when the request succeeds/fails.
 *
 * The returned `isConnected` flag starts as `true` (optimistic) and
 * updates after the first probe completes.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import ENV from '../config/env';

const HEALTH_URL = `${ENV.API_URL}/health`;
const POLL_MS    = 10_000;   // 10 seconds
const TIMEOUT_MS = 5_000;    // 5 second request timeout

export interface NetworkState {
  isConnected: boolean;
  isChecking: boolean;
  /** Manually trigger a connectivity probe */
  retry: () => void;
}

export const useNetworkState = (): NetworkState => {
  const [isConnected, setIsConnected] = useState(true);
  const [isChecking, setIsChecking]   = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const probe = useCallback(async () => {
    if (!mountedRef.current) return;
    setIsChecking(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
      await fetch(HEALTH_URL, { method: 'HEAD', signal: controller.signal });
      clearTimeout(timeout);
      if (mountedRef.current) setIsConnected(true);
    } catch {
      if (mountedRef.current) setIsConnected(false);
    } finally {
      if (mountedRef.current) setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    probe();

    timerRef.current = setInterval(probe, POLL_MS);

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [probe]);

  return { isConnected, isChecking, retry: probe };
};
