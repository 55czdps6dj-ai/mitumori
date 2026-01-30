// admin.js - スマホ対応版ロジック

function initAdmin() {
    // 1. 車両・基本単価
    const masterArea = document.getElementById('master-inputs');
    const labels = {
        wd2t: "平日 2T車 基本", wd3t: "平日 3T車 基本", wdSt: "平日 作業員",
        hd2t: "休日 2T車 基本", hd3t: "休日 3T車 基本", hdSt: "休日 作業員",
        f_car: "フリー便 車両割引/h", f_man: "フリー便 作業員割引/h", busy_r: "繁忙期 倍率"
    };

    masterArea.innerHTML = "";
    for (let key in master) {
        const div = document.createElement('div');
        div.className = 'input-group';
        div.innerHTML = `
            <div class="label-row">
                <label>${labels[key] || key}</label>
                <span class="unit-tag">${key==='busy_r' ? '倍' : '円'}</span>
            </div>
            <input type="number" id="m-${key}" value="${master[key]}" step="${key==='busy_r' ? '0.1' : '1'}">
        `;
        masterArea.appendChild(div);
    }

    // 2. 付帯工事
    const futaiArea = document.getElementById('futai-inputs');
    futaiArea.innerHTML = "";
    futai.forEach((f, idx) => {
        const div = document.createElement('div');
        div.className = 'futai-group';
        div.innerHTML = `
            <div class="label-row">
                <label>項目名</label>
            </div>
            <input type="text" id="f-n-${idx}" value="${f.n}">
            <div class="label-row" style="margin-top:5px;">
                <label>単価 (円)</label>
            </div>
            <input type="number" id="f-p-${idx}" value="${f.p}">
            <input type="hidden" id="f-id-${idx}" value="${f.id}">
        `;
        futaiArea.appendChild(div);
    });
}

function exportConfig() {
    let txt = "// config.js - 料金設定\n\nconst master = {\n";
    const masterKeys = Object.keys(master);
    masterKeys.forEach((key, i) => {
        const val = document.getElementById(`m-${key}`).value;
        const comma = (i === masterKeys.length - 1) ? "" : ",";
        txt += `    ${key}: ${val}${comma}\n`;
    });
    txt += "};\n\nconst futai = [\n";
    futai.forEach((f, idx) => {
        const n = document.getElementById(`f-n-${idx}`).value;
        const p = document.getElementById(`f-p-${idx}`).value;
        const id = document.getElementById(`f-id-${idx}`).value;
        const comma = (idx === futai.length - 1) ? "" : ",";
        txt += `    {id:"${id}", n:"${n}", p:${p}}${comma}\n`;
    });
    txt += "];";

    const blob = new Blob([txt], {type: 'text/javascript'});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.js';
    a.click();
    window.URL.revokeObjectURL(url);
    alert("保存しました。ファイルを入れ替えてください。");
}
window.onload = initAdmin;
