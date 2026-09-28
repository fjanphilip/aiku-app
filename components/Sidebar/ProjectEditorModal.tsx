import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS } from '../../types/design';

interface ProjectEditorModalProps {
  visible: boolean;
  title: string;
  initialValue?: string;
  submitLabel?: string;
  onCancel: () => void;
  onSubmit: (name: string) => void;
}

interface EditorBodyProps {
  title: string;
  initialValue: string;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (name: string) => void;
}

/**
 * Isi dialog dipisah agar state input ikut ter-reset setiap kali
 * dialog dibuka, tanpa perlu sinkronisasi lewat effect.
 */
const EditorBody: React.FC<EditorBodyProps> = ({
  title,
  initialValue,
  submitLabel,
  onCancel,
  onSubmit,
}) => {
  const [value, setValue] = useState(initialValue);
  const canSubmit = value.trim().length > 0;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={setValue}
        placeholder="Nama project"
        placeholderTextColor={COLORS.textMuted}
        autoFocus
        maxLength={60}
        selectionColor={COLORS.accentYellow}
        accessibilityLabel="Nama project"
      />

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.btn, styles.btnGhost]}
          onPress={onCancel}
          activeOpacity={0.75}
          accessibilityRole="button"
        >
          <Text style={styles.btnGhostText}>Batal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary, !canSubmit && styles.btnDisabled]}
          onPress={() => onSubmit(value.trim())}
          disabled={!canSubmit}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Text style={styles.btnPrimaryText}>{submitLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * Dialog untuk membuat atau mengganti nama project.
 */
export const ProjectEditorModal: React.FC<ProjectEditorModalProps> = ({
  visible,
  title,
  initialValue = '',
  submitLabel = 'Simpan',
  onCancel,
  onSubmit,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onCancel}
          accessibilityLabel="Tutup dialog"
        />

        {visible && (
          <EditorBody
            title={title}
            initialValue={initialValue}
            submitLabel={submitLabel}
            onCancel={onCancel}
            onSubmit={onSubmit}
          />
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  card: {
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
    marginBottom: 14,
  },
  input: {
    backgroundColor: COLORS.surfaceBase,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
  },
  btn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  btnGhost: {
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  btnGhostText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  btnPrimary: {
    backgroundColor: COLORS.accentYellow,
  },
  btnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.onAccentYellow,
  },
  btnDisabled: {
    opacity: 0.4,
  },
});
