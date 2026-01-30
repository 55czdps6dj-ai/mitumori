// admin.js - 管理画面専用ロジック

function initAdmin() {
    // 1. 基本単価の入力欄生成
    const masterArea = document.getElementById('master-inputs');
    const labels = {
        wd2t: "平日 2T車 (1台)", wd3t: "平日 3T車 (1台)", wdSt: "平日 作業員 (1名)",
        hd2t: "休日 2T車 (1台)", hd3t: "休日 3T車 (1台)", hdSt: "休日 作業員 (1名)",
        f_car: "フリー便 車両割引/h", f_man: "フリー便 作業員割引/h", busy_r: "繁忙期倍率"
    };

    for (let key in master) {
        const div = document.createElement('div');
        div.className = 'input-group';
        div.innerHTML = `
            <label>${labels[key] || key}</label>
            <input type="number" id="m-${key}" value="${master[key]}" step="${key==='busy_r' ? '0.1' : '1'}">
            <span>${key==='busy_r' ? '倍' : '円'}</span>
        `;
        masterArea.appendChild(div);
    }

    // 2. 付帯工事の入力欄生成
    const futaiArea = document.getElementById('futai-inputs');
    futai.forEach((f, idx) => {
        const div = document.createElement('div');
        div.className = 'input-group';
        div.style.gridTemplateColumns = "1fr 150px 50px";
        div.innerHTML = `
            <input type="text" id="f-n-${idx}" value="${f.n}">
            <input type="number" id="f-p-${idx}" value="${f.p}">
            <span>円</span>
            <input type="hidden" id="f-id-${idx}" value="${f.id}">
        `;
        futaiArea.appendChild(div);
    });
}

// 3. 設定を JS ファイル形式で書き出し
function exportConfig() {
    let txt = "// config.js - 料金設定\n\nconst master = {\n";
    for (let key in master) {
        const val = document.getElementById(`m-${key}`).value;
        txt += `    ${key}: ${val},\n`;
    }
    txt = txt.slice(0, -2) + "\n};\n\nconst futai = [\n";
    
    futai.forEach((f, idx) => {
        const n = document.getElementById(`f-n-${idx}`).value;
        const p = document.getElementById(`f-p-${idx}`).value;
        const id = document.getElementById(`f-id-${idx}`).value;
        txt += `    {id:"${id}", n:"${n}", p:${p}},\n`;
    });
    txt = txt.slice(0, -2) + "\n];";

    const blob = new Blob([txt], {type: 'text/javascript'});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.js';
    a.click();
    window.URL.revokeObjectURL(url);
    
    alert("新しい config.js を作成しました。\nダウンロードされたファイルで元の config.js を上書きしてください。");
}

window.onload = initAdmin;
