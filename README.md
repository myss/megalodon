# Megalodon

**Türkçe** · [English](#english)

Bu oyun oğlumun oyunu. Ben yalnızca ufak tefek yardım ettim.

Oyunu "vibe coding" ile yaptık: Oğlum ne istediğini çoğu zaman Claude Code'a kendisi söyledi, kodu da Claude Opus 5.5 yazdı. Megalodonun okyanustaki öteki köpekbalıklarından çok daha büyük olmasına, okyanusta kalan son megalodonun da bizim olmasına o karar verdi. Düşmanların yalnızca köpekbalığı olmamasını, kalamarların ve balinaların da olmasını o istedi. Uçarken korsan gemisinin üstüne dalınca geminin "parça pinçik" olması da onun fikri. Her yeni hâlini oynayıp bozuk yerleri de çoğu zaman o yakaladı. Mesela kartalken bir adaya uçup kollu bacaklı megalodona dönünce megalodonun havada asılı kaldığını o fark etti.

## Hikâye

Okyanusta kalan son megalodon sensin. Köpekbalıkları, kalamarlar, ahtapotlar ve balinalarla dövüşüyor, balık sürülerini avlıyorsun. Adaların kıyısına su içmeye gelen hayvanlara gizlice yaklaşıp sudan fırlıyorsun. Yedikçe büyüyor, büyüdükçe güçleniyorsun.

Megalodon sudan fırlayıp uçabiliyor, balıkçı teknelerini ve top atan korsan gemisini batırabiliyor. Robot megalodona, krakene, dev bir kartala ve kollu bacaklı bir megalodona da dönüşebiliyor.

## Dünya

Tek ve kocaman bir okyanus:

- **Adalar:** On dört ada. Kıyılarına geyikler, zebralar, bizonlar ve yaban domuzları su içmeye geliyor. Fark ederlerse kaçıyorlar.
- **Açık deniz:** Köpekbalıkları, barakudalar, dev kalamarlar, dev ahtapotlar, denizanaları, katil balinalar ve kaşalotlar. Yüksek seviyede bir de mozasor çıkıyor. Kaplumbağalar, ton balıkları ve balık sürüleri de av oluyor.
- **Gemiler:** Balıkçı tekneleri megalodondan kaçıyor. Korsan gemisi ise onu kovalayıp top atıyor. Batan korsan gemisinin hazine sandığı denizin dibine iniyor.
- **Mariana Çukuru:** Yaklaşık 11.000 metre derinliğinde, dik duvarlı bir kanyon. Aşağı indikçe ortalık kararıyor. Dipte parlayan tüp solucanları ve sıcak su bacaları var. Fener balıkları, engerek balıkları, goblin köpekbalıkları, vampir kalamarlar, dev izopodlar ve dumbo ahtapotları yalnızca burada yaşıyor. Çukurun boss'u da Kraken.

## Portallar ve uzay

Okyanusta dört çift renkli portal var. Aynı renkten iki portal birbirine bağlı: Mariana Çukuru'nun dibinden gökyüzüne, su yüzeyinden ve bir adanın kıyısından çukurun dibine, bir adadan ötekine. Yerleri haritada görünüyor.

Bir de çok iyi saklanmış, haritada görünmeyen bir portal var. O portal uzaya açılıyor. Uzayda Güneş, sekiz gezegen ve bütün gezegenlerin birleşimi olan Her Şey Gezegeni var. Gezegenlere girince yüzeylerine iniliyor; Dünya'ya girince okyanusa geri dönülüyor.

## Gizemler

Okyanusta gizemler saklı. Ne olduklarını burada söylemiyoruz. Her gizemin, çok zor bir yere saklanmış tek bir haritası var. Harita bulununca gizemin yeri işaretleniyor, ama dolaşarak haritasız bulmak da mümkün. Hepsini çözene bir sürpriz var.

## Nasıl oynanır?

`index.html` dosyasına çift tıklamanız yeterli, bir şey kurmanıza gerek yok. Oyun seviyeyi ve seçilen dönüşümü tarayıcıya kaydediyor.

| Tuş | Ne işe yarar? |
| --- | --- |
| Fare | Yön verir |
| W / S | İleri yüzer / yavaşlar |
| A / D | Sola, sağa döner |
| Oklar ↑ ↓ | Yukarı, aşağı yönelir |
| Q | Hızlı yüzmeyi açar, kapatır; Shift'e basılı tutmak da hızlı yüzdürür |
| C | Gizli yüzmeyi açar, kapatır; kıyıdaki hayvanlar fark etmez |
| Boşluk | Atılır; yüzeyin yakınında sudan fırlatır |
| Havada Boşluk | Uçar; uçarken bir daha basınca iner |
| F / tıklama | Isırır (robot lazer atar, kraken dokunaçlarıyla çevresine vurur) |
| 1 – 5 | Dönüşür: megalodon, robot megalodon, kraken, dev kartal, kollu bacaklı megalodon |
| V | Sesli dönüşümü açar, kapatır: "robot", "kraken", "kartal" demek yetiyor (Chrome ya da Edge ister, internet gerekir) |
| M | Büyük haritayı açar, kapatır |
| N | Sesi açar, kapatır |
| P / Esc | Oyunu durdurur |
| Home | Ekran düğmelerini açar, kapatır |

Fare olmayan cihazlarda ekran düğmeleri kendiliğinden çıkıyor. Farenin de olduğu cihazlarda ise ekrana ilk dokunuşta açılıyor.

## Kod

Düz JavaScript ve [Three.js](https://threejs.org) kullanıldı, derlemeye gerek yok. Ses dosyası da yok; bütün sesleri kod üretiyor.

- `js/world.js`: Okyanus, adalar, Mariana Çukuru, deniz tabanı, bitkiler ve su yüzeyi.
- `js/models.js`: Köpekbalıkları, kalamar, ahtapot, balina, denizanası, çukur canlıları ve kara hayvanları.
- `js/forms.js`: Megalodonun dönüşebildiği formlar ve modelleri.
- `js/player.js`: Megalodonun yüzmesi, atılması, uçması, yürümesi ve dönüşümleri.
- `js/enemies.js`: Deniz düşmanları ve barışçıl deniz canlıları.
- `js/fish.js`: Balık sürüleri.
- `js/land.js`: Kıyıya su içmeye gelen kara hayvanları.
- `js/ships.js`: Balıkçı tekneleri, korsan gemisi, top gülleleri, parçalanma ve hazine.
- `js/mysteries.js`: Gizemler ve haritaları (içine bakarsanız sürpriz bozulur).
- `js/portals.js`: Renkli portal çiftleri ve gizli portal.
- `js/space.js`: Uzay, gezegenler, uzay istasyonu ve gezegen yüzeyleri.
- `js/effects.js`: Kan bulutu, kabarcık, su sıçraması ve lazer.
- `js/hud.js`: Ekrandaki göstergeler, mesajlar ve haritalar.
- `js/voice.js`: Sesli dönüşüm.
- `js/sound.js`: Ses efektleri.
- `js/save.js`: Tarayıcıya kayıt.
- `js/touch.js`: Fare olmadan oynamak için ekran düğmeleri.
- `js/main.js`: Oyunun döngüsü, kontroller ve ekranlar.
- `js/util.js`: Küçük yardımcı fonksiyonlar.
- `vendor/three.min.js`: Three.js 0.158.0. Çift tıklayınca çalışsın diye npm paketinin hazır tek dosyalık `build/three.min.js` sürümü kullanıldı.

---

<a id="english"></a>

# English

[Türkçe](#megalodon) · **English**

This is my son's game. I only helped out a little.

We vibe-coded it: most of the time my son told Claude Code what he wanted himself, and Claude Opus 5.5 wrote the code. He decided that the megalodon should be far bigger than every other shark in the ocean, and that it is the last megalodon left. He wanted enemies that aren't only sharks, so squids and whales came too. Diving onto the pirate ship from the air and smashing it to bits was his idea as well. He played each new version and often caught what was broken, like the megalodon hanging in mid-air after he flew onto an island as the eagle and turned into the megalodon with arms and legs.

## The story

You are the last megalodon in the ocean. You fight sharks, squids, octopuses and whales, and hunt schools of fish. You sneak up on the animals that come to drink at the islands' shores and burst out of the water. The more you eat, the bigger and stronger you grow.

The megalodon can leap out of the water and fly, and sink the fishing boats and the pirate ship that fires its cannons at you. It can also turn into a robot megalodon, a kraken, a giant eagle and a megalodon with arms and legs.

## The world

One huge ocean. The in-game text is Turkish:

- **The islands:** fourteen of them, where deer, zebras, bison and wild boar come to drink and run if they spot you
- **The open sea:** sharks, barracudas, giant squids, giant octopuses, jellyfish, killer whales and sperm whales, and a mosasaur at higher levels; turtles, tuna and schools of fish are prey
- **The ships:** fishing boats flee the megalodon, while the pirate ship chases it and fires its cannons; a sunk pirate ship's treasure chest sinks to the bottom
- **The Mariana Trench:** a steep canyon about 11,000 metres deep that grows darker on the way down, with glowing tube worms and hydrothermal vents at the bottom; anglerfish, viperfish, goblin sharks, vampire squids, giant isopods and dumbo octopuses live only here, and the Kraken is its boss

## Portals and space

The ocean has four pairs of coloured portals. The two portals of a colour are linked: from the bottom of the Mariana Trench to the sky, from the surface and from an island's shore down to the bottom of the trench, and from one island to another. The map shows where they are.

One more portal is well hidden and is not on the map. It opens into space, where the Sun, the eight planets and the Everything Planet, a mix of all the planets, wait. Flying into a planet lands you on its surface; flying into the Earth takes you back to the ocean.

## Mysteries

The ocean hides mysteries, and we are not saying here what they are. Each has a single map hidden somewhere very hard to reach. A map marks where its mystery is, but you can also stumble on one without it. Solving them all brings a surprise.

## Playing

Double-click `index.html`. There is nothing to install. The game saves your level and chosen form in the browser.

| Key | What it does |
| --- | --- |
| Mouse | Steer |
| W / S | Swim forward / slow down |
| A / D | Turn left, right |
| Arrows ↑ ↓ | Turn up, down |
| Q | Fast swimming on or off; holding Shift swims fast too |
| C | Sneaking on or off; animals on the shore won't notice you |
| Space | Lunge; near the surface it leaps out of the water |
| Space in the air | Fly; press again while flying to drop |
| F / click | Bite (the robot fires a laser, the kraken hits everything around it with its tentacles) |
| 1 – 5 | Transform: megalodon, robot megalodon, kraken, giant eagle, megalodon with arms and legs |
| V | Voice transformation on or off: just say "robot", "kraken", "kartal" (needs Chrome or Edge and an internet connection) |
| M | Big map on or off |
| N | Sound on or off |
| P / Esc | Pause |
| Home | Show or hide the on-screen buttons |

On-screen buttons appear by themselves on devices without a mouse. On devices that also have a mouse, they appear at the first touch.

## The code

Plain JavaScript and [Three.js](https://threejs.org), with no build step. Sounds are generated by code rather than loaded from files. The list of files is in the [Turkish section](#kod).
