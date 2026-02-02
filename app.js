// app.js - 京王運輸 専用見積システムエンジン (Ver 7.5)
let counts = {};
let customFutai = []; // {id, name, price}
let currentPage = 1;

/**
 * 1. 初期化処理
 */
function init() {
    // 管理画面(localStorage)で保存された単価設定があれば上書き適用
    const savedMaster = localStorage.getItem('keio_quote_master');
    if (savedMaster && typeof master !== 'undefined') {
        Object.assign(master, JSON.parse(savedMaster));
    }

    // 家財リストの生成 (117項目)
    const list = document.getElementById('list-container');
    if (typeof moveDataFlat !== 'undefined') {
        moveDataFlat.forEach(item => {
            list.appendChild(createRow(item));
        });
    }

    renderAC();      // エアコン入力エリア描画
    renderUnits();   // 配車設定エリア描画
    setupSearch();   // 検索機能の有効化
    updateCalc();    // 初回計算
}

/**
 * 2. 家財リストの行(HTML)生成
 */
function createRow(item) {
    let row = document.createElement('div');
    row.className = 'var-row';
    row.dataset.name = item.n; // 検索用
    row.innerHTML = `
        <div class="item-info">
            <span style="font-weight:bold; font-size:1rem;">${item.n}</span>
            <div class="size-text">
                ${item.p}P / H:${item.h} W:${item.w} D:${item.d}
            </div>
        </div>
        <div class="ctrls">
            <button class="btn-qty" onclick="chg('${item.n}', -1, ${item.p})">－</button>
            <input type="number" id="q-${item.n}" class="qty-input" value="0" readonly>
            <button class="btn-qty" onclick="chg('${item.n}', 1, ${item.p})">＋</button>
        </div>`;
    return row;
}

/**
 * 3. 検索フィルタリング機能
 */
function setupSearch() {
    const searchInput = document.getElementById('item-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase();
            document.querySelectorAll('#list-container .var-row').forEach(row => {
                const name = row.dataset.name ? row.dataset.name.toLowerCase() : "";
                row.style.display = name.includes(val) ? 'flex' : 'none';
            });
        });
    }
}

/**
 * 4. 数量変更 ＆ 選択済みサマリー更新
 */
function chg(name, d, p) {
    counts[name] = Math.max(0, (counts[name] || 0) + d);
    const inputEl = document.getElementById('q-' + name);
    if (inputEl) inputEl.value = counts[name];
    
    let totalPts = 0;
    const summaryArea = document.getElementById('selected-summary');
    const summaryList = document.getElementById('selected-items-list');
    summaryList.innerHTML = '';
    
    // moveDataFlatの定義順(1番〜117番)を守ってバッジを表示
    moveDataFlat.forEach(item => {
        const qty = counts[item.n] || 0;
        if (qty > 0) {
            totalPts += qty * item.p;
            let badge = document.createElement('span');
            badge.className = 'badge';
            badge.innerText = `${item.n} × ${qty}`;
            summaryList.appendChild(badge);
        }
    });
    
    summaryArea.style.display = totalPts > 0 ? 'block' : 'none';
    document.getElementById('total-pts-1').innerText = totalPts;
    updateCalc();
}

/**
 * 5. 固定付帯(エアコン工事)の描画
 */
function renderAC() {
    const area = document.getElementById('ac-inputs');
    if (!area) return;
    futaiFixed.forEach(f => {
        let d = document.createElement('div');
        d.className = 'var-row';
        d.innerHTML = `
            <span>${f.n} (${f.p.toLocaleString()}円)</span>
            <div class="ctrls">
                <button class="btn-qty" onclick="spinF('${f.id}', -1)">－</button>
                <input type="number" id="${f.id}" class="qty-input" value="0" readonly>
                <button class="btn-qty" onclick="spinF('${f.id}', 1)">＋</button>
            </div>`;
        area.appendChild(d);
    });
}

/**
 * 6. 自由入力付帯の管理
 */
function addCustomFuta() {
    customFutai.push({ id: Date.now(), name: '', price: 0 });
    renderCustomList();
}

function renderCustomList() {
    const container = document.getElementById('custom-list');
    if (!container) return;
    container.innerHTML = '';
    customFutai.forEach((f, index) => {
        let d = document.createElement('div');
        d.className = 'custom-item-row';
        d.innerHTML = `
            <input type="text" placeholder="項目名" value="${f.name}" oninput="customFutai[${index}].name=this.value; updateCalc()" style="flex:2;">
            <input type="number" placeholder="金額" value="${f.price}" oninput="customFutai[${index}].price=Number(this.value); updateCalc()" style="flex:1;">
            <button onclick="customFutai.splice(${index},1); renderCustomList(); updateCalc()" style="background:var(--red); color:white; border:none; border-radius:4px; width:35px;">×</button>
        `;
        container.appendChild(d);
    });
}

/**
 * 7. 料金計算メインロジック
 */
function updateCalc() {
    const isBusy = document.getElementById('is-busy')?.checked;
    const isDiscount = document.getElementById('is-discount')?.checked;
    
    // 入力値取得
    const n1 = parseInt(document.getElementById('unit-1t')?.value) || 0;
    const n2 = parseInt(document.getElementById('unit-2t')?.value) || 0;
    const n3 = parseInt(document.getElementById('unit-3t')?.value) || 0;
    const n4 = parseInt(document.getElementById('unit-4t')?.value) || 0;
    const nS = parseInt(document.getElementById('unit-staff')?.value) || 0;
    const h = parseFloat(document.getElementById('work-time')?.value) || 0;

    // A. 運賃計算 (車両＋人工)
    let wdBase = 0, hdBase = 0;
    if (!isBusy) {
        wdBase = n1*master.wd1t + n2*master.wd2t + n3*master.wd3t + n4*master.wd4t + nS*master.wdSt;
        hdBase = n1*master.hd1t + n2*master.hd2t + n3*master.hd3t + n4*master.hd4t + nS*master.hdSt;
    } else {
        wdBase = n1*master.bwd1t + n2*master.bwd2t + n3*master.bwd3t + n4*master.bwd4t + nS*master.bwdSt;
        hdBase = n1*master.bhd1t + n2*master.bhd2t + n3*master.bhd3t + n4*master.bhd4t + nS*master.bhdSt;
    }

    // B. 運賃20%割引適用 (車両費・作業員費のみ)
    if (isDiscount) {
        wdBase *= 0.8;
        hdBase *= 0.8;
    }

    // C. 付帯・実費の集計 (割引対象外)
    let extraFee = parseInt(document.getElementById('fee-road')?.value) || 0;
    // 固定付帯(エアコン等)
    futaiFixed.forEach(f => {
        let q = parseInt(document.getElementById(f.id)?.value) || 0;
        extraFee += q * f.p;
    });
    // 自由入力付帯
    customFutai.forEach(f => { extraFee += f.price; });

    // D. フリー便割引計算
    let freeDiscount = 0;
    if (h > 0 && h < 8) {
        // 戻り時間に応じた控除
        freeDiscount = ((n1+n2+n3) * master.f_car + nS * master.f_man) * (8 - h);
        if (isDiscount) freeDiscount *= 0.8; // 割引時は控除額も割引単価ベースに
    }

    // 結果表示
    document.getElementById('wd-fixed').innerText = Math.round(wdBase + extraFee).toLocaleString();
    document.getElementById('hd-fixed').innerText = Math.round(hdBase + extraFee).toLocaleString();
    document.getElementById('wd-free').innerText = Math.round(Math.max(0, wdBase - freeDiscount + extraFee)).toLocaleString();
    document.getElementById('hd-free').innerText = Math.round(Math.max(0, hdBase - freeDiscount + extraFee)).toLocaleString();
}

/**
 * 8. UI描画 ＆ ナビゲーション
 */
function renderUnits() {
    const area = document.getElementById('unit-ctrls-area');
    if (!area) return;
    const units = [
        {id:'unit-1t', n:'1t車以下'}, {id:'unit-2t', n:'2t車'},
        {id:'unit-3t', n:'3t車'}, {id:'unit-4t', n:'4t車'}, {id:'unit-staff', n:'作業員'}
    ];
    units.forEach(u => {
        let d = document.createElement('div');
        d.className = 'var-row';
        d.innerHTML = `
            <span>${u.n}</span>
            <div class="ctrls">
                <button class="btn-qty" onclick="spin('${u.id}', -1, 0, 99)">－</button>
                <input type="number" id="${u.id}" class="qty-input" value="0" readonly>
                <button class="btn-qty" onclick="spin('${u.id}', 1, 0, 99)">＋</button>
            </div>`;
        area.appendChild(d);
    });
}

function spin(id, d, min, max) {
    let el = document.getElementById(id);
    if (!el) return;
    el.value = Math.min(Math.max((parseInt(el.value)||0)+d, min), max);
    updateCalc();
}

function spinF(id, d) {
    let el = document.getElementById(id);
    if (!el) return;
    el.value = Math.max(0, (parseInt(el.value)||0)+d);
    updateCalc();
}

function movePage(d) {
    let next = currentPage + d;
    if (next < 1 || next > 4) return;
    document.getElementById(`step${currentPage}`).classList.remove('active');
    document.getElementById(`step${next}`).classList.add('active');
    currentPage = next;
    const titles = ["家財入力", "付帯・実費", "配車設定", "結果比較"];
    document.getElementById('page-title').innerText = titles[currentPage - 1];
    document.getElementById('step-indicator').innerText = currentPage + " / 4";
    window.scrollTo(0, 0);
}

// 起動
window.onload = init;
