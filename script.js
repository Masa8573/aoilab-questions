// ここに実際のGAS URLを貼り付け
const GAS_URL =
  "https://script.google.com/macros/s/AKfycbzhycw1lm_Aw6fW5h0ye_mIn8Vocbu0EiFT4rqkMImJPn3TQ0WkPZuExXdEAN4a0XjX/exec";

const form = document.getElementById("survey-form");
const messageDiv = document.getElementById("message");

form.addEventListener("submit", async (e) => {
  e.preventDefault(); // デフォルトのフォーム送信をキャンセル

  // デバッグ情報を表示
  console.log("🚀 フォーム送信開始");
  console.log("📍 GAS URL:", GAS_URL);

  // URLが設定されているかチェック
  if (GAS_URL.includes("YOUR_SCRIPT_ID_HERE")) {
    messageDiv.innerHTML =
      "⚠️ システム管理者にお問い合わせください。（GAS URL未設定）";
    messageDiv.style.color = "#dc3545";
    console.error("❌ GAS URLが設定されていません");
    return;
  }

  // 送信ボタンを無効化
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  messageDiv.textContent = "送信中...";
  messageDiv.style.color = "#6c757d";

  const formData = new FormData(form);

  // 送信するデータをログに出力（デバッグ用）
  console.log("📤 送信データ:");
  for (let [key, value] of formData.entries()) {
    console.log(`  ${key}: ${value}`);
  }

  try {
    console.log("🌐 リクエスト送信中...");

    const response = await fetch(GAS_URL, {
      method: "POST",
      body: formData,
      mode: "cors", // CORS明示
    });

    console.log("📨 レスポンス受信:");
    console.log("  ステータス:", response.status);
    console.log("  ステータステキスト:", response.statusText);
    console.log("  ヘッダー:", response.headers);

    if (!response.ok) {
      throw new Error(
        `HTTP error! status: ${response.status} - ${response.statusText}`
      );
    }

    const responseText = await response.text();
    console.log("📄 レスポンステキスト:", responseText);

    let data;
    try {
      data = JSON.parse(responseText);
      console.log("📊 パースされたデータ:", data);
    } catch (parseError) {
      console.error("❌ JSON パースエラー:", parseError);
      throw new Error(
        `レスポンスのJSONパースに失敗: ${responseText.substring(0, 100)}...`
      );
    }

    if (data.result === "success") {
      messageDiv.innerHTML =
        "✅ ありがとうございました。回答を受け付けました。";
      messageDiv.style.color = "#28a745";
      form.reset(); // フォームをリセット
      form.style.display = "none"; // フォームを非表示にする

      console.log("✅ 送信成功!");

      // 5秒後にページをリロード（新しい回答のため）
      setTimeout(() => {
        location.reload();
      }, 5000);
    } else {
      throw new Error(data.message || "送信に失敗しました");
    }
  } catch (error) {
    console.error("❌ エラー詳細:", error);

    // より詳細なエラーメッセージを表示
    let errorMessage = "❌ エラーが発生しました: ";

    if (error.name === "TypeError" && error.message.includes("fetch")) {
      errorMessage +=
        "ネットワークエラー（GAS URLが間違っているか、CORSエラーの可能性）";
    } else if (error.message.includes("HTTP error")) {
      errorMessage += `サーバーエラー (${error.message})`;
    } else if (error.message.includes("JSON")) {
      errorMessage += "レスポンス形式エラー（GASが正しく動作していない可能性）";
    } else {
      errorMessage += error.message;
    }

    messageDiv.innerHTML = errorMessage;
    messageDiv.style.color = "#dc3545";

    // デバッグ情報を画面にも表示（開発時のみ）
    const debugInfo = document.createElement("div");
    debugInfo.style.cssText = `
      margin-top: 1em;
      padding: 1em;
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.8em;
      color: #6c757d;
      white-space: pre-wrap;
    `;
    debugInfo.textContent = `デバッグ情報:
GAS URL: ${GAS_URL}
エラータイプ: ${error.name}
エラーメッセージ: ${error.message}
現在のURL: ${window.location.href}`;

    messageDiv.appendChild(debugInfo);
  } finally {
    // 送信ボタンを再度有効化（エラー時のみ）
    if (messageDiv.textContent.includes("エラー")) {
      submitButton.disabled = false;
    }
  }
});

// ページ読み込み時の初期チェック
document.addEventListener("DOMContentLoaded", function () {
  console.log("🏁 ページ読み込み完了");
  console.log("🔧 デバッグモード有効");

  if (GAS_URL.includes("YOUR_SCRIPT_ID_HERE")) {
    const warningDiv = document.createElement("div");
    warningDiv.style.cssText = `
      background: #fff3cd;
      color: #856404;
      padding: 1em;
      margin: 1em;
      border-radius: 8px;
      border-left: 4px solid #ffc107;
      text-align: center;
      font-weight: bold;
    `;
    warningDiv.textContent =
      "⚠️ システムの設定が完了していません。管理者にお問い合わせください。";
    document.body.insertBefore(warningDiv, document.body.firstChild);
    console.warn("⚠️ GAS URL未設定");
  } else {
    console.log("✅ GAS URL設定済み");
  }

  // 現在の環境情報をログ出力
  console.log("🌍 環境情報:");
  console.log("  URL:", window.location.href);
  console.log("  プロトコル:", window.location.protocol);
  console.log("  ホスト:", window.location.host);
});
