class AdvancedCalculator {
  constructor() {
    this.currentExpression = '0';
    this.result = '';
    this.error = '';
    this.history = this.loadHistory();
    this.currentMode = 'basic';
    this.angleMode = 'degrees'; // degrees or radians
    
    this.initializeElements();
    this.attachEventListeners();
    this.updateDisplay();
  }

  initializeElements() {
    this.expressionDisplay = document.getElementById('expression');
    this.resultDisplay = document.getElementById('result');
    this.errorDisplay = document.getElementById('error');
    this.textInput = document.getElementById('textInput');
    this.calculateBtn = document.getElementById('calculateBtn');
    this.historyPanel = document.getElementById('historyPanel');
    this.historyContent = document.getElementById('historyContent');
    this.clearHistoryBtn = document.getElementById('clearHistory');
    this.toggleHistoryBtn = document.getElementById('toggleHistory');
    this.helpModal = document.getElementById('helpModal');
    this.helpBtn = document.getElementById('helpBtn');
    this.closeHelpBtn = document.getElementById('closeHelp');
  }

  attachEventListeners() {
    // Mode switching
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchMode(e.target.dataset.mode));
    });

    // Button grid
    document.getElementById('buttonGrid').addEventListener('click', (e) => {
      if (e.target.classList.contains('btn')) {
        this.handleButtonClick(e.target);
      }
    });

    // Text input
    this.textInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.calculateFromInput();
      }
    });

    // Calculate button
    this.calculateBtn.addEventListener('click', () => this.calculateFromInput());

    // History controls
    this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
    this.toggleHistoryBtn.addEventListener('click', () => this.toggleHistory());

    // Help modal
    this.helpBtn.addEventListener('click', () => this.showHelp());
    this.closeHelpBtn.addEventListener('click', () => this.hideHelp());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyboard(e));

    // Click outside modal to close
    this.helpModal.addEventListener('click', (e) => {
      if (e.target === this.helpModal) this.hideHelp();
    });
  }

  switchMode(mode) {
    this.currentMode = mode;
    
    // Update active mode button
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    // Update active button set
    document.querySelectorAll('.button-set').forEach(set => {
      set.classList.toggle('active', set.classList.contains(`${mode}-buttons`));
    });

    // Update placeholder text
    const placeholders = {
      basic: 'Enter expression (e.g., 2 + 3 * 4)',
      scientific: 'Enter expression (e.g., sin(30), log(100))',
      algebra: 'Enter equation (e.g., 2x + 3 = 7, solve(x^2 - 4))',
      geometry: 'Enter geometry problem (e.g., area circle r=5)'
    };
    
    this.textInput.placeholder = placeholders[mode];
  }

  handleButtonClick(button) {
    const action = button.dataset.action;
    const value = button.dataset.value;
    const template = button.dataset.template;

    if (action) {
      this.handleAction(action);
    } else if (template) {
      this.insertTemplate(template);
    } else if (value) {
      this.insertValue(value);
    }
  }

  handleAction(action) {
    switch (action) {
      case 'clear':
        this.clear();
        break;
      case 'clear-entry':
        this.clearEntry();
        break;
      case 'backspace':
        this.backspace();
        break;
      case 'equals':
        this.calculate();
        break;
    }
  }

  insertValue(value) {
    if (this.currentExpression === '0' && !isNaN(value)) {
      this.currentExpression = value;
    } else {
      // Handle special cases
      if (value === 'π') value = 'PI';
      if (value === 'e') value = 'E';
      
      this.currentExpression += value;
    }
    this.updateDisplay();
  }

  insertTemplate(template) {
    this.textInput.value = template;
    this.textInput.focus();
  }

  clear() {
    this.currentExpression = '0';
    this.result = '';
    this.error = '';
    this.updateDisplay();
  }

  clearEntry() {
    if (this.currentExpression.length > 1) {
      this.currentExpression = this.currentExpression.slice(0, -1);
    } else {
      this.currentExpression = '0';
    }
    this.updateDisplay();
  }

  backspace() {
    this.clearEntry();
  }

  calculateFromInput() {
    const expression = this.textInput.value.trim();
    if (expression) {
      this.currentExpression = expression;
      this.calculate();
      this.textInput.value = '';
    }
  }

  calculate() {
    try {
      this.error = '';
      let expression = this.currentExpression;
      
      // Handle different calculation types
      if (this.isGeometryExpression(expression)) {
        this.result = this.calculateGeometry(expression);
      } else if (this.isAlgebraExpression(expression)) {
        this.result = this.calculateAlgebra(expression);
      } else {
        this.result = this.calculateMath(expression);
      }

      // Add to history if successful
      if (this.result !== '' && !this.error) {
        this.addToHistory(this.currentExpression, this.result);
      }

    } catch (error) {
      this.error = error.message;
      this.result = '';
    }
    
    this.updateDisplay();
  }

  isGeometryExpression(expr) {
    const geoKeywords = ['area', 'volume', 'perimeter', 'distance', 'midpoint', 'slope'];
    return geoKeywords.some(keyword => expr.toLowerCase().includes(keyword));
  }

  isAlgebraExpression(expr) {
    const algebraKeywords = ['solve', 'expand', 'factor', 'simplify', 'derivative', 'integral'];
    const hasVariable = /[xyz]/.test(expr);
    const hasEquals = expr.includes('=');
    return algebraKeywords.some(keyword => expr.toLowerCase().includes(keyword)) || 
           (hasVariable && hasEquals);
  }

  calculateMath(expression) {
    // Preprocess expression
    expression = this.preprocessExpression(expression);
    
    // Enhanced math evaluation with functions
    return this.evaluateExpression(expression);
  }

  preprocessExpression(expr) {
    // Replace display symbols with JavaScript operators
    expr = expr.replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/−/g, '-')
                .replace(/PI/g, Math.PI)
                .replace(/E/g, Math.E);

    // Handle implicit multiplication
    expr = expr.replace(/(\d)\(/g, '$1*(')
                .replace(/\)(\d)/g, ')*$1')
                .replace(/(\d)(PI|E)/g, '$1*$2');

    // Handle special functions
    expr = this.replaceMathFunctions(expr);

    return expr;
  }

  replaceMathFunctions(expr) {
    // Trigonometric functions (handle degrees)
    expr = expr.replace(/sin\(([^)]+)\)/g, (match, angle) => {
      const val = this.angleMode === 'degrees' ? `Math.sin(${angle} * Math.PI / 180)` : `Math.sin(${angle})`;
      return val;
    });
    
    expr = expr.replace(/cos\(([^)]+)\)/g, (match, angle) => {
      const val = this.angleMode === 'degrees' ? `Math.cos(${angle} * Math.PI / 180)` : `Math.cos(${angle})`;
      return val;
    });
    
    expr = expr.replace(/tan\(([^)]+)\)/g, (match, angle) => {
      const val = this.angleMode === 'degrees' ? `Math.tan(${angle} * Math.PI / 180)` : `Math.tan(${angle})`;
      return val;
    });

    // Inverse trigonometric functions
    expr = expr.replace(/asin\(([^)]+)\)/g, (match, val) => {
      return this.angleMode === 'degrees' ? `(Math.asin(${val}) * 180 / Math.PI)` : `Math.asin(${val})`;
    });
    
    expr = expr.replace(/acos\(([^)]+)\)/g, (match, val) => {
      return this.angleMode === 'degrees' ? `(Math.acos(${val}) * 180 / Math.PI)` : `Math.acos(${val})`;
    });
    
    expr = expr.replace(/atan\(([^)]+)\)/g, (match, val) => {
      return this.angleMode === 'degrees' ? `(Math.atan(${val}) * 180 / Math.PI)` : `Math.atan(${val})`;
    });

    // Logarithmic functions
    expr = expr.replace(/log\(([^)]+)\)/g, 'Math.log10($1)');
    expr = expr.replace(/ln\(([^)]+)\)/g, 'Math.log($1)');
    expr = expr.replace(/exp\(([^)]+)\)/g, 'Math.exp($1)');

    // Other math functions
    expr = expr.replace(/sqrt\(([^)]+)\)/g, 'Math.sqrt($1)');
    expr = expr.replace(/abs\(([^)]+)\)/g, 'Math.abs($1)');
    expr = expr.replace(/floor\(([^)]+)\)/g, 'Math.floor($1)');
    expr = expr.replace(/ceil\(([^)]+)\)/g, 'Math.ceil($1)');
    expr = expr.replace(/round\(([^)]+)\)/g, 'Math.round($1)');

    // Factorial function
    expr = expr.replace(/factorial\(([^)]+)\)/g, (match, n) => {
      return `this.factorial(${n})`;
    });

    // Power function (handle ^ operator)
    expr = expr.replace(/([^*+\-/()]+)\^([^*+\-/()]+)/g, 'Math.pow($1, $2)');

    return expr;
  }

  evaluateExpression(expr) {
    try {
      // Use Function constructor for safe evaluation
      const func = new Function('Math', 'return ' + expr);
      const result = func(Math);
      
      if (isNaN(result) || !isFinite(result)) {
        throw new Error('Invalid calculation');
      }
      
      return this.formatResult(result);
    } catch (error) {
      throw new Error('Invalid expression');
    }
  }

  factorial(n) {
    if (n < 0 || !Number.isInteger(n)) throw new Error('Factorial requires non-negative integer');
    if (n === 0 || n === 1) return 1;
    return n * this.factorial(n - 1);
  }

  calculateAlgebra(expression) {
    // Simple algebra solver for linear equations
    if (expression.includes('=')) {
      return this.solveLinearEquation(expression);
    } else if (expression.toLowerCase().startsWith('solve(')) {
      return this.solveExpression(expression);
    } else if (expression.toLowerCase().startsWith('expand(')) {
      return this.expandExpression(expression);
    } else if (expression.toLowerCase().startsWith('factor(')) {
      return this.factorExpression(expression);
    } else if (expression.toLowerCase().startsWith('simplify(')) {
      return this.simplifyExpression(expression);
    }
    
    return 'Algebra calculation not supported yet';
  }

  solveLinearEquation(equation) {
    try {
      // Parse simple linear equations like "2x + 3 = 7"
      const [left, right] = equation.split('=').map(s => s.trim());
      
      // For now, handle simple cases
      const match = left.match(/(-?\d*\.?\d*)x\s*([+-])\s*(\d+\.?\d*)/);
      if (match) {
        const a = parseFloat(match[1] || '1');
        const operator = match[2];
        const b = parseFloat(match[3]);
        const c = parseFloat(right);
        
        const rightSide = operator === '+' ? c - b : c + b;
        const x = rightSide / a;
        
        return `x = ${this.formatResult(x)}`;
      }
      
      return 'Could not solve equation';
    } catch (error) {
      throw new Error('Invalid equation format');
    }
  }

  solveExpression(expr) {
    // Extract expression from solve()
    const match = expr.match(/solve\(([^)]+)\)/);
    if (match) {
      const innerExpr = match[1];
      if (innerExpr.includes('=')) {
        return this.solveLinearEquation(innerExpr);
      }
    }
    return 'Solve function requires an equation';
  }

  expandExpression(expr) {
    // Basic expansion for simple cases
    const match = expr.match(/expand\(([^)]+)\)/);
    if (match) {
      const innerExpr = match[1];
      // Handle (a+b)^2 = a^2 + 2ab + b^2
      const squareMatch = innerExpr.match(/\(([^+]+)\+([^)]+)\)\^2/);
      if (squareMatch) {
        const a = squareMatch[1].trim();
        const b = squareMatch[2].trim();
        return `${a}² + 2(${a})(${b}) + ${b}²`;
      }
    }
    return 'Expand function limited to simple cases';
  }

  factorExpression(expr) {
    return 'Factor function not implemented yet';
  }

  simplifyExpression(expr) {
    return 'Simplify function not implemented yet';
  }

  calculateGeometry(expression) {
    const expr = expression.toLowerCase();
    
    if (expr.includes('area circle')) {
      return this.calculateCircleArea(expr);
    } else if (expr.includes('area triangle')) {
      return this.calculateTriangleArea(expr);
    } else if (expr.includes('area rectangle')) {
      return this.calculateRectangleArea(expr);
    } else if (expr.includes('volume sphere')) {
      return this.calculateSphereVolume(expr);
    } else if (expr.includes('volume cylinder')) {
      return this.calculateCylinderVolume(expr);
    } else if (expr.includes('perimeter circle')) {
      return this.calculateCirclePerimeter(expr);
    } else if (expr.includes('distance')) {
      return this.calculateDistance(expr);
    }
    
    return 'Geometry calculation not recognized';
  }

  calculateCircleArea(expr) {
    const match = expr.match(/r\s*=\s*(\d+\.?\d*)/);
    if (match) {
      const r = parseFloat(match[1]);
      const area = Math.PI * r * r;
      return `${this.formatResult(area)} square units`;
    }
    throw new Error('Invalid circle area format. Use: area circle r=5');
  }

  calculateTriangleArea(expr) {
    const matches = expr.match(/a\s*=\s*(\d+\.?\d*)\s+b\s*=\s*(\d+\.?\d*)\s+c\s*=\s*(\d+\.?\d*)/);
    if (matches) {
      const [, a, b, c] = matches.map(parseFloat);
      // Using Heron's formula
      const s = (a + b + c) / 2;
      const area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
      return `${this.formatResult(area)} square units`;
    }
    throw new Error('Invalid triangle area format. Use: area triangle a=3 b=4 c=5');
  }

  calculateRectangleArea(expr) {
    const matches = expr.match(/l\s*=\s*(\d+\.?\d*)\s+w\s*=\s*(\d+\.?\d*)/);
    if (matches) {
      const [, l, w] = matches.map(parseFloat);
      const area = l * w;
      return `${this.formatResult(area)} square units`;
    }
    throw new Error('Invalid rectangle area format. Use: area rectangle l=5 w=3');
  }

  calculateSphereVolume(expr) {
    const match = expr.match(/r\s*=\s*(\d+\.?\d*)/);
    if (match) {
      const r = parseFloat(match[1]);
      const volume = (4/3) * Math.PI * r * r * r;
      return `${this.formatResult(volume)} cubic units`;
    }
    throw new Error('Invalid sphere volume format. Use: volume sphere r=5');
  }

  calculateCylinderVolume(expr) {
    const matches = expr.match(/r\s*=\s*(\d+\.?\d*)\s+h\s*=\s*(\d+\.?\d*)/);
    if (matches) {
      const [, r, h] = matches.map(parseFloat);
      const volume = Math.PI * r * r * h;
      return `${this.formatResult(volume)} cubic units`;
    }
    throw new Error('Invalid cylinder volume format. Use: volume cylinder r=3 h=5');
  }

  calculateCirclePerimeter(expr) {
    const match = expr.match(/r\s*=\s*(\d+\.?\d*)/);
    if (match) {
      const r = parseFloat(match[1]);
      const perimeter = 2 * Math.PI * r;
      return `${this.formatResult(perimeter)} units`;
    }
    throw new Error('Invalid circle perimeter format. Use: perimeter circle r=5');
  }

  calculateDistance(expr) {
    // Simple distance between two points
    const match = expr.match(/\((\d+\.?\d*),\s*(\d+\.?\d*)\)\s+\((\d+\.?\d*),\s*(\d+\.?\d*)\)/);
    if (match) {
      const [, x1, y1, x2, y2] = match.map(parseFloat);
      const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      return `${this.formatResult(distance)} units`;
    }
    throw new Error('Invalid distance format. Use: distance (x1,y1) (x2,y2)');
  }

  formatResult(result) {
    if (Number.isInteger(result)) {
      return result.toString();
    } else {
      return parseFloat(result.toFixed(10)).toString();
    }
  }

  updateDisplay() {
    this.expressionDisplay.textContent = this.currentExpression;
    this.resultDisplay.textContent = this.result;
    
    if (this.error) {
      this.errorDisplay.textContent = this.error;
      this.errorDisplay.style.display = 'block';
    } else {
      this.errorDisplay.style.display = 'none';
    }
  }

  addToHistory(expression, result) {
    const entry = {
      expression,
      result,
      timestamp: new Date().toLocaleString()
    };
    
    this.history.unshift(entry);
    
    // Keep only last 50 entries
    if (this.history.length > 50) {
      this.history = this.history.slice(0, 50);
    }
    
    this.saveHistory();
    this.updateHistoryDisplay();
  }

  updateHistoryDisplay() {
    if (this.history.length === 0) {
      this.historyContent.innerHTML = '<div class="history-empty">No calculations yet</div>';
      return;
    }

    const historyHTML = this.history.map(entry => `
      <div class="history-entry" data-expression="${entry.expression}">
        <div class="history-expression">${entry.expression}</div>
        <div class="history-result">= ${entry.result}</div>
        <div class="history-time">${entry.timestamp}</div>
      </div>
    `).join('');

    this.historyContent.innerHTML = historyHTML;

    // Add click handlers to reuse expressions
    this.historyContent.querySelectorAll('.history-entry').forEach(entry => {
      entry.addEventListener('click', () => {
        const expr = entry.dataset.expression;
        this.currentExpression = expr;
        this.updateDisplay();
      });
    });
  }

  loadHistory() {
    try {
      const saved = localStorage.getItem('calculator-history');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      return [];
    }
  }

  saveHistory() {
    try {
      localStorage.setItem('calculator-history', JSON.stringify(this.history));
    } catch (error) {
      console.error('Failed to save history');
    }
  }

  clearHistory() {
    this.history = [];
    this.saveHistory();
    this.updateHistoryDisplay();
  }

  toggleHistory() {
    this.historyPanel.classList.toggle('collapsed');
  }

  showHelp() {
    this.helpModal.style.display = 'flex';
  }

  hideHelp() {
    this.helpModal.style.display = 'none';
  }

  handleKeyboard(e) {
    // Handle keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          this.calculate();
          break;
        case 'Backspace':
          e.preventDefault();
          this.clear();
          break;
        case 'h':
          e.preventDefault();
          this.showHelp();
          break;
      }
    } else {
      switch (e.key) {
        case 'Enter':
          if (document.activeElement !== this.textInput) {
            this.calculate();
          }
          break;
        case 'Escape':
          this.hideHelp();
          break;
        case 'c':
        case 'C':
          if (document.activeElement !== this.textInput) {
            this.clear();
          }
          break;
      }
    }
  }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.calculator = new AdvancedCalculator();
});