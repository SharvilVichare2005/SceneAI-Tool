/**
 * API Key Context for managing Moondream API keys
 * Provides key storage, selection, and persistence via AsyncStorage
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Storage keys
const STORAGE_KEYS = {
    API_KEYS: '@moondream_api_keys',
    ACTIVE_KEY_ID: '@moondream_active_key_id',
};

// Types
export interface ApiKeyEntry {
    id: string;
    name: string;
    key: string;
    createdAt: string;
}

interface ApiKeyContextType {
    apiKeys: ApiKeyEntry[];
    activeKeyId: string | null;
    activeKey: string | null;
    isLoading: boolean;
    addApiKey: (name: string, key: string) => Promise<void>;
    removeApiKey: (id: string) => Promise<void>;
    setActiveKey: (id: string) => Promise<void>;
    getActiveApiKey: () => string | null;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

// Generate unique ID
const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export function ApiKeyProvider({ children }: { children: React.ReactNode }) {
    const [apiKeys, setApiKeys] = useState<ApiKeyEntry[]>([]);
    const [activeKeyId, setActiveKeyId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load keys from storage on mount
    useEffect(() => {
        loadFromStorage();
    }, []);

    const loadFromStorage = async () => {
        try {
            const [keysJson, activeId] = await Promise.all([
                AsyncStorage.getItem(STORAGE_KEYS.API_KEYS),
                AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_KEY_ID),
            ]);

            if (keysJson) {
                setApiKeys(JSON.parse(keysJson));
            }
            if (activeId) {
                setActiveKeyId(activeId);
            }
        } catch (error) {
            console.error('Failed to load API keys from storage:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const saveKeysToStorage = async (keys: ApiKeyEntry[]) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.API_KEYS, JSON.stringify(keys));
        } catch (error) {
            console.error('Failed to save API keys:', error);
        }
    };

    const saveActiveKeyToStorage = async (keyId: string | null) => {
        try {
            if (keyId) {
                await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_KEY_ID, keyId);
            } else {
                await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_KEY_ID);
            }
        } catch (error) {
            console.error('Failed to save active key ID:', error);
        }
    };

    const addApiKey = useCallback(async (name: string, key: string) => {
        const newEntry: ApiKeyEntry = {
            id: generateId(),
            name: name.trim() || `Key ${apiKeys.length + 1}`,
            key: key.trim(),
            createdAt: new Date().toISOString(),
        };

        const updatedKeys = [...apiKeys, newEntry];
        setApiKeys(updatedKeys);
        await saveKeysToStorage(updatedKeys);

        // If this is the first key, make it active automatically
        if (apiKeys.length === 0) {
            setActiveKeyId(newEntry.id);
            await saveActiveKeyToStorage(newEntry.id);
        }
    }, [apiKeys]);

    const removeApiKey = useCallback(async (id: string) => {
        const updatedKeys = apiKeys.filter(k => k.id !== id);
        setApiKeys(updatedKeys);
        await saveKeysToStorage(updatedKeys);

        // If we removed the active key, clear it or set to first available
        if (activeKeyId === id) {
            const newActiveId = updatedKeys.length > 0 ? updatedKeys[0].id : null;
            setActiveKeyId(newActiveId);
            await saveActiveKeyToStorage(newActiveId);
        }
    }, [apiKeys, activeKeyId]);

    const setActiveKey = useCallback(async (id: string) => {
        const keyExists = apiKeys.some(k => k.id === id);
        if (keyExists) {
            setActiveKeyId(id);
            await saveActiveKeyToStorage(id);
        }
    }, [apiKeys]);

    const getActiveApiKey = useCallback((): string | null => {
        if (activeKeyId) {
            const activeEntry = apiKeys.find(k => k.id === activeKeyId);
            if (activeEntry?.key) return activeEntry.key;
        }
        
        // Fallback to Env variables
        return Constants.expoConfig?.extra?.moondreamApiKey || 
               process.env.EXPO_PUBLIC_MOONDREAM_API_KEY || 
               process.env.MOONDREAM_API_KEY || 
               null;
    }, [apiKeys, activeKeyId]);

    const activeKey = getActiveApiKey();

    const value: ApiKeyContextType = {
        apiKeys,
        activeKeyId,
        activeKey,
        isLoading,
        addApiKey,
        removeApiKey,
        setActiveKey,
        getActiveApiKey,
    };

    return (
        <ApiKeyContext.Provider value={value}>
            {children}
        </ApiKeyContext.Provider>
    );
}

export function useApiKey() {
    const context = useContext(ApiKeyContext);
    if (context === undefined) {
        throw new Error('useApiKey must be used within an ApiKeyProvider');
    }
    return context;
}

export default ApiKeyContext;
