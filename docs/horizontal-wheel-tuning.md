# Tuning: scroll orizzontale con rotella (inerzia)

Questa guida descrive **solo i numeri e le soglie** che controllano sensibilità, coasting e limiti dello scroll orizzontale mappato dalla rotella verticale. La logica vive in un unico file client.

## Dove modificare

| Cosa | Percorso |
|------|----------|
| Implementazione (costanti + `impulseFromWheel` + RAF) | [`src/components/home/HorizontalScrollContainer.client.js`](../src/components/home/HorizontalScrollContainer.client.js) |
| Uso del wrapper sulla home | [`src/app/page.js`](../src/app/page.js) (`HorizontalScrollContainer`) |

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
- **Hover**: `pointerenter` / `pointerleave` sul `<main>` aggiornano lo stato; in più, ogni `wheel` controlla se `clientX` / `clientY` cadono dentro il rettangolo del track (così dopo navigazione client verso la home il puntatore può essere già sopra il track senza un nuovo `pointerenter` e la rotella funziona lo stesso).
- **`Shift` + rotella**: non viene intercettato; resta il comportamento nativo del browser (spesso scroll orizzontale “classico”).
- **`prefers-reduced-motion: reduce`**: niente inerzia; viene applicato solo uno `scrollBy` immediato per tick (accessibilità).
- **Trackpad (gesto orizzontale)**: se `\|dy\| <= \|dx\|` (dominanza orizzontale), l’evento **non** viene convertito: resta lo scroll orizzontale nativo sul contenitore, utile al trackpad.

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
