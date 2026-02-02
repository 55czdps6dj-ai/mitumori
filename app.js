// 状態管理
let inputCounts = JSON.parse(localStorage.getItem('moveCounts')) || {};

// ユーザー指定のトラック積載基準
const TRUCK_CAPACITY = {
    SMALL: 200,   // 2tショート
    LONG: 300,    // 2tロング
    LARGE: 360    // 3t車
};

// アイテムのポイントを即座に引けるようにマスタを作成
const itemPointMaster = {};
Object.values(categorizedMoveData).flat().forEach(i => {
    itemPointMaster[i.n] = i.p;
});

function init() {
    const container = document.getElementById('accordion-container');
    
    for (const [catName, items] of Object.entries(categorizedMoveData)) {
        const group = document.createElement('div');
        group.className = 'category-group';
        
        const header = document.createElement('div');
        header.className = 'category-header';
        // カテゴリー名と小計を表示する枠を作成
        header.innerHTML = `
            <span>${catName}</span>
            <span class="cat-subtotal" data-cat="${catName}">0 pt</span>
        `;
        header.onclick = () => group.classList.toggle('open');
        
        const content = document.createElement('div');
        content.className = 'category-content';
        
        items.forEach(item => {
            if (inputCounts[item.n] === undefined) inputCounts[item.n] = 0;
            
            const row = document.createElement('div');
            row.className = 'item-row';
            row.innerHTML = `
                <div class="item-info">
                    <span class="item-name">${item.n}</span>
                    <span class="item-pts">${item.p} pt</span>
                </div>
                <div class="controls">
                    <button class="btn-qty" onclick="updateQty('${item.n}', -1)">-</button>
                    <span class="qty-val" data-name="${item.n}">${inputCounts[item.n]}</span>
                    <button class="btn-qty btn-plus" onclick="updateQty('${item.n}', 1)">+</button>
                </div>
            `;
            content.appendChild(row);
        });
        
        group.appendChild(header);
        group.appendChild(content);
        container.appendChild(group);
    }
    updateUI();
}

function updateQty(itemName, delta) {
    const newVal = Math.max(0, (inputCounts[itemName] || 0) + delta);
    inputCounts[itemName] = newVal;
    localStorage.setItem('moveCounts', JSON.stringify(inputCounts));
    updateUI();
}

function updateUI() {
    // 1. 全ての数量表示を同期更新
    for (const [name, count] of Object.entries(inputCounts)) {
        document.querySelectorAll(`.qty-val[data-name="${name}"]`).forEach(el => {
            el.textContent = count;
        });
    }

    // 2. カテゴリーごとの小計計算と強調表示
    let grandTotal = 0;
    
    // 全体の合計を出すために、まずは入力されているユニークなアイテムから計算
    const activeItemNames = Object.keys(inputCounts);
    grandTotal = activeItemNames.reduce((sum, name) => {
        return sum + (inputCounts[name] * (itemPointMaster[name] || 0));
    }, 0);

    // カテゴリー見出しの更新
    document.querySelectorAll('.category-group').forEach(group => {
        const catName = group.querySelector('.category-header span:first-child').textContent;
        const itemsInCat = categorizedMoveData[catName];
        
        // そのカテゴリー内の小計を計算
        const subtotal = itemsInCat.reduce((sum, item) => {
            return sum + ((inputCounts[item.n] || 0) * item.p);
        }, 0);

        const subtotalEl = group.querySelector('.cat-subtotal');
        subtotalEl.textContent = subtotal > 0 ? `${subtotal} pt` : '0 pt';
        group.classList.toggle('has-value', subtotal > 0);
    });

    // 3. メイン表示の更新
    document.getElementById('total-points').textContent = grandTotal.toLocaleString();
    updateSimulator(grandTotal);
}

function updateSimulator(pts) {
    const bar = document.getElementById('load-bar-fill');
    const nameEl = document.getElementById('truck-name');
    const pctEl = document.getElementById('load-percent');
    
    let capacity = 0;
    let name = "";

    // ユーザー指定の条件分岐
    if (pts <= TRUCK_CAPACITY.SMALL) {
        capacity = TRUCK_CAPACITY.SMALL;
        name = "推奨：2tショート車";
    } else if (pts <= TRUCK_CAPACITY.LONG) {
        capacity = TRUCK_CAPACITY.LONG;
        name = "推奨：2tロング車";
    } else {
        capacity = TRUCK_CAPACITY.LARGE;
        name = pts > TRUCK_CAPACITY.LARGE ? "3t車オーバー（要相談）" : "推奨：3t車";
    }

    const percent = Math.min(100, Math.round((pts / capacity) * 100));
    bar.style.width = percent + "%";
    
    // 積載率による色の変化（90%超えで注意喚起の赤）
    bar.style.backgroundColor = percent > 90 ? "#ef4444" : "#10b981";
    nameEl.textContent = name;
    pctEl.textContent = percent + "%";
}

document.getElementById('reset-btn').onclick = () => {
    if(confirm('全ての入力を消去してリセットしますか？')) {
        inputCounts = {};
        localStorage.removeItem('moveCounts');
        location.reload();
    }
};

// 起動
init();
