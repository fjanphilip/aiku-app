import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { ModelItem } from '../types/chat';
import { COLORS } from '../types/design';
import { CheckGlyph } from './DesignSystem';

interface ModelPickerModalProps {
  visible: boolean;
  models: ModelItem[];
  activeModel: string | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onSelect: (modelId: string) => void;
  onRefresh: () => void;
}

/**
 * Sheet pemilih model yang mengambil daftar dari endpoint /v1/models 9Router.
 */
export const ModelPickerModal: React.FC<ModelPickerModalProps> = ({
  visible,
  models,
  activeModel,
  isLoading,
  error,
  onClose,
  onSelect,
  onRefresh,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
          accessibilityLabel="Tutup pilihan model"
        />

        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>PILIH MODEL</Text>
            <TouchableOpacity
              onPress={onRefresh}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
              disabled={isLoading}
              accessibilityLabel="Muat ulang daftar model"
            >
              <Text style={styles.refreshText}>
                {isLoading ? 'Memuat...' : 'Muat ulang'}
              </Text>
            </TouchableOpacity>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          {isLoading && models.length === 0 ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={COLORS.accentYellow} />
            </View>
          ) : (
            <FlatList
              data={models}
              keyExtractor={(item) => item.id}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                !error ? (
                  <Text style={styles.emptyText}>
                    Belum ada model terdeteksi. Periksa Base URL dan API key di Pengaturan.
                  </Text>
                ) : null
              }
              renderItem={({ item }) => {
                const isActive = item.id === activeModel;
                return (
                  <TouchableOpacity
                    style={styles.row}
                    onPress={() => onSelect(item.id)}
                    activeOpacity={0.75}
                    accessibilityRole="button"
                    accessibilityLabel={`Pilih model ${item.id}`}
                  >
                    <Text
                      style={[styles.rowText, isActive && styles.rowTextActive]}
                      numberOfLines={1}
                    >
                      {item.id}
                    </Text>
                    {isActive && <CheckGlyph size={16} color={COLORS.accentYellow} />}
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheet: {
    backgroundColor: COLORS.surfaceContainerHigh,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: COLORS.borderSubtle,
    paddingTop: 18,
    paddingBottom: 28,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.2,
  },
  refreshText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accentYellow,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    paddingHorizontal: 18,
    paddingBottom: 10,
    lineHeight: 17,
  },
  loadingBox: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingHorizontal: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  rowText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  rowTextActive: {
    color: COLORS.accentYellow,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 12,
    color: COLORS.textMuted,
    paddingHorizontal: 8,
    paddingVertical: 12,
    lineHeight: 18,
  },
});
