/**
 * AuraCalc - Modern Glassmorphic Calculator Logic
 * Includes precision math, audio synthesis, history tracking, keyboard shortcuts, and theme toggle.
 */

(() => {
  'use strict';

  // DOM Elements
  const mainDisplay = document.getElementById('main-display');
  const expressionDisplay = document.getElementById('expression-display');
  const keypad = document.querySelector('.keypad');
  const quickFuncs = document.querySelector('.quick-functions');
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  const btnSoundToggle = document.getElementById('btn-sound-toggle');
  const soundIcon = document.getElementById('sound-icon');
  const btnHistoryToggle = document.getElementById('btn-history-toggle');
  const historyDrawer = document.getElementById('history-drawer');
  const btnCloseHistory = document.getElementById('btn-close-history');
  const btnClearHistory = document.getElementById('btn-clear-history');
  const historyList = document.getElementById('history-list');
  const historyBadge = document.getElementById('history-badge');
  const btnCopy = document.getElementById('btn-copy');
  const toast = document.getElementById('calc-toast');

  // Calculator State
  let currentVal = '0';
  let previousVal = null;
  let currentOperator = null;
  let overwriteInput = false;
  let lastEvaluatedExpr = '';
  let calculationHistory = [];
  let isSoundEnabled = true;

  // Sound Synthesizer via Web Audio API
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTone(type = 'num') {
    if (!isSoundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      const now = audioCtx.currentTime;
      let freq = 480;
      let duration = 0.04;

      if (type === 'num') {
        freq = 460 + Math.random() * 40;
      } else if (type === 'operator') {
        freq = 640;
        duration = 0.05;
      } else if (type === 'equals') {
        freq = 780;
        duration = 0.08;
      } else if (type === 'clear') {
        freq = 320;
        duration = 0.06;
      } else if (type === 'func') {
        freq = 560;
        duration = 0.05;
      }

      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // Audio autoplay policy fallback or unavailable
    }
  }

  // Operator symbols for display
  const OPERATOR_SYMBOLS = {
    '+': '+',
    '-': '−',
    '*': '×',
    '/': '÷'
  };

  // Safe floating-point calculation
  function calculateMath(a, b, op) {
    const numA = Number(a);
    const numB = Number(b);

    switch (op) {
      case '+':
        return numA + numB;
      case '-':
        return numA - numB;
      case '*':
        return numA * numB;
      case '/':
        if (numB === 0) return 'Error';
        return numA / numB;
      default:
        return numB;
    }
  }

  // Format number for display with commas and precision cleanup
  function formatDisplayNumber(valueStr) {
    if (valueStr === 'Error' || valueStr === 'Cannot divide by 0') {
      return valueStr;
    }

    if (valueStr.endsWith('.')) {
      const whole = Number(valueStr.slice(0, -1));
      return isNaN(whole) ? valueStr : whole.toLocaleString('en-US') + '.';
    }

    const num = Number(valueStr);
    if (isNaN(num)) return valueStr;

    // Handle extreme numbers
    if (Math.abs(num) > 1e12 || (Math.abs(num) < 1e-7 && num !== 0)) {
      return num.toExponential(5);
    }

    // Round away floating artifacts to max 10 decimals
    const rounded = parseFloat(num.toFixed(10));
    const parts = rounded.toString().split('.');
    parts[0] = Number(parts[0]).toLocaleString('en-US');
    return parts.join('.');
  }

  // Update UI Screen
  function updateDisplay() {
    mainDisplay.textContent = formatDisplayNumber(currentVal);
    adjustDisplayFontSize();

    // Expression line
    if (previousVal !== null && currentOperator) {
      const opSymbol = OPERATOR_SYMBOLS[currentOperator] || currentOperator;
      expressionDisplay.textContent = `${formatDisplayNumber(previousVal.toString())} ${opSymbol}`;
    } else if (lastEvaluatedExpr) {
      expressionDisplay.textContent = lastEvaluatedExpr;
    } else {
      expressionDisplay.textContent = '';
    }

    // Highlight active operator button
    document.querySelectorAll('.btn-operator').forEach(btn => {
      if (btn.dataset.operator === currentOperator && overwriteInput) {
        btn.classList.add('active-operator');
      } else {
        btn.classList.remove('active-operator');
      }
    });
  }

  // Adjust font size dynamically to fit large numbers smoothly
  function adjustDisplayFontSize() {
    const len = mainDisplay.textContent.length;
    if (len > 14) {
      mainDisplay.style.fontSize = '1.5rem';
    } else if (len > 11) {
      mainDisplay.style.fontSize = '1.85rem';
    } else if (len > 8) {
      mainDisplay.style.fontSize = '2.25rem';
    } else {
      mainDisplay.style.fontSize = '';
    }
  }

  // Input Digits
  function appendNumber(digit) {
    if (currentVal === 'Error') {
      currentVal = '0';
    }

    if (overwriteInput) {
      currentVal = digit;
      overwriteInput = false;
    } else {
      if (currentVal === '0') {
        currentVal = digit;
      } else {
        // Prevent overly long numbers exceeding screen capacity
        if (currentVal.replace(/[^0-9]/g, '').length >= 14) return;
        currentVal += digit;
      }
    }
    playTone('num');
    updateDisplay();
  }

  // Input Decimal Point
  function appendDecimal() {
    if (overwriteInput) {
      currentVal = '0.';
      overwriteInput = false;
    } else if (!currentVal.includes('.')) {
      currentVal += '.';
    }
    playTone('num');
    updateDisplay();
  }

  // Choose Operator
  function handleOperator(nextOperator) {
    if (currentVal === 'Error') return;

    const inputVal = parseFloat(currentVal);

    if (previousVal === null) {
      previousVal = inputVal;
    } else if (currentOperator && !overwriteInput) {
      const result = calculateMath(previousVal, inputVal, currentOperator);
      if (result === 'Error') {
        handleError();
        return;
      }
      currentVal = result.toString();
      previousVal = result;
    }

    currentOperator = nextOperator;
    overwriteInput = true;
    lastEvaluatedExpr = '';
    playTone('operator');
    updateDisplay();
  }

  // Evaluate Calculation
  function evaluate() {
    if (currentVal === 'Error') return;

    if (currentOperator === null || previousVal === null) {
      // Just shake display slightly or do nothing
      return;
    }

    const inputVal = parseFloat(currentVal);
    const result = calculateMath(previousVal, inputVal, currentOperator);

    if (result === 'Error') {
      handleError();
      return;
    }

    const opSymbol = OPERATOR_SYMBOLS[currentOperator] || currentOperator;
    const expressionString = `${formatDisplayNumber(previousVal.toString())} ${opSymbol} ${formatDisplayNumber(inputVal.toString())} =`;

    // Add to history
    addToHistory(expressionString, result);

    lastEvaluatedExpr = expressionString;
    currentVal = result.toString();
    previousVal = null;
    currentOperator = null;
    overwriteInput = true;

    playTone('equals');
    updateDisplay();
  }

  // Error State Handler
  function handleError() {
    currentVal = 'Error';
    previousVal = null;
    currentOperator = null;
    overwriteInput = true;
    playTone('clear');
    updateDisplay();
    showToast('Cannot divide by zero');
  }

  // Clear All (AC)
  function clearAll() {
    currentVal = '0';
    previousVal = null;
    currentOperator = null;
    overwriteInput = false;
    lastEvaluatedExpr = '';
    playTone('clear');
    updateDisplay();
  }

  // Delete Last Character (Backspace)
  function deleteChar() {
    if (overwriteInput || currentVal === 'Error') {
      currentVal = '0';
      overwriteInput = false;
    } else {
      currentVal = currentVal.slice(0, -1);
      if (currentVal === '' || currentVal === '-') {
        currentVal = '0';
      }
    }
    playTone('clear');
    updateDisplay();
  }

  // Toggle Sign (±)
  function toggleNegate() {
    if (currentVal === '0' || currentVal === 'Error') return;
    currentVal = currentVal.startsWith('-') ? currentVal.slice(1) : '-' + currentVal;
    playTone('num');
    updateDisplay();
  }

  // Percentage Action (%)
  function handlePercent() {
    if (currentVal === 'Error') return;
    const val = parseFloat(currentVal);
    if (previousVal !== null && currentOperator) {
      // e.g. 200 + 10% => 10% of 200 = 20
      const percentValue = (previousVal * val) / 100;
      currentVal = percentValue.toString();
    } else {
      currentVal = (val / 100).toString();
    }
    playTone('operator');
    updateDisplay();
  }

  // Quick Functions: Sqrt, Square, Reciprocal, Pi
  function handleQuickFunction(action) {
    if (currentVal === 'Error') return;
    const val = parseFloat(currentVal);
    let res = val;
    let label = '';

    switch (action) {
      case 'sqrt':
        if (val < 0) {
          handleError();
          return;
        }
        res = Math.sqrt(val);
        label = `√(${formatDisplayNumber(val.toString())})`;
        break;
      case 'square':
        res = val * val;
        label = `sqr(${formatDisplayNumber(val.toString())})`;
        break;
      case 'reciprocal':
        if (val === 0) {
          handleError();
          return;
        }
        res = 1 / val;
        label = `1/(${formatDisplayNumber(val.toString())})`;
        break;
      case 'pi':
        res = Math.PI;
        label = 'π';
        break;
    }

    addToHistory(`${label} =`, res);
    lastEvaluatedExpr = `${label} =`;
    currentVal = res.toString();
    overwriteInput = true;
    playTone('func');
    updateDisplay();
  }

  // ==========================================================================
  // History Management
  // ==========================================================================

  function addToHistory(expr, result) {
    const item = {
      id: Date.now(),
      expr,
      result: result.toString(),
      displayResult: formatDisplayNumber(result.toString())
    };
    calculationHistory.unshift(item);
    if (calculationHistory.length > 25) {
      calculationHistory.pop();
    }
    renderHistory();
  }

  function renderHistory() {
    // Update badge
    if (calculationHistory.length > 0) {
      historyBadge.style.display = 'inline-block';
      historyBadge.textContent = calculationHistory.length;
    } else {
      historyBadge.style.display = 'none';
    }

    if (calculationHistory.length === 0) {
      historyList.innerHTML = '<div class="empty-history-msg">No calculations yet</div>';
      return;
    }

    historyList.innerHTML = calculationHistory.map(item => `
      <div class="history-item" data-res="${item.result}" tabindex="0" role="button" aria-label="${item.expr} ${item.displayResult}">
        <div class="history-expr">${escapeHTML(item.expr)}</div>
        <div class="history-res">${escapeHTML(item.displayResult)}</div>
      </div>
    `).join('');

    // Attach click to history items
    historyList.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', () => {
        currentVal = el.dataset.res;
        overwriteInput = true;
        updateDisplay();
        toggleHistoryDrawer(false);
        showToast('Value restored to display');
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          el.click();
        }
      });
    });
  }

  function clearHistory() {
    calculationHistory = [];
    renderHistory();
    showToast('History cleared');
  }

  function toggleHistoryDrawer(show = null) {
    const isOpen = historyDrawer.classList.contains('open');
    const newState = show !== null ? show : !isOpen;

    if (newState) {
      historyDrawer.classList.add('open');
      historyDrawer.setAttribute('aria-hidden', 'false');
    } else {
      historyDrawer.classList.remove('open');
      historyDrawer.setAttribute('aria-hidden', 'true');
    }
  }

  function escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ==========================================================================
  // Clipboard Copy & Toast Feedback
  // ==========================================================================

  function copyToClipboard() {
    if (currentVal === 'Error') return;
    navigator.clipboard.writeText(currentVal).then(() => {
      showToast('Copied to clipboard!');
    }).catch(() => {
      showToast('Failed to copy');
    });
  }

  let toastTimer = null;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2200);
  }

  // ==========================================================================
  // Theme Toggle (Dark / Light)
  // ==========================================================================

  function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    html.setAttribute('data-theme', newTheme);
    themeIcon.textContent = newTheme === 'dark' ? '🌙' : '☀️';
    localStorage.setItem('auracalc-theme', newTheme);
  }

  function loadSavedTheme() {
    const saved = localStorage.getItem('auracalc-theme');
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
      themeIcon.textContent = saved === 'dark' ? '🌙' : '☀️';
    }
  }

  // ==========================================================================
  // Sound Toggle
  // ==========================================================================

  function toggleSound() {
    isSoundEnabled = !isSoundEnabled;
    soundIcon.textContent = isSoundEnabled ? '🔊' : '🔇';
    showToast(isSoundEnabled ? 'Audio feedback enabled' : 'Audio feedback muted');
  }

  // ==========================================================================
  // Event Delegation & Listeners
  // ==========================================================================

  // Keypad Click Delegation
  keypad.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) return;

    const action = button.dataset.action;
    const value = button.dataset.value;
    const operator = button.dataset.operator;

    switch (action) {
      case 'number':
        appendNumber(value);
        break;
      case 'decimal':
        appendDecimal();
        break;
      case 'operator':
        handleOperator(operator);
        break;
      case 'calculate':
        evaluate();
        break;
      case 'clear':
        clearAll();
        break;
      case 'delete':
        deleteChar();
        break;
      case 'percent':
        handlePercent();
        break;
      case 'negate':
        toggleNegate();
        break;
    }
  });

  // Quick Functions Bar
  quickFuncs.addEventListener('click', (e) => {
    const button = e.target.closest('button');
    if (!button) return;
    const action = button.dataset.action;
    handleQuickFunction(action);
  });

  // Controls
  btnThemeToggle.addEventListener('click', toggleTheme);
  btnSoundToggle.addEventListener('click', toggleSound);
  btnHistoryToggle.addEventListener('click', () => toggleHistoryDrawer());
  btnCloseHistory.addEventListener('click', () => toggleHistoryDrawer(false));
  btnClearHistory.addEventListener('click', clearHistory);
  btnCopy.addEventListener('click', copyToClipboard);

  // Keyboard Support
  window.addEventListener('keydown', (e) => {
    // If typing inside an input or drawer, skip
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // Check for standard calculator keys
    if (e.key >= '0' && e.key <= '9') {
      appendNumber(e.key);
      highlightKey(`[data-value="${e.key}"]`);
    } else if (e.key === '.' || e.key === ',') {
      appendDecimal();
      highlightKey('#btn-decimal');
    } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
      handleOperator(e.key);
      highlightKey(`[data-operator="${e.key}"]`);
    } else if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      evaluate();
      highlightKey('#btn-equals');
    } else if (e.key === 'Backspace') {
      deleteChar();
      highlightKey('#btn-backspace');
    } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
      clearAll();
      highlightKey('#btn-clear');
    } else if (e.key === '%') {
      handlePercent();
      highlightKey('#btn-percent');
    }
  });

  function highlightKey(selector) {
    const btn = document.querySelector(selector);
    if (btn) {
      btn.classList.add('active');
      setTimeout(() => btn.classList.remove('active'), 150);
    }
  }

  // Initialize
  loadSavedTheme();
  updateDisplay();
  renderHistory();
})();
