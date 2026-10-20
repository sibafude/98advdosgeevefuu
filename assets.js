    // --- アセット管理 ---
    const imageCache = {};
    const fallbackImages = {
        "op_1": "https://placehold.co/720x1280/0a0a0a/FFF?text=OP+Scene+1",
        "op_2": "https://placehold.co/720x1280/1a1a1a/FFF?text=OP+Scene+2",
        "op_3": "https://placehold.co/720x1280/2a2a2a/FFF?text=OP+Scene+3",
        "op_4": "https://placehold.co/720x1280/3a3a3a/FFF?text=OP+Scene+4",
        "op_5": "https://placehold.co/720x1280/4a4a4a/FFF?text=OP+Scene+5",
        "op_6": "https://placehold.co/720x1280/5a5a5a/FFF?text=OP+Scene+6",
        "op_7": "https://placehold.co/720x1280/6a6a6a/FFF?text=OP+Scene+7",
        "op_8": "https://placehold.co/720x1280/7a7a7a/FFF?text=OP+Scene+8",
        "op_9": "https://placehold.co/720x1280/8a8a8a/FFF?text=OP+Scene+9",
        "bg_title": "https://placehold.co/720x1280/1a1a2e/FFF?text=Wakanadia+Title", 
        "bg_gate": "https://placehold.co/720x1280/1a1a2e/FFF?text=Background:\\nSchool+Gate+(Sunset)",
        "bg_gate_morning": "https://placehold.co/720x1280/87ceeb/000?text=Background:\\nSchool+Gate+(Morning)", 
        "bg_office": "https://placehold.co/720x1280/3e2723/FFF?text=Background:\\nPrincipal+Office",
        "bg_office_morning": "https://placehold.co/720x1280/8b7d6b/FFF?text=Background:\\nPrincipal+Office+(Morning)", 
        "bg_library": "https://placehold.co/720x1280/2e2b20/FFF?text=Background:\\nLibrary",
        "bg_clocktower": "https://placehold.co/720x1280/1c2331/FFF?text=Background:\\nClock+Tower",
        "bg_classroom": "https://placehold.co/720x1280/5d4037/FFF?text=Background:\\nClassroom", 
        "bg_warehouse": "https://placehold.co/720x1280/2c3e50/FFF?text=Background:\\nWarehouse+Office",
        "bg_warehouse_night": "https://placehold.co/720x1280/1a1a2e/FFF?text=Background:\\nWarehouse+(Night)",
        "bg_bar": "https://placehold.co/720x1280/1a1010/FFF?text=Background:\\nNight+Bar", 
        "bg_shiori_house": "https://placehold.co/720x1280/4a3b32/FFF?text=Background:\\nShiori's+House", 
        "bg_house_ext": "https://placehold.co/720x1280/5b6f82/FFF?text=Background:\\nHouse+Exterior",
        "bg_simple_living": "https://placehold.co/720x1280/dcdcdc/000?text=Background:\\nSimple+Living+Room",
        "bg_garden_sunset": "https://placehold.co/720x1280/4a5b42/FFF?text=Background:\\nGarden+(Sunset)",
        "bg_room2f_dark": "https://placehold.co/720x1280/111/FFF?text=Background:\\n2F+Room+(Dark)",
        "bg_room2f_light": "https://placehold.co/720x1280/ccc/000?text=Background:\\n2F+Room+(Light)",
        "bg_room2f_searched": "https://placehold.co/720x1280/ccc/000?text=Background:\\n2F+Room+(Searched)",
        "ev_kidnap": "https://placehold.co/720x1280/0d1117/FFF?text=Event+CG:\\nKidnapping+(720x1280)",
        "ev_rescue": "https://placehold.co/720x1280/2d0815/FFF?text=Event+CG:\\nRescue+Homura+and+Shiori",
        "ev_medal": "https://placehold.co/720x1280/111/FFF?text=Event+CG:\\nMedal+Photo",
        "ev_flower_model": "https://placehold.co/720x1280/112211/FFF?text=Event+CG:\\nFlower+Model",
        "ev_memo": "https://placehold.co/720x1280/ddd/000?text=Event+CG:\\nCipher+Memo",
        "ev_diary": "https://placehold.co/720x1280/531/FFF?text=Event+CG:\\nOld+Diary",
        "ch_homura": "https://placehold.co/400x800/e88/FFF?text=Character:\\nHomura+(400x800)",
        "ch_homura_jersey": "https://placehold.co/400x800/d44/FFF?text=Character:\\nHomura+(Jersey)",
        "ch_homura_jersey_glasses": "https://placehold.co/400x800/d44/000?text=Character:\\nHomura+(Jersey+%26+Glasses)", 
        "ch_yui": "https://placehold.co/400x800/85a/FFF?text=Character:\\nYui+Tachibana",
        "ch_yui_jersey": "https://placehold.co/400x800/85a/FFF?text=Character:\\nYui+(Jersey)",
        "ch_yui_jersey_glasses": "https://placehold.co/400x800/85a/000?text=Character:\\nYui+(Jersey+%26+Glasses)",
        "ch_kenta": "https://placehold.co/400x800/585/FFF?text=Character:\\nKenta+Morishita",
        "ch_principal": "https://placehold.co/400x800/444/FFF?text=Character:\\nPrincipal+(Elder+Woman)", 
        "ch_shiori": "https://placehold.co/400x800/4a8/FFF?text=Character:\\nShiori",
        "ch_informant": "https://placehold.co/400x800/345/FFF?text=Character:\\nInformant",
        "ch_father": "https://placehold.co/400x800/333/FFF?text=Character:\\nFather+(Diplomat)", 
        "ch_hayashi": "https://placehold.co/400x800/aa8/000?text=Character:\\nHayashi+(Client)", 
        "ui_panel": "https://placehold.co/720x280/000028/FFF?text=UI+Panel"
    };

    function loadInitialImages() {
        for (let key in fallbackImages) {
            const img = new Image();
            img.src = `assets/images/${key}.png`;
            img.onload = () => { imageCache[key] = img; };
            img.onerror = () => {
                const fbImg = new Image();
                fbImg.src = fallbackImages[key];
                fbImg.onload = () => { imageCache[key] = fbImg; };
            };
        }
    }
    loadInitialImages();

