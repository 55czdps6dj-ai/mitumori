let currentStep = 1;
let counts = JSON.parse(localStorage.getItem('counts')) || {};
let freeItems = JSON.parse(localStorage.getItem('freeItems')) || [];
let customOptions = JSON.parse(localStorage.getItem('customOptions')) || [];

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
    document.getElementById('clear-search').onclick = () => { sInput.value = ''; acc.style.display = 'block'; res.innerHTML = ''; };
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
        <div class="opt-row">
            <label><input type="checkbox" class="custom-opt-check" checked onchange="updateUI()"> ${opt.name}</label>
            <input type="number" class="custom-opt-price" value="${opt.price}" oninput="updateUI()">
            <button onclick="removeCustomOption(${i})" style="border:none;background:none;color:red;">×</button>
        </div>
    `).join('');
}

function addCustomOption() {
    const name = document.getElementById('new-opt-name').value;
    const price = parseInt(document.getElementById('new-opt-price').value);
    if (name && !isNaN(price)) {
        customOptions.push({ name, price });
        localStorage.setItem('customOptions', JSON.stringify(customOptions));
        renderCustomOptions(); updateUI();
        document.getElementById('new-opt-name').value = '';
        document.getElementById('new-opt-price').value = '';
    }
}

function removeCustomOption(i) {
    customOptions.splice(i, 1);
    localStorage.setItem('customOptions', JSON.stringify(customOptions));
    renderCustomOptions(); updateUI();
}

function updateUI() {
    let pts = 0;
    Object.keys(counts).forEach(n => pts += counts[n] * (itemMaster[n] || 0));
    freeItems.forEach(i => pts += i.p * i.q);
    document.getElementById('total-points').textContent = pts;

    const pricePerPt = parseInt(document.getElementById('price-per-pt').value) || 0;
    const dayFactor = parseInt(document.getElementById('day-factor').value) / 100;
    const basePrice = 30000;

    let optTotal = 0;
    document.querySelectorAll('.opt-check:checked').forEach(el => optTotal += parseInt(el.closest('.opt-row').querySelector('.opt-price').value) || 0);
    document.querySelectorAll('.custom-opt-check:checked').forEach(el => optTotal += parseInt(el.closest('.opt-row').querySelector('.custom-opt-price').value) || 0);

    let currentBase = (basePrice + (pts * pricePerPt)) * dayFactor;
    let discountVal = parseInt(document.getElementById('special-discount').value) || 0;
    let discountRate = (100 - (parseInt(document.getElementById('discount-rate').value) || 0)) / 100;
    
    let final = Math.floor((currentBase + optTotal - discountVal) * discountRate);
    let stdFinal = (basePrice + (pts * pricePerPt)) + optTotal;

    document.getElementById('row-base').textContent = "¥" + Math.floor(currentBase).toLocaleString();
    document.getElementById('row-base-std').textContent = "¥" + Math.floor(basePrice + (pts * pricePerPt)).toLocaleString();
    document.getElementById('row-opt').textContent = "¥" + optTotal.toLocaleString();
    document.getElementById('row-opt-std').textContent = "¥" + optTotal.toLocaleString();
    document.getElementById('final-price').textContent = "¥ " + final.toLocaleString();
    document.getElementById('std-price').textContent = "¥ " + stdFinal.toLocaleString();

    let diff = stdFinal - final;
    const msgEl = document.getElementById('price-diff-msg');
    msgEl.innerHTML = diff > 0 ? `<span style="color:green;">平日基準より ¥${diff.toLocaleString()} お得！</span>` : (diff < 0 ? `<span style="color:red;">繁忙加算: ¥${Math.abs(diff).toLocaleString()}</span>` : "");
}

function moveStep(delta) {
    document.getElementById(`step-${currentStep}`).classList.remove('active');
    currentStep = Math.max(1, Math.min(2, currentStep + delta));
    document.getElementById(`step-${currentStep}`).classList.add('active');
    document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === currentStep - 1));
    document.getElementById('next-btn').textContent = currentStep === 2 ? "家財に戻る" : "次へ（見積確定）";
    window.scrollTo(0,0);
}

function addFreeItem() {
    const n = document.getElementById('free-name').value;
    const p = parseInt(document.getElementById('free-pt').value);
    if(n && p) {
        freeItems.push({n:n, p:p, q:1});
        localStorage.setItem('freeItems', JSON.stringify(freeItems));
        updateUI(); renderFreeItems();
        document.getElementById('free-name').value = '';
        document.getElementById('free-pt').value = '';
    }
}

function renderFreeItems() {
    const container = document.getElementById('free-items-list');
    container.innerHTML = freeItems.map((item, i) => `<div class="item-row">${item.n} (${item.p}pt) <button onclick="removeFreeItem(${i})">削除</button></div>`).join('');
}

function removeFreeItem(i) { freeItems.splice(i, 1); localStorage.setItem('freeItems', JSON.stringify(freeItems)); renderFreeItems(); updateUI(); }
function save() { localStorage.setItem('counts', JSON.stringify(counts)); }
function resetData() { if(confirm('全消去しますか？')) { localStorage.clear(); location.reload(); } }
function copyResult() {
    let text = "【引越見積結果】\n";
    text += `合計: ${document.getElementById('final-price').textContent}\n`;
    text += `家財pt: ${document.getElementById('total-points').textContent}pt\n`;
    navigator.clipboard.writeText(text);
    alert('コピーしました');
}

init();
