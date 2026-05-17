// ══════════════════════════════════════════════
// 4.1 TABS CONTROL & GENERAL UPDATES
// ══════════════════════════════════════════════

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
        if(btn.getAttribute('onclick').includes(tabId)) btn.classList.add('active');
    });
    
    const targetContent = document.getElementById('tab-' + tabId);
    if (targetContent) targetContent.classList.add('active');
    
    if (tabId === 'skills') renderSkillTree();
}

function updateHeader() {
    document.getElementById('hdr-level').textContent = G.level;
    document.getElementById('hdr-kodi').textContent = G.kodi;
    document.getElementById('hdr-sp').textContent = G.skillPoints;
    document.getElementById('sp-display').textContent = G.skillPoints;

    const prevXP = xpForLevel(G.level - 1);
    const nextXP = xpForLevel(G.level);
    const curXP = G.xp - prevXP;
    const needXP = nextXP - prevXP;
    const pct = Math.min(100, Math.floor((curXP / needXP) * 100));
    
    document.getElementById('xp-bar').style.width = pct + '%';
    document.getElementById('xp-text').textContent = `${G.xp.toLocaleString()} / ${nextXP.toLocaleString()} XP`;
}

// 🌱 PLANT SELECTION MODAL FIX (समस्या #1 का हल)
function showPlantModal(plotId) {
    document.getElementById('modal-title').textContent = '🌱 Plant a Crop';
    document.getElementById('modal-subtitle').textContent = 'अपने बैग से एक बीज चुनें।';

    const body = document.createElement('div');
    body.className = 'inv-grid';
    body.style.gridTemplateColumns = '1fr';
    body.style.gap = '8px';

    let hasSeeds = false;

    Object.entries(CROPS).forEach(([key, crop]) => {
        if (G.level >= crop.unlockLevel) {
            const seedCount = G.seeds[key] || 0;
            if (seedCount > 0) {
                hasSeeds = true;
                const btn = document.createElement('button');
                btn.className = 'btn-secondary';
                btn.style.display = 'flex';
                btn.style.justifyContent = 'space-between';
                btn.style.alignItems = 'center';
                btn.style.padding = '10px';
                btn.style.width = '100%';
                btn.innerHTML = `
                    <span>${crop.emoji} <b>${crop.name}</b> (Owned: ${seedCount})</span>
                    <span style="color:var(--green-light);">⏱ ${crop.growTime}s</span>
                `;
                btn.onclick = () => {
                    plantCrop(plotId, key);
                    closeModal();
                };
                body.appendChild(btn);
            }
        }
    });

    if (!hasSeeds) {
        body.innerHTML = '<div style="text-align:center;color:var(--text-dim);padding:15px;">आपके पास कोई बीज नहीं हैं!<br>नीचे ट्राइबल बाज़ार से बीज खरीदें।</div>';
    }

    document.getElementById('modal-body').innerHTML = '';
    document.getElementById('modal-body').appendChild(body);
    
    const actions = document.getElementById('modal-actions');
    actions.innerHTML = '<button class="btn-secondary" onclick="closeModal()">✕ Cancel</button>';
    document.getElementById('modal-overlay').classList.add('show');
}

function plantCrop(plotId, cropType) {
    if ((G.seeds[cropType] || 0) <= 0) return;
    G.seeds[cropType]--;
    G.plots[plotId] = { cropType, plantedAt: now(), state: 'growing' };
    toast(`🌱 Planted ${CROPS[cropType].name}!`, 'success');
    saveGame();
    renderAll();
    if (typeof renderGrid === 'function') renderGrid();
}

function harvestCrop(plotId, isWilted) {
    const plot = G.plots[plotId];
    if (!plot) return;
    const crop = CROPS[plot.cropType];
    let amount = 1;

    if (isStorageFull(plot.cropType, 'crops', amount)) return;

    G.crops[plot.cropType] = (G.crops[plot.cropType] || 0) + amount;
    delete G.plots[plotId];

    addXP(crop.xp);
    toast(`🌾 Harvested ${amount}x ${crop.name}! +${crop.xp} XP`, 'success');
    saveGame();
    renderAll();
}

// ══════════════════════════════════════════════
// 4.2 INVENTORY & MARKETPLACE RENDERERS
// ══════════════════════════════════════════════

function renderInventory() {
    const resList = document.getElementById('res-list');
    let resHtml = '';
    const resources = [{ key:'wood', emoji:'🪵', name:'Wood' }, { key:'stone', emoji:'🪨', name:'Stone' }, { key:'iron', emoji:'⚙️', name:'Iron' }, { key:'gold', emoji:'🥇', name:'Gold' }];
    resources.forEach(r => {
        resHtml += `<div class="res-row"><div class="res-left"><span>${r.emoji} ${r.name}</span></div><span class="res-val">${G.resources[r.key] || 0}</span></div>`;
    });
    if(resList) resList.innerHTML = resHtml;

    const seedInv = document.getElementById('seed-inv');
    if (seedInv) {
        seedInv.innerHTML = '';
        Object.entries(CROPS).forEach(([key, crop]) => {
            const count = G.seeds[key] || 0;
            const div = document.createElement('div');
            div.className = 'inv-item';
            div.innerHTML = `<div>🌱</div><div class="i-count">${count}</div><div class="i-name">${crop.name} Seed</div>`;
            seedInv.appendChild(div);
        });
    }

    const cropInv = document.getElementById('crop-inv');
    if (cropInv) {
        cropInv.innerHTML = '';
        Object.entries(G.crops).forEach(([key, count]) => {
            const div = document.createElement('div');
            div.className = 'inv-item';
            div.innerHTML = `<div>${CROPS[key].emoji}</div><div class="i-count">${count}</div><div class="i-name">${CROPS[key].name}</div>`;
            cropInv.appendChild(div);
        });
    }

    const foodInv = document.getElementById('food-inv');
    if (foodInv) {
        foodInv.innerHTML = '';
        if (Object.keys(G.food).length === 0) {
            foodInv.innerHTML = '<div style="font-size:12px;color:var(--text-dim);text-align:center;padding:10px;">No cooked food yet.</div>';
        } else {
            Object.entries(G.food).forEach(([rId, count]) => {
                if (count <= 0) return;
                const recipe = RECIPES[rId];
                const div = document.createElement('div');
                div.className = 'cooking-active';
                div.style.padding = '6px';
                div.style.background = 'var(--bg-card)';
                div.style.marginBottom = '4px';
                div.innerHTML = `
                    <span>${recipe.emoji}</span>
                    <div style="flex:1;margin-left:8px;"><b>${recipe.name}</b><br><span style="font-size:10px;color:var(--green-light)">+${recipe.xp} XP (Qty: ${count})</span></div>
                    <button class="eat-btn" onclick="eatFood('${rId}')">Eat</button>
                `;
                foodInv.appendChild(div);
            });
        }
    }
}

function eatFood(recipeId) {
    if ((G.food[recipeId] || 0) <= 0) return;
    G.food[recipeId]--;
    if (G.food[recipeId] <= 0) delete G.food[recipeId];
    addXP(RECIPES[recipeId].xp);
    toast(`🍽️ Ate ${RECIPES[recipeId].name}!`, 'success');
    saveGame();
    renderInventory();
}

function renderMarketplace() {
    const cont = document.getElementById('market-container');
    if (!cont) return;
    cont.innerHTML = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;"></div>';
    const grid = cont.firstChild;

    Object.entries(CROPS).forEach(([key, crop]) => {
        if (G.level >= crop.unlockLevel) {
            const box = document.createElement('div');
            box.className = 'inv-item';
            box.style.textAlign = 'left';
            box.style.padding = '6px';
            box.innerHTML = `
                <div style="font-size:12px;"><b>${crop.name}</b></div>
                <div style="font-size:10px;color:var(--gold-light)">Seed: ${crop.seedPrice}K | Crop: ${crop.kodi}K</div>
                <div style="display:flex;gap:4px;margin-top:4px;">
                    <button class="btn-primary" style="padding:2px 4px;font-size:9px;" onclick="buySeed('${key}', ${crop.seedPrice})">Buy</button>
                    <button class="btn-secondary" style="padding:2px 4px;font-size:9px;" onclick="sellCrop('${key}', ${crop.kodi})">Sell</button>
                </div>
            `;
            grid.appendChild(box);
        }
    });
}

function buySeed(cropType, price) {
    if (G.kodi < price) { toast('❌ No Kodi!', 'error'); return; }
    G.kodi -= price;
    G.seeds[cropType] = (G.seeds[cropType] || 0) + 1;
    toast('🛒 Seed Purchased!', 'success');
    saveGame();
    updateHeader();
    renderInventory();
}

function sellCrop(cropType, reward) {
    if ((G.crops[cropType] || 0) <= 0) { toast('❌ No Crop!', 'error'); return; }
    G.crops[cropType]--;
    G.kodi += reward;
    toast('💰 Crop Sold!', 'gold');
    saveGame();
    updateHeader();
    renderInventory();
}

function renderBuildings() {
    const cont = document.getElementById('buildings-container');
    if (!cont) return;
    cont.innerHTML = '';
    if (G.unlockedBuildings.includes('firepit')) {
        const div = document.createElement('div');
        div.className = 'inv-item';
        div.style.textAlign = 'left';
        div.style.padding = '8px';
        const cooking = G.buildings['firepit'];
        if (cooking) {
            const recipe = RECIPES[cooking.recipe];
            const remaining = Math.max(0, recipe.cookTime - (now() - cooking.startedAt));
            const done = remaining === 0;
            div.innerHTML = `🔥 <b>Firepit (Cooking)</b><br><span style="font-size:11px;">${recipe.name} (${done ? '✅ Ready' : remaining + 's remaining'})</span><br><button class="btn-primary" style="margin-top:4px;" ${done?'':'disabled'} onclick="collectFood('firepit')">Collect</button>`;
        } else {
            div.innerHTML = `🔥 <b>Stone Firepit</b><br><button class="btn-secondary" style="padding:2px 6px;font-size:10px;margin-top:4px;" onclick="startCooking('firepit','baked_potato')">Cook Baked Potato (1x Potato)</button>`;
        }
        cont.appendChild(div);
    }
}

function startCooking(bId, rId) {
    const recipe = RECIPES[rId];
    let canCook = Object.entries(recipe.ingredients).every(([c, amt]) => (G.crops[c] || 0) >= amt);
    if (!canCook) { toast('❌ Ingredients Missing!', 'error'); return; }
    Object.entries(recipe.ingredients).forEach(([c, amt]) => G.crops[c] -= amt);
    G.buildings[bId] = { recipe: rId, startedAt: now() };
    saveGame();
    renderInventory();
    renderBuildings();
}

function collectFood(bId) {
    const cooking = G.buildings[bId];
    if (!cooking) return;
    G.food[cooking.recipe] = (G.food[cooking.recipe] || 0) + 1;
    delete G.buildings[bId];
    toast('✅ Food Ready!', 'success');
    saveGame();
    renderInventory();
    renderBuildings();
}

function renderNPCs() {
    const cont = document.getElementById('npc-container');
    if (cont) cont.innerHTML = '<div style="font-size:11px;color:var(--text-dim);">Elders are watching your progress. Complete orders later!</div>';
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('show');
}

function renderAll() {
    updateHeader();
    renderInventory();
    renderMarketplace();
    renderBuildings();
    renderNPCs();
}

window.onload = () => {
    renderAll();
    setInterval(checkWilt, 2000);
    setInterval(renderBuildings, 2000);
};
