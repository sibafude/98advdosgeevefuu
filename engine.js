
    /* =========================================
       ゲームロジック＆描画
       ========================================= */

    function calculateMaxLogScroll() {
        const padX = 30;
        const maxWidth = WIDTH - padX * 2;
        const lineHeight = 36;
        let contentHeight = 50; 
        for (let i = 0; i < state.log.length; i++) {
            const text = state.log[i];
            if (!text) continue;
            const lines = text.split('\n');
            for (let j = 0; j < lines.length; j++) {
                let line = "";
                const words = lines[j].split('');
                for (let k = 0; k < words.length; k++) {
                    const testLine = line + words[k];
                    const metrics = ctx.measureText(testLine);
                    if (metrics.width > maxWidth && k > 0) {
                        line = words[k];
                        contentHeight += lineHeight;
                    } else {
                        line = testLine;
                    }
                }
                contentHeight += lineHeight;
            }
            contentHeight += lineHeight / 2; 
        }
        return Math.min(0, HEIGHT - contentHeight - 80); 
    }

    function loadScene(sceneId) {
        if(!scenario[sceneId]) return;
        state.sceneId = sceneId;
        const scene = scenario[sceneId];
        
        if (scene.bgm !== undefined) {
            if (scene.bgm === "stop") {
                if (customBgmAudio) customBgmAudio.pause();
                currentBgmKey = "stop";
            } else if (currentBgmKey !== scene.bgm) {
                if (customBgmAudio) customBgmAudio.pause();
                currentBgmKey = scene.bgm;
                customBgmAudio = bgmAudios[currentBgmKey];
                if (customBgmAudio) customBgmAudio.currentTime = 0; 
                if (state.bgmEnabled && hasInteracted && customBgmAudio) {
                    customBgmAudio.play().catch(e=>{});
                }
            }
        }

        const expectedSceneId = sceneId;
        if (scene.onLoad) scene.onLoad();
        
        if (state.sceneId !== expectedSceneId) return; 

        state.textPages = scene.text || [];
        
        if (state.textPages.length === 0 || (state.textPages.length === 1 && state.textPages[0] === "")) {
            state.showCommands = true;
            state.displayedText = "";
            state.fullText = "";
            state.isTyping = false;
        } else {
            state.showCommands = false;
            state.currentPage = 0;
            state.fullText = state.textPages[0];
            state.displayedText = "";
            state.textIndex = 0;
            state.isTyping = true;
        }

        if (state.textPages.length > 0 && state.textPages[0] !== "") {
            if (state.log.length === 0 || state.log[state.log.length - 1] !== state.textPages[0]) {
                state.log.push(state.textPages[0]);
            }
        }
        
        textTimer = 0;
        calculateButtons(scene.commands);
    }

    function openSystemMenu(targetSceneId = "system_menu") {
        if (!state.sceneId.startsWith("sys_") && state.sceneId !== "system_menu") {
            state.previousSceneId = state.sceneId;
        }
        stateBackup = {
            sceneId: state.sceneId,
            textPages: state.textPages,
            currentPage: state.currentPage,
            displayedText: state.displayedText,
            fullText: state.fullText,
            textIndex: state.textIndex,
            isTyping: state.isTyping,
            showCommands: state.showCommands,
            buttons: state.buttons,
            lastLineEndX: state.lastLineEndX,
            lastLineEndY: state.lastLineEndY
        };
        loadScene(targetSceneId);
    }

    function closeSystemMenu() {
        if (stateBackup) {
            state.sceneId = stateBackup.sceneId;
            state.textPages = stateBackup.textPages;
            state.currentPage = stateBackup.currentPage;
            state.displayedText = stateBackup.displayedText;
            state.fullText = stateBackup.fullText;
            state.textIndex = stateBackup.textIndex;
            state.isTyping = stateBackup.isTyping;
            state.showCommands = stateBackup.showCommands;
            state.buttons = stateBackup.buttons;
            state.lastLineEndX = stateBackup.lastLineEndX;
            state.lastLineEndY = stateBackup.lastLineEndY;
            stateBackup = null;
        } else {
            loadScene(state.previousSceneId);
        }
    }

    function calculateButtons(commands) {
        state.buttons = [];
        if(!commands || commands.length === 0) return;
        
        const validCommands = commands.filter(cmd => !cmd.condition || cmd.condition());
        if(validCommands.length === 0) return;
        
        const cols = validCommands.length > 4 ? 3 : (validCommands.length > 1 ? 2 : 1);
        const rows = Math.ceil(validCommands.length / cols); 
        
        const padX = cols === 1 ? 120 : 60; 
        const gapX = 20;
        const gapY = 20; 
        
        const win = LAYOUT.window;
        
        const btnW = (win.w - (padX * 2) - (gapX * (cols - 1))) / cols;
        const btnH = 50; 
        
        const startX = win.x + padX;
        const totalH = (btnH * rows) + (gapY * (rows - 1));
        const startY = win.y + (win.h - totalH) / 2;

        validCommands.forEach((cmd, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const btnLabel = typeof cmd.label === 'function' ? cmd.label() : cmd.label;
            
            state.buttons.push({
                x: startX + col * (btnW + gapX),
                y: startY + row * (btnH + gapY),
                w: btnW,
                h: btnH,
                label: btnLabel,
                target: cmd.target,
                action: cmd.action
            });
        });
    }

    function drawBackground(img, targetX, targetY, targetW, targetH, panType = "none", panProgress = 0) {
        if (panType === "contain") {
            const imgRatio = img.width / img.height;
            const targetRatio = targetW / targetH;
            let drawW = targetW;
            let drawH = targetH;
            let dX = targetX;
            let dY = targetY;

            if (imgRatio > targetRatio) {
                drawH = targetW / imgRatio;
                dY = targetY + (targetH - drawH) / 2;
            } else {
                drawW = targetH * imgRatio;
                dX = targetX + (targetW - drawW) / 2;
            }
            ctx.drawImage(img, dX, dY, drawW, drawH);
            return;
        }

        let scaleMulti = 1.0;
        if (panType === "up" || panType === "down") {
            scaleMulti = 1.2; 
        }

        const imgRatio = img.width / img.height;
        const targetRatio = targetW / targetH;
        
        let drawW = targetW * scaleMulti;
        let drawH = targetH * scaleMulti;
        
        let sWidth = img.width;
        let sHeight = img.height;
        let sX = 0;
        let sY = 0;

        if (imgRatio > targetRatio) {
            sWidth = img.height * targetRatio;
            sX = (img.width - sWidth) / 2;
        } else {
            sHeight = img.width / targetRatio;
            sY = (img.height - sHeight) / 2;
        }

        let dX = targetX - (drawW - targetW) / 2; 
        let dY = targetY - (drawH - targetH) / 2; 

        if (panType === "up") {
            const maxOffset = drawH - targetH;
            dY = targetY - maxOffset * (1 - panProgress);
        } else if (panType === "down") {
            const maxOffset = drawH - targetH;
            dY = targetY - maxOffset * panProgress;
        }

        ctx.save();
        ctx.beginPath();
        ctx.rect(targetX, targetY, targetW, targetH);
        ctx.clip();
        
        ctx.drawImage(img, sX, sY, sWidth, sHeight, dX, dY, drawW, drawH);
        
        ctx.restore();
    }

    function drawCharacter(img) {
        let scale = 1.45; 
        let drawW = img.width * scale;
        let drawH = img.height * scale;
        
        if (drawW > WIDTH * 1.1) {
            scale = (WIDTH * 1.1) / img.width;
            drawW = img.width * scale;
            drawH = img.height * scale;
        }
        
        const drawX = 0; 
        const drawY = HEIGHT - drawH; 
        
        ctx.drawImage(img, 0, 0, img.width, img.height, drawX, drawY, drawW, drawH);
    }

    function drawTextAndGetEndPosition(text, x, y, maxWidth, lineHeight) {
        const lines = text.split('\n');
        let currentY = y;
        let lastLineText = "";

        for (let i = 0; i < lines.length; i++) {
            let line = "";
            const words = lines[i].split('');
            for (let j = 0; j < words.length; j++) {
                const testLine = line + words[j];
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && j > 0) {
                    ctx.fillText(line, x, currentY);
                    line = words[j];
                    currentY += lineHeight;
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line, x, currentY);
            lastLineText = line;
            if (i < lines.length - 1) {
                currentY += lineHeight;
            }
        }
        
        const lastLineMetrics = ctx.measureText(lastLineText);
        state.lastLineEndX = x + lastLineMetrics.width;
        state.lastLineEndY = currentY;
    }

    function draw() {
        ctx.save();
        
        // 画面シェイクの適用
        if (state.shake && state.shake.active) {
            ctx.translate(state.shake.offsetX, state.shake.offsetY);
        }

        // 揺れ幅の分も塗りつぶすため、少し広めに黒クリア
        ctx.fillStyle = "#000";
        ctx.fillRect(-50, -50, WIDTH + 100, HEIGHT + 100);

        if (state.sceneId === "tap_to_start") {
            ctx.fillStyle = (Date.now() % 1000 < 500) ? "#fff" : "transparent";
            ctx.font = "bold 30px 'ヒラギノ明朝 ProN', 'MS P明朝', serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("TAP TO START", WIDTH / 2, HEIGHT / 2);
            ctx.textBaseline = "alphabetic";
            ctx.restore();
            return;
        }

        if (titleState.active) {
            ctx.fillStyle = `rgba(255, 255, 255, ${titleState.alpha})`;
            ctx.font = "bold 50px 'ヒラギノ明朝 ProN', 'MS P明朝', serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(titleState.text1, WIDTH / 2, HEIGHT / 2 - 40);
            ctx.font = "bold 60px 'ヒラギノ明朝 ProN', 'MS P明朝', serif";
            ctx.fillText(titleState.text2, WIDTH / 2, HEIGHT / 2 + 50);
            ctx.textBaseline = "alphabetic";
            ctx.restore();
            return; 
        }

        if (openingState.active) {
            const config = openingState.images[openingState.currentIndex];

            if (openingState.currentIndex > 0 && openingState.phase === 0) {
                const prevConfig = openingState.images[openingState.currentIndex - 1];
                if (prevConfig.out === 0 && imageCache[prevConfig.id] && imageCache[prevConfig.id].complete) {
                    ctx.globalAlpha = 1.0;
                    drawBackground(imageCache[prevConfig.id], 0, 0, WIDTH, HEIGHT, prevConfig.pan, 1.0);
                }
            }

            if (imageCache[config.id] && imageCache[config.id].complete) {
                ctx.globalAlpha = openingState.alpha;
                
                let panProgress = 0;
                if (config.pan !== "none" && config.pan !== "contain") {
                    let elapsed = 0;
                    const waitTime = config.wait === Infinity ? 10000 : config.wait;
                    if (openingState.phase === 0) elapsed = openingState.timer;
                    if (openingState.phase === 1) elapsed = config.in + openingState.timer;
                    if (openingState.phase === 2) {
                        const currentWait = openingState.timerInWait || waitTime; 
                        elapsed = config.in + currentWait + openingState.timer;
                    }
                    let duration = config.in + waitTime + config.out;
                    panProgress = Math.min(1.0, Math.max(0.0, elapsed / duration));
                }

                drawBackground(imageCache[config.id], 0, 0, WIDTH, HEIGHT, config.pan, panProgress);
                ctx.globalAlpha = 1.0;
            }
            ctx.restore();
            return;
        }

        let visualSceneId = state.sceneId;
        if (state.sceneId.startsWith("sys_") || state.sceneId === "system_menu") {
            visualSceneId = state.previousSceneId;
        }

        const visualScene = scenario[visualSceneId];
        const parentScene = scenario["start"]; 
        const bgId = visualScene.bgId || parentScene.bgId;

        if (bgId && imageCache[bgId] && imageCache[bgId].complete) {
            drawBackground(imageCache[bgId], 0, 0, WIDTH, HEIGHT);
        } else {
            ctx.fillStyle = "#1a1a2e";
            ctx.fillRect(0, 0, WIDTH, HEIGHT);
        }

        const isEventScene = (bgId === "ev_rescue" || bgId === "ev_kidnap" || bgId === "ev_medal" || bgId === "ev_flower_model" || bgId === "ev_memo" || bgId === "ev_diary" || bgId === "op_7");
        if (!isEventScene && visualScene.charId && imageCache[visualScene.charId] && imageCache[visualScene.charId].complete) {
            drawCharacter(imageCache[visualScene.charId]);
        }

        if (state.uiVisible) {
            const uiImg = imageCache["ui_panel"];
            const win = LAYOUT.window;
            
            if (uiImg && uiImg.complete) {
                ctx.drawImage(uiImg, win.x, win.y, win.w, win.h);
            } else {
                ctx.fillStyle = "rgba(0, 0, 40, 0.9)";
                ctx.fillRect(win.x, win.y, win.w, win.h);
                ctx.strokeStyle = "rgba(220, 220, 220, 0.8)";
                ctx.lineWidth = 4;
                ctx.strokeRect(win.x, win.y, win.w, win.h);
            }

            if (state.sceneId === "system_menu" || state.sceneId.startsWith("sys_")) {
                ctx.fillStyle = "#888";
                ctx.font = "bold 16px sans-serif";
                ctx.textAlign = "left"; 
                ctx.textBaseline = "middle";
                ctx.fillText(GAME_VERSION, win.x + 555, win.y + 40); 
                ctx.textBaseline = "alphabetic"; 
            }

            const sysBtn = LAYOUT.sysBtn;
            ctx.fillStyle = state.sysBtnActive ? "#ffeb3b" : "#ccc";
            ctx.font = "bold 22px 'ヒラギノ明朝 ProN', 'MS P明朝', serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.shadowColor = "#000";
            ctx.shadowBlur = 4;
            ctx.fillText("システム", sysBtn.x + sysBtn.w / 2, sysBtn.y + sysBtn.h / 2);
            ctx.shadowBlur = 0;
            ctx.textBaseline = "alphabetic";

            const logBtn = LAYOUT.logBtn;
            ctx.fillStyle = state.logBtnActive ? "#ffeb3b" : "#ccc";
            ctx.font = "bold 22px 'ヒラギノ明朝 ProN', 'MS P明朝', serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.shadowColor = "#000";
            ctx.shadowBlur = 4;
            ctx.fillText("ログ", logBtn.x + logBtn.w / 2, logBtn.y + logBtn.h / 2);
            ctx.shadowBlur = 0;
            ctx.textBaseline = "alphabetic";

            if (!state.showCommands) {
                ctx.fillStyle = "#fff";
                ctx.font = "26px 'ヒラギノ明朝 ProN', 'MS P明朝', serif"; 
                
                if (state.sceneId === "game_over" || state.sceneId.includes("tobecontinued")) {
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.shadowColor = "#000";
                    ctx.shadowBlur = 4;
                    ctx.fillText(state.displayedText, win.x + win.w / 2, win.y + win.h / 2);
                    ctx.shadowBlur = 0;
                    if (!state.isTyping) {
                        ctx.fillStyle = (Date.now() % 1000 < 500) ? "#fff" : "transparent";
                        ctx.fillText("▼", win.x + win.w / 2, win.y + win.h / 2 + 40);
                    }
                    ctx.textBaseline = "alphabetic";
                } else {
                    ctx.textAlign = "left";
                    ctx.shadowColor = "#000";
                    ctx.shadowBlur = 4;

                    const textPadX = 40; 
                    const textPadY = 55; 
                    const lineHeight = 42; 
                    
                    drawTextAndGetEndPosition(state.displayedText, win.x + textPadX, win.y + textPadY, win.w - (textPadX * 2), lineHeight);
                    ctx.shadowBlur = 0;

                    if (!state.isTyping) {
                        ctx.fillStyle = (Date.now() % 1000 < 500) ? "#fff" : "transparent";
                        ctx.font = "26px 'ヒラギノ明朝 ProN', 'MS P明朝', serif";
                        ctx.fillText("▼", state.lastLineEndX + 5, state.lastLineEndY);
                    }
                }
            } else {
                state.buttons.forEach((btn, idx) => {
                    const isPressed = (state.activeButtonIndex === idx);
                    
                    ctx.fillStyle = isPressed ? "#ffeb3b" : "#fff"; 
                    ctx.font = "26px 'ヒラギノ明朝 ProN', 'MS P明朝', serif";
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";
                    ctx.shadowColor = "#000";
                    ctx.shadowBlur = 4;
                    
                    ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
                    
                    ctx.shadowBlur = 0;
                    ctx.textBaseline = "alphabetic";
                });
            }
        }

        // トランジション（黒フェード）の描画
        if (transitionState.active) {
            ctx.fillStyle = `rgba(0, 0, 0, ${transitionState.alpha})`;
            ctx.fillRect(-50, -50, WIDTH + 100, HEIGHT + 100);
        }

        // 4. ログ画面の描画（透過して上に重ねる）
        if (state.showLog) {
            if (state.logScrollY < state.maxLogScroll) state.logScrollY = state.maxLogScroll;
            if (state.logScrollY > 0) state.logScrollY = 0;

            ctx.fillStyle = "rgba(0, 0, 0, 0.6)"; 
            ctx.fillRect(-50, -50, WIDTH + 100, HEIGHT + 100);

            ctx.fillStyle = "#fff";
            ctx.font = "24px 'ヒラギノ明朝 ProN', 'MS P明朝', serif";
            ctx.textAlign = "left";
            ctx.textBaseline = "top";

            const padX = 30;
            const maxWidth = WIDTH - padX * 2;
            const lineHeight = 36;

            let currentY = 50 + state.logScrollY;
            for (let i = 0; i < state.log.length; i++) {
                const text = state.log[i];
                if (!text) continue;
                const lines = text.split('\n');
                for (let j = 0; j < lines.length; j++) {
                    let line = "";
                    const words = lines[j].split('');
                    for (let k = 0; k < words.length; k++) {
                        const testLine = line + words[k];
                        const metrics = ctx.measureText(testLine);
                        if (metrics.width > maxWidth && k > 0) {
                            if (currentY > -lineHeight && currentY < HEIGHT) {
                                ctx.fillText(line, padX, currentY);
                            }
                            line = words[k];
                            currentY += lineHeight;
                        } else {
                            line = testLine;
                        }
                    }
                    if (currentY > -lineHeight && currentY < HEIGHT) {
                        ctx.fillText(line, padX, currentY);
                    }
                    currentY += lineHeight;
                }
                currentY += lineHeight / 2;
            }
        }
        
        ctx.restore();
    }

    function update() {
        const now = Date.now();
        const dt = now - lastFrameTime;
        lastFrameTime = now;

        // シェイクの更新
        if (state.shake && state.shake.active) {
            state.shake.timer += dt;
            if (state.shake.timer >= state.shake.duration) {
                state.shake.active = false;
                state.shake.offsetX = 0;
                state.shake.offsetY = 0;
            } else {
                state.shake.offsetX = (Math.random() - 0.5) * 2 * state.shake.intensity;
                state.shake.offsetY = (Math.random() - 0.5) * 2 * state.shake.intensity;
            }
        }

        if (transitionState.active) {
            transitionState.timer += dt;
            if (transitionState.phase === 0) {
                transitionState.alpha += dt / 1000; 
                if (customBgmAudio && !customBgmAudio.paused && currentBgmKey !== "stop") {
                    let v = 0.5 * (1 - transitionState.alpha);
                    if (v < 0) v = 0;
                    customBgmAudio.volume = v;
                }
                if (transitionState.alpha >= 1) {
                    transitionState.alpha = 1;
                    transitionState.phase = 1;
                    transitionState.timer = 0;
                    if (customBgmAudio) customBgmAudio.pause();
                }
            } else if (transitionState.phase === 1) {
                if (transitionState.timer >= 500) {
                    transitionState.phase = 2;
                    transitionState.timer = 0;
                    loadScene(transitionState.nextScene);
                    state.uiVisible = true;
                }
            } else if (transitionState.phase === 2) {
                transitionState.alpha -= dt / 1000; 
                if (transitionState.alpha <= 0) {
                    transitionState.alpha = 0;
                    transitionState.active = false;
                }
            }
            return;
        }

        if (titleState.active) {
            titleState.timer += dt;
            
            if (titleState.phase === 0) { 
                titleState.alpha += dt / 1000;
                if (titleState.alpha >= 1) {
                    titleState.alpha = 1;
                    titleState.phase = 1;
                }
                if (titleState.timer >= 4000) { 
                    titleState.phase = 2;
                }
            } else if (titleState.phase === 1) { 
                if (titleState.timer >= 4000) { 
                    titleState.phase = 2;
                }
            } else if (titleState.phase === 2) { 
                titleState.alpha = 1 - ((titleState.timer - 4000) / 4000);
                
                if (titleState.jingle && bgmAudios[titleState.jingle]) {
                    const jingleAudio = bgmAudios[titleState.jingle];
                    if (!jingleAudio.paused) {
                        let newVolume = 0.5 * titleState.alpha; 
                        if (newVolume <= 0) {
                            newVolume = 0;
                            jingleAudio.pause();
                            jingleAudio.currentTime = 0;
                        } else {
                            jingleAudio.volume = newVolume;
                        }
                    }
                }

                if (titleState.timer >= 8000 || titleState.alpha <= 0) {
                    titleState.alpha = 0;
                    titleState.active = false;
                    state.uiVisible = true;
                    if (titleState.jingle && bgmAudios[titleState.jingle]) {
                        bgmAudios[titleState.jingle].pause();
                        bgmAudios[titleState.jingle].currentTime = 0;
                        bgmAudios[titleState.jingle].volume = 0.5;
                    }
                    loadScene(titleState.nextScene);
                }
            }
            return;
        }

        if (openingState.active) {
            openingState.timer += dt;
            const config = openingState.images[openingState.currentIndex];
            const isLastImage = openingState.currentIndex === openingState.images.length - 1;

            if (openingState.phase === 0) { 
                if (config.in > 0) {
                    openingState.alpha += dt / config.in;
                } else {
                    openingState.alpha = 1;
                }
                
                if (openingState.alpha >= 1) {
                    openingState.alpha = 1;
                    openingState.phase = 1;
                    openingState.timer = 0; 
                }
            } else if (openingState.phase === 1) { 
                if (isLastImage) {
                    // 最後の画像はタップ待機
                } else {
                    if (openingState.timer >= config.wait) { 
                        openingState.timerInWait = openingState.timer;
                        openingState.phase = 2;
                        openingState.timer = 0;
                    }
                }
            } else if (openingState.phase === 2) { 
                const fadeTime = isLastImage ? 2000 : config.out;
                
                if (fadeTime > 0) {
                    openingState.alpha -= dt / fadeTime;
                } else {
                    openingState.alpha = 0;
                }
                
                if (isLastImage && openingState.bgmKey && bgmAudios[openingState.bgmKey]) {
                    const audio = bgmAudios[openingState.bgmKey];
                    if (!audio.paused) {
                        let newVolume = 0.5 * openingState.alpha; 
                        if (newVolume <= 0) {
                            newVolume = 0;
                            audio.pause();
                            audio.currentTime = 0;
                        } else {
                            audio.volume = newVolume;
                        }
                    }
                }

                if (openingState.alpha <= 0) {
                    openingState.alpha = 0;
                    openingState.currentIndex++;
                    
                    if (openingState.currentIndex >= openingState.images.length) {
                        openingState.active = false;
                        state.uiVisible = true;
                        if (openingState.bgmKey && bgmAudios[openingState.bgmKey]) {
                            bgmAudios[openingState.bgmKey].pause();
                            bgmAudios[openingState.bgmKey].currentTime = 0;
                            bgmAudios[openingState.bgmKey].volume = 0.5;
                        }
                        loadScene(openingState.nextScene);
                    } else {
                        openingState.phase = 0;
                        openingState.timer = 0;
                    }
                }
            }
            return;
        }

        if (state.showLog) {
            if (!isDraggingLog) {
                if (Math.abs(logVelocityY) > 0.1) {
                    state.logScrollY += logVelocityY;
                    logVelocityY *= 0.95; 
                } else {
                    logVelocityY = 0;
                }

                if (state.logScrollY > 0) {
                    state.logScrollY += (0 - state.logScrollY) * 0.2;
                    if (state.logScrollY < 0.5) state.logScrollY = 0;
                } else if (state.maxLogScroll !== undefined && state.logScrollY < state.maxLogScroll) {
                    state.logScrollY += (state.maxLogScroll - state.logScrollY) * 0.2;
                    if (state.logScrollY > state.maxLogScroll - 0.5) state.logScrollY = state.maxLogScroll;
                }
            } else {
                if (state.logScrollY > 0) {
                    state.logScrollY -= (state.logScrollY) * 0.1;
                } else if (state.maxLogScroll !== undefined && state.logScrollY < state.maxLogScroll) {
                    state.logScrollY += (state.maxLogScroll - state.logScrollY) * 0.1;
                }
            }
        }

        if (state.isTyping && !state.showCommands && !state.showLog) {
            textTimer += dt;
            if (textTimer >= TEXT_SPEED) {
                textTimer = 0;
                state.textIndex++;
                state.displayedText = state.fullText.substring(0, state.textIndex);
                if (state.textIndex >= state.fullText.length) {
                    state.isTyping = false;
                }
            }
        }
    }

    function loop() {
        update();
        draw();
        requestAnimationFrame(loop);
    }

