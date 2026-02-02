// admin.js - 京王運輸 管理者設定エンジン
let currentMaster = {};

/**
 * 1. 初期化処理
 */
function initAdmin() {
    // 1. ローカルストレージから保存済みの設定を読み込む。なければconfig.jsのmasterを使用
    const savedMaster = localStorage.getItem('keio_quote_master');
    if (savedMaster) {
        currentMaster = JSON.parse(savedMaster);
    } else {
        currentMaster = Object.assign({}, master); // config.jsの値をコピー
    }

    renderAdminForm();
}

/**
 * 2. 設定フォームの動的生成
 */
function renderAdminForm() {
    const container = document.getElementById('admin-form');
    container.innerHTML = ''; // クリア

    // カテゴリー定義
    const groups = [
        { title: "【平日】運賃単価", keys: ['wd1t', 'wd2t', 'wd3t', 'wd4t', 'wdSt'] },
        { title: "【休日】運賃単価", keys: ['hd1t', 'hd2t', 'hd3t', 'hd4t', 'hdSt'] },
        { title: "【繁忙期・平日】運賃単価", keys: ['bwd1t', 'bwd2t', 'bwd3t', 'bwd4t', 'bwdSt'] },
        { title: "【繁忙期・休日】運賃単価", keys: ['bhd1t', 'bhd2t', 'bhd3t', 'bhd4t', 'bhdSt'] },
        { title: "【フリー便・その他】", keys: ['f_car', 'f_man'] }
    ];

    // 各グループの入力欄を作成
    groups.forEach(group => {
        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `<h2>${group.title}</h2>`;

        group.keys.forEach(key => {
            const labelName = getLabelName(key);
            const row = document.createElement('div');
            row.className = 'input-group';
            row.innerHTML = `
                <span>${labelName}</span>
                <div>
                    <input type="number" id="input-${key}" value="${currentMaster[key]}" step="100">
                    <span style="font-size:0.8rem;">円</span>
                </div>
            `;
            card.appendChild(row);
        });
        container.appendChild(card);
    });
}

/**
 * 3. キー名を日本語ラベルに変換
 */
function getLabelName(key) {
    const labels = {
        'wd1t': '1t車以下', 'wd2t': '2t車', 'wd3t': '3t車', 'wd4t': '4t車', 'wdSt': '作業員',
        'hd1t': '1t車以下', 'hd2t': '2t車', 'hd3t': '3t車', 'hd4t': '4t車', 'hdSt': '作業員',
        'bwd1t': '1t車以下', 'bwd2t': '2t車', 'bwd3t': '3t車', 'bwd4t': '4t車', 'bwdSt': '作業員',
        'bhd1t': '1t車以下', 'bhd2t': '2t車', 'bhd3t': '3t車', 'bhd4t': '4t車', 'bhdSt': '作業員',
        'f_car': 'フリー便車両割引/h', 'f_man': 'フリー便作業員割引/h'
    };
    return labels[key] || key;
}

/**
 * 4. 設定の保存
 */
function saveConfig() {
    // 全ての入力を読み取ってcurrentMasterを更新
    for (let key in currentMaster) {
        const input = document.getElementById('input-' + key);
        if (input) {
            currentMaster[key] = Number(input.value);
        }
    }

    // ローカルストレージに保存
    localStorage.setItem('keio_quote_master', JSON.stringify(currentMaster));

    alert("設定を保存しました。見積画面に戻ります。");
    window.location.href = "index.html";
}

/**
 * 5. 設定の初期化（リセット）
 */
function resetConfig() {
    if (confirm("すべての設定を初期値（config.jsの値）に戻しますか？")) {
        localStorage.removeItem('keio_quote_master');
        location.reload();
    }
}

// ページ読み込み時に実行
window.onload = initAdmin;
