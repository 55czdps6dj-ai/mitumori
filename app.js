let currentPage = 1;
let inputCounts = JSON.parse(localStorage.getItem('moveCounts')) || {};
let freeItems = JSON.parse(localStorage.getItem('freeItems')) || [];

// ページ分割設定（Ver7までの形式に準拠）
const pageConfig = [
    { title: "1. リビング・キッチン", cats: ["1. リビング", "2. ダイニング・キッチン"] },
    { title: "2. 寝室・洗面・玄関", cats: ["3. 寝室・収納", "5. 洗面所", "6. 玄関"] },
    { title: "3. 和室・洋室・個室", cats: ["4. 和室・洋室・個室"] },
    { title: "4. 外回り・その他", cats: ["7. ベランダ・外回り", "8. その他", "9. 引越資材"] }
];

// ポイント参照用マスタ
const itemMaster = {};
Object.values(categorizedMoveData).flat().forEach(i => itemMaster[i.n] = i.p);

function init() {
    renderPage();
    setupSearch();
    updateUI();
}

function renderPage() {
    const container = document.getElementById('item-list-container');
    const resultDiv = document.getElementById('search-results');
    container.innerHTML = '';
    resultDiv.innerHTML = '';
    
    document.getElementById('page-title').textContent = pageConfig[currentPage-1].title;
    document.getElementById('page-indicator').textContent = `${currentPage} / 5`;

    pageConfig[currentPage-1].cats.forEach(catName => {
        const label = document.createElement('div');
        label.className = 'category-label';
        label.textContent = catName;
        container.appendChild(label);

        categorizedMoveData[catName].forEach(item => {
            container.appendChild(createItemRow(item));
        });
    });
    window.scrollTo(0,0);
}

function createItemRow(item) {
    const row = document.createElement('div');
    row.className = 'item-row';
    const q = inputCounts[item.n] || 0;
    row.innerHTML = `
        <div class="item-info"><strong>${item.n}</strong><br><small>${item.p} pt</small></div>
        <div class="controls">
            <button class="btn-qty" onclick="updateQty('${item.n}', -1)">-</button>
            <span class="qty-val" data-name="${item.n}">${q}</span>
            <button class="btn-qty btn-plus" onclick="updateQty('${item.n}', 1)">+</button>
        </div>
    `;
    return row;
}

function setupSearch() {
    const sInput = document.getElementById('item-search');
    const resultDiv = document.getElementById('search-results');
    const listDiv = document.getElementById('item-list-container');

    sInput.oninput = (e) => {
        const term = e.target.value.trim();
        resultDiv.innerHTML = '';
        if (!term) {
            listDiv.style.display = 'block';
            return;
        }
        listDiv.style.display = 'none';
        Object.keys(itemMaster).forEach(name => {
            if (name.includes(term)) {
                resultDiv.appendChild(createItemRow({ n: name, p: itemMaster[name] }));
            }
        });
    };
    document.getElementById('clear-search').onclick = () => {
        sInput.value = '';
        listDiv.style.display = 'block';
        resultDiv.innerHTML = '';
    };
}

function updateQty(name, delta) {
    inputCounts[name] = Math.max(0, (inputCounts[name] || 0) + delta);
    localStorage.setItem('moveCounts', JSON.stringify(inputCounts));
    document.querySelectorAll(`.qty-val[data-name="${name}"]`).forEach(el => el.textContent = inputCounts[name]);
    updateUI();
}

function addFreeItem() {
    const name = document.getElementById('free-name').value;
    const pt = parseInt(document.getElementById('free-pt').value);
    if(name && !isNaN(pt)) {
        freeItems.push({ n: name, p: pt, q: 1 });
        localStorage.setItem('freeItems', JSON.stringify(freeItems));
        document.getElementById('free-name').value = '';
        document.getElementById('free-pt').value = '';
        updateUI();
    }
}

function updateFreeQty(idx, delta) {
    freeItems[idx].q = Math.max(0, freeItems[idx].q + delta);
    if(freeItems[idx].q === 0) freeItems.splice(idx, 1);
    localStorage.setItem('freeItems', JSON.stringify(freeItems));
    updateUI();
}

function updateUI() {
    let total = 0;
    Object.keys(inputCounts).forEach(n => total += inputCounts[n] * (itemMaster[n] || 0));
    
    const freeDiv = document.getElementById('free-items-display');
    freeDiv.innerHTML = '';
    freeItems.forEach((item, idx) => {
        total += item.p * item.q;
        const fRow = document.createElement('div');
        fRow.className = 'item-row';
        fRow.innerHTML = `<div>${item.n}(フリー)<br><small>${item.p}pt</small></div>
            <div class="controls">
                <button class="btn-qty" onclick="updateFreeQty(${idx},-1)">-</button>
                <span class="qty-val">${item.q}</span>
                <button class="btn-qty btn-plus" onclick="updateFreeQty(${idx},1)">+</button>
            </div>`;
        freeDiv.appendChild(fRow);
    });

    document.getElementById('total-points').textContent = total;
    // トラック連動：200/300/360
    let cap = total <= 200 ? 200 : (total <= 300 ? 300 : 360);
    let name = total <= 200 ? "2tショート" : (total <= 300 ? "2tロング" : "3t車");
    let pct = Math.min(100, Math.round((total / cap) * 100));
    
    document.getElementById('load-bar-fill').style.width = pct + "%";
    document.getElementById('load-bar-fill').style.backgroundColor = pct > 90 ? "#ef4444" : "#10b981";
    document.getElementById('truck-name').textContent = name;
    document.getElementById('load-percent').textContent = pct + "%";
}

function changePage(delta) {
    if (currentPage === 4 && delta === 1) {
        showResult();
        return;
    }
    currentPage = Math.max(1, Math.min(4, currentPage + delta));
    renderPage();
}

function showResult() {
    document.getElementById('result-modal').style.display = 'block';
    const list = document.getElementById('final-item-list');
    list.innerHTML = '';
    const total = document.getElementById('total-points').textContent;
    document.getElementById('final-total').textContent = `合計ポイント: ${total} pt`;
    document.getElementById('final-truck').textContent = "推奨車両：" + document.getElementById('truck-name').textContent;

    Object.keys(inputCounts).forEach(n => { if(inputCounts[n]>0) list.innerHTML += `<li>${n} × ${inputCounts[n]}</li>`; });
    freeItems.forEach(i => { list.innerHTML += `<li>${i.n}(フリー) × ${i.q}</li>`; });
}

function closeResult() { document.getElementById('result-modal').style.display = 'none'; }
function resetAll() { if(confirm('全データを消去しますか？')) { localStorage.clear(); location.reload(); } }

async function copyResult() {
    let txt = `【引越見積】\n車両:${document.getElementById('truck-name').textContent}\n合計:${document.getElementById('total-points').textContent}pt\n\n■内訳\n`;
    Object.keys(inputCounts).forEach(n => { if(inputCounts[n]>0) txt += `${n}×${inputCounts[n]}\n`; });
    freeItems.forEach(i => txt += `${i.n}(フリー)×${i.q}\n`);
    await navigator.clipboard.writeText(txt);
    alert('結果をコピーしました！LINE等に貼り付けられます。');
}

init();
