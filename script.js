// script.js V12 - Complex Chord Mode

document.addEventListener('DOMContentLoaded', () => {
    // --- Costanti ---
    const SVG_NS = "http://www.w3.org/2000/svg";
    const STAFF_WIDTH = 900; const STAFF_HEIGHT = 300;
    const NOTE_START_X = STAFF_WIDTH + 30; const NOTE_END_X = -50;
    const NOTE_RADIUS = 7; const STEM_HEIGHT = 35;
    const STAFF_LINE_GAP = 15; const STAFF_STEP_Y = STAFF_LINE_GAP / 2;
    const ACCIDENTAL_OFFSET_X = -NOTE_RADIUS - 14;
    const LEDGER_LINE_EXTENSION = 5;
    const TREBLE_STAFF_TOP_Y = 30; const TREBLE_STAFF_BOTTOM_Y = 90;
    const BASS_STAFF_TOP_Y = 170; const BASS_STAFF_BOTTOM_Y = 230;
    const TREBLE_B4_Y = TREBLE_STAFF_TOP_Y + STAFF_LINE_GAP * 2;
    const BASS_D3_Y = BASS_STAFF_TOP_Y + STAFF_LINE_GAP * 2;
    const MIDDLE_C_MIDI = 60;
    const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const TONIC_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const DEFAULT_SCALE_OCTAVE = 4; // Usato per popolare il select della tonica
    const CHORD_WINDOW_MS = 100; // Leggermente aumentato per accordi complessi
    const ASC_DESC_MAX_OCTAVE_OFFSET = 1;
    const ASC_DESC_MIN_OCTAVE_OFFSET = -1;

    // --- Riferimenti DOM ---
    const svg = document.getElementById('music-svg');
    const notesArea = document.getElementById('notes-area');
    const tempoSlider = document.getElementById('tempo-slider');
    const tempoValueDisplay = document.getElementById('tempo-value');
    const midiInputSelect = document.getElementById('midi-input-select');
    const midiStatusSpan = document.getElementById('midi-status');
    const pianoKeys = document.querySelectorAll('.key');
    const progressionSelect = document.getElementById('progression-select');
    const startProgressionBtn = document.getElementById('start-progression-btn');
    const stopProgressionBtn = document.getElementById('stop-progression-btn');
    const scaleSelect = document.getElementById('scale-select');
    const scaleTonicSelect = document.getElementById('scale-tonic-select');
    const scaleModeSelect = document.getElementById('scale-mode-select');
    const startScaleBtn = document.getElementById('start-scale-btn');
    const stopScaleBtn = document.getElementById('stop-scale-btn');
    const startComplexChordBtn = document.getElementById('start-complex-chord-btn'); // NUOVO
    const stopComplexChordBtn = document.getElementById('stop-complex-chord-btn');   // NUOVO
    const correctCountSpan = document.getElementById('correct-count');

    // --- Stato Globale ---
    let activeDisplayElements = [];
    let currentBPM = 100;
    let pixelsPerSecond = 80;
    let animationFrameId = null;
    let lastTimestamp = 0;
    let elementCounter = 0;
    let midiAccess = null;
    let selectedMidiInput = null;
    let noteInputBuffer = [];
    let chordTimerId = null;
    let correctCount = 0;
    let activeMode = 'none'; // 'none', 'progression', 'scale', 'complexChord'

    // --- Stato Progressione ---
    let currentProgressionData = null;
    let currentProgressionChordIndex = 0;
    let currentProgressionIteration = 0;
    let timeSinceLastProgElementSpawn = 0;
    let intervalBetweenProgElementsMs = 600;

    // --- Stato Scale ---
    let currentScaleDefinition = null;
    let currentScaleMIDIs = [];
    let currentScaleNoteIndex = 0;
    let currentScaleIteration = 0;
    let currentScaleDirection = 'ascending';
    let currentScaleOctaveOffset = 0;
    let timeSinceLastScaleNoteSpawn = 0;
    let intervalBetweenScaleNotesMs = 300;

    // --- Stato Accordi Complessi (NUOVO) ---
    let currentComplexChordDefinition = null; // Oggetto da COMPLEX_CHORDS_DATA
    let currentComplexChordRoot = 'C4';       // Tonica selezionata (default)
    let currentComplexChordMIDIs = [];        // Note MIDI dell'accordo corrente

    // --- Funzioni Ausiliarie (Assumendo che noteNameToMidi e buildChord siano globali da progressions.js) ---
    function getNoteName(midi) {
        if (midi < 0 || midi > 127) return { name: "?", accidental: null, octave: 0 };
        const noteIndex = midi % 12; const octave = Math.floor(midi / 12) - 1;
        const baseName = NOTE_NAMES[noteIndex];
        // Semplificazione per visualizzazione: preferisce bemolle per alcune note
        let preferredName = baseName;
        if (baseName === 'C#') preferredName = 'Db';
        else if (baseName === 'D#') preferredName = 'Eb';
        else if (baseName === 'F#') preferredName = 'Gb';
        else if (baseName === 'G#') preferredName = 'Ab';
        else if (baseName === 'A#') preferredName = 'Bb';

        const accidental = preferredName.includes('#') ? '♯' : (preferredName.includes('b') ? '♭' : null);
        const naturalName = preferredName.replace(/[#b]/, '');
        return { name: `${naturalName}${octave}`, accidental: accidental, octave: octave };
     }
    function getNoteYPosition(midi) {
        let y = 0; let clef = 'treble';
        // Mappa diatonica semplificata per posizione Y (C=0, D=1, E=2, F=3, G=4, A=5, B=6)
        const diatonicMap = { 0:0, 1:0, 2:1, 3:1, 4:2, 5:3, 6:3, 7:4, 8:4, 9:5, 10:5, 11:6 };
        const midiNote = midi % 12;
        const midiOctave = Math.floor(midi / 12) - 1; // C4 = octave 3

        // Riferimenti (posizioni Y delle linee centrali)
        const trebleG4LineY = TREBLE_STAFF_TOP_Y + STAFF_LINE_GAP; // Linea del G4
        const bassF3LineY = BASS_STAFF_BOTTOM_Y - STAFF_LINE_GAP; // Linea del F3

        // Calcola step diatonici dal riferimento
        if (midi < MIDDLE_C_MIDI) { // Chiave di Basso (Riferimento F3 = MIDI 53)
            clef = 'bass';
            const refMidi = 53; // F3
            const refSteps = diatonicMap[refMidi % 12] + (Math.floor(refMidi / 12) - 1) * 7;
            const targetSteps = diatonicMap[midiNote] + midiOctave * 7;
            const stepsDiff = targetSteps - refSteps;
            y = bassF3LineY - stepsDiff * STAFF_STEP_Y;
        } else { // Chiave di Violino (Riferimento G4 = MIDI 67)
            clef = 'treble';
            const refMidi = 67; // G4
            const refSteps = diatonicMap[refMidi % 12] + (Math.floor(refMidi / 12) - 1) * 7;
            const targetSteps = diatonicMap[midiNote] + midiOctave * 7;
            const stepsDiff = targetSteps - refSteps;
            y = trebleG4LineY - stepsDiff * STAFF_STEP_Y;
        }
        return { y, clef };
    }
    // midiToDiatonicSteps non è più usata direttamente per Y, ma potrebbe servire altrove
    function midiToDiatonicSteps(targetMidi, referenceMidi) {
        const base = [0, 2, 4, 5, 7, 9, 11];
        const getSteps = (m) => { const o = Math.floor(m / 12) - 1; const n = m % 12; let s = 0; for(let i=base.length-1;i>=0;i--) if(n>=base[i]){s=i;break;} return o*7+s; };
        return getSteps(targetMidi) - getSteps(referenceMidi);
    }
    function getLedgerLinePositions(midi, yPos, clef) {
        const lines = [];
        const topY = (clef === 'treble') ? TREBLE_STAFF_TOP_Y : BASS_STAFF_TOP_Y;
        const bottomY = (clef === 'treble') ? TREBLE_STAFF_BOTTOM_Y : BASS_STAFF_BOTTOM_Y;

        // Limiti MIDI approssimativi per tagli addizionali
        const trebleTopLimit = 81; // A5
        const trebleBottomLimit = 60; // C4 (Middle C)
        const bassTopLimit = 60; // C4 (Middle C)
        const bassBottomLimit = 40; // E2

        // Tagli addizionali sopra
        if (midi >= trebleTopLimit && clef === 'treble') {
            for (let ly = topY - STAFF_LINE_GAP; ly >= yPos - STAFF_STEP_Y / 4; ly -= STAFF_LINE_GAP) {
                lines.push(ly);
            }
        } else if (midi >= bassTopLimit && clef === 'bass') {
             for (let ly = topY - STAFF_LINE_GAP; ly >= yPos - STAFF_STEP_Y / 4; ly -= STAFF_LINE_GAP) {
                lines.push(ly);
            }
        }

        // Tagli addizionali sotto
        if (midi <= trebleBottomLimit && clef === 'treble') {
             for (let ly = bottomY + STAFF_LINE_GAP; ly <= yPos + STAFF_STEP_Y / 4; ly += STAFF_LINE_GAP) {
                lines.push(ly);
            }
        } else if (midi <= bassBottomLimit && clef === 'bass') {
            for (let ly = bottomY + STAFF_LINE_GAP; ly <= yPos + STAFF_STEP_Y / 4; ly += STAFF_LINE_GAP) {
                lines.push(ly);
            }
        }
         // Caso speciale Middle C (MIDI 60)
         if (midi === 60) {
             if (clef === 'treble' && !lines.includes(bottomY + STAFF_LINE_GAP)) lines.push(bottomY + STAFF_LINE_GAP);
             if (clef === 'bass' && !lines.includes(topY - STAFF_LINE_GAP)) lines.push(topY - STAFF_LINE_GAP);
         }

        return lines;
    }
    function getStemDirection(yPos, clef) {
        const midY = (clef === 'treble') ? (TREBLE_STAFF_TOP_Y + TREBLE_STAFF_BOTTOM_Y) / 2 : (BASS_STAFF_TOP_Y + BASS_STAFF_BOTTOM_Y) / 2;
        // La linea centrale è B4 per treble (MIDI 71), D3 per bass (MIDI 50)
        // Usiamo la posizione Y della linea centrale come riferimento
        const centerLineY = (clef === 'treble') ? TREBLE_B4_Y : BASS_D3_Y;
        return (yPos >= centerLineY) ? 'up' : 'down'; // Se sulla linea o sopra -> up
    }
    function drawSingleNoteParts(midi, parentGroup, options = {}) {
        const { y, clef } = getNoteYPosition(midi);
        const { accidental } = getNoteName(midi);
        const stemDir = options.stemDirection || getStemDirection(y, clef);
        const ledgerYs = getLedgerLinePositions(midi, y, clef);
        const stemX = (stemDir === 'up') ? -NOTE_RADIUS : NOTE_RADIUS; // Gambo a sx se up, dx se down

        // Disegna tagli addizionali
        ledgerYs.forEach(ly => {
            const l = document.createElementNS(SVG_NS, 'line');
            l.setAttribute('x1', -NOTE_RADIUS - LEDGER_LINE_EXTENSION);
            l.setAttribute('y1', ly);
            l.setAttribute('x2', NOTE_RADIUS + LEDGER_LINE_EXTENSION);
            l.setAttribute('y2', ly);
            l.classList.add('ledger-line');
            parentGroup.appendChild(l);
        });

        // Disegna alterazione (se presente e non nascosta)
        if (accidental && !options.hideAccidental) {
            const t = document.createElementNS(SVG_NS, 'text');
            t.setAttribute('x', ACCIDENTAL_OFFSET_X);
            t.setAttribute('y', y + 6); // Aggiustamento verticale per font
            t.classList.add('note-accidental');
            t.textContent = accidental; // Usa ♯ o ♭
            parentGroup.appendChild(t);
        }

        // Disegna testa della nota
        const h = document.createElementNS(SVG_NS, 'ellipse');
        h.setAttribute('cx', 0);
        h.setAttribute('cy', y);
        h.setAttribute('rx', NOTE_RADIUS * 1.05); // Leggermente ovale
        h.setAttribute('ry', NOTE_RADIUS * 0.95);
        h.setAttribute('transform', `rotate(-15 0 ${y})`); // Piccola rotazione
        h.classList.add('note-head');
        h.dataset.midi = midi; // Salva il MIDI per riferimento
        parentGroup.appendChild(h);

        // Disegna gambo
        const s = document.createElementNS(SVG_NS, 'line');
        s.setAttribute('x1', stemX);
        s.setAttribute('y1', y);
        s.setAttribute('x2', stemX);
        s.setAttribute('y2', y + (stemDir === 'up' ? -STEM_HEIGHT : STEM_HEIGHT));
        s.classList.add('note-stem');
        parentGroup.appendChild(s);
    }
    function drawElementOnStaff(elementData) {
        if (!elementData.id) elementData.id = ++elementCounter;
        if (!elementData.xPos) elementData.xPos = NOTE_START_X;
        elementData.midis.sort((a, b) => a - b); // Ordina le note MIDI

        const mainGroup = document.createElementNS(SVG_NS, 'g');
        mainGroup.setAttribute('id', `element-${elementData.id}`);
        mainGroup.classList.add(elementData.type === 'chord' ? 'chord-group' : 'note-group');
        mainGroup.setAttribute('transform', `translate(${elementData.xPos}, 0)`);
        mainGroup.dataset.midis = JSON.stringify(elementData.midis);
        if (elementData.chordName) { // Aggiungi nome accordo per debug
            mainGroup.dataset.chordName = elementData.chordName;
        }

        // Determina direzione gambo comune per accordi (basato sulla nota più lontana dal centro)
        let furthestMidi = elementData.midis[0];
        let maxDist = 0;
        const middleLineMidiTreble = 71; // B4
        const middleLineMidiBass = 50; // D3

        elementData.midis.forEach(m => {
            const { clef } = getNoteYPosition(m);
            const middleLineMidi = (clef === 'treble') ? middleLineMidiTreble : middleLineMidiBass;
            const dist = Math.abs(m - middleLineMidi);
            if (dist >= maxDist) {
                maxDist = dist;
                furthestMidi = m;
            }
        });
        const { y: furthestY, clef: furthestClef } = getNoteYPosition(furthestMidi);
        const commonStemDir = getStemDirection(furthestY, furthestClef);

        // Disegna ogni nota dell'elemento
        elementData.midis.forEach(m => {
            drawSingleNoteParts(m, mainGroup, { stemDirection: commonStemDir });
        });

        notesArea.appendChild(mainGroup);
        elementData.element = mainGroup;
        activeDisplayElements.push(elementData);
    }
    function updateTempoAndSpeed() {
        currentBPM = parseInt(tempoSlider.value, 10);
        tempoValueDisplay.textContent = currentBPM;
        // Regola la velocità di scorrimento e intervalli di spawn
        pixelsPerSecond = currentBPM * 0.8; // Aumenta/diminuisci questo fattore per velocità
        intervalBetweenProgElementsMs = (60 / currentBPM) * 1000; // 1 accordo per beat (approssimativo)
        intervalBetweenScaleNotesMs = intervalBetweenProgElementsMs / 2; // 2 note per beat (approssimativo)
    }
    function populateProgressionSelect() {
        if (typeof PROGRESSIONS_DATA === 'undefined') { console.error("PROGRESSIONS_DATA non definito!"); return; }
        progressionSelect.innerHTML = '<option value="-1">-- Giro Armonico --</option>';
        PROGRESSIONS_DATA.forEach((p, i) => { const o = document.createElement('option'); o.value = i; o.textContent = p.name; progressionSelect.appendChild(o); });
    }
    function populateScaleSelect() {
        if (typeof SCALES_DATA === 'undefined') { console.error("SCALES_DATA non definito!"); return; }
        scaleSelect.innerHTML = '<option value="-1">-- Scala --</option>';
        SCALES_DATA.forEach((s, i) => { const o = document.createElement('option'); o.value = i; o.textContent = s.name; scaleSelect.appendChild(o); });
    }
    function populateTonicSelect() {
        scaleTonicSelect.innerHTML = '';
        TONIC_NOTES.forEach(n => {
            const o = document.createElement('option');
            o.value = n + DEFAULT_SCALE_OCTAVE; // Es: C4, F#4, etc.
            o.textContent = n; // Mostra solo C, F#, etc.
            if (n === "C") o.selected = true; // Default a C
            scaleTonicSelect.appendChild(o);
        });
        currentComplexChordRoot = scaleTonicSelect.value; // Inizializza tonica accordi complessi
    }
    function findNextTargetElement(filterType = null) {
        for (let i = 0; i < activeDisplayElements.length; i++) {
            const elData = activeDisplayElements[i];
            // Salta elementi già corretti
            if (elData.element?.classList.contains('correct')) continue;
            // Filtra per tipo se specificato
            if (filterType && elData.type !== filterType) continue;
            // Ritorna il primo elemento non corretto (e del tipo giusto, se filtrato)
            return { elementData: elData, index: i };
        }
        return null; // Nessun target valido trovato
    }
    function setupMIDI() {
        midiStatusSpan.textContent = 'Verifica...'; midiStatusSpan.className = 'midi-status';
        if (navigator.requestMIDIAccess) {
            navigator.requestMIDIAccess({ sysex: false }).then(onMIDISuccess, onMIDIFailure);
        } else {
            onMIDIFailure('WebMIDI non supportato');
        }
    }
    function onMIDISuccess(access) {
        midiAccess = access;
        midiStatusSpan.textContent = 'Pronto'; midiStatusSpan.classList.add('connected');
        populateMIDISelect();
        midiAccess.onstatechange = onMIDIStateChange;
        ensureAnimationLoopRunning(); // Avvia loop se non già attivo
    }
    function onMIDIFailure(msg) {
        console.error(`Errore MIDI: ${msg}`);
        midiStatusSpan.textContent = `Errore MIDI: ${msg}`; midiStatusSpan.classList.add('error');
    }
    function populateMIDISelect() {
        midiInputSelect.innerHTML = '<option value="">-- Dispositivo --</option>';
        if (!midiAccess) return;
        const inputs = midiAccess.inputs.values();
        let firstInputId = null;
        for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
            const device = input.value;
            const option = document.createElement('option');
            option.value = device.id;
            option.textContent = device.name;
            midiInputSelect.appendChild(option);
            if (!firstInputId) firstInputId = device.id;
        }
        // Seleziona automaticamente il primo dispositivo trovato
        if (firstInputId) {
            midiInputSelect.value = firstInputId;
            selectMIDIInput(firstInputId);
        } else {
            midiStatusSpan.textContent = 'Nessun disp.'; midiStatusSpan.classList.remove('connected');
        }
    }
    function onMIDIStateChange(event) {
        console.log('Stato MIDI cambiato:', event.port.name, event.port.state);
        const currentSelectedId = midiInputSelect.value;
        populateMIDISelect(); // Ricarica la lista
        // Prova a riselezionare il dispositivo precedente se ancora disponibile
        if (midiAccess?.inputs.has(currentSelectedId)) {
            midiInputSelect.value = currentSelectedId;
            selectMIDIInput(currentSelectedId);
        } else if (midiInputSelect.options.length > 1) {
            // Altrimenti seleziona il primo della nuova lista (diverso da "-- Dispositivo --")
            midiInputSelect.selectedIndex = 1;
            selectMIDIInput(midiInputSelect.value);
        } else {
            selectMIDIInput(""); // Nessun dispositivo selezionabile
        }
    }
    function selectMIDIInput(id) {
        // Rimuovi listener dal vecchio input
        if (selectedMidiInput) {
            selectedMidiInput.onmidimessage = null;
        }
        selectedMidiInput = null;

        if (!id || !midiAccess) {
            midiStatusSpan.textContent = 'Nessun disp.'; midiStatusSpan.className = 'midi-status';
            return;
        }

        selectedMidiInput = midiAccess.inputs.get(id);
        if (selectedMidiInput) {
            selectedMidiInput.onmidimessage = handleMIDIMessage; // Aggiungi listener al nuovo
            console.log(`In ascolto su: ${selectedMidiInput.name}`);
            midiStatusSpan.textContent = `Conn: ${selectedMidiInput.name.substring(0, 20)}..`;
            midiStatusSpan.className = 'midi-status connected';
        } else {
            console.error(`Dispositivo MIDI non trovato: ${id}`);
            midiStatusSpan.textContent = 'Errore disp.'; midiStatusSpan.className = 'midi-status error';
        }
    }
    function setupPianoKeys() {
        pianoKeys.forEach(key => {
            key.addEventListener('mousedown', () => key.classList.add('playing'));
            key.addEventListener('mouseup', () => key.classList.remove('playing'));
            key.addEventListener('mouseleave', () => key.classList.remove('playing'));
        });
    }
    function resetStaff() {
        activeDisplayElements.forEach(elData => {
            if (elData.element && elData.element.parentNode === notesArea) {
                notesArea.removeChild(elData.element);
            }
        });
        activeDisplayElements = [];
        // Potrebbe essere utile resettare il contatore per evitare ID enormi
        // elementCounter = 0;
    }

    // --- Funzioni Principali Modalità ---

    function setControlsState(mode) {
        const isIdle = (mode === 'none');
        progressionSelect.disabled = !isIdle;
        scaleSelect.disabled = !isIdle;
        scaleTonicSelect.disabled = !isIdle; // Abilitato sempre quando idle
        scaleModeSelect.disabled = !isIdle;
        startProgressionBtn.disabled = progressionSelect.value === "-1" || !isIdle;
        startScaleBtn.disabled = scaleSelect.value === "-1" || !isIdle;
        startComplexChordBtn.disabled = !isIdle; // Abilitato solo se idle
        stopProgressionBtn.disabled = (mode !== 'progression');
        stopScaleBtn.disabled = (mode !== 'scale');
        stopComplexChordBtn.disabled = (mode !== 'complexChord');
    }

    function stopCurrentMode() {
        if (activeMode === 'none') return;
        console.log(`Stop modalità: ${activeMode}`);
        if (activeMode === 'progression') {
            currentProgressionData = null; currentProgressionChordIndex = 0; currentProgressionIteration = 0;
        } else if (activeMode === 'scale') {
            currentScaleDefinition = null; currentScaleMIDIs = []; currentScaleNoteIndex = 0;
            currentScaleIteration = 0; currentScaleDirection = 'ascending'; currentScaleOctaveOffset = 0;
        } else if (activeMode === 'complexChord') {
            currentComplexChordDefinition = null;
            currentComplexChordMIDIs = [];
        }
        if (chordTimerId) clearTimeout(chordTimerId);
        noteInputBuffer = []; chordTimerId = null;
        activeMode = 'none';
        resetStaff(); // Pulisce lo staff
        setControlsState('none');
        // Non fermare il loop di animazione qui, potrebbe servire per rimuovere elementi residui
    }

    function startProgression() {
        const idx = parseInt(progressionSelect.value);
        if (idx < 0 || typeof PROGRESSIONS_DATA === 'undefined' || !PROGRESSIONS_DATA?.[idx]) return;
        stopCurrentMode(); activeMode = 'progression';
        console.log(`Start progressione: ${PROGRESSIONS_DATA[idx].name}`);
        currentProgressionData = PROGRESSIONS_DATA[idx];
        currentProgressionChordIndex = 0; currentProgressionIteration = 0;
        correctCount = 0; correctCountSpan.textContent = 0;
        timeSinceLastProgElementSpawn = intervalBetweenProgElementsMs; // Spawn immediato del primo
        resetStaff(); setControlsState('progression'); ensureAnimationLoopRunning();
    }

    function startScale() {
        const idx = parseInt(scaleSelect.value); const tonic = scaleTonicSelect.value;
        if (idx < 0 || typeof SCALES_DATA === 'undefined' || !SCALES_DATA?.[idx] || !tonic) return;
        stopCurrentMode(); activeMode = 'scale';
        console.log(`Start scala: ${SCALES_DATA[idx].name} in ${tonic} (Mode: ${scaleModeSelect.value})`);
        currentScaleDefinition = SCALES_DATA[idx];
        // Assicurati che generateScaleMidi sia disponibile (dovrebbe esserlo da scales.js)
        const genFunc = typeof generateScaleMidi === 'function' ? generateScaleMidi : (r, i) => { const m = typeof noteNameToMidi_Scale === 'function' ? noteNameToMidi_Scale(r) : null; if (m === null) return []; const n = i.map(v => m + v); n.push(m + 12); return n; };
        currentScaleMIDIs = genFunc(tonic, currentScaleDefinition.intervals);
        if (currentScaleMIDIs.length === 0) { console.error("Errore generazione scala MIDI"); stopCurrentMode(); return; }
        currentScaleNoteIndex = 0; currentScaleIteration = 0; currentScaleDirection = 'ascending'; currentScaleOctaveOffset = 0;
        correctCount = 0; correctCountSpan.textContent = 0; timeSinceLastScaleNoteSpawn = intervalBetweenScaleNotesMs;
        resetStaff(); setControlsState('scale'); ensureAnimationLoopRunning();
    }

    function startComplexChord() {
        if (typeof COMPLEX_CHORDS_DATA === 'undefined' || COMPLEX_CHORDS_DATA.length === 0) {
            console.error("COMPLEX_CHORDS_DATA non definito! Carica complexChords.js.");
            return;
        }
        const tonic = scaleTonicSelect.value; if (!tonic) { console.error("Seleziona una tonica!"); return; }
        stopCurrentMode(); activeMode = 'complexChord';
        currentComplexChordRoot = tonic;
        console.log(`Start modalità Accordi Complessi (Tonica: ${currentComplexChordRoot})`);
        correctCount = 0; correctCountSpan.textContent = 0;
        resetStaff(); setControlsState('complexChord');
        displayNextRandomComplexChord(); // Mostra il primo accordo
        ensureAnimationLoopRunning();
    }

    function displayNextRandomComplexChord() {
        resetStaff(); // Pulisce accordi precedenti

        if (typeof COMPLEX_CHORDS_DATA === 'undefined' || COMPLEX_CHORDS_DATA.length === 0) {
             console.error("COMPLEX_CHORDS_DATA non definito per displayNext!");
             stopCurrentMode(); return;
        }
        const randomIndex = Math.floor(Math.random() * COMPLEX_CHORDS_DATA.length);
        currentComplexChordDefinition = COMPLEX_CHORDS_DATA[randomIndex];

        // Assicurati che noteNameToMidi e buildChord siano globali
        const rootMidi = typeof noteNameToMidi === 'function' ? noteNameToMidi(currentComplexChordRoot) : null;
        if (rootMidi === null) { console.error(`Tonica non valida per accordo complesso: ${currentComplexChordRoot}`); stopCurrentMode(); return; }
        if (typeof buildChord !== 'function') { console.error("Funzione buildChord non trovata!"); stopCurrentMode(); return; }

        currentComplexChordMIDIs = buildChord(rootMidi, currentComplexChordDefinition.type);

        if (currentComplexChordMIDIs.length === 0) {
            console.error(`Errore generazione accordo: ${currentComplexChordDefinition.name} con tonica ${currentComplexChordRoot}`);
            stopCurrentMode(); return;
        }

        const chordFullName = `${currentComplexChordRoot.replace(/\d+$/, '')} ${currentComplexChordDefinition.name}`; // Es: C maj7#11
        console.log(`Prossimo Accordo: ${chordFullName} - MIDI: [${currentComplexChordMIDIs.join(',')}]`);

        drawElementOnStaff({
            type: 'chord',
            midis: currentComplexChordMIDIs,
            chordName: chordFullName // Salva nome per riferimento/debug
        });
    }

    function ensureAnimationLoopRunning() {
        if (!animationFrameId) {
            console.log("Avvio loop animazione");
            lastTimestamp = performance.now();
            animationFrameId = requestAnimationFrame(animationLoop);
        }
    }

    // --- Loop di Animazione ---
    function animationLoop(timestamp) {
        if (!lastTimestamp) lastTimestamp = timestamp;
        const deltaTime = timestamp - lastTimestamp;
        lastTimestamp = timestamp;
        // Ignora frame troppo lunghi (es. cambio tab)
        if (deltaTime > 500) {
            animationFrameId = requestAnimationFrame(animationLoop);
            return;
        }

        // --- Spawn Elementi ---
        if (activeMode === 'progression' && currentProgressionData) {
            timeSinceLastProgElementSpawn += deltaTime;
            while (timeSinceLastProgElementSpawn >= intervalBetweenProgElementsMs && currentProgressionChordIndex < currentProgressionData.chords.length) {
                const baseChordMidiData = currentProgressionData.chords[currentProgressionChordIndex];
                if (Array.isArray(baseChordMidiData) && baseChordMidiData.length > 0) {
                    // Alterna ottava (esempio semplice)
                    let actualMidisToDraw = (currentProgressionIteration % 2 !== 0) ? baseChordMidiData.map(m => m - 12) : baseChordMidiData;
                    drawElementOnStaff({ type: actualMidisToDraw.length === 1 ? 'note' : 'chord', midis: actualMidisToDraw });
                }
                currentProgressionChordIndex++;
                timeSinceLastProgElementSpawn -= intervalBetweenProgElementsMs;
                if (currentProgressionChordIndex >= currentProgressionData.chords.length) {
                    currentProgressionChordIndex = 0; currentProgressionIteration++;
                    console.log(`Progressione: Ciclo ${currentProgressionIteration}`);
                    timeSinceLastProgElementSpawn -= intervalBetweenProgElementsMs; // Pausa tra cicli
                    break; // Esce dal while per la pausa
                }
            }
        } else if (activeMode === 'scale' && currentScaleMIDIs.length > 0) {
            const scaleMode = scaleModeSelect.value;
            timeSinceLastScaleNoteSpawn += deltaTime;
            while (timeSinceLastScaleNoteSpawn >= intervalBetweenScaleNotesMs) {
                let actualMidiToDraw;
                const baseMidiNote = currentScaleMIDIs[currentScaleNoteIndex];
                if (scaleMode === 'alternating') {
                    actualMidiToDraw = (currentScaleIteration % 2 !== 0) ? baseMidiNote - 12 : baseMidiNote;
                } else { // ascending-descending
                    actualMidiToDraw = baseMidiNote + currentScaleOctaveOffset * 12;
                }
                drawElementOnStaff({ type: 'note', midis: [actualMidiToDraw] });
                timeSinceLastScaleNoteSpawn -= intervalBetweenScaleNotesMs;

                // Aggiorna indici/direzione
                if (scaleMode === 'alternating') {
                    currentScaleNoteIndex++;
                    if (currentScaleNoteIndex >= currentScaleMIDIs.length) {
                        currentScaleNoteIndex = 0; currentScaleIteration++;
                        console.log(`Scala (Alt): Ciclo ${currentScaleIteration}`);
                        timeSinceLastScaleNoteSpawn -= intervalBetweenScaleNotesMs; // Pausa
                    }
                } else { // ascending-descending
                    if (currentScaleDirection === 'ascending') {
                        currentScaleNoteIndex++;
                        if (currentScaleNoteIndex >= currentScaleMIDIs.length) {
                            if (currentScaleOctaveOffset < ASC_DESC_MAX_OCTAVE_OFFSET) {
                                currentScaleOctaveOffset++; currentScaleNoteIndex = 1;
                                console.log(`Scala (Asc): Ottava Offset ${currentScaleOctaveOffset}`);
                            } else {
                                currentScaleDirection = 'descending'; currentScaleNoteIndex = currentScaleMIDIs.length - 2;
                                console.log(`Scala (Asc): Max Ottava, Inverti -> Desc`);
                            }
                        }
                    } else { // descending
                        currentScaleNoteIndex--;
                        if (currentScaleNoteIndex < 0) {
                            if (currentScaleOctaveOffset > ASC_DESC_MIN_OCTAVE_OFFSET) {
                                currentScaleOctaveOffset--; currentScaleNoteIndex = currentScaleMIDIs.length - 2;
                                console.log(`Scala (Desc): Ottava Offset ${currentScaleOctaveOffset}`);
                            } else {
                                currentScaleDirection = 'ascending'; currentScaleNoteIndex = 1;
                                console.log(`Scala (Desc): Min Ottava, Inverti -> Asc`);
                            }
                        }
                    }
                } // fine logica asc/desc
            } // fine while spawn note scala
        } else if (activeMode === 'complexChord') {
            // Nessuno spawn automatico, solo movimento
        }

        // --- Muovi Elementi & Rimuovi ---
        const elementsToRemoveIndexes = [];
        const moveDist = pixelsPerSecond * (deltaTime / 1000);
        activeDisplayElements.forEach((elData, index) => {
            elData.xPos -= moveDist;
            if (elData.element) {
                elData.element.setAttribute('transform', `translate(${elData.xPos}, 0)`);
            }
            // Rimuovi se esce dallo schermo
            if (elData.xPos < NOTE_END_X) {
                elementsToRemoveIndexes.push(index);
            }
        });
        // Rimuovi elementi usciti (dal fondo per evitare problemi di indice)
        for (let i = elementsToRemoveIndexes.length - 1; i >= 0; i--) {
            const idx = elementsToRemoveIndexes[i];
            const el = activeDisplayElements[idx];
            if (el.element?.parentNode === notesArea) {
                notesArea.removeChild(el.element);
            }
            activeDisplayElements.splice(idx, 1);
        }

        // Continua il loop solo se necessario
        if (activeMode !== 'none' || activeDisplayElements.length > 0) {
            animationFrameId = requestAnimationFrame(animationLoop);
        } else {
            animationFrameId = null; // Ferma il loop
            console.log("Loop animazione fermato (idle e schermo vuoto).");
        }
    }

    // --- Gestione MIDI & Scoring ---
    function handleMIDIMessage(message) {
        const [command, note, velocity] = message.data;
        const keyElement = document.querySelector(`.key[data-midi="${note}"]`);

        if (command === 144 && velocity > 0) { // Note On
            if (keyElement) keyElement.classList.add('playing');
            if (activeMode !== 'none') {
                const playedNote = note;
                // Feedback visivo immediato (opzionale)
                const targetInfoImmediate = findNextTargetElement();
                if (targetInfoImmediate?.elementData?.element) {
                    const targetElement = targetInfoImmediate.elementData.element;
                    try {
                        const expectedMidisImmediate = JSON.parse(targetElement.dataset.midis || '[]');
                        if (expectedMidisImmediate.includes(playedNote)) {
                            const noteHeadElement = targetElement.querySelector(`.note-head[data-midi="${playedNote}"]`);
                            if (noteHeadElement && !noteHeadElement.classList.contains('correct-single')) {
                                noteHeadElement.classList.add('correct-single');
                            }
                        }
                    } catch (e) { console.error("Errore parsing MIDI per feedback:", e); }
                }

                // Logica di scoring per modalità
                if (activeMode === 'scale') {
                    checkScaleNoteHit(playedNote);
                } else if (activeMode === 'progression' || activeMode === 'complexChord') {
                    if (!noteInputBuffer.includes(playedNote)) noteInputBuffer.push(playedNote);
                    if (chordTimerId) clearTimeout(chordTimerId);
                    const scoringFunction = (activeMode === 'progression') ? processProgressionBufferForScoring : processComplexChordBufferForScoring;
                    chordTimerId = setTimeout(scoringFunction, CHORD_WINDOW_MS);
                }
            }
        } else if (command === 128 || (command === 144 && velocity === 0)) { // Note Off
            if (keyElement) keyElement.classList.remove('playing');
        }
    }

    function checkScaleNoteHit(playedNote) {
        const targetInfo = findNextTargetElement('note'); // Cerca solo note singole
        if (targetInfo) {
            const targetElementData = targetInfo.elementData;
            const expectedNote = targetElementData.midis[0];
            if (playedNote === expectedNote) {
                correctCount++; correctCountSpan.textContent = correctCount;
                if (targetElementData.element) {
                    targetElementData.element.classList.add('correct');
                    // Rimuovi dopo un breve ritardo
                    setTimeout(() => {
                        if (targetElementData.element?.parentNode === notesArea) {
                            notesArea.removeChild(targetElementData.element);
                        }
                        const currentIdx = activeDisplayElements.findIndex(e => e.id === targetElementData.id);
                        if (currentIdx > -1) activeDisplayElements.splice(currentIdx, 1);
                    }, 300);
                } else { // Se l'elemento non c'è più, rimuovi solo dai dati
                    const currentIdx = activeDisplayElements.findIndex(e => e.id === targetElementData.id);
                    if (currentIdx > -1) activeDisplayElements.splice(currentIdx, 1);
                }
            } else {
                console.log(`SCALA: SBAGLIATO. Atteso: [${expectedNote}] Suonato: [${playedNote}]`);
                if (targetElementData.element) {
                    targetElementData.element.classList.add('incorrect');
                    setTimeout(() => targetElementData.element?.classList.remove('incorrect'), 300);
                    targetElementData.element?.querySelectorAll('.note-head.correct-single').forEach(nh => nh.classList.remove('correct-single'));
                }
            }
        }
    }

    function processProgressionBufferForScoring() {
        chordTimerId = null;
        if (noteInputBuffer.length === 0 || activeMode !== 'progression') { noteInputBuffer = []; return; }
        const played = [...noteInputBuffer].sort((a, b) => a - b);
        noteInputBuffer = [];
        const targetInfo = findNextTargetElement(); // Cerca il prossimo accordo/nota della progressione
        if (targetInfo) {
            const targetElementData = targetInfo.elementData;
            const expected = targetElementData.midis;
            let match = played.length === expected.length && played.every((v, i) => v === expected[i]);
            if (match) {
                correctCount++; correctCountSpan.textContent = correctCount;
                if (targetElementData.element) {
                    targetElementData.element.classList.add('correct');
                    setTimeout(() => {
                        if (targetElementData.element?.parentNode === notesArea) {
                            notesArea.removeChild(targetElementData.element);
                        }
                        const currentIdx = activeDisplayElements.findIndex(e => e.id === targetElementData.id);
                        if (currentIdx > -1) activeDisplayElements.splice(currentIdx, 1);
                    }, 300);
                } else {
                    const currentIdx = activeDisplayElements.findIndex(e => e.id === targetElementData.id);
                    if (currentIdx > -1) activeDisplayElements.splice(currentIdx, 1);
                }
            } else {
                console.log(`PROGRESSIONE: SBAGLIATO. Atteso: [${expected.join(',')}] Suonato: [${played.join(',')}]`);
                if (targetElementData.element) {
                    targetElementData.element.classList.add('incorrect');
                    setTimeout(() => targetElementData.element?.classList.remove('incorrect'), 300);
                    targetElementData.element?.querySelectorAll('.note-head.correct-single').forEach(nh => nh.classList.remove('correct-single'));
                }
            }
        }
    }

    function processComplexChordBufferForScoring() {
        chordTimerId = null;
        if (noteInputBuffer.length === 0 || activeMode !== 'complexChord') { noteInputBuffer = []; return; }
        const played = [...noteInputBuffer].sort((a, b) => a - b);
        noteInputBuffer = [];
        const targetInfo = findNextTargetElement('chord'); // Cerca l'accordo complesso corrente
        if (targetInfo && currentComplexChordMIDIs.length > 0) {
            const targetElementData = targetInfo.elementData;
            const expected = currentComplexChordMIDIs;
            let match = played.length === expected.length && played.every((v, i) => v === expected[i]);
            if (match) {
                console.log(`ACCORDO COMPLESSO: CORRETTO! [${played.join(',')}]`);
                correctCount++; correctCountSpan.textContent = correctCount;
                if (targetElementData.element) {
                    targetElementData.element.classList.add('correct');
                    // Mostra il prossimo accordo dopo il feedback
                    setTimeout(() => {
                        displayNextRandomComplexChord();
                    }, 300);
                } else {
                    displayNextRandomComplexChord(); // Mostra comunque il prossimo
                }
            } else {
                console.log(`ACCORDO COMPLESSO: SBAGLIATO. Atteso: [${expected.join(',')}] Suonato: [${played.join(',')}]`);
                if (targetElementData.element) {
                    targetElementData.element.classList.add('incorrect');
                    setTimeout(() => targetElementData.element?.classList.remove('incorrect'), 300);
                    targetElementData.element?.querySelectorAll('.note-head.correct-single').forEach(nh => nh.classList.remove('correct-single'));
                }
                // Non passare al prossimo se sbagliato
            }
        } else {
            console.log("Nessun accordo complesso target trovato per lo scoring.");
        }
    }

    // --- Inizializzazione ---
    updateTempoAndSpeed();
    // Popola i select solo se i dati sono disponibili
    try { if (typeof PROGRESSIONS_DATA !== 'undefined') populateProgressionSelect(); } catch (e) { console.error("Errore popolamento Progressioni:", e); }
    try { if (typeof SCALES_DATA !== 'undefined') populateScaleSelect(); } catch (e) { console.error("Errore popolamento Scale:", e); }
    try { populateTonicSelect(); } catch (e) { console.error("Errore popolamento Tonica:", e); }
    // Verifica caricamento dati accordi complessi
    if (typeof COMPLEX_CHORDS_DATA === 'undefined') {
         console.warn("COMPLEX_CHORDS_DATA non definito. La modalità Accordi Complessi non funzionerà.");
         startComplexChordBtn.disabled = true; // Disabilita il pulsante se i dati mancano
         startComplexChordBtn.title = "Dati accordi complessi non caricati (complexChords.js?)";
    }

    setupMIDI();
    setupPianoKeys();
    setControlsState('none');

    // --- Event Listeners ---
    tempoSlider.addEventListener('input', updateTempoAndSpeed);
    midiInputSelect.addEventListener('change', (e) => selectMIDIInput(e.target.value));

    progressionSelect.addEventListener('change', () => setControlsState(activeMode));
    startProgressionBtn.addEventListener('click', startProgression);
    stopProgressionBtn.addEventListener('click', stopCurrentMode);

    scaleSelect.addEventListener('change', () => setControlsState(activeMode));
    scaleTonicSelect.addEventListener('change', () => {
        const newTonic = scaleTonicSelect.value;
        if (activeMode === 'complexChord') {
            currentComplexChordRoot = newTonic;
            console.log(`Tonica accordo complesso aggiornata: ${currentComplexChordRoot}`);
            // Se c'è un accordo visualizzato, rigeneralo e ridisegnalo con la nuova tonica
            if (currentComplexChordDefinition) {
                 const rootMidi = typeof noteNameToMidi === 'function' ? noteNameToMidi(currentComplexChordRoot) : null;
                 if (rootMidi !== null && typeof buildChord === 'function') {
                     currentComplexChordMIDIs = buildChord(rootMidi, currentComplexChordDefinition.type);
                     resetStaff(); // Pulisci il vecchio
                     if (currentComplexChordMIDIs.length > 0) {
                         const chordFullName = `${currentComplexChordRoot.replace(/\d+$/, '')} ${currentComplexChordDefinition.name}`;
                         drawElementOnStaff({ type: 'chord', midis: currentComplexChordMIDIs, chordName: chordFullName });
                     } else {
                         console.error("Errore rigenerazione accordo complesso con nuova tonica.");
                     }
                 }
            }
        }
        setControlsState(activeMode); // Aggiorna stato generale controlli
    });
    scaleModeSelect.addEventListener('change', () => { /* Nessuna azione immediata richiesta */ });
    startScaleBtn.addEventListener('click', startScale);
    stopScaleBtn.addEventListener('click', stopCurrentMode);

    // Listener per Accordi Complessi
    startComplexChordBtn.addEventListener('click', startComplexChord);
    stopComplexChordBtn.addEventListener('click', stopCurrentMode);

    console.log("Piano Tutor V12 (Complex Chords) Inizializzato.");
});