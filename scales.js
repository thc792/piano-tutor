// scales.js

// Helper (lo stesso di progressions.js, per consistenza)
const noteNameToMidi_Scale = (noteName) => {
    const noteMap = { 'C': 0, 'C#': 1, 'DB': 1, 'D': 2, 'D#': 3, 'EB': 3, 'E': 4, 'F': 5, 'F#': 6, 'GB': 6, 'G': 7, 'G#': 8, 'AB': 8, 'A': 9, 'A#': 10, 'BB': 10, 'B': 11 };
    const octavePattern = /(\d+)$/;
    const notePattern = /^([A-G][#b]?)/;
    const octaveMatch = noteName.match(octavePattern);
    const noteMatch = noteName.match(notePattern);
    if (!octaveMatch || !noteMatch) { console.warn("Formato nota non valido:", noteName); return null; }
    const note = noteMatch[1].toUpperCase();
    const octave = parseInt(octaveMatch[1], 10);
    if (noteMap[note] === undefined) { console.warn("Nota base non valida:", note); return null; }
    return noteMap[note] + (octave + 1) * 12;
};

// Funzione per generare le note MIDI di una scala dato il nome della tonica e gli intervalli
// Aggiunge anche la nota dell'ottava superiore per completare il ciclo
const generateScaleMidi = (rootNoteName, intervals) => {
    const rootMidi = noteNameToMidi_Scale(rootNoteName);
    if (rootMidi === null) return []; // Tonica non valida
    // Genera note + ottava
    const midiNotes = intervals.map(interval => rootMidi + interval);
    midiNotes.push(rootMidi + 12); // Aggiunge l'ottava
    return midiNotes;
};


const SCALES_DATA = [
    // =================================
    //      SCALE MAGGIORI / MINORI (Base)
    // =================================
    {
        name: "Scala Maggiore (Ionian)",
        genre: "Major/Minor",
        intervals: [0, 2, 4, 5, 7, 9, 11] // W-W-H-W-W-W-H
    },
    {
        name: "Scala Minore Naturale (Aeolian)",
        genre: "Major/Minor",
        intervals: [0, 2, 3, 5, 7, 8, 10] // W-H-W-W-H-W-W
    },
    {
        name: "Scala Minore Armonica",
        genre: "Major/Minor",
        intervals: [0, 2, 3, 5, 7, 8, 11] // W-H-W-W-H-WH-H
    },
    {
        name: "Scala Minore Melodica (Ascendente)",
        genre: "Major/Minor",
        intervals: [0, 2, 3, 5, 7, 9, 11] // W-H-W-W-W-W-H
    },
     {
        name: "Scala Minore Melodica (Classica Discendente)", // Uguale alla Naturale
        genre: "Major/Minor",
        intervals: [0, 2, 3, 5, 7, 8, 10] // W-H-W-W-H-W-W (Discendente = Naturale)
    },

    // =================================
    //          SCALE PENTATONICHE
    // =================================
    {
        name: "Scala Pentatonica Maggiore",
        genre: "Pentatonic",
        intervals: [0, 2, 4, 7, 9] // 1-2-3-5-6 della scala maggiore
    },
    {
        name: "Scala Pentatonica Minore",
        genre: "Pentatonic",
        intervals: [0, 3, 5, 7, 10] // 1-b3-4-5-b7 della scala minore naturale
    },
    {
        name: "Scala Pentatonica Egiziana (Suspended)",
        genre: "Pentatonic",
        intervals: [0, 2, 5, 7, 10] // 1-2-4-5-b7 (simile alla minore pentatonica senza la b3)
    },
    {
        name: "Scala Pentatonica Blues Minore", // Alias della Scala Blues Minore
        genre: "Pentatonic",
        intervals: [0, 3, 5, 6, 7, 10] // Pentatonica Minore + b5
    },
     {
        name: "Scala Pentatonica Blues Maggiore", // Alias della Scala Blues Maggiore
        genre: "Pentatonic",
        intervals: [0, 2, 3, 4, 7, 9] // Pentatonica Maggiore + b3
    },

    // =================================
    //          SCALE BLUES (Esatoniche)
    // =================================
    {
        name: "Scala Blues Minore (Hexatonic)",
        genre: "Blues",
        intervals: [0, 3, 5, 6, 7, 10] // 1-b3-4-b5-5-b7
    },
     {
        name: "Scala Blues Maggiore (Hexatonic)",
        genre: "Blues",
        intervals: [0, 2, 3, 4, 7, 9] // 1-2-b3-3-5-6
    },

    // =================================
    //          MODI DELLA SCALA MAGGIORE
    // =================================
    // Ionian (Maggiore) - Già presente
    {
        name: "Modo Dorico (Dorian)", // ii grado della Maggiore
        genre: "Modes (Major Scale)",
        intervals: [0, 2, 3, 5, 7, 9, 10] // W-H-W-W-W-H-W (Minore con 6 maggiore)
    },
    {
        name: "Modo Frigio (Phrygian)", // iii grado della Maggiore
        genre: "Modes (Major Scale)",
        intervals: [0, 1, 3, 5, 7, 8, 10] // H-W-W-W-H-W-W (Minore con b2)
    },
    {
        name: "Modo Lidio (Lydian)", // IV grado della Maggiore
        genre: "Modes (Major Scale)",
        intervals: [0, 2, 4, 6, 7, 9, 11] // W-W-W-H-W-W-H (Maggiore con #4)
    },
    {
        name: "Modo Misolidio (Mixolydian)", // V grado della Maggiore
        genre: "Modes (Major Scale)",
        intervals: [0, 2, 4, 5, 7, 9, 10] // W-W-H-W-W-H-W (Maggiore con b7 - Scala Dominante)
    },
    // Aeolian (Minore Naturale) - Già presente
    {
        name: "Modo Locrio (Locrian)", // vii grado della Maggiore
        genre: "Modes (Major Scale)",
        intervals: [0, 1, 3, 5, 6, 8, 10] // H-W-W-H-W-W-W (Minore con b2 e b5)
    },

    // =================================
    //      MODI DELLA SCALA MINORE MELODICA (Ascendente)
    // =================================
    // I Grado: Minore Melodica - Già presente
    {
        name: "Modo Dorico b2 (Phrygian #6)", // ii grado della Minore Melodica
        genre: "Modes (Melodic Minor)",
        intervals: [0, 1, 3, 5, 7, 9, 10] // H-W-W-W-W-H-W
    },
    {
        name: "Modo Lidio Aumentato (Lydian #5)", // iii grado della Minore Melodica
        genre: "Modes (Melodic Minor)",
        intervals: [0, 2, 4, 6, 8, 9, 11] // W-W-W-W-H-W-H (Lidio con 5 aumentata)
    },
    {
        name: "Modo Lidio Dominante (Lydian b7 / Mixolydian #4)", // IV grado della Minore Melodica
        genre: "Modes (Melodic Minor)",
        intervals: [0, 2, 4, 6, 7, 9, 10] // W-W-W-H-W-H-W (Misolidio con #4)
    },
    {
        name: "Modo Misolidio b6 (Mixolydian b13 / Aeolian Dominant)", // V grado della Minore Melodica
        genre: "Modes (Melodic Minor)",
        intervals: [0, 2, 4, 5, 7, 8, 10] // W-W-H-W-H-W-W (Misolidio con b6/b13)
    },
    {
        name: "Modo Locrio #2 (Locrian Natural 2 / Aeolian b5)", // vi grado della Minore Melodica
        genre: "Modes (Melodic Minor)",
        intervals: [0, 2, 3, 5, 6, 8, 10] // W-H-W-H-W-W-W (Locrio con 2 maggiore)
    },
    {
        name: "Scala Alterata (Super Locrian / Diminished Whole Tone)", // vii grado della Minore Melodica
        genre: "Modes (Melodic Minor)",
        intervals: [0, 1, 3, 4, 6, 8, 10] // H-W-H-W-W-W-W (Usata su V7alt)
    },

    // =================================
    //      MODI DELLA SCALA MINORE ARMONICA
    // =================================
    // I Grado: Minore Armonica - Già presente
    {
        name: "Modo Locrio #6 (Locrian Natural 6)", // ii grado della Minore Armonica
        genre: "Modes (Harmonic Minor)",
        intervals: [0, 1, 3, 5, 6, 9, 10] // H-W-W-H-WH-H-W
    },
    {
        name: "Modo Ionico #5 (Ionian Augmented)", // iii grado della Minore Armonica
        genre: "Modes (Harmonic Minor)",
        intervals: [0, 2, 4, 5, 8, 9, 11] // W-W-H-WH-H-W-H (Maggiore con 5 aumentata)
    },
    {
        name: "Modo Dorico #4 (Dorian #11 / Romanian Minor)", // iv grado della Minore Armonica
        genre: "Modes (Harmonic Minor)",
        intervals: [0, 2, 3, 6, 7, 9, 10] // W-H-WH-H-W-H-W (Dorico con #4)
    },
    {
        name: "Modo Frigio Dominante (Phrygian Major / Mixolydian b9 b13 / Spanish Gypsy)", // v grado della Minore Armonica
        genre: "Modes (Harmonic Minor)",
        intervals: [0, 1, 4, 5, 7, 8, 10] // H-WH-H-W-H-W-W (Misolidio con b2/b9 e b6/b13)
    },
    {
        name: "Modo Lidio #2 (Lydian #9)", // vi grado della Minore Armonica
        genre: "Modes (Harmonic Minor)",
        intervals: [0, 3, 4, 6, 7, 9, 11] // WH-H-W-H-W-W-H
    },
    {
        name: "Scala Alterata bb7 (Altered Dominant bb7 / Super Locrian bb7)", // vii grado della Minore Armonica
        genre: "Modes (Harmonic Minor)",
        intervals: [0, 1, 3, 4, 6, 8, 9] // H-W-H-W-W-H-W (Simile all'Alterata ma con bb7=M6)
    },

    // =================================
    //      SCALE SIMMETRICHE
    // =================================
     {
        name: "Scala Diminuita (WH - Tono/Semitono)", // Whole-Half Diminished
        genre: "Symmetrical",
        intervals: [0, 2, 3, 5, 6, 8, 9, 11] // 8 note: W-H-W-H-W-H-W-H
    },
    {
        name: "Scala Diminuita (HW - Semitono/Tono)", // Half-Whole Diminished
        genre: "Symmetrical",
        intervals: [0, 1, 3, 4, 6, 7, 9, 10] // 8 note: H-W-H-W-H-W-H-W
    },
    {
        name: "Scala Esatonale (Whole Tone)",
        genre: "Symmetrical",
        intervals: [0, 2, 4, 6, 8, 10] // 6 note: W-W-W-W-W-W
    },
    {
        name: "Scala Aumentata (Augmented Scale)",
        genre: "Symmetrical",
        intervals: [0, 3, 4, 7, 8, 11] // 6 note: WH-H-WH-H-WH-H (Alterna terza minore e semitono)
    },

    // =================================
    //      SCALE BEBOP (8 note)
    // =================================
    {
        name: "Scala Bebop Maggiore",
        genre: "Bebop",
        intervals: [0, 2, 4, 5, 7, 8, 9, 11] // Scala Maggiore + #5/b6 (passaggio tra 5 e 6)
    },
    {
        name: "Scala Bebop Dominante",
        genre: "Bebop",
        intervals: [0, 2, 4, 5, 7, 9, 10, 11] // Scala Misolidia + 7 maggiore (passaggio tra b7 e 1)
    },
    {
        name: "Scala Bebop Minore (Dorica)", // Una delle varianti comuni
        genre: "Bebop",
        intervals: [0, 2, 3, 4, 5, 7, 9, 10] // Scala Dorica + 3 maggiore (passaggio tra b3 e 4)
    },
    {
        name: "Scala Bebop Minore (Melodica)", // Altra variante
        genre: "Bebop",
        intervals: [0, 2, 3, 5, 7, 8, 9, 11] // Scala Minore Melodica + #5/b6 (passaggio tra 5 e 6)
    },

    // =================================
    //      SCALE ESOTICHE / WORLD
    // =================================
    {
        name: "Scala Ungherese Minore (Hungarian Minor / Gypsy Minor)",
        genre: "World/Exotic",
        intervals: [0, 2, 3, 6, 7, 8, 11] // W-H-WH-H-H-WH-H (Minore Armonica con #4)
    },
    {
        name: "Scala Ungherese Maggiore (Hungarian Major)",
        genre: "World/Exotic",
        intervals: [0, 3, 4, 6, 7, 9, 10] // WH-H-W-H-W-H-W (Lidio #2 #6)
    },
    {
        name: "Scala Araba (Double Harmonic Major)", // Nome più preciso
        genre: "World/Exotic",
        intervals: [0, 1, 4, 5, 7, 8, 11] // H-WH-H-W-H-WH-H (Spesso chiamata Double Harmonic Major o Byzantine)
    },
    {
        name: "Scala Bizantina (Byzantine Scale)", // Alias Double Harmonic Major
        genre: "World/Exotic",
        intervals: [0, 1, 4, 5, 7, 8, 11] // H-WH-H-W-H-WH-H
    },
    {
        name: "Scala Persiana (Persian Scale)",
        genre: "World/Exotic",
        intervals: [0, 1, 4, 5, 6, 8, 11] // H-WH-H-H-W-WH-H
    },
    {
        name: "Scala Giapponese Hirajoshi", // Una delle varianti comuni
        genre: "World/Exotic",
        intervals: [0, 2, 3, 7, 8] // W-H-WH-H-WH (Pentatonica)
    },
    {
        name: "Scala Giapponese Iwato",
        genre: "World/Exotic",
        intervals: [0, 1, 5, 6, 10] // H-WH-H-WH-W (Pentatonica)
    },
    {
        name: "Scala Giapponese Kumoi", // Una delle varianti comuni
        genre: "World/Exotic",
        intervals: [0, 2, 3, 7, 9] // W-H-WH-W-WH (Pentatonica)
    },
    {
        name: "Scala Enigmatica (Enigmatic Scale)",
        genre: "World/Exotic",
        intervals: [0, 1, 4, 6, 8, 10, 11] // H-WH-W-W-W-H-H
    },
    {
        name: "Scala Napoletana Minore (Neapolitan Minor)",
        genre: "World/Exotic",
        intervals: [0, 1, 3, 5, 7, 8, 11] // H-W-W-W-H-WH-H (Minore Armonica con b2)
    },
    {
        name: "Scala Napoletana Maggiore (Neapolitan Major)",
        genre: "World/Exotic",
        intervals: [0, 1, 3, 5, 7, 9, 11] // H-W-W-W-W-W-H (Minore Melodica con b2)
    },
    {
        name: "Scala Prometheus",
        genre: "World/Exotic",
        intervals: [0, 2, 4, 6, 9, 10] // W-W-W-WH-H-W (Esatonale)
    },
    {
        name: "Scala Tritone (Tritone Scale)",
        genre: "World/Exotic",
        intervals: [0, 1, 4, 6, 7, 10] // H-WH-W-H-WH-H (Esatonale, simmetrica)
    },


]; // FINE ARRAY SCALES_DATA

// Rendi la variabile accessibile globalmente (o usa export se usi moduli)
// window.SCALES_DATA = SCALES_DATA; // Per script semplice