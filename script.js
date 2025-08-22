// GASのWebアプリのURLをここに設定
const GAS_URL = "ここにステップ2で取得するGASのURLを貼り付け";

const form = document.getElementById("survey-form");
const messageDiv = document.getElementById("message");

form.addEventListener("submit", (e) => {
  e.preventDefault(); // デフォルトのフォーム送信をキャンセル

  // 送信ボタンを無効化
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  messageDiv.textContent = "送信中...";

  const formData = new FormData(form);

  fetch(GAS_URL, {
    method: "POST",
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.result === "success") {
        messageDiv.textContent =
          "ありがとうございました。回答を受け付けました。";
        form.reset(); // フォームをリセット
        form.style.display = "none"; // フォームを非表示にする
      } else {
        throw new Error(data.message);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      messageDiv.textContent = "エラーが発生しました。もう一度お試しください。";
    })
    .finally(() => {
      // 送信ボタンを再度有効化（エラー時のみ）
      if (messageDiv.textContent.includes("エラー")) {
        submitButton.disabled = false;
      }
    });
});
