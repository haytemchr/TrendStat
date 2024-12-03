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
    
    // Calculate R-squared
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
    const ctx = document.getElementById('regressionChart').getContext('2d');
    
    // Calculate regression line points
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const regressionPoints = [
        { x: minX, y: regression.slope * minX + regression.intercept },
        { x: maxX, y: regression.slope * maxX + regression.intercept }
    ];

    if (regressionChart) {
        regressionChart.destroy();
    }

    regressionChart = new Chart(ctx, {
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

// Function to update statistics display
function updateStatistics(regression) {
    const statisticsContent = document.getElementById('statisticsContent');
    statisticsContent.innerHTML = `
        <p><strong>Slope (m):</strong> ${regression.slope.toFixed(4)}</p>
        <p><strong>Y-intercept (b):</strong> ${regression.intercept.toFixed(4)}</p>
        <p><strong>R-squared:</strong> ${regression.rSquared.toFixed(4)}</p>
        <p><strong>Equation:</strong> y = ${regression.slope.toFixed(4)}x + ${regression.intercept.toFixed(4)}</p>
    `;
}

// Function to handle file upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);

        // Get column names
        const columns = Object.keys(jsonData[0]);
        
        // Update column select options
        const xColumn = document.getElementById('xColumn');
        const yColumn = document.getElementById('yColumn');
        
        xColumn.innerHTML = '';
        yColumn.innerHTML = '';
        
        columns.forEach(column => {
            xColumn.add(new Option(column, column));
            yColumn.add(new Option(column, column));
        });

        // Set default selections
        if (columns.length >= 2) {
            xColumn.value = columns[0];
            yColumn.value = columns[1];
        }

        // Store data for later use
        window.excelData = jsonData;
    };

    reader.readAsArrayBuffer(file);
}

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
