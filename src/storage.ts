import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DrawResult, GameState } from './engine/types';
import { decodePrefs, decodeSave, encodePrefs, encodeSave, type PlayerPref, type Prefs, type SavedGame } from './save';

const GAME_KEY = 'fubar.game.v1';
const PREFS_KEY = 'fubar.prefs.v1';

/** Storage can fail (full disk, private mode); the game must keep working regardless. */
export async function loadSavedGame(): Promise<SavedGame | null> {
  try {
    return decodeSave(await AsyncStorage.getItem(GAME_KEY));
  } catch {
    return null;
  }
}

export async function saveGame(state: GameState, result: DrawResult | null): Promise<void> {
  try {
    await AsyncStorage.setItem(GAME_KEY, encodeSave(state, result));
  } catch {}
}

export async function clearSavedGame(): Promise<void> {
  try {
    await AsyncStorage.removeItem(GAME_KEY);
  } catch {}
}

export async function loadPrefs(): Promise<Prefs | null> {
  try {
    return decodePrefs(await AsyncStorage.getItem(PREFS_KEY));
  } catch {
    return null;
  }
}

export async function savePrefs(players: PlayerPref[], sound: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFS_KEY, encodePrefs({ players, sound }));
  } catch {}
}
