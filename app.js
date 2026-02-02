// app.js - 京王運輸 専用ロジック
let counts = {};
let currentPage = 1;

function init() {
    const list = document.getElementById('list-container');
    if (!list) return;
    for (let cat in moveData) {
        let div = document.createElement('div');
        div.className = 'cat-title'; div.innerText = cat;
        let cont = document.createElement('div');
        moveData[cat].forEach(g => {
            g.v.forEach(v => {
                let row = document.createElement('div');
                row.className = 'var-row';
                row.innerHTML = `<span>${v.n} (${v.p}P)</span><div class="ctrls">
                    <button class="btn-qty" onclick="chg('${g.g+v.n}',-1,${v.p})">－</button>
                    <input type="number" id="q-${g.g+v.n}" class="qty-input" value="0" readonly>
                    <button class="btn-qty" onclick="chg('${g.g+v.n}',1,${v.p})">＋</button>
                </div>`;
                cont.appendChild(row);
            });
        });
        list.appendChild(div); list.appendChild(cont);
    }
    const fArea = document.getElementById('futa-inputs');
    futai.forEach(f => {
        let d = document.createElement('div'); d.className = 'var-row';
        d.innerHTML = `<span>${f.n}</span><div class="ctrls"><input type="number" id="${f.id}" class="qty-input" value="0">台</div>`;
        fArea.appendChild(d);
    });
    updateCalc();
}

function chg(id, d, p) {
    counts[id] = Math.max(0, (counts[id] || 0) + d);
    document.getElementById('q-'+id).value = counts[id];
    let total = 0;
    for (let key in counts) {
        let itemP = 0;
        for (let c in moveData) moveData[c].forEach(g => g.v.forEach(v => { if(g.g+v.n === key) itemP = v.p; }));
        total += counts[key] * itemP;
    }
    document.getElementById('total-pts-1').innerText = total;
    updateCalc();
}

function movePage(d) {
    let next = currentPage + d; if (next < 1 || next > 4) return;
    document.getElementById(`step${currentPage}`).classList.remove('active');
    document.getElementById(`step${next}`).classList.add('active');
    currentPage = next;
    document.getElementById('step-indicator').innerText = currentPage + " / 4";
    window.scrollTo(0,0);
}

function updateCalc() {
    const isB = document.getElementById('is-busy').checked;
    const n1 = parseInt(document.getElementById('unit-1t').value) || 0;
    const n2 = parseInt(document.getElementById('unit-2t').value) || 0;
    const n3 = parseInt(document.getElementById('unit-3t').value) || 0;
    const n4 = parseInt(document.getElementById('unit-4t').value) || 0;
    const nS = parseInt(document.getElementById('unit-staff').value) || 0;
    const h = parseFloat(document.getElementById('work-time').value) || 0;

    // 付帯・実費
    let extra = parseInt(document.getElementById('fee-road').value) || 0;
    futai.forEach(f => { extra += (parseInt(document.getElementById(f.id).value) || 0) * f.p; });

    // 運賃計算（通常/繁忙 × 平日/休日）
    let wd, hd;
    if (!isB) {
        wd = n1*master.wd1t + n2*master.wd2t + n3*master.wd3t + n4*master.wd4t + nS*master.wdSt;
        hd = n1*master.hd1t + n2*master.hd2t + n3*master.hd3t + n4*master.hd4t + nS*master.hdSt;
    } else {
        wd = n1*master.bwd1t + n2*master.bwd2t + n3*master.bwd3t + n4*master.bwd4t + nS*master.bwdSt;
        hd = n1*master.bhd1t + n2*master.bhd2t + n3*master.bhd3t + n4*master.bhd4t + nS*master.bhdSt;
    }

    const fDisc = ((n1+n2+n3)*master.f_car + nS*master.f_man) * (8 - h); // 8hからの差分を引く簡易計算

    document.getElementById('wd-fixed').innerText = (wd + extra).toLocaleString();
    document.getElementById('hd-fixed').innerText = (hd + extra).toLocaleString();
    document.getElementById('wd-free').innerText = (wd - (h>0?fDisc:0) + extra).toLocaleString();
    document.getElementById('hd-free').innerText = (hd - (h>0?fDisc:0) + extra).toLocaleString();
}

function saveLog(s) {
    let logs = JSON.parse(localStorage.getItem('moving_logs') || '[]');
    logs.push({date: new Date().toLocaleString(), status: s, pts: document.getElementById('total-pts-1').innerText, price: document.getElementById('wd-fixed').innerText});
    localStorage.setItem('moving_logs', JSON.stringify(logs));
    alert(s + "として保存しました。");
}

init();
