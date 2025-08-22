// ★★★ 重要：スプレッドシートIDを直接指定 ★★★
// 先ほど作成したスプレッドシートのIDを設定
const SPREADSHEET_ID = "1SJ5xI6TrWIvbBL85RCod1RGq2c5mpEc33DS5-wA5ch8";

// スプレッドシートを取得する関数
function getSpreadsheet() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    return spreadsheet.getActiveSheet();
  } catch (error) {
    console.error("スプレッドシート取得エラー:", error);
    throw new Error("スプレッドシートにアクセスできません: " + error.message);
  }
}

function doPost(e) {
  console.log("=== doPost 開始 ===");
  console.log("受信パラメータ:", e.parameter);

  try {
    // パラメータからフォームのデータを取得
    const params = e.parameter;

    // スプレッドシートを取得
    const sheet = getSpreadsheet();
    console.log("スプレッドシート取得成功:", sheet.getName());

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

    console.log("保存データ:", data);

    // スプレッドシートの最終行にデータを追加
    sheet.appendRow(data);
    console.log("データ保存成功");

    // 成功したことを示すJSONを返す
    const response = ContentService.createTextOutput(
      JSON.stringify({
        result: "success",
        message: "データを正常に保存しました",
      })
    ).setMimeType(ContentService.MimeType.JSON);

    console.log("=== doPost 成功 ===");
    return response;
  } catch (error) {
    console.error("=== doPost エラー ===");
    console.error("エラー詳細:", error);

    // エラーが発生した場合
    return ContentService.createTextOutput(
      JSON.stringify({
        result: "error",
        message: error.message,
        details: error.toString(),
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// ★★★ ダッシュボード用のデータ取得機能 ★★★
function doGet(e) {
  console.log("=== doGet 開始 ===");
  console.log("受信パラメータ:", e.parameter);

  try {
    const action = e.parameter.action || "test";

    switch (action) {
      case "getData":
        return getData();
      case "getStats":
        return getStats();
      case "exportCSV":
        return exportCSV();
      case "test":
        return testConnection();
      default:
        return ContentService.createTextOutput(
          JSON.stringify({
            result: "error",
            message: "Invalid action: " + action,
          })
        ).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    console.error("=== doGet エラー ===");
    console.error("エラー詳細:", error);

    return ContentService.createTextOutput(
      JSON.stringify({
        result: "error",
        message: error.message,
        details: error.toString(),
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// 接続テスト用の関数
function testConnection() {
  try {
    const sheet = getSpreadsheet();
    const rowCount = sheet.getLastRow();

    return ContentService.createTextOutput(
      JSON.stringify({
        result: "success",
        message: "接続テスト成功",
        spreadsheetName: sheet.getName(),
        rowCount: rowCount,
        spreadsheetId: SPREADSHEET_ID,
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({
        result: "error",
        message: "接続テスト失敗: " + error.message,
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// 全データを取得（CSV形式）
function getData() {
  try {
    const sheet = getSpreadsheet();
    const data = sheet.getDataRange().getValues();

    // CSVフォーマットに変換
    const csvData = data.map((row) => row.join(",")).join("\n");

    return ContentService.createTextOutput(
      JSON.stringify({
        result: "success",
        data: csvData,
        rowCount: data.length - 1, // ヘッダー行を除く
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ result: "error", message: error.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// 統計データを取得
function getStats() {
  try {
    const sheet = getSpreadsheet();
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
            dailyStats: {},
          },
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
      "冷え・むくみ",
      "便秘・お腹の張り",
      "眠気・体の重さ",
      "肩こり・頭痛",
      "手足の冷え",
      "不安・落ち込み",
      "イライラ",
      "PMS症状",
      "生理周期の影響",
      "パフォーマンス低下",
    ];

    // カテゴリ別統計
    const categoryMapping = {
      "美容・見た目": [0, 1],
      身体の不調: [2, 3, 4],
      メンタル: [5, 6],
      女性特有: [7, 8],
      "仕事・集中力": [9],
    };

    const categoryStats = {};
    Object.keys(categoryMapping).forEach((category) => {
      categoryStats[category] = { total: 0, count: 0, percentage: 0 };
    });

    // 日別統計
    const dailyStats = {};

    responses.forEach((row) => {
      const timestamp = new Date(row[0]);
      const dateStr = Utilities.formatDate(
        timestamp,
        Session.getScriptTimeZone(),
        "yyyy-MM-dd"
      );

      // 日別カウント
      if (!dailyStats[dateStr]) {
        dailyStats[dateStr] = 0;
      }
      dailyStats[dateStr]++;

      let userScore = 0;

      // 質問1-10の回答を処理
      for (let i = 1; i <= 10; i++) {
        const response = row[i];
        const score =
          response === "当てはまる"
            ? 2
            : response === "どちらともいえない"
            ? 1
            : 0;
        userScore += score;
        questionConcerns[i - 1] += score;
      }

      totalConcernScore += userScore;
      if (userScore >= 15) highConcernCount++; // 20点中15点以上を高悩み度とする

      // カテゴリ別スコア計算
      Object.keys(categoryMapping).forEach((category) => {
        const questionIndices = categoryMapping[category];
        questionIndices.forEach((qIndex) => {
          const response = row[qIndex + 1]; // +1 because timestamp is at index 0
          const score =
            response === "当てはまる"
              ? 2
              : response === "どちらともいえない"
              ? 1
              : 0;
          categoryStats[category].total += score;
          categoryStats[category].count++;
        });
      });
    });

    // カテゴリ別パーセンテージ計算
    Object.keys(categoryStats).forEach((category) => {
      const maxPossible = categoryStats[category].count * 2;
      categoryStats[category].percentage =
        maxPossible > 0
          ? Math.round((categoryStats[category].total / maxPossible) * 100)
          : 0;
    });

    const avgConcernLevel = Math.round(
      (totalConcernScore / (totalResponses * 20)) * 100
    );

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
            percentage: Math.round((score / (totalResponses * 2)) * 100),
          })),
          categoryStats: categoryStats,
          dailyStats: dailyStats,
        },
      })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ result: "error", message: error.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// CSVエクスポート機能
function exportCSV() {
  try {
    const sheet = getSpreadsheet();
    const data = sheet.getDataRange().getValues();

    // CSVフォーマットに変換（日本語対応）
    const csvContent = data
      .map((row) => {
        return row
          .map((cell) => {
            // セルにカンマや改行が含まれている場合はダブルクォートで囲む
            const cellStr = String(cell);
            if (
              cellStr.includes(",") ||
              cellStr.includes("\n") ||
              cellStr.includes('"')
            ) {
              return '"' + cellStr.replace(/"/g, '""') + '"';
            }
            return cellStr;
          })
          .join(",");
      })
      .join("\n");

    // BOM付きUTF-8で出力（Excelで文字化けしないように）
    const bom = "\uFEFF";
    const csvWithBom = bom + csvContent;

    return ContentService.createTextOutput(csvWithBom).setMimeType(
      ContentService.MimeType.TEXT
    );
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({ result: "error", message: error.message })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
