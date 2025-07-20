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

    // 保存された形式を読み込む関数
    function loadSavedFormats() {
      console.log('loadSavedFormats called');
      chrome.storage.sync.get(['customFormats'], function(result) {
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
      
      // 既存のカスタム形式ボタンを削除
      const existingCustomButtons = copyButtons.querySelectorAll('.custom-format-btn');
      console.log('existing custom buttons:', existingCustomButtons.length);
      existingCustomButtons.forEach(btn => btn.remove());
      
      // 新しいカスタム形式ボタンを追加
      formats.forEach(format => {
        console.log('Creating button for format:', format.name);
        const customButton = document.createElement('button');
        customButton.className = 'copy-btn custom-format-btn';
        customButton.dataset.formatId = format.id;
        
        // まずボタンをDOMに追加
        copyButtons.appendChild(customButton);
        
        customButton.innerHTML = `
          <div class="btn-content">
            <span class="btn-title">${format.name}</span>
          </div>
          <div class="btn-actions">
            <button class="edit-btn" title="編集">✏️</button>
          </div>
        `;
        
        // コピーイベントを追加
        customButton.addEventListener('click', function(e) {
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
        });
        
        // 編集ボタンのイベントを追加
        const editBtn = customButton.querySelector('.edit-btn');
        editBtn.addEventListener('click', function(e) {
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
          <div class="format-info" style="cursor: pointer;">
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
      const formatInfo = item.querySelector('.format-info');
      const editLink = item.querySelector('.edit-link');
      const editActions = item.querySelector('.edit-actions');
      const saveAction = item.querySelector('.save-action');
      const cancelAction = item.querySelector('.cancel-action');
      const deleteAction = item.querySelector('.delete-action');
      
      // 形式情報のクリック（コピー実行）
      formatInfo.addEventListener('click', function(e) {
        // 編集アクションが表示されている場合はコピーしない
        if (editActions.style.display !== 'none') {
          return;
        }
        
        e.preventDefault();
        
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
      });
      
      // 編集リンクのクリック
      editLink.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation(); // 親要素のクリックイベントを防ぐ
        
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
        
        // 編集モードを終了
        editLink.style.display = 'inline';
        editActions.style.display = 'none';
      });
      
      // 保存アクション（編集モードでの保存）
      saveAction.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation(); // 親要素のクリックイベントを防ぐ
        
        const formatName = formatNameInput.value.trim();
        const formatText = formatInput.value.trim();
        
        if (!formatName) {
          showStatus('formatNameRequired', 'error');
          return;
        }
        
        if (!formatText) {
          showStatus('formatRequired', 'error');
          return;
        }

        const updatedFormatData = {
          id: format.id,
          name: formatName,
          format: formatText,
          searchPattern: searchInput.value.trim(),
          replacePattern: replaceInput.value.trim()
        };

        saveCustomFormat(updatedFormatData);
        clearForm();
        showStatus('formatSaved', 'success');
        
        // 編集モードを終了
        editLink.style.display = 'inline';
        editActions.style.display = 'none';
      });
      
      // キャンセルアクション
      cancelAction.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation(); // 親要素のクリックイベントを防ぐ
        // 編集モードを終了
        editLink.style.display = 'inline';
        editActions.style.display = 'none';
      });
      
      // 削除アクション
      deleteAction.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation(); // 親要素のクリックイベントを防ぐ
        const deleteConfirmMessage = chrome.i18n.getMessage('deleteConfirm') || 'この形式を削除しますか？';
        if (confirm(deleteConfirmMessage)) {
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
        chrome.storage.sync.set({ customFormats: filteredFormats }, function() {
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

    // 各入力フィールドのイベントリスナー
    formatNameInput.addEventListener('input', updatePreview);
    formatInput.addEventListener('input', updatePreview);
    searchInput.addEventListener('input', updatePreview);
    replaceInput.addEventListener('input', updatePreview);

    // カスタム形式を保存する関数
    function saveCustomFormat(formatData) {
      console.log('Saving format:', formatData);
      chrome.storage.sync.get(['customFormats'], function(result) {
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
    
    // 初期化時に保存された形式を読み込み
    console.log('Initial loadSavedFormats call');
    loadSavedFormats();
    
    // 少し遅延してから再度読み込み（確実に表示されるように）
    setTimeout(function() {
      console.log('Delayed loadSavedFormats call');
      loadSavedFormats();
    }, 100);
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