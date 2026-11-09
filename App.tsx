import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { createGame, makePlayers } from './src/engine/game';
import type { DrawResult, GameState, Group } from './src/engine/types';
import { setHapticsOn, setSoundOn } from './src/feedback';
import type { PlayerPref, SavedGame } from './src/save';
import GameScreen from './src/screens/GameScreen';
import SetupScreen from './src/screens/SetupScreen';
import { clearSavedGame, loadPrefs, loadSavedGame, saveGame, savePrefs } from './src/storage';
import { colors } from './src/theme';

type Screen =
  | { name: 'loading' }
  | { name: 'setup' }
  | { name: 'game'; game: GameState; result: DrawResult | null }
  | { name: 'over' };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'loading' });
  const [saved, setSaved] = useState<SavedGame | null>(null);
  const [players, setPlayers] = useState<PlayerPref[]>([]);

  useEffect(() => {
    (async () => {
      const [save, prefs] = await Promise.all([loadSavedGame(), loadPrefs()]);
      setSaved(save);
      if (prefs) {
        setPlayers(prefs.players);
        setSoundOn(prefs.sound);
        setHapticsOn(prefs.sound);
      }
      setScreen({ name: 'setup' });
    })();
  }, []);

  const start = (entries: { name: string; group: Group }[]) => {
    const game = createGame(makePlayers(entries));
    setPlayers(entries);
    setSaved(null);
    savePrefs(entries, true);
    saveGame(game, null); // replaces any older save
    setScreen({ name: 'game', game, result: null });
  };

  const resume = () => {
    if (saved) setScreen({ name: 'game', game: saved.state, result: saved.result });
  };

  const discard = () => {
    setSaved(null);
    clearSavedGame();
  };

  const onProgress = (state: GameState, result: DrawResult) => {
    saveGame(state, result);
    setSaved({ version: 1, savedAt: Date.now(), state, result });
  };

  const finish = () => {
    setSaved(null);
    clearSavedGame();
    setScreen({ name: 'over' });
  };

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      {screen.name === 'setup' && (
        <SetupScreen
          initialPlayers={players}
          saved={saved}
          onStart={start}
          onResume={resume}
          onDiscard={discard}
        />
      )}
      {screen.name === 'game' && (
        <GameScreen
          initial={screen.game}
          initialResult={screen.result}
          onProgress={onProgress}
          onEnd={finish}
          onQuit={() => setScreen({ name: 'setup' })}
          onSoundChange={(on) => savePrefs(players, on)}
        />
      )}
      {screen.name === 'over' && (
        <View style={s.over}>
          <Text style={s.overTitle}>Game over</Text>
          <Text style={s.overSub}>Finish your drink. Get home safe.</Text>
          <Pressable style={s.btn} onPress={() => setScreen({ name: 'setup' })}>
            <Text style={s.btnText}>New game</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  over: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 24 },
  overTitle: { color: colors.accent, fontSize: 48, fontWeight: '900' },
  overSub: { color: colors.muted, fontSize: 16 },
  btn: { backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 16, paddingHorizontal: 36 },
  btnText: { color: colors.onAccent, fontSize: 20, fontWeight: '800' },
});
