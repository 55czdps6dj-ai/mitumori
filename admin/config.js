// admin.js - 管理画面用制御スクリプト

function initAdmin() {
    // 1. 車両・基本単価の入力欄生成
    const masterArea = document.getElementById('master-inputs');
    const masterLabels = {
        wd2t: "平日 2T車 (台)", wd3t: "平日 3T車 (台)", wdSt: "平日 作業員 (名)",
        hd2t: "休日 2T車 (台)", hd3t: "休日 3T車 (台)", hdSt: "休日 作業員 (名)",
        f_car: "フリー便 車両割引/h", f_man: "フリー便 作業員割引/h", busy_r: "繁忙期倍率 (1.5等)"
    };

    for (let key in master) {
        const div = document.createElement('div');
        div.className = 'input-group';
        div.innerHTML = `
            <label>${masterLabels[key] || key}</label>
            <input type="number" id="m-${key}" value="${master[key]}" step="${key==='busy_r' ? '0.1' : '1'}">
            <span>${key==='busy_r' ? '倍' : '円'}</span>
        `;
        masterArea.appendChild(div);
    }

    // 2. 付帯工事の入力欄生成
    const futaiArea = document.getElementById('futai-inputs');
    futai.forEach((f, index) => {
        const div = document.createElement('div');
        div.className = 'input-group';
        div.innerHTML = `
            <input type="text" id="f-n-${index}" value="${f.n}">
            <input type="number" id="f-p-${index}" value="${f.p}">
            <span>円</span>
            <input type="hidden" id="f-id-${index}" value="${f.id}">
        `;
        futaiArea.appendChild(div);
    });
}

// 3. 新しい config.js の中身を生成してダウンロード
function generateConfigJS() {
    let newMaster = "const master = {\n";
    for (let key in master) {
        const val = document.getElementById(`m-${key}`).value;
        newMaster += `    ${key}: ${val},\n`;
    }
    newMaster = newMaster.slice(0, -2) + "\n};\n\n";

    let newFutai = "const futai = [\n";
    futai.forEach((f, index) => {
        const n = document.getElementById(`f-n-${index}`).value;
        const p = document.getElementById(`f-p-${index}`).value;
        const id = document.getElementById(`f-id-${index}`).value;
        newFutai += `    {id:"${id}", n:"${n}", p:${p}},\n`;
    });
    newFutai = newFutai.slice(0, -2) + "\n];";

    const fullContent = "// config.js - 料金設定\n" + newMaster + newFutai;
    
    // ファイルとしてダウンロードさせる処理
    const blob = new Blob([fullContent], {type: 'text/javascript'});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.js';
    a.click();
    window.URL.revokeObjectURL(url);
    
    alert("新しい config.js をダウンロードしました。元のフォルダに上書き保存してください。");
}

initAdmin();
