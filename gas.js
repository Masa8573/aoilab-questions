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
