let currentStep = 1;
let counts = JSON.parse(localStorage.getItem('counts')) || {};
let freeItems = JSON.parse(localStorage.getItem('freeItems')) || [];

// 110項目の名前とポイントをフラット化
const itemMaster = {};
Object.values(categorizedMoveData).forEach(items => {
    items.forEach(i => itemMaster[i.n] = i.p);
});

function init() {
    renderAccordion();
    setupSearch();
    updateUI();
}

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
    const row = document.createElement('div');
    row.className = 'item-row';
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

function moveStep(delta) {
    document.getElementById(`step-${currentStep}`).classList.remove('active');
    currentStep = Math.max(1, Math.min(4, currentStep + delta));
    document.getElementById(`step-${currentStep}`).classList.add('active');
    document.getElementById('step-indicator').textContent = `Step ${currentStep} / 4`;
    if(currentStep === 4) renderSummary();
    window.scrollTo(0,0);
}

function updateUI() {
    let total = 0;
    Object.keys(counts).forEach(n => total += counts[n] * (itemMaster[n] || 0));
    freeItems.forEach(i => total += i.p * i.q);
    document.getElementById('total-points').textContent = total;

    // 推奨車両
    let truck = total <= 200 ? "2tショート" : (total <= 300 ? "2tロング" : "3t車");
    let cap = total <= 200 ? 200 : (total <= 300 ? 300 : 360);
    document.getElementById('auto-truck-name').textContent = truck;
    document.getElementById('load-bar').style.width = Math.min(100, (total/cap)*100) + "%";

    // 概算料金計算 (基本3万 + 1pt=250円換算 + オプション)
    let optPrice = 0;
    document.querySelectorAll('.opt-check:checked').forEach(el => optPrice += parseInt(el.dataset.price));
    let final = 30000 + (total * 250) + optPrice;
    document.getElementById('final-price').textContent = "¥ " + final.toLocaleString();
}

function setupSearch() {
    const sInput = document.getElementById('item-search');
    const res = document.getElementById('search-results');
    const acc = document.getElementById('accordion-container');
    sInput.oninput = (e) => {
        const val = e.target.value.trim();
        res.innerHTML = '';
        if(!val) { acc.style.display = 'block'; return; }
        acc.style.display = 'none';
        Object.keys(itemMaster).forEach(n => {
            if(n.includes(val)) res.appendChild(createItemRow({n:n, p:itemMaster[n]}));
        });
    };
}

function addFreeItem() {
    const n = document.getElementById('free-name').value;
    const p = parseInt(document.getElementById('free-pt').value);
    if(n && p) {
        freeItems.push({n:n, p:p, q:1});
        document.getElementById('free-name').value = '';
        document.getElementById('free-pt').value = '';
        save(); updateUI();
    }
}

function renderSummary() {
    const list = document.getElementById('summary-items');
    list.innerHTML = '';
    Object.keys(counts).forEach(n => { if(counts[n]>0) list.innerHTML += `<li>${n} × ${counts[n]}</li>`; });
    freeItems.forEach(i => { list.innerHTML += `<li>${i.n}(フリー) × ${i.q}</li>`; });
}

function save() { localStorage.setItem('counts', JSON.stringify(counts)); localStorage.setItem('freeItems', JSON.stringify(freeItems)); }
function resetData() { if(confirm('全消去しますか？')) { localStorage.clear(); location.reload(); } }

document.querySelectorAll('.opt-check').forEach(el => el.onchange = updateUI);
init();
