import AsyncStorage from '@react-native-async-storage/async-storage';
import * as aesjs from 'aes-js';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

// Supabase speichert hier die Auth-Session (u.a. Refresh-Token) - reines
// AsyncStorage waere Klartext auf dem Geraet (SharedPreferences/Plist,
// per ADB-Backup oder auf einem gerooteten Geraet auslesbar). SecureStore
// (Android Keystore/iOS Keychain) waere sicher, hat aber ein ~2048-Byte-
// Limit pro Wert, das eine Supabase-Session ueberschreiten kann.
//
// Deshalb das von Supabase selbst dokumentierte Hybrid-Pattern: der
// Session-Wert wird mit einem zufaelligen AES-Schluessel verschluesselt,
// das (kleine, feste) Schluessel-Material liegt in SecureStore, nur der
// verschluesselte Blob (beliebig gross) landet in AsyncStorage.
class SecureSessionStorage {
  private async encrypt(key: string, value: string): Promise<string> {
    const encryptionKey = await Crypto.getRandomBytesAsync(32);
    const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
    const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));

    await SecureStore.setItemAsync(key, aesjs.utils.hex.fromBytes(encryptionKey));
    return aesjs.utils.hex.fromBytes(encryptedBytes);
  }

  private async decrypt(key: string, value: string): Promise<string | null> {
    const encryptionKeyHex = await SecureStore.getItemAsync(key);
    if (!encryptionKeyHex) return null;

    const cipher = new aesjs.ModeOfOperation.ctr(aesjs.utils.hex.toBytes(encryptionKeyHex), new aesjs.Counter(1));
    const decryptedBytes = cipher.decrypt(aesjs.utils.hex.toBytes(value));
    return aesjs.utils.utf8.fromBytes(decryptedBytes);
  }

  async getItem(key: string): Promise<string | null> {
    const encrypted = await AsyncStorage.getItem(key);
    if (!encrypted) return null;

    try {
      return await this.decrypt(key, encrypted);
    } catch {
      // Passender SecureStore-Schluessel fehlt (z.B. Restdaten aus der Zeit
      // vor diesem Wechsel, oder App-Neuinstallation ohne Keystore-Backup) -
      // nicht entschluesselbare Reste verwerfen statt einen Login-Loop zu riskieren.
      await this.removeItem(key);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    const encrypted = await this.encrypt(key, value);
    await AsyncStorage.setItem(key, encrypted);
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(key);
  }
}

export const secureSessionStorage = new SecureSessionStorage();
