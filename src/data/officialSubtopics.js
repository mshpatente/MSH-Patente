/**
 * Official Subtopics
 *
 * Hierarchy:
 * Argomento → Topic → Subtopic → Lesson → Quiz
 *
 * Subtopics are static syllabus data.
 * Lessons and quiz questions are managed through Firestore.
 */

export const officialSubtopics = [
      // ==================================================
  // ARGOMENTO 1
  // Definizioni generali e doveri nell'uso della strada
  // ==================================================

  {
    id: "definizione-strada",
    argomentoId: "definizioni-doveri-strada",
    topicId: "strada-carreggiata-corsia",
    title: "Definizione di strada",
    description: "Cos'è una strada secondo il Codice della Strada.",
    icon: "🛣️",
    topicOrder: 1,
    order: 1
  },
  {
    id: "carreggiata",
    argomentoId: "definizioni-doveri-strada",
    topicId: "strada-carreggiata-corsia",
    title: "Carreggiata",
    description: "Definizione e caratteristiche della carreggiata.",
    icon: "🚗",
    topicOrder: 1,
    order: 2
  },
  {
    id: "corsia",
    argomentoId: "definizioni-doveri-strada",
    topicId: "strada-carreggiata-corsia",
    title: "Corsia",
    description: "Funzione e utilizzo delle corsie di marcia.",
    icon: "➡️",
    topicOrder: 1,
    order: 3
  },

  {
    id: "banchina",
    argomentoId: "definizioni-doveri-strada",
    topicId: "banchina-marciapiede-pista-ciclabile",
    title: "Banchina",
    description: "Funzione della banchina stradale.",
    icon: "⬜",
    topicOrder: 2,
    order: 1
  },
  {
    id: "marciapiede",
    argomentoId: "definizioni-doveri-strada",
    topicId: "banchina-marciapiede-pista-ciclabile",
    title: "Marciapiede",
    description: "Spazio riservato ai pedoni.",
    icon: "🚶",
    topicOrder: 2,
    order: 2
  },
  {
    id: "pista-ciclabile",
    argomentoId: "definizioni-doveri-strada",
    topicId: "banchina-marciapiede-pista-ciclabile",
    title: "Pista ciclabile",
    description: "Caratteristiche della pista riservata ai velocipedi.",
    icon: "🚲",
    topicOrder: 2,
    order: 3
  },

  {
    id: "intersezione",
    argomentoId: "definizioni-doveri-strada",
    topicId: "intersezioni-attraversamenti",
    title: "Intersezione",
    description: "Definizione di intersezione stradale.",
    icon: "🔀",
    topicOrder: 3,
    order: 1
  },
  {
    id: "attraversamento-pedonale",
    argomentoId: "definizioni-doveri-strada",
    topicId: "intersezioni-attraversamenti",
    title: "Attraversamento pedonale",
    description: "Regole e definizione dell'attraversamento pedonale.",
    icon: "🚸",
    topicOrder: 3,
    order: 2
  },
  {
    id: "passaggio-livello",
    argomentoId: "definizioni-doveri-strada",
    topicId: "intersezioni-attraversamenti",
    title: "Passaggio a livello",
    description: "Definizione e comportamento corretto.",
    icon: "🚆",
    topicOrder: 3,
    order: 3
  },

  {
    id: "autostrada",
    argomentoId: "definizioni-doveri-strada",
    topicId: "tipi-strada",
    title: "Autostrada",
    description: "Caratteristiche dell'autostrada.",
    icon: "🛣️",
    topicOrder: 4,
    order: 1
  },
  {
    id: "strada-extraurbana",
    argomentoId: "definizioni-doveri-strada",
    topicId: "tipi-strada",
    title: "Strada extraurbana",
    description: "Tipologie di strade extraurbane.",
    icon: "🛤️",
    topicOrder: 4,
    order: 2
  },
  {
    id: "strada-urbana",
    argomentoId: "definizioni-doveri-strada",
    topicId: "tipi-strada",
    title: "Strada urbana",
    description: "Caratteristiche delle strade urbane.",
    icon: "🏙️",
    topicOrder: 4,
    order: 3
  },

  {
    id: "conducente",
    argomentoId: "definizioni-doveri-strada",
    topicId: "utenti-strada-veicoli",
    title: "Conducente",
    description: "Definizione di conducente.",
    icon: "🚗",
    topicOrder: 5,
    order: 1
  },
  {
    id: "pedone",
    argomentoId: "definizioni-doveri-strada",
    topicId: "utenti-strada-veicoli",
    title: "Pedone",
    description: "Definizione di pedone.",
    icon: "🚶",
    topicOrder: 5,
    order: 2
  },
  {
    id: "categorie-veicoli",
    argomentoId: "definizioni-doveri-strada",
    topicId: "utenti-strada-veicoli",
    title: "Categorie di veicoli",
    description: "Principali categorie dei veicoli.",
    icon: "🚙",
    topicOrder: 5,
    order: 3
  },

  {
    id: "prudenza-guida",
    argomentoId: "definizioni-doveri-strada",
    topicId: "doveri-conducente",
    title: "Principio di prudenza",
    description: "Il dovere di prudenza durante la guida.",
    icon: "🤝",
    topicOrder: 6,
    order: 1
  },
  {
    id: "rispetto-utenti-strada",
    argomentoId: "definizioni-doveri-strada",
    topicId: "doveri-conducente",
    title: "Rispetto degli altri utenti",
    description: "Comportamento corretto verso gli altri utenti della strada.",
    icon: "❤️",
    topicOrder: 6,
    order: 2
  },
  {
    id: "guida-responsabile",
    argomentoId: "definizioni-doveri-strada",
    topicId: "doveri-conducente",
    title: "Guida responsabile",
    description: "Principi fondamentali della guida sicura e responsabile.",
    icon: "✅",
    topicOrder: 6,
    order: 3
  },
    // ==================================================
  // ARGOMENTO 2
  // Segnali di pericolo
  // ==================================================

  // Topic 1
  // Caratteristiche dei segnali di pericolo

  {
    id: "forma-segnali-pericolo",
    argomentoId: "segnali-pericolo",
    topicId: "caratteristiche-segnali-pericolo",
    title: "Forma dei segnali di pericolo",
    description:
      "Forma triangolare e caratteristiche generali dei segnali di pericolo.",
    icon: "🔺",
    topicOrder: 1,
    order: 1
  },
  {
    id: "colori-segnali-pericolo",
    argomentoId: "segnali-pericolo",
    topicId: "caratteristiche-segnali-pericolo",
    title: "Colori dei segnali di pericolo",
    description:
      "Colori, simboli e modalità di riconoscimento dei segnali di pericolo.",
    icon: "⚠️",
    topicOrder: 1,
    order: 2
  },
  {
    id: "distanza-collocazione-segnali-pericolo",
    argomentoId: "segnali-pericolo",
    topicId: "caratteristiche-segnali-pericolo",
    title: "Distanza di collocazione",
    description:
      "Distanza normalmente presente tra il segnale e il punto di pericolo.",
    icon: "📏",
    topicOrder: 1,
    order: 3
  },
  {
    id: "comportamento-segnali-pericolo",
    argomentoId: "segnali-pericolo",
    topicId: "caratteristiche-segnali-pericolo",
    title: "Comportamento del conducente",
    description:
      "Riduzione della velocità, prudenza e attenzione richieste dal segnale.",
    icon: "🚗",
    topicOrder: 1,
    order: 4
  },

  // Topic 2
  // Strada deformata, dosso e cunetta

  {
    id: "segnale-strada-deformata",
    argomentoId: "segnali-pericolo",
    topicId: "strada-deformata-dosso-cunetta",
    title: "Strada deformata",
    description:
      "Significato del segnale che preannuncia una superficie stradale irregolare.",
    icon: "〰️",
    topicOrder: 2,
    order: 1
  },
  {
    id: "segnale-dosso",
    argomentoId: "segnali-pericolo",
    topicId: "strada-deformata-dosso-cunetta",
    title: "Dosso",
    description:
      "Pericolo derivante da una variazione convessa del profilo della strada.",
    icon: "⛰️",
    topicOrder: 2,
    order: 2
  },
  {
    id: "segnale-cunetta",
    argomentoId: "segnali-pericolo",
    topicId: "strada-deformata-dosso-cunetta",
    title: "Cunetta",
    description:
      "Pericolo derivante da una variazione concava del profilo della strada.",
    icon: "〽️",
    topicOrder: 2,
    order: 3
  },

  // Topic 3
  // Curve pericolose

  {
    id: "curva-pericolosa-destra",
    argomentoId: "segnali-pericolo",
    topicId: "curve-pericolose",
    title: "Curva pericolosa a destra",
    description:
      "Segnale che preannuncia una curva pericolosa verso destra.",
    icon: "↪️",
    topicOrder: 3,
    order: 1
  },
  {
    id: "curva-pericolosa-sinistra",
    argomentoId: "segnali-pericolo",
    topicId: "curve-pericolose",
    title: "Curva pericolosa a sinistra",
    description:
      "Segnale che preannuncia una curva pericolosa verso sinistra.",
    icon: "↩️",
    topicOrder: 3,
    order: 2
  },
  {
    id: "doppia-curva-prima-destra",
    argomentoId: "segnali-pericolo",
    topicId: "curve-pericolose",
    title: "Doppia curva, la prima a destra",
    description:
      "Successione di curve pericolose con la prima curva verso destra.",
    icon: "〰️",
    topicOrder: 3,
    order: 3
  },
  {
    id: "doppia-curva-prima-sinistra",
    argomentoId: "segnali-pericolo",
    topicId: "curve-pericolose",
    title: "Doppia curva, la prima a sinistra",
    description:
      "Successione di curve pericolose con la prima curva verso sinistra.",
    icon: "〰️",
    topicOrder: 3,
    order: 4
  },

  // Topic 4
  // Strettoie, ponte mobile e banchina pericolosa

  {
    id: "strettoia-simmetrica",
    argomentoId: "segnali-pericolo",
    topicId: "strettoie-ponte-mobile-banchina",
    title: "Strettoia simmetrica",
    description:
      "Restringimento della carreggiata su entrambi i lati.",
    icon: "↔️",
    topicOrder: 4,
    order: 1
  },
  {
    id: "strettoia-asimmetrica-destra",
    argomentoId: "segnali-pericolo",
    topicId: "strettoie-ponte-mobile-banchina",
    title: "Strettoia asimmetrica a destra",
    description:
      "Restringimento della carreggiata presente sul lato destro.",
    icon: "↙️",
    topicOrder: 4,
    order: 2
  },
  {
    id: "strettoia-asimmetrica-sinistra",
    argomentoId: "segnali-pericolo",
    topicId: "strettoie-ponte-mobile-banchina",
    title: "Strettoia asimmetrica a sinistra",
    description:
      "Restringimento della carreggiata presente sul lato sinistro.",
    icon: "↘️",
    topicOrder: 4,
    order: 3
  },
  {
    id: "ponte-mobile",
    argomentoId: "segnali-pericolo",
    topicId: "strettoie-ponte-mobile-banchina",
    title: "Ponte mobile",
    description:
      "Pericolo dovuto alla presenza di un ponte mobile.",
    icon: "🌉",
    topicOrder: 4,
    order: 4
  },
  {
    id: "banchina-pericolosa",
    argomentoId: "segnali-pericolo",
    topicId: "strettoie-ponte-mobile-banchina",
    title: "Banchina pericolosa",
    description:
      "Pericolo causato da una banchina cedevole o non praticabile.",
    icon: "⚠️",
    topicOrder: 4,
    order: 5
  },

  // Topic 5
  // Intersezioni con pericolo di precedenza

  {
    id: "intersezione-precedenza-destra-pericolo",
    argomentoId: "segnali-pericolo",
    topicId: "intersezioni-precedenza-pericolo",
    title: "Intersezione con precedenza a destra",
    description:
      "Preavviso di un'intersezione regolata dalla precedenza a destra.",
    icon: "✳️",
    topicOrder: 5,
    order: 1
  },
  {
    id: "intersezione-strada-secondaria-destra",
    argomentoId: "segnali-pericolo",
    topicId: "intersezioni-precedenza-pericolo",
    title: "Intersezione con strada secondaria a destra",
    description:
      "Preavviso dell'immissione di una strada secondaria dal lato destro.",
    icon: "⊢",
    topicOrder: 5,
    order: 2
  },
  {
    id: "intersezione-strada-secondaria-sinistra",
    argomentoId: "segnali-pericolo",
    topicId: "intersezioni-precedenza-pericolo",
    title: "Intersezione con strada secondaria a sinistra",
    description:
      "Preavviso dell'immissione di una strada secondaria dal lato sinistro.",
    icon: "⊣",
    topicOrder: 5,
    order: 3
  },
  {
    id: "confluenza-destra",
    argomentoId: "segnali-pericolo",
    topicId: "intersezioni-precedenza-pericolo",
    title: "Confluenza da destra",
    description:
      "Preavviso dell'immissione di una corrente di traffico da destra.",
    icon: "↙️",
    topicOrder: 5,
    order: 4
  },
  {
    id: "confluenza-sinistra",
    argomentoId: "segnali-pericolo",
    topicId: "intersezioni-precedenza-pericolo",
    title: "Confluenza da sinistra",
    description:
      "Preavviso dell'immissione di una corrente di traffico da sinistra.",
    icon: "↘️",
    topicOrder: 5,
    order: 5
  },

  // Topic 6
  // Passaggi a livello

  {
    id: "passaggio-livello-con-barriere",
    argomentoId: "segnali-pericolo",
    topicId: "passaggi-livello",
    title: "Passaggio a livello con barriere",
    description:
      "Preavviso di un attraversamento ferroviario protetto da barriere.",
    icon: "🚧",
    topicOrder: 6,
    order: 1
  },
  {
    id: "passaggio-livello-senza-barriere",
    argomentoId: "segnali-pericolo",
    topicId: "passaggi-livello",
    title: "Passaggio a livello senza barriere",
    description:
      "Preavviso di un attraversamento ferroviario privo di barriere.",
    icon: "🚆",
    topicOrder: 6,
    order: 2
  },
  {
    id: "croce-sant-andrea",
    argomentoId: "segnali-pericolo",
    topicId: "passaggi-livello",
    title: "Croce di Sant'Andrea",
    description:
      "Segnale posto in prossimità di un passaggio a livello senza barriere.",
    icon: "❌",
    topicOrder: 6,
    order: 3
  },
  {
    id: "pannelli-distanziometrici",
    argomentoId: "segnali-pericolo",
    topicId: "passaggi-livello",
    title: "Pannelli distanziometrici",
    description:
      "Pannelli che indicano il progressivo avvicinamento al passaggio a livello.",
    icon: "📏",
    topicOrder: 6,
    order: 4
  },

  // Topic 7
  // Attraversamenti e utenti deboli

  {
    id: "attraversamento-pedonale-pericolo",
    argomentoId: "segnali-pericolo",
    topicId: "attraversamenti-utenti-deboli",
    title: "Attraversamento pedonale",
    description:
      "Preavviso della possibile presenza di pedoni che attraversano la strada.",
    icon: "🚶",
    topicOrder: 7,
    order: 1
  },
  {
    id: "bambini-strada",
    argomentoId: "segnali-pericolo",
    topicId: "attraversamenti-utenti-deboli",
    title: "Bambini",
    description:
      "Possibile presenza di bambini vicino a scuole, giardini o luoghi frequentati.",
    icon: "🚸",
    topicOrder: 7,
    order: 2
  },
  {
    id: "attraversamento-ciclabile-pericolo",
    argomentoId: "segnali-pericolo",
    topicId: "attraversamenti-utenti-deboli",
    title: "Attraversamento ciclabile",
    description:
      "Preavviso della possibile presenza di ciclisti che attraversano la strada.",
    icon: "🚲",
    topicOrder: 7,
    order: 3
  },
  {
    id: "animali-domestici-vaganti",
    argomentoId: "segnali-pericolo",
    topicId: "attraversamenti-utenti-deboli",
    title: "Animali domestici vaganti",
    description:
      "Possibile attraversamento della strada da parte di animali domestici.",
    icon: "🐄",
    topicOrder: 7,
    order: 4
  },
  {
    id: "animali-selvatici-vaganti",
    argomentoId: "segnali-pericolo",
    topicId: "attraversamenti-utenti-deboli",
    title: "Animali selvatici vaganti",
    description:
      "Possibile attraversamento della strada da parte di animali selvatici.",
    icon: "🦌",
    topicOrder: 7,
    order: 5
  },

  // Topic 8
  // Pericoli ambientali

  {
    id: "vento-laterale",
    argomentoId: "segnali-pericolo",
    topicId: "pericoli-ambientali",
    title: "Vento laterale",
    description:
      "Pericolo dovuto a forti raffiche di vento laterale.",
    icon: "🌬️",
    topicOrder: 8,
    order: 1
  },
  {
    id: "caduta-massi-destra",
    argomentoId: "segnali-pericolo",
    topicId: "pericoli-ambientali",
    title: "Caduta massi da destra",
    description:
      "Pericolo di caduta massi e possibile presenza di pietre sulla carreggiata.",
    icon: "🪨",
    topicOrder: 8,
    order: 2
  },
  {
    id: "caduta-massi-sinistra",
    argomentoId: "segnali-pericolo",
    topicId: "pericoli-ambientali",
    title: "Caduta massi da sinistra",
    description:
      "Pericolo di caduta massi provenienti dal lato sinistro.",
    icon: "🪨",
    topicOrder: 8,
    order: 3
  },
  {
    id: "strada-sdrucciolevole",
    argomentoId: "segnali-pericolo",
    topicId: "pericoli-ambientali",
    title: "Strada sdrucciolevole",
    description:
      "Possibile perdita di aderenza causata da acqua, ghiaccio o altre sostanze.",
    icon: "❄️",
    topicOrder: 8,
    order: 4
  },

  // Topic 9
  // Altri pericoli

  {
    id: "preavviso-semaforo",
    argomentoId: "segnali-pericolo",
    topicId: "altri-pericoli",
    title: "Preavviso di semaforo",
    description:
      "Preannuncia un impianto semaforico che potrebbe non essere immediatamente visibile.",
    icon: "🚦",
    topicOrder: 9,
    order: 1
  },
  {
    id: "aeromobili-bassa-quota",
    argomentoId: "segnali-pericolo",
    topicId: "altri-pericoli",
    title: "Aeromobili a bassa quota",
    description:
      "Possibili rumori improvvisi o passaggi di aeromobili a bassa quota.",
    icon: "✈️",
    topicOrder: 9,
    order: 2
  },
  {
    id: "materiale-instabile-strada",
    argomentoId: "segnali-pericolo",
    topicId: "altri-pericoli",
    title: "Materiale instabile sulla strada",
    description:
      "Pericolo di pietrisco o materiale proiettato dai veicoli in transito.",
    icon: "🪨",
    topicOrder: 9,
    order: 3
  },
  {
    id: "altri-pericoli-generico",
    argomentoId: "segnali-pericolo",
    topicId: "altri-pericoli",
    title: "Altri pericoli",
    description:
      "Segnale generico utilizzato per pericoli non rappresentati da un simbolo specifico.",
    icon: "❗",
    topicOrder: 9,
    order: 4
  },
    // ==================================================
  // ARGOMENTO 3
  // Segnali di divieto
  // ==================================================

  // Topic 1
  // Caratteristiche dei segnali di divieto

  {
    id: "forma-segnali-divieto",
    argomentoId: "segnali-divieto",
    topicId: "caratteristiche-segnali-divieto",
    title: "Forma dei segnali di divieto",
    description:
      "Forma circolare e caratteristiche generali dei segnali di divieto.",
    icon: "⭕",
    topicOrder: 1,
    order: 1
  },
  {
    id: "colori-segnali-divieto",
    argomentoId: "segnali-divieto",
    topicId: "caratteristiche-segnali-divieto",
    title: "Colori dei segnali di divieto",
    description:
      "Colori, bordi e simboli utilizzati per riconoscere i segnali di divieto.",
    icon: "⛔",
    topicOrder: 1,
    order: 2
  },
  {
    id: "validita-segnali-divieto",
    argomentoId: "segnali-divieto",
    topicId: "caratteristiche-segnali-divieto",
    title: "Validità dei divieti",
    description:
      "Punto di inizio, estensione e termine delle prescrizioni di divieto.",
    icon: "📍",
    topicOrder: 1,
    order: 3
  },
  {
    id: "categorie-interessate-divieti",
    argomentoId: "segnali-divieto",
    topicId: "caratteristiche-segnali-divieto",
    title: "Categorie interessate dai divieti",
    description:
      "Veicoli e utenti ai quali può essere rivolta una specifica prescrizione.",
    icon: "🚗",
    topicOrder: 1,
    order: 4
  },

  // Topic 2
  // Divieti di transito

  {
    id: "divieto-transito-generale",
    argomentoId: "segnali-divieto",
    topicId: "divieti-transito",
    title: "Divieto di transito",
    description:
      "Vieta la circolazione in entrambi i sensi a tutti i veicoli.",
    icon: "🚫",
    topicOrder: 2,
    order: 1
  },
  {
    id: "senso-vietato",
    argomentoId: "segnali-divieto",
    topicId: "divieti-transito",
    title: "Senso vietato",
    description:
      "Vieta di entrare nella strada dal lato in cui è collocato il segnale.",
    icon: "⛔",
    topicOrder: 2,
    order: 2
  },
  {
    id: "divieto-transito-autoveicoli",
    argomentoId: "segnali-divieto",
    topicId: "divieti-transito",
    title: "Transito vietato agli autoveicoli",
    description:
      "Vieta il transito alle categorie di autoveicoli rappresentate nel segnale.",
    icon: "🚘",
    topicOrder: 2,
    order: 3
  },
  {
    id: "divieto-transito-motocicli",
    argomentoId: "segnali-divieto",
    topicId: "divieti-transito",
    title: "Transito vietato ai motocicli",
    description:
      "Vieta la circolazione ai motocicli sulla strada interessata.",
    icon: "🏍️",
    topicOrder: 2,
    order: 4
  },
  {
    id: "divieto-transito-velocipedi",
    argomentoId: "segnali-divieto",
    topicId: "divieti-transito",
    title: "Transito vietato ai velocipedi",
    description:
      "Vieta la circolazione delle biciclette e degli altri velocipedi.",
    icon: "🚲",
    topicOrder: 2,
    order: 5
  },
  {
    id: "divieto-transito-pedoni",
    argomentoId: "segnali-divieto",
    topicId: "divieti-transito",
    title: "Transito vietato ai pedoni",
    description:
      "Vieta ai pedoni di percorrere il tratto di strada interessato.",
    icon: "🚶",
    topicOrder: 2,
    order: 6
  },
  {
    id: "divieto-transito-veicoli-merci",
    argomentoId: "segnali-divieto",
    topicId: "divieti-transito",
    title: "Transito vietato ai veicoli per merci",
    description:
      "Vieta il transito ai veicoli destinati al trasporto di merci.",
    icon: "🚚",
    topicOrder: 2,
    order: 7
  },

  // Topic 3
  // Limitazioni di dimensioni e massa

  {
    id: "limite-larghezza",
    argomentoId: "segnali-divieto",
    topicId: "limitazioni-dimensioni-massa",
    title: "Limite massimo di larghezza",
    description:
      "Vieta il transito ai veicoli che superano la larghezza indicata.",
    icon: "↔️",
    topicOrder: 3,
    order: 1
  },
  {
    id: "limite-altezza",
    argomentoId: "segnali-divieto",
    topicId: "limitazioni-dimensioni-massa",
    title: "Limite massimo di altezza",
    description:
      "Vieta il transito ai veicoli che superano l'altezza indicata.",
    icon: "↕️",
    topicOrder: 3,
    order: 2
  },
  {
    id: "limite-lunghezza",
    argomentoId: "segnali-divieto",
    topicId: "limitazioni-dimensioni-massa",
    title: "Limite massimo di lunghezza",
    description:
      "Vieta il transito ai veicoli o complessi più lunghi del limite indicato.",
    icon: "📏",
    topicOrder: 3,
    order: 3
  },
  {
    id: "limite-massa-complessiva",
    argomentoId: "segnali-divieto",
    topicId: "limitazioni-dimensioni-massa",
    title: "Limite massimo di massa complessiva",
    description:
      "Vieta il transito ai veicoli con massa complessiva superiore al valore indicato.",
    icon: "⚖️",
    topicOrder: 3,
    order: 4
  },
  {
    id: "limite-massa-per-asse",
    argomentoId: "segnali-divieto",
    topicId: "limitazioni-dimensioni-massa",
    title: "Limite massimo di massa per asse",
    description:
      "Vieta il transito quando la massa gravante su un asse supera il limite.",
    icon: "🛞",
    topicOrder: 3,
    order: 5
  },

  // Topic 4
  // Divieto di sorpasso

  {
    id: "divieto-sorpasso-veicoli",
    argomentoId: "segnali-divieto",
    topicId: "divieto-sorpasso",
    title: "Divieto di sorpasso",
    description:
      "Vieta ai veicoli a motore di sorpassare altri veicoli a motore.",
    icon: "🚙",
    topicOrder: 4,
    order: 1
  },
  {
    id: "divieto-sorpasso-veicoli-merci",
    argomentoId: "segnali-divieto",
    topicId: "divieto-sorpasso",
    title: "Divieto di sorpasso per veicoli merci",
    description:
      "Vieta il sorpasso ai veicoli per trasporto merci oltre la massa prevista.",
    icon: "🚛",
    topicOrder: 4,
    order: 2
  },
  {
    id: "comportamento-divieto-sorpasso",
    argomentoId: "segnali-divieto",
    topicId: "divieto-sorpasso",
    title: "Comportamento con divieto di sorpasso",
    description:
      "Regole da rispettare nel tratto in cui è vietato effettuare il sorpasso.",
    icon: "🚫",
    topicOrder: 4,
    order: 3
  },
  {
    id: "termine-divieto-sorpasso",
    argomentoId: "segnali-divieto",
    topicId: "divieto-sorpasso",
    title: "Fine del divieto di sorpasso",
    description:
      "Riconoscimento del punto in cui termina la prescrizione di divieto.",
    icon: "⚪",
    topicOrder: 4,
    order: 4
  },

  // Topic 5
  // Limiti massimi di velocità

  {
    id: "segnale-limite-massimo-velocita",
    argomentoId: "segnali-divieto",
    topicId: "limiti-massimi-velocita",
    title: "Limite massimo di velocità",
    description:
      "Indica la velocità che non deve essere superata nel tratto interessato.",
    icon: "🔢",
    topicOrder: 5,
    order: 1
  },
  {
    id: "inizio-validita-limite-velocita",
    argomentoId: "segnali-divieto",
    topicId: "limiti-massimi-velocita",
    title: "Inizio del limite di velocità",
    description:
      "Punto dal quale il conducente deve rispettare il limite indicato.",
    icon: "📍",
    topicOrder: 5,
    order: 2
  },
  {
    id: "ripetizione-limite-velocita",
    argomentoId: "segnali-divieto",
    topicId: "limiti-massimi-velocita",
    title: "Ripetizione del limite di velocità",
    description:
      "Ripetizione del segnale lungo un tratto soggetto alla stessa limitazione.",
    icon: "🔁",
    topicOrder: 5,
    order: 3
  },
  {
    id: "fine-limite-massimo-velocita",
    argomentoId: "segnali-divieto",
    topicId: "limiti-massimi-velocita",
    title: "Fine del limite massimo di velocità",
    description:
      "Indica il termine dello specifico limite di velocità precedentemente imposto.",
    icon: "⚪",
    topicOrder: 5,
    order: 4
  },

  // Topic 6
  // Divieto di segnalazioni acustiche

  {
    id: "divieto-segnalazioni-acustiche",
    argomentoId: "segnali-divieto",
    topicId: "divieti-segnalazioni-acustiche",
    title: "Divieto di segnalazioni acustiche",
    description:
      "Vieta l'uso del clacson e degli altri dispositivi acustici.",
    icon: "🔇",
    topicOrder: 6,
    order: 1
  },
  {
    id: "eccezioni-divieto-clacson",
    argomentoId: "segnali-divieto",
    topicId: "divieti-segnalazioni-acustiche",
    title: "Eccezioni per motivi di sicurezza",
    description:
      "Uso del dispositivo acustico quando è necessario evitare un pericolo immediato.",
    icon: "⚠️",
    topicOrder: 6,
    order: 2
  },
  {
    id: "segnalazioni-acustiche-centro-abitato",
    argomentoId: "segnali-divieto",
    topicId: "divieti-segnalazioni-acustiche",
    title: "Segnalazioni acustiche nei centri abitati",
    description:
      "Regole generali sull'uso dei dispositivi acustici nei centri abitati.",
    icon: "🏙️",
    topicOrder: 6,
    order: 3
  },

  // Topic 7
  // Divieto di fermata e divieto di sosta

  {
    id: "segnale-divieto-sosta",
    argomentoId: "segnali-divieto",
    topicId: "divieti-fermata-sosta",
    title: "Divieto di sosta",
    description:
      "Vieta la sosta ma consente una breve fermata quando non crea intralcio.",
    icon: "🅿️",
    topicOrder: 7,
    order: 1
  },
  {
    id: "segnale-divieto-fermata",
    argomentoId: "segnali-divieto",
    topicId: "divieti-fermata-sosta",
    title: "Divieto di fermata",
    description:
      "Vieta sia la fermata sia la sosta dei veicoli.",
    icon: "🚫",
    topicOrder: 7,
    order: 2
  },
  {
    id: "validita-divieto-sosta",
    argomentoId: "segnali-divieto",
    topicId: "divieti-fermata-sosta",
    title: "Validità del divieto di sosta",
    description:
      "Durata, orari e tratto stradale nel quale si applica il divieto.",
    icon: "🕒",
    topicOrder: 7,
    order: 3
  },
  {
    id: "validita-divieto-fermata",
    argomentoId: "segnali-divieto",
    topicId: "divieti-fermata-sosta",
    title: "Validità del divieto di fermata",
    description:
      "Applicazione continua del divieto e possibili integrazioni mediante pannelli.",
    icon: "⏸️",
    topicOrder: 7,
    order: 4
  },
  {
    id: "differenza-fermata-sosta-segnali",
    argomentoId: "segnali-divieto",
    topicId: "divieti-fermata-sosta",
    title: "Differenza tra fermata e sosta",
    description:
      "Differenze pratiche tra le due prescrizioni e comportamento consentito.",
    icon: "📋",
    topicOrder: 7,
    order: 5
  },

  // Topic 8
  // Fine dei divieti

  {
    id: "fine-divieto-generico",
    argomentoId: "segnali-divieto",
    topicId: "fine-divieti",
    title: "Fine del divieto",
    description:
      "Indica il termine di una specifica prescrizione precedentemente imposta.",
    icon: "⚪",
    topicOrder: 8,
    order: 1
  },
  {
    id: "fine-tutte-prescrizioni",
    argomentoId: "segnali-divieto",
    topicId: "fine-divieti",
    title: "Fine di tutte le prescrizioni",
    description:
      "Indica la fine simultanea dei divieti e delle limitazioni precedenti.",
    icon: "⚫",
    topicOrder: 8,
    order: 2
  },
  {
    id: "fine-divieto-sorpasso-subtopic",
    argomentoId: "segnali-divieto",
    topicId: "fine-divieti",
    title: "Fine del divieto di sorpasso",
    description:
      "Segnale che conclude il divieto di sorpasso precedentemente vigente.",
    icon: "🚙",
    topicOrder: 8,
    order: 3
  },
  {
    id: "fine-limite-velocita-subtopic",
    argomentoId: "segnali-divieto",
    topicId: "fine-divieti",
    title: "Fine del limite di velocità",
    description:
      "Segnale che conclude lo specifico limite massimo di velocità.",
    icon: "🔢",
    topicOrder: 8,
    order: 4
  },
    // ==================================================
  // ARGOMENTO 4
  // Segnali di obbligo
  // ==================================================

  // Topic 1
  // Caratteristiche dei segnali di obbligo

  {
    id: "forma-segnali-obbligo",
    argomentoId: "segnali-obbligo",
    topicId: "caratteristiche-segnali-obbligo",
    title: "Forma dei segnali di obbligo",
    description:
      "Forma circolare e caratteristiche generali dei segnali di obbligo.",
    icon: "🔵",
    topicOrder: 1,
    order: 1
  },
  {
    id: "colori-segnali-obbligo",
    argomentoId: "segnali-obbligo",
    topicId: "caratteristiche-segnali-obbligo",
    title: "Colori dei segnali di obbligo",
    description:
      "Fondo blu e simboli utilizzati per indicare il comportamento obbligatorio.",
    icon: "🔷",
    topicOrder: 1,
    order: 2
  },
  {
    id: "validita-segnali-obbligo",
    argomentoId: "segnali-obbligo",
    topicId: "caratteristiche-segnali-obbligo",
    title: "Validità degli obblighi",
    description:
      "Punto di inizio, applicazione e termine delle prescrizioni obbligatorie.",
    icon: "📍",
    topicOrder: 1,
    order: 3
  },
  {
    id: "comportamento-segnali-obbligo",
    argomentoId: "segnali-obbligo",
    topicId: "caratteristiche-segnali-obbligo",
    title: "Comportamento del conducente",
    description:
      "Obbligo di seguire la direzione o la prescrizione indicata dal segnale.",
    icon: "✅",
    topicOrder: 1,
    order: 4
  },

  // Topic 2
  // Direzioni obbligatorie

  {
    id: "direzione-obbligatoria-diritto",
    argomentoId: "segnali-obbligo",
    topicId: "direzioni-obbligatorie",
    title: "Direzione obbligatoria diritto",
    description:
      "Obbliga il conducente a proseguire diritto.",
    icon: "⬆️",
    topicOrder: 2,
    order: 1
  },
  {
    id: "direzione-obbligatoria-destra",
    argomentoId: "segnali-obbligo",
    topicId: "direzioni-obbligatorie",
    title: "Direzione obbligatoria a destra",
    description:
      "Obbliga il conducente a svoltare verso destra.",
    icon: "➡️",
    topicOrder: 2,
    order: 2
  },
  {
    id: "direzione-obbligatoria-sinistra",
    argomentoId: "segnali-obbligo",
    topicId: "direzioni-obbligatorie",
    title: "Direzione obbligatoria a sinistra",
    description:
      "Obbliga il conducente a svoltare verso sinistra.",
    icon: "⬅️",
    topicOrder: 2,
    order: 3
  },
  {
    id: "direzioni-consentite-diritto-destra",
    argomentoId: "segnali-obbligo",
    topicId: "direzioni-obbligatorie",
    title: "Direzioni consentite diritto e destra",
    description:
      "Consente di proseguire diritto oppure di svoltare a destra.",
    icon: "↗️",
    topicOrder: 2,
    order: 4
  },
  {
    id: "direzioni-consentite-diritto-sinistra",
    argomentoId: "segnali-obbligo",
    topicId: "direzioni-obbligatorie",
    title: "Direzioni consentite diritto e sinistra",
    description:
      "Consente di proseguire diritto oppure di svoltare a sinistra.",
    icon: "↖️",
    topicOrder: 2,
    order: 5
  },
  {
    id: "direzioni-consentite-destra-sinistra",
    argomentoId: "segnali-obbligo",
    topicId: "direzioni-obbligatorie",
    title: "Direzioni consentite destra e sinistra",
    description:
      "Consente di svoltare a destra oppure a sinistra.",
    icon: "↔️",
    topicOrder: 2,
    order: 6
  },

  // Topic 3
  // Passaggi obbligatori

  {
    id: "passaggio-obbligatorio-destra",
    argomentoId: "segnali-obbligo",
    topicId: "passaggi-obbligatori",
    title: "Passaggio obbligatorio a destra",
    description:
      "Obbliga a superare un ostacolo passando sul lato destro.",
    icon: "↘️",
    topicOrder: 3,
    order: 1
  },
  {
    id: "passaggio-obbligatorio-sinistra",
    argomentoId: "segnali-obbligo",
    topicId: "passaggi-obbligatori",
    title: "Passaggio obbligatorio a sinistra",
    description:
      "Obbliga a superare un ostacolo passando sul lato sinistro.",
    icon: "↙️",
    topicOrder: 3,
    order: 2
  },
  {
    id: "passaggi-consentiti-destra-sinistra",
    argomentoId: "segnali-obbligo",
    topicId: "passaggi-obbligatori",
    title: "Passaggi consentiti a destra o a sinistra",
    description:
      "Consente di superare un ostacolo passando da uno dei due lati.",
    icon: "↔️",
    topicOrder: 3,
    order: 3
  },
  {
    id: "ostacolo-spartitraffico",
    argomentoId: "segnali-obbligo",
    topicId: "passaggi-obbligatori",
    title: "Passaggio presso ostacoli e spartitraffico",
    description:
      "Comportamento richiesto in presenza di isole, ostacoli o spartitraffico.",
    icon: "🚧",
    topicOrder: 3,
    order: 4
  },

  // Topic 4
  // Rotatoria

  {
    id: "segnale-rotatoria",
    argomentoId: "segnali-obbligo",
    topicId: "rotatoria",
    title: "Segnale di rotatoria",
    description:
      "Indica l'obbligo di circolare nel senso mostrato dalle frecce.",
    icon: "🔄",
    topicOrder: 4,
    order: 1
  },
  {
    id: "ingresso-rotatoria",
    argomentoId: "segnali-obbligo",
    topicId: "rotatoria",
    title: "Ingresso nella rotatoria",
    description:
      "Comportamento e controlli necessari prima di entrare nella rotatoria.",
    icon: "↪️",
    topicOrder: 4,
    order: 2
  },
  {
    id: "circolazione-interna-rotatoria",
    argomentoId: "segnali-obbligo",
    topicId: "rotatoria",
    title: "Circolazione nella rotatoria",
    description:
      "Direzione obbligatoria e comportamento durante la percorrenza.",
    icon: "⭕",
    topicOrder: 4,
    order: 3
  },
  {
    id: "uscita-rotatoria",
    argomentoId: "segnali-obbligo",
    topicId: "rotatoria",
    title: "Uscita dalla rotatoria",
    description:
      "Segnalazione e posizionamento corretti per uscire dalla rotatoria.",
    icon: "➡️",
    topicOrder: 4,
    order: 4
  },

  // Topic 5
  // Limite minimo di velocità

  {
    id: "segnale-limite-minimo-velocita",
    argomentoId: "segnali-obbligo",
    topicId: "limite-minimo-velocita",
    title: "Limite minimo di velocità",
    description:
      "Indica la velocità minima da mantenere quando le condizioni lo consentono.",
    icon: "🔢",
    topicOrder: 5,
    order: 1
  },
  {
    id: "comportamento-limite-minimo",
    argomentoId: "segnali-obbligo",
    topicId: "limite-minimo-velocita",
    title: "Comportamento con limite minimo",
    description:
      "Obblighi del conducente nel tratto soggetto a velocità minima.",
    icon: "🚗",
    topicOrder: 5,
    order: 2
  },
  {
    id: "veicoli-non-idonei-limite-minimo",
    argomentoId: "segnali-obbligo",
    topicId: "limite-minimo-velocita",
    title: "Veicoli non idonei al limite minimo",
    description:
      "Veicoli che non possono percorrere la strada senza rispettare la velocità minima.",
    icon: "🚜",
    topicOrder: 5,
    order: 3
  },
  {
    id: "fine-limite-minimo-velocita",
    argomentoId: "segnali-obbligo",
    topicId: "limite-minimo-velocita",
    title: "Fine del limite minimo di velocità",
    description:
      "Indica il termine dell'obbligo di mantenere la velocità minima.",
    icon: "⚪",
    topicOrder: 5,
    order: 4
  },

  // Topic 6
  // Catene per neve obbligatorie

  {
    id: "segnale-catene-neve-obbligatorie",
    argomentoId: "segnali-obbligo",
    topicId: "catene-neve-obbligatorie",
    title: "Catene per neve obbligatorie",
    description:
      "Impone l'uso di catene o dispositivi antisdrucciolevoli idonei.",
    icon: "⛓️",
    topicOrder: 6,
    order: 1
  },
  {
    id: "montaggio-catene-neve",
    argomentoId: "segnali-obbligo",
    topicId: "catene-neve-obbligatorie",
    title: "Montaggio delle catene",
    description:
      "Modalità generali di utilizzo delle catene sulle ruote motrici.",
    icon: "🛞",
    topicOrder: 6,
    order: 2
  },
  {
    id: "pneumatici-invernali",
    argomentoId: "segnali-obbligo",
    topicId: "catene-neve-obbligatorie",
    title: "Pneumatici invernali",
    description:
      "Uso di pneumatici adatti alle condizioni invernali come alternativa prevista.",
    icon: "❄️",
    topicOrder: 6,
    order: 3
  },
  {
    id: "guida-con-neve-ghiaccio",
    argomentoId: "segnali-obbligo",
    topicId: "catene-neve-obbligatorie",
    title: "Guida con neve e ghiaccio",
    description:
      "Prudenza, velocità ridotta e maggiore distanza di sicurezza.",
    icon: "🌨️",
    topicOrder: 6,
    order: 4
  },

  // Topic 7
  // Percorsi riservati

  {
    id: "percorso-pedonale",
    argomentoId: "segnali-obbligo",
    topicId: "percorsi-riservati",
    title: "Percorso pedonale",
    description:
      "Indica un percorso riservato esclusivamente ai pedoni.",
    icon: "🚶",
    topicOrder: 7,
    order: 1
  },
  {
    id: "pista-ciclabile-obbligatoria",
    argomentoId: "segnali-obbligo",
    topicId: "percorsi-riservati",
    title: "Pista ciclabile",
    description:
      "Indica un percorso riservato alla circolazione dei velocipedi.",
    icon: "🚲",
    topicOrder: 7,
    order: 2
  },
  {
    id: "percorso-pedonale-ciclabile",
    argomentoId: "segnali-obbligo",
    topicId: "percorsi-riservati",
    title: "Percorso pedonale e ciclabile",
    description:
      "Percorso condiviso o affiancato riservato a pedoni e ciclisti.",
    icon: "🚶‍➡️",
    topicOrder: 7,
    order: 3
  },
  {
    id: "percorso-riservato-quadrupedi",
    argomentoId: "segnali-obbligo",
    topicId: "percorsi-riservati",
    title: "Percorso riservato ai quadrupedi",
    description:
      "Indica un percorso obbligatorio destinato agli animali condotti.",
    icon: "🐎",
    topicOrder: 7,
    order: 4
  },
  {
    id: "percorso-riservato-categorie-specifiche",
    argomentoId: "segnali-obbligo",
    topicId: "percorsi-riservati",
    title: "Percorsi per categorie specifiche",
    description:
      "Percorsi obbligatori destinati alle categorie rappresentate nel segnale.",
    icon: "👥",
    topicOrder: 7,
    order: 5
  },

  // Topic 8
  // Fine degli obblighi

  {
    id: "fine-direzione-obbligatoria",
    argomentoId: "segnali-obbligo",
    topicId: "fine-obblighi",
    title: "Fine della direzione obbligatoria",
    description:
      "Termine della prescrizione relativa alla direzione di marcia.",
    icon: "⚪",
    topicOrder: 8,
    order: 1
  },
  {
    id: "fine-limite-minimo-subtopic",
    argomentoId: "segnali-obbligo",
    topicId: "fine-obblighi",
    title: "Fine del limite minimo",
    description:
      "Segnale che conclude l'obbligo di mantenere una velocità minima.",
    icon: "🔢",
    topicOrder: 8,
    order: 2
  },
  {
    id: "fine-pista-ciclabile",
    argomentoId: "segnali-obbligo",
    topicId: "fine-obblighi",
    title: "Fine della pista ciclabile",
    description:
      "Indica il termine del percorso obbligatorio riservato ai velocipedi.",
    icon: "🚲",
    topicOrder: 8,
    order: 3
  },
  {
    id: "fine-percorso-pedonale",
    argomentoId: "segnali-obbligo",
    topicId: "fine-obblighi",
    title: "Fine del percorso pedonale",
    description:
      "Indica il termine del percorso obbligatorio riservato ai pedoni.",
    icon: "🚶",
    topicOrder: 8,
    order: 4
  },
  {
    id: "fine-obbligo-generico",
    argomentoId: "segnali-obbligo",
    topicId: "fine-obblighi",
    title: "Fine dell'obbligo",
    description:
      "Indica il termine della prescrizione obbligatoria precedentemente imposta.",
    icon: "✅",
    topicOrder: 8,
    order: 5
  },
    // ==================================================
  // ARGOMENTO 5
  // Segnali di precedenza
  // ==================================================

  // Topic 1
  // Caratteristiche dei segnali di precedenza

  {
    id: "forme-segnali-precedenza",
    argomentoId: "segnali-precedenza",
    topicId: "caratteristiche-segnali-precedenza",
    title: "Forme dei segnali di precedenza",
    description:
      "Forme particolari che consentono di riconoscere i principali segnali di precedenza.",
    icon: "🔻",
    topicOrder: 1,
    order: 1
  },
  {
    id: "significato-segnali-precedenza",
    argomentoId: "segnali-precedenza",
    topicId: "caratteristiche-segnali-precedenza",
    title: "Significato dei segnali di precedenza",
    description:
      "Regole che stabiliscono chi deve passare per primo nelle intersezioni.",
    icon: "➡️",
    topicOrder: 1,
    order: 2
  },
  {
    id: "collocazione-segnali-precedenza",
    argomentoId: "segnali-precedenza",
    topicId: "caratteristiche-segnali-precedenza",
    title: "Collocazione dei segnali",
    description:
      "Posizione dei segnali rispetto all'intersezione o al tratto interessato.",
    icon: "📍",
    topicOrder: 1,
    order: 3
  },
  {
    id: "comportamento-generale-precedenza",
    argomentoId: "segnali-precedenza",
    topicId: "caratteristiche-segnali-precedenza",
    title: "Comportamento generale",
    description:
      "Prudenza, riduzione della velocità e controllo degli altri veicoli.",
    icon: "🚗",
    topicOrder: 1,
    order: 4
  },

  // Topic 2
  // Dare precedenza

  {
    id: "segnale-dare-precedenza",
    argomentoId: "segnali-precedenza",
    topicId: "dare-precedenza",
    title: "Segnale Dare precedenza",
    description:
      "Obbliga a concedere la precedenza ai veicoli che circolano sulla strada favorita.",
    icon: "🔻",
    topicOrder: 2,
    order: 1
  },
  {
    id: "rallentamento-dare-precedenza",
    argomentoId: "segnali-precedenza",
    topicId: "dare-precedenza",
    title: "Obbligo di rallentare",
    description:
      "Il conducente deve ridurre la velocità e verificare che l'intersezione sia libera.",
    icon: "🐢",
    topicOrder: 2,
    order: 2
  },
  {
    id: "arresto-con-dare-precedenza",
    argomentoId: "segnali-precedenza",
    topicId: "dare-precedenza",
    title: "Arresto quando necessario",
    description:
      "Con il segnale Dare precedenza occorre fermarsi quando la situazione lo richiede.",
    icon: "🛑",
    topicOrder: 2,
    order: 3
  },
  {
    id: "linea-dare-precedenza",
    argomentoId: "segnali-precedenza",
    topicId: "dare-precedenza",
    title: "Linea di dare precedenza",
    description:
      "Segnaletica orizzontale che indica il punto entro il quale concedere la precedenza.",
    icon: "🔺",
    topicOrder: 2,
    order: 4
  },
  {
    id: "preavviso-dare-precedenza",
    argomentoId: "segnali-precedenza",
    topicId: "dare-precedenza",
    title: "Preavviso di Dare precedenza",
    description:
      "Segnale che anticipa la presenza del Dare precedenza e ne indica la distanza.",
    icon: "📏",
    topicOrder: 2,
    order: 5
  },

  // Topic 3
  // Fermarsi e dare precedenza – STOP

  {
    id: "segnale-stop",
    argomentoId: "segnali-precedenza",
    topicId: "stop",
    title: "Segnale STOP",
    description:
      "Obbliga ad arrestarsi e a concedere la precedenza prima dell'intersezione.",
    icon: "🛑",
    topicOrder: 3,
    order: 1
  },
  {
    id: "arresto-obbligatorio-stop",
    argomentoId: "segnali-precedenza",
    topicId: "stop",
    title: "Arresto obbligatorio",
    description:
      "Con il segnale STOP il veicolo deve fermarsi anche quando la strada appare libera.",
    icon: "⏹️",
    topicOrder: 3,
    order: 2
  },
  {
    id: "punto-arresto-stop",
    argomentoId: "segnali-precedenza",
    topicId: "stop",
    title: "Punto di arresto",
    description:
      "Il conducente deve fermarsi in corrispondenza della linea di arresto.",
    icon: "➖",
    topicOrder: 3,
    order: 3
  },
  {
    id: "ripartenza-dopo-stop",
    argomentoId: "segnali-precedenza",
    topicId: "stop",
    title: "Ripartenza dopo lo STOP",
    description:
      "Dopo l'arresto si può ripartire soltanto senza creare pericolo o intralcio.",
    icon: "▶️",
    topicOrder: 3,
    order: 4
  },
  {
    id: "preavviso-stop",
    argomentoId: "segnali-precedenza",
    topicId: "stop",
    title: "Preavviso di STOP",
    description:
      "Segnale che anticipa l'obbligo di fermarsi e indica la distanza dall'intersezione.",
    icon: "📏",
    topicOrder: 3,
    order: 5
  },

  // Topic 4
  // Intersezione con precedenza a destra

  {
    id: "segnale-intersezione-precedenza-destra",
    argomentoId: "segnali-precedenza",
    topicId: "intersezione-precedenza-destra",
    title: "Intersezione con precedenza a destra",
    description:
      "Preannuncia un'intersezione nella quale vale la regola generale della destra.",
    icon: "✳️",
    topicOrder: 4,
    order: 1
  },
  {
    id: "regola-destra-intersezione",
    argomentoId: "segnali-precedenza",
    topicId: "intersezione-precedenza-destra",
    title: "Regola della precedenza a destra",
    description:
      "Occorre concedere la precedenza ai veicoli provenienti dalla propria destra.",
    icon: "➡️",
    topicOrder: 4,
    order: 2
  },
  {
    id: "riduzione-velocita-intersezione",
    argomentoId: "segnali-precedenza",
    topicId: "intersezione-precedenza-destra",
    title: "Riduzione della velocità",
    description:
      "È necessario avvicinarsi all'intersezione con prudenza e velocità moderata.",
    icon: "⚠️",
    topicOrder: 4,
    order: 3
  },
  {
    id: "controllo-lati-intersezione",
    argomentoId: "segnali-precedenza",
    topicId: "intersezione-precedenza-destra",
    title: "Controllo dell'intersezione",
    description:
      "Prima di impegnare l'incrocio bisogna controllare i veicoli provenienti dai lati.",
    icon: "👀",
    topicOrder: 4,
    order: 4
  },

  // Topic 5
  // Diritto di precedenza

  {
    id: "segnale-diritto-precedenza",
    argomentoId: "segnali-precedenza",
    topicId: "diritto-precedenza",
    title: "Diritto di precedenza",
    description:
      "Indica che il conducente ha la precedenza nella successiva intersezione.",
    icon: "🔶",
    topicOrder: 5,
    order: 1
  },
  {
    id: "strada-diritto-precedenza",
    argomentoId: "segnali-precedenza",
    topicId: "diritto-precedenza",
    title: "Strada con diritto di precedenza",
    description:
      "Indica l'inizio di una strada sulla quale si ha precedenza nelle intersezioni.",
    icon: "🟨",
    topicOrder: 5,
    order: 2
  },
  {
    id: "comportamento-con-diritto-precedenza",
    argomentoId: "segnali-precedenza",
    topicId: "diritto-precedenza",
    title: "Comportamento con diritto di precedenza",
    description:
      "Anche chi ha la precedenza deve procedere con prudenza e prevenire situazioni pericolose.",
    icon: "✅",
    topicOrder: 5,
    order: 3
  },
  {
    id: "intersezioni-strada-prioritaria",
    argomentoId: "segnali-precedenza",
    topicId: "diritto-precedenza",
    title: "Intersezioni sulla strada prioritaria",
    description:
      "Applicazione del diritto di precedenza nelle intersezioni lungo la strada favorita.",
    icon: "🔀",
    topicOrder: 5,
    order: 4
  },
  {
    id: "prudenza-diritto-precedenza",
    argomentoId: "segnali-precedenza",
    topicId: "diritto-precedenza",
    title: "Prudenza anche con precedenza",
    description:
      "Il diritto di precedenza non autorizza a procedere senza attenzione.",
    icon: "⚠️",
    topicOrder: 5,
    order: 5
  },

  // Topic 6
  // Fine del diritto di precedenza

  {
    id: "segnale-fine-diritto-precedenza",
    argomentoId: "segnali-precedenza",
    topicId: "fine-diritto-precedenza",
    title: "Fine del diritto di precedenza",
    description:
      "Indica il termine della strada sulla quale si aveva diritto di precedenza.",
    icon: "◻️",
    topicOrder: 6,
    order: 1
  },
  {
    id: "comportamento-fine-precedenza",
    argomentoId: "segnali-precedenza",
    topicId: "fine-diritto-precedenza",
    title: "Comportamento dopo la fine",
    description:
      "Dopo il segnale occorre verificare le nuove regole applicabili alle intersezioni.",
    icon: "👀",
    topicOrder: 6,
    order: 2
  },
  {
    id: "ritorno-regole-generali-precedenza",
    argomentoId: "segnali-precedenza",
    topicId: "fine-diritto-precedenza",
    title: "Ritorno alle regole generali",
    description:
      "In assenza di altri segnali può tornare applicabile la precedenza a destra.",
    icon: "➡️",
    topicOrder: 6,
    order: 3
  },
  {
    id: "differenza-diritto-fine-precedenza",
    argomentoId: "segnali-precedenza",
    topicId: "fine-diritto-precedenza",
    title: "Diritto e fine del diritto",
    description:
      "Differenze visive e di significato tra i due segnali.",
    icon: "📋",
    topicOrder: 6,
    order: 4
  },

  // Topic 7
  // Precedenza nei sensi unici alternati

  {
    id: "dare-precedenza-senso-unico-alternato",
    argomentoId: "segnali-precedenza",
    topicId: "precedenza-sensi-unici-alternati",
    title: "Dare precedenza nel senso unico alternato",
    description:
      "Obbliga a concedere il passaggio ai veicoli provenienti dal senso opposto.",
    icon: "🔴",
    topicOrder: 7,
    order: 1
  },
  {
    id: "diritto-precedenza-senso-unico-alternato",
    argomentoId: "segnali-precedenza",
    topicId: "precedenza-sensi-unici-alternati",
    title: "Diritto di precedenza nel senso unico alternato",
    description:
      "Indica il diritto di passare prima dei veicoli provenienti dal senso opposto.",
    icon: "🔵",
    topicOrder: 7,
    order: 2
  },
  {
    id: "strettoia-senso-unico-alternato",
    argomentoId: "segnali-precedenza",
    topicId: "precedenza-sensi-unici-alternati",
    title: "Strettoia con transito alternato",
    description:
      "Regolazione del passaggio quando la carreggiata non consente il transito contemporaneo.",
    icon: "↕️",
    topicOrder: 7,
    order: 3
  },
  {
    id: "frecce-rosse-nere-precedenza",
    argomentoId: "segnali-precedenza",
    topicId: "precedenza-sensi-unici-alternati",
    title: "Significato delle frecce",
    description:
      "Interpretazione delle frecce rosse, nere e bianche nei segnali di precedenza alternata.",
    icon: "⬆️",
    topicOrder: 7,
    order: 4
  },
  {
    id: "prudenza-strettoie-precedenza",
    argomentoId: "segnali-precedenza",
    topicId: "precedenza-sensi-unici-alternati",
    title: "Prudenza nelle strettoie",
    description:
      "Verifica dello spazio disponibile e comportamento sicuro prima di impegnare la strettoia.",
    icon: "⚠️",
    topicOrder: 7,
    order: 5
  },
];

/**
 * নির্দিষ্ট Topic-এর Subtopic return করে।
 */
export function getOfficialSubtopicsByTopic(
  topicId
) {
  const safeTopicId =
    String(topicId || "").trim();

  if (!safeTopicId) {
    return [];
  }

  return officialSubtopics
    .filter(
      (subtopic) =>
        subtopic.topicId ===
        safeTopicId
    )
    .sort(
      (first, second) =>
        Number(first.order || 0) -
        Number(second.order || 0)
    );
}

/**
 * নির্দিষ্ট Argomento-এর সব Subtopic return করে।
 */
export function getOfficialSubtopicsByArgomento(
  argomentoId
) {
  const safeArgomentoId =
    String(argomentoId || "").trim();

  if (!safeArgomentoId) {
    return [];
  }

  return officialSubtopics
    .filter(
      (subtopic) =>
        subtopic.argomentoId ===
        safeArgomentoId
    )
    .sort(
      (first, second) => {
        const topicOrderDifference =
          Number(
            first.topicOrder || 0
          ) -
          Number(
            second.topicOrder || 0
          );

        if (
          topicOrderDifference !== 0
        ) {
          return topicOrderDifference;
        }

        return (
          Number(first.order || 0) -
          Number(second.order || 0)
        );
      }
    );
}

/**
 * ID দিয়ে একটি Subtopic খুঁজে দেয়।
 */
export function getOfficialSubtopicById(
  subtopicId
) {
  const safeSubtopicId =
    String(subtopicId || "").trim();

  if (!safeSubtopicId) {
    return null;
  }

  return (
    officialSubtopics.find(
      (subtopic) =>
        subtopic.id ===
        safeSubtopicId
    ) || null
  );
}

/**
 * Topic-এর মধ্যে Subtopic ID আছে কি না।
 */
export function isOfficialSubtopicForTopic(
  subtopicId,
  topicId
) {
  const subtopic =
    getOfficialSubtopicById(
      subtopicId
    );

  return Boolean(
    subtopic &&
    subtopic.topicId === topicId
  );
}

/**
 * Duplicate ID এবং invalid data পরীক্ষা করে।
 *
 * Development ও debugging-এর সময় ব্যবহার করা যাবে।
 */
export function validateOfficialSubtopics() {
  const errors = [];
  const usedIds = new Set();
  const usedOrders = new Set();

  officialSubtopics.forEach(
    (subtopic, index) => {
      const position = index + 1;

      if (!subtopic?.id) {
        errors.push(
          `Subtopic ${position}: ID mancante.`
        );
      }

      if (!subtopic?.argomentoId) {
        errors.push(
          `Subtopic ${position}: argomentoId mancante.`
        );
      }

      if (!subtopic?.topicId) {
        errors.push(
          `Subtopic ${position}: topicId mancante.`
        );
      }

      if (!subtopic?.title) {
        errors.push(
          `Subtopic ${position}: titolo mancante.`
        );
      }

      if (
        !Number.isInteger(
          Number(subtopic?.order)
        ) ||
        Number(subtopic?.order) < 1
      ) {
        errors.push(
          `Subtopic ${position}: ordine non valido.`
        );
      }

      if (subtopic?.id) {
        if (usedIds.has(subtopic.id)) {
          errors.push(
            `ID duplicato: ${subtopic.id}`
          );
        }

        usedIds.add(subtopic.id);
      }

      if (
        subtopic?.topicId &&
        Number.isInteger(
          Number(subtopic?.order)
        )
      ) {
        const orderKey =
          `${subtopic.topicId}:` +
          `${Number(subtopic.order)}`;

        if (usedOrders.has(orderKey)) {
          errors.push(
            `Ordine duplicato nel topic ` +
            `${subtopic.topicId}: ` +
            `${subtopic.order}`
          );
        }

        usedOrders.add(orderKey);
      }
    }
  );

  return {
    valid: errors.length === 0,
    errors,
    total:
      officialSubtopics.length
  };
}