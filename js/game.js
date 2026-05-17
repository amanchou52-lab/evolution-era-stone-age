// GDD v3.0: 5x5 Grid Complete 25 Island Map
const PHASER_ISLANDS = [
    { id:1, r:2, c:2, type:'home',   lvl:1, cost:{}, res:'wood',  name:'Home Plot' },
    { id:2, r:1, c:2, type:'plot',   lvl:1, cost:{}, res:'wood',  name:'Starter Wood A' },
    { id:3, r:3, c:2, type:'plot',   lvl:1, cost:{}, res:null,    name:'Starter Plot B' },
    { id:4, r:2, c:1, type:'plot',   lvl:1, cost:{}, res:null,    name:'Starter Plot C' },
    { id:5, r:2, c:3, type:'node',   lvl:2, cost:{wood:50}, res:'stone', name:'Stone Ridge' },
    { id:6, r:1, c:1, type:'plot',   lvl:4, cost:{wood:80, stone:30}, res:'stone', name:'Firepit Glade' }
];

const config = {
    type: Phaser.AUTO,
    width: 500,
    height: 500,
    parent: 'phaser-canvas-container',
    backgroundColor: '#0f0b07',
    pixelArt: true, // क्रिस्टल क्लियर यूआई के लिए ब्लर हटा दिया (समस्या #2 का हल)
    scene: { preload: preload, create: create, update: update }
};

const game = new Phaser.Game(config);
let sceneRef;

function preload() {}

function create() {
    sceneRef = this;
    drawIslandGrid(this);
}

function update() {}

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
            scene.add.text(x + cellSize/2, y + cellSize/2 - 10, '🔒', { fontSize: '20px' }).setOrigin(0.5);
            scene.add.text(x + cellSize/2, y + cellSize/2 + 15, `Lvl ${isl.lvl}`, { fontSize: '10px', fill: '#8f7f6f' }).setOrigin(0.5);
            rect.on('pointerdown', () => triggerIslandUnlockModal(isl));
            return;
        }

        if (isl.type === 'home') {
            rect.setStrokeStyle(2, 0xcc9933);
            scene.add.text(x + cellSize/2, y + cellSize/2 - 12, '🏠', { fontSize: '26px' }).setOrigin(0.5);
            scene.add.text(x + cellSize/2, y + cellSize/2 + 16, 'Home', { fontSize: '11px', fill: '#ffcc66' }).setOrigin(0.5);
        } else {
            const plotCrop = G.plots[isl.id];
            
            if (plotCrop) {
                const cropData = CROPS[plotCrop.cropType];
                const done = (currentTime - plotCrop.plantedAt) >= cropData.growTime;
                scene.add.text(x + cellSize/2, y + cellSize/2 - 12, plotCrop.state === 'wilted' ? '🥀' : cropData.emoji, { fontSize: '26px' }).setOrigin(0.5);
                scene.add.text(x + cellSize/2, y + cellSize/2 + 16, done ? '✅ Harvest' : '⏳ Growing', { fontSize: '10px', fill: done ? '#5cb350' : '#ffcc66' }).setOrigin(0.5);
                
                rect.on('pointerdown', () => {
                    if (done || plotCrop.state === 'wilted') {
                        harvestCrop(isl.id, plotCrop.state === 'wilted');
                        drawIslandGrid(scene);
                    } else {
                        toast('⏳ फसल अभी कच्ची है!', 'error');
                    }
                });
            } else if (isl.res) {
                // ⏱️ 10 मिनट का टाइम लिमिट लॉजिक (समस्या #3 का हल)
                const lastHarvest = G.nodes[isl.id] || 0;
                const cooldownDuration = 600; // 10 मिनट = 600 सेकंड
                const timePassed = currentTime - lastHarvest;
                const onCooldown = timePassed < cooldownDuration;

                const emojis = { wood: '🪵', stone: '🪨', iron: '⚙️', gold: '🥇' };
                scene.add.text(x + cellSize/2, y + cellSize/2 - 12, emojis[isl.res], { fontSize: '24px' }).setOrigin(0.5);
                
                if (onCooldown) {
                    const remainingTime = cooldownDuration - timePassed;
                    scene.add.text(x + cellSize/2, y + cellSize/2 + 16, formatTime(remainingTime), { fontSize: '10px', fill: '#cc4444' }).setOrigin(0.5);
                    rect.on('pointerdown', () => toast(`⏳ यह नोड खाली है! ${formatTime(remainingTime)} बाद लकड़ी आएगी।`, 'error'));
                } else {
                    scene.add.text(x + cellSize/2, y + cellSize/2 + 16, '⛏️ Chop/Mine', { fontSize: '10px', fill: '#5cb350' }).setOrigin(0.5);
                    rect.on('pointerdown', () => harvestResourceNode(isl));
                }
            } else {
                scene.add.text(x + cellSize/2, y + cellSize/2 - 12, '🌱', { fontSize: '24px' }).setOrigin(0.5);
                scene.add.text(x + cellSize/2, y + cellSize/2 + 16, 'Empty Plot', { fontSize: '10px', fill: '#5cb350' }).setOrigin(0.5);
                rect.on('pointerdown', () => openPlantingSelector(isl.id));
            }
        }
    });
}

function renderGrid() {
    if (sceneRef) drawIslandGrid(sceneRef);
}

function openPlantingSelector(plotId) {
    if (typeof showPlantModal === 'function') showPlantModal(plotId);
}

function harvestResourceNode(isl) {
    const toolsMap = { wood: 'stone_axe', stone: 'stone_pickaxe' };
    const neededTool = toolsMap[isl.res];
    const currentTime = Math.floor(Date.now() / 1000);

    if (!deductToolDurability(neededTool)) return;

    const baseYield = isl.res === 'wood' ? 10 : 6;
    if (isStorageFull(isl.res, 'resources', baseYield)) return;

    G.resources[isl.res] += baseYield;
    G.nodes[isl.id] = currentTime; // टाइमस्टैम्प लॉक सेव कर दिया!
    
    toast(`⛏️ Mined +${baseYield} ${isl.res.toUpperCase()}!`, 'success');
    saveGame();
    renderInventory();
    renderGrid();
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
            renderGrid();
        };
        actions.appendChild(btn);
    }
    document.getElementById('modal-overlay').classList.add('show');
}
