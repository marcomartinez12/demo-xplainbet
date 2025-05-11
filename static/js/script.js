// Constantes para el modelo de Poisson
const LAMBDA_FACTORS = {
    goalsScored: 0.8,
    goalsConceded: -0.6,
    possession: 0.3,
    shotsOnTarget: 0.5,
    passingAccuracy: 0.4,
    fouls: -0.2,
    corners: 0.2,
    yellowCards: -0.15,
    redCards: -0.4
};

// Variables globales
let chart = null;
let animationSpeed = 600; // Velocidad de las animaciones en ms
let calculationDelay = 800; // Retraso entre cálculos para la animación
let currentResults = null;
let typingSpeed = 20; // Velocidad de tipeo en ms por caracter

// Evento al cargar el DOM
document.addEventListener('DOMContentLoaded', function() {
    // Referencia al formulario
    const form = document.getElementById('prediction-form');
    const demoButton = document.getElementById('demo-btn');
    const explanationBtn = document.getElementById('explanation-btn');
    const clearButton = document.getElementById('clear-btn');

    // Validación de campos numéricos
    document.querySelectorAll('.stats-input').forEach(input => {
        input.addEventListener('input', function() {
            validateInput(input);
        });
    });

    // Cargar datos de demostración
    demoButton.addEventListener('click', loadDemoData);

    // Limpiar formulario
    clearButton.addEventListener('click', clearFormData);

    // Mostrar explicación de IA
    explanationBtn.addEventListener('click', showAIExplanation);

    // Envío del formulario
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validar todos los campos antes de proceder
        let isValid = true;
        document.querySelectorAll('.stats-input').forEach(input => {
            if (!validateInput(input)) {
                isValid = false;
            }
        });
        
        if (isValid) {
            calculatePrediction();
        }
    });
});

// Función para validar los campos de entrada
function validateInput(input) {
    const value = input.value.trim();
    
    // Validar que sea un número
    if (isNaN(value) || value === '') {
        input.classList.add('is-invalid');
        return false;
    }
    
    // Para porcentajes, validar que estén entre 0 y 100
    if ((input.id.includes('possession') || input.id.includes('passingAccuracy')) && 
        (parseFloat(value) < 0 || parseFloat(value) > 100)) {
        input.classList.add('is-invalid');
        return false;
    }
    
    // Para el resto de campos, validar que sean mayores o iguales a 0
    if (parseFloat(value) < 0) {
        input.classList.add('is-invalid');
        return false;
    }
    
    input.classList.remove('is-invalid');
    return true;
}

// Función para cargar datos de demostración
function loadDemoData() {
    // Datos del Barcelona
    document.getElementById('team1').value = 'FC Barcelona';
    document.getElementById('goalsScored1').value = '2.6';
    document.getElementById('goalsConceded1').value = '0.9';
    document.getElementById('possession1').value = '65.4';
    document.getElementById('shotsOnTarget1').value = '7.2';
    document.getElementById('passingAccuracy1').value = '89.3';
    document.getElementById('fouls1').value = '10.8';
    document.getElementById('corners1').value = '6.5';
    document.getElementById('yellowCards1').value = '1.8';
    document.getElementById('redCards1').value = '0.1';
    
    // Datos del Real Madrid
    document.getElementById('team2').value = 'Real Madrid';
    document.getElementById('goalsScored2').value = '2.4';
    document.getElementById('goalsConceded2').value = '1.1';
    document.getElementById('possession2').value = '58.7';
    document.getElementById('shotsOnTarget2').value = '6.8';
    document.getElementById('passingAccuracy2').value = '86.5';
    document.getElementById('fouls2').value = '12.3';
    document.getElementById('corners2').value = '5.9';
    document.getElementById('yellowCards2').value = '2.1';
    document.getElementById('redCards2').value = '0.2';
}

// Función para limpiar datos del formulario
function clearFormData() {
    // Limpiar campos del equipo local
    document.getElementById('team1').value = '';
    document.getElementById('goalsScored1').value = '';
    document.getElementById('goalsConceded1').value = '';
    document.getElementById('possession1').value = '';
    document.getElementById('shotsOnTarget1').value = '';
    document.getElementById('passingAccuracy1').value = '';
    document.getElementById('fouls1').value = '';
    document.getElementById('corners1').value = '';
    document.getElementById('yellowCards1').value = '';
    document.getElementById('redCards1').value = '';
    
    // Limpiar campos del equipo visitante
    document.getElementById('team2').value = '';
    document.getElementById('goalsScored2').value = '';
    document.getElementById('goalsConceded2').value = '';
    document.getElementById('possession2').value = '';
    document.getElementById('shotsOnTarget2').value = '';
    document.getElementById('passingAccuracy2').value = '';
    document.getElementById('fouls2').value = '';
    document.getElementById('corners2').value = '';
    document.getElementById('yellowCards2').value = '';
    document.getElementById('redCards2').value = '';
    
    // Eliminar clases de invalidación si existen
    document.querySelectorAll('.stats-input').forEach(input => {
        input.classList.remove('is-invalid');
    });
    
    // Ocultar sección de resultados si está visible
    document.getElementById('results-section').style.display = 'none';
    
    // Eliminar gráfico si existe
    if (chart) {
        chart.destroy();
        chart = null;
    }
    
    // Reiniciar resultados actuales
    currentResults = null;
    
    // Opcional: mostrar mensaje en la terminal si está visible
    const terminal = document.getElementById('terminal-content');
    if (terminal && document.getElementById('results-section').style.display !== 'none') {
        terminal.innerHTML = '<div class="line">$ Todos los campos han sido limpiados.</div>';
    }
}

// Función para calcular la distribución de Poisson
function poissonProbability(lambda, k) {
    // P(X = k) = (e^-lambda * lambda^k) / k!
    return Math.exp(-lambda) * Math.pow(lambda, k) / factorial(k);
}

// Función factorial para cálculos de Poisson
function factorial(n) {
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

// Función para calcular la predicción usando Poisson
async function calculatePrediction() {
    // Mostrar sección de resultados
    document.getElementById('results-section').style.display = 'block';
    
    // Scroll a la sección de resultados
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
    
    // Limpiar terminal
    const terminal = document.getElementById('terminal-content');
    terminal.innerHTML = '';
    
    // Ocultar resultados anteriores si existen
    const predictionResults = document.getElementById('prediction-results');
    predictionResults.classList.remove('show');
    
    // Recolectar datos del formulario
    const team1 = document.getElementById('team1').value;
    const team2 = document.getElementById('team2').value;
    
    // Obtener todas las estadísticas para cada equipo
    const stats1 = {};
    const stats2 = {};
    
    for (const stat in LAMBDA_FACTORS) {
        stats1[stat] = parseFloat(document.getElementById(stat + '1').value);
        stats2[stat] = parseFloat(document.getElementById(stat + '2').value);
    }
    
    // Iniciar animación de cálculo en la terminal
    await typeTerminalText(terminal, `$ Iniciando cálculo de predicción con modelo de Poisson...`);
    await typeTerminalText(terminal, `$ Analizando estadísticas para ${team1} y ${team2}...`);
    await new Promise(resolve => setTimeout(resolve, calculationDelay));
    
    // Calcular lambdas para cada equipo (tasa media de goles esperados)
    const [lambda1, detailedCalc1] = await calculateLambda(terminal, team1, stats1, stats2);
    const [lambda2, detailedCalc2] = await calculateLambda(terminal, team2, stats2, stats1);
    
    // Comparación final
    await typeTerminalText(terminal, '\n$ Calculando probabilidades de resultados con Poisson...');
    await new Promise(resolve => setTimeout(resolve, calculationDelay));
    
    // Matriz de probabilidades para diferentes marcadores (hasta 5 goles)
    const maxGoals = 5;
    let resultMatrix = [];
    let team1WinProb = 0;
    let team2WinProb = 0;
    let drawProb = 0;
    
    await typeTerminalText(terminal, `<span class="info">Calculando matriz de probabilidades de marcadores:</span>`);
    
    // Mostrar algunos ejemplos de probabilidades de marcadores específicos
    for (let i = 0; i <= 3; i++) {
        for (let j = 0; j <= 3; j++) {
            const prob = poissonProbability(lambda1, i) * poissonProbability(lambda2, j);
            const percentage = (prob * 100).toFixed(2);
            
            if (i === j && i <= 2) {
                await typeTerminalText(terminal, `<span class="info">Probabilidad de ${i}-${j}:</span> <span class="result">${percentage}%</span>`);
            }
            
            if ((i === 1 && j === 0) || (i === 0 && j === 1) || (i === 2 && j === 1) || (i === 1 && j === 2)) {
                await typeTerminalText(terminal, `<span class="info">Probabilidad de ${i}-${j}:</span> <span class="result">${percentage}%</span>`);
            }
        }
    }
    
    // Calcular probabilidades completas
    for (let i = 0; i <= maxGoals; i++) {
        resultMatrix[i] = [];
        for (let j = 0; j <= maxGoals; j++) {
            const prob = poissonProbability(lambda1, i) * poissonProbability(lambda2, j);
            resultMatrix[i][j] = prob;
            
            // Sumar a las probabilidades totales
            if (i > j) team1WinProb += prob;
            else if (i < j) team2WinProb += prob;
            else drawProb += prob;
        }
    }
    
    // Calcular probabilidad para resultados con más de maxGoals (simplificado)
    const remainingProb = 1 - (team1WinProb + team2WinProb + drawProb);
    // Distribuir el remanente proporcionalmente
    if (remainingProb > 0) {
        const total = team1WinProb + team2WinProb + drawProb;
        team1WinProb += remainingProb * (team1WinProb / total);
        team2WinProb += remainingProb * (team2WinProb / total);
        drawProb += remainingProb * (drawProb / total);
    }
    
    // Convertir a porcentajes
    team1WinProb *= 100;
    team2WinProb *= 100;
    drawProb *= 100;
    
    await typeTerminalText(terminal, `\n<span class="info">Probabilidad victoria ${team1}:</span> <span class="result">${team1WinProb.toFixed(2)}%</span>`);
    await typeTerminalText(terminal, `<span class="info">Probabilidad empate:</span> <span class="result">${drawProb.toFixed(2)}%</span>`);
    await typeTerminalText(terminal, `<span class="info">Probabilidad victoria ${team2}:</span> <span class="result">${team2WinProb.toFixed(2)}%</span>`);
    
    // Determinar equipo favorito
    let favoriteTeam, winProbability;
    
    if (team1WinProb > team2WinProb && team1WinProb > drawProb) {
        favoriteTeam = team1;
        winProbability = team1WinProb.toFixed(2);
    } else if (team2WinProb > team1WinProb && team2WinProb > drawProb) {
        favoriteTeam = team2;
        winProbability = team2WinProb.toFixed(2);
    } else {
        favoriteTeam = "Empate";
        winProbability = drawProb.toFixed(2);
    }
    
    await typeTerminalText(terminal, `\n$ <span class="highlight">Resultado más probable: ${favoriteTeam} con ${winProbability}% de probabilidad</span>`);
    
    // Guardar resultados para la API
    currentResults = {
        team1: {
            name: team1,
            stats: stats1,
            lambda: lambda1,
            winProbability: team1WinProb.toFixed(2),
            detailedCalculation: detailedCalc1
        },
        team2: {
            name: team2,
            stats: stats2,
            lambda: lambda2,
            winProbability: team2WinProb.toFixed(2),
            detailedCalculation: detailedCalc2
        },
        drawProbability: drawProb.toFixed(2),
        favoriteTeam: favoriteTeam,
        winProbability: winProbability,
        resultMatrix: resultMatrix.slice(0, 4).map(row => row.slice(0, 4)) // Guardar matriz 4x4 de resultados
    };
    
    // Mostrar resultados en la interfaz
    document.getElementById('favorite-team').textContent = favoriteTeam;
    document.getElementById('win-probability').textContent = `${winProbability}%`;
    
    // Crear gráfico de comparación con animación
    createComparisonChart(team1, team2, stats1, stats2);
    
    // Mostrar sección de resultados con animación
    await new Promise(resolve => setTimeout(resolve, 500));
    predictionResults.classList.add('show');
}

// Función para calcular la lambda (tasa de goles esperados) para un equipo
async function calculateLambda(terminal, teamName, teamStats, opponentStats) {
    await typeTerminalText(terminal, `\n$ Calculando lambda (tasa de goles esperados) para <span class="highlight">${teamName}</span>...`);
    
    let lambda = 0;
    let detailedCalculation = [];
    
    // Base lambda - promedio de goles históricos del equipo
    const baseLambda = teamStats.goalsScored;
    lambda = baseLambda;
    detailedCalculation.push({stat: "Base (promedio goles)", value: baseLambda.toFixed(2), effect: baseLambda.toFixed(2)});
    
    await typeTerminalText(terminal, `<span class="highlight">Base lambda (promedio de goles):</span> ${baseLambda.toFixed(2)}`);
    
    // Ajustar lambda con las estadísticas del equipo y del oponente
    for (const [stat, factor] of Object.entries(LAMBDA_FACTORS)) {
        if (stat === 'goalsScored') continue; // Ya considerado en la base
        
        let adjustment = 0;
        let statValue = teamStats[stat];
        
        // Para estadísticas relativas, considerar la diferencia con el oponente
        if (stat === 'possession' || stat === 'passingAccuracy') {
            const diff = (teamStats[stat] - opponentStats[stat]) / 100;
            adjustment = diff * factor;
        } 
        // Para goles concedidos, usar los del oponente
        else if (stat === 'goalsConceded') {
            const diff = (opponentStats.goalsScored - teamStats.goalsConceded) / 2;
            adjustment = diff * factor;
            statValue = `${teamStats[stat]} vs ${opponentStats.goalsScored}`;
        }
        // Para el resto de estadísticas
        else {
            adjustment = (teamStats[stat] / 10) * factor;
        }
        
        lambda += adjustment;
        
        let color = "info";
        if (adjustment > 0) color = "highlight";
        if (adjustment < 0) color = "warning";
        
        detailedCalculation.push({stat, value: statValue, factor, adjustment: adjustment.toFixed(3)});
        
        await typeTerminalText(terminal, `<span class="${color}">${stat}:</span> ${statValue} → ajuste: ${adjustment.toFixed(3)}`);
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Asegurar que lambda sea positiva
    lambda = Math.max(0.1, lambda);
    
    await typeTerminalText(terminal, `<span class="result">Lambda final para ${teamName}: ${lambda.toFixed(3)}</span>`);
    await typeTerminalText(terminal, `<span class="info">Interpretación:</span> Se espera que ${teamName} anote en promedio ${lambda.toFixed(2)} goles`);
    
    return [lambda, detailedCalculation];
}

// Nueva función para escribir texto caracter por caracter en la terminal
async function typeTerminalText(terminal, text) {
    const line = document.createElement('div');
    line.className = 'line';
    terminal.appendChild(line);
    
    // Separar el texto en HTML y texto plano
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = text;
    
    if (text.includes('<span')) {
        // Si hay HTML, necesitamos preservar las etiquetas
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const content = doc.body.firstChild;
        
        // Identificar qué partes son HTML y cuáles son texto
        const walkAndType = async (node, parentElement) => {
            if (node.nodeType === Node.TEXT_NODE) {
                // Si es un nodo de texto, escribir caracter por caracter
                for (let i = 0; i < node.textContent.length; i++) {
                    parentElement.textContent += node.textContent[i];
                    await new Promise(resolve => setTimeout(resolve, typingSpeed));
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // Si es un elemento, crear el elemento y procesar sus hijos
                const newElement = document.createElement(node.tagName);
                // Copiar todos los atributos
                for (let attr of node.attributes) {
                    newElement.setAttribute(attr.name, attr.value);
                }
                parentElement.appendChild(newElement);
                
                // Procesar hijos recursivamente
                for (let child of node.childNodes) {
                    await walkAndType(child, newElement);
                }
            }
        };
        
        // Comenzar a escribir desde los nodos del cuerpo
        for (let child of doc.body.childNodes) {
            await walkAndType(child, line);
        }
    } else {
        // Si es solo texto, escribir caracter por caracter
        for (let i = 0; i < text.length; i++) {
            line.textContent += text[i];
            await new Promise(resolve => setTimeout(resolve, typingSpeed));
        }
    }
    
    // Scroll al final del terminal
    terminal.scrollTop = terminal.scrollHeight;
}

// Función para crear el gráfico de comparación con animación
function createComparisonChart(team1, team2, stats1, stats2) {
    // Destruir gráfico anterior si existe
    if (chart) {
        chart.destroy();
    }
    
    const ctx = document.getElementById('stats-chart').getContext('2d');
    
    // Preparar datos para la gráfica
    const labels = [
        'Goles anotados', 
        'Goles recibidos', 
        'Posesión', 
        'Tiros a puerta', 
        'Precisión pases'
    ];
    
    const data1 = [
        stats1.goalsScored,
        stats1.goalsConceded,
        stats1.possession,
        stats1.shotsOnTarget,
        stats1.passingAccuracy
    ];
    
    const data2 = [
        stats2.goalsScored,
        stats2.goalsConceded,
        stats2.possession,
        stats2.shotsOnTarget,
        stats2.passingAccuracy
    ];
    
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: team1,
                    data: data1,
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: team2,
                    data: data2,
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            animation: {
                duration: 1500, // Duración más larga para la animación
                easing: 'easeOutQuart' // Tipo de animación más suave
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#fff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#fff'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#fff'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y.toFixed(2);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Función para mostrar la explicación de IA con efecto de tipeo
async function showAIExplanation() {
    if (!currentResults) {
        alert("Primero debes realizar una predicción antes de solicitar un análisis");
        return;
    }

    const explanationBtn = document.getElementById('explanation-btn');
    explanationBtn.disabled = true;

    const explanationModal = new bootstrap.Modal(document.getElementById('explanation-modal'));
    explanationModal.show();

    const loadingIndicator = document.getElementById('ai-loading');
    const explanationDiv = document.getElementById('ai-explanation');
    loadingIndicator.style.display = 'inline-block';
    explanationDiv.innerHTML = '<p class="text-info">Solicitando análisis, por favor espera...</p>';

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch('/get_explanation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(currentResults),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Error del servidor (${response.status}): Por favor, intenta nuevamente`);
        }

        const data = await response.json();

        if (!data.explanation && !data.error) {
            throw new Error('Formato de respuesta inesperado del servidor');
        }

        if (data.error) {
            throw new Error(data.error);
        }

        loadingIndicator.style.display = 'none';
        explanationDiv.innerHTML = '';

        // Dividir la explicación en párrafos
        const paragraphs = data.explanation.split('\n\n');
        
        // Efecto de escritura para cada párrafo
        for (const paragraph of paragraphs) {
            const p = document.createElement('p');
            explanationDiv.appendChild(p);
            
            // Escribir el texto caracter por caracter
            for (let i = 0; i < paragraph.length; i++) {
                p.textContent += paragraph[i];
                explanationDiv.scrollTop = explanationDiv.scrollHeight;
                // Velocidad más rápida para la explicación
                await new Promise(resolve => setTimeout(resolve, typingSpeed / 2));
            }
            
            // Pausa entre párrafos
            await new Promise(resolve => setTimeout(resolve, 200));
        }

    } catch (error) {
        loadingIndicator.style.display = 'none';
        explanationDiv.innerHTML = `
            <div class="alert alert-danger">
                <strong>Error al cargar la explicación</strong>
                <p>${error.message || 'Se produjo un error inesperado'}</p>
            </div>`;
    } finally {
        explanationBtn.disabled = false;
    }
}