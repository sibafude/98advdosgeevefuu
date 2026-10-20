    // --- 開発用シーンジャンプ ---
    window.jumpToScene = function() {
        const select = document.getElementById('dev-scene-select');
        const sceneId = select.value;
        
        titleState.active = false;
        openingState.active = false;
        transitionState.active = false;
        state.uiVisible = true;
        state.showLog = false;
        stateBackup = null;
        state.flags = {}; 
        
        if (customBgmAudio) customBgmAudio.pause();
        currentBgmKey = "stop";
        isBgmPlaying = false;

        loadScene(sceneId);
        
        document.getElementById('dev-tools').style.display = 'none';
    };

    window.onload = () => {
        loadScene("tap_to_start"); 
        loop();
    };
