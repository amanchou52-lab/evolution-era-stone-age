// ══════════════════════════════════════════════
// 4.1 TABS CONTROL & GENERAL UPDATES
// ══════════════════════════════════════════════

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Find button using onclick attribute match or text
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

// ══════════════════════════════════════════════
// 4.2 INVENTORY RENDERER
// ══════════════════════════════════════════════

function renderInventory() {
    // 1. Resources Tab (Wood, Stone, Iron, Gold)
    const resList = document.getElementById('res-list');
    const resources = [
        { key:'wood',  emoji:'🪵', name:'Wood' },
        { key:'stone', emoji:'🪨', name:'Stone' },
        { key:'iron',  emoji:'⚙️', name:'Iron' },
        { key:'gold',  emoji:'🥇', name:'Gold' }
    ];
    
    let resHtml = '';
    resources.forEach(r => {
        resHtml += `
            <div class="res-row">
                <div class="res-left"><span class="res-emoji">${r.emoji}</span><span class="res-name">${r.name}</span></div>
                <span class="res-val">${G.resources[r.key] || 0}</span>
            </div>
        `;
    });
    if(resList) resList.innerHTML = resHtml;

    // 2. Seeds Tab
    const seedInv = document.getElementById('seed-inv');
    if (seedInv) {
        seedInv.innerHTML = '';
        Object.entries(CROPS).forEach(([key, crop]) => {
            const count = G.seeds[key] || 0;
            if (count > 0 || G.level >= crop.unlockLevel) {
                const div = document.createElement('div');
                div.className = 'inv-item';
                div.innerHTML = `
                    <div class="i-emoji">🌱</div>
                    <div class="i-count">${count}</div>
                    <div class="i-name">${crop.name} Seed</div>
                `;
                seedInv.appendChild(div);
            }
        });
    }

    // 3. Crops Tab
    const cropInv = document.getElementById('crop-inv');
    if (cropInv) {
        cropInv.innerHTML = '';
        Object.entries(G.crops).forEach(([key, count]) => {
            if (count > 0 || G.level >= CROPS[key].unlockLevel) {
                const div = document.createElement('div');
                div.className = 'inv-item';
                div.innerHTML = `
                    <div class="i-emoji">${CROPS[key].emoji}</div>
                    <div class="i-count">${count}</div>
                    <div class="i-name">${CROPS[key].name}</div>
                `;
                cropInv.appendChild(div);
            }
        });
    }

    // 4. Food Tab
    const foodInv = document.getElementById('food-inv');
    if (foodInv) {
        foodInv.innerHTML = '';
        if (Object.keys(G.food).length === 0) {
            foodInv.innerHTML = '<div style="font-size:12px;color:var(--text-dim);text-align:center;padding:10px;">No cooked food yet.<br>Firepit में खाना पकाएं!</div>';
        } else {
            Object.entries(G.food).forEach(([rId, count]) => {
                if (count <= 0) return;
                const recipe = RECIPES[rId];
                if (!recipe) return;
                const div = document.createElement('div');
                div.className = 'cooking-active';
                div.style.padding = '8px';
                div.style.background = 'var(--bg-card)';
                div.style.border = '1px solid var(--border)';
                div.style.borderRadius = '6px';
                div.style.marginBottom = '6px';
                div.innerHTML = `
                    <div class="ca-emoji">${recipe.emoji}</div>
                    <div class="ca-info" style="margin-left: 8px;">
                        <div class="ca-name" style="font-weight:600;color:var(--text-bright);">${recipe.name}</div>
                        <div class="ca-timer" style="font-size:11px;color:var(--green-light);">+${recipe.xp} XP • Qty: ${count}</div>
                    </div>
                    <button class="eat-btn" onclick="eatFood('${rId}')" style="margin-left:auto;">🍽️ Eat</button>
                `;
                foodInv.appendChild(div);
            });
        }
    }
}

function eatFood(recipeId) {
    if ((G.food[recipeId] || 0) <= 0) return;
    const recipe = RECIPES[recipeId];
    G.food[recipeId]--;
    if (G.food[recipeId] <= 0) delete G.food[recipeId];
    
    addXP(recipe.xp);
    toast(`🍽️ Ate ${recipe.name}! +${recipe.xp} XP`, 'success');
    log(`Ate ${recipe.name} (+${recipe.xp} XP)`);
    renderInventory();
}

// ══════════════════════════════════════════════
// 4.3 MARKETPLACE & COOKING BUILDING INTERFACES
// ══════════════════════════════════════════════

function renderMarketplace() {
    const cont = document.getElementById('market-container');
    if (!cont) return;
    cont.innerHTML = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;"></div>';
    const grid = cont.firstChild;

    Object.entries(CROPS).forEach(([key, crop]) => {
        if (G.level >= crop.unlockLevel) {
            const box = document.createElement('div');
            box.className = 'inv-item';
            box.style.textAlign = 'left';
            box.style.padding = '8px';
            box.innerHTML = `
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                    <span style="font-size:20px;">🌱</span>
                    <div>
                        <div style="font-weight:600;font-size:13px;color:var(--text-bright);">${crop.name} Seed</div>
                        <div style="font-size:11px;color:var(--gold-light);">💰 Buy: ${crop.seedPrice} Kodi</div>
                    </div>
                </div>
                <div style="display:flex;gap:4px;">
                    <button class="btn-primary" style="padding:3px 6px;font-size:10px;" onclick="buySeed('${key}', ${crop.seedPrice})">Buy</button>
                    <button class="btn-secondary" style="padding:3px 6px;font-size:10px;color:var(--gold);" onclick="sellCrop('${key}', ${crop.kodi})">Sell Crop (${crop.kodi}K)</button>
                </div>
            `;
            grid.appendChild(box);
        }
    });
}

function buySeed(cropType, price) {
    if (G.kodi < price) {
        toast('❌ पर्याप्त Kodi नहीं है!', 'error');
        return;
    }
    if (isStorageFull(cropType, 'crops', 1)) return; // Storage capacity check

    G.kodi -= price;
    G.seeds[cropType] = (G.seeds[cropType] || 0) + 1;
    toast(`🛒 Bought 1x ${CROPS[cropType].name} Seed!`, 'success');
    saveGame();
    updateHeader();
    renderInventory();
    renderMarketplace();
}

function sellCrop(cropType, reward) {
    if ((G.crops[cropType] || 0) <= 0) {
        toast(`❌ आपके पास बेचने के लिए ${CROPS[cropType].name} नहीं है!`, 'error');
        return;
    }
    G.crops[cropType]--;
    G.kodi += reward;
    toast(`💰 Sold 1x ${CROPS[cropType].name}! +${reward} Kodi`, 'gold');
    saveGame();
    updateHeader();
    renderInventory();
}

function renderBuildings() {
    const cont = document.getElementById('buildings-container');
    if (!cont) return;
    cont.innerHTML = '';

    const BUILDINGS_DATA = {
        firepit: { name: 'Stone Firepit', emoji: '🔥', tier: 1 },
        clay_oven: { name: 'Clay Oven', emoji: '🏺', tier: 2 },
        ancient_hearth: { name: 'Ancient Hearth', emoji: '🏛️', tier: 3 }
    };

    Object.entries(BUILDINGS_DATA).forEach(([bId, bData]) => {
        if (!G.unlockedBuildings.includes(bId)) return;

        const div = document.createElement('div');
        div.className = 'inv-item';
        div.style.textAlign = 'left';
        div.style.padding = '10px';
        div.style.marginBottom = '8px';

        const cooking = G.buildings[bId];
        let statusHtml = '';

        if (cooking) {
            const recipe = RECIPES[cooking.recipe];
            const elapsed = now() - cooking.startedAt;
            const remaining = Math.max(0, recipe.cookTime - elapsed);
            const done = remaining === 0;

            statusHtml = `
                <div style="display:flex;align-items:center;gap:10px;background:var(--bg-mid);padding:6px;border-radius:6px;margin-top:6px;">
                    <span style="font-size:22px;">${recipe.emoji}</span>
                    <div style="flex:1;">
                        <div style="font-size:12px;color:var(--green-light);font-weight:600;">Cooking: ${recipe.name}</div>
                        <div style="font-size:10px;color:var(--text-dim);">${done ? '✅ Ready!' : '⏳ ' + formatTime(remaining)}</div>
                    </div>
                    <button class="btn-primary" style="padding:4px 8px;font-size:11px;" ${done ? '' : 'disabled'} onclick="collectFood('${bId}')">Collect</button>
                </div>
            `;
        } else {
            statusHtml = `<div style="font-size:11px;color:var(--text-dim);margin-top:4px;">Available Recipes:</div><div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:4px;">`;
            Object.entries(RECIPES).forEach(([rId, recipe]) => {
                if (recipe.building !== bId) return;
                const canCook = Object.entries(recipe.ingredients).every(([c, amt]) => (G.crops[c] || 0) >= amt);
                
                statusHtml += `
                    <button class="btn-secondary" style="padding:3px 6px;font-size:10px;border-color:${canCook?'var(--green)':'var(--border)'}" ${canCook?'':'disabled'} onclick="startCooking('${bId}','${rId}')">
                        ${recipe.emoji} ${recipe.name}
                    </button>
                `;
            });
            statusHtml += `</div>`;
        }

        div.innerHTML = `
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:24px;">${bData.emoji}</span>
                <span style="font-family:'Cinzel',serif;font-size:13px;color:var(--gold);font-weight:600;">${bData.name}</span>
            </div>
            ${statusHtml}
        `;
        cont.appendChild(div);
    });
}

function startCooking(bId, rId) {
    const recipe = RECIPES[rId];
    Object.entries(recipe.ingredients).forEach(([c, amt]) => G.crops[c] -= amt);
    
    G.buildings[bId] = { recipe: rId, startedAt: now() };
    toast(`🔥 Cooking ${recipe.name}...`, 'success');
    saveGame();
    renderInventory();
    renderBuildings();
}

function collectFood(bId) {
    const cooking = G.buildings[bId];
    if (!cooking) return;
    
    if (isStorageFull(cooking.recipe, 'food', 1)) return; // Food cap check

    G.food[cooking.recipe] = (G.food[cooking.recipe] || 0) + 1;
    delete G.buildings[bId];
    
    toast('✅ Food collected! ट्राइबल बैग से खाएं।', 'success');
    saveGame();
    renderInventory();
    renderBuildings();
}

// ══════════════════════════════════════════════
// 4.4 TRIBAL NPCS & REBALANCED SKILLS
// ══════════════════════════════════════════════

const NPCS_DATA = [
    { id:'granny', name:'Granny Kova', emoji:'👵', desc:'Basic tier 1 foods requirements' },
    { id:'chieftain', name:'Chieftain Brul', emoji:'👨‍🦱', desc:'Requires wood, stones & raw materials' },
    { id:'wanderer', name:'Wanderer Tesh', emoji:'🧙', desc:'Advanced multi-tier special recipes' }
];

function renderNPCs() {
    const cont = document.getElementById('npc-container');
    if (!cont) return;
    cont.innerHTML = '';

    NPCS_DATA.forEach(npc => {
        if (!G.npcOrders[npc.id]) {
            G.npcOrders[npc.id] = { orderIdx: Math.floor(Math.random() * 3), assignedAt: now() };
        }

        // Hardcoded custom local orders balance per NPC for testing
        const ordersList = {
            granny: [{ want:'baked_potato', amt:3, reward:30 }, { want:'veggie_wrap', amt:1, reward:60 }, { want:'spiced_brinjal', amt:1, reward:80 }],
            chieftain: [{ want:'potato', amt:20, isRaw:true, reward:40 }, { want:'chilli', amt:10, isRaw:true, reward:50 }, { want:'tomato', amt:5, isRaw:true, reward:60 }],
            wanderer: [{ want:'bean_stew', amt:1, reward:250 }, { want:'carrot_glaze', amt:1, reward:500 }, { want:'evolution_feast', amt:1, reward:990 }]
        };

        const order = ordersList[npc.id][G.npcOrders[npc.id].orderIdx % 3];
        const hasItems = order.isRaw ? (G.crops[order.want] || 0) >= order.amt : (G.food[order.want] || 0) >= order.amt;

        const card = document.createElement('div');
        card.className = 'inv-item';
        card.style.textAlign = 'left';
        card.style.padding = '8px';
        card.style.marginBottom = '6px';
        card.innerHTML = `
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                <span style="font-size:24px;">${npc.emoji}</span>
                <span style="font-family:'Cinzel',serif;font-size:12px;color:var(--gold-light);font-weight:600;">${npc.name}</span>
            </div>
            <div style="font-size:11px;color:var(--text-bright);margin-bottom:4px;">
                📦 Wants: ${order.amt}x ${order.isRaw ? CROPS[order.want].name : RECIPES[order.want].name}
                <div style="color:var(--gold);">💰 Reward: ${order.reward} Kodi</div>
            </div>
            <button class="deliver-btn" style="width:100%;padding:4px;font-size:11px;" ${hasItems ? '' : 'disabled'} onclick="deliverNPCOrder('${npc.id}', ${order.isRaw?true:false}, '${order.want}', ${order.amt}, ${order.reward})">
                Deliver Items
            </button>
        `;
        cont.appendChild(card);
    });
}

function deliverNPCOrder(npcId, isRaw, itemKey, amt, reward) {
    if (isRaw) G.crops[itemKey] -= amt;
    else G.food[itemKey] -= amt;

    G.kodi += reward;
    G.npcOrders[npcId].orderIdx++;
    G.npcOrders[npcId].assignedAt = now();

    toast(`✅ Order Delivered! +${reward} Kodi`, 'gold');
    saveGame();
    updateHeader();
    renderInventory();
    renderNPCs();
    renderMarketplace();
}

function renderSkillTree() {
    const cont = document.getElementById('skill-tree');
    if(!cont) return;
    cont.innerHTML = '<div style="font-size:11px;color:var(--text-dim);text-align:center;padding:12px;">Skill Tree UI Under Construction.<br>Phaser World Integration active.</div>';
}

function triggerReset() {
    if(G.kodi < 200) { toast('❌ Reset के लिए 200 Kodi चाहिए!', 'error'); return; }
    G.kodi -= 200;
    G.skillPoints += G.unlockedSkills.length;
    G.unlockedSkills = [];
    toast('🎯 Skills Reset Completed!', 'success');
    saveGame();
    updateHeader();
    renderInventory();
}

// ══════════════════════════════════════════════
// 4.5 UNIFIED INTERFACE INITIALIZATION
// ══════════════════════════════════════════════

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
    setInterval(renderBuildings, 2000); // Live updates for timers
};
