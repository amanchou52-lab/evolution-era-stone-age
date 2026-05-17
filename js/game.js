// ══════════════════════════════════════════════
// 5.1 PHASER GAME CONFIGURATION & MAP DATA
// ══════════════════════════════════════════════

// GDD v3.0: Complete 25 Island Progression Grid
const PHASER_ISLANDS = [
    // Starter Era (Islands 1-4: Free, Ghar यहीं है, Wood Nodes Available)
    { id:1, r:2, c:2, type:'home',   lvl:1, cost:{}, res:'wood',  name:'Home Plot' },
    { id:2, r:1, c:2, type:'plot',   lvl:1, cost:{}, res:'wood',  name:'Starter Plot A' },
    { id:3, r:3, c:2, type:'plot',   lvl:1, cost:{}, res:null,    name:'Starter Plot B' },
    { id:4, r:2, c:1, type:'plot',   lvl:1, cost:{}, res:null,    name:'Starter Plot C' },
    // Early Era (Islands 5-8)
    { id:5, r:2, c:3, type:'node',   lvl:2, cost:{wood:50}, res:'stone', name:'Stone Ridge' },
    { id:6, r:1, c:1, type:'plot',   lvl:4, cost:{wood:80, stone:30}, res:'stone', name:'Firepit Glade' },
    { id:7, r:3, c:1, type:'plot',   lvl:6, cost:{wood:120, stone:60}, res:null, name:'Well Springs' },
    { id:8, r:1, c:3, type:'plot',   lvl:8, cost:{wood:150, stone:100}, res:'wood', name:'Clay Valley' },
    // Mid Era (Islands 9-16: Iron Age)
    { id:9,  r:3, c:3, type:'node',  lvl:10, cost:{wood:200, stone:150}, res:'iron', name:'Iron Vein' },
    { id:10, r:0, c:2, type:'plot',  lvl:11, cost:{stone:180, iron:20}, res:null, name:'Bench Peak' },
    { id:11, r:4, c:2, type:'plot',  lvl:12, cost:{stone:200, iron:30}, res:'stone', name:'Hearth Land' },
    { id:12, r:0, c:1, type:'plot',  lvl:13, cost:{stone:250, iron:50}, res:null, name:'Wheat Field' },
    { id:13, r:4, c:1, type:'node',  lvl:14, cost:{stone:300, iron:70}, res:'stone', name:'Gud Node' },
    { id:14, r:0, c:3, type:'plot',  lvl:15, cost:{iron:80, stone:100}, res:null, name:'Advanced Soil' },
    { id:15, r:4, c:3, type:'plot',  lvl:16, cost:{iron:120, stone:150}, res:'iron', name:'Grand Vault' },
    { id:16, r:2, c:0, type:'plot',  lvl:17, cost:{iron:150, stone:200}, res:null, name:'Wanderer Outpost' },
    // Late Era (Islands 17-25: Gold Age)
    { id:17, r:0, c:0, type:'node',  lvl:18, cost:{iron:200, gold:50}, res:'gold', name:'Gold Shard' },
    { id:18, r:1, c:0, type:'plot',  lvl:19, cost:{gold:100, iron:200}, res:null, name:'Forge Rock' },
    { id:19, r:3, c:0, type:'plot',  lvl:20, cost:{gold:150, iron:250}, res:'iron', name:'Feast Ground' },
    { id:20, r:4, c:0, type:'plot',  lvl:21, cost:{gold:200, iron:300}, res:null, name:'Vault Deep' },
    { id:21, r:2, c:4, type:'plot',  lvl:22, cost:{gold:250, iron:200}, res:'iron', name:'Legendary Altar' },
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
    scene: { preload: preload, create: create, update: update }
};

const game = new Phaser.Game(config);
let sceneRef;

function preload() {
    // Web Testing के लिए हम एनिमेटेड टेक्सचर की जगह शेड्यूल्ड शेप्स और एमोजी टेक्स्ट का उपयोग करेंगे
}

function create() {
    sceneRef = this;
    drawIslandGrid(this);
}

function update() {
    // रियल-टाइम रेंडर लूप अपडेट्स
}

// ══════════════════════════════════════════════
// 5.2 RENDER GENERATOR (5x5 GRID & FOG OF WAR)
// ══════════════════════════════════════════════

function drawIslandGrid(scene) {
    scene.children.removeAll(); // Clear old graphics
    
    const cellSize = 90;
    const padding = 8;
    const startX = 10;
    const startY = 10;

    PHASER_ISLANDS.forEach(isl => {
        const x = startX + isl.c * (cellSize + padding);
        const y = startY + isl.r * (cellSize + padding);

        const isUnlocked = G.unlockedIslands.includes(isl.id);
        
        // 1. Draw Base Island Card Shape
        const rect = scene.add.rectangle(x + cellSize/2, y + cellSize/2, cellSize, cellSize, 0x281d13).setInteractive();
        rect.setStrokeStyle(2, isUnlocked ? 0x5c4028 : 0x3a2a10);
        
        if (!isUnlocked) {
            // FOG OF WAR EFFECT: धुंधला और लॉक
            rect.setFillStyle(0x0e0b07);
            scene.add.text(x + cellSize/2, y + cellSize/2 - 10, '🔒', { fontSize: '20px' }).setOrigin(0.5);
            scene.add.text(x + cellSize/2, y + cellSize/2 + 15, `Lvl ${isl.lvl}`, { fontSize: '10px', color: '#8f7f6f' }).setOrigin(0.5);
            
            rect.on('pointerdown', () => triggerIslandUnlockModal(isl));
            return;
        }

        // 2. Draw Unlocked Content Logic
        if (isl.type === 'home') {
            rect.setStrokeStyle(2, 0xcc9933); // Gold border for main home
            scene.add.text(x + cellSize/2, y + cellSize/2 - 12, '🏠', { fontSize: '26px' }).setOrigin(0.5);
            scene.add.text(x + cellSize/2, y + cellSize/2 + 16, 'Home', { fontSize: '11px', color: '#ffcc66' }).setOrigin(0.5);
        } 
        else if (isl.type === 'special') {
            rect.setStrokeStyle(2, 0xcc4444);
            scene.add.text(x + cellSize/2, y + cellSize/2 - 12, '🌀', { fontSize: '26px' }).setOrigin(0.5);
            scene.add.text(x + cellSize/2, y + cellSize/2 + 16, 'Portal', { fontSize: '11px', color: '#cc4444' }).setOrigin(0.5);
        }
        else {
            // Plot and Node Handle
            const plotCrop = G.plots[isl.id];
            
            if (plotCrop) {
                // Showing Growing Crop
                const cropData = CROPS[plotCrop.cropType];
                const timePassed = now() - plotCrop.plantedAt;
                const done = timePassed >= cropData.growTime;
                
                scene.add.text(x + cellSize/2, y + cellSize/2 - 12, plotCrop.state === 'wilted' ? '🥀' : cropData.emoji, { fontSize: '26px' }).setOrigin(0.5);
                scene.add.text(x + cellSize/2, y + cellSize/2 + 16, done ? '✅ Harvest' : '⏳ Growing', { fontSize: '10px', color: done ? '#5cb350' : '#ffcc66' }).setOrigin(0.5);
                
                rect.on('pointerdown', () => {
                    if (done || plotCrop.state === 'wilted') harvestCropPlot(isl.id, plotCrop.state === 'wilted');
                    else toast('⏳ फसल अभी पक रही है, सब्र करें!', 'error');
                });
            } 
            else if (isl.res) {
                // Showing Mineral/Wood Node
                const emojis = { wood: '🪵', stone: '🪨', iron: '⚙️', gold: '🥇' };
                scene.add.text(x + cellSize/2, y + cellSize/2 - 12, emojis[isl.res], { fontSize: '24px' }).setOrigin(0.5);
                scene.add.text(x + cellSize/2, y + cellSize/2 + 16, isl.name, { fontSize: '10px', color: '#8f7f6f' }).setOrigin(0.5);
                
                rect.on('pointerdown', () => harvestResourceNode(isl));
            } 
            else {
                // Empty Farm Plot Ready for seeds
                scene.add.text(x + cellSize/2, y + cellSize/2 - 12, '🌱', { fontSize: '24px' }).setOrigin(0.5);
                scene.add.text(x + cellSize/2, y + cellSize/2 + 16, 'Empty Plot', { fontSize: '10px', color: '#5cb350' }).setOrigin(0.5);
                
                rect.on('pointerdown', () => openPlantingSelector(isl.id));
            }
        }
    });
}

function renderGrid() {
    if (sceneRef) drawIslandGrid(sceneRef);
}

// ══════════════════════════════════════════════
// 5.3 INTERACTIVE GAME CLICK ACTIONS HANDLERS
// ══════════════════════════════════════════════

function openPlantingSelector(plotId) {
    if (typeof showPlantModal === 'function') showPlantModal(plotId);
    else showPlantModalLegacy(plotId);
}

function harvestCropPlot(plotId, isWilted) {
    if (typeof harvestCrop === 'function') {
        harvestCrop(plotId, isWilted);
        renderGrid();
    }
}

function harvestResourceNode(isl) {
    // Dynamic tool required validation per resource type (Section 6)
    const toolsMap = { wood: 'stone_axe', stone: 'stone_pickaxe', iron: 'stone_pickaxe', gold: 'iron_pickaxe' };
    const neededTool = toolsMap[isl.res];
    
    if (isl.res === 'gold' && G.tools.iron_pickaxe <= 0) {
        toast('❌ Gold माइन करने के लिए Iron Pickaxe ⚙️ की आवश्यकता है!', 'error');
        return;
    }

    if (!deductToolDurability(neededTool)) return; // Tool limit durability check

    const baseYield = isl.res === 'wood' ? 12 : (isl.res === 'stone' ? 8 : (isl.res === 'iron' ? 5 : 2));
    if (isStorageFull(isl.res, 'resources', baseYield)) return; // Cap index evaluation

    G.resources[isl.res] += baseYield;
    toast(`⛏️ Mined ${baseYield}x ${isl.res.toUpperCase()}!`, 'success');
    log(`Mined resources from ${isl.name}`);
    
    saveGame();
    renderInventory();
    renderGrid();
}

function triggerIslandUnlockModal(isl) {
    if (G.level < isl.lvl) {
        toast(`⚔️ इस टापू को खोजने के लिए Level ${isl.lvl} की आवश्यकता है!`, 'error');
        return;
    }

    document.getElementById('modal-title').textContent = `🏝️ Expand: ${isl.name}`;
    document.getElementById('modal-subtitle').textContent = `Required Level: ${isl.lvl}`;
    
    let costHtml = '<div style="margin:8px 0;font-size:12px;color:var(--text-dim);">Unlock Expansion Cost:</div>';
    let canAfford = true;
    
    Object.entries(isl.cost).forEach(([res, reqAmt]) => {
        const currentRes = G.resources[res] || 0;
        const ok = currentRes >= reqAmt;
        if (!ok) canAfford = false;
        costHtml += `<div style="display:flex;justify-content:space-between;font-size:12px;color:${ok?'var(--green-light)':'var(--red-light)'}">
            <span>${res.toUpperCase()}</span>
            <span>${currentRes}/${reqAmt}</span>
        </div>`;
    });

    document.getElementById('modal-body').innerHTML = costHtml;
    
    const actions = document.getElementById('modal-actions');
    actions.innerHTML = '';

    if (canAfford) {
        const btn = document.createElement('button');
        btn.className = 'btn-primary';
        btn.textContent = '🔓 Burn Resources & Expand';
        btn.onclick = () => {
            Object.entries(isl.cost).forEach(([res, reqAmt]) => G.resources[res] -= reqAmt);
            G.unlockedIslands.push(isl.id);
            
            // Building unlock triggers via progression
            if(isl.id === 6) G.unlockedBuildings.push('firepit');
            if(isl.id === 8) G.unlockedBuildings.push('clay_oven');
            
            toast(`✨ Dynamic Expand Reveal: ${isl.name} discovered!`, 'gold');
            log(`Expanded territory to ${isl.name}`);
            closeModal();
            saveGame();
            renderAll();
            renderGrid();
        };
        actions.appendChild(btn);
    }
    
    const cancel = document.createElement('button');
    cancel.className = 'btn-secondary';
    cancel.textContent = '✕ Cancel';
    cancel.onclick = closeModal;
    actions.appendChild(cancel);
    
    document.getElementById('modal-overlay').classList.add('show');
}

// ══════════════════════════════════════════════
// 5.4 LEGACY COMPATIBILITY OVERRIDES
// ══════════════════════════════════════════════

function showPlantModalLegacy(plotId) {
    // Fallback logic inside frontend UI renderer channel if loading async
    switchTab('seeds');
    toast('🌿 ट्राइबल बैग (Seeds Tab) से बीज चुनकर प्लांट करें।', 'gold');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('remove');
    document.getElementById('modal-overlay').classList.remove('show');
}
