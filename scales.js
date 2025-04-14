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
    //      SCALE MAGGIORI / MINORI
    // =================================
    {
        name: "Scala Maggiore (Ionian Mode)",
        genre: "Major/Minor",
        intervals: [0, 2, 4, 5, 7, 9, 11] // W-W-H-W-W-W-H (Whole, Half steps)
        // Il 'key' e 'midis' verranno aggiunti dinamicamente in base alla scelta dell'utente
        // Ma possiamo pre-calcolarne uno per default/esempio
        // key: "C4", midis: generateScaleMidi("C4", [0, 2, 4, 5, 7, 9, 11])
    },
    {
        name: "Scala Minore Naturale (Aeolian Mode)",
        genre: "Major/Minor",
        intervals: [0, 2, 3, 5, 7, 8, 10] // W-H-W-W-H-W-W
        // key: "A3", midis: generateScaleMidi("A3", [0, 2, 3, 5, 7, 8, 10])
    },
    {
        name: "Scala Minore Armonica",
        genre: "Major/Minor",
        intervals: [0, 2, 3, 5, 7, 8, 11] // W-H-W-W-H-WH-H (WH = Whole+Half = 3 semitones)
        // key: "A3", midis: generateScaleMidi("A3", [0, 2, 3, 5, 7, 8, 11])

    },
    {
        name: "Scala Minore Melodica (Ascendente)",
        genre: "Major/Minor",
        intervals: [0, 2, 3, 5, 7, 9, 11] // W-H-W-W-W-W-H
        // key: "A3", midis: generateScaleMidi("A3", [0, 2, 3, 5, 7, 9, 11])
    },

    // =================================
    //          SCALE BLUES
    // =================================
    {
        name: "Scala Blues Minore",
        genre: "Blues",
        intervals: [0, 3, 5, 6, 7, 10] // Minor Pentatonic + b5
        // key: "A3", midis: generateScaleMidi("A3", [0, 3, 5, 6, 7, 10])
    },
     {
        name: "Scala Blues Maggiore",
        genre: "Blues",
        intervals: [0, 2, 3, 4, 7, 9] // Major Scale con b3 e b7 o Major Pentatonic + b3? Più comune: [0, 2, 3, 4, 7, 9]
        // key: "C4", midis: generateScaleMidi("C4", [0, 2, 3, 4, 7, 9])
    },

    // =================================
    //          SCALE PENTATONICHE
    // =================================
    {
        name: "Scala Pentatonica Maggiore",
        genre: "Pentatonic",
        intervals: [0, 2, 4, 7, 9]
        // key: "C4", midis: generateScaleMidi("C4", [0, 2, 4, 7, 9])
    },
    {
        name: "Scala Pentatonica Minore",
        genre: "Pentatonic",
        intervals: [0, 3, 5, 7, 10]
        // key: "A3", midis: generateScaleMidi("A3", [0, 3, 5, 7, 10])
    },

    // =================================
    //          MODI JAZZ (dalla scala Maggiore)
    // =================================
    {
        name: "Modo Dorico (Dorian)", // ii grado della Maggiore
        genre: "Jazz Modes",
        intervals: [0, 2, 3, 5, 7, 9, 10] // W-H-W-W-W-H-W
        // key: "D4", midis: generateScaleMidi("D4", [0, 2, 3, 5, 7, 9, 10])
    },
    {
        name: "Modo Frigio (Phrygian)", // iii grado della Maggiore
        genre: "Jazz Modes",
        intervals: [0, 1, 3, 5, 7, 8, 10] // H-W-W-W-H-W-W
        // key: "E4", midis: generateScaleMidi("E4", [0, 1, 3, 5, 7, 8, 10])
    },
    {
        name: "Modo Lidio (Lydian)", // IV grado della Maggiore
        genre: "Jazz Modes",
        intervals: [0, 2, 4, 6, 7, 9, 11] // W-W-W-H-W-W-H
        // key: "F4", midis: generateScaleMidi("F4", [0, 2, 4, 6, 7, 9, 11])
    },
    {
        name: "Modo Misolidio (Mixolydian)", // V grado della Maggiore
        genre: "Jazz Modes",
        intervals: [0, 2, 4, 5, 7, 9, 10] // W-W-H-W-W-H-W (Dominant scale)
        // key: "G4", midis: generateScaleMidi("G4", [0, 2, 4, 5, 7, 9, 10])
    },
    // Aeolian = Natural Minor (già presente)
    // Ionian = Major (già presente)
    {
        name: "Modo Locrio (Locrian)", // vii grado della Maggiore
        genre: "Jazz Modes",
        intervals: [0, 1, 3, 5, 6, 8, 10] // H-W-W-H-W-W-W
        // key: "B3", midis: generateScaleMidi("B3", [0, 1, 3, 5, 6, 8, 10])
    },

    // =================================
    //      ALTRE SCALE JAZZ/ESOTICHE
    // =================================
     {
        name: "Scala Diminuita (WH - Tono/Semitono)", // Whole-Half
        genre: "Jazz/Exotic",
        intervals: [0, 2, 3, 5, 6, 8, 9, 11] // Simmetrica, 8 note
        // key: "C4", midis: generateScaleMidi("C4", [0, 2, 3, 5, 6, 8, 9, 11])
    },
    {
        name: "Scala Diminuita (HW - Semitono/Tono)", // Half-Whole
        genre: "Jazz/Exotic",
        intervals: [0, 1, 3, 4, 6, 7, 9, 10] // Simmetrica, 8 note
        // key: "C4", midis: generateScaleMidi("C4", [0, 1, 3, 4, 6, 7, 9, 10])
    },
    {
        name: "Scala Esatonale (Whole Tone)",
        genre: "Jazz/Exotic",
        intervals: [0, 2, 4, 6, 8, 10] // Solo toni interi, 6 note
        // key: "C4", midis: generateScaleMidi("C4", [0, 2, 4, 6, 8, 10])
    },
    {
        name: "Scala Lidia Dominante (Lydian Dominant)", // IV modo della Minore Melodica
        genre: "Jazz Modes",
        intervals: [0, 2, 4, 6, 7, 9, 10] // Come Lidia ma con b7 (Misolidia con #4)
        // key: "F4", midis: generateScaleMidi("F4", [0, 2, 4, 6, 7, 9, 10])
    },
    {
        name: "Scala Alterata (Super Locrian)", // VII modo della Minore Melodica
        genre: "Jazz Modes",
        intervals: [0, 1, 3, 4, 6, 8, 10] // Usata su V7alt
        // key: "B3", midis: generateScaleMidi("B3", [0, 1, 3, 4, 6, 8, 10])
    },

    // Aggiungi qui altre scale se necessario...
];