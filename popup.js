document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded event fired');
  
  try {
    // 国際化対応
    initializeI18n();
  
  const copyTitleUrlBtn = document.getElementById('copy-title-url');
  const copyMarkdownBtn = document.getElementById('copy-markdown');
  const copyHtmlBtn = document.getElementById('copy-html');
  const statusDiv = document.getElementById('status');

  // 現在のタブの情報を取得
  console.log('Querying current tab...');
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    console.log('Current tab:', tabs[0]);
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
    console.log('Initializing custom format with URL:', url, 'Title:', title);
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
    console.log('Initializing i18n...');
    
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
    const deleteBtn = document.getElementById('delete-custom');
    const cancelBtn = document.getElementById('cancel-custom');
    const savedFormatsList = document.getElementById('saved-formats-list');

    console.log('DOM elements found:');
    console.log('toggleBtn:', toggleBtn);
    console.log('saveBtn:', saveBtn);
    console.log('formatNameInput:', formatNameInput);
    console.log('formatInput:', formatInput);

    let editingFormatId = null;

    // イベントリスナー管理用のWeakMap
    const customButtonListeners = new WeakMap();
    const editButtonListeners = new WeakMap();

    // 保存された形式を読み込む関数
    function loadSavedFormats() {
      console.log('loadSavedFormats called');
      chrome.storage.sync.get(['customFormats'], function(result) {
        if (chrome.runtime.lastError) {
          console.error('Failed to load formats:', chrome.runtime.lastError);
          showStatus('loadError', 'error');
          return;
        }
        const formats = result.customFormats || [];
        console.log('Loaded formats:', formats);

        // メインボタンエリアにカスタム形式ボタンを追加
        updateCustomFormatButtons(formats);

        // 保存された形式リストは非表示にする（メインボタンエリアに表示するため）
        savedFormatsList.innerHTML = '';
      });
    }

    // メインボタンエリアにカスタム形式ボタンを追加する関数
    function updateCustomFormatButtons(formats) {
      const copyButtons = document.querySelector('.copy-buttons');
      console.log('copyButtons element:', copyButtons);
      console.log('formats to add:', formats);
      
      if (!copyButtons) {
        console.error('copyButtons element not found!');
        return;
      }
      
      // 既存のカスタム形式ボタンを削除（イベントリスナーも削除）
      const existingCustomButtons = copyButtons.querySelectorAll('.custom-format-btn');
      console.log('existing custom buttons:', existingCustomButtons.length);
      existingCustomButtons.forEach(btn => {
        // WeakMapからリスナーを取得して削除
        const listener = customButtonListeners.get(btn);
        if (listener) {
          btn.removeEventListener('click', listener);
          customButtonListeners.delete(btn);
        }
        const editBtn = btn.querySelector('.edit-btn');
        if (editBtn) {
          const editListener = editButtonListeners.get(editBtn);
          if (editListener) {
            editBtn.removeEventListener('click', editListener);
            editButtonListeners.delete(editBtn);
          }
        }
        btn.remove();
      });
      
      // 新しいカスタム形式ボタンを追加
      formats.forEach(format => {
        console.log('Creating button for format:', format.name);
        const customButton = document.createElement('button');
        customButton.className = 'copy-btn custom-format-btn';
        customButton.dataset.formatId = format.id;
        
        // まずボタンをDOMに追加
        copyButtons.appendChild(customButton);
        
        // XSS対策: innerHTMLの代わりにDOM APIを使用
        const btnContent = document.createElement('div');
        btnContent.className = 'btn-content';
        const btnTitle = document.createElement('span');
        btnTitle.className = 'btn-title';
        btnTitle.textContent = format.name; // textContentでエスケープ
        btnContent.appendChild(btnTitle);

        const btnActions = document.createElement('div');
        btnActions.className = 'btn-actions';
        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.title = '編集';
        editBtn.textContent = '✏️';
        btnActions.appendChild(editBtn);

        customButton.appendChild(btnContent);
        customButton.appendChild(btnActions);
        
        // コピーイベントを追加（WeakMapに保存）
        const copyListener = function(e) {
          // 編集ボタンがクリックされた場合はコピーしない
          if (e.target.classList.contains('edit-btn')) {
            return;
          }

          // 現在のタブ情報を取得してコピー
          chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const currentTab = tabs[0];
            const copiedText = processCustomFormat(
              format.format,
              currentTab.title,
              currentTab.url,
              format.searchPattern,
              format.replacePattern
            );
            copyToClipboard(copiedText, 'customFormatCopied');
          });
        };
        customButton.addEventListener('click', copyListener);
        customButtonListeners.set(customButton, copyListener);
        
        // 編集ボタンのイベントを追加（WeakMapに保存）
        const editListener = function(e) {
          e.preventDefault();
          e.stopPropagation();

          // フォームに現在の値を設定
          editingFormatId = format.id;
          formatNameInput.value = format.name;
          formatInput.value = format.format;
          searchInput.value = format.searchPattern;
          replaceInput.value = format.replacePattern;
          updatePreview();

          // カスタムパネルを開く
          customPanel.classList.remove('hidden');
          toggleIcon.classList.add('rotated');

          // 編集モードなので削除ボタンを表示
          if (deleteBtn) {
            deleteBtn.style.display = 'inline-block';
          }
        };
        editBtn.addEventListener('click', editListener);
        editButtonListeners.set(editBtn, editListener);
        

      });
    }


    // カスタム形式を削除する関数
    function deleteCustomFormat(formatId) {
      chrome.storage.sync.get(['customFormats'], function(result) {
        if (chrome.runtime.lastError) {
          console.error('Failed to get formats:', chrome.runtime.lastError);
          showStatus('deleteError', 'error');
          return;
        }
        const formats = result.customFormats || [];
        const filteredFormats = formats.filter(f => f.id !== formatId);
        chrome.storage.sync.set({ customFormats: filteredFormats }, function() {
          if (chrome.runtime.lastError) {
            console.error('Failed to delete format:', chrome.runtime.lastError);
            showStatus('deleteError', 'error');
            return;
          }
          // 削除完了後にリストを更新
          loadSavedFormats();
        });
      });
    }

    // トグルボタンのクリックイベント
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function() {
        console.log('Toggle button clicked');
        customPanel.classList.toggle('hidden');
        toggleIcon.classList.toggle('rotated');
        
        // パネルが開いた時に保存された形式を読み込み
        if (!customPanel.classList.contains('hidden')) {
          loadSavedFormats();
          
          // 新規作成モードなので削除ボタンを非表示
          if (deleteBtn) {
            deleteBtn.style.display = 'none';
          }
        }
      });
    } else {
      console.error('Toggle button not found!');
    }

    // リアルタイムプレビュー更新関数
    function updatePreview() {
      const format = formatInput.value;
      const searchPattern = searchInput.value;
      const replacePattern = replaceInput.value;
      const preview = processCustomFormat(format, title, url, searchPattern, replacePattern);
      previewBox.textContent = preview;
    }

    // デバウンス関数
    let updatePreviewTimeout;
    function debounce(func, delay) {
      return function() {
        clearTimeout(updatePreviewTimeout);
        updatePreviewTimeout = setTimeout(func, delay);
      };
    }

    // 各入力フィールドのイベントリスナー（デバウンス付き）
    const debouncedUpdatePreview = debounce(updatePreview, 300);
    formatNameInput.addEventListener('input', debouncedUpdatePreview);
    formatInput.addEventListener('input', debouncedUpdatePreview);
    searchInput.addEventListener('input', debouncedUpdatePreview);
    replaceInput.addEventListener('input', debouncedUpdatePreview);

    // カスタム形式を保存する関数
    function saveCustomFormat(formatData) {
      console.log('Saving format:', formatData);
      chrome.storage.sync.get(['customFormats'], function(result) {
        if (chrome.runtime.lastError) {
          console.error('Failed to get formats:', chrome.runtime.lastError);
          showStatus('saveError', 'error');
          return;
        }
        const formats = result.customFormats || [];
        console.log('Current formats:', formats);

        // 既存の形式を更新するか、新しい形式を追加
        const existingIndex = formats.findIndex(f => f.id === formatData.id);
        if (existingIndex >= 0) {
          formats[existingIndex] = formatData;
        } else {
          formats.push(formatData);
        }

        console.log('Updated formats:', formats);
        chrome.storage.sync.set({ customFormats: formats }, function() {
          if (chrome.runtime.lastError) {
            console.error('Failed to save format:', chrome.runtime.lastError);
            showStatus('saveError', 'error');
            return;
          }
          console.log('Format saved successfully');
          // 保存完了後にリストを更新
          loadSavedFormats();
        });
      });
    }

    // 保存ボタン
    if (saveBtn) {
      saveBtn.addEventListener('click', function() {
        console.log('Save button clicked');
        const formatName = formatNameInput.value.trim();
        const format = formatInput.value.trim();
        
        console.log('Format name:', formatName);
        console.log('Format:', format);
        
        if (!formatName) {
          console.log('Format name is empty');
          showStatus('formatNameRequired', 'error');
          return;
        }
        
        if (!format) {
          console.log('Format is empty');
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

        console.log('Format data to save:', formatData);
        saveCustomFormat(formatData);
        clearForm();
        showStatus('formatSaved', 'success');
      });
    } else {
      console.error('Save button not found!');
    }

    // 削除ボタン
    if (deleteBtn) {
      deleteBtn.addEventListener('click', function() {
        if (editingFormatId) {
          const deleteConfirmMessage = chrome.i18n.getMessage('deleteConfirm') || 'この形式を削除しますか？';
          if (confirm(deleteConfirmMessage)) {
            deleteCustomFormat(editingFormatId);
            clearForm();
            showStatus('formatDeleted', 'success');
          }
        } else {
          showStatus('noFormatToDelete', 'error');
        }
      });
      
      // 初期状態では削除ボタンを非表示
      deleteBtn.style.display = 'none';
    } else {
      console.error('Delete button not found!');
    }

    // キャンセルボタン
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function() {
        clearForm();
      });
    } else {
      console.error('Cancel button not found!');
    }

    // フォームをクリアする関数
    function clearForm() {
      formatNameInput.value = '';
      formatInput.value = '';
      searchInput.value = '';
      replaceInput.value = '';
      previewBox.textContent = '';
      editingFormatId = null;
      
      // 新規作成モードなので削除ボタンを非表示
      if (deleteBtn) {
        deleteBtn.style.display = 'none';
      }
      
      // 初期値を設定
      formatInput.value = '{title} - {url}';
      searchInput.value = '/ - /g';
      replaceInput.value = ' | ';
      updatePreview();
    }

    // 初期プレビュー
    clearForm();

    // 初期化時に保存された形式を読み込み（一度だけ）
    console.log('Initial loadSavedFormats call');
    loadSavedFormats();
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
  
  } catch (error) {
    console.error('Error in popup initialization:', error);
  }

}); 