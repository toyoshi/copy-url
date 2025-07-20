document.addEventListener('DOMContentLoaded', function() {
  const copyTitleUrlBtn = document.getElementById('copy-title-url');
  const copyMarkdownBtn = document.getElementById('copy-markdown');
  const copyHtmlBtn = document.getElementById('copy-html');
  const statusDiv = document.getElementById('status');

  // 現在のタブの情報を取得
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentTab = tabs[0];
    const url = currentTab.url;
    const title = currentTab.title;

    // タイトル + URL形式でコピー
    copyTitleUrlBtn.addEventListener('click', function() {
      const text = `${title} - ${url}`;
      copyToClipboard(text, 'タイトル + URLをコピーしました');
    });

    // Markdown形式でコピー
    copyMarkdownBtn.addEventListener('click', function() {
      const text = `[${title}](${url})`;
      copyToClipboard(text, 'Markdown形式でコピーしました');
    });

    // HTML形式でコピー
    copyHtmlBtn.addEventListener('click', function() {
      const text = `<a href="${url}">${title}</a>`;
      copyToClipboard(text, 'HTML形式でコピーしました');
    });
  });

  // クリップボードにコピーする関数
  function copyToClipboard(text, message) {
    navigator.clipboard.writeText(text).then(function() {
      showStatus(message, 'success');
      // 1秒後にポップアップを閉じる
      setTimeout(function() {
        window.close();
      }, 1000);
    }).catch(function(err) {
      console.error('コピーに失敗しました:', err);
      showStatus('コピーに失敗しました', 'error');
    });
  }

  // ステータスメッセージを表示する関数
  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type} show`;
  }
}); 