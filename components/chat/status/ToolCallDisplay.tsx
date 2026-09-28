import React, { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ToolStep } from '../../../types/aiRun';
import { COLORS } from '../../../types/design';
import { CheckGlyph, CloseGlyph, ChevronDownGlyph } from '../../DesignSystem';
import { useReduceMotion } from '../../../hooks/useReduceMotion';

const Spinner: React.FC<{ size?: number }> = ({ size = 14 }) => {
  const reduceMotion = useReduceMotion();
  const [spin] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View
      style={[
        styles.spinner,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          transform: [{ rotate }],
        },
      ]}
    />
  );
};

const StepIcon: React.FC<{ status: ToolStep['status'] }> = ({ status }) => {
  if (status === 'running') return <Spinner />;
  if (status === 'done') return <CheckGlyph size={14} color={COLORS.success} />;
  return <CloseGlyph size={12} color={COLORS.error} />;
};

interface ToolCallDisplayProps {
  steps: ToolStep[];
  /** Ringkasan terlipat, dipakai untuk opsi keepStepsAfterDone. */
  collapsed?: boolean;
}

/**
 * Daftar langkah tool: spinner saat berjalan, centang saat selesai,
 * ikon silang saat gagal. Argumen bisa dibuka per langkah.
 */
export const ToolCallDisplay: React.FC<ToolCallDisplayProps> = ({ steps, collapsed = false }) => {
  const [summaryOpen, setSummaryOpen] = useState(!collapsed);
  const [openArgs, setOpenArgs] = useState<Record<string, boolean>>({});

  if (steps.length === 0) return null;

  const running = steps.some((step) => step.status === 'running');
  const failed = steps.some((step) => step.status === 'error');

  if (collapsed && !summaryOpen) {
    return (
      <TouchableOpacity
        style={styles.summaryRow}
        onPress={() => setSummaryOpen(true)}
        activeOpacity={0.75}
        accessibilityRole='button'
        accessibilityLabel={`Tampilkan ${steps.length} langkah tool`}
      >
        <Text style={styles.summaryText}>
          {steps.length} langkah tool dijalankan
        </Text>
        <ChevronDownGlyph size={12} color={COLORS.textMuted} />
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={styles.container}
      accessibilityLiveRegion='polite'
      accessibilityLabel={
        running
          ? 'Sedang menjalankan tool'
          : failed
            ? 'Ada langkah tool yang gagal'
            : 'Langkah tool selesai'
      }
      testID='assistant-tool-display'
    >
      {steps.map((step) => {
        const argsOpen = Boolean(openArgs[step.id]);
        return (
          <View key={step.id} style={styles.stepRow}>
            <View style={styles.stepHeader}>
              <StepIcon status={step.status} />
              <Text style={styles.stepLabel} numberOfLines={1}>
                {step.label}
              </Text>
            </View>

            {step.args ? (
              <TouchableOpacity
                onPress={() => setOpenArgs((prev) => ({ ...prev, [step.id]: !prev[step.id] }))}
                activeOpacity={0.7}
                accessibilityRole='button'
                accessibilityState={{ expanded: argsOpen }}
                accessibilityLabel={argsOpen ? 'Sembunyikan argumen' : 'Tampilkan argumen'}
              >
                <Text style={styles.argsToggle}>
                  {argsOpen ? 'Sembunyikan argumen' : 'Lihat argumen'}
                </Text>
              </TouchableOpacity>
            ) : null}

            {argsOpen && step.args ? (
              <Text style={styles.argsText}>{step.args}</Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    backgroundColor: COLORS.surfaceContainer,
    gap: 4,
  },
  stepRow: {
    paddingVertical: 4,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  spinner: {
    borderWidth: 2,
    borderColor: 'rgba(255, 199, 44, 0.25)',
    borderTopColor: COLORS.accentYellow,
  },
  stepLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  argsToggle: {
    marginTop: 3,
    marginLeft: 23,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.accentYellow,
  },
  argsText: {
    marginTop: 4,
    marginLeft: 23,
    fontSize: 11.5,
    lineHeight: 16,
    fontFamily: 'monospace',
    color: COLORS.textSecondary,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  summaryText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
