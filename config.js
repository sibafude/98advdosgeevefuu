    /* =========================================
       ゲームシステム初期設定
       ========================================= */
    const GAME_VERSION = "Ver 1.1.12"; 

    const canvas = document.getElementById("game-canvas");
    const ctx = canvas.getContext("2d");

    const WIDTH = 720;
    const HEIGHT = 1280;
    
    const LAYOUT = {
        window: { x: 0, y: 1000, w: 720, h: 280 },
        sysBtn: { x: 720 - 180, y: 1280 - 65, w: 140, h: 45 },
        logBtn: { x: 720 - 180 - 120, y: 1280 - 65, w: 100, h: 45 } 
    };

