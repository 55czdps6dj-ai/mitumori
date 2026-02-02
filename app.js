let currentStep = 1;
let counts = JSON.parse(localStorage.getItem('counts')) || {};
let freeItems = JSON.parse(localStorage.getItem('freeItems')) || [];
let customOptions = JSON.parse(localStorage.getItem('customOptions')) || [];

// 指定された新料金テーブル
const truckPrices = {
    "2tショート": 34500,
    "2tロング": 34500,
    "3t車": 36500,
    "4t車": 41000
};

const optionMaster = [
    { name: "エアコン脱着", price: 16500 },
    { name: "洗濯機設置", price: 3300 },
    { name: "不用品処分", price: 0 },
    { name: "養生費", price: 5500 }
];

const itemMaster = {};
Object.values(categorizedMoveData).forEach(items => items.forEach(i => itemMaster[i.n] = i.p));

function init() {
    renderAccordion();
    renderOptions();
    renderCustomOptions();
    setupSearch();
    updateUI();
}

function updateUI() {
    let pts = 0;
    Object.keys(counts).forEach(n => pts += counts[n] * (itemMaster[n] || 0));
    freeItems.forEach(i => pts += i.p * i.q);
    document.getElementById('total-points').textContent = pts;

    // 推奨車両判定
    let suggested = pts <= 200 ? "2tショート" : (pts <= 350 ? "2tロング" : (pts <= 500 ? "3t車" : "4t車"));
    document.getElementById('truck-suggest').textContent = `推奨: ${suggested}`;

    // 入力値取得
    const truckType = document.getElementById('truck-type').value;
    const truckCount = parseInt(document.getElementById('truck-count').value) || 1;
    const staffCount = parseInt(document.getElementById('staff-count').value) || 2;
    const staffUnitPrice = parseInt(document.getElementById('staff-unit-price').value) || 0;
    const pricePerPt = parseInt(document.getElementById('price-per-pt').value) || 0;
    const dayFactor = parseInt(document.getElementById('day-factor').value) / 100;

    // 運行コスト = (車両単価 * 台数) + (作業員 * 単価) + (家財量 * pt単価)
    const truckTotal = truckPrices[truckType] * truckCount;
    const staffTotal = staffCount * staffUnitPrice;
    const volumeTotal = pts * pricePerPt;
    const baseCombined = truckTotal + staffTotal + volumeTotal;

    // 現在条件（係数あり）
    let currentBase = baseCombined * dayFactor;

    // 付帯合計
    let optTotal = 0;
    document.querySelectorAll('.opt-check:checked, .custom-opt-check:checked').forEach(el => {
        optTotal += parseInt(el.closest('.opt-row').querySelector('input[type="number"]').value) || 0;
    });

    // 割引適用
    let discountVal = parseInt(document.getElementById('special-discount').value) || 0;
    let discountRate = (100 - (parseInt(document.getElementById('discount-rate').value) || 0)) / 100;
    
    let final = Math.floor((currentBase + optTotal - discountVal) * discountRate);
    let stdFinal = baseCombined + optTotal; // 平日目安（係数1.0）

    // 表示反映
    document.getElementById('row-base').textContent = "¥" + Math.floor(currentBase).toLocaleString();
    document.getElementById('row-base-std').textContent = "¥" + Math.floor(baseCombined).toLocaleString();
    document.getElementById('row-opt').textContent = "¥" + optTotal.toLocaleString();
    document.getElementById('row-opt-std').textContent = "¥" + optTotal.toLocaleString();
    document.getElementById('final-price').textContent = "¥ " + final.toLocaleString();
    document.getElementById('std-price').textContent = "¥ " + stdFinal.toLocaleString();

    let diff = stdFinal - final;
    const msgEl = document.getElementById('price-diff-msg');
    msgEl.innerHTML = diff > 0 ? `<span style="color:green;">標準より ¥${diff.toLocaleString()} お得！</span>` : (diff < 0 ? `<span style="color:red;">条件加算: ¥${Math.abs(diff).toLocaleString()}</span>` : "");
}

// --- 他の補助関数 (Accordion, Search, CustomOption, moveStep 等は前回と同様) ---
// (文字数制限のため、ここには主要な計算ロジックを優先して記載しています)
// (実際の運用時は、前回の app.js にこの updateUI を上書きしてください)

function renderAccordion() {
    const container = document.getElementById('accordion-container');
    container.innerHTML = '';
    for (const [cat, items] of Object.entries(categorizedMoveData)) {
        const div = document.createElement('div');
        div.className = 'category-group';
        div.innerHTML = `<div class="cat-header" onclick="this.parentElement.classList.toggle('open')">${cat} <span>▼</span></div><div class="cat-body"></div>`;
        const body = div.querySelector('.cat-body');
        items.forEach(item => body.appendChild(createItemRow(item)));
        container.appendChild(div);
    }
}
function createItemRow(item) {
    const row = document.createElement('div'); row.className = 'item-row';
    const q = counts[item.n] || 0;
    row.innerHTML = `<div>${item.n} <small>(${item.p}pt)</small></div>
        <div class="item-ctrls">
            <button onclick="updateQty('${item.n}',-1)">-</button>
            <span data-name="${item.n}">${q}</span>
            <button onclick="updateQty('${item.n}',1)" style="background:var(--primary);color:white;">+</button>
        </div>`;
    return row;
}
function updateQty(name, delta) {
    counts[name] = Math.max(0, (counts[name] || 0) + delta);
    document.querySelectorAll(`span[data-name="${name}"]`).forEach(el => el.textContent = counts[name]);
    save(); updateUI();
}
function renderOptions() {
    const container = document.getElementById('option-list');
    container.innerHTML = optionMaster.map((opt, i) => `
        <div class="opt-row">
            <label><input type="checkbox" class="opt-check" onchange="updateUI()"> ${opt.name}</label>
            <input type="number" class="opt-price" value="${opt.price}" oninput="updateUI()">
        </div>
    `).join('');
}
function renderCustomOptions() {
    const container = document.getElementById('custom-option-list');
    container.innerHTML = customOptions.map((opt, i) => `
        <div class="opt-row"><label><input type="checkbox" class="custom-opt-check" checked onchange="updateUI()"> ${opt.name}</label>
        <input type="number" class="custom-opt-price" value="${opt.price}" oninput="updateUI()">
        <button onclick="removeCustomOption(${i})" style="border:none;background:none;color:red;">×</button></div>`).join('');
}
function addCustomOption() {
    const n = document.getElementById('new-opt-name').value;
    const p = parseInt(document.getElementById('new-opt-price').value);
    if(n && !isNaN(p)) { customOptions.push({name:n, price:p}); localStorage.setItem('customOptions', JSON.stringify(customOptions)); renderCustomOptions(); updateUI(); }
}
function removeCustomOption(i) { customOptions.splice(i,1); localStorage.setItem('customOptions', JSON.stringify(customOptions)); renderCustomOptions(); updateUI(); }
function setupSearch() {
    const sInput = document.getElementById('item-search');
    const res = document.getElementById('search-results');
    const acc = document.getElementById('accordion-container');
    sInput.oninput = (e) => {
        const val = e.target.value.trim();
        res.innerHTML = '';
        if(!val) { acc.style.display = 'block'; return; }
        acc.style.display = 'none';
        Object.keys(itemMaster).forEach(n => { if(n.includes(val)) res.appendChild(createItemRow({n:n, p:itemMaster[n]})); });
    };
}
function moveStep(delta) {
    document.getElementById(`step-${currentStep}`).classList.remove('active');
    currentStep = Math.max(1, Math.min(2, currentStep + delta));
    document.getElementById(`step-${currentStep}`).classList.add('active');
    document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === currentStep - 1));
    window.scrollTo(0,0);
}
function save() { localStorage.setItem('counts', JSON.stringify(counts)); }
function resetData() { if(confirm('全消去？')) { localStorage.clear(); location.reload(); } }
function copyResult() {
    let t = `【見積】\n合計: ${document.getElementById('final-price').textContent}\n家財: ${document.getElementById('total-points').textContent}pt\n車両: ${document.getElementById('truck-type').value}`;
    navigator.clipboard.writeText(t); alert('コピー完了');
}

init();
