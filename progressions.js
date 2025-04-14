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

// Funzione base per creare triadi e settime (semplificata)
// Non gestisce inversioni o voicing complessi, solo note base
const buildChord = (rootMidi, type) => {
    if (rootMidi === null) return []; // Gestisce input non valido da noteNameToMidi

    const root = rootMidi;
    let third, fifth, seventh;

    switch (type.toLowerCase()) { // Converti in minuscolo per sicurezza
        case 'maj': // Maggiore Triade
            third = root + 4; fifth = root + 7; return [root, third, fifth];
        case 'min': // Minore Triade
            third = root + 3; fifth = root + 7; return [root, third, fifth];
        case 'dim': // Diminuita Triade
            third = root + 3; fifth = root + 6; return [root, third, fifth];
        case 'aug': // Aumentata Triade
             third = root + 4; fifth = root + 8; return [root, third, fifth];
        case 'maj7': // Settima Maggiore
            third = root + 4; fifth = root + 7; seventh = root + 11; return [root, third, fifth, seventh];
        case 'min7': // Settima Minore
            third = root + 3; fifth = root + 7; seventh = root + 10; return [root, third, fifth, seventh];
        case '7': // Settima Dominante
            third = root + 4; fifth = root + 7; seventh = root + 10; return [root, third, fifth, seventh];
        case 'm7b5': // Semidiminuita (half-diminished)
            third = root + 3; fifth = root + 6; seventh = root + 10; return [root, third, fifth, seventh];
        case 'dim7': // Settima Diminuita
            third = root + 3; fifth = root + 6; seventh = root + 9; return [root, third, fifth, seventh];
        // Aggiungere altri tipi se necessario (sus, 6, 9, etc.)
        default: // Se non riconosciuto, ritorna solo la fondamentale
            console.warn("Tipo accordo non riconosciuto:", type, "- Ritorno solo fondamentale:", root);
            return [root];
    }
};


const PROGRESSIONS_DATA = [
    // =================================
    //          BLUES
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
    //          JAZZ
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
    //          POP / ROCK
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
    //          RAGTIME
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
    //          CLASSICA
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


]; // FINE ARRAY PROGRESSIONS_DATA

// Rendi la variabile accessibile globalmente (o usa export se usi moduli)
// window.PROGRESSIONS_DATA = PROGRESSIONS_DATA; // Per script semplice