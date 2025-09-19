class PresetLoader {
  constructor() {
    this.presets = new Map();
    this.userSettings = {
      enabledPresets: [],
      presetOrder: []
    };
    this.isLoaded = false;
  }

  async loadAllPresets() {
    if (this.isLoaded) return;

    // プリセットファイルの一覧
    const presetFiles = [
      'title-url-newline',
      'title-url-space',
      'markdown-format',
      'html-format',
      'selected-text-format'
    ];

    for (const file of presetFiles) {
      try {
        // 動的インポートは Chrome Extension では制限があるため、
        // 代わりに事前に定義したプリセットオブジェクトを使用
        const preset = await this.loadPresetFile(file);

        if (preset) {
          this.validatePreset(preset);
          this.presets.set(preset.id, preset);
          console.log(`Loaded preset: ${preset.name}`);
        }
      } catch (error) {
        console.error(`Failed to load preset ${file}:`, error);
      }
    }

    await this.loadUserSettings();
    this.isLoaded = true;
  }

  async loadPresetFile(fileName) {
    // Chrome Extension では動的インポートが制限されるため、
    // プリセットを手動で定義
    const presets = {
      'title-url-newline': {
        id: 'title-url-newline',
        name: 'タイトルとURL（改行）',
        description: 'タイトルとURLを改行で区切ってコピー',
        icon: '📄',
        transform: (url, title) => {
          return {
            url: url,
            title: `${title}\n${url}`
          };
        }
      },
      'title-url-space': {
        id: 'title-url-space',
        name: 'タイトルとURL（スペース）',
        description: 'タイトルとURLをスペースで繋げてコピー',
        icon: '🔗',
        transform: (url, title) => {
          return {
            url: url,
            title: `${title} ${url}`
          };
        }
      },
      'markdown-format': {
        id: 'markdown-format',
        name: 'Markdown形式',
        description: 'Markdown形式のリンクとして整形',
        icon: '📝',
        transform: (url, title) => {
          const escapedTitle = title.replace(/[\[\]]/g, '\\$&');
          return {
            url: url,
            title: `[${escapedTitle}](${url})`
          };
        }
      },
      'html-format': {
        id: 'html-format',
        name: 'HTML形式',
        description: 'HTML形式のリンクとして整形',
        icon: '🌐',
        transform: (url, title) => {
          const escapedTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
          return {
            url: url,
            title: `<a href="${url}">${escapedTitle}</a>`
          };
        }
      },
      'selected-text-format': {
        id: 'selected-text-format',
        name: '選択テキスト+タイトル+URL',
        description: '選択テキスト、改行2つ、タイトル、改行、URLの順で整形',
        icon: '✂️',
        transform: (url, title, selectedText = '') => {
          if (selectedText && selectedText.trim()) {
            return {
              url: url,
              title: `${selectedText.trim()}\n\n${title}\n${url}`
            };
          } else {
            // 選択テキストがない場合はタイトル+URLのみ
            return {
              url: url,
              title: `${title}\n${url}`
            };
          }
        }
      }
    };

    return presets[fileName] || null;
  }

  validatePreset(preset) {
    if (!preset.id || !preset.name) {
      throw new Error('Preset must have id and name');
    }

    if (!preset.transform && !preset.format) {
      throw new Error('Preset must have transform function or format string');
    }

    // セキュリティチェック
    if (typeof preset.transform === 'function') {
      // 関数の文字列表現で危険なパターンをチェック
      const funcStr = preset.transform.toString();
      const dangerousPatterns = [
        /eval\s*\(/,
        /Function\s*\(/,
        /setTimeout\s*\(/,
        /setInterval\s*\(/,
        /XMLHttpRequest/,
        /fetch\s*\(/
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(funcStr)) {
          throw new Error(`Preset contains dangerous pattern: ${pattern}`);
        }
      }
    }
  }

  async loadUserSettings() {
    try {
      const result = await chrome.storage.sync.get('presetSettings');
      if (result.presetSettings) {
        this.userSettings = { ...this.userSettings, ...result.presetSettings };
      } else {
        // 初回起動時のデフォルト設定
        this.userSettings = {
          enabledPresets: Array.from(this.presets.keys()),
          presetOrder: Array.from(this.presets.keys())
        };
        await this.saveUserSettings();
      }
    } catch (error) {
      console.error('Failed to load user settings:', error);
      // デフォルト設定にフォールバック
      this.userSettings = {
        enabledPresets: Array.from(this.presets.keys()),
        presetOrder: Array.from(this.presets.keys())
      };
    }
  }

  async saveUserSettings() {
    try {
      await chrome.storage.sync.set({ presetSettings: this.userSettings });
    } catch (error) {
      console.error('Failed to save user settings:', error);
    }
  }

  getActivePresets() {
    return this.userSettings.presetOrder
      .filter(id => this.userSettings.enabledPresets.includes(id))
      .map(id => this.presets.get(id))
      .filter(Boolean);
  }

  getPresetById(id) {
    return this.presets.get(id);
  }

  async updatePresetOrder(newOrder) {
    this.userSettings.presetOrder = newOrder;
    await this.saveUserSettings();
  }

  async togglePreset(presetId) {
    const index = this.userSettings.enabledPresets.indexOf(presetId);
    if (index >= 0) {
      this.userSettings.enabledPresets.splice(index, 1);
    } else {
      this.userSettings.enabledPresets.push(presetId);
    }
    await this.saveUserSettings();
  }


  applyPreset(preset, url, title, selectedText = '') {
    try {
      if (preset.transform) {
        // セキュリティ: タイムアウトで実行時間を制限
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Preset execution timeout')), 1000);
        });

        const executePromise = new Promise((resolve) => {
          const result = preset.transform(url, title, selectedText);
          resolve(result);
        });

        return Promise.race([executePromise, timeoutPromise]);
      } else if (preset.format) {
        return Promise.resolve({
          url: url,
          title: preset.format
            .replace('{url}', url)
            .replace('{title}', title)
            .replace('{selectedText}', selectedText)
        });
      }
    } catch (error) {
      console.error(`Error applying preset ${preset.id}:`, error);
      return null;
    }
  }
}

// グローバルインスタンス（ポップアップでのみ利用）
if (typeof window !== 'undefined') {
  window.presetLoader = new PresetLoader();
}