// app.js - 京王運輸 専用見積システム Ver 6.1 (完全版)
let counts = {};
let currentPage = 1;

// 1. 初期化処理
function init() {
    const list = document.getElementById('list-container');
    // リストを117項目そのままの順序で生成
    if (typeof moveDataFlat !== 'undefined') {
        moveDataFlat.forEach(item => {
            list.appendChild(createRow(item.n, item.p));
        });
    }

    renderFuta();    // 付帯サービス描画
    renderUnits();   // 配車設定描画
    setupSearch();   // 検索機能セットアップ
    updateCalc();    // 初回計算
}

// 2. 家財リストの行作成
function createRow(name, pts) {
    let row = document.createElement('div');
    row.className = 'var-row';
    row.dataset.name = name; // 検索用
    row.innerHTML = `
        <div style="flex:1;">
            <span style="font-size:1rem;">${name}</span>
            <div style="font-size:0.75rem; color:#888;">${pts} P</div>
        </div>
        <div class="ctrls">
            <button class="btn-qty" onclick="chg('${name}', -1, ${pts})">－</button>
            <input type="number" id="q-${name}" class="qty-input" value="0" readonly>
            <button class="btn-qty" onclick="chg('${name}', 1, ${pts})">＋</button>
        </div>`;
    return row;
}

// 3. 検索機能
function setupSearch() {
    const searchInput = document.getElementById('item-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('.var-row');
            rows.forEach(row => {
                const name = row.dataset.name ? row.dataset.name.toLowerCase() : "";
                // 名前または番号が含まれていれば表示
                row.style.display = name.includes(val) ? 'flex' : 'none';
            });
        });
    }
}

// 4. 数量変更 ＆ サマリー更新
function chg(name, d, p) {
    counts[name] = Math.max(0, (counts[name] || 0) + d);
    
    // 入力欄の値を更新
    const inputEl = document.getElementById('q-' + name);
    if (inputEl) inputEl.value = counts[name];
    
    let totalPts = 0;
    const summaryArea = document.getElementById('selected-summary');
    const summaryList = document.getElementById('selected-items-list');
    summaryList.innerHTML = '';
    
    // 重要：moveDataFlatの順番（1番〜117番）でサマリーを表示
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
    
    // サマリーエリアの表示制御
    summaryArea.style.display = totalPts > 0 ? 'block' : 'none';
    
    // ポイント表示更新
    document.getElementById('total-pts-1').innerText = totalPts;
    document.getElementById('total-pts-2').innerText = totalPts;
    
    updateCalc();
}

// 5. 付帯サービスの描画
function renderFuta() {
    const fArea = document.getElementById('futa-inputs');
    if (!fArea) return;
    
    futai.forEach(f => {
        let d = document.createElement('div');
        d.className = 'var-row';
        d.style.flexWrap = 'wrap';
        d.innerHTML = `
            <div style="width:60%; font-weight:bold;">${f.n}</div>
            <div class="ctrls">
                <button class="btn-qty" onclick="spinF('${f.id}', -1)">－</button>
                <input type="number" id="${f.id}" class="qty-input" value="0" readonly>
                <button class="btn-qty" onclick="spinF('${f.id}', 1)">＋</button>
            </div>
            <div id="prc-${f.id}" class="price-display">0 円</div>`;
        fArea.appendChild(d);
    });
}

// 6. 配車設定の描画
function renderUnits() {
    const uArea = document.getElementById('unit-ctrls-area');
    if (!uArea) return;
    
    const uArr = [
        {id:'unit-1t', n:'1t車以下'},
        {id:'unit-2t', n:'2t車'},
        {id:'unit-3t', n:'3t車'},
        {id:'unit-4t', n:'4t車'},
        {id:'unit-staff', n:'作業員(人工)'}
    ];
    
    uArr.forEach(u => {
        let d = document.createElement('div');
        d.className = 'var-row';
        d.innerHTML = `
            <span>${u.n}</span>
            <div class="ctrls">
                <button class="btn-qty" onclick="spin('${u.id}', -1, 0, 99)">－</button>
                <input type="number" id="${u.id}" class="qty-input" value="0" readonly>
                <button class="btn-qty" onclick="spin('${u.id}', 1, 0, 99)">＋</button>
            </div>`;
        uArea.appendChild(d);
    });
}

// 7. スピンボタン汎用
function spin(id, d, min, max) {
    let el = document.getElementById(id);
    let val = (parseInt(el.value) || 0) + d;
    el.value = Math.min(Math.max(val, min), max);
    updateCalc();
}

function spinF(id, d) {
    let el = document.getElementById(id);
    el.value = Math.max((parseInt(el.value) || 0) + d, 0);
    updateCalc();
}

// 8. 料金計算メインロジック
function updateCalc() {
    const isBusy = document.getElementById('is-busy')?.checked;
    
    // 車両台数・人工の取得
    const n1 = parseInt(document.getElementById('unit-1t')?.value) || 0;
    const n2 = parseInt(document.getElementById('unit-2t')?.value) || 0;
    const n3 = parseInt(document.getElementById('unit-3t')?.value) || 0;
    const n4 = parseInt(document.getElementById('unit-4t')?.value) || 0;
    const nS = parseInt(document.getElementById('unit-staff')?.value) || 0;
    
    // フリー便・実費
    const h = parseFloat(document.getElementById('work-time')?.value) || 0;
    let extraFee = parseInt(document.getElementById('fee-road')?.value) || 0;

    // 付帯サービスの計算と個別表示
    futai.forEach(f => {
        let q = parseInt(document.getElementById(f.id)?.value) || 0;
        let subtotal = q * f.p;
        const prcEl = document.getElementById('prc-' + f.id);
        if (prcEl) prcEl.innerText = subtotal.toLocaleString() + " 円";
        extraFee += subtotal;
    });

    // 運賃計算（通常期 vs 繁忙期）
    let wdBase = 0, hdBase = 0;
    if (!isBusy) {
        wdBase = n1*master.wd1t + n2*master.wd2t + n3*master.wd3t + n4*master.wd4t + nS*master.wdSt;
        hdBase = n1*master.hd1t + n2*master.hd2t + n3*master.hd3t + n4*master.hd4t + nS*master.hdSt;
    } else {
        wdBase = n1*master.bwd1t + n2*master.bwd2t + n3*master.bwd3t + n4*master.bwd4t + nS*master.bwdSt;
        hdBase = n1*master.bhd1t + n2*master.bhd2t + n3*master.bhd3t + n4*master.bhd4t + nS*master.bhdSt;
    }

    // フリー便割引計算（8時間との差分を引く）
    // 台数(1~3t) * 車両単価 + 人数 * 人工単価
    let freeDiscount = 0;
    if (h > 0 && h < 8) {
        freeDiscount = ((n1+n2+n3) * master.f_car + nS * master.f_man) * (8 - h);
    }

    // 画面反映
    document.getElementById('wd-fixed').innerText = (wdBase + extraFee).toLocaleString();
    document.getElementById('hd-fixed').innerText = (hdBase + extraFee).toLocaleString();
    document.getElementById('wd-free').innerText = Math.max(0, wdBase - freeDiscount + extraFee).toLocaleString();
    document.getElementById('hd-free').innerText = Math.max(0, hdBase - freeDiscount + extraFee).toLocaleString();
}

// 9. ページ遷移
function movePage(d) {
    let next = currentPage + d;
    if (next < 1 || next > 4) return;
    
    document.getElementById(`step${currentPage}`).classList.remove('active');
    document.getElementById(`step${next}`).classList.add('active');
    
    currentPage = next;
    
    // ヘッダーとナビゲーションの更新
    const titles = ["家財入力", "付帯・実費", "配車設定", "結果比較"];
    document.getElementById('page-title').innerText = titles[currentPage - 1];
    document.getElementById('step-indicator').innerText = currentPage + " / 4";
    
    window.scrollTo(0, 0);
}

// 開始
window.onload = init;
