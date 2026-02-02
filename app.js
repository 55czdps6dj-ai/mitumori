let inputCounts = JSON.parse(localStorage.getItem('moveCounts')) || {};
let freeMemo = localStorage.getItem('moveMemo') || "";
const TRUCK_CAPACITY = { SMALL: 200, LONG: 300, LARGE: 360 };
const itemPointMaster = {};
Object.values(categorizedMoveData).flat().forEach(i => { itemPointMaster[i.n] = i.p; });

function init() {
    const container = document.getElementById('accordion-container');
    document.getElementById('free-memo').value = freeMemo;
    
    for (const [catName, items] of Object.entries(categorizedMoveData)) {
        const group = document.createElement('div');
        group.className = 'category-group';
        group.innerHTML = `
            <div class="category-header" onclick="this.parentElement.classList.toggle('open')">
                <span>${catName}</span><span class="cat-subtotal" data-cat="${catName}">0 pt</span>
            </div>
            <div class="category-content"></div>
        `;
        const content = group.querySelector('.category-content');
        items.forEach(item => {
            if (inputCounts[item.n] === undefined) inputCounts[item.n] = 0;
            const row = document.createElement('div');
            row.className = 'item-row';
            row.setAttribute('data-name', item.n);
            row.innerHTML = `
                <div class="item-info"><span class="item-name">${item.n}</span><span class="item-pts">${item.p} pt</span></div>
                <div class="controls">
                    <button class="btn-qty" onclick="updateQty('${item.n}', -1)">-</button>
                    <span class="qty-val" data-item-name="${item.n}">${inputCounts[item.n]}</span>
                    <button class="btn-qty btn-plus" onclick="updateQty('${item.n}', 1)">+</button>
                </div>
            `;
            content.appendChild(row);
        });
        container.appendChild(group);
    }
    setupEventListeners();
    updateUI();
}

function setupEventListeners() {
    const sInput = document.getElementById('item-search');
    sInput.oninput = (e) => filterItems(e.target.value.trim());
    document.getElementById('clear-search').onclick = () => { sInput.value = ''; filterItems(''); };
    document.getElementById('free-memo').oninput = (e) => {
        freeMemo = e.target.value;
        localStorage.setItem('moveMemo', freeMemo);
    };
}

function filterItems(term) {
    document.querySelectorAll('.category-group').forEach(group => {
        let hasMatch = false;
        group.querySelectorAll('.item-row').forEach(row => {
            const match = row.getAttribute('data-name').includes(term);
            row.style.display = match ? 'flex' : 'none';
            if (match) hasMatch = true;
        });
        group.style.display = (term === '' || hasMatch) ? 'block' : 'none';
        if (term !== '' && hasMatch) group.classList.add('open');
    });
}

function updateQty(name, delta) {
    inputCounts[name] = Math.max(0, (inputCounts[name] || 0) + delta);
    localStorage.setItem('moveCounts', JSON.stringify(inputCounts));
    document.querySelectorAll(`.qty-val[data-item-name="${name}"]`).forEach(el => el.textContent = inputCounts[name]);
    updateUI();
}

function updateUI() {
    let total = 0;
    Object.keys(inputCounts).forEach(name => { total += inputCounts[name] * (itemPointMaster[name] || 0); });
    
    document.querySelectorAll('.category-group').forEach(group => {
        const cat = group.querySelector('.category-header span').textContent;
        const sub = categorizedMoveData[cat].reduce((s, i) => s + (inputCounts[i.n] * i.p), 0);
        group.querySelector('.cat-subtotal').textContent = sub + " pt";
    });

    document.getElementById('total-points').textContent = total;
    const sim = updateSimulator(total);
    
    // 2ページ目反映
    document.getElementById('final-truck').textContent = sim.name;
    document.getElementById('final-points').textContent = `合計ポイント: ${total} pt`;
    renderSelectedList();
}

function updateSimulator(pts) {
    const cap = pts <= TRUCK_CAPACITY.SMALL ? TRUCK_CAPACITY.SMALL : (pts <= TRUCK_CAPACITY.LONG ? TRUCK_CAPACITY.LONG : TRUCK_CAPACITY.LARGE);
    const name = pts <= TRUCK_CAPACITY.SMALL ? "2tショート" : (pts <= TRUCK_CAPACITY.LONG ? "2tロング" : "3t車");
    const pct = Math.min(100, Math.round((pts / cap) * 100));
    document.getElementById('load-bar-fill').style.width = pct + "%";
    document.getElementById('truck-name').textContent = `推奨：${name}`;
    document.getElementById('load-percent').textContent = pct + "%";
    return { name, pct };
}

function switchPage(pageNo) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(`page-${pageNo}`).classList.add('active');
    window.scrollTo(0, 0);
}

function renderSelectedList() {
    const list = document.getElementById('selected-items-list');
    list.innerHTML = '';
    Object.keys(inputCounts).forEach(name => {
        if (inputCounts[name] > 0) {
            const li = document.createElement('li');
            li.textContent = `${name} × ${inputCounts[name]}`;
            list.appendChild(li);
        }
    });
}

async function copyToClipboard() {
    const items = Object.keys(inputCounts).filter(n => inputCounts[n] > 0).map(n => `${n}:${inputCounts[n]}個`).join('\n');
    const text = `【引越見積】\n${document.getElementById('final-truck').textContent}\n合計:${document.getElementById('total-points').textContent}pt\n\n■家財内訳\n${items}\n\n■メモ\n${freeMemo}`;
    await navigator.clipboard.writeText(text);
    alert('内容をコピーしました！LINE等に貼り付けられます。');
}

document.getElementById('reset-btn').onclick = () => { if(confirm('リセットしますか？')) { localStorage.clear(); location.reload(); } };
init();
