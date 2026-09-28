import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '../../hooks/useSettings';
import { getStoredData } from '../../services/storage';
import { ModelItem } from '../../types/chat';
import { COLORS } from '../../types/design';
import {
  Screen,
  Input,
  Button,
  GradientMeshBackground,
  BackChevronGlyph,
  CheckGlyph,
} from '../../components/DesignSystem';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { baseUrl, apiKey, error, saveAll, testConnection, resetSettings, availableModels } =
    useSettings();

  const [inputBaseUrl, setInputBaseUrl] = useState('');
  const [inputApiKey, setInputApiKey] = useState('');
  const [inputModel, setInputModel] = useState('');
  const [inputSystemPrompt, setInputSystemPrompt] = useState('');

  const [testStatus, setTestStatus] = useState<{
    type: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({ type: 'idle', message: '' });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getStoredData()
      .then((stored) => {
        if (isMounted) {
          if (stored.baseUrl !== null) setInputBaseUrl(stored.baseUrl);
          if (stored.apiKey !== null) setInputApiKey(stored.apiKey);
          if (stored.defaultModel !== null) setInputModel(stored.defaultModel);
          if (stored.systemPrompt !== null) setInputSystemPrompt(stored.systemPrompt);
        }
      })
      .catch((err) => {
        console.error('Gagal memuat pengaturan tersimpan:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleTestConnection = async () => {
    const trimmedUrl = inputBaseUrl.trim();
    const trimmedKey = inputApiKey.trim();

    if (!trimmedUrl || !trimmedKey) {
      setTestStatus({
        type: 'error',
        message: 'Mohon isi Base URL dan API Key terlebih dahulu untuk menguji koneksi.',
      });
      return;
    }

    setTestStatus({ type: 'loading', message: 'Menghubungi 9Router di VPS...' });

    const result = await testConnection(trimmedUrl, trimmedKey);
    if (result.success) {
      setTestStatus({ type: 'success', message: result.message });
      if (!inputModel.trim() && result.models.length > 0) {
        setInputModel(result.models[0].id);
      }
    } else {
      setTestStatus({ type: 'error', message: result.message });
    }
  };

  const handleSave = async () => {
    const trimmedUrl = inputBaseUrl.trim();
    const trimmedKey = inputApiKey.trim();

    if (!trimmedUrl || !trimmedKey) {
      Alert.alert('Perhatian', 'Base URL dan API Key tidak boleh kosong.');
      return;
    }

    setIsSaving(true);
    try {
      await saveAll({
        baseUrl: trimmedUrl,
        apiKey: trimmedKey,
        defaultModel: inputModel.trim() || 'gemini-2.0-flash',
        systemPrompt: inputSystemPrompt.trim() || undefined,
      });

      Alert.alert('Sukses', 'Konfigurasi 9Router berhasil disimpan!', [
        { text: 'Mulai Chat', onPress: () => router.navigate('/(tabs)') },
      ]);
    } catch {
      Alert.alert('Error', 'Gagal menyimpan konfigurasi ke SecureStore.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Pengaturan',
      'Apakah Anda yakin ingin menghapus Base URL, API Key, dan preferensi yang tersimpan?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            await resetSettings();
            setInputBaseUrl('');
            setInputApiKey('');
            setInputModel('');
            setInputSystemPrompt('');
            setTestStatus({ type: 'idle', message: '' });
          },
        },
      ]
    );
  };

  const isConfigured = !!baseUrl && !!apiKey;

  return (
    <Screen>
      <GradientMeshBackground />
      <KeyboardAvoidingView style={styles.flex} behavior='padding'>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.content, { paddingTop: Math.max(insets.top, 16) + 8 }]}>
            {/* Top Back Button */}
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.navigate('/(tabs)')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Kembali ke chat"
              activeOpacity={0.75}
            >
              <BackChevronGlyph size={15} color={COLORS.textSecondary} />
              <Text style={styles.backBtnText}>Kembali ke Chat</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Pengaturan 9Router</Text>
            <Text style={styles.headerSubtitle}>
              Hubungkan aplikasi dengan backend AI (9Router) yang berjalan di VPS Anda.
            </Text>

            {!isConfigured && (
              <View style={styles.noticeBox}>
                <View style={styles.noticeDot} />
                <View style={styles.noticeContent}>
                  <Text style={styles.noticeTitle}>Konfigurasi Diperlukan</Text>
                  <Text style={styles.noticeText}>
                    Masukkan Base URL dan API Key 9Router Anda untuk mulai menggunakan AI Chat.
                  </Text>
                </View>
              </View>
            )}

            {/* Section 1: Endpoint VPS */}
            <View style={styles.sectionGroup}>
              <Text style={styles.sectionHeading}>ENDPOINT & KREDENSIAL</Text>

              <Input
                label='Base URL 9Router'
                placeholder='http://vps-ip:port atau https://api.domain.com'
                value={inputBaseUrl}
                onChangeText={setInputBaseUrl}
                autoCapitalize='none'
                autoCorrect={false}
                helperText='Alamat server endpoint 9Router VPS Anda.'
              />

              <Input
                label='API Key'
                placeholder='sk-xxxxxxxxxxxxxxxxxxxxxxxx'
                secureTextEntry
                value={inputApiKey}
                onChangeText={setInputApiKey}
                autoCapitalize='none'
                autoCorrect={false}
                showPasswordToggle
                helperText='Kunci otorisasi (disimpan terenkripsi di Keystore device).'
              />

              <View style={styles.testBtnRow}>
                <TouchableOpacity
                  style={[
                    styles.testBtn,
                    testStatus.type === 'loading' && styles.testBtnLoading,
                  ]}
                  onPress={handleTestConnection}
                  disabled={testStatus.type === 'loading'}
                  activeOpacity={0.75}
                >
                  <Text style={styles.testBtnText}>
                    {testStatus.type === 'loading' ? 'Menghubungi VPS...' : 'Uji Koneksi 9Router'}
                  </Text>
                </TouchableOpacity>
              </View>

              {testStatus.message !== '' && (
                <View
                  style={[
                    styles.statusBox,
                    testStatus.type === 'success'
                      ? styles.statusBoxSuccess
                      : testStatus.type === 'error'
                        ? styles.statusBoxError
                        : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      testStatus.type === 'success'
                        ? styles.statusSuccessText
                        : testStatus.type === 'error'
                          ? styles.statusErrorText
                          : null,
                    ]}
                  >
                    {testStatus.message}
                  </Text>
                </View>
              )}
            </View>

            {/* Section 2: Model Selection */}
            <View style={styles.sectionGroup}>
              <Text style={styles.sectionHeading}>MODEL AI</Text>

              <Input
                label='Model AI Default'
                placeholder='contoh: gemini-2.0-flash'
                value={inputModel}
                onChangeText={setInputModel}
                autoCapitalize='none'
                autoCorrect={false}
              />

              {availableModels.length > 0 && (
                <View style={styles.chipsContainer}>
                  <Text style={styles.chipsTitle}>Pilih model dari 9Router yang terdeteksi:</Text>
                  <View style={styles.chipsWrap}>
                    {availableModels.map((m: ModelItem) => {
                      const isSelected = inputModel === m.id;
                      return (
                        <TouchableOpacity
                          key={m.id}
                          style={[
                            styles.modelPill,
                            isSelected && styles.modelPillSelected,
                          ]}
                          onPress={() => setInputModel(m.id)}
                          activeOpacity={0.75}
                        >
                          <View
                            style={[
                              styles.modelPillDot,
                              { backgroundColor: isSelected ? COLORS.accentYellow : '#10B981' },
                            ]}
                          />
                          <Text
                            style={[
                              styles.modelPillText,
                              isSelected && styles.modelPillTextSelected,
                            ]}
                            numberOfLines={1}
                          >
                            {m.id}
                          </Text>
                          {isSelected && (
                            <CheckGlyph size={12} color={COLORS.accentYellow} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </View>

            {/* Section 3: Perilaku Asisten */}
            <View style={styles.sectionGroup}>
              <Text style={styles.sectionHeading}>PERILAKU ASISTEN</Text>

              <Input
                label='System Prompt (Opsional)'
                placeholder='contoh: Kamu adalah asisten AI yang ramah, ringkas, dan profesional...'
                value={inputSystemPrompt}
                onChangeText={setInputSystemPrompt}
                multiline
                inputContainerStyle={styles.textArea}
              />
            </View>

            {/* Actions: Save & Reset */}
            <View style={styles.actions}>
              <Button
                onPress={handleSave}
                disabled={isSaving}
                loading={isSaving}
                size='large'
                style={styles.saveBtn}
              >
                {isSaving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
              </Button>

              {isConfigured && (
                <TouchableOpacity
                  style={styles.resetBtn}
                  onPress={handleReset}
                  activeOpacity={0.7}
                >
                  <Text style={styles.resetBtnText}>Hapus Data Konfigurasi</Text>
                </TouchableOpacity>
              )}

              {error && <Text style={styles.errorText}>{error}</Text>}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surfaceContainer,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.6,
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSecondary,
    marginBottom: 20,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(255, 199, 44, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 199, 44, 0.25)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  noticeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accentYellow,
    marginTop: 5,
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.accentYellow,
    marginBottom: 2,
  },
  noticeText: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },
  sectionGroup: {
    marginBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: COLORS.textMuted,
    marginBottom: 14,
  },
  testBtnRow: {
    marginTop: 4,
    marginBottom: 8,
  },
  testBtn: {
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  testBtnLoading: {
    opacity: 0.6,
  },
  testBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  statusBox: {
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
  },
  statusBoxSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusBoxError: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  statusText: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textSecondary,
  },
  statusSuccessText: {
    color: '#10B981',
  },
  statusErrorText: {
    color: '#EF4444',
  },
  chipsContainer: {
    marginTop: 6,
  },
  chipsTitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  modelPillSelected: {
    backgroundColor: COLORS.accentYellowContainer,
    borderColor: 'rgba(255, 199, 44, 0.4)',
  },
  modelPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  modelPillText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    maxWidth: 200,
  },
  modelPillTextSelected: {
    color: COLORS.accentYellow,
    fontWeight: '600',
  },
  textArea: {
    minHeight: 100,
    alignItems: 'flex-start',
  },
  actions: {
    marginTop: 12,
    gap: 12,
    alignItems: 'center',
    width: '100%',
  },
  saveBtn: {
    width: '100%',
  },
  resetBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  resetBtnText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '500',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
});