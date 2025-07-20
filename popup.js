document.addEventListener('DOMContentLoaded', function() {
  console.log('DOMContentLoaded event fired');
  
  try {
    // セキュアなJavaScript実行エンジン
    class SecureJSRunner {
      constructor() {
        // 許可される関数のみを定義
        this.allowedFunctions = {
          // 文字列操作
          substring: String.prototype.substring,
          replace: String.prototype.replace,
          toLowerCase: String.prototype.toLowerCase,
          toUpperCase: String.prototype.toUpperCase,
          trim: String.prototype.trim,
          split: String.prototype.split,
          indexOf: String.prototype.indexOf,
          lastIndexOf: String.prototype.lastIndexOf,
          
          // 配列操作
          join: Array.prototype.join,
          slice: Array.prototype.slice,
          map: Array.prototype.map,
          filter: Array.prototype.filter,
          
          // 数学関数
          Math: {
            floor: Math.floor,
            ceil: Math.ceil,
            round: Math.round,
            max: Math.max,
            min: Math.min,
            abs: Math.abs,
            random: Math.random
          },
          
          // 日時関数
          Date: {
            now: Date.now,
            getFullYear: Date.prototype.getFullYear,
            getMonth: Date.prototype.getMonth,
            getDate: Date.prototype.getDate,
            getHours: Date.prototype.getHours,
            getMinutes: Date.prototype.getMinutes,
            getSeconds: Date.prototype.getSeconds,
            getDay: Date.prototype.getDay
          }
        };
        
        // 禁止する関数・オブジェクト
        this.forbiddenKeywords = [
          'eval', 'Function', 'setTimeout', 'setInterval',
          'fetch', 'XMLHttpRequest', 'fetch',
          'localStorage', 'sessionStorage', 'indexedDB',
          'document', 'window', 'location', 'history',
          'chrome', 'browser', 'navigator', 'alert',
          'confirm', 'prompt', 'console', 'debugger'
        ];
      }
      
      // セキュリティチェック
      validateCode(code) {
        // 禁止キーワードのチェック
        for (const keyword of this.forbiddenKeywords) {
          if (code.includes(keyword)) {
            throw new Error(`禁止されたキーワード: ${keyword}`);
          }
        }
        
        // 危険なパターンのチェック
        const dangerousPatterns = [
          /eval\s*\(/,
          /Function\s*\(/,
          /new\s+Function/,
          /setTimeout\s*\(/,
          /setInterval\s*\(/,
          /fetch\s*\(/,
          /XMLHttpRequest/,
          /document\./,
          /window\./,
          /chrome\./,
          /browser\./,
          /alert\s*\(/,
          /confirm\s*\(/,
          /prompt\s*\(/,
          /console\./,
          /debugger\s*;/
        ];
        
        for (const pattern of dangerousPatterns) {
          if (pattern.test(code)) {
            throw new Error('危険なコードパターンが検出されました');
          }
        }
        
        return true;
      }
      
      // 安全な実行
      execute(code, context) {
        try {
          this.validateCode(code);
          
          // 安全なコンテキストを作成
          const title = context.title || '';
          const url = context.url || '';
          const domain = this.extractDomain(context.url);
          const path = this.extractPath(context.url);
          const date = new Date();
          
          // プリセットされた関数を定義
          const functions = {
            // 文字列操作
            substring: (str, start, end) => str.substring(start, end),
            replace: (str, search, replace) => str.replace(search, replace),
            toLowerCase: (str) => str.toLowerCase(),
            toUpperCase: (str) => str.toUpperCase(),
            trim: (str) => str.trim(),
            split: (str, separator) => str.split(separator),
            indexOf: (str, search) => str.indexOf(search),
            lastIndexOf: (str, search) => str.lastIndexOf(search),
            
            // 配列操作
            join: (arr, separator) => arr.join(separator),
            slice: (arr, start, end) => arr.slice(start, end),
            map: (arr, func) => arr.map(func),
            filter: (arr, func) => arr.filter(func),
            
            // 数学関数
            floor: (num) => Math.floor(num),
            ceil: (num) => Math.ceil(num),
            round: (num) => Math.round(num),
            max: (...nums) => Math.max(...nums),
            min: (...nums) => Math.min(...nums),
            abs: (num) => Math.abs(num),
            random: () => Math.random(),
            
            // 日時関数
            getFullYear: (date) => date.getFullYear(),
            getMonth: (date) => date.getMonth(),
            getDate: (date) => date.getDate(),
            getHours: (date) => date.getHours(),
            getMinutes: (date) => date.getMinutes(),
            getSeconds: (date) => date.getSeconds(),
            getDay: (date) => date.getDay(),
            
            // 条件分岐
            if: (condition, trueValue, falseValue) => condition ? trueValue : falseValue,
            
            // 文字列長
            length: (str) => str.length,
            
            // 正規表現
            test: (regex, str) => new RegExp(regex).test(str),
            match: (regex, str) => str.match(new RegExp(regex))
          };
          
          // 安全な実行環境を作成
          const safeEval = (expression) => {
            // 基本的な算術演算と比較演算のみ許可
            const allowedOperators = ['+', '-', '*', '/', '%', '===', '!==', '==', '!=', '>', '<', '>=', '<=', '&&', '||', '!'];
            const allowedKeywords = ['true', 'false', 'null', 'undefined'];
            
            // 危険な文字列をチェック
            const dangerousChars = ['(', ')', '{', '}', ';', '=', 'eval', 'Function', 'new'];
            for (const char of dangerousChars) {
              if (expression.includes(char)) {
                throw new Error('危険な文字が含まれています');
              }
            }
            
            // 単純な式のみ評価
            return this.evaluateSimpleExpression(expression, { title, url, domain, path, date, ...functions });
          };
          
          // コードを安全に実行
          return this.executeSafeCode(code, { title, url, domain, path, date, ...functions });
          
        } catch (error) {
          console.error('JavaScript実行エラー:', error);
          return `[エラー: ${error.message}]`;
        }
      }
      
      // 単純な式の評価
      evaluateSimpleExpression(expression, context) {
        // 変数置換
        let result = expression;
        for (const [key, value] of Object.entries(context)) {
          if (typeof value === 'string') {
            result = result.replace(new RegExp(`\\b${key}\\b`, 'g'), `"${value}"`);
          } else if (typeof value === 'number') {
            result = result.replace(new RegExp(`\\b${key}\\b`, 'g'), value.toString());
          }
        }
        
                 // 安全な評価（非常に制限的）
         try {
           // 基本的な算術演算のみ
           if (/^[\d\s+\-*/().]+$/.test(result)) {
             return this.evaluateMathExpression(result);
           }
           return result;
         } catch {
           return result;
         }
      }
      
      // 安全なコード実行
      executeSafeCode(code, context) {
        // プリセットされたパターンのみ許可
        const patterns = [
          // 条件分岐
          {
            pattern: /if\s*\(\s*(.+?)\s*\)\s*\?\s*(.+?)\s*:\s*(.+?)\s*$/,
            handler: (match, context) => {
              const condition = this.evaluateCondition(match[1], context);
              const trueValue = this.evaluateValue(match[2], context);
              const falseValue = this.evaluateValue(match[3], context);
              return condition ? trueValue : falseValue;
            }
          },
          // 文字列長チェック
          {
            pattern: /(.+?)\.length\s*(>|<|>=|<=|===|!==)\s*(\d+)/,
            handler: (match, context) => {
              const str = this.evaluateValue(match[1], context);
              const operator = match[2];
              const num = parseInt(match[3]);
              return this.evaluateComparison(`"${str}".length`, operator, num);
            }
          },
          // 文字列切り詰め
          {
            pattern: /(.+?)\.substring\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/,
            handler: (match, context) => {
              const str = this.evaluateValue(match[1], context);
              const start = parseInt(match[2]);
              const end = parseInt(match[3]);
              return str.substring(start, end);
            }
          }
        ];
        
        // パターンマッチングで処理
        for (const pattern of patterns) {
          const match = code.match(pattern.pattern);
          if (match) {
            return pattern.handler(match, context);
          }
        }
        
        // 単純な変数参照
        if (context[code]) {
          return context[code];
        }
        
        // デフォルトはコードをそのまま返す
        return code;
      }
      
      // 条件評価
      evaluateCondition(condition, context) {
        // 基本的な条件のみ評価
        if (condition.includes('length')) {
          const match = condition.match(/(.+?)\.length\s*(>|<|>=|<=|===|!==)\s*(\d+)/);
          if (match) {
            const str = this.evaluateValue(match[1], context);
            const operator = match[2];
            const num = parseInt(match[3]);
                         return this.evaluateComparison(`"${str}".length`, operator, num);
          }
        }
        
        if (condition.includes('includes')) {
          const match = condition.match(/(.+?)\.includes\s*\(\s*(.+?)\s*\)/);
          if (match) {
            const str = this.evaluateValue(match[1], context);
            const search = this.evaluateValue(match[2], context);
            return str.includes(search);
          }
        }
        
        return false;
      }
      
      // 値評価
      evaluateValue(value, context) {
        value = value.trim();
        
        // 変数参照
        if (context[value]) {
          return context[value];
        }
        
        // 文字列リテラル
        if (value.startsWith('"') && value.endsWith('"')) {
          return value.slice(1, -1);
        }
        
        // 数値
        if (!isNaN(value)) {
          return parseInt(value);
        }
        
                 return value;
       }
       
       // 数学式の評価
       evaluateMathExpression(expression) {
         // 基本的な算術演算のみ
         const tokens = expression.match(/[\d.]+|\+|\-|\*|\/|\(|\)/g) || [];
         const stack = [];
         const operators = [];
         
         for (const token of tokens) {
           if (/\d/.test(token)) {
             stack.push(parseFloat(token));
           } else if (token === '(') {
             operators.push(token);
           } else if (token === ')') {
             while (operators.length > 0 && operators[operators.length - 1] !== '(') {
               this.applyOperator(stack, operators.pop());
             }
             if (operators.length > 0) {
               operators.pop(); // '(' を削除
             }
           } else if (['+', '-', '*', '/'].includes(token)) {
             while (operators.length > 0 && this.getPrecedence(operators[operators.length - 1]) >= this.getPrecedence(token)) {
               this.applyOperator(stack, operators.pop());
             }
             operators.push(token);
           }
         }
         
         while (operators.length > 0) {
           this.applyOperator(stack, operators.pop());
         }
         
         return stack[0] || 0;
       }
       
       // 演算子の優先度
       getPrecedence(operator) {
         if (operator === '*' || operator === '/') return 2;
         if (operator === '+' || operator === '-') return 1;
         return 0;
       }
       
       // 演算子の適用
       applyOperator(stack, operator) {
         const b = stack.pop();
         const a = stack.pop();
         
         switch (operator) {
           case '+': stack.push(a + b); break;
           case '-': stack.push(a - b); break;
           case '*': stack.push(a * b); break;
           case '/': stack.push(a / b); break;
         }
       }
       
       // 比較演算の評価
       evaluateComparison(left, operator, right) {
         const leftValue = typeof left === 'string' ? left.length : parseFloat(left);
         const rightValue = parseFloat(right);
         
         switch (operator) {
           case '>': return leftValue > rightValue;
           case '<': return leftValue < rightValue;
           case '>=': return leftValue >= rightValue;
           case '<=': return leftValue <= rightValue;
           case '===': return leftValue === rightValue;
           case '!==': return leftValue !== rightValue;
           default: return false;
         }
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
    const jsInput = document.getElementById('custom-js');
    const jsErrorDiv = document.getElementById('js-error');
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
              format.replacePattern,
              format.jsCode
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
          jsInput.value = format.jsCode || '';
          jsErrorDiv.style.display = 'none';
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
          format.replacePattern,
          format.jsCode
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
            format.replacePattern,
            format.jsCode
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
        jsInput.value = format.jsCode || '';
        jsErrorDiv.style.display = 'none';
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
          replacePattern: replaceInput.value.trim(),
          jsCode: jsInput.value.trim()
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
      const jsCode = jsInput.value;
      const preview = processCustomFormat(format, title, url, searchPattern, replacePattern, jsCode);
      previewBox.textContent = preview;
    }

    // 各入力フィールドのイベントリスナー
    formatNameInput.addEventListener('input', updatePreview);
    formatInput.addEventListener('input', updatePreview);
    searchInput.addEventListener('input', updatePreview);
    replaceInput.addEventListener('input', updatePreview);
    jsInput.addEventListener('input', updatePreview);

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
          replacePattern: replaceInput.value.trim(),
          jsCode: jsInput.value.trim()
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
      jsInput.value = '';
      jsErrorDiv.style.display = 'none';
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
  function processCustomFormat(format, title, url, searchPattern, replacePattern, jsCode) {
    if (!format) return '';

    // 変数置換
    let result = format
      .replace(/\{title\}/g, title)
      .replace(/\{url\}/g, url)
      .replace(/\{domain\}/g, extractDomain(url))
      .replace(/\{path\}/g, extractPath(url));

    // カスタムJavaScript処理
    if (jsCode && jsCode.trim() !== '') {
      try {
        const runner = new SecureJSRunner();
        const jsResult = runner.execute(jsCode, { title, url });
        result = result.replace(/\{js\}/g, jsResult);
        
        // エラー表示をクリア
        const jsErrorDiv = document.getElementById('js-error');
        if (jsErrorDiv) {
          jsErrorDiv.style.display = 'none';
        }
      } catch (error) {
        console.error('JavaScript処理エラー:', error);
        result = result.replace(/\{js\}/g, `[JSエラー: ${error.message}]`);
        
        // エラー表示
        const jsErrorDiv = document.getElementById('js-error');
        if (jsErrorDiv) {
          jsErrorDiv.textContent = `JavaScriptエラー: ${error.message}`;
          jsErrorDiv.style.display = 'block';
        }
      }
    }

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