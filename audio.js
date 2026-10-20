    // --- BGM・効果音管理 ---
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioCtx = null;
    let isBgmPlaying = false;
    let defaultBgmInterval = null;
    let currentNote = 0;

    const bgmKeys = ["bgm", "bgm_tension", "bgm_night", "jingle", "bgm_op", "bgm_title", "bgm_search"];
    const bgmAudios = {};

    bgmKeys.forEach(key => {
        const audio = new Audio();
        audio.src = `assets/audio/${key}.mp3`;
        audio.loop = !key.startsWith("jingle"); 
        audio.volume = 0.5;
        let m4aTried = false;
        audio.onerror = () => {
            if (!m4aTried) {
                m4aTried = true;
                audio.src = `assets/audio/${key}.m4a`;
            }
        };
        bgmAudios[key] = audio;
    });

    let currentBgmKey = 'bgm';
    let customBgmAudio = bgmAudios['bgm'];

    document.getElementById('local-img-upload').addEventListener('change', (e) => {
        const files = e.target.files;
        for(let file of files) {
            let id = file.name.toLowerCase();
            const dotIndex = id.lastIndexOf('.');
            if (dotIndex > 0) id = id.substring(0, dotIndex);

            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => { imageCache[id] = img; };
                img.src = event.target.result; 
            };
            reader.readAsDataURL(file);
        }
    });

    document.getElementById('local-audio-upload').addEventListener('change', (e) => {
        const files = e.target.files;
        if (!files.length) return;
        stopBGM();
        
        for(let file of files) {
            let id = file.name.toLowerCase();
            const dotIndex = id.lastIndexOf('.');
            if (dotIndex > 0) id = id.substring(0, dotIndex);

            const reader = new FileReader();
            reader.onload = (event) => {
                const newAudio = new Audio(event.target.result);
                newAudio.loop = !id.startsWith("jingle");
                newAudio.volume = 0.5;
                bgmAudios[id] = newAudio; 
                
                if (currentBgmKey === id || (currentBgmKey === 'bgm' && id === 'bgm')) {
                    customBgmAudio = newAudio;
                    if (state.bgmEnabled && hasInteracted) {
                        customBgmAudio.currentTime = 0;
                        customBgmAudio.play().catch(err => console.log("再生待機"));
                    }
                }
            };
            reader.readAsDataURL(file);
        }
    });

    function startBGM() {
        if (!audioCtx) audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        if (!state.bgmEnabled) return;

        if (customBgmAudio && currentBgmKey !== "stop") {
            if (customBgmAudio.paused) customBgmAudio.play().catch(e => console.error(e));
            isBgmPlaying = true;
        } else if (!isBgmPlaying && currentBgmKey !== "stop") {
            isBgmPlaying = true;
            playDefaultBGM();
        }
    }

    function stopBGM() {
        isBgmPlaying = false;
        if (customBgmAudio) {
            customBgmAudio.pause();
            customBgmAudio.currentTime = 0;
        }
        if (defaultBgmInterval) {
            clearInterval(defaultBgmInterval);
            defaultBgmInterval = null;
        }
    }

    function playDefaultBGM() {
        if (!audioCtx) return;
        const notesNormal = [220, 261.63, 329.63, 261.63, 220, 164.81]; 
        const notesTension = [110, 116.54, 123.47]; 
        
        defaultBgmInterval = setInterval(() => {
            if (!isBgmPlaying || customBgmAudio.readyState >= 2) return; 
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = currentBgmKey === 'bgm_tension' ? 'sawtooth' : 'triangle';
            const notes = currentBgmKey === 'bgm_tension' ? notesTension : notesNormal;
            
            osc.frequency.value = notes[currentNote % notes.length];
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.25);
            currentNote++;
        }, currentBgmKey === 'bgm_tension' ? 200 : 300);
    }

    function playSound(type) {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'select') {
            osc.type = 'sine'; 
            osc.frequency.setValueAtTime(800, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.05);
            gain.gain.setValueAtTime(0.02, audioCtx.currentTime); 
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.05);
        } else if (type === 'cancel') {
            osc.type = 'triangle'; 
            osc.frequency.setValueAtTime(300, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.02, audioCtx.currentTime); 
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
        }
    }

