// app.js - 京王運輸 専用ロジック v5.1 (完全版)

let counts = {};
let currentPage = 1;

function init() {
    const list = document.getElementById('list-container');
    if (!list) return;

    // 家財リスト生成
    for (let cat in moveData) {
        let div = document.createElement('div');
        div.className = 'cat-title';
        div.innerText = cat;
        let cont = document.createElement('div');
        
        moveData[cat].forEach(g => {
            g.v.forEach(v => {
                let row = document.createElement('div');
                row.className = 'var-row';
                let id = g.g + v.n;
                row.innerHTML = `
                    <span>${v.n} (${v.p}P)</span>
                    <div class="ctrls">
                        <button class="btn-qty" onclick="chg('${id}',-1,${v.p})">－</button>
                        <input type="number" id="q-${id}" class="qty-input" value="0" readonly>
                        <button class="btn-qty" onclick="chg('${id}',1,${v.p})">＋</button>
                    </div>`;
                cont.appendChild(row);
            });
        });
        list.appendChild(div);
        list.appendChild(cont);
    }

    // 付帯・工事リスト生成
    const fArea = document.getElementById('futa-inputs');
    if (fArea) {
        fArea.innerHTML = "";
        futai.forEach(f => {
            let d = document.createElement('div');
            d.className = 'var-row';
            d.innerHTML = `
                <span>${f.n}</span>
                <div class="ctrls">
                    <input type="number" id="${f.id}" class="qty-input" value="0" min="0" onchange="updateCalc()">
                    <span style="font-size:0.8rem; margin-left:5px;">個/台</span>
                </div>`;
            fArea.appendChild(d);
        });
    }
    updateCalc();
}

function chg(id, d, p) {
    counts[id] = Math.max(0, (counts[id] || 0) + d);
    const input = document.getElementById('q-' + id);
    if (input) input.value = counts[id];
    
    // 合計ポイント計算
    let total = 0;
    for (let key in counts) {
        let itemP = 0;
        // moveDataの中から該当するポイントを探す
        for (let c in moveData) {
            moveData[c].forEach(g => {
                g.v.forEach(v => {
                    if (g.g + v.n === key) itemP = v.p;
                });
            });
        }
        total += counts[key] * itemP;
    }
    
    const ptsDisp = document.getElementById('total-pts-1');
    if (ptsDisp) ptsDisp.innerText = total;
    
    updateCalc();
}

function movePage(d) {
    let next = currentPage + d; 
    if (next < 1 || next > 4) return;
    document.getElementById(`step${currentPage}`).classList.remove('active');
    document.getElementById(`step${next}`).classList.add('active');
    currentPage = next;
    
    const indicator = document.getElementById('step-indicator');
    if (indicator) indicator.innerText = currentPage + " / 4";
    
    const title = document.getElementById('page-title');
    const titles = ["家財リスト", "付帯・実費", "配車設定", "最終比較"];
    if (title) title.innerText = titles[currentPage - 1];
    
    window.scrollTo(0,0);
    updateCalc();
}

function updateCalc() {
    // 繁忙期フラグ
    const isBusy = document.getElementById('is-busy')?.checked || false;

    // 各車種の台数と作業員数
    const n1 = parseInt(document.getElementById('unit-1t')?.value) || 0;
    const n2 = parseInt(document.getElementById('unit-2t')?.value) || 0;
    const n3 = parseInt(document.getElementById('unit-3t')?.value) || 0;
    const n4 = parseInt(document.getElementById('unit-4t')?.value) || 0;
    const nS = parseInt(document.getElementById('unit-staff')?.value) || 0;
    
    // フリー便の時間（8時間との差分を計算用）
    const h = parseFloat(document.getElementById('work-time')?.value) || 0;

    // 付帯・実費の計算
    let extra = parseInt(document.getElementById('fee-road')?.value) || 0;
    futai.forEach(f => {
        const q = parseInt(document.getElementById(f.id)?.value) || 0;
        extra += q * f.p;
    });

    // 運賃計算（平日・休日の2パターンを算出）
    let wdBase = 0;
    let hdBase = 0;

    if (!isBusy) {
        // 通常月
        wdBase = (n1 * master.wd1t) + (n2 * master.wd2t) + (n3 * master.wd3t) + (n4 * master.wd4t) + (nS * master.wdSt);
        hdBase = (n1 * master.hd1t) + (n2 * master.hd2t) + (n3 * master.hd3t) + (n4 * master.hd4t) + (nS * master.hdSt);
    } else {
        // 繁忙期
        wdBase = (n1 * master.bwd1t) + (n2 * master.bwd2t) + (n3 * master.bwd3t) + (n4 * master.bwd4t) + (nS * master.bwdSt);
        hdBase = (n1 * master.bhd1t) + (n2 * master.bhd2t) + (n3 * master.bhd3t) + (n4 * master.bhd4t) + (nS * master.bhdSt);
    }

    // フリー便割引（3t以下・時間制の適用）
    // 4時間以内などの条件があるが、ここでは入力された「想定時間」に基づき、8時間フルとの差額を引く計算
    let fDisc = 0;
    if (h > 0 && h < 8) {
        fDisc = ((n1 + n2 + n3) * master.f_car + nS * master.f_man) * (8 - h);
    }

    // 画面への反映（カンマ区切り）
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = Math.max(0, val).toLocaleString();
    };

    setVal('wd-fixed', wdBase + extra);
    setVal('hd-fixed', hdBase + extra);
    setVal('wd-free', (wdBase - fDisc) + extra);
    setVal('hd-free', (hdBase - fDisc) + extra);
}

function saveLog(s) {
    let logs = JSON.parse(localStorage.getItem('moving_logs') || '[]');
    const pts = document.getElementById('total-pts-1')?.innerText || "0";
    const price = document.getElementById('wd-fixed')?.innerText || "0";
    
    logs.push({
        date: new Date().toLocaleString('ja-JP'),
        status: s,
        pts: pts,
        price: price.replace(/,/g, ''),
        details: `1t:${document.getElementById('unit-1t').value}, 2t:${document.getElementById('unit-2t').value}, 3t:${document.getElementById('unit-3t').value}, 4t:${document.getElementById('unit-4t').value}, 員:${document.getElementById('unit-staff').value}`
    });
    
    localStorage.setItem('moving_logs', JSON.stringify(logs));
    alert("【" + s + "】として記録しました。管理画面から確認できます。");
}

// 起動
window.onload = init;
