// app.js - 営業見積シミュレーター v4.0 完全版

let counts = {};
let currentPage = 1;

// 1. 初期化：画面生成
function init() {
    const list = document.getElementById('list-container');
    if (!list) return;

    // 家財リスト生成（2段アコーディオン）
    for (let catName in moveData) {
        const catTitle = document.createElement('div');
        catTitle.className = 'cat-title';
        catTitle.innerHTML = `<span>${catName}</span><span>▼</span>`;
        
        const catContent = document.createElement('div');
        catContent.className = 'cat-content';
        
        catTitle.onclick = () => catContent.classList.toggle('active');

        moveData[catName].forEach(group => {
            const gDiv = document.createElement('div');
            gDiv.className = 'group-item';
            
            const gHeader = document.createElement('div');
            gHeader.className = 'group-header';
            gHeader.innerHTML = `<span>${group.g}</span><span id="gsum-${group.g}" style="color:var(--blue); font-size:0.75rem;">0 P</span>`;
            
            const gContent = document.createElement('div');
            gContent.className = 'group-content';
            
            gHeader.onclick = (e) => { 
                e.stopPropagation(); 
                gHeader.classList.toggle('open'); 
                gContent.classList.toggle('active'); 
            };

            group.v.forEach(v => {
                const id = group.g + v.n;
                const row = document.createElement('div');
                row.className = 'var-row';
                row.innerHTML = `
                    <div class="var-info">
                        <span class="var-name">${v.n}</span>
                        <span class="var-size">H${v.h} W${v.w} D${v.d}</span>
                        <span style="font-size:0.7rem; color:var(--blue); font-weight:bold;">${v.p} P</span>
                    </div>
                    <div class="ctrls">
                        <button class="btn-qty" onclick="chg('${id}',-1,${v.p},'${group.g}')">－</button>
                        <input type="number" id="q-${id}" class="qty-input" value="0" readonly>
                        <button class="btn-qty" onclick="chg('${id}',1,${v.p},'${group.g}')">＋</button>
                    </div>`;
                gContent.appendChild(row);
            });
            gDiv.appendChild(gHeader);
            gDiv.appendChild(gContent);
            catContent.appendChild(gDiv);
        });
        list.appendChild(catTitle);
        list.appendChild(catContent);
    }

    // 付帯工事リスト生成（全項目表示）
    const fArea = document.getElementById('futa-inputs');
    if (fArea) {
        futai.forEach(f => {
            const d = document.createElement('div');
            d.className = 'var-row';
            d.innerHTML = `
                <div class="var-info">
                    <span class="var-name">${f.n}</span>
                    <span style="font-size:0.7rem; color:#888;">単価: ${f.p.toLocaleString()} 円</span>
                </div>
                <div class="ctrls">
                    <input type="number" id="${f.id}" class="qty-input" value="0" min="0" onchange="updateCalc()">
                    <span class="unit-label">台</span>
                </div>
                <div id="price-${f.id}" class="item-calc-price">0円</div>`;
            fArea.appendChild(d);
        });
    }
    updateCalc();
}

// 2. 数量変更とポイント集計
function chg(id, d, p, gName) {
    counts[id] = Math.max(0, (counts[id] || 0) + d);
    const input = document.getElementById('q-' + id);
    if (input) input.value = counts[id];
    
    let grand = 0;
    for (let c in moveData) {
        moveData[c].forEach(g => {
            let gSum = 0;
            g.v.forEach(v => { gSum += (counts[g.g + v.n] || 0) * v.p; });
            const gsumEl = document.getElementById('gsum-' + g.g);
            if (gsumEl) gsumEl.innerText = gSum + " P";
            grand += gSum;
        });
    }
    // 合計ポイントの更新
    document.getElementById('total-pts-1').innerText = grand;
    document.getElementById('total-pts-3').innerText = grand;
    updateCalc();
}

// 3. 画面遷移
function movePage(d) {
    const next = currentPage + d; 
    if (next < 1 || next > 4) return;
    document.getElementById(`step${currentPage}`).classList.remove('active');
    document.getElementById(`step${next}`).classList.add('active');
    currentPage = next;
    document.getElementById('step-indicator').innerText = currentPage + " / 4";
    const titles = ["家財リスト", "付帯・実費", "配車設定", "最終比較"];
    document.getElementById('page-title').innerText = titles[currentPage - 1];
    window.scrollTo(0, 0);
}

// 4. 計算メインロジック
function updateCalc() {
    const isB = document.getElementById('is-busy')?.checked;
    const rate = isB ? master.busy_r : 1.0;
    const n2 = parseInt(document.getElementById('unit-2t')?.value) || 0;
    const n3 = parseInt(document.getElementById('unit-3t')?.value) || 0;
    const nS = parseInt(document.getElementById('unit-staff')?.value) || 0;
    const h = parseFloat(document.getElementById('work-time')?.value) || 0;

    // 付帯工事費の計算（項目の下に料金表示）
    let extraTotal = 0;
    futai.forEach(f => {
        const q = parseInt(document.getElementById(f.id)?.value) || 0;
        const sub = q * f.p;
        const priceDisplay = document.getElementById('price-' + f.id);
        if (priceDisplay) {
            if (q > 0) { 
                priceDisplay.innerText = sub.toLocaleString() + " 円"; 
                priceDisplay.style.display = "block"; 
            } else { 
                priceDisplay.style.display = "none"; 
            }
        }
        extraTotal += sub;
    });
    
    // 実費・経費の加算
    extraTotal += (parseInt(document.getElementById('fee-yojo')?.value) || 0);
    extraTotal += (parseInt(document.getElementById('fee-road')?.value) || 0);
    extraTotal += (parseInt(document.getElementById('fee-ins')?.value) || 0);

    // 基本運賃（平日・休日）
    let wdBase = ((n2 * master.wd2t) + (n3 * master.wd3t) + (nS * master.wdSt)) * rate;
    let hdBase = ((n2 * master.hd2t) + (n3 * master.hd3t) + (nS * master.hdSt)) * rate;
    
    // フリー便割引額
    const freeDiscount = ((n2 + n3) * master.f_car + nS * master.f_man) * h;
    
    // 割引・値引き（時間指定のみ）
    const pctDisc = document.getElementById('disc-20')?.checked ? 0.8 : 1.0;
    const manualDisc = parseInt(document.getElementById('disc-extra')?.value) || 0;

    // 結果の反映
    // 時間指定：(基本運賃 * 20%割引) - 特別値引き + 付帯/実費
    document.getElementById('wd-fixed').innerText = Math.floor(wdBase * pctDisc - manualDisc + extraTotal).toLocaleString();
    document.getElementById('hd-fixed').innerText = Math.floor(hdBase * pctDisc - manualDisc + extraTotal).toLocaleString();
    
    // フリー便：基本運賃 - フリー便割引 + 付帯/実費
    document.getElementById('wd-free').innerText = Math.floor(wdBase - freeDiscount + extraTotal).toLocaleString();
    document.getElementById('hd-free').innerText = Math.floor(hdBase - freeDiscount + extraTotal).toLocaleString();
}

// 起動
init();
