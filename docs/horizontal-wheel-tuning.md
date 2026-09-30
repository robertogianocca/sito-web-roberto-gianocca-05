# Tuning: scroll orizzontale con rotella (inerzia)

Architettura layout homepage, sezioni e comportamento generale: [homepage-horizontal-scroll.md](./homepage-horizontal-scroll.md).

Questa guida descrive **solo i numeri e le soglie** che controllano sensibilità, coasting e limiti dello scroll orizzontale mappato dalla rotella verticale. La logica vive in un unico file client.

## Dove modificare

| Cosa | Percorso |
|------|----------|
| Implementazione (costanti + `impulseFromWheel` + RAF) | [`src/components/home/HorizontalScrollContainer.client.js`](../src/components/home/HorizontalScrollContainer.client.js) |
| Uso del wrapper sulla home | [`src/app/[locale]/page.js`](../src/app/%5Blocale%5D/page.js) (`HorizontalScrollContainer`) |

Dopo ogni modifica: salva il file e ricarica la pagina nel browser (hot reload in dev di solito basta).

---

## Costanti in cima al file

Queste sono le leve principali per **inerzia** (quanto “scivola” dopo aver smesso di girare la rotella) e per **limiti di sicurezza**.

| Nome | Ruolo | Se lo aumenti | Se lo diminuisci |
|------|--------|----------------|------------------|
| `FRICTION` | Attrito applicato alla velocità ogni frame (valore tipico tra ~0.88 e ~0.97). Più è vicino a **1**, meno perdi velocità per frame. | Coasting **più lungo** (si ferma più tardi). | Coasting **più corto** (si ferma prima). |
| `EPSILON` | Soglia: quando `\|velocity\|` scende sotto questo valore, lo scroll inerziale si ferma. | Ti fermi **prima** (meno coda invisibile). | Coda **più lunga** (micro-movimenti fino quasi a zero). |
| `MAX_VELOCITY` | Tetto alla velocità cumulativa (somma degli impulsi durante scroll rapido). | Puoi andare **più veloce** in burst lunghi. | Limite **più basso** (meno “fuga” in avanti). |
| `MIN_IMPULSE` | Pavimento sull’impulso di un singolo evento `wheel`: se l’impulso calcolato è non zero ma troppo piccolo, viene portato almeno a questo valore (in valore assoluto). Utile su macOS con **delta piccoli** in pixel. | Anche il **minimo** movimento per notch è più evidente. | Più **finezza**; rischio che alcuni notch minuscoli non muovano nulla. |

Ordine pratico di tuning:

1. Sensibilità “per tick” → vedi `speed` e clamp più sotto.
2. Quanto continua a scorrere dopo → `FRICTION` e `EPSILON`.
3. Piccoli notch che non partono → `MIN_IMPULSE` (e il boost pixel-mode sotto).

---

## Parametri dentro `impulseFromWheel`

Qui si decide **quanto ogni notch della rotella** si traduce in impulso orizzontale **prima** dell’inerzia.

| Nome / posizione | Ruolo |
|------------------|--------|
| Soglia `Math.abs(dy) < 0.05` | Ignora jitter sub-pixel (rumore). Aumentala solo se vedi micro-scroll fantasma; altrimenti lasciala bassa. |
| `linePx` | Usato quando `deltaMode === 1` (righe): quanti pixel equivalgono a una “riga” della rotella. Più alto = più strada per notch in modalità righe. |
| `pagePx` | Usato quando `deltaMode === 2` (pagine): scala rispetto alla larghezza del contenitore (`clientWidth * 0.7`, minimo 320). Più alto = passi più grandi in modalità pagina. |
| `speed` | Moltiplicatore globale su `dy * factor`. **Prima leva** per “scorre di più / di meno” a parità di hardware. |
| Soglia `14` nel `if (e.deltaMode === 0 && … < 14)` | Solo in **pixel mode**: fino a che grandezza di `\|raw\|` consideri lo step “piccolo” e quindi candidato al boost. |
| Moltiplicatore `1.35` nel boost pixel-mode | Quanto amplificare gli step piccoli (mouse su macOS spesso manda pochi pixel). Più alto = piccoli notch più reattivi (ma meno “precisi”). |
| Clamp `Math.max(-260, Math.min(260, raw))` | Massimo impulso **per singolo** evento `wheel`. Evita salti enormi su un solo tick. |

`deltaMode` (standard browser): `0` = pixel, `1` = righe, `2` = pagine. Non tutti i browser / driver lo usano allo stesso modo: per questo esistono più rami (`linePx`, `pagePx`, boost su `0`).

---

## Comportamento non numerico (senza cambiare costanti)

- **Desktop**: l’handler è pensato per viewport `min-width: 1024px` (allineato al breakpoint `lg` del layout orizzontale).
- **Ovunque sulla pagina**: finché il track è montato, la rotella lo muove da qualsiasi punto (nav, header della pagina, footer, hint «Scroll», track). Non c'è stato di hover: l'inerzia continua anche se il puntatore passa sulla nav durante lo scorrimento.
- **Scroller interni nativi** (`wantsNativeScroll`): risalendo dall'elemento sotto il puntatore fino a `body`, l'evento **non** viene convertito se trova (a) un contenitore scrollabile in verticale con corsa residua nella direzione della rotella — su viewport bassi il contenuto di un pannello può superare la banda visibile, prima si scorre quello — oppure (b) un altro contenitore scrollabile in orizzontale diverso dal track (es. una filmstrip nel footer).
- **`Shift` + rotella**: non viene intercettato; resta il comportamento nativo del browser (spesso scroll orizzontale “classico”).
- **`prefers-reduced-motion: reduce`**: niente inerzia; viene applicato solo uno `scrollBy` immediato per tick (accessibilità).
- **Trackpad (gesto orizzontale)**: se `\|dx\| > \|dy\|` (dominanza orizzontale) e il puntatore è **sopra il track**, l’evento resta nativo (il `<main>` scorre da solo). **Fuori dal track** (nav, header, footer) nulla scorre in orizzontale e il browser lo trasformerebbe in navigazione indietro/avanti: l’evento viene quindi bloccato e mappato 1:1 (`scrollLeft += deltaX`). Resta nativo anche sopra un altro scroller orizzontale (es. filmstrip). In più, finché il track è montato su desktop, `html` riceve `overscroll-behavior-x: none` (ripristinato allo smontaggio), perché la coda di momentum di uno swipe può arrivare con eventi non cancellabili: così lo swipe non attiva mai back/forward su home e listing Video, mentre sulle altre pagine il gesto resta disponibile.
- **Trackpad (gesto verticale)**: mappato **1:1** (`scrollLeft += deltaY`), senza impulso né inerzia — macOS fornisce già la propria scia. Accumulare lo stream continuo del trackpad (60–120 eventi/s + eventi di momentum) nella velocità del mouse rendeva lo swipe troppo veloce. Rilevamento in `isTrackpadWheel`: se esiste `wheelDeltaY` (Chrome/Safari) vale `wheelDeltaY === -3 * deltaY`; altrimenti `deltaY` frazionario o `deltaX !== 0`, sempre in `deltaMode === 0`. Dopo il primo evento trackpad, gli eventi entro `TRACKPAD_GESTURE_MS` (150ms) restano sul percorso trackpad, così il gesto non cambia modalità a metà.
- **Costanti di tuning** (`FRICTION`, `speed`, `MIN_IMPULSE`, boost, clamp): valgono **solo per la rotella del mouse**.

---

## Workflow consigliato

1. Apri il sito in locale, vai sulla home, metti il mouse sul track orizzontale.
2. Modifica **un solo** parametro alla volta (es. prima `speed`), salva, prova 5–10 secondi.
3. Se il coasting ti sembra troppo lungo o troppo corto, agisci su `FRICTION` (effetto grosso) e solo fine su `EPSILON`.
4. Se i **piccoli** notch sono ancora morti, aumenta leggermente `MIN_IMPULSE` o il boost (`1.35` / soglia `14`), non tutti e tre insieme.

Non è necessario toccare `page.js` per il solo tuning numerico, a meno che non cambi breakpoint o struttura dello scroll.

---

## Sfumatura destra e pill «Scroll» (fade verso la fine)

Attivi solo sulla home con `showScrollHints` su `HorizontalScrollContainer`.

L’opacità usa la **percentuale di scroll** del track (`progress = scrollLeft / maxScroll`, da 0 a 1). Non usare pixel dalla fine (`maxScroll - scrollLeft`): Contatti (`span` 4) è già in viewport mentre restano centinaia di px scrollabili, quindi pill e sfumatura resterebbero visibili sopra Contatti.

**Verifica in locale** dopo ogni modifica: scorri fino a Contatti e controlla che pill e sfumatura siano trasparenti a fine corsa.

| Nome | Valore attuale (indicativo) | Ruolo | Se lo aumenti | Se lo diminuisci |
|------|----------------------------|--------|----------------|------------------|
| `BUTTON_FADE_START` | 0.62 | Progresso (0–1) oltre cui la pill inizia a scomparire fino a 0 a fine corsa. | La pill resta piena **più a lungo** (scompare più tardi). | La pill scompare **prima** (meno overlap su Contatti). |
| `GRADIENT_FADE_START` | 0.82 | Progresso oltre cui la sfumatura destra svanisce (dopo la pill). | La sfumatura resta **più a lungo** vicino a Contatti. | La sfumatura sparisce **prima**. |

Formula: se `progress <= fadeStart` → opacità 1; altrimenti `opacity = (1 - progress) / (1 - fadeStart)` clampata tra 0 e 1.

Transizione visiva: `transition-opacity duration-500 ease-out` sull’overlay; il pulse sulla pill è attivo solo se `buttonOpacity > 0.5`.

Aggiornamento opacità: evento `scroll` sul `<main>`, `resize`, `ResizeObserver` sul track, più sync durante l’inerzia della rotella (vedi `updateHintsRef` nel client).
