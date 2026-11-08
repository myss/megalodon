// Sesli dönüşüm: V ile dinlemeyi aç/kapat, söylenen canlının adına dönüş.
// Tarayıcının konuşma tanıma özelliğini kullanır (Chrome ve Edge'de var, internet gerekir).
const VOICE_WORDS = [
  // Sıra önemli: "kollu bacaklı megalodon" içinde "megalodon" da geçer
  { form: 'kollu', words: ['kollu', 'bacaklı', 'bacak', 'yürüyen'] },
  { form: 'robot', words: ['robot'] },
  { form: 'kraken', words: ['kraken', 'krak'] },
  { form: 'kartal', words: ['kartal', 'kuş'] },
  { form: 'megalodon', words: ['megalodon', 'köpek balığı', 'köpekbalığı', 'normal'] },
];

function formFromSpeech(text) {
  const t = text.toLocaleLowerCase('tr-TR').replace(/[.,!?]/g, ' ');
  for (const entry of VOICE_WORDS) {
    if (entry.words.some((w) => t.includes(w))) return entry.form;
  }
  return null;
}

const Voice = {
  rec: null,
  listening: false,
  el: null,

  init() {
    this.el = document.getElementById('voice');
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    this.rec = new SR();
    this.rec.lang = 'tr-TR';
    this.rec.continuous = true;
    this.rec.interimResults = true;
    this.rec.maxAlternatives = 3;
    this.rec.onresult = (e) => this.onResult(e);
    this.rec.onerror = (e) => this.onError(e.error);
    // Sessizlikte kendiliğinden durur; dinleme açıksa yeniden başlat
    this.rec.onend = () => { if (this.listening) this.start(); };
  },

  toggle() {
    if (!this.rec) {
      Hud.msg('Bu tarayıcı sesli komutu desteklemiyor. Oyunu Chrome ya da Edge ile aç.');
      return;
    }
    this.listening = !this.listening;
    if (this.listening) {
      this.start();
      Hud.msg('Dinliyorum! Bir canlının adını söyle: robot, kraken, kartal...');
    } else {
      this.rec.stop();
    }
    this.show('');
  },

  start() {
    try { this.rec.start(); } catch (e) { /* zaten çalışıyor */ }
  },

  onResult(e) {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i];
      for (let j = 0; j < res.length; j++) {
        const form = formFromSpeech(res[j].transcript);
        if (form) {
          this.show(res[0].transcript);
          if (Game.state === 'playing') Player.transform(form);
          // Aynı cümlenin geri kalanı tekrar dönüştürmesin
          this.rec.abort();
          return;
        }
      }
      if (res.isFinal) this.show(res[0].transcript);
    }
  },

  onError(err) {
    if (err === 'no-speech' || err === 'aborted') return;
    this.listening = false;
    this.show('');
    if (err === 'not-allowed' || err === 'service-not-allowed') Hud.msg('Mikrofon izni verilmedi.');
    else if (err === 'network') Hud.msg('Sesli komut için internet bağlantısı gerekli.');
    else Hud.msg('Sesli komut çalışmadı: ' + err);
  },

  show(heard) {
    this.el.classList.toggle('hidden', !this.listening);
    this.el.textContent = '🎤 Dinliyorum' + (heard ? ' · Duydum: "' + heard.trim() + '"' : '');
  },
};
