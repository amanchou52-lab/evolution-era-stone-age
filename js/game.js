// GDD v3.0: Full 25 Islands Progression Grid (समस्या #6 फिक्स)
const PHASER_ISLANDS = [
    // Early Era (Islands 1-8)
    { id:1, r:2, c:2, type:'home',   lvl:1, cost:{}, res:'wood',  name:'Chief Longhouse' },
    { id:2, r:1, c:2, type:'plot',   lvl:1, cost:{}, res:'wood',  name:'Wood Patch A' },
    { id:3, r:3, c:2, type:'plot',   lvl:1, cost:{}, res:null,    name:'Starter Plot B' },
    { id:4, r:2, c:1, type:'plot',   lvl:1, cost:{}, res:null,    name:'Starter Plot C' },
    { id:5, r:2, c:3, type:'node',   lvl:2, cost:{wood:50}, res:'stone', name:'Stone Ridge' },
    { id:6, r:1, c:1, type:'plot',   lvl:4, cost:{wood:80, stone:30}, res:'stone', name:'Firepit Glade' },
    { id:7, r:3, c:1, type:'plot',   lvl:6, cost:{wood:120, stone:60}, res:null, name:'Water Springs' },
    { id:8, r:1, c:3, type:'plot',   lvl:8, cost:{wood:150, stone:100}, res:'wood', name:'Clay Valley' },
    // Mid Era (Islands 9-16)
    { id:9,  r:3, c:3, type:'node',  lvl:10, cost:{wood:200, stone:150}, res:'iron', name:'Iron Vein' },
    { id:10, r:0, c:2, type:'plot',  lvl:11, cost:{stone:180, iron:20}, res:null, name:'Upgrade Bench' },
    { id:11, r:4, c:2, type:'plot',  lvl:12, cost:{stone:200, iron:30}, res:'stone', name:'Hearth Land' },
    { id:12, r:0, c:1, type:'plot',  lvl:13, cost:{stone:250, iron:50}, res:null, name:'Wheat Plot' },
    { id:13, r:4, c:1, type:'node',  lvl:14, cost:{stone:300, iron:70}, res:'stone', name:'Jaggery Rock' },
    { id:14, r:0, c:3, type:'plot',  lvl:15, cost:{iron:80, stone:100}, res:null, name:'Rich Plot' },
    { id:15, r:4, c:3, type:'plot',  lvl:16, cost:{iron:120, stone:150}, res:'iron', name:'Grand Chest' },
    { id:16, r:2, c:0, type:'plot',  lvl:17, cost:{iron:150, stone:200}, res:null, name:'Outpost' },
    // Late Era (Islands 17-25)
    { id:17, r:0, c:0, type:'node',  lvl:18, cost:{iron:200, gold:50}, res:'gold', name:'Gold Shard' },
    { id:18, r:1, c:0, type:'plot',  lvl:19, cost:{gold:100, iron:200}, res:null, name:'Forge Den' },
    { id:19, r:3, c:0, type:'plot',  lvl:20, cost:{gold:150, iron:250}, res:'iron', name:'Feast Field' },
    { id:20, r:4, c:0, type:'plot',  lvl:21, cost:{gold:200, iron:300}, res:null, name:'Deep Vault' },
    { id:21, r:2, c:4, type:'plot',  lvl:22, cost:{gold:250, iron:200}, res:'iron', name:'Altar' },
    { id:22, r:0, c:4, type:'node',  lvl:23, cost:{gold:300, iron:150}, res:'gold', name:'Auction House' },
    { id:23, r:1, c:4, type:'plot',  lvl:24, cost:{gold:400, iron:200}, res:null, name:'Golden Gate' },
    { id:24, r:3, c:4, type:'plot',  lvl:24, cost:{gold:500, iron:300}, res:'gold', name:'Era End' },
    { id:25, r:4, c:4, type:'special',lvl:25, cost:{gold:600, iron:400}, res:'gold', name:'Migration Portal' }
];

const config = {
    type: Phaser.AUTO,
    width: 500,
    height: 500,
    parent: 'phaser-canvas-container',
    backgroundColor: '#0f0b07',
    pixelArt: true,
    antialias: false,
    roundPixels: true,
    scene: { preload: preload, create: create, update: update }
};

const game = new Phaser.Game(config);
let sceneRef;

function preload() {}
function create() { sceneRef = this; drawIslandGrid(this); }

// LIVE TIMER ENGINE RUNNING EVERY SEC (समस्या #2 का हल - लाइव फसल टाइमर)
function update() {
    if(sceneRef) drawIslandGrid(sceneRef); 
}

function drawIslandGrid(scene) {
    scene.children.removeAll();
    
    const cellSize = 90;
    const padding = 8;
    const startX = 10;
    const startY = 10;
    const currentTime = Math.floor(Date.now() / 1000);

    PHASER_ISLANDS.forEach(isl => {
        const x = startX + isl.c * (cellSize + padding);
        const y = startY + isl.r * (cellSize + padding);
        const isUnlocked = G.unlockedIslands.includes(isl.id);
        
        const rect = scene.add.rectangle(x + cellSize/2, y + cellSize/2, cellSize, cellSize, 0x281d13).setInteractive();
        rect.setStrokeStyle(2, isUnlocked ? 0x5c4028 : 0x3a2a10);
        
        if (!isUnlocked) {
            rect.setFillStyle(0x0e0b07);
            scene.add.text(x + cellSize/2, y + cellSize/2 - 10, '🔒', { fontSize: '18px' }).setOrigin(0.5);
            scene.add.text(x + cellSize/2, y + cellSize/2 + 14, `Lvl ${isl.lvl}`, { fontSize: '10px', fill: '#8f7f6f' }).setOrigin(0.5);
            rect.on('pointerdown', () => triggerIslandUnlockModal(isl));
            return;
        }

        // समस्या #7: बीच वाले होम टापू पर क्लिक करने पर इन्वेंट्री पॉपअप खुलेगा
        if (isl.type === 'home') {
            rect.setStrokeStyle(2, 0xcc9933);
            scene.add.text(x + cellSize/2, y + cellSize/2 - 12, '🏠', { fontSize: '26px' }).setOrigin(0.5);
            scene.add.text(x + cellSize/2, y + cellSize/2 + 16, 'Chief Box', { fontSize: '11px', fill: '#ffcc66' }).setOrigin(0.5);
            rect.on('pointerdown', () => openHomeInventoryModal());
        } else {
            const plotCrop = G.plots[isl.id];
            
            if (plotCrop) {
                const cropData = CROPS[plotCrop.cropType];
                const timeRemaining = Math.max(0, cropData.growTime - (currentTime - plotCrop.plantedAt));
                const done = timeRemaining === 0;
                
                scene.add.text(x + cellSize/2, y + cellSize/2 - 12, plotCrop.state === 'wilted' ? '🥀' : cropData.emoji, { fontSize: '24px' }).setOrigin(0.5);
                // फसल का टाइमर स्क्रीन पर लाइव घटेगा (समस्या #2 फिक्स)
                scene.add.text(x + cellSize/2, y + cellSize/2 + 16, done ? '✅ Harvest' : timeRemaining + 's', { fontSize: '11px', fill: done ? '#5cb350' : '#ffcc66' }).setOrigin(0.5);
                
                rect.on('pointerdown', () => {
                    if (done || plotCrop.state === 'wilted') {
                        harvestCrop(isl.id, plotCrop.state === 'wilted');
                        drawIslandGrid(scene);
                    } else {
                        toast(`⏳ फसल पकने में ${timeRemaining} सेकंड बाकी हैं!`, 'error');
                    }
                });
            } else if (isl.res) {
                // समस्या #5 फिक्स: Wood (10m), Stone (20m), Iron (30m), Gold (40m) के अलग-अलग टाइमर
                const cooldowns = { wood: 600, stone: 1200, iron: 1800, gold: 2400 }; 
                const cd = cooldowns[isl.res];
                
                const lastHarvest = G.nodes[isl.id] || 0;
                const timePassed = currentTime - lastHarvest;
                const onCooldown = lastHarvest > 0 && timePassed < cd;

                const emojis = { wood: '🪵', stone: '🪨', iron: '⚙️', gold: '🥇' };
                scene.add.text(x + cellSize/2, y + cellSize/2 - 12, emojis[isl.res], { fontSize: '24px' }).setOrigin(0.5);
                
                if (onCooldown) {
                    const rem = cd - timePassed;
                    scene.add.text(x + cellSize/2, y + cellSize/2 + 16, formatTime(rem), { fontSize: '11px', fill: '#cc4444', fontWeight: 'bold' }).setOrigin(0.5);
                    rect.removeAllListeners('pointerdown');
                    rect.on('pointerdown', () => toast(`⏳ नोड खाली है! नया माल आने में ${formatTime(rem)} बाकी हैं।`, 'error'));
                } else {
                    scene.add.text(x + cellSize/2, y + cellSize/2 + 16, '⛏️ Gather', { fontSize: '11px', fill: '#5cb350' }).setOrigin(0.5);
                    rect.removeAllListeners('pointerdown');
                    rect.on('pointerdown', () => harvestResourceNodeDirect(isl, scene));
                }
            } else {
                scene.add.text(x + cellSize/2, y + cellSize/2 - 12, '🌱', { fontSize: '22px' }).setOrigin(0.5);
                scene.add.text(x + cellSize/2, y + cellSize/2 + 16, 'Empty Plot', { fontSize: '10px', fill: '#5cb350' }).setOrigin(0.5);
                rect.on('pointerdown', () => openPlantingSelector(isl.id));
            }
        }
    });
}

function openPlantingSelector(plotId) {
    if (typeof showPlantModal === 'function') showPlantModal(plotId);
}

function harvestResourceNodeDirect(isl, scene) {
    const toolsMap = { wood: 'stone_axe', stone: 'stone_pickaxe', iron: 'stone_pickaxe', gold: 'iron_pickaxe' };
    const neededTool = toolsMap[isl.res];
    const clickTime = Math.floor(Date.now() / 1000);

    if (!deductToolDurability(neededTool)) return; //

    const baseYield = isl.res === 'wood' ? 12 : (isl.res === 'stone' ? 8 : (isl.res === 'iron' ? 5 : 2));
    if (isStorageFull(isl.res, 'resources', baseYield)) return; //

    G.resources[isl.res] = (G.resources[isl.res] || 0) + baseYield;
    G.nodes[isl.id] = clickTime; // लॉक टाइमस्टैम्प!
    
    saveGame();
    toast(`⛏️ Gathered +${baseYield} ${isl.res.toUpperCase()}!`, 'success');
    
    if (typeof renderInventory === 'function') renderInventory();
    if (typeof updateHeader === 'function') updateHeader();
    drawIslandGrid(scene);
}

function triggerIslandUnlockModal(isl) {
    if (G.level < isl.lvl) { toast(`⚔️ Level ${isl.lvl} Required!`, 'error'); return; }
    document.getElementById('modal-title').textContent = `Expand: ${isl.name}`;
    let costHtml = '';
    let canAfford = true;
    Object.entries(isl.cost).forEach(([res, reqAmt]) => {
        const currentRes = G.resources[res] || 0;
        const ok = currentRes >= reqAmt;
        if (!ok) canAfford = false;
        costHtml += `<div style="font-size:12px;color:${ok?'var(--green-light)':'var(--red-light)'}">${res.toUpperCase()}: ${currentRes}/${reqAmt}</div>`;
    });
    document.getElementById('modal-body').innerHTML = costHtml;
    const actions = document.getElementById('modal-actions');
    actions.innerHTML = '';
    if (canAfford) {
        const btn = document.createElement('button');
        btn.className = 'btn-primary';
        btn.textContent = '🔓 Expand Island';
        btn.onclick = () => {
            Object.entries(isl.cost).forEach(([res, reqAmt]) => G.resources[res] -= reqAmt);
            G.unlockedIslands.push(isl.id);
            if(isl.id === 6) G.unlockedBuildings.push('firepit');
            toast('🏝️ Territory Expanded!', 'gold');
            document.getElementById('modal-overlay').classList.remove('show');
            saveGame();
            renderAll();
            drawIslandGrid(sceneRef);
        };
        actions.appendChild(btn);
    }
    document.getElementById('modal-overlay').classList.add('show');
}
