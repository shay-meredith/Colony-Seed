import type { AppContext } from '../app/context';
import { clear, h } from '../core/dom';
import { SPEEDS, type ClockSnapshot, type PauseReason } from '../sim/clock';
import { formatCountdown, formatMissionTime } from '../sim/time';
import { icon } from './icons';

const PAUSE_LABEL: Record<PauseReason, string> = {
  initial: 'Paused',
  player: 'Paused',
  hidden: 'Paused · app was backgrounded',
  event: 'Auto-paused',
  arrival: 'Colonists arrived',
};

/** Pauseable-realtime controls: play/pause, speed, mission clock, arrival countdown. */
export function createTimeBar(ctx: AppContext): HTMLElement {
  const { clock } = ctx;

  const playBtn = h('button', {
    type: 'button',
    class: 'timebar__play',
    onClick: () => clock.toggle(),
  });

  const speedBtns = SPEEDS.map((speed) =>
    h(
      'button',
      {
        type: 'button',
        class: 'seg__btn',
        'aria-label': `Speed ${speed}×`,
        onClick: () => clock.setSpeed(speed),
      },
      `${speed}×`,
    ),
  );

  const status = h('p', { class: 'timebar__status', 'aria-live': 'polite' });
  const mission = h('span', { class: 'timebar__mission' });
  const countdown = h('span', { class: 'timebar__countdown' });

  const root = h(
    'div',
    { class: 'timebar', role: 'region', 'aria-label': 'Time controls' },
    playBtn,
    h('div', { class: 'seg', role: 'group', 'aria-label': 'Simulation speed' }, ...speedBtns),
    h('div', { class: 'timebar__clock' }, countdown, mission),
    status,
  );

  let lastPausedKey = '';
  const render = (snap: ClockSnapshot) => {
    const pausedKey = `${snap.paused}|${snap.pauseReason}|${snap.pauseDetail}|${snap.speed}`;
    if (pausedKey !== lastPausedKey) {
      lastPausedKey = pausedKey;
      clear(playBtn);
      playBtn.append(icon(snap.paused ? 'play' : 'pause'));
      playBtn.setAttribute('aria-label', snap.paused ? 'Resume time' : 'Pause time');
      playBtn.disabled = snap.pauseReason === 'arrival';
      root.classList.toggle('is-paused', snap.paused);
      root.classList.toggle('is-alert', snap.pauseReason === 'event' || snap.pauseReason === 'hidden');
      speedBtns.forEach((btn, i) => btn.setAttribute('aria-pressed', String(SPEEDS[i] === snap.speed)));

      const label = snap.paused && snap.pauseReason ? PAUSE_LABEL[snap.pauseReason] : `Live · ${snap.speed}×`;
      status.textContent = snap.pauseReason === 'event' && snap.pauseDetail ? `${label} · ${snap.pauseDetail}` : label;
    }
    countdown.textContent = formatCountdown(snap.arrivalHours - snap.simHours);
    mission.textContent = formatMissionTime(snap.simHours);
  };

  render(clock.snapshot);
  clock.onChange(render);
  return root;
}
