// ===== 1. Variables globales =====
let currentFunction = '';

// ===== 2. Fonctions d'analyse mathématique =====
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

// ===== 3. Fonctions de tracé =====
function plotFunction() {
    const functionValue = document.getElementById('functionInput').value.trim();
    if (!functionValue) {
        alert('Veuillez entrer une fonction');
        return;
    }
    
    currentFunction = functionValue;
    const showDerivative = document.getElementById('showDerivative').checked;
    plotWithDerivative(functionValue, showDerivative);
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
            type: 'scatter',
            data: { datasets },
            options: {
                responsive: true,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'center',
                        min: xMin,
                        max: xMax
                    },
                    y: {
                        type: 'linear',
                        position: 'center',
                        min: yMin,
                        max: yMax
                    }
                }
            }
        };

        window.functionChart = new Chart(ctx, config);

        // Mettre à jour l'analyse quadratique
        const analysis = analyzeQuadraticFunction(functionValue);
        updateQuadraticAnalysis(analysis, showDerivative);

    } catch (error) {
        console.error('Erreur détaillée:', error);
        alert('Une erreur est survenue lors du tracé de la fonction.');
    }
}

function toggleDerivative() {
    if (currentFunction) {
        const showDerivative = document.getElementById('showDerivative').checked;
        plotWithDerivative(currentFunction, showDerivative);
    }
}

// ===== 4. Fonction d'analyse quadratique =====
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
        message += `Δ = ${analysis.discriminant.toFixed(2)}\n`;
        
        if (analysis.solutions.length === 2) {
            message += `Cette fonction a deux solutions : x₁ = ${analysis.solutions[0].toFixed(2)} et x₂ = ${analysis.solutions[1].toFixed(2)}\n`;
        } else if (analysis.solutions.length === 1) {
            message += `Cette fonction a une solution double : x = ${analysis.solutions[0].toFixed(2)}\n`;
        } else {
            message += `Cette fonction n'a pas de solutions réelles\n`;
        }

        const { a, b } = analysis.coefficients;
        const h = -b/(2*a);
        
        message += `\nLa parabole est orientée vers ${a > 0 ? 'le haut' : 'le bas'}\n`;
        message += `La fonction est ${a > 0 ? 'décroissante' : 'croissante'} sur ]-∞, ${h.toFixed(2)}] `;
        message += `puis ${a > 0 ? 'croissante' : 'décroissante'} sur [${h.toFixed(2)}, +∞[`;
    }
    
    solutionsText.textContent = message;
    solutionsDiv.style.display = 'block';
}

// ===== 5. Initialisation =====
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

// Fonction pour traiter les données manuelles
function processData() {
    try {
        // Récupérer les valeurs X et Y du tableau
        const xInputs = document.querySelectorAll('.x-input');
        const yInputs = document.querySelectorAll('.y-input');
        
        const xValues = [];
        const yValues = [];

        // Vérifier qu'il y a au moins 2 points
        if (xInputs.length < 2) {
            alert('Veuillez entrer au moins 2 points');
            return;
        }

        // Collecter les données valides
        for (let i = 0; i < xInputs.length; i++) {
            const x = parseFloat(xInputs[i].value);
            const y = parseFloat(yInputs[i].value);
            
            if (!isNaN(x) && !isNaN(y)) {
                xValues.push(x);
                yValues.push(y);
            }
        }

        // Vérifier qu'il y a assez de données valides
        if (xValues.length < 2) {
            alert('Veuillez entrer au moins 2 points valides');
            return;
        }

        // Calculer la régression
        const regression = calculateRegression(xValues, yValues);
        
        // Mettre à jour le graphique
        updateChart(xValues, yValues, 'X', 'Y', regression);
        
        // Mettre à jour les statistiques
        updateStatistics(regression);

        // Afficher la section des résultats
        document.querySelector('.results-section').classList.add('visible');
        
        // Afficher le bouton de téléchargement
        document.getElementById('downloadChartBtn').style.display = 'inline-block';

    } catch (error) {
        console.error('Erreur lors du traitement des données:', error);
        alert('Une erreur est survenue lors du traitement des données');
    }
}

// Fonction pour ajouter une ligne au tableau
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

// Fonction pour supprimer une ligne du tableau
function removeRow(button) {
    const tbody = document.getElementById('dataBody');
    if (tbody.children.length > 1) {
        button.closest('tr').remove();
    }
}

// Fonction pour gérer le téléchargement de fichier
function handleFileUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

            // Effacer les données existantes
            const tbody = document.getElementById('dataBody');
            tbody.innerHTML = '';

            // Ajouter les données depuis Excel
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

            // Si aucune ligne n'a été ajoutée, ajouter une ligne vide
            if (tbody.children.length === 0) {
                addRow();
            }

        } catch (error) {
            console.error('Erreur de lecture du fichier Excel:', error);
            alert('Erreur de lecture du fichier Excel. Assurez-vous qu\'il contient des données valides.');
        }
    };

    reader.readAsArrayBuffer(file);
}

// Ajouter l'écouteur d'événement pour l'input de fichier
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('excelFileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }
});

// Fonction pour calculer la régression linéaire
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
    
    // Calculer R²
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

// Fonction pour mettre à jour le graphique
function updateChart(xValues, yValues, xLabel, yLabel, regression) {
    const ctx = document.getElementById('scatterChart').getContext('2d');
    
    // Calculer les points de la droite de régression
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
                label: 'Points de données',
                data: xValues.map((x, i) => ({ x: x, y: yValues[i] })),
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }, {
                label: 'Droite de régression',
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

// Fonction pour mettre à jour les statistiques
function updateStatistics(regression) {
    const statisticsContent = document.getElementById('statisticsContent');
    statisticsContent.innerHTML = `
        <p><strong>Équation:</strong> y = ${regression.slope.toFixed(4)}x + ${regression.intercept.toFixed(4)}</p>
    `;
}

// Fonction pour calculer la dérivée numérique
function numericalDerivative(f, x, h = 0.0001) {
    return (evaluateExpression(f, x + h) - evaluateExpression(f, x - h)) / (2 * h);
}

// Fonction pour calculer la dérivée symbolique
function getSymbolicDerivative(expression) {
    let expr = expression.toLowerCase().trim();
    
    // Fonctions trigonométriques
    if (expr === 'sin(x)') return 'cos(x)';
    if (expr === 'cos(x)') return '-sin(x)';
    if (expr === 'tan(x)') return 'sec²(x)';
    
    // Puissances
    const powerMatch = expr.match(/x\^(\d+)/);
    if (powerMatch) {
        const power = parseInt(powerMatch[1]);
        if (power === 2) return '2x';
        if (power === 1) return '1';
        if (power === 0) return '0';
        return `${power}x^${power-1}`;
    }
    
    // Fonctions exponentielles et logarithmiques
    if (expr === 'e^x') return 'e^x';
    if (expr === 'ln(x)') return '1/x';
    if (expr === 'log(x)') return '1/(x*ln(10))';
    
    // Cas simples
    if (expr === 'x') return '1';
    if (!isNaN(parseFloat(expr))) return '0';
    
    // Pour les expressions plus complexes
    return "Dérivée numérique utilisée";
}

