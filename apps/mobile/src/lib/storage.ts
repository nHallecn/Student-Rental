import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export async function getStored(key: string) {
  if (Platform.OS === 'web') return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

export async function setStored(key: string, value: string) {
  if (Platform.OS === 'web') return localStorage.setItem(key, value);
  return SecureStore.setItemAsync(key, value, { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK });
}

export async function removeStored(key: string) {
  if (Platform.OS === 'web') return localStorage.removeItem(key);
  return SecureStore.deleteItemAsync(key);
}

