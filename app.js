// app.js - 京王運輸 専用ロジック Ver 7.0
let counts = {};
let customFutai = []; // {id, name, price}
let currentPage = 1;

function init() {
    const list = document.getElementById('list-container');
    moveDataFlat.forEach(item => {
        list.appendChild(createRow(item));
    });

    renderAC();
    renderUnits();
    setupSearch();
    updateCalc();
}

// 家財行の生成
function createRow(item) {
    let row = document.createElement('div');
    row.className = 'var-row';
    row.dataset.name = item.n;
    row.innerHTML = `
        <div class="item-info">
            <span style="font-weight:bold;">${item.n}</span>
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

// 検索
function setupSearch() {
    document.getElementById('item-search').addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        document.querySelectorAll('.var-row').forEach(row => {
            const name = row.dataset.name ? row.dataset.name.toLowerCase() : "";
            row.style.display = name.includes(val) ? 'flex' : 'none';
        });
    });
}

// 数量変更 & サマリー更新
function chg(name, d, p) {
    counts[name] = Math.max(0, (counts[name] || 0) + d);
    document.getElementById('q-' + name).value = counts[name];
    
    let totalPts = 0;
    const summaryList = document.getElementById('selected-items-list');
    summaryList.innerHTML = '';
    
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
    
    document.getElementById('selected-summary').style.display = totalPts > 0 ? 'block' : 'none';
    document.getElementById('total-pts-1').innerText = totalPts;
    updateCalc();
}

// エアコン描画
function renderAC() {
    const area = document.getElementById('ac-inputs');
    futaiFixed.forEach(f => {
        let d = document.createElement('div');
        d.className = 'var-row';
        d.innerHTML = `<span>${f.n} (${f.p.toLocaleString()}円)</span>
            <div class="ctrls">
                <button class="btn-qty" onclick="spinF('${f.id}', -1)">－</button>
                <input type="number" id="${f.id}" class="qty-input" value="0" readonly>
                <button class="btn-qty" onclick="spinF('${f.id}', 1)">＋</button>
            </div>`;
        area.appendChild(d);
    });
}

// 自由入力付帯
function addCustomFuta() {
    customFutai.push({ id: Date.now(), name: '', price: 0 });
    renderCustomList();
}

function renderCustomList() {
    const container = document.getElementById('custom-list');
    container.innerHTML = '';
    customFutai.forEach((f, index) => {
        let d = document.createElement('div');
        d.className = 'custom-item-row';
        d.innerHTML = `
            <input type="text" placeholder="内容" value="${f.name}" oninput="customFutai[${index}].name=this.value; updateCalc()" style="flex:2;">
            <input type="number" placeholder="金額" value="${f.price}" oninput="customFutai[${index}].price=Number(this.value); updateCalc()" style="flex:1;">
            <button onclick="customFutai.splice(${index},1); renderCustomList(); updateCalc()" style="background:var(--red); color:white; border:none; border-radius:4px; width:35px;">×</button>
        `;
        container.appendChild(d);
    });
}

// 計算メイン
function updateCalc() {
    const isBusy = document.getElementById('is-busy')?.checked;
    const isDiscount = document.getElementById('is-discount')?.checked;
    
    const n1 = parseInt(document.getElementById('unit-1t')?.value) || 0;
    const n2 = parseInt(document.getElementById('unit-2t')?.value) || 0;
    const n3 = parseInt(document.getElementById('unit-3t')?.value) || 0;
    const n4 = parseInt(document.getElementById('unit-4t')?.value) || 0;
    const nS = parseInt(document.getElementById('unit-staff')?.value) || 0;
    const h = parseFloat(document.getElementById('work-time')?.value) || 0;

    // 1. 運賃計算
    let wdBase = 0, hdBase = 0;
    if (!isBusy) {
        wdBase = n1*master.wd1t + n2*master.wd2t + n3*master.wd3t + n4*master.wd4t + nS*master.wdSt;
        hdBase = n1*master.hd1t + n2*master.hd2t + n3*master.hd3t + n4*master.hd4t + nS*master.hdSt;
    } else {
        wdBase = n1*master.bwd1t + n2*master.bwd2t + n3*master.bwd3t + n4*master.bwd4t + nS*master.bwdSt;
        hdBase = n1*master.bhd1t + n2*master.bhd2t + n3*master.bhd3t + n4*master.bhd4t + nS*master.bhdSt;
    }

    // 2. 運賃20%割引
    if (isDiscount) {
        wdBase *= 0.8;
        hdBase *= 0.8;
    }

    // 3. 付帯・実費
    let extra = parseInt(document.getElementById('fee-road')?.value) || 0;
    futaiFixed.forEach(f => {
        extra += (parseInt(document.getElementById(f.id)?.value) || 0) * f.p;
    });
    customFutai.forEach(f => { extra += f.price; });

    // 4. フリー便
    let fDisc = 0;
    if (h > 0 && h < 8) {
        fDisc = ((n1+n2+n3) * master.f_car + nS * master.f_man) * (8 - h);
        if (isDiscount) fDisc *= 0.8;
    }

    document.getElementById('wd-fixed').innerText = Math.round(wdBase + extra).toLocaleString();
    document.getElementById('hd-fixed').innerText = Math.round(hdBase + extra).toLocaleString();
    document.getElementById('wd-free').innerText = Math.round(Math.max(0, wdBase - fDisc + extra)).toLocaleString();
    document.getElementById('hd-free').innerText = Math.round(Math.max(0, hdBase - fDisc + extra)).toLocaleString();
}

// 共通パーツ描画
function renderUnits() {
    const area = document.getElementById('unit-ctrls-area');
    const arr = [{id:'unit-1t',n:'1t車以下'},{id:'unit-2t',n:'2t車'},{id:'unit-3t',n:'3t車'},{id:'unit-4t',n:'4t車'},{id:'unit-staff',n:'作業員'}];
    arr.forEach(u => {
        let d = document.createElement('div'); d.className = 'var-row';
        d.innerHTML = `<span>${u.n}</span><div class="ctrls"><button class="btn-qty" onclick="spin('${u.id}',-1,0,99)">－</button><input type="number" id="${u.id}" class="qty-input" value="0" readonly><button class="btn-qty" onclick="spin('${u.id}',1,0,99)">＋</button></div>`;
        area.appendChild(d);
    });
}

function spin(id, d, min, max) {
    let el = document.getElementById(id);
    el.value = Math.min(Math.max((parseInt(el.value)||0)+d, min), max);
    updateCalc();
}

function spinF(id, d) {
    let el = document.getElementById(id);
    el.value = Math.max(0, (parseInt(el.value)||0)+d);
    updateCalc();
}

function movePage(d) {
    let n = currentPage + d;
    if (n<1 || n>4) return;
    document.getElementById(`step${currentPage}`).classList.remove('active');
    document.getElementById(`step${n}`).classList.add('active');
    currentPage = n;
    document.getElementById('page-title').innerText = ["家財入力","付帯・実費","配車設定","結果比較"][n-1];
    document.getElementById('step-indicator').innerText = n + " / 4";
    window.scrollTo(0,0);
}

window.onload = init;
