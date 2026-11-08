// İlerleme tarayıcının localStorage'ında saklanır
const SAVE_KEY = 'megalodon_save_v1';

const Save = {
  data: { level: 1, xp: 0, kills: 0, eaten: 0, deaths: 0, bestLevel: 1 },

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) Object.assign(this.data, JSON.parse(raw));
    } catch (e) { /* kayıt okunamazsa yeni oyun */ }
    return this.data;
  },

  write() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch (e) { /* yoksay */ }
  },

  reset() {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* yoksay */ }
    this.data = { level: 1, xp: 0, kills: 0, eaten: 0, deaths: 0, bestLevel: 1 };
  },
};
