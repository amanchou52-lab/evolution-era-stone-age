// ══════════════════════════════════════════════
// 3.1 MASTER DATA STRUCTURE (GDD v3.0 CONSTANTS)
// ══════════════════════════════════════════════

const CROPS = {
    // Tier 1 (Level 1-10, No tools required)
    potato:  { name:'Potato',  emoji:'🥔', growTime:30,    xp:5,    kodi:1,  tier:1, unlockLevel:1,  wiltTime:60,   seedPrice:5 },
    chilli:  { name:'Chilli',  emoji:'🌶️', growTime:120,   xp:20,   kodi:5,  tier:1, unlockLevel:1,  wiltTime:240,  seedPrice:12 },
    tomato:  { name:'Tomato',  emoji:'🍅', growTime:900,   xp:50,   kodi:12, tier:1, unlockLevel:3,  wiltTime:1800, seedPrice:25 },
    brinjal: { name:'Brinjal', emoji:'🍆', growTime:1800,  xp:80,   kodi:20, tier:1, unlockLevel:5,  wiltTime:3600, seedPrice:35 },
    cabbage: { name:'Cabbage', emoji:'🥬', growTime:3600,  xp:120,  kodi:35, tier:1, unlockLevel:7,  wiltTime:7200, seedPrice:50 },
    // Tier 2 (Level 11-20, Stone Hoe + Well required)
    corn:    { name:'Wild Corn',emoji:'🌽',growTime:43200, xp:800,  kodi:200,tier:2, unlockLevel:11, wiltTime:86400, seedPrice:200 },
    beans:   { name:'Anc. Beans',emoji:'🫘',growTime:57600,xp:1100, kodi:280,tier:2, unlockLevel:12, wiltTime:115200,seedPrice:280 },
    pumpkin: { name:'Big Pumpkin',emoji:'🎃',growTime:72000,xp:1400,kodi:360,tier:2, unlockLevel:14, wiltTime:144000,seedPrice:360 },
    carrot:  { name:'Golden Carrot',emoji:'🥕',growTime:86400,xp:1800,kodi:450,tier:2, unlockLevel:16, wiltTime:172800,seedPrice:450 },
    // Tier 3 (Level 21-25, Iron Pickaxe required for Gold Era)
    wheat:   { name:'Ancient Wheat',emoji:'🌾',growTime:172800,xp:4500,kodi:1200,tier:3,unlockLevel:21,wiltTime:345600,seedPrice:1200 },
    cotton:  { name:'Primeval Cotton',emoji:'🌱',growTime:216000,xp:5800,kodi:1600,tier:3,unlockLevel:22,wiltTime:432000,seedPrice:1600 },
    melon:   { name:'Stone Melon',emoji:'🍉',growTime:259200,xp:7200,kodi:2000,tier:3,unlockLevel:23,wiltTime:518400,seedPrice:2000 }
};

const RECIPES = {
    baked_potato:   { name:'Baked Potato', emoji:'🥔', building:'firepit', ingredients:{ potato:1 }, cookTime:30, xp:5, tier:1 },
    veggie_wrap:    { name:'Veggie Wrap', emoji:'🌮', building:'firepit', ingredients:{ cabbage:1, chilli:5 }, cookTime:900, xp:150, tier:1 },
    spiced_brinjal: { name:'Spiced Brinjal', emoji:'🍆', building:'firepit', ingredients:{ brinjal:2, chilli:3 }, cookTime:1200, xp:180, tier:1 },
    tomato_soup:    { name:'Tomato Soup', emoji:'🍲', building:'clay_oven', ingredients:{ tomato:3, chilli:1 }, cookTime:1800, xp:300, tier:1 },
    bean_stew:      { name:'Bean Stew', emoji:'🫕', building:'clay_oven', ingredients:{ beans:3, chilli:5 }, cookTime:3600, xp:1200, tier:2 },
    carrot_glaze:   { name:'Carrot Glaze', emoji:'🥕', building:'clay_oven', ingredients:{ carrot:1, potato:50 }, cookTime:14400, xp:4000, tier:2 },
    ancient_bread:  { name:'Ancient Bread', emoji:'🍞', building:'ancient_hearth', ingredients:{ wheat:1, corn:10, potato:20 }, cookTime:28800, xp:6500, tier:3 },
    melon_nectar:   { name:'Melon Nectar', emoji:'🥤', building:'ancient_hearth', ingredients:{ melon:1, cabbage:5, tomato:5 }, cookTime:64800, xp:8000, tier:3 },
    evolution_feast:{ name:'Evolution Feast', emoji:'🍖', building:'ancient_hearth', ingredients:{ wheat:1, cotton:1, melon:1, potato:20, chilli:5, tomato:3, brinjal:2, cabbage:1 }, cookTime:86400, xp:9500, tier:3 }
};

const NODE_INFO = {
    wood:  { emoji:'🪵', name:'Wood Tree',  cooldown:14400, yield:[10,21], resource:'wood' },  // 4 घंटे
    stone: { emoji:'🪨', name:'Stone Rock', cooldown:21600, yield:[8,16],  resource:'stone' }, // 6 घंटे
    iron:  { emoji:'⚙️', name:'Iron Vein',  cooldown:28800, yield:[5,11],  resource:'iron' },  // 8 घंटे
    gold:  { emoji:'🥇', name:'Gold Node',  cooldown:43200, yield:[2,6],   resource:'gold' }   // 12 घंटे
};

// 25 लेवल्स के लिए हार्डकोर कंपाउन्डिंग XP टेबल
const XP_TABLE = [
    0, 100, 238, 428, 690, 1052, 1552, 2242, 3194, 4508, 6322, 
    8825, 12279, 17046, 23624, 32702, 45230, 62518, 86375, 119297, 
    164729, 227425, 313945, 433343, 598112
];

// टेस्ट मोड के लिए इन-गेम स्टोरेज लिमिट्स (Section 9)
const STORAGE_CAPS = {
    potato: 1000, tier1: 600, tier2: 150, tier3: 65, food: 50,
    wood: 2000, stone: 1500, iron: 800, gold: 300
};

// ══════════════════════════════════════════════
// 3.2 INITIAL LOCAL STATE SYSTEM (SAVING / LOADING)
// ══════════════════════════════════════════════

let G = loadGame() || {
    level: 1,
    xp: 0,
    kodi: 200, // शुरुआती कोडी
    skillPoints: 0,
    unlockedSkills: [],
    resetCount: 0,
    resources: { wood: 0, stone: 0, iron: 0, gold: 0 },
    seeds: { potato: 10, chilli: 5 }, // शुरुआत में 10 आलू और 5 मिर्च के बीज
    crops: { potato: 0, chilli: 0, tomato: 0, brinjal: 0, cabbage: 0, corn: 0, beans: 0, pumpkin: 0, carrot: 0, wheat: 0, cotton: 0, melon: 0 },
    food: {},
    tools: { stone_hoe: 50, stone_axe: 50, stone_pickaxe: 50, iron_hoe: 100, iron_axe: 100, iron_pickaxe: 100 }, // ड्यूरेबिलिटी
    plots: {},       // gridId -> { cropType, plantedAt, state }
    nodes: {},       // gridId -> { lastHarvestedAt }
    buildings: {},   // buildingId -> { recipeId, startedAt }
    unlockedIslands: [1, 2, 3, 4], // पहले 4 स्टार्टर टापू फ्री हैं
    unlockedBuildings: ['firepit'],
    npcOrders: {},   // npcId -> { orderIdx, assignedAt }
    actionLog: [],
    lastSave: Date.now()
};

function saveGame() {
    G.lastSave = Date.now();
    localStorage.setItem('evolution_era_v3_save', JSON.stringify(G));
}

function loadGame() {
    const s = localStorage.getItem('evolution_era_v3_save');
    if (!s) return null;
    try { return JSON.parse(s); } catch(e) { return null; }
}

// ══════════════════════════════════════════════
// 3.3 CORE GAME LOOP LOGIC & UTILITIES
// ══════════════════════════════════════════════

function now() { return Math.floor(Date.now() / 1000); }

function formatTime(sec) {
    if (sec <= 0) return 'Ready!';
    if (sec < 60) return sec + 's';
    if (sec < 3600) return Math.floor(sec/60) + 'm ' + (sec%60) + 's';
    return Math.floor(sec/3600) + 'h ' + Math.floor((sec%3600)/60) + 'm';
}

function toast(msg, type='') {
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.textContent = msg;
    const container = document.getElementById('toast-container');
    if (container) {
        container.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    }
}

function log(msg) {
    G.actionLog.unshift('• ' + msg);
    if (G.actionLog.length > 25) G.actionLog.pop();
    const el = document.getElementById('action-log');
    if (el) el.innerHTML = G.actionLog.slice(0, 15).join('<br>');
}

function xpForLevel(lvl) { return XP_TABLE[lvl] || 999999; }

// स्टोरेज सॉफ्ट-कैप की जांच (Section 9)
function isStorageFull(itemType, category, amountToAdd) {
    let currentCount = 0;
    let cap = STORAGE_CAPS.potato;

    if (category === 'crops') {
        currentCount = G.crops[itemType] || 0;
        let tier = CROPS[itemType].tier;
        cap = (itemType === 'potato') ? STORAGE_CAPS.potato : (tier === 1 ? STORAGE_CAPS.tier1 : (tier === 2 ? STORAGE_CAPS.tier2 : STORAGE_CAPS.tier3));
    } else if (category === 'resources') {
        currentCount = G.resources[itemType] || 0;
        cap = STORAGE_CAPS[itemType] || 1000;
    } else if (category === 'food') {
        currentCount = G.food[itemType] || 0;
        cap = STORAGE_CAPS.food;
    }

    if (currentCount + amountToAdd > cap) {
        toast(`⚠️ बैग फुल! आपकी इन-गेम स्टोरेज लिमिट (${cap}) फुल है। ट्राइबल बाज़ार में कुछ सामान बेचें!`, 'error');
        return true;
    }
    return false;
}

// ओवरक्रॉप प्रोटेक्शन: विल्ट मैकेनिक (Rule 2 - Real Time Offline)
function checkWilt() {
    let changed = false;
    let currentTime = now();

    Object.entries(G.plots).forEach(([plotId, plot]) => {
        if (plot.state === 'wilted') return;
        const crop = CROPS[plot.cropType];
        if (!crop) return;

        const elapsed = currentTime - plot.plantedAt;
        if (elapsed > (crop.growTime + crop.wiltTime)) {
            G.plots[plotId].state = 'wilted';
            changed = true;
            log(`🥀 अलार्म: समय पर फसल न काटने के कारण ${crop.name} मुरझा (Wilt) गई है! 50% नुकसान।`);
        }
    });
    if (changed && typeof renderGrid === 'function') { saveGame(); renderGrid(); }
}

// टूल्स ड्यूरेबिलिटी लॉजिक (Section 6)
function deductToolDurability(toolKey) {
    if (G.tools[toolKey] <= 0) {
        toast(`❌ आपका ${toolKey.replace('_', ' ').toUpperCase()} टूट चुका है! नया बनाएं।`, 'error');
        return false;
  }
  
  let durabilityLoss = 1;
  if (G.unlockedSkills.includes('sturdy_grip') && Math.random() < 0.2) {
      durabilityLoss = 0; // 20% चांस कि लाइफ कम न हो
  }
  
  G.tools[toolKey] -= durabilityLoss;
  if (G.tools[toolKey] === 0) {
      log(`⚠️ अलार्म: लगातार काम करने के कारण आपका औजार (${toolKey.replace('_', ' ')}) पूरी तरह टूट गया!`);
  }
  return true;
}

function addXP(amount) {
    if (G.unlockedSkills.includes('master_chef') && Math.random() < 0.1) {
        amount *= 2; // मास्टर शेफ डबल एक्सपी प्रोक
        toast('⚡ डबल XP प्रोक! मास्टर शेफ की कला चमकी!', 'gold');
    }
    G.xp += amount;
    while (G.level < 25 && G.xp >= xpForLevel(G.level)) {
        G.level++;
        G.skillPoints++;
        toast(`🎉 लेवल अप! अब आप लेवल ${G.level} पर हैं!`, 'gold');
        log(`Reached Level ${G.level}!`);
    }
    saveGame();
}

// ══════════════════════════════════════════════
// 3.4 STARTER INITIALIZER UNIT
// ══════════════════════════════════════════════
if (G.actionLog.length === 0) {
    log('Welcome to Evolution Era v3.0 Test Engine!');
    log('Islands 1 & 2 पर Wood Trees मौजूद हैं, पहले Wood chop करें!');
    saveGame();
}
