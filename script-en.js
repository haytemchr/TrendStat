// Global variables
let regressionChart = null;

// Function to switch language
function switchLanguage() {
    window.location.href = 'index.html';
}

// Function to calculate linear regression
function calculateRegression(xValues, yValues) {
    const n = xValues.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    for (let i = 0; i < n; i++) {
        sumX += xValues[i];
        sumY += yValues[i];
        sumXY += xValues[i] * yValues[i];
        sumX2 += xValues[i] * xValues[i];
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R²
    const yMean = sumY / n;
    let totalSS = 0, residualSS = 0;
    
    for (let i = 0; i < n; i++) {
        totalSS += Math.pow(yValues[i] - yMean, 2);
        const prediction = slope * xValues[i] + intercept;
        residualSS += Math.pow(yValues[i] - prediction, 2);
    }
    
    const rSquared = 1 - (residualSS / totalSS);
    
    return {
        slope,
        intercept,
        rSquared
    };
}

// Function to update chart
function updateChart(xValues, yValues, xLabel, yLabel, regression) {
    const ctx = document.getElementById('scatterChart').getContext('2d');
    
    // Calculate regression line points
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const regressionPoints = [
        { x: minX, y: regression.slope * minX + regression.intercept },
        { x: maxX, y: regression.slope * maxX + regression.intercept }
    ];

    if (window.regressionChart) {
        window.regressionChart.destroy();
    }

    window.regressionChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Data Points',
                data: xValues.map((x, i) => ({ x: x, y: yValues[i] })),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }, {
                label: 'Regression Line',
                data: regressionPoints,
                type: 'line',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: xLabel
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: yLabel
                    }
                }
            }
        }
    });
}

// Function to update statistics
function updateStatistics(regression) {
    const statisticsContent = document.getElementById('statisticsContent');
    statisticsContent.innerHTML = `
        <p><strong>Equation:</strong> y = ${regression.slope.toFixed(4)}x + ${regression.intercept.toFixed(4)}</p>
    `;
}

// Function to handle file upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

            // Clear existing data
            const tbody = document.getElementById('dataBody');
            tbody.innerHTML = '';

            // Add data from Excel
            jsonData.forEach(row => {
                if (row.length >= 2 && !isNaN(row[0]) && !isNaN(row[1])) {
                    const newRow = document.createElement('tr');
                    newRow.innerHTML = `
                        <td><input type="number" step="0.01" class="x-input" value="${row[0]}"></td>
                        <td><input type="number" step="0.01" class="y-input" value="${row[1]}"></td>
                        <td>
                            <button class="btn btn-remove" onclick="removeRow(this)">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    `;
                    tbody.appendChild(newRow);
                }
            });

            // If no rows were added, add one empty row
            if (tbody.children.length === 0) {
                addRow();
            }

        } catch (error) {
            console.error('Error reading Excel file:', error);
            alert('Error reading Excel file. Please make sure it contains valid data.');
        }
    };

    reader.readAsArrayBuffer(file);
}

// Add event listener for file input
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('excelFileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }
});

// Function to perform analysis
function performAnalysis() {
    if (!window.excelData) {
        alert('Please upload an Excel file first.');
        return;
    }

    const xColumn = document.getElementById('xColumn').value;
    const yColumn = document.getElementById('yColumn').value;

    if (xColumn === yColumn) {
        alert('Please select different columns for X and Y variables.');
        return;
    }

    const xValues = window.excelData.map(row => parseFloat(row[xColumn]));
    const yValues = window.excelData.map(row => parseFloat(row[yColumn]));

    // Check for invalid data
    if (xValues.some(isNaN) || yValues.some(isNaN)) {
        alert('Invalid data found. Please ensure all values are numbers.');
        return;
    }

    const regression = calculateRegression(xValues, yValues);
    updateChart(xValues, yValues, xColumn, yColumn, regression);
    updateStatistics(regression);
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('excelFileInput').addEventListener('change', handleFileUpload);
    document.getElementById('analyzeButton').addEventListener('click', performAnalysis);
});

// ===== 1. Mathematical Analysis Functions =====
function evaluateExpression(expression, x) {
    try {
        if (!expression || typeof x !== 'number') {
            return NaN;
        }

        let expr = expression.toLowerCase().trim()
            .replace(/\^/g, '**')
            .replace(/log\(/g, 'Math.log10(')
            .replace(/ln\(/g, 'Math.log(')
            .replace(/sin\(/g, 'Math.sin(')
            .replace(/cos\(/g, 'Math.cos(')
            .replace(/tan\(/g, 'Math.tan(')
            .replace(/sqrt\(/g, 'Math.sqrt(')
            .replace(/pi/g, 'Math.PI')
            .replace(/e(?![a-z])/g, 'Math.E');

        if (expr.includes('window') || expr.includes('document') || 
            expr.includes('eval') || expr.includes('function')) {
            return NaN;
        }

        return Function('x', `
            'use strict';
            try {
                return ${expr};
            } catch(e) {
                return NaN;
            }
        `)(x);
    } catch (error) {
        return NaN;
    }
}

function analyzeQuadraticFunction(expression) {
    try {
        let expr = expression.toLowerCase().trim()
            .replace(/\s+/g, '')
            .replace(/\*\*/g, '^')
            .replace(/\*/g, '');

        const quadraticRegex = /^(-?\d*\.?\d*)?x\^2([-+]\d*\.?\d*x)?([-+]\d*\.?\d*)?$/;
        
        if (!quadraticRegex.test(expr)) {
            return null;
        }

        let a = 1, b = 0, c = 0;

        if (expr.startsWith('-x^2')) {
            a = -1;
        } else {
            const aMatch = expr.match(/^(-?\d*\.?\d*)x\^2/);
            if (aMatch && aMatch[1] && aMatch[1] !== '-') {
                a = parseFloat(aMatch[1]);
            }
        }

        const bMatch = expr.match(/[-+]\d*\.?\d*x(?!\^)/);
        if (bMatch) {
            b = parseFloat(bMatch[0].replace('x', '')) || (bMatch[0].startsWith('-') ? -1 : 1);
        }

        const cMatch = expr.match(/[-+]\d*\.?\d*$/);
        if (cMatch) {
            c = parseFloat(cMatch[0]);
        }

        const discriminant = Math.pow(b, 2) - 4 * a * c;
        let solutions = [];
        
        if (discriminant > 0) {
            solutions.push((-b + Math.sqrt(discriminant)) / (2 * a));
            solutions.push((-b - Math.sqrt(discriminant)) / (2 * a));
        } else if (discriminant === 0) {
            solutions.push(-b / (2 * a));
        }

        return {
            coefficients: { a, b, c },
            solutions: solutions,
            discriminant: discriminant,
            vertex: {
                x: -b / (2 * a),
                y: -discriminant / (4 * a)
            }
        };
    } catch (error) {
        return null;
    }
}

// ===== 2. Chart Configuration =====
const chartConfig = {
    type: 'scatter',
    options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 800,
            easing: 'easeOutQuart'
        },
        scales: {
            x: {
                type: 'linear',
                position: 'center',
                grid: {
                    color: '#ecf0f1',
                    lineWidth: 1
                }
            },
            y: {
                type: 'linear',
                position: 'center',
                grid: {
                    color: '#ecf0f1',
                    lineWidth: 1
                }
            }
        },
        plugins: {
            legend: {
                display: true
            },
            tooltip: {
                enabled: true
            }
        }
    }
};

// ===== 3. Plot Function =====
function plotFunction() {
    const functionValue = document.getElementById('functionInput').value.trim();
    if (!functionValue) {
        alert('Please enter a function');
        return;
    }
    
    currentFunction = functionValue;
    const showDerivative = document.getElementById('showDerivative').checked;
    plotWithDerivative(functionValue, showDerivative);
}

// ===== 4. Derivative Functions =====
let currentFunction = '';

function numericalDerivative(f, x, h = 0.0001) {
    return (evaluateExpression(f, x + h) - evaluateExpression(f, x - h)) / (2 * h);
}

function plotWithDerivative(functionValue, showDerivative = false) {
    try {
        const xMin = parseFloat(document.getElementById('xMin').value);
        const xMax = parseFloat(document.getElementById('xMax').value);
        const yMin = parseFloat(document.getElementById('yMin').value);
        const yMax = parseFloat(document.getElementById('yMax').value);

        const points = [];
        const derivativePoints = [];
        const numPoints = 1000;

        for (let i = 0; i < numPoints; i++) {
            const x = xMin + (xMax - xMin) * (i / (numPoints - 1));
            const y = evaluateExpression(functionValue, x);
            
            if (!isNaN(y) && isFinite(y)) {
                points.push({ x, y });
                
                if (showDerivative) {
                    const dy = numericalDerivative(functionValue, x);
                    if (!isNaN(dy) && isFinite(dy)) {
                        derivativePoints.push({ x, y: dy });
                    }
                }
            }
        }

        const datasets = [{
            data: points,
            showLine: true,
            borderColor: '#3498db',
            borderWidth: 2,
            pointRadius: 0,
            fill: false,
            label: `f(x) = ${functionValue}`
        }];

        if (showDerivative) {
            datasets.push({
                data: derivativePoints,
                showLine: true,
                borderColor: '#e74c3c',
                borderWidth: 2,
                pointRadius: 0,
                fill: false,
                label: `f'(x)`,
                borderDash: [5, 5]
            });
        }

        const ctx = document.getElementById('functionChart').getContext('2d');
        if (window.functionChart instanceof Chart) {
            window.functionChart.destroy();
        }

        const config = {
            ...chartConfig,
            data: { datasets }
        };

        config.options.scales.x.min = xMin;
        config.options.scales.x.max = xMax;
        config.options.scales.y.min = yMin;
        config.options.scales.y.max = yMax;

        window.functionChart = new Chart(ctx, config);

        const analysis = analyzeQuadraticFunction(functionValue);
        updateQuadraticAnalysis(analysis, showDerivative);

    } catch (error) {
        console.error('Detailed error:', error);
        alert('An error occurred while plotting the function.');
    }
}

function toggleDerivative() {
    if (currentFunction) {
        const showDerivative = document.getElementById('showDerivative').checked;
        plotWithDerivative(currentFunction, showDerivative);
    }
}

// ===== 5. Update Analysis =====
function updateQuadraticAnalysis(analysis, showDerivative = false) {
    const solutionsDiv = document.getElementById('quadraticSolutions');
    if (!solutionsDiv) return;

    let solutionsText = solutionsDiv.querySelector('.solutions-text');
    if (!solutionsText) {
        solutionsText = document.createElement('pre');
        solutionsText.className = 'solutions-text';
        solutionsDiv.appendChild(solutionsText);
    }

    let message = `f(x) = ${currentFunction}\n`;
    
    if (showDerivative) {
        const derivative = getSymbolicDerivative(currentFunction);
        message += `f'(x) = ${derivative}\n\n`;
    }
    
    if (analysis) {
        // ... rest of the quadratic analysis code
    }
    
    solutionsText.textContent = message;
    solutionsDiv.style.display = 'block';
}

// ===== 6. Initialization =====
document.addEventListener('DOMContentLoaded', () => {
    const functionInput = document.getElementById('functionInput');
    if (functionInput) {
        functionInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                plotFunction();
            }
        });
    }
});

// ===== 6. Sequence Analysis Functions =====
function analyzeSequence(expression) {
    try {
        const terms = [];
        const n = 10; // Number of terms to calculate
        
        for (let i = 0; i <= n; i++) {
            const value = evaluateExpression(expression, i);
            if (!isNaN(value) && isFinite(value)) {
                terms.push({ x: i, y: value });
            }
        }
        
        return terms;
    } catch (error) {
        console.error('Error analyzing sequence:', error);
        return null;
    }
}

function plotSequence() {
    try {
        const functionValue = document.getElementById('functionInput').value.trim();
        if (!functionValue) {
            alert('Please enter a sequence formula');
            return;
        }

        const terms = analyzeSequence(functionValue);
        if (!terms || terms.length === 0) {
            alert('Invalid sequence formula');
            return;
        }

        const ctx = document.getElementById('functionChart').getContext('2d');
        if (window.functionChart instanceof Chart) {
            window.functionChart.destroy();
        }

        window.functionChart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Sequence Points',
                    data: terms,
                    showLine: true,
                    borderColor: '#3498db',
                    backgroundColor: '#3498db',
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'center',
                        title: {
                            display: true,
                            text: 'n',
                            font: {
                                size: 16,
                                weight: 'bold'
                            }
                        }
                    },
                    y: {
                        type: 'linear',
                        position: 'center',
                        title: {
                            display: true,
                            text: 'u(n)',
                            font: {
                                size: 16,
                                weight: 'bold'
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `n = ${context.parsed.x}, u(n) = ${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                }
            }
        });

    } catch (error) {
        console.error('Error plotting sequence:', error);
        alert('An error occurred while plotting the sequence');
    }
}

// Function to process manual data
function processData() {
    try {
        // Get X and Y values from the table
        const xInputs = document.querySelectorAll('.x-input');
        const yInputs = document.querySelectorAll('.y-input');
        
        const xValues = [];
        const yValues = [];

        // Check if there are at least 2 points
        if (xInputs.length < 2) {
            alert('Please enter at least 2 points');
            return;
        }

        // Collect valid data
        for (let i = 0; i < xInputs.length; i++) {
            const x = parseFloat(xInputs[i].value);
            const y = parseFloat(yInputs[i].value);
            
            if (!isNaN(x) && !isNaN(y)) {
                xValues.push(x);
                yValues.push(y);
            }
        }

        // Check if there are enough valid data points
        if (xValues.length < 2) {
            alert('Please enter at least 2 valid points');
            return;
        }

        // Calculate regression
        const regression = calculateRegression(xValues, yValues);
        
        // Update chart
        updateChart(xValues, yValues, 'X', 'Y', regression);
        
        // Update statistics
        updateStatistics(regression);

        // Show results section
        document.querySelector('.results-section').classList.add('visible');
        
        // Show download button
        document.getElementById('downloadChartBtn').style.display = 'inline-block';

    } catch (error) {
        console.error('Error processing data:', error);
        alert('An error occurred while processing the data');
    }
}

// Function to add a row to the table
function addRow() {
    const tbody = document.getElementById('dataBody');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td><input type="number" step="0.01" class="x-input"></td>
        <td><input type="number" step="0.01" class="y-input"></td>
        <td>
            <button class="btn btn-remove" onclick="removeRow(this)">
                <i class="fas fa-trash"></i>
            </button>
        </td>
    `;
    tbody.appendChild(newRow);
}

// Function to remove a row from the table
function removeRow(button) {
    const tbody = document.getElementById('dataBody');
    if (tbody.children.length > 1) {
        button.closest('tr').remove();
    }
}

// Function to calculate symbolic derivative
function getSymbolicDerivative(expression) {
    let expr = expression.toLowerCase().trim();
    
    // Trigonometric functions
    if (expr === 'sin(x)') return 'cos(x)';
    if (expr === 'cos(x)') return '-sin(x)';
    if (expr === 'tan(x)') return 'sec²(x)';
    
    // Powers
    const powerMatch = expr.match(/x\^(\d+)/);
    if (powerMatch) {
        const power = parseInt(powerMatch[1]);
        if (power === 2) return '2x';
        if (power === 1) return '1';
        if (power === 0) return '0';
        return `${power}x^${power-1}`;
    }
    
    // Exponential and logarithmic functions
    if (expr === 'e^x') return 'e^x';
    if (expr === 'ln(x)') return '1/x';
    if (expr === 'log(x)') return '1/(x*ln(10))';
    
    // Simple cases
    if (expr === 'x') return '1';
    if (!isNaN(parseFloat(expr))) return '0';
    
    // For more complex expressions
    return "Numerical derivative used";
}
