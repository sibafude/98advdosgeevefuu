    // --- シェイク（画面揺らし）機能 ---
    function startShake(duration = 500, intensity = 10) {
        state.shake.active = true;
        state.shake.timer = 0;
        state.shake.duration = duration;
        state.shake.intensity = intensity;
    }

    // --- 古いセーブデータ互換用：シーンのBGMを遡って推測する関数 ---
    function guessBgmForScene(targetId) {
        let lastBgm = "stop";
        for (let key in scenario) {
            if (scenario[key].bgm !== undefined) {
                lastBgm = scenario[key].bgm;
            }
            if (key === targetId) {
                return lastBgm;
            }
        }
        return lastBgm;
    }

    // --- タイトル文字演出ステータス ---
    let titleState = {
        active: false,
        phase: 0, 
        alpha: 0,
        timer: 0,
        text1: "",
        text2: "",
        nextScene: "",
        jingle: ""
    };

    function showTitle(t1, t2, next, jingleKey) {
        titleState.active = true;
        titleState.phase = 0;
        titleState.alpha = 0;
        titleState.timer = 0;
        titleState.text1 = t1;
        titleState.text2 = t2;
        titleState.nextScene = next;
        titleState.jingle = jingleKey;

        if (customBgmAudio) customBgmAudio.pause(); 
        
        if (jingleKey && bgmAudios[jingleKey] && state.bgmEnabled && hasInteracted) {
            bgmAudios[jingleKey].currentTime = 0;
            bgmAudios[jingleKey].volume = 0.5; 
            bgmAudios[jingleKey].play().catch(e=>{});
        }
    }

    // --- オープニング演出ステータス ---
    let openingState = {
        active: false,
        phase: 0, 
        alpha: 0,
        timer: 0,
        timerInWait: 0,
        images: [],
        currentIndex: 0,
        bgmKey: "",
        nextScene: ""
    };

    function showOpening(images, bgmKey, nextScene) {
        openingState.active = true;
        openingState.phase = 0;
        openingState.alpha = 0;
        openingState.timer = 0;
        openingState.timerInWait = 0;
        openingState.images = images;
        openingState.currentIndex = 0;
        openingState.bgmKey = bgmKey;
        openingState.nextScene = nextScene;

        if (customBgmAudio) customBgmAudio.pause(); 
        currentBgmKey = bgmKey;
        customBgmAudio = bgmAudios[bgmKey];
        if (customBgmAudio && state.bgmEnabled && hasInteracted) {
            customBgmAudio.currentTime = 0;
            customBgmAudio.volume = 0.5; 
            customBgmAudio.play().catch(e=>{});
        }
    }

    // --- シーン間トランジション（黒フェード）演出 ---
    let transitionState = {
        active: false,
        phase: 0,
        alpha: 0,
        timer: 0,
        nextScene: ""
    };

    function doFadeTransition(nextSceneId) {
        transitionState.active = true;
        transitionState.phase = 0;
        transitionState.alpha = 0;
        transitionState.timer = 0;
        transitionState.nextScene = nextSceneId;
        state.uiVisible = false; 
    }

    // --- ゲームステータス ---
    let state = {
        sceneId: "tap_to_start",
        previousSceneId: "tap_to_start",
        textPages: [],
        currentPage: 0,
        displayedText: "",
        fullText: "",
        textIndex: 0,
        isTyping: false,
        uiVisible: true,
        showCommands: false, 
        sysBtnActive: false,
        logBtnActive: false, 
        buttons: [],
        activeButtonIndex: -1,
        lastLineEndX: 0, 
        lastLineEndY: 0,
        flags: {}, 
        gameOverCount: 0, 
        pendingLoadSceneId: null,
        pendingLoadBgmKey: null, 
        bgmEnabled: true,
        log: [], 
        showLog: false, 
        logScrollY: 0, 
        maxLogScroll: 0,
        forceLogScrollBottom: false,
        shake: { active: false, timer: 0, duration: 0, intensity: 0, offsetX: 0, offsetY: 0 }
    };

    let stateBackup = null; 

    let lastFrameTime = Date.now();
    let textTimer = 0;
    const TEXT_SPEED = 30; 

