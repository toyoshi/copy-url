document.addEventListener('DOMContentLoaded', async function() {
  console.log('DOMContentLoaded event fired');

  try {
    // 国際化対応
    initializeI18n();

    // プリセット機能を初期化
    await window.presetLoader.loadAllPresets();
    console.log('Presets loaded');

    // デバッグ用：設定をリセット（開発時のみ）
    await resetPresetSettings();

  const statusDiv = document.getElementById('status');

  // 現在のタブの情報を取得
  console.log('Querying current tab...');
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    console.log('Current tab:', tabs[0]);
    const currentTab = tabs[0];
    const url = currentTab.url;
    const title = currentTab.title;

    // プリセットボタンを表示
    renderPresetButtons(url, title, currentTab);

    // プリセット管理機能の初期化
    initializePresetManagement();
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
      'copyError': isJapanese ? 'コピーに失敗しました' : 'Failed to copy',
      'presetCopied': isJapanese ? 'コピーしました' : 'Copied',
      'presetNotApplicable': isJapanese ? 'このURLには適用できません' : 'Not applicable for this URL',
      'presetError': isJapanese ? 'プリセット実行エラー' : 'Preset execution error',
      'presetSettingsSaved': isJapanese ? 'プリセット設定を保存しました' : 'Preset settings saved'
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
    console.log('Current UI Language:', chrome.i18n.getUILanguage());


    // ボタンのテキスト
    const i18nElements = document.querySelectorAll('[data-i18n]');
    i18nElements.forEach(function(element) {
      const messageKey = element.getAttribute('data-i18n');
      const message = chrome.i18n.getMessage(messageKey);
      console.log(`Chrome i18n - ${messageKey}: ${message}`);

      if (message) {
        element.textContent = message;
      }
    });
  }


  // プリセット管理機能の初期化
  function initializePresetManagement() {
    const manageBtn = document.getElementById('manage-presets');
    const modal = document.getElementById('preset-modal');
    const closeBtn = document.getElementById('close-preset-modal');
    const saveBtn = document.getElementById('save-preset-settings');
    const cancelBtn = document.getElementById('cancel-preset-settings');
    const presetList = document.getElementById('preset-list');

    if (!manageBtn || !modal) {
      console.error('Preset management elements not found');
      return;
    }

    // プリセット管理ボタンクリック
    manageBtn.addEventListener('click', function() {
      renderPresetManagementList();
      modal.classList.remove('hidden');
      document.body.classList.add('modal-open');
    });

    // モーダルを閉じる
    closeBtn.addEventListener('click', function() {
      modal.classList.add('hidden');
      document.body.classList.remove('modal-open');
    });

    // 保存ボタン
    saveBtn.addEventListener('click', async function() {
      await savePresetSettings();
      modal.classList.add('hidden');
      document.body.classList.remove('modal-open');
      // プリセットボタンを再描画
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        renderPresetButtons(tabs[0].url, tabs[0].title, tabs[0]);
      });
    });

    // キャンセルボタン
    cancelBtn.addEventListener('click', function() {
      modal.classList.add('hidden');
      document.body.classList.remove('modal-open');
    });

    function renderPresetManagementList() {
      const allPresets = Array.from(window.presetLoader.presets.values());
      const userSettings = window.presetLoader.userSettings;

      presetList.innerHTML = '';

      // 順序に従ってプリセットを表示
      userSettings.presetOrder.forEach(presetId => {
        const preset = window.presetLoader.getPresetById(presetId);
        if (preset) {
          const item = createPresetManagementItem(preset, userSettings);
          presetList.appendChild(item);
        }
      });
    }

    function createPresetManagementItem(preset, userSettings) {
      const item = document.createElement('div');
      item.className = 'preset-item';
      item.dataset.presetId = preset.id;
      item.draggable = true;

      const isEnabled = userSettings.enabledPresets.includes(preset.id);

      // 表示ラベルの翻訳
      const displayText = chrome.i18n.getMessage('displayLabel') || '表示';

      item.innerHTML = `
        <div class="preset-drag-handle">☰</div>
        <div class="preset-info">
          <span class="preset-icon">${preset.icon || '📋'}</span>
          <span class="preset-name">${preset.name}</span>
        </div>
        <div class="preset-controls">
          <label class="checkbox-label">
            <input type="checkbox" class="preset-enabled" ${isEnabled ? 'checked' : ''}>
            <span>${displayText}</span>
          </label>
        </div>
      `;

      // ドラッグ&ドロップイベントを追加
      item.addEventListener('dragstart', function(e) {
        item.classList.add('dragging');
        e.dataTransfer.setData('text/plain', preset.id);
        e.dataTransfer.effectAllowed = 'move';
      });

      item.addEventListener('dragend', function(e) {
        item.classList.remove('dragging');
        // 全ての要素からdrag-overクラスを削除
        document.querySelectorAll('.preset-item').forEach(el => {
          el.classList.remove('drag-over');
        });
      });

      item.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        if (!item.classList.contains('dragging')) {
          item.classList.add('drag-over');
        }
      });

      item.addEventListener('dragleave', function(e) {
        item.classList.remove('drag-over');
      });

      item.addEventListener('drop', function(e) {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text/plain');
        const draggedElement = document.querySelector(`[data-preset-id="${draggedId}"]`);

        if (draggedElement && draggedElement !== item) {
          // 要素の順序を入れ替え
          const allItems = Array.from(presetList.children);
          const draggedIndex = allItems.indexOf(draggedElement);
          const targetIndex = allItems.indexOf(item);

          if (draggedIndex < targetIndex) {
            presetList.insertBefore(draggedElement, item.nextSibling);
          } else {
            presetList.insertBefore(draggedElement, item);
          }
        }

        item.classList.remove('drag-over');
      });

      return item;
    }

    async function savePresetSettings() {
      const items = presetList.querySelectorAll('.preset-item');
      const newOrder = [];
      const newEnabledPresets = [];

      items.forEach(item => {
        const presetId = item.dataset.presetId;
        newOrder.push(presetId);

        if (item.querySelector('.preset-enabled').checked) {
          newEnabledPresets.push(presetId);
        }
      });

      await window.presetLoader.updatePresetOrder(newOrder);
      window.presetLoader.userSettings.enabledPresets = newEnabledPresets;
      await window.presetLoader.saveUserSettings();

      showStatus('presetSettingsSaved', 'success');
    }
  }

  // プリセットボタンを表示する関数
  function renderPresetButtons(url, title, currentTab) {
    const container = document.getElementById('preset-buttons-container');
    if (!container) {
      console.error('Preset buttons container not found');
      return;
    }

    container.innerHTML = ''; // 既存のボタンをクリア

    // 有効なプリセットのみを表示
    const activePresets = window.presetLoader.getActivePresets();
    console.log('Active presets:', activePresets);

    activePresets.forEach(preset => {
      const button = document.createElement('button');
      button.className = 'copy-btn preset-btn';
      button.innerHTML = `
        <span class="preset-icon">${preset.icon || '📋'}</span>
        <span class="btn-title">${preset.name}</span>
      `;

      button.addEventListener('click', async function() {
        try {
          let selectedText = '';

          // 選択テキスト用プリセットの場合は選択テキストを取得
          if (preset.id === 'selected-text-format') {
            try {
              // chrome.scriptingが利用可能かチェック
              if (chrome.scripting && chrome.scripting.executeScript) {
                // コンテンツスクリプトを注入して選択テキストを取得
                const results = await chrome.scripting.executeScript({
                  target: { tabId: currentTab.id },
                  func: () => {
                    try {
                      return window.getSelection().toString();
                    } catch (e) {
                      console.error('Error getting selection:', e);
                      return '';
                    }
                  }
                });

                if (results && results[0] && results[0].result !== undefined) {
                  selectedText = results[0].result || '';
                }

                console.log('Selected text:', selectedText);
              } else {
                console.warn('chrome.scripting not available');
              }
            } catch (error) {
              console.warn('Could not get selected text:', error);
              selectedText = '';
            }
          }

          const result = await window.presetLoader.applyPreset(preset, url, title, selectedText);
          if (result && result.title) {
            copyToClipboard(result.title, 'presetCopied');
          } else {
            console.log(`Preset ${preset.name} not applicable for this URL`);
            showStatus('presetNotApplicable', 'info');
          }
        } catch (error) {
          console.error('Error applying preset:', error);
          showStatus('presetError', 'error');
        }
      });

      container.appendChild(button);
    });
  }

  // デバッグ用：プリセット設定をリセットする関数
  async function resetPresetSettings() {
    try {
      const allPresets = Array.from(window.presetLoader.presets.keys());
      const newSettings = {
        enabledPresets: allPresets,
        presetOrder: allPresets
      };

      window.presetLoader.userSettings = newSettings;
      await window.presetLoader.saveUserSettings();
      console.log('Reset preset settings to show all presets');
    } catch (error) {
      console.error('Failed to reset preset settings:', error);
    }
  }


  } catch (error) {
    console.error('Error in popup initialization:', error);
  }

}); 