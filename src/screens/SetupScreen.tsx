import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import RulesModal from '../components/RulesModal';
import { RECOMMENDED_MIN_PLAYERS } from '../engine/game';
import type { Group } from '../engine/types';
import type { SavedGame } from '../save';
import { APP_NAME, APP_TAGLINE, colors } from '../theme';

interface Entry { name: string; group: Group }
const GROUPS: { value: Group; label: string }[] = [
  { value: 'guys', label: 'Guys' },
  { value: 'girls', label: 'Girls' },
  { value: 'other', label: 'Other' },
];

export default function SetupScreen({
  initialPlayers,
  saved,
  onStart,
  onResume,
  onDiscard,
}: {
  initialPlayers: Entry[];
  saved: SavedGame | null;
  onStart: (entries: Entry[]) => void;
  onResume: () => void;
  onDiscard: () => void;
}) {
  const [entries, setEntries] = useState<Entry[]>(() => {
    const base = initialPlayers.slice();
    while (base.length < RECOMMENDED_MIN_PLAYERS) base.push({ name: '', group: 'other' });
    return base;
  });
  const update = (i: number, patch: Partial<Entry>) =>
    setEntries((e) => e.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const filled = entries.filter((e) => e.name.trim().length > 0);
  const canStart = filled.length >= 2;

  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <ScrollView contentContainerStyle={s.wrap} keyboardShouldPersistTaps="handled">
      <Text style={s.title}>{APP_NAME}</Text>
      <Text style={s.tag}>{APP_TAGLINE}</Text>
      {saved && (
        <View style={s.resume}>
          <Text style={s.resumeTitle}>Game in progress</Text>
          <Text style={s.resumeSub}>
            {saved.state.players.length} players · {saved.state.deck.length} cards left
            {saved.state.over ? ' · finished' : ''}
          </Text>
          <Pressable style={s.resumeBtn} onPress={onResume}>
            <Text style={s.startText}>{saved.state.over ? 'View last card' : 'Resume game'}</Text>
          </Pressable>
          <Pressable onPress={onDiscard}><Text style={s.discard}>Discard saved game</Text></Pressable>
        </View>
      )}
      <Pressable onPress={() => setRulesOpen(true)} style={s.rulesLink}>
        <Text style={s.rulesLinkText}>How to play</Text>
      </Pressable>
      <RulesModal visible={rulesOpen} onClose={() => setRulesOpen(false)} />
      <Text style={s.hint}>Add players in seating order. Pick a group for the Jack/Queen cards.</Text>
      {entries.map((e, i) => (
        <View key={i} style={s.row}>
          <TextInput
            style={s.input}
            placeholder={`Player ${i + 1}`}
            placeholderTextColor={colors.muted}
            value={e.name}
            onChangeText={(t) => update(i, { name: t })}
            maxLength={16}
          />
          <View style={s.groups}>
            {GROUPS.map((g) => (
              <Pressable
                key={g.value}
                onPress={() => update(i, { group: g.value })}
                style={[s.chip, e.group === g.value && s.chipOn]}
              >
                <Text style={[s.chipText, e.group === g.value && s.chipTextOn]}>{g.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      ))}
      <Pressable style={s.add} onPress={() => setEntries((e) => [...e, { name: '', group: 'other' }])}>
        <Text style={s.addText}>+ Add player</Text>
      </Pressable>
      {canStart && filled.length < RECOMMENDED_MIN_PLAYERS && (
        <Text style={s.warn}>Works best with {RECOMMENDED_MIN_PLAYERS}+ players.</Text>
      )}
      <Pressable
        style={[s.start, !canStart && { opacity: 0.4 }]}
        disabled={!canStart}
        onPress={() => onStart(filled)}
      >
        <Text style={s.startText}>{saved ? 'Start new game' : 'Start game'}</Text>
      </Pressable>
      <Text style={s.legal}>18+ only. Drink responsibly. Never drink and drive.</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  wrap: { padding: 20, paddingTop: 60, gap: 12 },
  title: { color: colors.accent, fontSize: 56, fontWeight: '900', textAlign: 'center', letterSpacing: 4 },
  tag: { color: colors.accent2, textAlign: 'center', fontSize: 13, marginBottom: 8 },
  hint: { color: colors.muted, textAlign: 'center', marginBottom: 8 },
  row: { backgroundColor: colors.panel, borderRadius: 12, padding: 10, gap: 8 },
  input: { color: colors.text, fontSize: 18, paddingVertical: 6 },
  groups: { flexDirection: 'row', gap: 8 },
  chip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: colors.muted },
  chipOn: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.muted },
  chipTextOn: { color: colors.onAccent, fontWeight: '700' },
  add: { padding: 12, alignItems: 'center' },
  addText: { color: colors.accent2, fontSize: 16 },
  warn: { color: colors.accent2, textAlign: 'center' },
  start: { backgroundColor: colors.accent, borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 8 },
  startText: { color: colors.onAccent, fontSize: 20, fontWeight: '800' },
  resume: { backgroundColor: colors.panel, borderRadius: 14, padding: 16, gap: 8, borderWidth: 1, borderColor: colors.accent },
  resumeTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  resumeSub: { color: colors.muted },
  resumeBtn: { backgroundColor: colors.accent, borderRadius: 12, padding: 14, alignItems: 'center' },
  discard: { color: colors.muted, textAlign: 'center', textDecorationLine: 'underline', paddingTop: 4 },
  rulesLink: { alignSelf: 'center', paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: colors.accent2 },
  rulesLinkText: { color: colors.accent2, fontSize: 14, fontWeight: '600' },
  legal: { color: colors.muted, textAlign: 'center', fontSize: 12, marginTop: 12 },
});
