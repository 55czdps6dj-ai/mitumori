// admin.js - 管理画面専用ロジック (Ver 4.0)

function initAdmin() {
    // 1. 車両・基本単価の入力欄を全表示
    const masterArea = document.getElementById('master-inputs');
    const labels = {
        wd2t: "平日 2T車 基本料金", 
        wd3t: "平日 3T車 基本料金", 
        wdSt: "平日 作業員 単価",
        hd2t: "休日 2T車 基本料金", 
        hd3t: "休日 3T車 基本料金", 
        hdSt: "休日 作業員 単価",
        f_car: "フリー便 車両割引 (1hあたり)", 
        f_man: "フリー便 作業員割引 (1hあたり)", 
        busy_r: "繁忙期 倍率設定"
    };

    masterArea.innerHTML = ""; // 初期化
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

    // 2. 付帯工事のリストを全表示
    const futaiArea = document.getElementById('futai-inputs');
    futaiArea.innerHTML = ""; // 初期化
    futai.forEach((f, idx) => {
        const div = document.createElement('div');
        div.className = 'futai-group';
        div.innerHTML = `
            <input type="text" id="f-n-${idx}" value="${f.n}" placeholder="項目名">
            <input type="number" id="f-p-${idx}" value="${f.p}" placeholder="料金">
            <span>円</span>
            <input type="hidden" id="f-id-${idx}" value="${f.id}">
        `;
        futaiArea.appendChild(div);
    });
}

// 3. 編集した内容を config.js 形式のテキストで書き出し
function exportConfig() {
    // master部分の生成
    let txt = "// config.js - 料金設定\n\nconst master = {\n";
    const masterKeys = Object.keys(master);
    masterKeys.forEach((key, i) => {
        const val = document.getElementById(`m-${key}`).value;
        const comma = (i === masterKeys.length - 1) ? "" : ",";
        txt += `    ${key}: ${val}${comma}\n`;
    });
    txt += "};\n\n";

    // futai部分の生成
    txt += "const futai = [\n";
    futai.forEach((f, idx) => {
        const n = document.getElementById(`f-n-${idx}`).value;
        const p = document.getElementById(`f-p-${idx}`).value;
        const id = document.getElementById(`f-id-${idx}`).value;
        const comma = (idx === futai.length - 1) ? "" : ",";
        txt += `    {id:"${id}", n:"${n}", p:${p}}${comma}\n`;
    });
    txt += "];";

    // ファイルダウンロード処理
    const blob = new Blob([txt], {type: 'text/javascript'});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.js';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    alert("新しい config.js を出力しました。\nダウンロードされたファイルで、元の config.js を上書きしてください。");
}

// ページ読み込み時に実行
window.onload = initAdmin;
