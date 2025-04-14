// script.js V11 - Asc/Desc Scale Mode

document.addEventListener('DOMContentLoaded', () => {
    // --- Costanti (Invariate) ---
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
    const DEFAULT_SCALE_OCTAVE = 4;
    const CHORD_WINDOW_MS = 85;
    const ASC_DESC_MAX_OCTAVE_OFFSET = 1; // Quante ottave salire dalla base
    const ASC_DESC_MIN_OCTAVE_OFFSET = -1; // Quante ottave scendere dalla base

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
    const scaleModeSelect = document.getElementById('scale-mode-select'); // NUOVO
    const startScaleBtn = document.getElementById('start-scale-btn');
    const stopScaleBtn = document.getElementById('stop-scale-btn');
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
    let activeMode = 'none';

    // --- Stato Progressione (Invariato da V10) ---
    let currentProgressionData = null;
    let currentProgressionChordIndex = 0;
    let currentProgressionIteration = 0;
    let timeSinceLastProgElementSpawn = 0;
    let intervalBetweenProgElementsMs = 600;

    // --- Stato Scale (MODIFICATO) ---
    let currentScaleDefinition = null;
    let currentScaleMIDIs = []; // Note MIDI base
    let currentScaleNoteIndex = 0;
    let currentScaleIteration = 0; // Usato solo per 'alternating' mode
    let currentScaleDirection = 'ascending'; // NUOVO: 'ascending' o 'descending'
    let currentScaleOctaveOffset = 0; // NUOVO: 0=base, 1=up, -1=down
    let timeSinceLastScaleNoteSpawn = 0;
    let intervalBetweenScaleNotesMs = 300;


    // --- Funzioni Ausiliarie (Invariate dalla V10/V8) ---
     // ... (copia qui le funzioni da V10: getNoteName, getNoteYPosition, midiToDiatonicSteps, getLedgerLinePositions, getStemDirection, drawSingleNoteParts, drawElementOnStaff, updateTempoAndSpeed, populate..., findNextTargetElement, setupMIDI, onMIDISuccess, onMIDIFailure, populateMIDISelect, onMIDIStateChange, selectMIDIInput, setupPianoKeys, checkScaleNoteHit, processProgressionBufferForScoring) ...
    function getNoteName(midi) { /* ... */
        if (midi < 0 || midi > 127) return { name: "?", accidental: null, octave: 0 };
        const noteIndex = midi % 12; const octave = Math.floor(midi / 12) - 1;
        const baseName = NOTE_NAMES[noteIndex];
        const accidental = baseName.includes('#') ? '#' : (baseName.includes('b') ? '♭' : null);
        const naturalName = baseName.replace(/[#b]/, '');
        return { name: `${naturalName}${octave}`, accidental: accidental, octave: octave };
     }
    function getNoteYPosition(midi) { /* ... */
        let y = 0; let clef = 'treble';
        if (midi < MIDDLE_C_MIDI) { clef = 'bass'; const steps = midiToDiatonicSteps(midi, 50); y = BASS_D3_Y - steps * STAFF_STEP_Y; }
        else { clef = 'treble'; const steps = midiToDiatonicSteps(midi, 71); y = TREBLE_B4_Y - steps * STAFF_STEP_Y; }
        return { y, clef };
    }
    function midiToDiatonicSteps(targetMidi, referenceMidi) { /* ... */
        const base = [0, 2, 4, 5, 7, 9, 11];
        const getSteps = (m) => { const o = Math.floor(m / 12) - 1; const n = m % 12; let s = 0; for(let i=base.length-1;i>=0;i--) if(n>=base[i]){s=i;break;} return o*7+s; };
        return getSteps(targetMidi) - getSteps(referenceMidi);
    }
    function getLedgerLinePositions(midi, yPos, clef) { /* ... */
        const lines = []; const topY = (clef==='treble') ? TREBLE_STAFF_TOP_Y : BASS_STAFF_TOP_Y;
        const bottomY = (clef==='treble') ? TREBLE_STAFF_BOTTOM_Y : BASS_STAFF_BOTTOM_Y;
        const topLimit = (clef==='treble') ? 77 : 60; const bottomLimit = (clef==='treble') ? 60 : 55;
        if(midi <= bottomLimit) { if(midi===bottomLimit) lines.push(bottomY + STAFF_LINE_GAP); if(midi < bottomLimit) for(let ly = bottomY + STAFF_LINE_GAP * 2; ly <= yPos + STAFF_STEP_Y / 4; ly += STAFF_LINE_GAP) lines.push(ly); }
        if(midi >= topLimit) { if(midi===topLimit) lines.push(topY - STAFF_LINE_GAP); if(midi > topLimit) for(let ly = topY - STAFF_LINE_GAP * (clef==='treble'?1:2) ; ly >= yPos - STAFF_STEP_Y / 4; ly -= STAFF_LINE_GAP) lines.push(ly); }
        if(midi === 60 && clef === 'treble' && !lines.includes(bottomY + STAFF_LINE_GAP)) lines.push(bottomY + STAFF_LINE_GAP);
        if(midi === 60 && clef === 'bass' && !lines.includes(topY - STAFF_LINE_GAP)) lines.push(topY - STAFF_LINE_GAP);
        return lines;
    }
     function getStemDirection(yPos, clef) { /* ... */ const midY = (clef==='treble') ? TREBLE_B4_Y : BASS_D3_Y; return (yPos > midY) ? 'up' : 'down'; }
    function drawSingleNoteParts(midi, parentGroup, options = {}) { /* ... */
        const { y, clef } = getNoteYPosition(midi); const { accidental } = getNoteName(midi);
        const stemDir = options.stemDirection || getStemDirection(y, clef);
        const ledgerYs = getLedgerLinePositions(midi, y, clef);
        const stemX = (stemDir === 'up') ? -NOTE_RADIUS : NOTE_RADIUS;
        ledgerYs.forEach(ly => { const l=document.createElementNS(SVG_NS,'line'); l.setAttribute('x1',-NOTE_RADIUS-LEDGER_LINE_EXTENSION);l.setAttribute('y1',ly);l.setAttribute('x2',NOTE_RADIUS+LEDGER_LINE_EXTENSION);l.setAttribute('y2',ly);l.classList.add('ledger-line');parentGroup.appendChild(l); });
        if (accidental && !options.hideAccidental) { const t=document.createElementNS(SVG_NS,'text'); t.setAttribute('x',ACCIDENTAL_OFFSET_X);t.setAttribute('y',y+7);t.classList.add('note-accidental');t.textContent=accidental==='#'?'♯':'♭';parentGroup.appendChild(t); }
        const h=document.createElementNS(SVG_NS,'ellipse'); h.setAttribute('cx',0);h.setAttribute('cy',y);h.setAttribute('rx',NOTE_RADIUS*1.05);h.setAttribute('ry',NOTE_RADIUS*0.95);h.setAttribute('transform',`rotate(-15 0 ${y})`);h.classList.add('note-head');h.dataset.midi=midi;parentGroup.appendChild(h);
        const s=document.createElementNS(SVG_NS,'line'); s.setAttribute('x1',stemX);s.setAttribute('y1',y);s.setAttribute('x2',stemX);s.setAttribute('y2',y+(stemDir==='up'?-STEM_HEIGHT:STEM_HEIGHT));s.classList.add('note-stem');parentGroup.appendChild(s);
    }
    function drawElementOnStaff(elementData) { /* ... */
        if (!elementData.id) elementData.id = ++elementCounter;
        if (!elementData.xPos) elementData.xPos = NOTE_START_X;
        elementData.midis.sort((a, b) => a - b);

        const mainGroup = document.createElementNS(SVG_NS, 'g');
        mainGroup.setAttribute('id', `element-${elementData.id}`);
        mainGroup.classList.add(elementData.type === 'chord' ? 'chord-group' : 'note-group');
        mainGroup.setAttribute('transform', `translate(${elementData.xPos}, 0)`);
        mainGroup.dataset.midis = JSON.stringify(elementData.midis);

        let furthestMidi = elementData.midis[0]; let maxDist = 0;
        elementData.midis.forEach(m => { const {y,clef}=getNoteYPosition(m); const midY=(clef==='treble')?TREBLE_B4_Y:BASS_D3_Y; const d=Math.abs(y-midY); if(d>=maxDist){maxDist=d;furthestMidi=m;} });
        const {y:fY,clef:fC} = getNoteYPosition(furthestMidi); const stemDir = getStemDirection(fY,fC);
        elementData.midis.forEach(m => drawSingleNoteParts(m, mainGroup, { stemDirection: stemDir }));

        notesArea.appendChild(mainGroup); elementData.element = mainGroup;
        activeDisplayElements.push(elementData);
    }
    function updateTempoAndSpeed() { /* ... */
        currentBPM = parseInt(tempoSlider.value, 10); tempoValueDisplay.textContent = currentBPM;
        pixelsPerSecond = currentBPM * 0.8; intervalBetweenProgElementsMs = (60/currentBPM)*1000;
        intervalBetweenScaleNotesMs = intervalBetweenProgElementsMs / 2;
    }
    function populateProgressionSelect() { /* ... */
        if(typeof PROGRESSIONS_DATA==='undefined'){console.error("PROGRESSIONS_DATA?");return;}
        progressionSelect.innerHTML='<option value="-1">-- Giro Armonico --</option>';
        PROGRESSIONS_DATA.forEach((p,i)=>{const o=document.createElement('option');o.value=i;o.textContent=p.name;progressionSelect.appendChild(o);});
    }
     function populateScaleSelect() { /* ... */
         if(typeof SCALES_DATA==='undefined'){console.error("SCALES_DATA?");return;}
         scaleSelect.innerHTML='<option value="-1">-- Scala --</option>';
         SCALES_DATA.forEach((s,i)=>{const o=document.createElement('option');o.value=i;o.textContent=s.name;scaleSelect.appendChild(o);});
     }
    function populateTonicSelect() { /* ... */
         scaleTonicSelect.innerHTML=''; TONIC_NOTES.forEach(n=>{const o=document.createElement('option');o.value=n+DEFAULT_SCALE_OCTAVE;o.textContent=n;if(n==="C")o.selected=true;scaleTonicSelect.appendChild(o);});
    }
    function findNextTargetElement(filterType = null) { /* ... */
        for (let i = 0; i < activeDisplayElements.length; i++) {
            const elData = activeDisplayElements[i];
            if (elData.element?.classList.contains('correct')) continue;
            if (filterType && elData.type !== filterType) continue;
            return { elementData: elData, index: i };
        }
        return null;
    }
    function setupMIDI() { /* ... */
        midiStatusSpan.textContent='Verifica...';midiStatusSpan.className='midi-status';
         if(navigator.requestMIDIAccess)navigator.requestMIDIAccess({sysex:false}).then(onMIDISuccess,onMIDIFailure); else onMIDIFailure('No WebMIDI');
    }
    function onMIDISuccess(access) { /* ... */
        midiAccess=access;midiStatusSpan.textContent='Pronto';midiStatusSpan.classList.add('connected');populateMIDISelect();
        midiAccess.onstatechange=onMIDIStateChange; ensureAnimationLoopRunning();
    }
    function onMIDIFailure(msg) { /* ... */ console.error(`MIDI Err: ${msg}`);midiStatusSpan.textContent=`MIDI Err: ${msg}`;midiStatusSpan.classList.add('error'); }
    function populateMIDISelect() { /* ... */
        midiInputSelect.innerHTML='<option value="">-- Dispositivo --</option>'; if(!midiAccess)return; const inputs=midiAccess.inputs.values(); let firstId=null;
        for(let i=inputs.next();i&&!i.done;i=inputs.next()){const d=i.value;const o=document.createElement('option');o.value=d.id;o.textContent=d.name;midiInputSelect.appendChild(o);if(!firstId)firstId=d.id;}
        if(firstId){midiInputSelect.value=firstId;selectMIDIInput(firstId);}else{midiStatusSpan.textContent='No disp.';midiStatusSpan.classList.remove('connected');}
    }
    function onMIDIStateChange(e) { /* ... */
        console.log('MIDI State:',e.port.name,e.port.state); const cur=midiInputSelect.value; populateMIDISelect();
        if(midiAccess?.inputs.has(cur)){midiInputSelect.value=cur;selectMIDIInput(cur);}else if(midiInputSelect.options.length>1){midiInputSelect.selectedIndex=1;selectMIDIInput(midiInputSelect.value);}else selectMIDIInput("");
    }
    function selectMIDIInput(id) { /* ... */
        if(selectedMidiInput)selectedMidiInput.onmidimessage=null; selectedMidiInput=null; if(!id||!midiAccess){midiStatusSpan.textContent='No disp.';midiStatusSpan.className='midi-status';return;}
        selectedMidiInput=midiAccess.inputs.get(id); if(selectedMidiInput){selectedMidiInput.onmidimessage=handleMIDIMessage;console.log(`Listen: ${selectedMidiInput.name}`);midiStatusSpan.textContent=`Conn: ${selectedMidiInput.name.substring(0,20)}..`;midiStatusSpan.className='midi-status connected';}else{console.error(`MIDI not found: ${id}`);midiStatusSpan.textContent='Err disp.';midiStatusSpan.className='midi-status error';}
    }
    function setupPianoKeys() { /* ... */ pianoKeys.forEach(k=>{k.addEventListener('mousedown',()=>k.classList.add('playing')); k.addEventListener('mouseup',()=>k.classList.remove('playing')); k.addEventListener('mouseleave',()=>k.classList.remove('playing'));}); }
    function checkScaleNoteHit(playedNote) { /* ... da V8 ... */
        //console.log(`Check Scala: Nota ${playedNote}`);
        const targetInfo = findNextTargetElement('note');
        if (targetInfo) {
            const targetElementData = targetInfo.elementData;
            const expectedNote = targetElementData.midis[0];
            if (playedNote === expectedNote) {
                correctCount++; correctCountSpan.textContent = correctCount;
                if (targetElementData.element) { targetElementData.element.classList.add('correct'); setTimeout(() => { if(targetElementData.element?.parentNode === notesArea) notesArea.removeChild(targetElementData.element); const cI=activeDisplayElements.findIndex(e=>e.id===targetElementData.id); if(cI>-1) activeDisplayElements.splice(cI,1); }, 300); }
                else { const cI=activeDisplayElements.findIndex(e=>e.id===targetElementData.id); if(cI>-1) activeDisplayElements.splice(cI,1); }
            } else {
                console.log(`SCALA: SBAGLIATO. Atteso: [${expectedNote}] Suonato: [${playedNote}]`);
                if (targetElementData.element) { targetElementData.element.classList.add('incorrect'); setTimeout(()=>targetElementData.element?.classList.remove('incorrect'), 300); targetElementData.element?.querySelectorAll('.note-head.correct-single').forEach(nh => nh.classList.remove('correct-single')); }
            }
        }
    }
    function processProgressionBufferForScoring() { /* ... da V8 ... */
        chordTimerId = null; if (noteInputBuffer.length === 0 || activeMode !== 'progression') { noteInputBuffer = []; return; }
        const played = [...noteInputBuffer].sort((a, b) => a - b); noteInputBuffer = [];
        const targetInfo = findNextTargetElement();
        if (targetInfo) {
            const targetElementData = targetInfo.elementData; const expected = targetElementData.midis;
            let match = played.length === expected.length && played.every((v, i) => v === expected[i]);
            if (match) {
                correctCount++; correctCountSpan.textContent = correctCount;
                if (targetElementData.element) { targetElementData.element.classList.add('correct'); setTimeout(() => { if(targetElementData.element?.parentNode === notesArea) notesArea.removeChild(targetElementData.element); const cI=activeDisplayElements.findIndex(e=>e.id===targetElementData.id); if(cI>-1) activeDisplayElements.splice(cI,1); }, 300); }
                else { const cI=activeDisplayElements.findIndex(e=>e.id===targetElementData.id); if(cI>-1) activeDisplayElements.splice(cI,1); }
            } else {
                console.log(`PROGRESSIONE: SBAGLIATO. Atteso: [${expected.join(',')}] Suonato: [${played.join(',')}]`);
                if (targetElementData.element) { targetElementData.element.classList.add('incorrect'); setTimeout(()=>targetElementData.element?.classList.remove('incorrect'), 300); targetElementData.element?.querySelectorAll('.note-head.correct-single').forEach(nh => nh.classList.remove('correct-single')); }
            }
        }
    }

    // --- Funzioni Principali (MODIFICATE) ---

    /** Abilita/Disabilita i controlli in base alla modalità attiva */
    function setControlsState(mode) {
        const isIdle = (mode === 'none');
        progressionSelect.disabled = !isIdle;
        scaleSelect.disabled = !isIdle;
        scaleTonicSelect.disabled = !isIdle;
        scaleModeSelect.disabled = !isIdle; // NUOVO: Disabilita anche mode select
        startProgressionBtn.disabled = progressionSelect.value === "-1" || !isIdle;
        startScaleBtn.disabled = scaleSelect.value === "-1" || !isIdle;
        stopProgressionBtn.disabled = (mode !== 'progression');
        stopScaleBtn.disabled = (mode !== 'scale');
    }

    /** Ferma la modalità attiva */
    function stopCurrentMode() {
        if (activeMode === 'none') return;
        console.log(`Stop modalità: ${activeMode}`);
        if (activeMode === 'progression') {
            currentProgressionData = null; currentProgressionChordIndex = 0; currentProgressionIteration = 0;
        } else if (activeMode === 'scale') {
            currentScaleDefinition = null; currentScaleMIDIs = []; currentScaleNoteIndex = 0;
            currentScaleIteration = 0; currentScaleDirection = 'ascending'; currentScaleOctaveOffset = 0; // Reset stato Asc/Desc
        }
        if (chordTimerId) clearTimeout(chordTimerId);
        noteInputBuffer = []; chordTimerId = null;
        activeMode = 'none';
        setControlsState('none');
     }

    /** Avvia la riproduzione della progressione */
     function startProgression() {
        const idx = parseInt(progressionSelect.value); if(idx<0||!PROGRESSIONS_DATA?.[idx])return;
        stopCurrentMode(); activeMode='progression'; console.log(`Start prog: ${PROGRESSIONS_DATA[idx].name}`);
        currentProgressionData = PROGRESSIONS_DATA[idx];
        currentProgressionChordIndex=0; currentProgressionIteration = 0; // Reset Iteration
        correctCount=0;correctCountSpan.textContent=0;
        timeSinceLastProgElementSpawn=intervalBetweenProgElementsMs; resetStaff(); setControlsState('progression'); ensureAnimationLoopRunning();
    }

    /** Avvia la riproduzione della scala */
    function startScale() {
        const idx = parseInt(scaleSelect.value); const tonic = scaleTonicSelect.value; if(idx<0||!SCALES_DATA?.[idx]||!tonic)return;
        stopCurrentMode(); activeMode='scale'; console.log(`Start scala: ${SCALES_DATA[idx].name} in ${tonic} (Mode: ${scaleModeSelect.value})`);
        currentScaleDefinition = SCALES_DATA[idx];
        const genFunc = typeof generateScaleMidi==='function'?generateScaleMidi:(r,i)=>{const m=typeof noteNameToMidi_Scale==='function'?noteNameToMidi_Scale(r):null;if(m===null)return[];const n=i.map(v=>m+v);n.push(m+12);return n;};
        currentScaleMIDIs = genFunc(tonic, currentScaleDefinition.intervals); // Genera note base
        if(currentScaleMIDIs.length===0){console.error("Errore gen scala");activeMode='none';setControlsState('none');return;}
        // Reset stato specifico scale
        currentScaleNoteIndex=0; currentScaleIteration = 0; currentScaleDirection = 'ascending'; currentScaleOctaveOffset = 0;
        correctCount=0;correctCountSpan.textContent=0; timeSinceLastScaleNoteSpawn=intervalBetweenScaleNotesMs;
        resetStaff(); setControlsState('scale'); ensureAnimationLoopRunning();
    }

    /** Assicura che il loop di animazione sia attivo */
    function ensureAnimationLoopRunning() { if(!animationFrameId){console.log("Avvio loop");lastTimestamp=performance.now();animationFrameId=requestAnimationFrame(animationLoop);} }


    // --- Loop di Animazione (MODIFICATO per modalità scala) ---
    function animationLoop(timestamp) {
        if (!lastTimestamp) lastTimestamp = timestamp; const deltaTime = timestamp - lastTimestamp; lastTimestamp = timestamp;
        if (deltaTime > 500) { animationFrameId = requestAnimationFrame(animationLoop); return; }

        // --- Spawn Elementi ---
        if (activeMode === 'progression' && currentProgressionData) {
            // Logica spawn progressione (invariata da V10)
             timeSinceLastProgElementSpawn += deltaTime;
            while (timeSinceLastProgElementSpawn >= intervalBetweenProgElementsMs && currentProgressionChordIndex < currentProgressionData.chords.length) {
                const baseChordMidiData = currentProgressionData.chords[currentProgressionChordIndex];
                if (Array.isArray(baseChordMidiData) && baseChordMidiData.length > 0) {
                     let actualMidisToDraw = (currentProgressionIteration % 2 !== 0) ? baseChordMidiData.map(m => m - 12) : baseChordMidiData;
                     drawElementOnStaff({ type: actualMidisToDraw.length === 1 ? 'note' : 'chord', midis: actualMidisToDraw });
                }
                currentProgressionChordIndex++; timeSinceLastProgElementSpawn -= intervalBetweenProgElementsMs;
                if (currentProgressionChordIndex >= currentProgressionData.chords.length) {
                     currentProgressionChordIndex = 0; currentProgressionIteration++;
                     console.log(`Progressione: Ciclo ${currentProgressionIteration}`);
                     timeSinceLastProgElementSpawn -= intervalBetweenProgElementsMs; // Pausa
                     break;
                }
            }
        } else if (activeMode === 'scale' && currentScaleMIDIs.length > 0) {
            // Logica spawn scale (MODIFICATA)
            const scaleMode = scaleModeSelect.value;
            timeSinceLastScaleNoteSpawn += deltaTime;

            while (timeSinceLastScaleNoteSpawn >= intervalBetweenScaleNotesMs) {
                let actualMidiToDraw;
                const baseMidiNote = currentScaleMIDIs[currentScaleNoteIndex];

                if (scaleMode === 'alternating') {
                    // Modalità Alternating Octaves (come V9/V10)
                    actualMidiToDraw = (currentScaleIteration % 2 !== 0) ? baseMidiNote - 12 : baseMidiNote;
                } else { // scaleMode === 'ascending-descending'
                    // Modalità Ascendente/Discendente
                    actualMidiToDraw = baseMidiNote + currentScaleOctaveOffset * 12;
                }

                // Disegna la nota calcolata
                drawElementOnStaff({ type: 'note', midis: [actualMidiToDraw] });
                timeSinceLastScaleNoteSpawn -= intervalBetweenScaleNotesMs;

                // Aggiorna indice, direzione, ottava in base alla modalità
                if (scaleMode === 'alternating') {
                    currentScaleNoteIndex++;
                    if (currentScaleNoteIndex >= currentScaleMIDIs.length) {
                        currentScaleNoteIndex = 0;
                        currentScaleIteration++;
                        console.log(`Scala (Alt): Ciclo ${currentScaleIteration}`);
                        timeSinceLastScaleNoteSpawn -= intervalBetweenScaleNotesMs; // Pausa
                    }
                } else { // scaleMode === 'ascending-descending'
                    if (currentScaleDirection === 'ascending') {
                        currentScaleNoteIndex++;
                        // Controlla se abbiamo raggiunto la fine della scala (l'ottava)
                        if (currentScaleNoteIndex >= currentScaleMIDIs.length) {
                            if (currentScaleOctaveOffset < ASC_DESC_MAX_OCTAVE_OFFSET) {
                                // Sali di ottava e ricomincia (dalla seconda nota)
                                currentScaleOctaveOffset++;
                                currentScaleNoteIndex = 1; // Salta la fondamentale ripetuta
                                console.log(`Scala (Asc): Salito a Ottava Offset ${currentScaleOctaveOffset}`);
                            } else {
                                // Raggiunto massimo, inverti direzione (parti dalla penultima)
                                currentScaleDirection = 'descending';
                                currentScaleNoteIndex = currentScaleMIDIs.length - 2;
                                console.log(`Scala (Asc): Raggiunto Max Ottava, Inverti -> Desc`);
                            }
                        }
                    } else { // direction === 'descending'
                        currentScaleNoteIndex--;
                        // Controlla se abbiamo raggiunto l'inizio della scala (la fondamentale)
                        if (currentScaleNoteIndex < 0) {
                             if (currentScaleOctaveOffset > ASC_DESC_MIN_OCTAVE_OFFSET) {
                                 // Scendi di ottava e ricomincia (dalla penultima)
                                 currentScaleOctaveOffset--;
                                 currentScaleNoteIndex = currentScaleMIDIs.length - 2;
                                 console.log(`Scala (Desc): Sceso a Ottava Offset ${currentScaleOctaveOffset}`);
                             } else {
                                 // Raggiunto minimo, inverti direzione (parti dalla seconda nota)
                                 currentScaleDirection = 'ascending';
                                 currentScaleNoteIndex = 1;
                                 console.log(`Scala (Desc): Raggiunto Min Ottava, Inverti -> Asc`);
                             }
                        }
                    }
                }
            } // fine while spawn note
        }

        // --- Muovi Elementi & Rimuovi (Invariato) ---
        const elementsToRemoveIndexes = []; const moveDist = pixelsPerSecond * (deltaTime / 1000);
        activeDisplayElements.forEach((elData, index) => {
            elData.xPos -= moveDist; if(elData.element) elData.element.setAttribute('transform', `translate(${elData.xPos}, 0)`);
            if (elData.xPos < NOTE_END_X) elementsToRemoveIndexes.push(index);
        });
        for (let i=elementsToRemoveIndexes.length-1; i>=0; i--) { const idx=elementsToRemoveIndexes[i]; const el=activeDisplayElements[idx]; if(el.element?.parentNode===notesArea) notesArea.removeChild(el.element); activeDisplayElements.splice(idx,1); }

        animationFrameId = requestAnimationFrame(animationLoop);
    }


    // --- Gestione MIDI & Scoring (Invariato da V8) ---
    function handleMIDIMessage(message) { /* ... da V8 ... */
        const [command, note, velocity] = message.data;
        const keyElement = document.querySelector(`.key[data-midi="${note}"]`);

        if (command === 144 && velocity > 0) {
            if (keyElement) keyElement.classList.add('playing');
            if (activeMode !== 'none') {
                const playedNote = note;
                const targetInfoImmediate = findNextTargetElement();
                if (targetInfoImmediate) {
                    const targetElement = targetInfoImmediate.elementData.element;
                    try {
                        const expectedMidisImmediate = JSON.parse(targetElement?.dataset.midis || '[]');
                        if (expectedMidisImmediate.includes(playedNote)) {
                            const noteHeadElement = targetElement?.querySelector(`.note-head[data-midi="${playedNote}"]`);
                            if (noteHeadElement && !noteHeadElement.classList.contains('correct-single')) { noteHeadElement.classList.add('correct-single'); }
                        }
                    } catch(e) { console.error("Err parsing midis in feedback:", e); }
                }
                if (activeMode === 'scale') { checkScaleNoteHit(playedNote); }
                else if (activeMode === 'progression') {
                    if (!noteInputBuffer.includes(playedNote)) noteInputBuffer.push(playedNote);
                    if (chordTimerId) clearTimeout(chordTimerId);
                    chordTimerId = setTimeout(processProgressionBufferForScoring, CHORD_WINDOW_MS);
                }
            }
        }
        else if (command === 128 || (command === 144 && velocity === 0)) { if (keyElement) keyElement.classList.remove('playing'); }
    }
    function checkScaleNoteHit(playedNote) { /* ... da V8 ... */
        const targetInfo = findNextTargetElement('note');
        if (targetInfo) {
            const targetElementData = targetInfo.elementData;
            const expectedNote = targetElementData.midis[0];
            if (playedNote === expectedNote) {
                correctCount++; correctCountSpan.textContent = correctCount;
                if (targetElementData.element) { targetElementData.element.classList.add('correct'); setTimeout(() => { if(targetElementData.element?.parentNode === notesArea) notesArea.removeChild(targetElementData.element); const cI=activeDisplayElements.findIndex(e=>e.id===targetElementData.id); if(cI>-1) activeDisplayElements.splice(cI,1); }, 300); }
                else { const cI=activeDisplayElements.findIndex(e=>e.id===targetElementData.id); if(cI>-1) activeDisplayElements.splice(cI,1); }
            } else {
                console.log(`SCALA: SBAGLIATO. Atteso: [${expectedNote}] Suonato: [${playedNote}]`);
                if (targetElementData.element) { targetElementData.element.classList.add('incorrect'); setTimeout(()=>targetElementData.element?.classList.remove('incorrect'), 300); targetElementData.element?.querySelectorAll('.note-head.correct-single').forEach(nh => nh.classList.remove('correct-single')); }
            }
        }
    }
    function processProgressionBufferForScoring() { /* ... da V8 ... */
        chordTimerId = null; if (noteInputBuffer.length === 0 || activeMode !== 'progression') { noteInputBuffer = []; return; }
        const played = [...noteInputBuffer].sort((a, b) => a - b); noteInputBuffer = [];
        const targetInfo = findNextTargetElement();
        if (targetInfo) {
            const targetElementData = targetInfo.elementData; const expected = targetElementData.midis;
            let match = played.length === expected.length && played.every((v, i) => v === expected[i]);
            if (match) {
                correctCount++; correctCountSpan.textContent = correctCount;
                if (targetElementData.element) { targetElementData.element.classList.add('correct'); setTimeout(() => { if(targetElementData.element?.parentNode === notesArea) notesArea.removeChild(targetElementData.element); const cI=activeDisplayElements.findIndex(e=>e.id===targetElementData.id); if(cI>-1) activeDisplayElements.splice(cI,1); }, 300); }
                else { const cI=activeDisplayElements.findIndex(e=>e.id===targetElementData.id); if(cI>-1) activeDisplayElements.splice(cI,1); }
            } else {
                console.log(`PROGRESSIONE: SBAGLIATO. Atteso: [${expected.join(',')}] Suonato: [${played.join(',')}]`);
                if (targetElementData.element) { targetElementData.element.classList.add('incorrect'); setTimeout(()=>targetElementData.element?.classList.remove('incorrect'), 300); targetElementData.element?.querySelectorAll('.note-head.correct-single').forEach(nh => nh.classList.remove('correct-single')); }
            }
        }
    }


    // --- Inizializzazione ---
    updateTempoAndSpeed(); populateProgressionSelect(); populateScaleSelect(); populateTonicSelect();
    setupMIDI(); setupPianoKeys(); setControlsState('none');

    // --- Event Listeners ---
    tempoSlider.addEventListener('input', updateTempoAndSpeed);
    midiInputSelect.addEventListener('change', (e) => selectMIDIInput(e.target.value));
    progressionSelect.addEventListener('change', () => setControlsState(activeMode)); // Aggiorna stato bottoni se cambia selezione
    startProgressionBtn.addEventListener('click', startProgression);
    stopProgressionBtn.addEventListener('click', stopCurrentMode);
    scaleSelect.addEventListener('change', () => setControlsState(activeMode));
    scaleTonicSelect.addEventListener('change', () => setControlsState(activeMode));
    scaleModeSelect.addEventListener('change', () => { /* Non serve azione immediata, letto nel loop */}); // NUOVO
    startScaleBtn.addEventListener('click', startScale);
    stopScaleBtn.addEventListener('click', stopCurrentMode);

    console.log("Piano Tutor V11 (Asc/Desc Scales) Inizializzato.");
});