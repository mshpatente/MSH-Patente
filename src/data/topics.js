export const topics = [
  // Segnali Stradali
  {
    id: "segnali-pericolo",
    argomentoId: "segnali",
    title: "Segnali di pericolo",
    description:
      "Forma, significato e comportamento davanti ai segnali di pericolo.",
    icon: "⚠️",
    order: 1
  },
  {
    id: "segnali-divieto",
    argomentoId: "segnali",
    title: "Segnali di divieto",
    description:
      "Divieti di transito, sosta, sorpasso e limitazioni.",
    icon: "⛔",
    order: 2
  },
  {
    id: "semafori",
    argomentoId: "segnali",
    title: "Semafori",
    description:
      "Significato delle luci semaforiche e comportamento corretto.",
    icon: "🚥",
    order: 3
  },

  // Precedenza
  {
    id: "precedenza-destra",
    argomentoId: "precedenza",
    title: "Precedenza a destra",
    description:
      "Regole da applicare negli incroci senza segnaletica.",
    icon: "➡️",
    order: 1
  },
  {
    id: "stop-dare-precedenza",
    argomentoId: "precedenza",
    title: "STOP e Dare precedenza",
    description:
      "Differenze e obblighi imposti dai due segnali.",
    icon: "🛑",
    order: 2
  },
  {
    id: "immissione-strada",
    argomentoId: "precedenza",
    title: "Immissione nella strada",
    description:
      "Precedenza durante l'uscita da parcheggi e proprietà private.",
    icon: "↪️",
    order: 3
  },

  // Velocità
  {
    id: "limiti-velocita",
    argomentoId: "velocita",
    title: "Limiti di velocità",
    description:
      "Limiti e comportamento sulle diverse categorie di strada.",
    icon: "🔢",
    order: 1
  },
  {
    id: "velocita-condizioni",
    argomentoId: "velocita",
    title: "Velocità e condizioni",
    description:
      "Adeguare la velocità al traffico, al meteo e alla visibilità.",
    icon: "🌧️",
    order: 2
  },
  {
    id: "spazio-arresto",
    argomentoId: "velocita",
    title: "Spazio di arresto",
    description:
      "Spazio di reazione, frenata e arresto del veicolo.",
    icon: "🛞",
    order: 3
  },

  // Sorpasso
  {
    id: "preparazione-sorpasso",
    argomentoId: "sorpasso",
    title: "Preparazione al sorpasso",
    description:
      "Controlli e segnalazioni prima di iniziare la manovra.",
    icon: "👀",
    order: 1
  },
  {
    id: "divieti-sorpasso",
    argomentoId: "sorpasso",
    title: "Divieti di sorpasso",
    description:
      "Curve, dossi, incroci e situazioni in cui non si può sorpassare.",
    icon: "🚫",
    order: 2
  },
  {
    id: "completamento-sorpasso",
    argomentoId: "sorpasso",
    title: "Completamento del sorpasso",
    description:
      "Rientro nella corsia e distanza dal veicolo sorpassato.",
    icon: "↩️",
    order: 3
  },

  // Sicurezza
  {
    id: "cinture-sicurezza",
    argomentoId: "sicurezza",
    title: "Cinture di sicurezza",
    description:
      "Obblighi del conducente e dei passeggeri.",
    icon: "🔒",
    order: 1
  },
  {
    id: "distanza-sicurezza",
    argomentoId: "sicurezza",
    title: "Distanza di sicurezza",
    description:
      "Come mantenere una distanza adeguata dal veicolo precedente.",
    icon: "↔️",
    order: 2
  },
  {
    id: "distrazioni-guida",
    argomentoId: "sicurezza",
    title: "Distrazioni alla guida",
    description:
      "Telefono, stanchezza e comportamenti pericolosi.",
    icon: "📵",
    order: 3
  }
];