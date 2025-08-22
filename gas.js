// アンケートデータを保存・取得するGoogle Apps Script

function doPost(e) {
  // e.parameterからフォームのデータを取得
  const params = e.parameter;

  // スプレッドシートを取得
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  // 保存するデータを作成
  const timestamp = new Date();
  const data = [
    timestamp,
    params.q1_hie_muku,
    params.q2_benpi,
    params.q3_nemuke,
    params.q4_katakori,
    params.q5_teashi_hie,
    params.q6_fuan_ochikomi,
    params.q7_iraira,
    params.q8_pms,
    params.q9_seiri_shuki,
    params.q10_performance,
  ];

  try {
    // スプレッドシートの最終行にデータを追加
    sheet.appendRow(data);

    // 成功したことを示すJSONを返す
    return ContentService.createTextOutput(
      JSON.stringify({ result: "success" })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    // エラーが発生した場合
    return ContentService.createTextOutput(
      JSON.stringify({ result: "error", message: error.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// ★★★ 追加：ダッシュボード用のデータ取得機能 ★★★
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    switch (action) {
      case 'getData':
        return getData();
      case 'getStats':
        return getStats();
      case 'exportCSV':
        return exportCSV();
      default:
        return ContentService.createTextOutput(
          JSON.stringify({ result: "error", message: "Invalid action" })
        ).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ result: "error", message: error.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// 全データを取得（CSV形式）
function getData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  // CSVフォーマットに変換
  const csvData = data.map(row => row.join(',')).join('\n');
  
  return ContentService.createTextOutput(
    JSON.stringify({ 
      result: "success", 
      data: csvData,
      rowCount: data.length - 1 // ヘッダー行を除く
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

// 統計データを取得
function getStats() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return ContentService.createTextOutput(
      JSON.stringify({ 
        result: "success", 
        stats: {
          totalResponses: 0,
          avgConcernLevel: 0,
          highConcernCount: 0,
          mostCommonIssue: "データなし",
          categoryStats: {},
          dailyStats: {}
        }
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  const responses = data.slice(1); // ヘッダー行を除く
  const totalResponses = responses.length;
  
  // 統計計算
  let totalConcernScore = 0;
  let highConcernCount = 0;
  const questionConcerns = new Array(10).fill(0);
  const questionLabels = [
    '冷え・むくみ', '便秘・お腹の張り', '眠気・体の重さ', '肩こり・頭痛', '手足の冷え',
    '不安・落ち込み', 'イライラ', 'PMS症状', '生理周期の影響', 'パフォーマンス低下'
  ];
  
  // カテゴリ別統計
  const categoryMapping = {
    '美容・見た目': [0, 1],
    '身体の不調': [2, 3, 4],
    'メンタル': [5, 6],
    '女性特有': [7, 8],
    '仕事・集中力': [9]
  };
  
  const categoryStats = {};
  Object.keys(categoryMapping).forEach(category => {
    categoryStats[category] = { total: 0, count: 0, percentage: 0 };
  });
  
  // 日別統計
  const dailyStats = {};
  
  responses.forEach(row => {
    const timestamp = new Date(row[0]);
    const dateStr = Utilities.formatDate(timestamp, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    
    // 日別カウント
    if (!dailyStats[dateStr]) {
      dailyStats[dateStr] = 0;
    }
    dailyStats[dateStr]++;
    
    let userScore = 0;
    
    // 質問1-10の回答を処理
    for (let i = 1; i <= 10; i++) {
      const response = row[i];
      const score = response === '当てはまる' ? 2 : response === 'どちらともいえない' ? 1 : 0;
      userScore += score;
      questionConcerns[i-1] += score;
    }
    
    totalConcernScore += userScore;
    if (userScore >= 15) highConcernCount++; // 20点中15点以上を高悩み度とする
    
    // カテゴリ別スコア計算
    Object.keys(categoryMapping).forEach(category => {
      const questionIndices = categoryMapping[category];
      questionIndices.forEach(qIndex => {
        const response = row[qIndex + 1]; // +1 because timestamp is at index 0
        const score = response === '当てはまる' ? 2 : response === 'どちらともいえない' ? 1 : 0;
        categoryStats[category].total += score;
        categoryStats[category].count++;
      });
    });
  });
  
  // カテゴリ別パーセンテージ計算
  Object.keys(categoryStats).forEach(category => {
    const maxPossible = categoryStats[category].count * 2;
    categoryStats[category].percentage = maxPossible > 0 ? 
      Math.round((categoryStats[category].total / maxPossible) * 100) : 0;
  });
  
  const avgConcernLevel = Math.round((totalConcernScore / (totalResponses * 20)) * 100);
  
  // 最も多い悩みを特定
  const maxIndex = questionConcerns.indexOf(Math.max(...questionConcerns));
  const mostCommonIssue = questionLabels[maxIndex];
  
  return ContentService.createTextOutput(
    JSON.stringify({ 
      result: "success", 
      stats: {
        totalResponses: totalResponses,
        avgConcernLevel: avgConcernLevel,
        highConcernCount: highConcernCount,
        mostCommonIssue: mostCommonIssue,
        questionConcerns: questionConcerns.map((score, index) => ({
          question: questionLabels[index],
          score: score,
          percentage: Math.round((score / (totalResponses * 2)) * 100)
        })),
        categoryStats: categoryStats,
        dailyStats: dailyStats
      }
    })
  ).setMimeType(ContentService.MimeType.JSON);
}

// CSVエクスポート機能
function exportCSV() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  // CSVフォーマットに変換（日本語対応）
  const csvContent = data.map(row => {
    return row.map(cell => {
      // セルにカンマや改行が含まれている場合はダブルクォートで囲む
      const cellStr = String(cell);
      if (cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"')) {
        return '"' + cellStr.replace(/"/g, '""') + '"';
      }
      return cellStr;
    }).join(',');
  }).join('\n');
  
  // BOM付きUTF-8で出力（Excelで文字化けしないように）
  const bom = '\uFEFF';
  const csvWithBom = bom + csvContent;
  
  return ContentService.createTextOutput(csvWithBom)
    .setMimeType(ContentService.MimeType.TEXT)
    .downloadAsFile('survey_data_' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss') + '.csv');
}

// ★★★ 管理者用：データクリア機能（危険なので注意） ★★★
function clearAllData() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // 確認のため、スクリプトエディタから手動実行のみ許可
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'データクリア確認',
    'すべてのアンケートデータを削除しますか？この操作は元に戻せません。',
    ui.ButtonSet.YES_NO
  );
  
  if (response == ui.Button.YES) {
    // ヘッダー行以外をクリア
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }
    ui.alert('完了', 'データがクリアされました。', ui.ButtonSet.OK);
  }
}

// ★★★ スプレッドシートの初期設定 ★★★
function setupSpreadsheet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // ヘッダー行を設定
  const headers = [
    'タイムスタンプ',
    '体が冷えやすく、夕方になると足がパンパンにむくんで靴がきつい',
    '便秘がちで、お腹が張ってポッコリしているのが気になる',
    '十分寝たつもりでも、日中ずっと眠くて体が重い',
    '常に肩や首が凝っていて、頭痛に悩まされることもある',
    '手足がいつも冷たく、冬はもちろん夏場のクーラーも辛い',
    '理由もないのに急に不安になったり、気分が落ち込んだりする',
    '些細なことでイライラしてしまい、家族やパートナーにきつく当たって後で自己嫌悪に陥る',
    '生理前になると、イライラ、気分の落ち込み、胸の張り、肌荒れ、眠気などがひどくて辛い（PMS）',
    '生理周期によって、仕事のパフォーマンスや人間関係に影響が出てしまう',
    '会議中や作業中に頭がぼーっとしてしまい、話が頭に入ってこない'
  ];
  
  // ヘッダー行を設定
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // ヘッダー行のスタイル設定
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#0a2472');
  headerRange.setFontColor('#d4af37');
  headerRange.setFontWeight('bold');
  headerRange.setWrap(true);
  
  // 列幅を自動調整
  sheet.autoResizeColumns(1, headers.length);
  
  // 1列目（タイムスタンプ）は少し幅を狭く
  sheet.setColumnWidth(1, 150);
  
  // データ検証ルールを設定（2列目以降）
  const validationRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['当てはまる', 'どちらともいえない', 'あてはまらない'])
    .build();
  
  // 大きな範囲にデータ検証を適用（1000行分）
  for (let col = 2; col <= headers.length; col++) {
    sheet.getRange(2, col, 1000, 1).setDataValidation(validationRule);
  }
  
  SpreadsheetApp.getUi().alert('完了', 'スプレッドシートの初期設定が完了しました。', SpreadsheetApp.getUi().ButtonSet.OK);
}
