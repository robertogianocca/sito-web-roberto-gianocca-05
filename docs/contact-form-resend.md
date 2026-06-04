# Form contatti (Resend)

Il form nella sezione **Contatti** della home invia un’email tramite [Resend](https://resend.com) usando una **Server Action** (`src/app/contact/actions.js`). La chiave API resta solo sul server.

## Variabili d’ambiente

Nel file **`.env.local`** (locale) e in **Vercel → Project → Settings → Environment Variables** (produzione):

```bash
RESEND_API_KEY=re_xxxxxxxx
RESEND_FROM_EMAIL=Contatti <noreply@tuodominio.it>
CONTACT_TO_EMAIL=tua-email@esempio.it
```

| Variabile | Ruolo |
|-----------|--------|
| `RESEND_API_KEY` | Chiave API da [Resend → API Keys](https://resend.com/api-keys) |
| `RESEND_FROM_EMAIL` | Mittente (dominio verificato su Resend) |
| `CONTACT_TO_EMAIL` | Destinatario delle richieste dal sito |

**Non** committare valori reali: `.env*` è in `.gitignore`.

## Dominio e mittente

1. In Resend, verifica il dominio da cui invii (es. `tuodominio.it`).
2. Imposta `RESEND_FROM_EMAIL` con un indirizzo su quel dominio, es. `Contatti <contatti@tuodominio.it>`.

### Test in sviluppo (sandbox)

Senza dominio verificato puoi usare temporaneamente:

- `from`: `onboarding@resend.dev`
- `to`: l’email dell’account Resend con cui ti sei registrato

Le email inviate così sono solo per prove; in produzione usa un dominio verificato.

## Antispam

È attivo un **honeypot** (campo nascosto `website`). Se un bot lo compila, l’azione risponde come se l’invio fosse andato a buon fine ma **non** chiama Resend.

Non c’è rate limiting in questa versione.

## Test locale

1. Imposta le tre variabili in `.env.local`.
2. `npm run dev` e apri la home → sezione **Contatti**.
3. Invia un messaggio valido → controlla la casella `CONTACT_TO_EMAIL`; in risposta dovresti vedere `replyTo` con l’email del visitatore.
4. Prova campi invalidi → messaggi di errore sotto i campi, nessuna email.
5. (Opzionale) In DevTools, compila il campo honeypot → messaggio di successo in UI, nessuna email.

## Deploy su Vercel

Aggiungi le stesse tre variabili per l’ambiente **Production** (e **Preview** se testi le preview). Dopo il deploy, ripeti un invio di prova dalla home in produzione.

## File coinvolti

- `src/app/contact/actions.js` — validazione, honeypot, invio Resend
- `src/components/contact/ContactForm.client.js` — UI e `useActionState`
- `src/app/page.js` — sezione `#contact`
