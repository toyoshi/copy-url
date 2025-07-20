document.addEventListener('DOMContentLoaded', function() {
  try {
    // シンプルな文字列置換エンジン
    class StringReplaceEngine {
      // 文字列置換の実行
      execute(code, context) {
        try {
          const inputText = context.title || '';
          let result = inputText;
          
          // 改行で区切られた複数のルールを処理
          const rules = code.split('\n').filter(rule => rule.trim() !== '');
          
          for (const rule of rules) {
            const trimmedRule = rule.trim();
            
            // 正規表現置換: /pattern/replacement/g
            const regexMatch = trimmedRule.match(/^\/(.+)\/(.+)\/([gimsuy]*)$/);
            if (regexMatch) {
              const pattern = regexMatch[1];
              const replacement = regexMatch[2];
              const flags = regexMatch[3];
              try {
                const regex = new RegExp(pattern, flags);
                result = result.replace(regex, replacement);
              } catch (error) {
                // エラーが発生しても処理を続行
                continue;
              }
            }
            
            // 文字列置換: "search" -> "replace"
            const stringMatch = trimmedRule.match(/^"([^"]+)"\s*->\s*"([^"]*)"$/);
            if (stringMatch) {
              const search = stringMatch[1];
              const replacement = stringMatch[2];
              result = result.replace(new RegExp(this.escapeRegExp(search), 'g'), replacement);
            }
          }
          
          return result;
        } catch (error) {
          console.error('文字列置換エラー:', error);
          return `[エラー: ${error.message}]`;
        }
      }
      
      // 正規表現エスケープ
      escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }
      
      extractDomain(url) {
        try {
          return new URL(url).hostname;
        } catch {
          return '';
        }
      }
      
      extractPath(url) {
        try {
          return new URL(url).pathname;
        } catch {
          return '';
        }
      }
    }

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
    const jsInput = document.getElementById('custom-js');
    const jsErrorDiv = document.getElementById('js-error');
    const previewBox = document.getElementById('custom-preview');
    const saveBtn = document.getElementById('save-custom');
    const deleteBtn = document.getElementById('delete-custom');
    const cancelBtn = document.getElementById('cancel-custom');
    const savedFormatsList = document.getElementById('saved-formats-list');

    let editingFormatId = null;

    // 保存された形式を読み込む関数
    function loadSavedFormats() {
      chrome.storage.sync.get(['customFormats'], function(result) {
        const formats = result.customFormats || [];
        updateCustomFormatButtons(formats);
        savedFormatsList.innerHTML = '';
      });
    }

    // メインボタンエリアにカスタム形式ボタンを追加する関数
    function updateCustomFormatButtons(formats) {
      const copyButtons = document.querySelector('.copy-buttons');
      if (!copyButtons) return;
      const existingCustomButtons = copyButtons.querySelectorAll('.custom-format-btn');
      existingCustomButtons.forEach(btn => btn.remove());
      formats.forEach(format => {
        const customButton = document.createElement('button');
        customButton.className = 'copy-btn custom-format-btn';
        customButton.dataset.formatId = format.id;
        copyButtons.appendChild(customButton);
        customButton.innerHTML = `
          <div class="btn-content">
            <span class="btn-title">${format.name}</span>
          </div>
          <div class="btn-actions">
            <button class="edit-btn" title="編集">✏️</button>
          </div>
        `;
        customButton.addEventListener('click', function(e) {
          if (e.target.classList.contains('edit-btn')) return;
          chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            const currentTab = tabs[0];
            const copiedText = processCustomFormat(
              format.format, 
              currentTab.title, 
              currentTab.url, 
              format.jsCode
            );
            copyToClipboard(copiedText, 'customFormatCopied');
          });
        });
        const editBtn = customButton.querySelector('.edit-btn');
        editBtn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          editingFormatId = format.id;
          formatNameInput.value = format.name;
          formatInput.value = format.format;
          jsInput.value = format.jsCode || '';
          jsErrorDiv.style.display = 'none';
          updatePreview();
          customPanel.classList.remove('hidden');
          toggleIcon.classList.add('rotated');
          if (deleteBtn) deleteBtn.style.display = 'inline-block';
        });
      });
    }

    // プレビュー更新
    function updatePreview() {
      const format = formatInput.value;
      const jsCode = jsInput.value;
      let preview = '';
      let error = '';
      try {
        preview = processCustomFormat(format, title, url, jsCode);
        if (jsErrorDiv) jsErrorDiv.style.display = 'none';
      } catch (e) {
        error = e.message;
        preview = '';
        if (jsErrorDiv) {
          jsErrorDiv.textContent = `エラー: ${error}`;
          jsErrorDiv.style.display = 'block';
        }
      }
      previewBox.textContent = preview;
    }
    formatNameInput.addEventListener('input', updatePreview);
    formatInput.addEventListener('input', updatePreview);
    jsInput.addEventListener('input', updatePreview);

    // 保存
    function saveCustomFormat(formatData) {
      chrome.storage.sync.get(['customFormats'], function(result) {
        const formats = result.customFormats || [];
        const existingIndex = formats.findIndex(f => f.id === formatData.id);
        if (existingIndex >= 0) {
          formats[existingIndex] = formatData;
        } else {
          formats.push(formatData);
        }
        chrome.storage.sync.set({ customFormats: formats }, function() {
          loadSavedFormats();
        });
      });
    }
    if (saveBtn) {
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
          jsCode: jsInput.value.trim()
        };
        saveCustomFormat(formatData);
        clearForm();
        showStatus('formatSaved', 'success');
      });
    }
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
      deleteBtn.style.display = 'none';
    }
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function() {
        clearForm();
      });
    }
    function clearForm() {
      formatNameInput.value = '';
      formatInput.value = '';
      jsInput.value = '';
      jsErrorDiv.style.display = 'none';
      previewBox.textContent = '';
      editingFormatId = null;
      if (deleteBtn) deleteBtn.style.display = 'none';
      formatInput.value = '{title} - {url}';
      updatePreview();
    }
    clearForm();
    loadSavedFormats();
    setTimeout(function() { loadSavedFormats(); }, 100);
  }

  // カスタムフォーマット処理関数
  function processCustomFormat(format, title, url, jsCode) {
    if (!format) return '';
    let result = format
      .replace(/\{title\}/g, title)
      .replace(/\{url\}/g, url)
      .replace(/\{domain\}/g, extractDomain(url))
      .replace(/\{path\}/g, extractPath(url));
    if (jsCode && jsCode.trim() !== '') {
      try {
        const runner = new StringReplaceEngine();
        result = runner.execute(jsCode, { title: result, url: result });
      } catch (error) {
        throw error;
      }
    }
    return result;
  }

  // ドメイン抽出関数
  function extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }

  // パス抽出関数
  function extractPath(url) {
    try {
      return new URL(url).pathname;
    } catch {
      return '';
    }
  }
  
  } catch (error) {
    console.error('Error in popup initialization:', error);
  }

}); 