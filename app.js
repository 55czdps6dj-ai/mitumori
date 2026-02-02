// app.js - 京王運輸 専用 v5.2 完全版
let counts = {};
let currentPage = 1;

function init() {
    // 1. 家財リストの全表示生成
    const list = document.getElementById('list-container');
    for (let cat in moveData) {
        let title = document.createElement('div');
        title.className = 'cat-title'; title.innerText = cat;
        list.appendChild(title);
        moveData[cat].forEach(g => {
            g.v.forEach(v => {
                let id = g.g + v.n;
                let row = document.createElement('div');
                row.className = 'var-row';
                row.innerHTML = `<span>${v.n} (${v.p}P)</span>
                    <div class="ctrls">
                        <button class="btn-qty" onclick="chg('${id}',-1,${v.p})">－</button>
                        <input type="number" id="q-${id}" class="qty-input" value="0" readonly>
                        <button class="btn-qty" onclick="chg('${id}',1,${v.p})">＋</button>
                    </div>`;
                list.appendChild(row);
            });
        });
    }

    // 2. 付帯工事の全表示生成 (各項目の下に料金表示)
    const fArea = document.getElementById('futa-inputs');
    futai.forEach(f => {
        let d = document.createElement('div');
        d.className = 'var-row';
        d.style.flexWrap = 'wrap';
        d.innerHTML = `
            <div style="width:60%">${f.n}</div>
            <div class="ctrls">
                <button class="btn-qty" onclick="spinF('${f.id}',-1)">－</button>
                <input type="number" id="${f.id}" class="qty-input" value="0" readonly>
                <button class="btn-qty" onclick="spinF('${f.id}',1)">＋</button>
            </div>
            <div id="prc-${f.id}" class="price-display">0 円</div>`;
        fArea.appendChild(d);
    });

    // 3. 配車設定のスピンボタン生成
    const uArea = document.getElementById('unit-ctrls-area');
    const units = [
        {id:'unit-1t', n:'1t車'}, {id:'unit-2t', n:'2t車'}, 
        {id:'unit-3t', n:'3t車'}, {id:'unit-4t', n:'4t車'}, {id:'unit-staff', n:'作業員'}
    ];
    units.forEach(u => {
        let d = document.createElement('div'); d.className = 'var-row';
        d.innerHTML = `<span>${u.n}</span>
            <div class="ctrls">
                <button class="btn-qty" onclick="spin('${u.id}',-1,0,99)">－</button>
                <input type="number" id="${u.id}" class="qty-input" value="0" readonly>
                <button class="btn-qty" onclick="spin('${u.id}',1,0,99)">＋</button>
            </div>`;
        uArea.appendChild(d);
    });

    updateCalc();
}

// スピンボタン(配車・時間用)
function spin(id, d, min, max) {
    let el = document.getElementById(id);
    let val = (parseInt(el.value) || 0) + d;
    el.value = Math.min(Math.max(val, min), max);
    updateCalc();
}

// スピンボタン(付帯工事用)
function spinF(id, d) {
    let el = document.getElementById(id);
    let val = (parseInt(el.value) || 0) + d;
    el.value = Math.max(val, 0);
    updateCalc();
}

function chg(id, d, p) {
    counts[id] = Math.max(0, (counts[id] || 0) + d);
    document.getElementById('q-' + id).value = counts[id];
    let total = 0;
    for (let k in counts) {
        let itemP = 0;
        for (let c in moveData) moveData[c].forEach(g => g.v.forEach(v => { if (g.g+v.n === k) itemP = v.p; }));
        total += counts[k] * itemP;
    }
    document.getElementById('total-pts-1').innerText = total;
    document.getElementById('total-pts-2').innerText = total;
    document.getElementById('total-pts-3').innerText = total;
    updateCalc();
}

function updateCalc() {
    const isB = document.getElementById('is-busy')?.checked;
    const n1 = parseInt(document.getElementById('unit-1t').value) || 0;
    const n2 = parseInt(document.getElementById('unit-2t').value) || 0;
    const n3 = parseInt(document.getElementById('unit-3t').value) || 0;
    const n4 = parseInt(document.getElementById('unit-4t').value) || 0;
    const nS = parseInt(document.getElementById('unit-staff').value) || 0;
    const h = parseFloat(document.getElementById('work-time').value) || 0;

    let extra = parseInt(document.getElementById('fee-road').value) || 0;
    futai.forEach(f => {
        let q = parseInt(document.getElementById(f.id).value) || 0;
        let sub = q * f.p;
        document.getElementById('prc-'+f.id).innerText = sub.toLocaleString() + " 円";
        extra += sub;
    });

    let wd, hd;
    if (!isB) {
        wd = n1*master.wd1t + n2*master.wd2t + n3*master.wd3t + n4*master.wd4t + nS*master.wdSt;
        hd = n1*master.hd1t + n2*master.hd2t + n3*master.hd3t + n4*master.hd4t + nS*master.hdSt;
    } else {
        wd = n1*master.bwd1t + n2*master.bwd2t + n3*master.bwd3t + n4*master.bwd4t + nS*master.bwdSt;
        hd = n1*master.bhd1t + n2*master.bhd2t + n3*master.bhd3t + n4*master.bhd4t + nS*master.bhdSt;
    }

    // フリー便割引 (8h - 指定h) × 1h単価
    let fD = 0;
    if (h > 0 && h < 8) {
        fD = ((n1+n2+n3)*master.f_car + nS*master.f_man) * (8 - h);
    }

    document.getElementById('wd-fixed').innerText = (wd + extra).toLocaleString();
    document.getElementById('hd-fixed').innerText = (hd + extra).toLocaleString();
    document.getElementById('wd-free').innerText = Math.max(0, wd - fD + extra).toLocaleString();
    document.getElementById('hd-free').innerText = Math.max(0, hd - fD + extra).toLocaleString();
}

function movePage(d) {
    let next = currentPage + d; if (next < 1 || next > 4) return;
    document.getElementById(`step${currentPage}`).classList.remove('active');
    document.getElementById(`step${next}`).classList.add('active');
    currentPage = next;
    document.getElementById('step-indicator').innerText = currentPage + " / 4";
    document.getElementById('page-title').innerText = ["家財リスト","付帯・実費","配車設定","最終比較"][currentPage-1];
    window.scrollTo(0,0);
}

function saveLog(s) {
    let logs = JSON.parse(localStorage.getItem('moving_logs') || '[]');
    logs.push({
        date: new Date().toLocaleString(), status: s, 
        pts: document.getElementById('total-pts-1').innerText, 
        price: document.getElementById('wd-fixed').innerText.replace(/,/g,'')
    });
    localStorage.setItem('moving_logs', JSON.stringify(logs));
    alert(s + "としてiPhoneに記録しました。");
}

window.onload = init;
