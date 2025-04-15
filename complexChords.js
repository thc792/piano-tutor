// complexChords.js

// Helper (lo stesso di progressions.js e scales.js, per consistenza)
// Idealmente, questa funzione dovrebbe essere in un file utility condiviso
const noteNameToMidi_Complex = (noteName) => {
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

// NOTA: La funzione buildChord aggiornata dovrà essere definita
// nel tuo script principale o in un file utility per essere usata qui.
// Questa lista definisce solo i TIPI di accordi complessi.

const COMPLEX_CHORDS_DATA = [
    // =================================
    //      ACCORDI DI SESTA
    // =================================
    {
        name: "Maggiore Sesta (maj6)",
        type: "maj6", // Intervalli: R, 3, 5, 6 (0, 4, 7, 9)
        genre: "Complex/Extended"
    },
    {
        name: "Minore Sesta (min6)",
        type: "min6", // Intervalli: R, b3, 5, 6 (0, 3, 7, 9)
        genre: "Complex/Extended"
    },

    // =================================
    //      ACCORDI DI NONA
    // =================================
    {
        name: "Maggiore Nona (maj9)",
        type: "maj9", // Intervalli: R, 3, 5, 7, 9 (0, 4, 7, 11, 14)
        genre: "Complex/Extended"
    },
    {
        name: "Minore Nona (min9)",
        type: "min9", // Intervalli: R, b3, 5, b7, 9 (0, 3, 7, 10, 14)
        genre: "Complex/Extended"
    },
    {
        name: "Dominante Nona (9)",
        type: "9",    // Intervalli: R, 3, 5, b7, 9 (0, 4, 7, 10, 14)
        genre: "Complex/Extended"
    },
    {
        name: "Sesta/Nona (6/9)",
        type: "6/9",  // Intervalli: R, 3, 5, 6, 9 (0, 4, 7, 9, 14)
        genre: "Complex/Extended"
    },
    {
        name: "Minore Sesta/Nona (m6/9)",
        type: "m6/9", // Intervalli: R, b3, 5, 6, 9 (0, 3, 7, 9, 14)
        genre: "Complex/Extended"
    },
    {
        name: "Minore (Maggiore Settima) (m(maj7))", // Es: Cm(maj7)
        type: "m(maj7)", // Intervalli: R, b3, 5, 7 (0, 3, 7, 11)
        genre: "Complex/Extended"
    },

    // =================================
    //      ACCORDI DI UNDICESIMA
    // =================================
    // Nota: L'11 giusta spesso si omette negli accordi Maj/Dom se non è #11
    {
        name: "Minore Undicesima (min11)",
        type: "min11", // Intervalli: R, b3, 5, b7, 9, 11 (0, 3, 7, 10, 14, 17)
        genre: "Complex/Extended"
    },
    {
        name: "Maggiore Settima #11 (maj7#11)",
        type: "maj7#11", // Intervalli: R, 3, 5, 7, 9, #11 (0, 4, 7, 11, 14, 18)
        genre: "Complex/Extended"
    },
    {
        name: "Dominante Settima #11 (7#11)",
        type: "7#11", // Intervalli: R, 3, 5, b7, 9, #11 (0, 4, 7, 10, 14, 18)
        genre: "Complex/Extended"
    },

    // =================================
    //      ACCORDI DI TREDICESIMA
    // =================================
    // Nota: L'11 giusta si omette quasi sempre negli accordi di 13a Maj/Dom
    {
        name: "Maggiore Tredicesima (maj13)",
        type: "maj13", // Intervalli: R, 3, 5, 7, 9, 13 (0, 4, 7, 11, 14, 21)
        genre: "Complex/Extended"
    },
    {
        name: "Minore Tredicesima (min13)",
        type: "min13", // Intervalli: R, b3, 5, b7, 9, 13 (0, 3, 7, 10, 14, 21)
        genre: "Complex/Extended"
    },
    {
        name: "Dominante Tredicesima (13)",
        type: "13",    // Intervalli: R, 3, 5, b7, 9, 13 (0, 4, 7, 10, 14, 21)
        genre: "Complex/Extended"
    },

    // =================================
    //      ACCORDI ALTERATI (Dominanti)
    // =================================
    {
        name: "Dominante 7 b9 (7b9)",
        type: "7b9",  // Intervalli: R, 3, 5, b7, b9 (0, 4, 7, 10, 13)
        genre: "Complex/Extended"
    },
    {
        name: "Dominante 7 #9 (7#9)",
        type: "7#9",  // Intervalli: R, 3, 5, b7, #9 (0, 4, 7, 10, 15)
        genre: "Complex/Extended"
    },
    {
        name: "Dominante 7 #5 (7#5 / Aug7)",
        type: "7#5",  // Intervalli: R, 3, #5, b7 (0, 4, 8, 10)
        genre: "Complex/Extended"
    },
    {
        name: "Dominante 7 b5 (7b5)",
        type: "7b5",  // Intervalli: R, 3, b5, b7 (0, 4, 6, 10)
        genre: "Complex/Extended"
    },
    {
        name: "Dominante 7 b13 (7b13)",
        type: "7b13", // Intervalli: R, 3, 5, b7, (9), b13 (0, 4, 7, 10, 20) - Semplificato senza 9
        genre: "Complex/Extended"
    },
    {
        name: "Dominante 7 b9 #11 (7b9#11)", // Esempio di alterazione multipla
        type: "7b9#11", // Intervalli: R, 3, 5, b7, b9, #11 (0, 4, 7, 10, 13, 18)
        genre: "Complex/Extended"
    },
     {
        name: "Dominante 7 #9 b13 (7#9b13)", // Esempio di alterazione multipla
        type: "7#9b13", // Intervalli: R, 3, 5, b7, #9, b13 (0, 4, 7, 10, 15, 20)
        genre: "Complex/Extended"
    },
    // Nota: Un vero accordo "alt" (7alt) spesso implica b9, #9, b5/#11, #5/b13 in varie combinazioni.
    // Per semplicità, rappresentiamo qui specifiche alterazioni.

    // =================================
    //      ACCORDI SOSPESI (Suspended)
    // =================================
    {
        name: "Sospeso Quarta (sus4)",
        type: "sus4", // Intervalli: R, 4, 5 (0, 5, 7)
        genre: "Complex/Extended"
    },
    {
        name: "Sospeso Seconda (sus2)",
        type: "sus2", // Intervalli: R, 2, 5 (0, 2, 7)
        genre: "Complex/Extended"
    },
    {
        name: "Settima Sospeso Quarta (7sus4)",
        type: "7sus4", // Intervalli: R, 4, 5, b7 (0, 5, 7, 10)
        genre: "Complex/Extended"
    },
    {
        name: "Nona Sospeso Quarta (9sus4)",
        type: "9sus4", // Intervalli: R, 4, 5, b7, 9 (0, 5, 7, 10, 14)
        genre: "Complex/Extended"
    },

    // =================================
    //      ALTRI ACCORDI COMUNI
    // =================================
     {
        name: "Maggiore Settima b5 (maj7b5)",
        type: "maj7b5", // Intervalli: R, 3, b5, 7 (0, 4, 6, 11)
        genre: "Complex/Extended"
    },
    // Aggiungere altri accordi complessi se necessario...

]; // FINE ARRAY COMPLEX_CHORDS_DATA

// Rendi la variabile accessibile globalmente (o usa export se usi moduli)
// window.COMPLEX_CHORDS_DATA = COMPLEX_CHORDS_DATA; // Per script semplice