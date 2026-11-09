import { createAudioPlayer, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import type { DrawResult } from './engine/types';

type SoundName = 'flip' | 'drink' | 'waterfall' | 'blip' | 'gameover';

const SOURCES: Record<SoundName, number> = {
  flip: require('../assets/sounds/flip.wav'),
  drink: require('../assets/sounds/drink.wav'),
  waterfall: require('../assets/sounds/waterfall.wav'),
  blip: require('../assets/sounds/blip.wav'),
  gameover: require('../assets/sounds/gameover.wav'),
};

let soundOn = true;
let hapticsOn = true;
const players: Partial<Record<SoundName, AudioPlayer>> = {};

export const isSoundOn = () => soundOn;
export const isHapticsOn = () => hapticsOn;
export const setSoundOn = (v: boolean) => { soundOn = v; };
export const setHapticsOn = (v: boolean) => { hapticsOn = v; };

/** Feedback must never break gameplay, so every call swallows errors. */
function play(name: SoundName) {
  if (!soundOn) return;
  try {
    const p = (players[name] ??= createAudioPlayer(SOURCES[name]));
    p.seekTo(0);
    p.play();
  } catch {}
}

function haptic(fn: () => Promise<void>) {
  if (!hapticsOn || Platform.OS === 'web') return;
  fn().catch(() => {});
}

const impact = (style: Haptics.ImpactFeedbackStyle) => haptic(() => Haptics.impactAsync(style));
const notify = (type: Haptics.NotificationFeedbackType) => haptic(() => Haptics.notificationAsync(type));

/** Runs when the draw button is pressed, as the card starts flipping. */
export function onDrawStart() {
  play('flip');
  impact(Haptics.ImpactFeedbackStyle.Light);
}

/** Runs when the card face is revealed. */
export function onReveal(r: DrawResult) {
  switch (r.rule.effect.type) {
    case 'everyone':
    case 'drawerDrinks':
    case 'group':
      play('drink');
      notify(Haptics.NotificationFeedbackType.Warning);
      break;
    case 'waterfall':
      play('waterfall');
      [0, 150, 300, 450, 600].forEach((ms) => setTimeout(() => impact(Haptics.ImpactFeedbackStyle.Heavy), ms));
      break;
    default: // give, miniGames, thumbmaster
      play('blip');
      notify(Haptics.NotificationFeedbackType.Success);
  }
  if (r.gameOver) {
    setTimeout(() => {
      play('gameover');
      notify(Haptics.NotificationFeedbackType.Error);
    }, 1400);
  }
}
