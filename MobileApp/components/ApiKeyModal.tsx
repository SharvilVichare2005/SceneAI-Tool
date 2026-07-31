/**
 * API Key Management Modal
 * Allows users to add, remove, and select Moondream API keys
 */

import React, { useState } from 'react';
import {
    Modal,
    StyleSheet,
    View,
    TextInput,
    TouchableOpacity,
    FlatList,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInUp, SlideOutDown } from 'react-native-reanimated';
import { Colors } from '@/constants/theme';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useApiKey, ApiKeyEntry } from '@/context/ApiKeyContext';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface ApiKeyModalProps {
    visible: boolean;
    onClose: () => void;
}

export function ApiKeyModal({ visible, onClose }: ApiKeyModalProps) {
    const { colorScheme, isDark } = useTheme();
    const { t } = useLanguage();
    const colors = Colors[colorScheme];
    const { apiKeys, activeKeyId, addApiKey, removeApiKey, setActiveKey } = useApiKey();

    const [isAdding, setIsAdding] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyValue, setNewKeyValue] = useState('');

    const handleAddKey = async () => {
        if (!newKeyValue.trim()) {
            Alert.alert('Error', t('apiKeyValue') + ' ' + t('permissionRequired'));
            return;
        }

        await addApiKey(newKeyName, newKeyValue);
        setNewKeyName('');
        setNewKeyValue('');
        setIsAdding(false);
    };

    const handleDeleteKey = (item: ApiKeyEntry) => {
        Alert.alert(
            t('deleteKey'),
            `${item.name}?`,
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('deleteKey'),
                    style: 'destructive',
                    onPress: () => removeApiKey(item.id),
                },
            ]
        );
    };

    const handleSelectKey = async (id: string) => {
        await setActiveKey(id);
    };

    const renderKeyItem = ({ item }: { item: ApiKeyEntry }) => {
        const isActive = item.id === activeKeyId;
        const keyPreview = item.key.length > 20
            ? `${item.key.substring(0, 8)}...${item.key.substring(item.key.length - 8)}`
            : item.key;

        return (
            <Animated.View entering={FadeIn} exiting={FadeOut}>
                <TouchableOpacity
                    style={[
                        styles.keyItem,
                        {
                            backgroundColor: isDark ? colors.backgroundSecondary : colors.card,
                            borderColor: isActive ? colors.success : colors.border,
                            borderWidth: isActive ? 2 : 1,
                        },
                    ]}
                    onPress={() => handleSelectKey(item.id)}
                    activeOpacity={0.7}
                >
                    <View style={styles.keyInfo}>
                        <View style={styles.keyHeader}>
                            <ThemedText style={styles.keyName}>{item.name}</ThemedText>
                            {isActive && (
                                <View style={[styles.activeBadge, { backgroundColor: colors.success }]}>
                                    <ThemedText style={styles.activeBadgeText}>{t('activeKey')}</ThemedText>
                                </View>
                            )}
                        </View>
                        <ThemedText style={[styles.keyPreview, { color: colors.textSecondary }]}>
                            {keyPreview}
                        </ThemedText>
                        <ThemedText style={[styles.keyDate, { color: colors.textSecondary }]}>
                            {new Date(item.createdAt).toLocaleDateString()}
                        </ThemedText>
                    </View>
                    <TouchableOpacity
                        style={[styles.deleteButton, { backgroundColor: colors.error + '20' }]}
                        onPress={() => handleDeleteKey(item)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <IconSymbol name="trash.fill" size={18} color={colors.error} />
                    </TouchableOpacity>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <IconSymbol name="key.fill" size={48} color={colors.textSecondary} />
            <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t('noApiKeys')}
            </ThemedText>
        </View>
    );

    const renderAddForm = () => (
        <Animated.View
            entering={SlideInUp.springify()}
            exiting={SlideOutDown}
            style={[styles.addForm, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
        >
            <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder={t('apiKeyName')}
                placeholderTextColor={colors.textSecondary}
                value={newKeyName}
                onChangeText={setNewKeyName}
            />
            <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                placeholder={t('apiKeyValue')}
                placeholderTextColor={colors.textSecondary}
                value={newKeyValue}
                onChangeText={setNewKeyValue}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
            />
            <View style={styles.formButtons}>
                <TouchableOpacity
                    style={[styles.formButton, { backgroundColor: colors.border }]}
                    onPress={() => {
                        setIsAdding(false);
                        setNewKeyName('');
                        setNewKeyValue('');
                    }}
                >
                    <ThemedText style={styles.formButtonText}>{t('cancel')}</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.formButton, { backgroundColor: colors.primary }]}
                    onPress={handleAddKey}
                >
                    <ThemedText style={[styles.formButtonText, { color: '#FFFFFF' }]}>{t('confirm')}</ThemedText>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                style={[styles.container, { backgroundColor: colors.background }]}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <ThemedText type="subtitle" style={styles.headerTitle}>
                        {t('apiKeyManagement')}
                    </ThemedText>
                    <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <IconSymbol name="xmark.circle.fill" size={28} color={colors.textSecondary} />
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={styles.content}>
                    {isAdding ? (
                        renderAddForm()
                    ) : (
                        <>
                            <FlatList
                                data={apiKeys}
                                keyExtractor={(item) => item.id}
                                renderItem={renderKeyItem}
                                contentContainerStyle={styles.listContent}
                                ListEmptyComponent={renderEmptyState}
                                showsVerticalScrollIndicator={false}
                            />

                            {/* Add Button */}
                            <TouchableOpacity
                                style={[styles.addButton, { backgroundColor: colors.primary }]}
                                onPress={() => setIsAdding(true)}
                            >
                                <IconSymbol name="plus" size={24} color="#FFFFFF" />
                                <ThemedText style={styles.addButtonText}>{t('addApiKey')}</ThemedText>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    listContent: {
        paddingBottom: 100,
        flexGrow: 1,
    },
    keyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
    },
    keyInfo: {
        flex: 1,
    },
    keyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    keyName: {
        fontSize: 16,
        fontWeight: '600',
    },
    activeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    activeBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    keyPreview: {
        fontSize: 13,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        marginBottom: 4,
    },
    keyDate: {
        fontSize: 12,
    },
    deleteButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
    },
    addButton: {
        position: 'absolute',
        bottom: 30,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 16,
        borderRadius: 16,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    addForm: {
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
    },
    input: {
        height: 50,
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 12,
        fontSize: 16,
        borderWidth: 1,
    },
    formButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    formButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    formButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default ApiKeyModal;
