// progressions.js

// Helper per convertire velocemente (non gestisce tutte le sfumature enarmoniche)
const noteNameToMidi = (noteName) => {
    const noteMap = { 'C': 0, 'C#': 1, 'DB': 1, 'D': 2, 'D#': 3, 'EB': 3, 'E': 4, 'F': 5, 'F#': 6, 'GB': 6, 'G': 7, 'G#': 8, 'AB': 8, 'A': 9, 'A#': 10, 'BB': 10, 'B': 11 };
    const octavePattern = /(\d+)$/; // Trova numero alla fine
    const notePattern = /^([A-G][#b]?)/; // Trova nome nota

    const octaveMatch = noteName.match(octavePattern);
    const noteMatch = noteName.match(notePattern);

    if (!octaveMatch || !noteMatch) {
        console.warn("Formato nota non valido:", noteName);
        return null; // Formato non valido
    }

    const note = noteMatch[1].toUpperCase();
    const octave = parseInt(octaveMatch[1], 10);

    if (noteMap[note] === undefined) {
         console.warn("Nota base non valida:", note);
         return null; // Nota non valida
    }

    return noteMap[note] + (octave + 1) * 12; // MIDI standard: C4 = 60
};

// ==================================================
//      FUNZIONE buildChord AGGIORNATA
// ==================================================
// Funzione buildChord AGGIORNATA per gestire accordi base E complessi
const buildChord = (rootMidi, type) => {
    if (rootMidi === null) return []; // Gestisce input non valido

    const root = rootMidi;
    // Intervalli base (in semitoni dalla fondamentale)
    const intervals = {
        b2: 1,   maj2: 2,
        b3: 3,   maj3: 4,
        p4: 5,   aug4: 6, sharp4: 6, // #4 / #11
        b5: 6,   p5: 7,   aug5: 8, sharp5: 8, // #5 / b13 (a volte)
        maj6: 9, b6: 8, // b6 / b13
        b7: 10,  maj7: 11,
        rootOct: 12,
        b9: 13,  maj9: 14, sharp9: 15, // #9
        maj11: 17, sharp11: 18, // #11
        b13: 20, maj13: 21
    };

    // Funzione helper per aggiungere intervalli alla fondamentale
    const getNote = (interval) => root + interval;

    // Converte il tipo in minuscolo per matching non case-sensitive
    const lowerType = type.toLowerCase();

    switch (lowerType) {
        // --- Triadi Base ---
        case 'maj':
            return [root, getNote(intervals.maj3), getNote(intervals.p5)];
        case 'min':
            return [root, getNote(intervals.b3), getNote(intervals.p5)];
        case 'dim':
            return [root, getNote(intervals.b3), getNote(intervals.b5)];
        case 'aug':
            return [root, getNote(intervals.maj3), getNote(intervals.aug5)];

        // --- Accordi di Settima Base ---
        case 'maj7':
            return [root, getNote(intervals.maj3), getNote(intervals.p5), getNote(intervals.maj7)];
        case 'min7':
            return [root, getNote(intervals.b3), getNote(intervals.p5), getNote(intervals.b7)];
        case '7': // Dominante 7
            return [root, getNote(intervals.maj3), getNote(intervals.p5), getNote(intervals.b7)];
        case 'm7b5': // Semidiminuita
            return [root, getNote(intervals.b3), getNote(intervals.b5), getNote(intervals.b7)];
        case 'dim7': // Diminuita 7
            // La settima diminuita è enarmonicamente una sesta maggiore (9 semitoni)
            return [root, getNote(intervals.b3), getNote(intervals.b5), getNote(intervals.maj6)];

        // --- Accordi di Sesta ---
        case 'maj6':
            return [root, getNote(intervals.maj3), getNote(intervals.p5), getNote(intervals.maj6)];
        case 'min6':
            return [root, getNote(intervals.b3), getNote(intervals.p5), getNote(intervals.maj6)];

        // --- Accordi di Nona ---
        case 'maj9':
            return [root, getNote(intervals.maj3), getNote(intervals.p5), getNote(intervals.maj7), getNote(intervals.maj9)];
        case 'min9':
            return [root, getNote(intervals.b3), getNote(intervals.p5), getNote(intervals.b7), getNote(intervals.maj9)];
        case '9': // Dominante 9
            return [root, getNote(intervals.maj3), getNote(intervals.p5), getNote(intervals.b7), getNote(intervals.maj9)];
        case '6/9':
            return [root, getNote(intervals.maj3), getNote(intervals.p5), getNote(intervals.maj6), getNote(intervals.maj9)];
        case 'm6/9':
            return [root, getNote(intervals.b3), getNote(intervals.p5), getNote(intervals.maj6), getNote(intervals.maj9)];
        case 'm(maj7)':
             return [root, getNote(intervals.b3), getNote(intervals.p5), getNote(intervals.maj7)];

        // --- Accordi di Undicesima ---
        // Nota: L'11 giusta (P4 un'ottava sopra) crea dissonanza con la 3a maggiore, quindi spesso omessa o alterata (#11) in accordi maj/dom.
        case 'min11': // Include 1,b3,5,b7,9,11
            return [root, getNote(intervals.b3), getNote(intervals.p5), getNote(intervals.b7), getNote(intervals.maj9), getNote(intervals.maj11)];
        case 'maj7#11': // Include 1,3,5,7,9,#11 (9 opzionale ma comune)
             // Voicing comune omette la 5, ma qui la includiamo per completezza teorica iniziale
             return [root, getNote(intervals.maj3), getNote(intervals.p5), getNote(intervals.maj7), getNote(intervals.maj9), getNote(intervals.sharp11)];
        case '7#11': // Include 1,3,5,b7,9,#11 (9 opzionale ma comune)
             return [root, getNote(intervals.maj3), getNote(intervals.p5), getNote(intervals.b7), getNote(intervals.maj9), getNote(intervals.sharp11)];

        // --- Accordi di Tredicesima ---
        // Nota: L'11 giusta è quasi sempre omessa in maj13/13. La 9 è comune. La 5 a volte omessa nel voicing pratico.
        case 'maj13': // Include 1,3,5,7,9,13 (11 omessa)
            return [root, getNote(intervals.maj3), getNote(intervals.p5), getNote(intervals.maj7), getNote(intervals.maj9), getNote(intervals.maj13)];
        case 'min13': // Include 1,b3,5,b7,9,11,13 (11 può essere presente)
            // Per semplicità, includiamo l'11 qui, anche se a volte omessa
            return [root, getNote(intervals.b3), getNote(intervals.p5), getNote(intervals.b7), getNote(intervals.maj9), getNote(intervals.maj11), getNote(intervals.maj13)];
        case '13': // Dominante 13 - Include 1,3,5,b7,9,13 (11 omessa)
            return [root, getNote(intervals.maj3), getNote(intervals.p5), getNote(intervals.b7), getNote(intervals.maj9), getNote(intervals.maj13)];

        // --- Accordi Alterati (Dominanti) ---
        case '7b9':
            return [root, getNote(intervals.maj3), getNote(intervals.p5), getNote(intervals.b7), getNote(intervals.b9)];
        case '7#9':
            return [root, getNote(intervals.maj3), getNote(intervals.p5), getNote(intervals.b7), getNote(intervals.sharp9)];
        case '7#5': // Aug7
            return [root, getNote(intervals.maj3), getNote(intervals.aug5), getNote(intervals.b7)];
        case '7b5':
            return [root, getNote(intervals.maj3), getNote(intervals.b5), getNote(intervals.b7)];
        case '7b13': // Spesso implica la 9, ma la omettiamo per semplicità base. b13 = aug5 enarmonicamente.
             return [root, getNote(intervals.maj3), getNote(intervals.p5), getNote(intervals.b7), getNote(intervals.b13)];
        case '7b9#11': // 5 spesso omessa nel voicing
             return [root, getNote(intervals.maj3), /*getNote(intervals.p5),*/ getNote(intervals.b7), getNote(intervals.b9), getNote(intervals.sharp11)];
        case '7#9b13': // 5 spesso omessa nel voicing
             return [root, getNote(intervals.maj3), /*getNote(intervals.p5),*/ getNote(intervals.b7), getNote(intervals.sharp9), getNote(intervals.b13)];

        // --- Accordi Sospesi ---
        case 'sus4':
            return [root, getNote(intervals.p4), getNote(intervals.p5)];
        case 'sus2':
            return [root, getNote(intervals.maj2), getNote(intervals.p5)];
        case '7sus4':
            return [root, getNote(intervals.p4), getNote(intervals.p5), getNote(intervals.b7)];
        case '9sus4': // Include 1,4,5,b7,9
            return [root, getNote(intervals.p4), getNote(intervals.p5), getNote(intervals.b7), getNote(intervals.maj9)];

        // --- Altri ---
         case 'maj7b5':
            return [root, getNote(intervals.maj3), getNote(intervals.b5), getNote(intervals.maj7)];

        default:
            console.warn("Tipo accordo non riconosciuto:", type, "- Ritorno solo fondamentale:", root);
            return [root];
    }
};
// ==================================================
//      FINE FUNZIONE buildChord AGGIORNATA
// ==================================================


const PROGRESSIONS_DATA = [
    // =================================
    //          BLUES (Esistenti)
    // =================================
    {
        name: "Blues: 12 Bar Standard (C)",
        genre: "Blues",
        key: "C",
        chords: [
            buildChord(noteNameToMidi('C4'), '7'), buildChord(noteNameToMidi('C4'), '7'), buildChord(noteNameToMidi('C4'), '7'), buildChord(noteNameToMidi('C4'), '7'),
            buildChord(noteNameToMidi('F4'), '7'), buildChord(noteNameToMidi('F4'), '7'), buildChord(noteNameToMidi('C4'), '7'), buildChord(noteNameToMidi('C4'), '7'),
            buildChord(noteNameToMidi('G4'), '7'), buildChord(noteNameToMidi('F4'), '7'), buildChord(noteNameToMidi('C4'), '7'), buildChord(noteNameToMidi('G4'), '7')
        ]
    },
    {
        name: "Blues: 12 Bar Quick Change (C)",
        genre: "Blues",
        key: "C",
        chords: [
            buildChord(noteNameToMidi('C4'), '7'), buildChord(noteNameToMidi('F4'), '7'), buildChord(noteNameToMidi('C4'), '7'), buildChord(noteNameToMidi('C4'), '7'),
            buildChord(noteNameToMidi('F4'), '7'), buildChord(noteNameToMidi('F4'), '7'), buildChord(noteNameToMidi('C4'), '7'), buildChord(noteNameToMidi('C4'), '7'),
            buildChord(noteNameToMidi('G4'), '7'), buildChord(noteNameToMidi('F4'), '7'), buildChord(noteNameToMidi('C4'), '7'), buildChord(noteNameToMidi('G4'), '7')
        ]
    },
     {
        name: "Blues: 12 Bar Minor (Cm)",
        genre: "Blues",
        key: "Cm",
        chords: [
            buildChord(noteNameToMidi('C3'), 'min7'), buildChord(noteNameToMidi('C3'), 'min7'), buildChord(noteNameToMidi('C3'), 'min7'), buildChord(noteNameToMidi('C3'), 'min7'),
            buildChord(noteNameToMidi('F3'), 'min7'), buildChord(noteNameToMidi('F3'), 'min7'), buildChord(noteNameToMidi('C3'), 'min7'), buildChord(noteNameToMidi('C3'), 'min7'),
            buildChord(noteNameToMidi('Ab3'), 'maj7'), buildChord(noteNameToMidi('G3'), '7'), // Usiamo G7 standard per semplicità visiva iniziale
            buildChord(noteNameToMidi('C3'), 'min7'), buildChord(noteNameToMidi('G3'), '7')
        ]
    },
    {
        name: "Blues: 8 Bar Blues (C)",
        genre: "Blues",
        key: "C",
        chords: [
            buildChord(noteNameToMidi('C4'), '7'), buildChord(noteNameToMidi('G4'), '7'), buildChord(noteNameToMidi('C4'), '7'), buildChord(noteNameToMidi('C4'), '7'),
            buildChord(noteNameToMidi('F4'), '7'), buildChord(noteNameToMidi('F4'), '7'), buildChord(noteNameToMidi('C4'), '7'), buildChord(noteNameToMidi('G4'), '7')
        ]
    },
     {
        name: "Blues: Turnaround I-VI-ii-V (C)",
        genre: "Blues",
        key: "C",
        chords: [ // Tipicamente usato nelle ultime 2 misure del 12 bar
            buildChord(noteNameToMidi('C4'), '7'),     // I7
            buildChord(noteNameToMidi('A3'), '7'),     // VI7 (V7/ii)
            buildChord(noteNameToMidi('D4'), 'min7'),  // iim7
            buildChord(noteNameToMidi('G3'), '7'),     // V7
        ]
    },

    // =================================
    //          JAZZ (Esistenti)
    // =================================
    {
        name: "Jazz: ii-V-I Major (C)",
        genre: "Jazz",
        key: "C",
        chords: [
            buildChord(noteNameToMidi('D4'), 'min7'), // iim7
            buildChord(noteNameToMidi('G3'), '7'),    // V7 (ottava più bassa per evitare sovrapposizioni estreme)
            buildChord(noteNameToMidi('C4'), 'maj7'), // Imaj7
            [], // Pausa o accordo tenuto
        ]
    },
    {
        name: "Jazz: ii-V-i Minor (Cm)",
        genre: "Jazz",
        key: "Cm",
        chords: [
            buildChord(noteNameToMidi('D3'), 'm7b5'), // iim7b5
            buildChord(noteNameToMidi('G3'), '7'),     // V7 (alt non gestito visivamente qui)
            buildChord(noteNameToMidi('C3'), 'min7'),  // im7
            [],
        ]
    },
    {
        name: "Jazz: Autumn Leaves (Section A - Gm)",
        genre: "Jazz",
        key: "Gm", // Tonalità relativa maggiore Bb
        chords: [
             buildChord(noteNameToMidi('C4'), 'min7'), // Cm7 (ii in Bb)
             buildChord(noteNameToMidi('F3'), '7'),    // F7 (V in Bb)
             buildChord(noteNameToMidi('Bb3'), 'maj7'), // Bbmaj7 (I in Bb)
             buildChord(noteNameToMidi('Eb4'), 'maj7'), // Ebmaj7 (IV in Bb)
             buildChord(noteNameToMidi('A3'), 'm7b5'), // Am7b5 (ii in Gm)
             buildChord(noteNameToMidi('D4'), '7'),    // D7 (V in Gm)
             buildChord(noteNameToMidi('G3'), 'min7'), // Gm7 (i in Gm)
             [], // Pausa/Tenuto
        ]
    },
    {
        name: "Jazz: Rhythm Changes 'A' Section (Bb)",
        genre: "Jazz",
        key: "Bb",
        // Semplificato: un accordo per battuta logica (non strettamente per beat)
        chords: [
            buildChord(noteNameToMidi('Bb3'), 'maj7'), // I
            buildChord(noteNameToMidi('G4'), 'min7'),  // vi
            buildChord(noteNameToMidi('C4'), 'min7'),  // ii
            buildChord(noteNameToMidi('F3'), '7'),     // V
            buildChord(noteNameToMidi('D4'), 'min7'),  // iii
            buildChord(noteNameToMidi('G3'), '7'),     // VI7 (V7/ii)
            buildChord(noteNameToMidi('C4'), 'min7'),  // ii
            buildChord(noteNameToMidi('F3'), '7'),     // V
            // Misure 5-8 della A section
            buildChord(noteNameToMidi('Bb3'), 'maj7'), // I
            buildChord(noteNameToMidi('Bb3'), '7'),    // V7/IV
            buildChord(noteNameToMidi('Eb4'), 'maj7'), // IV
            buildChord(noteNameToMidi('Eb3'), 'min7'), // ivm7 (alternativa Ebm6)
            buildChord(noteNameToMidi('D4'), 'min7'),  // iii (spesso D7 qui, V7/vi)
            buildChord(noteNameToMidi('G3'), '7'),     // VI7 (V7/ii)
            buildChord(noteNameToMidi('C4'), 'min7'),  // ii
            buildChord(noteNameToMidi('F3'), '7'),     // V
        ]
    },
    {
        name: "Jazz: Rhythm Changes 'B' Bridge (Bb)",
        genre: "Jazz",
        key: "Bb",
        chords: [ // Sequenza di V7 che scendono per quinte
            buildChord(noteNameToMidi('D4'), '7'), buildChord(noteNameToMidi('D4'), '7'), // III7
            buildChord(noteNameToMidi('G3'), '7'), buildChord(noteNameToMidi('G3'), '7'), // VI7
            buildChord(noteNameToMidi('C4'), '7'), buildChord(noteNameToMidi('C4'), '7'), // II7
            buildChord(noteNameToMidi('F3'), '7'), buildChord(noteNameToMidi('F3'), '7'), // V7
        ]
    },
     {
        name: "Jazz: Modal Vamp 'So What' (Dm)",
        genre: "Jazz",
        key: "Dm (Dorian)",
        chords: [ // Modo Dorico, armonia statica
            buildChord(noteNameToMidi('D3'), 'min7'), [], [], [],
            buildChord(noteNameToMidi('D3'), 'min7'), [], [], [], // Ripetuto per 8 misure
        ]
    },
    {
        name: "Jazz: Turnaround iii-VI-ii-V (C)",
        genre: "Jazz",
        key: "C",
        chords: [
            buildChord(noteNameToMidi('E4'), 'min7'),  // iiim7
            buildChord(noteNameToMidi('A3'), '7'),     // VI7 (V7/ii)
            buildChord(noteNameToMidi('D4'), 'min7'),  // iim7
            buildChord(noteNameToMidi('G3'), '7'),     // V7
        ]
    },
    {
       name: "Jazz: Coltrane Changes Cycle (Giant Steps Start in Eb)",
       genre: "Jazz",
       key: "Eb (Multi-Tonic)",
       // Molto veloce, un accordo ogni 2 beat spesso
       chords: [
           buildChord(noteNameToMidi('Eb4'), 'maj7'), // Ebmaj7 (I in Eb)
           buildChord(noteNameToMidi('B3'), '7'),     // B7 (V7 in E)
           buildChord(noteNameToMidi('E4'), 'maj7'),  // Emaj7 (I in E = bIIIm in Eb)
           buildChord(noteNameToMidi('G3'), '7'),     // G7 (V7 in C)
           buildChord(noteNameToMidi('C4'), 'maj7'),  // Cmaj7 (I in C = VIm in Eb)
           buildChord(noteNameToMidi('Eb3'), '7'),    // Eb7 (V7 in Ab)
           buildChord(noteNameToMidi('Ab3'), 'maj7'), // Abmaj7 (I in Ab = IVM in Eb)
           buildChord(noteNameToMidi('B3'), '7'),     // B7 (V7 in E, ricomincia ciclo o varia)
       ]
   },

    // =================================
    //          POP / ROCK (Esistenti)
    // =================================
     {
        name: "Pop: I-V-vi-IV 'Axis of Awesome' (C)",
        genre: "Pop/Rock",
        key: "C",
        chords: [
            buildChord(noteNameToMidi('C4'), 'maj'), // I
            buildChord(noteNameToMidi('G3'), 'maj'), // V
            buildChord(noteNameToMidi('A3'), 'min'), // vi
            buildChord(noteNameToMidi('F3'), 'maj')  // IV
        ]
    },
    {
        name: "Pop: vi-IV-I-V (C)",
        genre: "Pop/Rock",
        key: "C",
        chords: [
            buildChord(noteNameToMidi('A3'), 'min'), // vi
            buildChord(noteNameToMidi('F3'), 'maj'), // IV
            buildChord(noteNameToMidi('C4'), 'maj'), // I
            buildChord(noteNameToMidi('G3'), 'maj')  // V
        ]
    },
    {
        name: "Pop: I-vi-IV-V 'Doo-Wop' (C)",
        genre: "Pop/Rock",
        key: "C",
        chords: [
            buildChord(noteNameToMidi('C4'), 'maj'), // I
            buildChord(noteNameToMidi('A3'), 'min'), // vi
            buildChord(noteNameToMidi('F3'), 'maj'), // IV
            buildChord(noteNameToMidi('G3'), 'maj')  // V
        ]
    },
     {
        name: "Rock: Minor Epic i-bVII-bVI-V (Am)",
        genre: "Pop/Rock",
        key: "Am",
        chords: [
            buildChord(noteNameToMidi('A3'), 'min'), // i
            buildChord(noteNameToMidi('G3'), 'maj'), // bVII (dalla minore naturale)
            buildChord(noteNameToMidi('F3'), 'maj'), // bVI
            buildChord(noteNameToMidi('E4'), 'maj')  // V (reso maggiore per cadenza più forte)
        ]
    },
    {
        name: "Pop: Pachelbel's Canon (D)",
        genre: "Pop/Rock", // Anche Classica ovviamente
        key: "D",
        chords: [
            buildChord(noteNameToMidi('D4'), 'maj'),   // I
            buildChord(noteNameToMidi('A3'), 'maj'),   // V
            buildChord(noteNameToMidi('B3'), 'min'),   // vi
            buildChord(noteNameToMidi('F#3'), 'min'),  // iii
            buildChord(noteNameToMidi('G3'), 'maj'),   // IV
            buildChord(noteNameToMidi('D3'), 'maj'),   // I
            buildChord(noteNameToMidi('G3'), 'maj'),   // IV (spesso A7 qui, V7/V)
            buildChord(noteNameToMidi('A3'), 'maj')    // V
        ]
    },

    // =================================
    //          RAGTIME (Esistenti)
    // =================================
     {
        name: "Ragtime: Circle V7s (C)",
        genre: "Ragtime",
        key: "C",
        chords: [
            buildChord(noteNameToMidi('C4'), 'maj'),  // I
            buildChord(noteNameToMidi('A3'), '7'),    // V7/ii (A7)
            buildChord(noteNameToMidi('D4'), 'min7'), // iim7 (Dm7)
            buildChord(noteNameToMidi('G3'), '7'),    // V7 (G7)
            buildChord(noteNameToMidi('C4'), 'maj'),  // I
            buildChord(noteNameToMidi('E3'), '7'),    // V7/vi (E7)
            buildChord(noteNameToMidi('A3'), 'min'),  // vi (Am)
            buildChord(noteNameToMidi('D3'), '7'),    // V7/V (D7) -> risolve idealmente a G
        ]
    },
    {
        name: "Ragtime: Stomp Progression (C)",
        genre: "Ragtime",
        key: "C",
        chords: [
            buildChord(noteNameToMidi('C4'), 'maj'),  // I
            buildChord(noteNameToMidi('C4'), 'aug'),  // I+ (movimento cromatico)
            buildChord(noteNameToMidi('F3'), 'maj'),  // IV
            buildChord(noteNameToMidi('F#3'), 'dim'), // #iv°
            buildChord(noteNameToMidi('C4'), 'maj'),  // I (inversione I/G implicita)
            buildChord(noteNameToMidi('G3'), '7'),    // V7
            buildChord(noteNameToMidi('C4'), 'maj'),  // I
            [], // Pausa
        ]
    },

    // =================================
    //          CLASSICA (Esistenti)
    // =================================
    {
        name: "Classica: Cadenza Autentica Perfetta (C)",
        genre: "Classica",
        key: "C",
        chords: [
            buildChord(noteNameToMidi('G3'), '7'),     // V7
            buildChord(noteNameToMidi('C4'), 'maj'),   // I
        ]
    },
    {
        name: "Classica: Cadenza Plagale (C)",
        genre: "Classica",
        key: "C",
        chords: [
            buildChord(noteNameToMidi('F3'), 'maj'),     // IV
            buildChord(noteNameToMidi('C4'), 'maj'),   // I
        ]
    },
     {
        name: "Classica: Cadenza Sospesa (C)",
        genre: "Classica",
        key: "C",
        chords: [
            buildChord(noteNameToMidi('C4'), 'maj'),     // I (esempio)
            buildChord(noteNameToMidi('G3'), 'maj'),   // V (o V7)
        ]
    },
    {
        name: "Classica: Cadenza d'Inganno (C)",
        genre: "Classica",
        key: "C",
        chords: [
            buildChord(noteNameToMidi('G3'), '7'),     // V7
            buildChord(noteNameToMidi('A3'), 'min'),   // vi
        ]
    },
    {
        name: "Classica: Circolo Quinte Diatonico (C)",
        genre: "Classica",
        key: "C",
        chords: [ // I-IV-vii°-iii-vi-ii-V-I
            buildChord(noteNameToMidi('C4'), 'maj'),   // I
            buildChord(noteNameToMidi('F3'), 'maj'),   // IV
            buildChord(noteNameToMidi('B3'), 'dim'),   // vii°
            buildChord(noteNameToMidi('E4'), 'min'),   // iii
            buildChord(noteNameToMidi('A3'), 'min'),   // vi
            buildChord(noteNameToMidi('D4'), 'min'),   // ii
            buildChord(noteNameToMidi('G3'), 'maj'),   // V (spesso V7)
            buildChord(noteNameToMidi('C4'), 'maj'),   // I
        ]
    },
     {
        name: "Classica: Sequenza con V7 Secondari (C)",
        genre: "Classica",
        key: "C",
        chords: [ // I - V7/IV - IV - V7/V - V - V7/vi - vi - V7/ii - ii - V7 - I
            buildChord(noteNameToMidi('C4'), 'maj'),   // I
            buildChord(noteNameToMidi('C4'), '7'),     // V7/IV
            buildChord(noteNameToMidi('F3'), 'maj'),   // IV
            buildChord(noteNameToMidi('D4'), '7'),     // V7/V
            buildChord(noteNameToMidi('G3'), 'maj'),   // V
            buildChord(noteNameToMidi('E4'), '7'),     // V7/vi
            buildChord(noteNameToMidi('A3'), 'min'),   // vi
            buildChord(noteNameToMidi('A3'), '7'),     // V7/ii (A7 -> Dm)
            buildChord(noteNameToMidi('D4'), 'min'),   // ii
            buildChord(noteNameToMidi('G3'), '7'),     // V7
            buildChord(noteNameToMidi('C4'), 'maj'),   // I
            [],
        ]
    },

    // =================================
    //          NUOVE PROGRESSIONI (Aggiunte precedentemente)
    // =================================

    // --- BLUES ---
    {
        name: "Blues: Jazz Blues (Parker Blues in C)",
        genre: "Blues",
        key: "C",
        chords: [ // 12 misure, più complesso armonicamente
            buildChord(noteNameToMidi('C4'), '7'),     // I7
            buildChord(noteNameToMidi('F4'), '7'),     // IV7
            buildChord(noteNameToMidi('C4'), '7'),     // I7
            buildChord(noteNameToMidi('G3'), 'min7'), buildChord(noteNameToMidi('C4'), '7'), // iim7 - V7 / IV
            buildChord(noteNameToMidi('F4'), '7'),     // IV7
            buildChord(noteNameToMidi('F#3'), 'dim7'), // #iv°7
            buildChord(noteNameToMidi('C4'), '7'),     // I7
            buildChord(noteNameToMidi('A3'), '7'),     // VI7 (V7/ii)
            buildChord(noteNameToMidi('D4'), 'min7'),  // iim7
            buildChord(noteNameToMidi('G3'), '7'),     // V7
            buildChord(noteNameToMidi('C4'), '7'), buildChord(noteNameToMidi('A3'), '7'), // I7 - VI7 (turnaround)
            buildChord(noteNameToMidi('D4'), 'min7'), buildChord(noteNameToMidi('G3'), '7'), // iim7 - V7 (turnaround)
        ]
    },
    {
        name: "Blues: Slow Blues Variation (C)",
        genre: "Blues",
        key: "C",
        chords: [ // 12 misure, con passaggi comuni nel blues lento
            buildChord(noteNameToMidi('C4'), '7'), buildChord(noteNameToMidi('F4'), '7'), // I7 - IV7
            buildChord(noteNameToMidi('C4'), '7'), [], // I7 (tenuto)
            buildChord(noteNameToMidi('F4'), '7'), [], // IV7 (tenuto)
            buildChord(noteNameToMidi('F#3'), 'dim7'), [], // #iv°7 (passaggio)
            buildChord(noteNameToMidi('C4'), '7'), buildChord(noteNameToMidi('A3'), '7'), // I7 - VI7
            buildChord(noteNameToMidi('D4'), 'min7'), buildChord(noteNameToMidi('G3'), '7'), // iim7 - V7
            buildChord(noteNameToMidi('C4'), '7'), buildChord(noteNameToMidi('F4'), '7'), // I7 - IV7 (outro feel)
            buildChord(noteNameToMidi('C4'), '7'), buildChord(noteNameToMidi('G4'), '7'), // I7 - V7 (outro feel)
        ]
    },

    // --- JAZZ ---
    {
        name: "Jazz: Blue Bossa (A Section - Cm)",
        genre: "Jazz",
        key: "Cm",
        chords: [ // 8 misure tipiche
            buildChord(noteNameToMidi('C3'), 'min7'), [], // Cm7 (i)
            buildChord(noteNameToMidi('F3'), 'min7'), [], // Fm7 (iv)
            buildChord(noteNameToMidi('D3'), 'm7b5'), buildChord(noteNameToMidi('G3'), '7'), // Dm7b5 (ii°/i) - G7 (V7/i)
            buildChord(noteNameToMidi('C3'), 'min7'), [], // Cm7 (i)
            buildChord(noteNameToMidi('Eb3'), 'min7'), buildChord(noteNameToMidi('Ab3'), '7'), // Ebm7 (ii/Db) - Ab7 (V7/Db)
            buildChord(noteNameToMidi('Db3'), 'maj7'), [], // Dbmaj7 (bIImaj7 o I in Db)
            buildChord(noteNameToMidi('D3'), 'm7b5'), buildChord(noteNameToMidi('G3'), '7'), // Dm7b5 (ii°/i) - G7 (V7/i)
            buildChord(noteNameToMidi('C3'), 'min7'), [], // Cm7 (i)
        ]
    },
    {
        name: "Jazz: All The Things You Are (First 8 bars - Ab)",
        genre: "Jazz",
        key: "Ab (Multi-Tonic)",
        chords: [ // Modulante
            buildChord(noteNameToMidi('F3'), 'min7'),   // Fm7 (vi in Ab)
            buildChord(noteNameToMidi('Bb3'), 'min7'),  // Bbm7 (ii in Ab)
            buildChord(noteNameToMidi('Eb3'), '7'),     // Eb7 (V in Ab)
            buildChord(noteNameToMidi('Ab3'), 'maj7'),  // Abmaj7 (I in Ab)
            buildChord(noteNameToMidi('Db3'), 'maj7'),  // Dbmaj7 (IV in Ab, or I in Db)
            buildChord(noteNameToMidi('G3'), '7'),      // G7 (V7 in C)
            buildChord(noteNameToMidi('C4'), 'maj7'),   // Cmaj7 (I in C, or IIImaj7 in Ab)
            [], // Tenuto o Cmaj7
        ]
    },
    {
        name: "Jazz: Take the A Train (A Section - C)",
        genre: "Jazz",
        key: "C",
        chords: [ // 8 misure
            buildChord(noteNameToMidi('C4'), 'maj7'), [], // Cmaj7 (I)
            buildChord(noteNameToMidi('C4'), 'maj7'), [], // Cmaj7 (I)
            // Usiamo la nuova buildChord per un accordo più specifico (opzionale)
            // buildChord(noteNameToMidi('D4'), '7#11'), [], // D7#11 (V7/V)
            buildChord(noteNameToMidi('D4'), '7'), [],    // D7 (V7/V, versione base)
            buildChord(noteNameToMidi('D4'), '7'), [],    // D7
            buildChord(noteNameToMidi('D4'), 'min7'), buildChord(noteNameToMidi('G3'), '7'), // Dm7 (ii) - G7 (V)
            buildChord(noteNameToMidi('C4'), 'maj7'), buildChord(noteNameToMidi('G3'), '7'), // Cmaj7 (I) - G7 (V, passaggio)
            buildChord(noteNameToMidi('C4'), 'maj7'), [], // Cmaj7 (I)
            [], // Pausa o G7 risoluzione
        ]
    },
     {
        name: "Jazz: Minor Turnaround i-VI-ii-V (Cm)",
        genre: "Jazz",
        key: "Cm",
        chords: [ // VI è dominante secondaria V7/ii
            buildChord(noteNameToMidi('C3'), 'min7'),  // im7
            buildChord(noteNameToMidi('A3'), '7'),     // VI7 (V7/ii)
            buildChord(noteNameToMidi('D3'), 'm7b5'),  // iim7b5
            buildChord(noteNameToMidi('G3'), '7'),     // V7
        ]
    },
     {
        name: "Jazz: Lady Bird Turnaround (C)",
        genre: "Jazz",
        key: "C",
        chords: [ // Imaj7 - bIIImaj7 - bVImaj7 - bIImaj7 (movimento per terze minori)
            buildChord(noteNameToMidi('C4'), 'maj7'),   // Imaj7
            buildChord(noteNameToMidi('Eb4'), 'maj7'),  // bIIImaj7
            buildChord(noteNameToMidi('Ab3'), 'maj7'),  // bVImaj7
            buildChord(noteNameToMidi('Db4'), 'maj7'),  // bIImaj7 (spesso poi ii-V-I)
        ]
    },

    // --- POP / ROCK ---
    {
        name: "Rock: I-bVII-IV-I (G)",
        genre: "Pop/Rock",
        key: "G",
        chords: [ // Comune nel rock classico
            buildChord(noteNameToMidi('G3'), 'maj'), // I
            buildChord(noteNameToMidi('F3'), 'maj'), // bVII (dalla parallela minore o modo misolidio)
            buildChord(noteNameToMidi('C3'), 'maj'), // IV
            buildChord(noteNameToMidi('G3'), 'maj'), // I
        ]
    },
    {
        name: "Pop: Verse/Chorus Am-G-C-F (Am)",
        genre: "Pop/Rock",
        key: "Am", // Relativa minore di C
        chords: [ // Molto comune
            buildChord(noteNameToMidi('A3'), 'min'), // i (Am)
            buildChord(noteNameToMidi('G3'), 'maj'), // bVII (G)
            buildChord(noteNameToMidi('C4'), 'maj'), // bIII (C)
            buildChord(noteNameToMidi('F3'), 'maj'), // bVI (F)
        ]
    },
    {
        name: "Rock: Andalusian Cadence (Am)",
        genre: "Pop/Rock",
        key: "Am", // Modo Frigio implicito
        chords: [ // i - bVII - bVI - V
            buildChord(noteNameToMidi('A3'), 'min'), // i
            buildChord(noteNameToMidi('G3'), 'maj'), // bVII
            buildChord(noteNameToMidi('F3'), 'maj'), // bVI
            buildChord(noteNameToMidi('E4'), 'maj'), // V (spesso maggiore per cadenza flamenca)
        ]
    },
    {
        name: "Pop: 50s Progression I-vi-ii-V (C)",
        genre: "Pop/Rock",
        key: "C",
        chords: [ // Simile a Doo-Wop ma con ii invece di IV
            buildChord(noteNameToMidi('C4'), 'maj'),   // I
            buildChord(noteNameToMidi('A3'), 'min'),   // vi
            buildChord(noteNameToMidi('D4'), 'min'),   // ii
            buildChord(noteNameToMidi('G3'), '7'),     // V7 (spesso dominante)
        ]
    },

    // --- FUNK / R&B ---
    {
        name: "Funk: Vamp Bbm7-Eb7 (Bbm)",
        genre: "Funk/R&B",
        key: "Bbm (Dorian/Mixolydian)",
        chords: [ // Tipico vamp statico, 2 accordi
            buildChord(noteNameToMidi('Bb3'), 'min7'), // i7 (Bbm7)
            buildChord(noteNameToMidi('Eb4'), '7'),    // IV7 (Eb7)
            buildChord(noteNameToMidi('Bb3'), 'min7'), // i7
            buildChord(noteNameToMidi('Eb4'), '7'),    // IV7
        ]
    },
    {
        name: "R&B/Neo Soul: Em7-A7-Dmaj7-Gmaj7 (Em)",
        genre: "Funk/R&B",
        key: "Em (Multi-Tonic)", // Spesso modale o con modulazioni
        chords: [ // Esempio di progressione comune nel Neo Soul
            buildChord(noteNameToMidi('E3'), 'min7'),   // Em7 (i in Em, or ii in D)
            buildChord(noteNameToMidi('A3'), '7'),      // A7 (IV7 in Em, or V7 in D)
            buildChord(noteNameToMidi('D4'), 'maj7'),   // Dmaj7 (bVIImaj7 in Em, or I in D)
            buildChord(noteNameToMidi('G3'), 'maj7'),   // Gmaj7 (bIIImaj7 in Em, or IV in D)
        ]
    },

    // --- LATIN ---
    {
        name: "Latin: Bossa Nova 'Ipanema' A Section (F)",
        genre: "Latin",
        key: "F",
        chords: [ // Prime 8 misure
            buildChord(noteNameToMidi('F4'), 'maj7'), [], // Imaj7
            buildChord(noteNameToMidi('G3'), '7'),    [], // V7/V (II7)
            buildChord(noteNameToMidi('G4'), 'min7'), [], // iim7
            buildChord(noteNameToMidi('C3'), '7'),    [], // V7
            buildChord(noteNameToMidi('F4'), 'maj7'), [], // Imaj7
            buildChord(noteNameToMidi('F#3'), 'dim7'),[], // #i°7 (passaggio cromatico verso ii)
            buildChord(noteNameToMidi('G4'), 'min7'), [], // iim7
            buildChord(noteNameToMidi('C3'), '7'),    [], // V7
        ]
    },

    // --- CLASSICA ---
    {
        name: "Classica: Cadenza con Napoletana (Cm)",
        genre: "Classica",
        key: "Cm",
        chords: [ // i - iv - bII - V7 - i
            buildChord(noteNameToMidi('C3'), 'min'),   // i
            buildChord(noteNameToMidi('F3'), 'min'),   // iv
            buildChord(noteNameToMidi('Db3'), 'maj'),  // bII (Accordo Napoletano)
            buildChord(noteNameToMidi('G3'), '7'),     // V7
            buildChord(noteNameToMidi('C3'), 'min'),   // i
            [],
        ]
    },
    {
        name: "Classica: Romanesca Sequence (C)",
        genre: "Classica",
        key: "C",
        chords: [ // Schema basso discendente: I-V-vi-iii-IV-I-ii-V (semplificato)
            buildChord(noteNameToMidi('C4'), 'maj'),   // I
            buildChord(noteNameToMidi('G3'), 'maj'),   // V (spesso V6)
            buildChord(noteNameToMidi('A3'), 'min'),   // vi
            buildChord(noteNameToMidi('E4'), 'min'),   // iii (spesso E maj V/vi)
            buildChord(noteNameToMidi('F3'), 'maj'),   // IV
            buildChord(noteNameToMidi('C3'), 'maj'),   // I (spesso I6)
            buildChord(noteNameToMidi('D4'), 'min'),   // ii (spesso ii6)
            buildChord(noteNameToMidi('G3'), 'maj'),   // V
        ]
    },
     {
        name: "Classica: Folia Sequence (Dm)",
        genre: "Classica",
        key: "Dm",
        chords: [ // Schema comune: i-V-i-VII-III-VII-i-V (semplificato)
            buildChord(noteNameToMidi('D3'), 'min'),   // i
            buildChord(noteNameToMidi('A3'), 'maj'),   // V
            buildChord(noteNameToMidi('D3'), 'min'),   // i
            buildChord(noteNameToMidi('C4'), 'maj'),   // VII (bVII)
            buildChord(noteNameToMidi('F3'), 'maj'),   // III (bIII)
            buildChord(noteNameToMidi('C4'), 'maj'),   // VII (bVII)
            buildChord(noteNameToMidi('D3'), 'min'),   // i (spesso con cadenza sospesa su A)
            buildChord(noteNameToMidi('A3'), 'maj'),   // V
        ]
    },


]; // FINE ARRAY PROGRESSIONS_DATA

// Rendi la variabile accessibile globalmente (o usa export se usi moduli)
// window.PROGRESSIONS_DATA = PROGRESSIONS_DATA; // Per script semplice