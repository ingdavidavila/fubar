import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CARD_RULES, RANKS } from '../engine/cards';
import { DEFAULT_CONFIG } from '../engine/game';
import { colors } from '../theme';

/** Built from CARD_RULES, so the in-app rules can never drift from the game's actual cards. */
export default function RulesModal({
  visible,
  onClose,
  kingsToEnd = DEFAULT_CONFIG.kingsToEnd,
}: {
  visible: boolean;
  onClose: () => void;
  kingsToEnd?: number;
}) {
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={s.root}>
        <View style={s.header}>
          <Text style={s.title}>How to play</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close rules">
            <Text style={s.done}>Done</Text>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={s.body}>
          <Text style={s.h}>The basics</Text>
          <Text style={s.p}>
            Sit in a circle and pass the phone around. On your turn, tap the deck to draw a card and do what it says.
            The app tells you who drinks, but the table decides who loses the mini-games.
          </Text>

          <Text style={s.h}>The cards</Text>
          {RANKS.map((rank) => {
            const rule = CARD_RULES[rank];
            return (
              <View key={rank} style={s.row}>
                <View style={s.badge}>
                  <Text style={s.badgeText}>{rank}</Text>
                </View>
                <View style={s.rowText}>
                  <Text style={s.name}>{rule.name}</Text>
                  <Text style={s.desc}>{rule.description}</Text>
                </View>
              </View>
            );
          })}

          <Text style={s.h}>Good to know</Text>
          <Text style={s.p}>
            • Jack and Queen use the groups you pick in setup. Players set to “Other” skip both.{'\n'}
            • A new Thumbmaster (another 7) replaces the old one.{'\n'}
            • The game ends when the {ordinal(kingsToEnd)} King is drawn, or the deck runs out.{'\n'}
            • Your game saves automatically. Reopen the app to resume.
          </Text>

          <Text style={s.legal}>
            18+ only. Drink responsibly, know your limits, and never drink and drive. Skip a drink any time.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

function ordinal(n: number): string {
  const names = ['', '1st', '2nd', '3rd', '4th'];
  return names[n] ?? `${n}th`;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: colors.panel,
  },
  title: { color: colors.text, fontSize: 26, fontWeight: '900' },
  done: { color: colors.accent, fontSize: 18, fontWeight: '700' },
  body: { padding: 20, gap: 12 },
  h: { color: colors.accent, fontSize: 14, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 8 },
  p: { color: colors.text, fontSize: 16, lineHeight: 24 },
  row: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', backgroundColor: colors.panel, borderRadius: 12, padding: 12 },
  badge: {
    width: 44, height: 58, borderRadius: 6, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: '#17191f', fontSize: 20, fontWeight: '900' },
  rowText: { flex: 1, gap: 2 },
  name: { color: colors.text, fontSize: 17, fontWeight: '800' },
  desc: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  legal: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 12, marginBottom: 24 },
});
