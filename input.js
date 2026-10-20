    /* =========================================
       入力処理
       ========================================= */
    let hasInteracted = false;
    let isDraggingLog = false;
    let logStartY = 0;
    let logLastY = 0;
    let logVelocityY = 0;
    let logDragDist = 0;
    let isPointerDown = false; 
    let activeBtnAction = null; 
    let activeBtnTarget = null;
    let activeButtonType = null; 

    function getPointerPos(e) {
        const rect = canvas.getBoundingClientRect();
        let clientX = e.clientX;
        let clientY = e.clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        const scaleX = rect.width / WIDTH;
        const scaleY = rect.height / HEIGHT;
        const scale = Math.min(scaleX, scaleY);
        
        const displayWidth = WIDTH * scale;
        const displayHeight = HEIGHT * scale;
        
        const offsetX = rect.left + (rect.width - displayWidth) / 2;
        const offsetY = rect.top + (rect.height - displayHeight) / 2;

        return {
            x: (clientX - offsetX) / scale,
            y: (clientY - offsetY) / scale
        };
    }

    canvas.addEventListener('pointerdown', (e) => {
        isPointerDown = true;
        activeBtnAction = null;
        activeBtnTarget = null;
        activeButtonType = null;

        if (transitionState.active) return;
        
        if (state.sceneId === "tap_to_start") {
            if (!hasInteracted) hasInteracted = true;
            if (!audioCtx) audioCtx = new AudioContext();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            
            state.sceneId = "dummy_start";
            showTitle("ACT 1", "予兆", "start", "jingle");
            return;
        }

        if (titleState.active) {
            if (titleState.timer < 4000) {
                titleState.timer = 4000;
            } else {
                titleState.timer = 8000;
            }
            return;
        }

        if (openingState.active) {
            const isLastImage = openingState.currentIndex === openingState.images.length - 1;
            if (isLastImage) {
                if (openingState.phase === 0 || openingState.phase === 1) {
                    openingState.timerInWait = openingState.timer;
                    openingState.phase = 2;
                    openingState.alpha = 1;
                    openingState.timer = 0;
                }
            } else {
                // 途中なら即座に次の画像へ
                openingState.currentIndex++;
                openingState.phase = 0;
                openingState.alpha = 0;
                openingState.timer = 0;
            }
            return;
        }
        
        if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'button') return;

        if (!hasInteracted) {
            hasInteracted = true;
        }
        startBGM();

        const pos = getPointerPos(e);

        if (state.showLog) {
            isDraggingLog = true;
            logStartY = pos.y;
            logLastY = pos.y;
            logVelocityY = 0;
            logDragDist = 0;
            return;
        }

        if (state.uiVisible) {
            const sysBtn = LAYOUT.sysBtn;
            if (pos.x >= sysBtn.x && pos.x <= sysBtn.x + sysBtn.w && pos.y >= sysBtn.y && pos.y <= sysBtn.y + sysBtn.h) {
                state.sysBtnActive = true;
                activeButtonType = 'sys';
                return; 
            }
            const logBtn = LAYOUT.logBtn;
            if (pos.x >= logBtn.x && pos.x <= logBtn.x + logBtn.w && pos.y >= logBtn.y && pos.y <= logBtn.y + logBtn.h) {
                state.logBtnActive = true;
                activeButtonType = 'log';
                return;
            }
            if (state.showCommands) {
                for (let i = 0; i < state.buttons.length; i++) {
                    const btn = state.buttons[i];
                    if (pos.x >= btn.x && pos.x <= btn.x + btn.w && pos.y >= btn.y && pos.y <= btn.y + btn.h) {
                        state.activeButtonIndex = i;
                        activeButtonType = 'cmd';
                        activeBtnAction = btn.action;
                        activeBtnTarget = btn.target;
                        return;
                    }
                }
            }
        }
    });

    canvas.addEventListener('pointermove', (e) => {
        if (!isPointerDown) return;
        if (transitionState.active) return;

        const pos = getPointerPos(e);

        if (state.showLog && isDraggingLog) {
            const deltaY = pos.y - logLastY;
            logDragDist += Math.abs(deltaY);
            logVelocityY = deltaY;
            state.logScrollY += deltaY;
            logLastY = pos.y;
            return;
        }

        if (activeButtonType === 'sys') {
            const sysBtn = LAYOUT.sysBtn;
            if (pos.x < sysBtn.x || pos.x > sysBtn.x + sysBtn.w || pos.y < sysBtn.y || pos.y > sysBtn.y + sysBtn.h) {
                state.sysBtnActive = false;
                activeButtonType = null;
            }
        }

        if (activeButtonType === 'log') {
            const logBtn = LAYOUT.logBtn;
            if (pos.x < logBtn.x || pos.x > logBtn.x + logBtn.w || pos.y < logBtn.y || pos.y > logBtn.y + logBtn.h) {
                state.logBtnActive = false;
                activeButtonType = null;
            }
        }

        if (activeButtonType === 'cmd' && state.activeButtonIndex !== -1) {
            const btn = state.buttons[state.activeButtonIndex];
            if (pos.x < btn.x || pos.x > btn.x + btn.w || pos.y < btn.y || pos.y > btn.y + btn.h) {
                state.activeButtonIndex = -1;
                activeButtonType = null;
            }
        }
    });

    canvas.addEventListener('pointerup', (e) => {
        isPointerDown = false;
        
        if (transitionState.active) return;
        if (titleState.active) return;
        if (openingState.active) return;

        const pos = getPointerPos(e);

        if (state.showLog) {
            isDraggingLog = false;
            if (logDragDist < 10) { 
                state.showLog = false;
                playSound('cancel');
            }
            return;
        }

        if (!state.uiVisible) {
            state.uiVisible = true;
            return;
        }

        if (activeButtonType === 'sys') {
            state.sysBtnActive = false;
            playSound('select');
            if (state.sceneId === "system_menu" || state.sceneId.startsWith("sys_")) {
                if (state.pendingLoadSceneId) {
                    let id = state.pendingLoadSceneId;
                    let bgm = state.pendingLoadBgmKey;
                    state.pendingLoadSceneId = null;
                    state.pendingLoadBgmKey = null;
                    stateBackup = null;
                    
                    if (bgm && bgm !== currentBgmKey) {
                        if (customBgmAudio) customBgmAudio.pause();
                        currentBgmKey = bgm;
                        if (bgm !== "stop") {
                            customBgmAudio = bgmAudios[currentBgmKey];
                            if (customBgmAudio) {
                                customBgmAudio.currentTime = 0;
                                if (state.bgmEnabled && hasInteracted) customBgmAudio.play().catch(e=>{});
                            }
                        }
                    }
                    loadScene(id);
                } else {
                    closeSystemMenu();
                }
            } else {
                openSystemMenu("system_menu");
            }
            activeButtonType = null;
            return; 
        }

        if (activeButtonType === 'log') {
            state.logBtnActive = false;
            playSound('select');
            state.showLog = true;
            state.forceLogScrollBottom = true; 
            ctx.font = "24px 'ヒラギノ明朝 ProN', 'MS P明朝', serif";
            state.maxLogScroll = calculateMaxLogScroll();
            state.logScrollY = state.maxLogScroll; 
            logVelocityY = 0;
            activeButtonType = null;
            return; 
        }

        if (activeButtonType === 'cmd') {
            const action = activeBtnAction;
            const target = activeBtnTarget;
            state.activeButtonIndex = -1; 
            activeButtonType = null;
            
            playSound('select');

            if (target) {
                loadScene(target);
            } 
            else if (action === "toggle_dev") {
                const devTools = document.getElementById('dev-tools');
                devTools.style.display = (devTools.style.display === "none" || devTools.style.display === "") ? "block" : "none";
                closeSystemMenu(); 
            }
            else if (action === "hide_ui") {
                state.uiVisible = false;
                closeSystemMenu(); 
            }
            else if (action === "toggle_bgm") {
                state.bgmEnabled = !state.bgmEnabled;
                if (state.bgmEnabled) {
                    if (currentBgmKey !== "stop" && customBgmAudio) {
                        customBgmAudio.play().catch(e=>{});
                    }
                } else {
                    if (customBgmAudio) customBgmAudio.pause();
                }
                calculateButtons(scenario[state.sceneId].commands);
            }
            else if (action === "close_system") {
                if (state.pendingLoadSceneId) {
                    let id = state.pendingLoadSceneId;
                    let bgm = state.pendingLoadBgmKey;
                    state.pendingLoadSceneId = null;
                    state.pendingLoadBgmKey = null;
                    stateBackup = null;
                    
                    if (bgm && bgm !== currentBgmKey) {
                        if (customBgmAudio) customBgmAudio.pause();
                        currentBgmKey = bgm;
                        if (bgm !== "stop") {
                            customBgmAudio = bgmAudios[currentBgmKey];
                            if (customBgmAudio) {
                                customBgmAudio.currentTime = 0;
                                if (state.bgmEnabled && hasInteracted) customBgmAudio.play().catch(e=>{});
                            }
                        }
                    }
                    loadScene(id);
                } else {
                    closeSystemMenu(); 
                }
            }
            else if (action === "direct_load") {
                const savedStr = localStorage.getItem("seiran_save_data");
                let targetId = "start";
                let targetBgm = null;
                if(savedStr) {
                    try {
                        const saved = JSON.parse(savedStr);
                        if(scenario[saved.sceneId]) {
                            targetId = saved.sceneId;
                            targetBgm = saved.bgmKey;
                        }
                    } catch(e) {
                        if(scenario[savedStr]) targetId = savedStr;
                    }
                }
                
                if (!targetBgm) {
                    targetBgm = guessBgmForScene(targetId);
                }

                if (targetBgm && targetBgm !== currentBgmKey) {
                    if (customBgmAudio) customBgmAudio.pause();
                    currentBgmKey = targetBgm;
                    if (targetBgm !== "stop") {
                        customBgmAudio = bgmAudios[currentBgmKey];
                        if (customBgmAudio) {
                            customBgmAudio.currentTime = 0;
                            if (state.bgmEnabled && hasInteracted) customBgmAudio.play().catch(e=>{});
                        }
                    }
                }
                loadScene(targetId); 
            }
            else if (action === "back_to_start") {
                loadScene("tap_to_start");
            }
            else if (action === "open_save") {
                openSystemMenu("sys_save");
            }
            else if (action === "open_load") {
                openSystemMenu("sys_load");
            }
            return; 
        }

        if (state.showCommands) {
            if (pos.y < LAYOUT.window.y) {
                state.uiVisible = false;
            }
            return; 
        }

        if (state.isTyping) {
            state.displayedText = state.fullText;
            state.textIndex = state.fullText.length;
            state.isTyping = false;
        } 
        else if (state.currentPage < state.textPages.length - 1) {
            state.currentPage++;
            state.fullText = state.textPages[state.currentPage];
            if (state.log.length === 0 || state.log[state.log.length - 1] !== state.fullText) {
                state.log.push(state.fullText);
            }
            state.displayedText = "";
            state.textIndex = 0;
            state.isTyping = true;
            playSound('select');
        }
        else if (state.buttons.length > 0) {
            state.showCommands = true;
            playSound('select');
        }
        else if (scenario[state.sceneId].nextScene) {
            loadScene(scenario[state.sceneId].nextScene);
            playSound('select');
        }
    });

    canvas.addEventListener('pointerleave', () => {
        isPointerDown = false;
        state.sysBtnActive = false;
        state.logBtnActive = false;
        state.activeButtonIndex = -1;
        isDraggingLog = false;
        activeButtonType = null;
    });

