// Excel file import function
function handleExcelImport(event) {
    const file = event.target.files[0];
    if (!file) {
        console.log('Aucun fichier sélectionné');
        return;
    }

    console.log('Fichier sélectionné:', file.name);

    // Vérifier l'extension du fichier
    if (!file.name.endsWith('.xlsx')) {
        alert('Veuillez sélectionner un fichier Excel (.xlsx)');
        event.target.value = '';
        return;
    }

    const reader = new FileReader();
    
    reader.onload = async function(e) {
        try {
            console.log('Lecture du fichier commencée...');
            const data = e.target.result;
            
            // Lecture du workbook
            console.log('Tentative de lecture du workbook...');
            const workbook = XLSX.read(data, { type: 'binary' });
            console.log('Workbook lu avec succès');
            
            // Obtenir la première feuille
            const firstSheetName = workbook.SheetNames[0];
            console.log('Nom de la première feuille:', firstSheetName);
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Convertir en JSON avec des options plus souples
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
                raw: false, // Pour obtenir les valeurs sous forme de chaînes
                blankrows: false,
                defval: null
            });

            console.log('Données brutes:', jsonData);

            // Filtrer et valider les données
            const validData = jsonData.filter(row => {
                if (!row || !Array.isArray(row) || row.length < 2) {
                    console.log('Ligne invalide:', row);
                    return false;
                }
                
                // Convertir les chaînes en nombres en gérant les virgules
                const x = Number(String(row[0]).replace(',', '.'));
                const y = Number(String(row[1]).replace(',', '.'));
                
                const isValid = !isNaN(x) && !isNaN(y);
                if (!isValid) {
                    console.log('Valeurs non numériques:', row[0], row[1]);
                }
                return isValid;
            }).map(row => ({
                x: Number(String(row[0]).replace(',', '.')),
                y: Number(String(row[1]).replace(',', '.'))
            }));

            console.log('Données valides:', validData);

            if (validData.length < 2) {
                alert('Le fichier doit contenir au moins deux lignes de données numériques valides.');
                event.target.value = '';
                return;
            }

            // Clear existing table
            const tableBody = document.getElementById('dataBody');
            if (!tableBody) {
                console.error('Element dataBody non trouvé');
                return;
            }
            
            tableBody.innerHTML = '';
            console.log('Table vidée');

            // Populate table with data
            validData.forEach((row, index) => {
                const newRow = tableBody.insertRow();
                const xCell = newRow.insertCell(0);
                const yCell = newRow.insertCell(1);
                const actionCell = newRow.insertCell(2);

                xCell.innerHTML = `<input type="number" step="0.01" class="x-input" value="${row.x}">`;
                yCell.innerHTML = `<input type="number" step="0.01" class="y-input" value="${row.y}">`;
                actionCell.innerHTML = '<button class="btn btn-remove" onclick="removeRow(this)"><i class="fas fa-trash"></i></button>';
                
                console.log(`Ligne ${index + 1} ajoutée:`, row.x, row.y);
            });

            console.log('Toutes les lignes ont été ajoutées');

            // Process the data and update chart
            processData();
            console.log('Graphique mis à jour');
            
            // Reset the file input
            event.target.value = '';
            
        } catch (error) {
            console.error('Erreur détaillée:', error);
            console.error('Stack trace:', error.stack);
            alert('Erreur lors de la lecture du fichier Excel. Assurez-vous que le format est correct et que le fichier n\'est pas corrompu.');
            event.target.value = '';
        }
    };

    reader.onerror = function(error) {
        console.error('Erreur de lecture:', error);
        alert('Erreur lors de la lecture du fichier.');
        event.target.value = '';
    };

    // Changer la méthode de lecture
    reader.readAsBinaryString(file);
}

// Animation utility function
function animateElement(element, animationClass, duration = 300) {
    element.classList.add(animationClass);
    setTimeout(() => {
        element.classList.remove(animationClass);
    }, duration);
}

// Enhanced row addition with animation
function addRow() {
    const tableBody = document.getElementById('dataBody');
    const newRow = tableBody.insertRow();
    
    const xCell = newRow.insertCell(0);
    const yCell = newRow.insertCell(1);
    const actionCell = newRow.insertCell(2);
    
    xCell.innerHTML = '<input type="number" step="0.01" class="x-input">';
    yCell.innerHTML = '<input type="number" step="0.01" class="y-input">';
    actionCell.innerHTML = '<button class="btn btn-remove" onclick="removeRow(this)"><i class="fas fa-trash"></i></button>';
    
    // Animate the new row
    animateElement(newRow, 'row-added');
}

// Row removal function
function removeRow(button) {
    const row = button.closest('tr');
    
    // Animate row removal
    row.classList.add('row-removed');
    
    setTimeout(() => {
        row.remove();
        updateChart();
    }, 300);
}

// Improved data processing with validation
function processData() {
    const xInputs = document.querySelectorAll('.x-input');
    const yInputs = document.querySelectorAll('.y-input');
    
    const data = [];
    let hasError = false;

    for (let i = 0; i < xInputs.length; i++) {
        const x = parseFloat(xInputs[i].value);
        const y = parseFloat(yInputs[i].value);
        
        if (!isNaN(x) && !isNaN(y)) {
            data.push({ x, y });
        } else {
            // Highlight invalid inputs
            if (isNaN(x)) xInputs[i].classList.add('input-error');
            if (isNaN(y)) yInputs[i].classList.add('input-error');
            hasError = true;
        }
    }

    if (hasError) {
        alert('Veuillez saisir des valeurs numériques valides pour toutes les lignes.');
        return;
    }

    if (data.length > 1) {
        createScatterPlot(data);
    } else {
        alert('Veuillez saisir au moins deux points de données valides.');
    }
}

// Enhanced chart creation with more details
function calculateLinearRegression(data) {
    const n = data.length;
    
    // Calculate means
    const meanX = data.reduce((sum, point) => sum + point.x, 0) / n;
    const meanY = data.reduce((sum, point) => sum + point.y, 0) / n;
    
    // Calculate regression line
    let sumXY = 0;
    let sumXSquared = 0;
    
    data.forEach(point => {
        sumXY += (point.x - meanX) * (point.y - meanY);
        sumXSquared += Math.pow(point.x - meanX, 2);
    });
    
    // Slope and intercept
    const a = sumXY / sumXSquared;
    const b = meanY - a * meanX;
    
    // R-squared calculation
    let ssTotal = 0;
    let ssResidual = 0;
    
    data.forEach(point => {
        const predictedY = a * point.x + b;
        ssTotal += Math.pow(point.y - meanY, 2);
        ssResidual += Math.pow(point.y - predictedY, 2);
    });
    
    const rSquared = 1 - (ssResidual / ssTotal);
    
    return { a, b, rSquared };
}

// Create scatter plot with regression line
function createScatterPlot(data) {
    const ctx = document.getElementById('scatterChart').getContext('2d');
    
    // Calculate regression details
    const { a, b, rSquared } = calculateLinearRegression(data);
    
    // Prepare regression line points
    const minX = Math.min(...data.map(point => point.x));
    const maxX = Math.max(...data.map(point => point.x));
    
    const regressionLine = [
        { x: minX, y: a * minX + b },
        { x: maxX, y: a * maxX + b }
    ];
    
    // Update regression equation (sans R²)
    const equationText = `Y = ${a.toFixed(3)}X + ${b.toFixed(3)}`;
    const equationElement = document.getElementById('regressionEquation');
    if (equationElement) {
        equationElement.textContent = equationText;
    }
    
    // Destroy existing chart if it exists
    if (window.chart) {
        window.chart.destroy();
    }
    
    // Create new chart
    window.chart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                {
                    label: 'Données',
                    data: data,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    pointRadius: 6,
                    pointHoverRadius: 8
                },
                {
                    label: 'Ligne de Régression',
                    data: regressionLine,
                    type: 'line',
                    borderColor: 'rgba(255, 99, 132, 0.8)',
                    backgroundColor: 'rgba(255, 99, 132, 0.8)',
                    fill: false,
                    pointRadius: 0,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Régression Linéaire',
                    font: {
                        size: 16,
                        weight: 'bold'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `X: ${context.parsed.x.toFixed(3)}, Y: ${context.parsed.y.toFixed(3)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'X',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Y',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                }
            }
        }
    });
    
    // Show download button
    const downloadBtn = document.getElementById('downloadChartBtn');
    if (downloadBtn) {
        downloadBtn.style.display = 'inline-flex';
    }
}

// Chart download function
function downloadChart() {
    const canvas = document.getElementById('scatterChart');
    const link = document.createElement('a');
    link.download = 'regression_chart.png';
    link.href = canvas.toDataURL();
    link.click();
}

// Reset function
function resetAll() {
    const tableBody = document.getElementById('dataBody');
    tableBody.innerHTML = `
        <tr>
            <td><input type="number" step="0.01" class="x-input"></td>
            <td><input type="number" step="0.01" class="y-input"></td>
            <td></td>
        </tr>`;
    
    // Reset chart
    if (window.chart) {
        window.chart.destroy();
        window.chart = null;
    }
    
    // Clear regression details
    document.getElementById('regressionEquation').textContent = '';
    
    // Hide download button
    document.getElementById('downloadChartBtn').style.display = 'none';
}

// Language switching function
let currentLanguage = 'fr';

function switchLanguage() {
    // Toggle between 'fr' and 'en'
    currentLanguage = currentLanguage === 'fr' ? 'en' : 'fr';
    
    // Update all translatable elements
    document.querySelectorAll('.translate').forEach(element => {
        const translation = element.getAttribute(`data-${currentLanguage}`);
        if (translation) {
            element.textContent = translation;
        }
    });

    // Update language button text
    const langText = document.querySelector('.lang-text');
    if (langText) {
        langText.textContent = langText.getAttribute(`data-${currentLanguage}`);
    }
}

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    // Add Excel file input listener
    const excelInput = document.getElementById('excelFileInput');
    if (excelInput) {
        excelInput.addEventListener('change', handleExcelImport);
    } else {
        console.error('Excel file input element not found');
    }
    
    // Add initial empty row
    const tableBody = document.getElementById('dataBody');
    if (tableBody) {
        const newRow = tableBody.insertRow();
        const xCell = newRow.insertCell(0);
        const yCell = newRow.insertCell(1);
        const actionCell = newRow.insertCell(2);
        
        xCell.innerHTML = '<input type="number" step="0.01" class="x-input">';
        yCell.innerHTML = '<input type="number" step="0.01" class="y-input">';
        actionCell.innerHTML = '<button class="btn btn-remove" onclick="removeRow(this)"><i class="fas fa-trash"></i></button>';
    }
});
