import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Mengikuti preferensi "reduce motion" sistem.
 * Dipakai untuk mematikan shimmer dan animasi berkedip.
 */
export const useReduceMotion = (): boolean => {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) setReduceMotion(value);
      })
      .catch(() => {
        // Perangkat tanpa dukungan: biarkan animasi tetap menyala.
      });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      if (mounted) setReduceMotion(value);
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
};
