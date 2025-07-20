document.addEventListener('DOMContentLoaded', function() {
  // 国際化対応
  initializeI18n();
  
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
      copyToClipboard(text, 'copySuccessTitleUrl');
    });

    // Markdown形式でコピー
    copyMarkdownBtn.addEventListener('click', function() {
      const text = `[${title}](${url})`;
      copyToClipboard(text, 'copySuccessMarkdown');
    });

    // HTML形式でコピー
    copyHtmlBtn.addEventListener('click', function() {
      const text = `<a href="${url}">${title}</a>`;
      copyToClipboard(text, 'copySuccessHtml');
    });

    // カスタム形式機能の初期化
    initializeCustomFormat(url, title);
  });

  // クリップボードにコピーする関数
  function copyToClipboard(text, messageKey) {
    navigator.clipboard.writeText(text).then(function() {
      showStatus(messageKey, 'success');
      // 2秒後にポップアップを閉じる（通知を十分に表示するため）
      setTimeout(function() {
        window.close();
      }, 2000);
    }).catch(function(err) {
      console.error('Copy failed:', err);
      showStatus('copyError', 'error');
      // エラーの場合は3秒後に閉じる
      setTimeout(function() {
        window.close();
      }, 3000);
    });
  }

  // ステータスメッセージを表示する関数
  function showStatus(messageKey, type) {
    const message = chrome.i18n.getMessage(messageKey);
    console.log('Message key:', messageKey);
    console.log('Retrieved message:', message);
    
    // メッセージが取得できない場合のフォールバック
    const currentLocale = chrome.i18n.getUILanguage();
    const isJapanese = currentLocale.startsWith('ja');
    
    const fallbackMessages = {
      'copySuccessTitleUrl': isJapanese ? 'タイトル + URLをコピーしました' : 'Title + URL copied successfully',
      'copySuccessMarkdown': isJapanese ? 'Markdown形式でコピーしました' : 'Markdown format copied successfully',
      'copySuccessHtml': isJapanese ? 'HTML形式でコピーしました' : 'HTML format copied successfully',
      'copyError': isJapanese ? 'コピーに失敗しました' : 'Failed to copy'
    };
    
    const displayMessage = message || fallbackMessages[messageKey] || 'Copied successfully';
    statusDiv.textContent = displayMessage;
    statusDiv.className = `status ${type}`;
    
    // 強制的に再描画してからshowクラスを追加
    setTimeout(function() {
      statusDiv.className = `status ${type} show`;
    }, 10);
  }

  // 国際化初期化関数
  function initializeI18n() {
    // ポップアップタイトル
    const popupTitle = document.getElementById('popup-title');
    popupTitle.textContent = chrome.i18n.getMessage('popupTitle');

    // アプリサブタイトル
    const appSubtitle = document.getElementById('app-subtitle');
    appSubtitle.textContent = chrome.i18n.getMessage('appSubtitle');

    // ボタンのテキスト
    const i18nElements = document.querySelectorAll('[data-i18n]');
    i18nElements.forEach(function(element) {
      const messageKey = element.getAttribute('data-i18n');
      const message = chrome.i18n.getMessage(messageKey);
      if (message) {
        element.textContent = message;
      }
    });
  }

  // カスタム形式機能の初期化
  function initializeCustomFormat(url, title) {
    const toggleBtn = document.getElementById('toggle-custom');
    const customPanel = document.getElementById('custom-panel');
    const toggleIcon = toggleBtn.querySelector('.toggle-icon');
    const formatInput = document.getElementById('custom-format');
    const previewBox = document.getElementById('custom-preview');
    const saveBtn = document.getElementById('save-custom');
    const cancelBtn = document.getElementById('cancel-custom');

    // トグルボタンのクリックイベント
    toggleBtn.addEventListener('click', function() {
      customPanel.classList.toggle('hidden');
      toggleIcon.classList.toggle('rotated');
    });

    // フォーマット入力のリアルタイムプレビュー
    formatInput.addEventListener('input', function() {
      const format = formatInput.value;
      const preview = processCustomFormat(format, title, url);
      previewBox.textContent = preview;
    });

    // 保存ボタン（現在は動作確認のみ）
    saveBtn.addEventListener('click', function() {
      console.log('保存機能は未実装です');
      showStatus('Custom format saved (demo)', 'success');
    });

    // キャンセルボタン
    cancelBtn.addEventListener('click', function() {
      formatInput.value = '';
      previewBox.textContent = '';
      customPanel.classList.add('hidden');
      toggleIcon.classList.remove('rotated');
    });

    // 初期プレビュー
    formatInput.value = '{title} - {url}';
    previewBox.textContent = processCustomFormat('{title} - {url}', title, url);
  }

  // カスタムフォーマット処理関数
  function processCustomFormat(format, title, url) {
    if (!format) return '';

    // 変数置換
    let result = format
      .replace(/\{title\}/g, title)
      .replace(/\{url\}/g, url);

    // 正規表現置換（→以降の部分）
    const regexMatch = result.match(/→\s*(.+)$/);
    if (regexMatch) {
      const regexPart = regexMatch[1].trim();
      const textBeforeRegex = result.substring(0, result.indexOf('→')).trim();
      
      try {
        // 正規表現の構文解析（簡易版）
        // s/pattern/replacement/g 形式を想定
        const regexPattern = /^s\/(.+)\/(.+)\/([gimsuy]*)$/;
        const match = regexPart.match(regexPattern);
        
        if (match) {
          const pattern = match[1];
          const replacement = match[2];
          const flags = match[3];
          
          // エスケープされたスラッシュを処理
          const cleanPattern = pattern.replace(/\\\//g, '/');
          const cleanReplacement = replacement.replace(/\\\//g, '/');
          
          const regex = new RegExp(cleanPattern, flags);
          result = textBeforeRegex.replace(regex, cleanReplacement);
        }
      } catch (error) {
        console.error('正規表現エラー:', error);
        result = textBeforeRegex + ' [正規表現エラー]';
      }
    }

    return result;
  }
}); 