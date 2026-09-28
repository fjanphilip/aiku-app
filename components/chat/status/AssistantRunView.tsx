import React, { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { RunState } from '../../../types/aiRun';
import { COLORS } from '../../../types/design';
import { LoadingState } from './LoadingState';
import { SkeletonLoader } from './SkeletonLoader';
import { ReasoningBlock } from './ReasoningBlock';
import { ToolCallDisplay } from './ToolCallDisplay';
import { StreamingMessage } from './StreamingMessage';
import { TypingIndicator } from '../../TypingIndicator';

interface AssistantRunViewProps {
  runState: RunState;
  streamingText: string;
  /** Tampilkan ringkasan langkah tool yang terlipat setelah run selesai. */
  keepStepsAfterDone?: boolean;
  onRetry?: () => void;
}

/**
 * Satu-satunya tempat aturan tampil indikator ditegakkan.
 *
 * - idle   : tidak ada indikator sama sekali (pesan final datang dari SQLite).
 * - lainnya: indikator sesuai status.
 *
 * Fade masuk/keluar dijalankan dengan Animated tanpa setState di dalam effect,
 * dan maxHeight ikut dianimasikan supaya sisa ruang tidak menyisakan celah.
 */
export const AssistantRunView: React.FC<AssistantRunViewProps> = ({
  runState,
  streamingText,
  keepStepsAfterDone = false,
  onRetry,
}) => {
  const [progress] = useState(() => new Animated.Value(runState.status === 'idle' ? 0 : 1));

  const isError = runState.status === 'error';
  const isActive = runState.status !== 'idle';
  const visible = isActive || (keepStepsAfterDone && runState.steps.length > 0);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: visible ? 160 : 200,
      easing: Easing.out(Easing.ease),
      // maxHeight tidak didukung native driver.
      useNativeDriver: false,
    }).start();
  }, [visible, progress]);

  const hasText = streamingText.trim().length > 0;
  const hasReasoning = runState.reasoning.trim().length > 0;
  const hasSteps = runState.steps.length > 0;
  const anyStepRunning = runState.steps.some((step) => step.status === 'running');
  const eventArrived = hasText || hasReasoning || hasSteps;

  const showIndicators = isActive && !isError;
  const showSkeleton = showIndicators && runState.status === 'submitted' && !eventArrived;
  const showTyping =
    showIndicators &&
    !hasText &&
    !showSkeleton &&
    (runState.status === 'submitted' ||
      runState.status === 'reasoning' ||
      (runState.status === 'tool_running' && !anyStepRunning));
  const showStepsSummary = !isActive && keepStepsAfterDone && hasSteps;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: progress,
          maxHeight: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 1600] }),
        },
      ]}
      pointerEvents={visible ? 'auto' : 'none'}
      testID='assistant-run-view'
    >
      {isError && runState.error ? (
        <View style={styles.errorBox} accessibilityLiveRegion='assertive'>
          <Text style={styles.errorText}>{runState.error}</Text>
          {onRetry ? (
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={onRetry}
              activeOpacity={0.8}
              accessibilityRole='button'
              accessibilityLabel='Coba lagi'
            >
              <Text style={styles.retryText}>Coba lagi</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {showIndicators ? <LoadingState status={runState.status} /> : null}
      {showIndicators && hasReasoning ? <ReasoningBlock reasoning={runState.reasoning} /> : null}
      {showIndicators && hasSteps ? <ToolCallDisplay steps={runState.steps} /> : null}
      {showSkeleton ? <SkeletonLoader /> : null}
      {showTyping ? <TypingIndicator label='Aiku sedang berpikir...' /> : null}
      {showIndicators && hasText ? (
        <StreamingMessage text={streamingText} showCursor={runState.status === 'streaming'} />
      ) : null}

      {showStepsSummary ? <ToolCallDisplay steps={runState.steps} collapsed /> : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  errorBox: {
    marginHorizontal: 16,
    marginVertical: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    gap: 10,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.error,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: COLORS.accentYellow,
  },
  retryText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.onAccentYellow,
  },
});
