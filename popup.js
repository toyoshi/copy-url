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
    const formatNameInput = document.getElementById('format-name');
    const formatInput = document.getElementById('custom-format');
    const searchInput = document.getElementById('search-pattern');
    const replaceInput = document.getElementById('replace-pattern');
    const previewBox = document.getElementById('custom-preview');
    const saveBtn = document.getElementById('save-custom');
    const cancelBtn = document.getElementById('cancel-custom');
    const savedFormatsList = document.getElementById('saved-formats-list');

    let editingFormatId = null;

    // 保存された形式を読み込み
    loadSavedFormats();

    // トグルボタンのクリックイベント
    toggleBtn.addEventListener('click', function() {
      customPanel.classList.toggle('hidden');
      toggleIcon.classList.toggle('rotated');
    });

    // リアルタイムプレビュー更新関数
    function updatePreview() {
      const format = formatInput.value;
      const searchPattern = searchInput.value;
      const replacePattern = replaceInput.value;
      const preview = processCustomFormat(format, title, url, searchPattern, replacePattern);
      previewBox.textContent = preview;
    }

    // 各入力フィールドのイベントリスナー
    formatNameInput.addEventListener('input', updatePreview);
    formatInput.addEventListener('input', updatePreview);
    searchInput.addEventListener('input', updatePreview);
    replaceInput.addEventListener('input', updatePreview);

    // 保存ボタン
    saveBtn.addEventListener('click', function() {
      const formatName = formatNameInput.value.trim();
      const format = formatInput.value.trim();
      
      if (!formatName) {
        showStatus('formatNameRequired', 'error');
        return;
      }
      
      if (!format) {
        showStatus('formatRequired', 'error');
        return;
      }

      const formatData = {
        id: editingFormatId || Date.now().toString(),
        name: formatName,
        format: format,
        searchPattern: searchInput.value.trim(),
        replacePattern: replaceInput.value.trim()
      };

      saveCustomFormat(formatData);
      clearForm();
      loadSavedFormats();
      showStatus('formatSaved', 'success');
    });

    // キャンセルボタン
    cancelBtn.addEventListener('click', function() {
      clearForm();
    });

    // フォームをクリアする関数
    function clearForm() {
      formatNameInput.value = '';
      formatInput.value = '';
      searchInput.value = '';
      replaceInput.value = '';
      previewBox.textContent = '';
      editingFormatId = null;
      
      // 初期値を設定
      formatInput.value = '{title} - {url}';
      searchInput.value = '/ - /g';
      replaceInput.value = ' | ';
      updatePreview();
    }

    // 初期プレビュー
    clearForm();
  }

  // カスタムフォーマット処理関数
  function processCustomFormat(format, title, url, searchPattern, replacePattern) {
    if (!format) return '';

    // 変数置換
    let result = format
      .replace(/\{title\}/g, title)
      .replace(/\{url\}/g, url);

    // 正規表現置換処理
    if (searchPattern && searchPattern.trim() !== '') {
      try {
        // 入力値の安全性チェック
        if (typeof replacePattern !== 'string') {
          throw new Error('置換パターンは文字列である必要があります');
        }

        // 正規表現の構文解析
        // /pattern/flags 形式を想定
        const regexMatch = searchPattern.match(/^\/(.+)\/([gimsuy]*)$/);
        
        if (regexMatch) {
          const pattern = regexMatch[1];
          const flags = regexMatch[2];
          
          // 正規表現オブジェクトを作成
          const regex = new RegExp(pattern, flags);
          
          // 文字列置換のみ許可（関数置換は禁止）
          result = result.replace(regex, replacePattern);
        } else {
          // 正規表現形式でない場合は、文字列として扱う
          const escapedPattern = searchPattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(escapedPattern, 'g');
          result = result.replace(regex, replacePattern);
        }
      } catch (error) {
        console.error('正規表現エラー:', error);
        result += ' [正規表現エラー]';
      }
    }

    return result;
  }

  // カスタム形式を保存する関数
  function saveCustomFormat(formatData) {
    chrome.storage.sync.get(['customFormats'], function(result) {
      const formats = result.customFormats || [];
      
      // 既存の形式を更新するか、新しい形式を追加
      const existingIndex = formats.findIndex(f => f.id === formatData.id);
      if (existingIndex >= 0) {
        formats[existingIndex] = formatData;
      } else {
        formats.push(formatData);
      }
      
      chrome.storage.sync.set({ customFormats: formats });
    });
  }

  // 保存された形式を読み込む関数
  function loadSavedFormats() {
    chrome.storage.sync.get(['customFormats'], function(result) {
      const formats = result.customFormats || [];
      const savedFormatsList = document.getElementById('saved-formats-list');
      
      if (formats.length === 0) {
        savedFormatsList.innerHTML = '<div class="no-formats">保存された形式はありません</div>';
        return;
      }
      
      savedFormatsList.innerHTML = '';
      
      formats.forEach(format => {
        const formatItem = createFormatItem(format);
        savedFormatsList.appendChild(formatItem);
      });
    });
  }

  // 形式アイテムを作成する関数
  function createFormatItem(format) {
    const item = document.createElement('div');
    item.className = 'saved-format-item';
    
    // 現在のタブ情報を取得してプレビューを生成
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTab = tabs[0];
      const preview = processCustomFormat(
        format.format, 
        currentTab.title, 
        currentTab.url, 
        format.searchPattern, 
        format.replacePattern
      );
      
      item.innerHTML = `
        <div class="format-info">
          <div class="format-name">${format.name}</div>
          <div class="format-preview">${preview}</div>
        </div>
        <div class="format-actions">
          <a href="#" class="edit-link" data-i18n="editLink">編集</a>
          <div class="edit-actions" style="display: none;">
            <a href="#" class="edit-action save-action" data-i18n="saveAction">保存</a>
            <a href="#" class="edit-action cancel-action" data-i18n="cancelAction">キャンセル</a>
            <a href="#" class="edit-action delete-action delete" data-i18n="deleteAction">削除</a>
          </div>
        </div>
      `;
      
      // 国際化を適用
      const editLink = item.querySelector('.edit-link');
      const saveAction = item.querySelector('.save-action');
      const cancelAction = item.querySelector('.cancel-action');
      const deleteAction = item.querySelector('.delete-action');
      
      editLink.textContent = chrome.i18n.getMessage('editLink') || '編集';
      saveAction.textContent = chrome.i18n.getMessage('saveAction') || '保存';
      cancelAction.textContent = chrome.i18n.getMessage('cancelAction') || 'キャンセル';
      deleteAction.textContent = chrome.i18n.getMessage('deleteAction') || '削除';
      
      // イベントリスナーを追加
      setupFormatItemEvents(item, format);
    });
    
    return item;
  }

  // 形式アイテムのイベントを設定する関数
  function setupFormatItemEvents(item, format) {
    const editLink = item.querySelector('.edit-link');
    const editActions = item.querySelector('.edit-actions');
    const saveAction = item.querySelector('.save-action');
    const cancelAction = item.querySelector('.cancel-action');
    const deleteAction = item.querySelector('.delete-action');
    
    // 編集リンクのクリック
    editLink.addEventListener('click', function(e) {
      e.preventDefault();
      editLink.style.display = 'none';
      editActions.style.display = 'flex';
    });
    
    // 保存アクション
    saveAction.addEventListener('click', function(e) {
      e.preventDefault();
      // 編集モードを終了
      editLink.style.display = 'inline';
      editActions.style.display = 'none';
    });
    
    // キャンセルアクション
    cancelAction.addEventListener('click', function(e) {
      e.preventDefault();
      // 編集モードを終了
      editLink.style.display = 'inline';
      editActions.style.display = 'none';
    });
    
    // 削除アクション
    deleteAction.addEventListener('click', function(e) {
      e.preventDefault();
      if (confirm('この形式を削除しますか？')) {
        deleteCustomFormat(format.id);
        loadSavedFormats();
        showStatus('formatDeleted', 'success');
      }
    });
  }

  // カスタム形式を削除する関数
  function deleteCustomFormat(formatId) {
    chrome.storage.sync.get(['customFormats'], function(result) {
      const formats = result.customFormats || [];
      const filteredFormats = formats.filter(f => f.id !== formatId);
      chrome.storage.sync.set({ customFormats: filteredFormats });
    });
  }
}); 