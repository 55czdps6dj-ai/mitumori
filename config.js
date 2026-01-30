// config.js - 料金設定
const master = { 
    wd2t: 34500, // 平日2T車
    wd3t: 36500, // 平日3T車
    wdSt: 20000, // 平日作業員
    hd2t: 44500, // 休日2T車
    hd3t: 46500, // 休日3T車
    hdSt: 30000, // 休日作業員
    f_car: 5500, // フリー便 車両割引/h
    f_man: 3250, // フリー便 作業員割引/h
    busy_r: 1.5  // 繁忙期倍率
};

const futai = [
    {id:"ac-off", n:"エアコン取外し", p:5500},
    {id:"ac-on", n:"エアコン取付け", p:6500},
    {id:"washer-set", n:"洗濯機設置(縦型)", p:3300},
    {id:"washer-drum", n:"洗濯機設置(ドラム)", p:8800},
    {id:"tv-set", n:"TV・レコーダー配線", p:4400}
];
