import { StyleSheet, Text, View } from 'react-native';
import { SUIT_SYMBOL } from '../engine/cards';
import type { Card, Rank } from '../engine/types';
import { colors } from '../theme';

export const CARD_ASPECT = 1.4; // height / width, like a real poker card

// Pip positions as [x, y] fractions of the pip area (0..1). Standard card layouts.
const L = 0, C = 0.5, R = 1;
const PIPS: Partial<Record<Rank, [number, number][]>> = {
  A: [[C, C]],
  '2': [[C, 0], [C, 1]],
  '3': [[C, 0], [C, C], [C, 1]],
  '4': [[L, 0], [R, 0], [L, 1], [R, 1]],
  '5': [[L, 0], [R, 0], [C, C], [L, 1], [R, 1]],
  '6': [[L, 0], [R, 0], [L, C], [R, C], [L, 1], [R, 1]],
  '7': [[L, 0], [R, 0], [C, 0.25], [L, C], [R, C], [L, 1], [R, 1]],
  '8': [[L, 0], [R, 0], [C, 0.25], [L, C], [R, C], [C, 0.75], [L, 1], [R, 1]],
  '9': [[L, 0], [R, 0], [L, 1 / 3], [R, 1 / 3], [C, C], [L, 2 / 3], [R, 2 / 3], [L, 1], [R, 1]],
  '10': [[L, 0], [R, 0], [C, 1 / 6], [L, 1 / 3], [R, 1 / 3], [L, 2 / 3], [R, 2 / 3], [C, 5 / 6], [L, 1], [R, 1]],
};

export function CardFace({ card, width }: { card: Card; width: number }) {
  const height = width * CARD_ASPECT;
  const red = card.suit === 'H' || card.suit === 'D';
  const ink = red ? colors.red : colors.black;
  const sym = SUIT_SYMBOL[card.suit];
  const idxFont = width * 0.17;
  const pip = width * 0.2;
  const area = { x: width * 0.26, y: height * 0.12, w: width * 0.48, h: height * 0.76 };
  const isFace = card.rank === 'J' || card.rank === 'Q' || card.rank === 'K';

  const Index = ({ flipped }: { flipped?: boolean }) => (
    <View
      style={[
        { position: 'absolute', alignItems: 'center', width: idxFont * 1.4 },
        flipped ? { right: width * 0.05, bottom: height * 0.03, transform: [{ rotate: '180deg' }] } : { left: width * 0.05, top: height * 0.03 },
      ]}
    >
      <Text style={{ color: ink, fontSize: idxFont, fontWeight: '800', lineHeight: idxFont * 1.05 }}>{card.rank}</Text>
      <Text style={{ color: ink, fontSize: idxFont * 0.85, lineHeight: idxFont * 0.95 }}>{sym}</Text>
    </View>
  );

  return (
    <View style={[s.face, { width, height, borderRadius: width * 0.07 }]}>
      <Index />
      <Index flipped />
      {isFace ? (
        <View
          style={{
            position: 'absolute', left: width * 0.3, top: area.y + height * 0.04, width: width * 0.4, height: area.h - height * 0.08,
            borderWidth: 2, borderColor: ink, borderRadius: 6, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6,
          }}
        >
          <Text style={{ color: ink, fontSize: pip }}>{sym}</Text>
          <Text style={{ color: ink, fontSize: width * 0.42, fontWeight: '900' }}>{card.rank}</Text>
          <Text style={{ color: ink, fontSize: pip, transform: [{ rotate: '180deg' }] }}>{sym}</Text>
        </View>
      ) : (
        (PIPS[card.rank] ?? []).map(([x, y], i) => {
          const size = card.rank === 'A' ? width * 0.55 : pip;
          return (
            <Text
              key={i}
              style={{
                position: 'absolute', color: ink, fontSize: size, lineHeight: size * 1.1, width: size * 1.2, textAlign: 'center',
                left: area.x + x * (area.w - size * 1.2),
                top: area.y + y * (area.h - size * 1.1),
                transform: y > 0.5 ? [{ rotate: '180deg' }] : undefined,
              }}
            >
              {sym}
            </Text>
          );
        })
      )}
    </View>
  );
}

export function CardBack({ width }: { width: number }) {
  const height = width * CARD_ASPECT;
  const r = width * 0.07;
  return (
    <View style={[s.back, { width, height, borderRadius: r }]}>
      <View style={[s.backInner, { borderRadius: r * 0.6 }]}>
        <Text style={{ color: colors.accent, fontSize: width * 0.2, fontWeight: '900', letterSpacing: 3 }}>FUBAR</Text>
        <Text style={{ color: 'rgba(255,255,255,0.22)', fontSize: width * 0.14, marginTop: 6 }}>♠ ♥ ♦ ♣</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  face: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: '#cfc7b4',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
    overflow: 'hidden',
  },
  back: {
    backgroundColor: '#fff',
    padding: 8,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  backInner: {
    flex: 1,
    backgroundColor: colors.cardBack,
    borderWidth: 3,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
