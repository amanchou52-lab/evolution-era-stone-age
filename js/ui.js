// ══════════════════════════════════════════════
// 4.1 UI TABS & HEADER ENGINE
// ══════════════════════════════════════════════

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
        if(btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(tabId)) btn.classList.add('active');
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

// 🏠 HOME CODES: होम टापू पर क्लिक करने पर इन्वेंट्री खुलना (समस्या #7)
function openHomeInventoryModal() {
    document.getElementById('modal-title').textContent = '🏠 Chief\'s Longhouse Storage';
    document.getElementById('modal-subtitle').textContent = 'तुम्हारे टापू के सारे अनाज और संसाधन यहाँ सुरक्षित हैं।';

    // Resources View (समस्या #5)
    let html = `
        <div style="background:var(--bg-mid); padding:10px; border-radius:8px; margin-bottom:10px;">
            <div style="font-weight:bold; color:var(--gold); font-size:13px; margin-bottom:6px;">🪵 Minerals & Resources</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:12px;">
                <div>🪵 Wood: <b>${G.resources.wood || 0}</b></div>
                <div>🪨 Stone: <b>${G.resources.stone || 0}</b></div>
                <div>⚙️ Iron: <b>${G.resources.iron || 0}</b></div>
                <div>🥇 Gold: <b>${G.resources.gold || 0}</b></div>
            </div>
        </div>
    `;

    // Seeds Storage View
    html += `<div style="font-weight:bold; color:var(--gold); font-size:12px; margin-bottom:4px;">🌱 Seeds Stock:</div><div style="display:grid; grid-template-columns:1fr 1fr; gap:4px; font-size:12px; margin-bottom:10px;">`;
    Object.entries(CROPS).forEach(([k, c]) => {
        html += `<div>${c.emoji} ${c.name}: ${G.seeds[k] || 0}</div>`;
    });
    html += `</div>`;

    // Harvested Crops View
    html += `<div style="font-weight:bold; color:var(--gold); font-size:12px; margin-bottom:4px;">🌾 Harvested Barn:</div><div style="display:grid; grid-template-columns:1fr 1fr; gap:4px; font-size:12px; margin-bottom:10px;">`;
    Object.entries(G.crops).forEach(([k, count]) => {
        html += `<div>${CROPS[k].emoji} ${CROPS[k].name}: ${count}</div>`;
    });
    html += `</div>`;

    // Cooked Food View
    html += `<div style="font-weight:bold; color:var(--gold); font-size:12px; margin-bottom:4px;">🍽️ Cooked Bags (Click to Eat):</div><div style="display:flex; flex-direction:column; gap:4px;">`;
    if (Object.keys(G.food).length === 0) {
        html += `<div style="font-size:11px; color:var(--text-dim);">कोई पका हुआ भोजन नहीं है।</div>`;
    } else {
        Object.entries(G.food).forEach(([rId, count]) => {
            if (count > 0) {
                html += `
                    <div style="display:flex; justify-content:space-between; background:var(--bg-card); padding:6px; border-radius:4px; align-items:center; font-size:12px;">
                        <span>${RECIPES[rId].emoji} <b>${RECIPES[rId].name}</b> (Qty: ${count})</span>
                        <button class="btn-primary" style="padding:2px 6px; font-size:10px;" onclick="eatFoodDirect('${rId}')">Eat (+${RECIPES[rId].xp} XP)</button>
                    </div>
                `;
            }
        });
    }
    html += `</div>`;

    document.getElementById('modal-body').innerHTML = html;
    document.getElementById('modal-actions').innerHTML = '<button class="btn-secondary" onclick="closeModal()">✕ Close Storage</button>';
    document.getElementById('modal-overlay').classList.add('show');
}

function eatFoodDirect(recipeId) {
    if ((G.food[recipeId] || 0) <= 0) return;
    G.food[recipeId]--;
    if (G.food[recipeId] <= 0) delete G.food[recipeId];
    
    addXP(RECIPES[recipeId].xp); // एक्सपी मिलेगी! (समस्या #4 फिक्स)
    toast(`🍽️ Ate ${RECIPES[recipeId].name}! +${RECIPES[recipeId].xp} XP`, 'success');
    log(`Ate ${RECIPES[recipeId].name} from storage`);
    
    saveGame();
    openHomeInventoryModal(); // री-ओपन ताकि वैल्यू अपडेट दिखे
    renderInventory();
}

// 🌱 PLANT SELECTION POPUP
function showPlantModal(plotId) {
    document.getElementById('modal-title').textContent = '🌱 Plant a Crop';
    document.getElementById('modal-subtitle').textContent = 'अपने बैग से एक बीज चुनें।';

    const body = document.createElement('div');
    body.className = 'inv-grid';
    body.style.gridTemplateColumns = '1fr';
    body.style.gap = '6px';

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
                btn.style.padding = '8px';
                btn.innerHTML = `<span>${crop.emoji} <b>${crop.name}</b> (Seeds: ${seedCount})</span> <span style="color:var(--green-light);">⏱ ${crop.growTime}s</span>`;
                btn.onclick = () => { plantCrop(plotId, key); closeModal(); };
                body.appendChild(btn);
            }
        }
    });

    if (!hasSeeds) body.innerHTML = '<div style="font-size:12px; color:var(--text-dim); text-align:center;">बीज खत्म हो गए हैं! नीचे बाज़ार से खरीदें।</div>';

    document.getElementById('modal-body').innerHTML = '';
    document.getElementById('modal-body').appendChild(body);
    document.getElementById('modal-actions').innerHTML = '<button class="btn-secondary" onclick="closeModal()">✕ Cancel</button>';
    document.getElementById('modal-overlay').classList.add('show');
}

function plantCrop(plotId, cropType) {
    if ((G.seeds[cropType] || 0) <= 0) return;
    G.seeds[cropType]--;
    G.plots[plotId] = { cropType, plantedAt: now(), state: 'growing' };
    toast(`🌱 Planted ${CROPS[cropType].name}!`, 'success');
    saveGame();
    renderInventory();
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
    renderInventory();
}

// ══════════════════════════════════════════════
// 4.2 SIDE BAR SKILL TREE & INVENTORY RENDERING (समस्या #1 फिक्स)
// ══════════════════════════════════════════════

function renderInventory() {
    // Resources View (समस्या #5 फिक्स)
    const resList = document.getElementById('res-list');
    if (resList) {
        resList.innerHTML = `
            <div class="res-row"><span>🪵 Wood:</span> <span class="res-val">${G.resources.wood || 0}</span></div>
            <div class="res-row"><span>🪨 Stone:</span> <span class="res-val">${G.resources.stone || 0}</span></div>
            <div class="res-row"><span>⚙️ Iron:</span> <span class="res-val">${G.resources.iron || 0}</span></div>
            <div class="res-row"><span>🥇 Gold:</span> <span class="res-val">${G.resources.gold || 0}</span></div>
        `;
    }

    // Side bars sync panels
    const seedInv = document.getElementById('seed-inv');
    if (seedInv) {
        seedInv.innerHTML = Object.entries(G.seeds).map(([k, count]) => `
            <div class="inv-item"><div>🌱</div><div class="i-count">${count}</div><div class="i-name">${CROPS[k].name}</div></div>
        `).join('');
    }

    const cropInv = document.getElementById('crop-inv');
    if (cropInv) {
        cropInv.innerHTML = Object.entries(G.crops).map(([k, count]) => `
            <div class="inv-item"><div>${CROPS[k].emoji}</div><div class="i-count">${count}</div><div class="i-name">${CROPS[k].name}</div></div>
        `).join('');
    }

    const foodInv = document.getElementById('food-inv');
    if (foodInv) {
        foodInv.innerHTML = Object.entries(G.food).map(([k, count]) => `
            <div class="cooking-active" style="padding:4px; margin-bottom:4px; background:var(--bg-card);">
                <span>${RECIPES[k].emoji}</span> <div style="flex:1; margin-left:6px; font-size:11px;"><b>${RECIPES[k].name}</b> (${count})</div>
                <button class="eat-btn" onclick="eatFoodFromSide('${k}')">Eat</button>
            </div>
        `).join('');
    }
}

function eatFoodFromSide(rId) {
    G.food[rId]--;
    if (G.food[rId] <= 0) delete G.food[rId];
    addXP(RECIPES[rId].xp); // एक्सपी मिलेगी!
    toast(`🍽️ Ate ${RECIPES[rId].name}!`, 'success');
    saveGame();
    renderInventory();
}

// 🌴 LIVE SKILL TREE IN ENGINE (समзации #1)
function renderSkillTree() {
    const cont = document.getElementById('skill-tree');
    if (!cont) return;
    cont.innerHTML = '';

    const PILLARS = [
        { name: '🌾 Farmer', skills: [{ id:'crop_sense', name:'Crop Sense', sp:1, req:3, desc:'+10% Tier 1 Yield' }] },
        { name: '🍳 Chef', skills: [{ id:'quick_hands', name:'Quick Hands', sp:1, req:4, desc: '-10% Cook Time' }] },
        { name: '🪓 Gatherer', skills: [{ id:'forest_eye', name:'Forest Eye', sp:1, req:2, desc: '+15% Wood per Chop' }] },
        { name: '🔨 Tool-Smith', skills: [{ id:'sturdy_grip', name:'Sturdy Grip', sp:1, req:5, desc: '+20% Durability' }] }
    ];

    PILLARS.forEach(p => {
        let html = `<div style="font-weight:bold; color:var(--gold); margin-top:6px; font-size:12px;">${p.name}</div>`;
        p.skills.forEach(s => {
            const unlocked = G.unlockedSkills.includes(s.id);
            const canUnlock = !unlocked && G.level >= s.req && G.skillPoints >= s.sp;
            
            html += `
                <div style="background:var(--bg-mid); border:1px solid ${unlocked?'var(--green)':'var(--border)'}; padding:6px; border-radius:4px; margin-bottom:4px; display:flex; justify-content:space-between; align-items:center;">
                    <div style="font-size:11px;"><b>${unlocked?'✅ ':''}${s.name}</b><br><span style="color:var(--text-dim); font-size:10px;">Req: Lvl ${s.req} | ${s.desc}</span></div>
                    <button class="btn-primary" style="padding:2px 4px; font-size:9px;" ${canUnlock?'':'disabled'} onclick="unlockSkillDirect('${s.id}', ${s.sp})">${unlocked?'Active':'Unlock'}</button>
                </div>
            `;
        });
        cont.innerHTML += html;
    });
}

function unlockSkillDirect(sId, cost) {
    if(G.skillPoints < cost) return;
    G.skillPoints -= cost;
    G.unlockedSkills.push(sId);
    toast('🎯 Skill Unlocked!', 'gold');
    saveGame();
    updateHeader();
    renderSkillTree();
}

// ══════════════════════════════════════════════
// 4.3 MARKETPLACE & DYNAMIC COOKING RECIPES (समस्या #3 फिक्स)
// ══════════════════════════════════════════════

function renderMarketplace() {
    const cont = document.getElementById('market-container');
    if (!cont) return;
    cont.innerHTML = '<div style="display:grid; grid-template-columns:1fr 1fr; gap:4px;"></div>';
    const grid = cont.firstChild;

    Object.entries(CROPS).forEach(([key, crop]) => {
        if (G.level >= crop.unlockLevel) {
            const box = document.createElement('div');
            box.className = 'inv-item';
            box.style.textAlign = 'left';
            box.style.padding = '4px';
            box.innerHTML = `
                <div style="font-size:11px;"><b>${crop.name}</b></div>
                <div style="font-size:9px; color:var(--text-dim);">Seed: ${crop.seedPrice}K | Crop: ${crop.kodi}K</div>
                <button class="btn-primary" style="padding:2px 4px; font-size:9px; margin-top:2px;" onclick="buySeed('${key}', ${crop.seedPrice})">Buy Seed</button>
                <button class="btn-secondary" style="padding:2px 4px; font-size:9px; margin-top:2px; color:var(--gold);" onclick="sellCrop('${key}', ${crop.kodi})">Sell</button>
            `;
            grid.appendChild(box);
        }
    });
}

function buySeed(cropType, price) {
    if (G.kodi < price) return;
    G.kodi -= price;
    G.seeds[cropType] = (G.seeds[cropType] || 0) + 1;
    toast('🛒 Bought Seed!', 'success');
    saveGame();
    updateHeader();
    renderInventory();
}

function sellCrop(cropType, reward) {
    if ((G.crops[cropType] || 0) <= 0) return;
    G.crops[cropType]--;
    G.kodi += reward;
    toast('💰 Crop Sold!', 'gold');
    saveGame();
    updateHeader();
    renderInventory();
}

// FIREPIT RECIPES DISPLAY FIX (समस्या #3 का हल)
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
            div.innerHTML = `🔥 <b>Stone Firepit</b><br><span style="font-size:11px; color:var(--gold-light);">${recipe.name}: ${done ? '✅ Ready!' : remaining + 's remaining'}</span><br><button class="btn-primary" style="margin-top:4px;" ${done?'':'disabled'} onclick="collectFood('firepit')">Collect Food</button>`;
        } else {
            // Show all recipes mapped to Firepit
            let recipeButtons = '';
            Object.entries(RECIPES).forEach(([rId, r]) => {
                if(r.building === 'firepit') {
                    const canCook = Object.entries(r.ingredients).every(([c, amt]) => (G.crops[c] || 0) >= amt);
                    recipeButtons += `<button class="btn-secondary" style="padding:2px 4px; font-size:9px; margin-right:4px; margin-top:4px;" ${canCook?'':'disabled'} onclick="startCooking('firepit','${rId}')">${r.emoji} ${r.name}</button>`;
                }
            });
            div.innerHTML = `🔥 <b>Stone Firepit (Cook Foods)</b><br>${recipeButtons}`;
        }
        cont.appendChild(div);
    }
}

function startCooking(bId, rId) {
    const recipe = RECIPES[rId];
    Object.entries(recipe.ingredients).forEach(([c, amt]) => G.crops[c] -= amt);
    G.buildings[bId] = { recipe: rId, startedAt: now() };
    saveGame();
    renderInventory();
    renderBuildings();
}

function collectFood(bId) {
    const cooking = G.buildings[bId];
    G.food[cooking.recipe] = (G.food[cooking.recipe] || 0) + 1;
    delete G.buildings[bId];
    toast('🍽️ Food Added to Chief House Box!', 'success');
    saveGame();
    renderInventory();
    renderBuildings();
}

function closeModal() { document.getElementById('modal-overlay').classList.remove('show'); }

function renderAll() {
    updateHeader();
    renderInventory();
    renderMarketplace();
    renderBuildings();
}

window.onload = () => {
    renderAll();
    setInterval(checkWilt, 2000);
    setInterval(renderBuildings, 2000);
};
