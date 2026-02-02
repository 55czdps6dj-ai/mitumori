let inputCounts = JSON.parse(localStorage.getItem('moveCounts')) || {};
let freeItems = JSON.parse(localStorage.getItem('freeItems')) || []; // [{n:"ピアノ", p:20, q:1}]
const TRUCK_CAPACITY = { SMALL: 200, LONG: 300, LARGE: 360 };
const itemPointMaster = {};
Object.values(categorizedMoveData).flat().forEach(i => { itemPointMaster[i.n] = i.p; });

function init() {
    renderCategories();
    setupSearch();
    updateUI();
}

// 通常のアコーディオン描画
function renderCategories() {
    const container = document.getElementById('accordion-container');
    container.innerHTML = '';
    for (const [catName, items] of Object.entries(categorizedMoveData)) {
        const group = document.createElement('div');
        group.className = 'category-group';
        group.innerHTML = `
            <div class="category-header" onclick="this.parentElement.classList.toggle('open')">
                <span>${catName}</span><span class="cat-pts" id="sub-${catName}">0 pt</span>
            </div>
            <div class="category-content"></div>
        `;
        const content = group.querySelector('.category-content');
        items.forEach(item => content.appendChild(createItemRow(item)));
        container.appendChild(group);
    }
}

// 家財行の生成（共通部品）
function createItemRow(item) {
    const row = document.createElement('div');
    row.className = 'item-row';
    row.innerHTML = `
        <div class="item-info"><strong>${item.n}</strong><br><small>${item.p} pt</small></div>
        <div class="controls">
            <button class="btn-qty" onclick="updateQty('${item.n}', -1)">-</button>
            <span class="qty-val" data-name="${item.n}">${inputCounts[item.n] || 0}</span>
            <button class="btn-qty btn-plus" onclick="updateQty('${item.n}', 1)">+</button>
        </div>
    `;
    return row;
}

// 予測変換検索
function setupSearch() {
    const sInput = document.getElementById('item-search');
    const resultDiv = document.getElementById('search-results');
    const accordion = document.getElementById('accordion-container');

    sInput.oninput = (e) => {
        const term = e.target.value.trim();
        resultDiv.innerHTML = '';
        if (term === '') {
            accordion.style.display = 'block';
            return;
        }
        accordion.style.display = 'none';
        
        // 全家財から検索して表示（予測変換）
        const allItems = Object.values(categorizedMoveData).flat();
        const seen = new Set();
        allItems.forEach(item => {
            if (item.n.includes(term) && !seen.has(item.n)) {
                resultDiv.appendChild(createItemRow(item));
                seen.add(item.n);
            }
        });
    };
}

// 数量更新
function updateQty(name, delta) {
    inputCounts[name] = Math.max(0, (inputCounts[name] || 0) + delta);
    save();
    updateUI();
    // 画面上の全箇所の数値を同期
    document.querySelectorAll(`.qty-val[data-name="${name}"]`).forEach(el => el.textContent = inputCounts[name]);
}

// フリー家財の追加
function addFreeItem() {
    const name = document.getElementById('free-name').value;
    const pt = parseInt(document.getElementById('free-pt').value);
    if (!name || isNaN(pt)) return;
    freeItems.push({ n: name, p: pt, q: 1 });
    document.getElementById('free-name').value = '';
    document.getElementById('free-pt').value = '';
    save();
    updateUI();
}

function updateFreeQty(index, delta) {
    freeItems[index].q = Math.max(0, freeItems[index].q + delta);
    if (freeItems[index].q === 0) freeItems.splice(index, 1);
    save();
    updateUI();
}

function updateUI() {
    let total = 0;
    // 既定家財
    Object.keys(inputCounts).forEach(n => total += inputCounts[n] * (itemPointMaster[n] || 0));
    // フリー家財
    const freeDiv = document.getElementById('free-items-display');
    freeDiv.innerHTML = '';
    freeItems.forEach((item, idx) => {
        total += item.p * item.q;
        const row = document.createElement('div');
        row.className = 'item-row';
        row.innerHTML = `<div>${item.n}(フリー)<br><small>${item.p}pt</small></div>
            <div class="controls">
                <button class="btn-qty" onclick="updateFreeQty(${idx}, -1)">-</button>
                <span class="qty-val">${item.q}</span>
                <button class="btn-qty btn-plus" onclick="updateFreeQty(${idx}, 1)">+</button>
            </div>`;
        freeDiv.appendChild(row);
    });

    document.getElementById('total-points').textContent = total;
    updateSimulator(total);
}

function updateSimulator(pts) {
    const bar = document.getElementById('load-bar-fill');
    const nameEl = document.getElementById('truck-name');
    const cap = pts <= TRUCK_CAPACITY.SMALL ? TRUCK_CAPACITY.SMALL : (pts <= TRUCK_CAPACITY.LONG ? TRUCK_CAPACITY.LONG : TRUCK_CAPACITY.LARGE);
    const name = pts <= TRUCK_CAPACITY.SMALL ? "2tショート" : (pts <= TRUCK_CAPACITY.LONG ? "2tロング" : "3t車");
    const pct = Math.min(100, Math.round((pts / cap) * 100));
    bar.style.width = pct + "%";
    bar.style.backgroundColor = pct > 90 ? "#ef4444" : "#10b981";
    nameEl.textContent = name;
    document.getElementById('load-percent').textContent = pct + "%";
}

function switchPage(p) {
    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    document.getElementById(`page-${p}`).classList.add('active');
    if (p === 2) renderFinalResult();
    window.scrollTo(0, 0);
}

function renderFinalResult() {
    const list = document.getElementById('final-item-list');
    list.innerHTML = '';
    const pts = document.getElementById('total-points').textContent;
    document.getElementById('final-total-pts').textContent = `合計ポイント: ${pts} pt`;
    document.getElementById('final-truck-name').textContent = document.getElementById('truck-name').textContent;

    Object.keys(inputCounts).forEach(n => {
        if (inputCounts[n] > 0) list.innerHTML += `<li>${n} × ${inputCounts[n]}</li>`;
    });
    freeItems.forEach(i => list.innerHTML += `<li>${i.n}(フリー) × ${i.q}</li>`);
}

function save() {
    localStorage.setItem('moveCounts', JSON.stringify(inputCounts));
    localStorage.setItem('freeItems', JSON.stringify(freeItems));
}

function copyResult() {
    let txt = `【引越見積】\n車両:${document.getElementById('final-truck-name').textContent}\n合計:${document.getElementById('total-points').textContent}pt\n\n■内訳\n`;
    Object.keys(inputCounts).forEach(n => { if(inputCounts[n]>0) txt += `${n}×${inputCounts[n]}\n`; });
    freeItems.forEach(i => txt += `${i.n}(フリー)×${i.q}\n`);
    navigator.clipboard.writeText(txt);
    alert('コピーしました！');
}

init();
