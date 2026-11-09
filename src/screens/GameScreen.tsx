import { useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { CARD_ASPECT, CardBack, CardFace } from '../components/PlayingCard';
import RulesModal from '../components/RulesModal';
import { currentPlayer, drawCard } from '../engine/game';
import { isSoundOn, onDrawStart, onReveal, setHapticsOn, setSoundOn } from '../feedback';
import type { DrawResult, GameState } from '../engine/types';
import { colors } from '../theme';

function describe(r: DrawResult): string[] {
  const names = (ps: { name: string }[]) => ps.map((p) => p.name).join(', ') || 'Nobody';
  const lines: string[] = [];
  switch (r.rule.effect.type) {
    case 'everyone':
      lines.push('Everybody drinks!');
      break;
    case 'drawerDrinks':
      lines.push(`${r.drawer.name} drinks ${r.drinksEach}.`);
      break;
    case 'give':
      lines.push(`${r.drawer.name} gives out ${r.toGive} drinks.`);
      break;
    case 'group':
      lines.push(r.drinkers.length ? `Drinking: ${names(r.drinkers)}` : 'Nobody is in that group, so no one drinks.');
      break;
    case 'thumbmaster':
      lines.push(`${r.drawer.name} is the Thumbmaster.`);
      break;
    case 'waterfall':
      lines.push(`Order: ${r.waterfallOrder.map((p) => p.name).join(' → ')}`);
      break;
    case 'miniGame':
      lines.push(`${r.drawer.name} starts.`);
      if (r.prompt) {
        const label = r.rule.effect.game === 'categories' ? 'Category' : r.rule.effect.game === 'rhyme' ? 'Rhyme with' : 'Idea';
        lines.push(`${label}: ${r.prompt}`);
      }
      lines.push('Loser drinks.');
      break;
  }
  return lines;
}

export default function GameScreen({
  initial,
  initialResult,
  onProgress,
  onEnd,
  onQuit,
  onSoundChange,
}: {
  initial: GameState;
  initialResult: DrawResult | null;
  onProgress: (state: GameState, result: DrawResult) => void;
  onEnd: () => void;
  onQuit: () => void;
  onSoundChange: (on: boolean) => void;
}) {
  const [state, setState] = useState(initial);
  const [result, setResult] = useState<DrawResult | null>(initialResult);
  const [fx, setFx] = useState(isSoundOn());
  const [rulesOpen, setRulesOpen] = useState(false);
  const toggleFx = () => {
    const next = !fx;
    setFx(next);
    setSoundOn(next);
    setHapticsOn(next);
    onSoundChange(next);
  };
  const flip = useRef(new Animated.Value(initialResult ? 1 : 0)).current;
  const { width: sw, height: sh } = useWindowDimensions();
  const cardW = Math.min(sw - 100, (sh * 0.46) / CARD_ASPECT, 280);

  const draw = () => {
    if (state.over) return;
    const out = drawCard(state);
    setState(out.state);
    setResult(out.result);
    onProgress(out.state, out.result);
    onDrawStart();
    setTimeout(() => onReveal(out.result), 280); // card face turns up around mid-flip
    flip.setValue(0);
    Animated.timing(flip, { toValue: 1, duration: 550, useNativeDriver: true }).start();
  };

  const next = currentPlayer(state);
  const thumb = state.players.find((p) => p.id === state.thumbmasterId);
  const backRot = flip.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const faceRot = flip.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const infoOpacity = flip.interpolate({ inputRange: [0.6, 1], outputRange: [0, 1], extrapolate: 'clamp' });
  const hide = { backfaceVisibility: 'hidden' as const };

  return (
    <View style={s.wrap}>
      <View style={s.top}>
        <View style={s.left}>
          <Pressable onPress={onQuit}><Text style={s.link}>Quit</Text></Pressable>
          <Pressable onPress={toggleFx} accessibilityLabel={fx ? 'Mute sound and vibration' : 'Unmute sound and vibration'}>
            <Text style={s.fx}>{fx ? '🔊' : '🔇'}</Text>
          </Pressable>
          <Pressable onPress={() => setRulesOpen(true)} accessibilityLabel="Show rules">
            <Text style={s.help}>?</Text>
          </Pressable>
        </View>
        <Text style={s.meta}>Cards left: {state.deck.length} · Kings: {state.kingsDrawn}/{state.config.kingsToEnd}</Text>
      </View>
      <RulesModal visible={rulesOpen} onClose={() => setRulesOpen(false)} kingsToEnd={state.config.kingsToEnd} />
      {thumb && <Text style={s.thumb}>👍 Thumbmaster: {thumb.name}</Text>}

      <ScrollView contentContainerStyle={s.center}>
        <Pressable
          onPress={state.over ? undefined : draw}
          style={{ width: cardW, height: cardW * CARD_ASPECT, alignSelf: 'center' }}
        >
          {result ? (
            <>
              <Animated.View style={[StyleSheet.absoluteFill, hide, { transform: [{ perspective: 1000 }, { rotateY: backRot }] }]}>
                <CardBack width={cardW} />
              </Animated.View>
              <Animated.View style={[StyleSheet.absoluteFill, hide, { transform: [{ perspective: 1000 }, { rotateY: faceRot }] }]}>
                <CardFace card={result.card} width={cardW} />
              </Animated.View>
            </>
          ) : (
            <CardBack width={cardW} />
          )}
        </Pressable>
        {result ? (
          <Animated.View style={[s.info, { opacity: infoOpacity }]}>
            <Text style={s.name}>{result.rule.name}</Text>
            <Text style={s.desc}>{result.rule.description}</Text>
            {describe(result).map((l, i) => (
              <Text key={i} style={s.line}>{l}</Text>
            ))}
          </Animated.View>
        ) : (
          <Text style={s.start}>Tap the deck to draw your first card.</Text>
        )}
      </ScrollView>

      {state.over ? (
        <Pressable style={s.btn} onPress={onEnd}><Text style={s.btnText}>Game over: see results</Text></Pressable>
      ) : (
        <Pressable style={s.btn} onPress={draw}>
          <Text style={s.btnText}>{next.name}: draw a card</Text>
        </Pressable>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 20, paddingTop: 56, gap: 12 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  left: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  fx: { fontSize: 20 },
  help: { color: colors.accent2, fontSize: 18, fontWeight: '800', borderWidth: 1.5, borderColor: colors.accent2, borderRadius: 12, width: 24, height: 24, textAlign: 'center', lineHeight: 21 },
  link: { color: colors.accent2, fontSize: 16 },
  meta: { color: colors.muted },
  thumb: { color: colors.accent2, textAlign: 'center', fontWeight: '700' },
  center: { flexGrow: 1, justifyContent: 'center', gap: 18 },
  start: { color: colors.muted, textAlign: 'center', fontSize: 18 },
  info: { alignItems: 'center', gap: 6, paddingHorizontal: 8 },
  name: { fontSize: 26, fontWeight: '900', color: colors.text },
  desc: { fontSize: 14, color: colors.muted, textAlign: 'center' },
  line: { fontSize: 18, fontWeight: '800', color: colors.accent, textAlign: 'center' },
  btn: { backgroundColor: colors.accent, borderRadius: 14, padding: 20, alignItems: 'center' },
  btnText: { color: colors.onAccent, fontSize: 20, fontWeight: '800' },
});
