// On-screen buttons for playing without a mouse, as in Kaplan Macerası and Bebek Ejderha. They press
// the same keys as the keyboard. They show from the start when the device has no mouse and from the
// first real touch when it has one; the Home key switches them by hand. The camera follows the
// megalodon by itself, so a finger on the picture does not turn it.

const PAD_DEAD_ZONE = 0.25; // of the pad's radius
const PAD_DIAGONAL = 0.414; // tan 22.5°: past this, the pad presses both of the neighbouring keys
const PAD_KEYS = ['KeyW', 'KeyS', 'KeyA', 'KeyD'];

let touchControls = !matchMedia('(any-pointer: fine)').matches;
document.body.classList.toggle('touch', touchControls);

function setTouchControls(on) {
  touchControls = on;
  document.body.classList.toggle('touch', on);
  Input.keys = {};
  if (on) document.exitPointerLock?.();
}

window.addEventListener('keydown', (e) => {
  if (e.code !== 'Home' || e.repeat) return;
  setTouchControls(!touchControls);
  e.preventDefault();
});
window.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'touch' && !touchControls) setTouchControls(true);
}, { capture: true });
// A finger only counts as permission for sound when it lifts.
document.addEventListener('touchend', () => Sound.unlock());
// A long press must not open the browser's menu or start selecting, wherever the finger is.
document.addEventListener('contextmenu', (e) => {
  if (touchControls) e.preventDefault();
});
document.addEventListener('selectstart', (e) => e.preventDefault());
const keepTouchFromBrowser = (e) => e.preventDefault();

const touchLayer = document.getElementById('touch-controls');
touchLayer.addEventListener('touchstart', keepTouchFromBrowser, { passive: false });
// Without this a tap on the picture would also count as a mouse click, which bites.
document.getElementById('game').addEventListener('touchstart', keepTouchFromBrowser, { passive: false });

const heldControls = [];
for (const button of touchLayer.querySelectorAll('[data-key]')) {
  const release = () => {
    Input.keys[button.dataset.key] = false;
    button.classList.remove('pressed');
  };
  button.addEventListener('pointerdown', (e) => {
    button.setPointerCapture(e.pointerId);
    pressKey(button.dataset.key);
    button.classList.add('pressed');
  });
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
  heldControls.push({ element: button, release });
}

// The pad is one surface rather than four buttons, so a thumb can slide round it and press diagonals.
const pad = document.getElementById('touch-pad');
const padArrows = Object.fromEntries(PAD_KEYS.map((key) => [key, pad.querySelector(`[data-arrow="${key}"]`)]));

function padKeysAt(dx, dy) {
  if (Math.hypot(dx, dy) < PAD_DEAD_ZONE) return [];
  const keys = [];
  if (Math.abs(dy) > PAD_DIAGONAL * Math.abs(dx)) keys.push(dy < 0 ? 'KeyW' : 'KeyS');
  if (Math.abs(dx) > PAD_DIAGONAL * Math.abs(dy)) keys.push(dx < 0 ? 'KeyA' : 'KeyD');
  return keys;
}
function holdPadKeys(keys) {
  for (const key of PAD_KEYS) {
    const wanted = keys.includes(key);
    if (wanted && !Input.keys[key]) pressKey(key);
    if (!wanted) Input.keys[key] = false;
    padArrows[key].classList.toggle('pressed', wanted);
  }
}
function followPadPointer(e) {
  const box = pad.getBoundingClientRect();
  const radius = box.width / 2;
  holdPadKeys(padKeysAt((e.clientX - box.left - radius) / radius, (e.clientY - box.top - radius) / radius));
}
pad.addEventListener('pointerdown', (e) => {
  pad.setPointerCapture(e.pointerId);
  followPadPointer(e);
});
pad.addEventListener('pointermove', (e) => {
  if (pad.hasPointerCapture(e.pointerId)) followPadPointer(e);
});
pad.addEventListener('pointerup', () => holdPadKeys([]));
pad.addEventListener('pointercancel', () => holdPadKeys([]));
pad.addEventListener('lostpointercapture', () => holdPadKeys([]));
heldControls.push({ element: pad, release: () => holdPadKeys([]) });

// The screen's edge and the system's own gestures can swallow the end of a touch, so the list of
// fingers still down decides as well: a control with no finger on it lets go.
function releaseControlsWithoutFinger(e) {
  for (const { element, release } of heldControls) {
    if (![...e.touches].some((touch) => element.contains(touch.target))) release();
  }
}
document.addEventListener('touchend', releaseControlsWithoutFinger);
document.addEventListener('touchcancel', releaseControlsWithoutFinger);
const releaseAllControls = () => {
  for (const { release } of heldControls) release();
};
window.addEventListener('blur', releaseAllControls);
document.addEventListener('visibilitychange', releaseAllControls);

// Switch buttons light up while their switch is on, and the form buttons show the current form.
const touchSwitches = [
  ['touch-run', () => Player.sprintSwitchedOn],
  ['touch-sneak', () => Player.sneakSwitchedOn],
  ['touch-map', () => !document.getElementById('bigmap').classList.contains('hidden')],
  ['touch-voice', () => Voice.listening],
  ...FORM_ORDER.map((key, i) => ['touch-form-' + (i + 1), () => Player.form === key]),
].map(([id, isOn]) => [document.getElementById(id), isOn]);
function showTouchSwitches() {
  for (const [element, isOn] of touchSwitches) element.classList.toggle('on', isOn());
}
