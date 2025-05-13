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

    // Agrega esta línea para definir el máximo de goles a considerar
    const maxGoals = 5;

    // Calcular probabilidades completas
    let resultMatrix = [];
    let team1WinProb = 0;
    let team2WinProb = 0;
    let drawProb = 0;
    for (let i = 0; i <= maxGoals; i++) {
        resultMatrix[i] = [];
        for (let j = 0; j <= maxGoals; j++) {
            const prob = poissonProbability(lambda1, i) * poissonProbability(lambda2, j);
            resultMatrix[i][j] = prob;
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
        resultMatrix: resultMatrix.slice(0, maxGoals + 1).map(row => row.slice(0, maxGoals + 1)) // Guardar matriz (ahora 6x6) de resultados
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


// Función para simular el partido con estadísticas
async function simularPartido() {
    if (!currentResults) {
        alert("Primero debes realizar una predicción antes de simular un partido");
        return;
    }
    
    // Crear el HTML del modal si no existe
    if (!document.getElementById('simulacion-modal')) {
        const modalHTML = `
        <div class="modal fade" id="simulacion-modal" tabindex="-1" aria-labelledby="simulacionModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg modal-dialog-centered">
                <div class="modal-content bg-dark text-white">
                    <div class="modal-header border-0">
                        <h5 class="modal-title" id="simulacionModalLabel">
                            <i class="fas fa-futbol me-2"></i>Simulación de Partido
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body p-0">
                        <div id="simulacion-carga" class="text-center p-4">
                            <h4 class="mb-4">Simulando partido en vivo</h4>
                            <div class="progress mb-4" style="height: 10px;">
                                <div id="barra-progreso" class="progress-bar progress-bar-striped progress-bar-animated bg-success" 
                                    role="progressbar" style="width: 0%" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                            </div>
                            <p id="texto-carga" class="text-muted">Preparando simulación...</p>
                        </div>
                        
                        <div id="simulacion-resultado" style="display:none;">
                            <!-- Cabecera del partido -->
                            <div class="p-3 border-bottom border-secondary">
                                <div class="text-center mb-2">
                                    <span class="text-muted">Partido simulado Hoy</span>
                                    <span class="badge bg-success ms-2">Finalizado</span>
                                </div>
                                <div class="row align-items-center text-center">
                                    <div class="col-4 text-end">
                                        <h3 id="equipo-local" class="text-info"></h3>
                                    </div>
                                    <div class="col-4">
                                        <div class="display-4 fw-bold">
                                            <span id="goles-local" class="text-info"></span>
                                            <span class="text-white">-</span>
                                            <span id="goles-visitante" class="text-danger"></span>
                                        </div>
                                    </div>
                                    <div class="col-4 text-start">
                                        <h3 id="equipo-visitante" class="text-danger"></h3>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Contenedor principal -->
                            <div class="row mx-0">
                                <!-- Estadísticas equipo local -->
                                <div class="col-md-4 p-3 border-end border-secondary">
                                    <h6 class="text-center mb-3">Estadísticas</h6>
                                    <div id="stats-local">
                                        <!-- Se llenará dinámicamente -->
                                    </div>
                                </div>
                                
                                <!-- Línea de tiempo -->
                                <div class="col-md-4 p-3">
                                    <h6 class="text-center mb-3">Momentos Clave</h6>
                                    <div id="momentos-partido" class="timeline">
                                        <!-- Los momentos se llenarán dinámicamente -->
                                    </div>
                                </div>
                                
                                <!-- Estadísticas equipo visitante -->
                                <div class="col-md-4 p-3 border-start border-secondary">
                                    <h6 class="text-center mb-3">Estadísticas</h6>
                                    <div id="stats-visitante">
                                        <!-- Se llenará dinámicamente -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer border-0">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">CERRAR</button>
                        <button type="button" id="nueva-simulacion-btn" class="btn btn-success">
                            <i class="fas fa-redo me-2"></i>NUEVA SIMULACIÓN
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
        
        // Agregar el modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Agregar estilos CSS para la línea de tiempo
        const estilosTimeline = document.createElement('style');
        estilosTimeline.textContent = `
            .timeline {
                position: relative;
                max-height: 400px;
                overflow-y: auto;
                padding: 0 10px;
            }
            .timeline:before {
                content: '';
                position: absolute;
                top: 0;
                bottom: 0;
                left: 50%;
                width: 2px;
                background: rgba(255,255,255,0.2);
                transform: translateX(-50%);
            }
            .momento-partido {
                position: relative;
                margin-bottom: 15px;
                padding-left: 40px;
            }
            .momento-partido .minuto {
                position: absolute;
                left: 0;
                top: 0;
                width: 30px;
                height: 30px;
                background: #343a40;
                border: 2px solid #6c757d;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 0.8rem;
            }
            .momento-partido .contenido {
                background: #2c3136;
                padding: 10px;
                border-radius: 5px;
            }
            .momento-partido.gol .minuto {
                background: #dc3545;
                border-color: #dc3545;
            }
            .momento-partido.gol .contenido {
                background: rgba(220, 53, 69, 0.2);
            }
            .stat-item {
                margin-bottom: 15px;
            }
            .stat-name {
                font-size: 0.9rem;
                color: #adb5bd;
            }
            .stat-value {
                font-weight: bold;
            }
            .stat-bar {
                height: 6px;
                background: rgba(255,255,255,0.1);
                margin-top: 5px;
                border-radius: 3px;
                overflow: hidden;
            }
            .stat-bar-fill {
                height: 100%;
                border-radius: 3px;
            }
        `;
        document.head.appendChild(estilosTimeline);
        
        // Agregar evento para nueva simulación
        document.getElementById('nueva-simulacion-btn').addEventListener('click', function() {
            simularPartido();
        });
    }
    
    // Obtener referencias
    const modalElement = document.getElementById('simulacion-modal');
    const barraProgreso = document.getElementById('barra-progreso');
    const textoCarga = document.getElementById('texto-carga');
    const simulacionCarga = document.getElementById('simulacion-carga');
    const simulacionResultado = document.getElementById('simulacion-resultado');
    
    // Reiniciar elementos
    barraProgreso.style.width = '0%';
    barraProgreso.setAttribute('aria-valuenow', '0');
    simulacionCarga.style.display = 'block';
    simulacionResultado.style.display = 'none';
    
    // Mostrar modal (usando el constructor directamente)
    const simulacionModal = new bootstrap.Modal(modalElement);
    simulacionModal.show();
    
    // Simular progreso
    const frases = [
        "Analizando estadísticas de los equipos...",
        "Calculando probabilidades de gol...",
        "Simulando jugadas clave...",
        "Generando eventos del partido...",
        "Aplicando factores aleatorios...",
        "Calculando resultado final..."
    ];
    
    for (let i = 0; i <= 100; i += 4) {
        barraProgreso.style.width = i + '%';
        barraProgreso.setAttribute('aria-valuenow', i);
        
        if (i % 20 === 0 && i > 0 && i < 100) {
            textoCarga.textContent = frases[i/20];
        }
        if (i === 100) textoCarga.textContent = "¡Simulación completada!";
        
        await new Promise(resolve => setTimeout(resolve, 80));
    }
    
    // Esperar un momento antes de mostrar resultados
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Ocultar carga y mostrar resultados
    simulacionCarga.style.display = 'none';
    simulacionResultado.style.display = 'block';
    
    // Obtener datos de los equipos
    const team1 = currentResults.team1.name;
    const team2 = currentResults.team2.name;
    const lambda1 = currentResults.team1.lambda;
    const lambda2 = currentResults.team2.lambda;
    
    // Simular goles (usando distribución de Poisson)
    const goles1 = simularGoles(lambda1);
    const goles2 = simularGoles(lambda2);
    
    // Mostrar resultado
    document.getElementById('equipo-local').textContent = team1;
    document.getElementById('equipo-visitante').textContent = team2;
    document.getElementById('goles-local').textContent = goles1;
    document.getElementById('goles-visitante').textContent = goles2;
    
    // Generar estadísticas del partido
    const estadisticas = generarEstadisticasPartido(currentResults.team1.stats, currentResults.team2.stats);
    
    // Mostrar estadísticas en los paneles laterales
    const statsLocal = document.getElementById('stats-local');
    const statsVisitante = document.getElementById('stats-visitante');
    
    statsLocal.innerHTML = '';
    statsVisitante.innerHTML = '';
    
    for (const [clave, valores] of Object.entries(estadisticas)) {
        // Crear elementos para estadísticas del equipo local
        const statItemLocal = document.createElement('div');
        statItemLocal.className = 'stat-item';
        statItemLocal.innerHTML = `
            <div class="d-flex justify-content-between">
                <span class="stat-value text-info">${valores.local}</span>
                <span class="stat-name">${valores.nombre}</span>
            </div>
            <div class="stat-bar">
                <div class="stat-bar-fill bg-info" style="width: ${getPercentage(valores.local, valores.visitante)}%"></div>
            </div>
        `;
        
        // Crear elementos para estadísticas del equipo visitante
        const statItemVisitante = document.createElement('div');
        statItemVisitante.className = 'stat-item';
        statItemVisitante.innerHTML = `
            <div class="d-flex justify-content-between">
                <span class="stat-name">${valores.nombre}</span>
                <span class="stat-value text-danger">${valores.visitante}</span>
            </div>
            <div class="stat-bar">
                <div class="stat-bar-fill bg-danger" style="width: ${100 - getPercentage(valores.local, valores.visitante)}%"></div>
            </div>
        `;
        
        statsLocal.appendChild(statItemLocal);
        statsVisitante.appendChild(statItemVisitante);
    }
    
    // Generar momentos clave del partido
    const momentos = generarMomentosPartido(team1, team2, goles1, goles2);
    
    // Mostrar momentos
    const momentosPartido = document.getElementById('momentos-partido');
    momentosPartido.innerHTML = '';
    
    // Verificar que se hayan generado momentos
    if (momentos.length === 0) {
        momentosPartido.innerHTML = '<div class="text-center text-muted">No hay momentos destacados para mostrar</div>';
    } else {
        // Ordenar momentos por minuto
        momentos.sort((a, b) => a.minuto - b.minuto);
        
        // Crear elementos para cada momento
        momentos.forEach(momento => {
            const elementoMomento = document.createElement('div');
            elementoMomento.className = 'momento-partido';
            
            // Añadir clase adicional si es un gol
            if (momento.tipo === 'gol') {
                elementoMomento.classList.add('gol');
            }
            
            elementoMomento.innerHTML = `
                <div class="minuto">${momento.minuto}'</div>
                <div class="contenido">
                    <strong>${momento.equipo}:</strong> ${momento.descripcion}
                    ${momento.tipo === 'gol' ? '<span class="badge bg-danger ms-1">GOL</span>' : ''}
                </div>
            `;
            
            momentosPartido.appendChild(elementoMomento);
        });
    }
    
    // Hacer scroll al inicio de los momentos
    momentosPartido.scrollTop = 0;
}

// Función auxiliar para calcular porcentaje para barras de progreso
function getPercentage(val1, val2) {
    // Eliminar símbolos de porcentaje si existen
    if (typeof val1 === 'string') val1 = val1.replace('%', '');
    if (typeof val2 === 'string') val2 = val2.replace('%', '');
    
    // Convertir a números
    val1 = parseFloat(val1);
    val2 = parseFloat(val2);
    
    // Calcular porcentaje (mínimo 20%, máximo 80% para que siempre se vea algo)
    const total = val1 + val2;
    if (total === 0) return 50;
    
    const percentage = (val1 / total) * 100;
    return Math.min(Math.max(percentage, 20), 80);
}

// Función para simular goles usando Poisson
function simularGoles(lambda) {
    let L = Math.exp(-lambda);
    let p = 1.0;
    let k = 0;
    
    do {
        k++;
        p *= Math.random();
    } while (p > L);
    
    return k - 1;
}

// Función para generar estadísticas aleatorias del partido
function generarEstadisticasPartido(stats1, stats2) {
    // Convertir posesión a números que sumen 100
    const posesionTotal = 100;
    const posesionLocal = Math.round(stats1.possession);
    const posesionVisitante = posesionTotal - posesionLocal;
    
    // Generar estadísticas basadas en las medias de los equipos
    return {
        posesion: {
            nombre: "Posesión",
            local: posesionLocal + "%",
            visitante: posesionVisitante + "%"
        },
        tiros: {
            nombre: "Tiros a puerta",
            local: Math.round(stats1.shotsOnTarget * (Math.random() * 0.4 + 0.8)),
            visitante: Math.round(stats2.shotsOnTarget * (Math.random() * 0.4 + 0.8))
        },
        pases: {
            nombre: "Precisión de pases",
            local: Math.round(stats1.passingAccuracy) + "%",
            visitante: Math.round(stats2.passingAccuracy) + "%"
        },
        faltas: {
            nombre: "Faltas",
            local: Math.round(stats1.fouls * (Math.random() * 0.4 + 0.8)),
            visitante: Math.round(stats2.fouls * (Math.random() * 0.4 + 0.8))
        },
        corners: {
            nombre: "Córners",
            local: Math.round(stats1.corners * (Math.random() * 0.4 + 0.8)),
            visitante: Math.round(stats2.corners * (Math.random() * 0.4 + 0.8))
        },
        tarjetas: {
            nombre: "Tarjetas amarillas",
            local: Math.round(stats1.yellowCards * (Math.random() * 0.6 + 0.7)),
            visitante: Math.round(stats2.yellowCards * (Math.random() * 0.6 + 0.7))
        }
    };
}

// Función para generar momentos clave del partido
function generarMomentosPartido(equipo1, equipo2, goles1, goles2) {
    const momentos = [];
    const totalMomentos = goles1 + goles2 + Math.floor(Math.random() * 6) + 3; // Goles + algunos momentos adicionales
    
    // Generar minutos para los goles
    const minutosGoles1 = generarMinutosAleatorios(goles1);
    const minutosGoles2 = generarMinutosAleatorios(goles2);
    
    // Agregar goles del equipo 1
    minutosGoles1.forEach(minuto => {
        momentos.push({
            minuto: minuto,
            equipo: equipo1,
            descripcion: `¡GOL! ${generarDescripcionGol()}`,
            tipo: 'gol'
        });
    });
    
    // Agregar goles del equipo 2
    minutosGoles2.forEach(minuto => {
        momentos.push({
            minuto: minuto,
            equipo: equipo2,
            descripcion: `¡GOL! ${generarDescripcionGol()}`,
            tipo: 'gol'
        });
    });
    
    // Agregar otros momentos (tiros, faltas, etc.)
    const momentosAdicionales = totalMomentos - goles1 - goles2;
    const tiposMomentos = ['tiro', 'falta', 'corner', 'tarjeta'];
    
    for (let i = 0; i < momentosAdicionales; i++) {
        const minuto = Math.floor(Math.random() * 90) + 1;
        const equipo = Math.random() < 0.5 ? equipo1 : equipo2;
        const tipoMomento = tiposMomentos[Math.floor(Math.random() * tiposMomentos.length)];
        
        let descripcion = '';
        switch (tipoMomento) {
            case 'tiro':
                descripcion = `${generarDescripcionTiro()}`;
                break;
            case 'falta':
                descripcion = `${generarDescripcionFalta()}`;
                break;
            case 'corner':
                descripcion = `Córner a favor`;
                break;
            case 'tarjeta':
                descripcion = `Tarjeta amarilla`;
                break;
        }
        
        momentos.push({
            minuto: minuto,
            equipo: equipo,
            descripcion: descripcion,
            tipo: tipoMomento
        });
    }
    
    // Ordenar por minuto
    momentos.sort((a, b) => a.minuto - b.minuto);
    
    return momentos;
}

// Función para generar minutos aleatorios para los goles
function generarMinutosAleatorios(cantidad) {
    const minutos = [];
    for (let i = 0; i < cantidad; i++) {
        // Más probabilidad de goles en la segunda parte
        let minuto;
        if (Math.random() < 0.6) {
            minuto = Math.floor(Math.random() * 45) + 46; // 46-90
        } else {
            minuto = Math.floor(Math.random() * 45) + 1; // 1-45
        }
        minutos.push(minuto);
    }
    return minutos;
}

// Funciones para generar descripciones aleatorias
function generarDescripcionGol() {
    const descripciones = [
        `Remate potente desde fuera del área`,
        `Cabezazo tras un centro preciso`,
        `Disparo cruzado que entra por la escuadra`,
        `Penalti bien ejecutado`,
        `Contraataque letal`,
        `Tras una gran jugada colectiva`,
        `Aprovechando un error defensivo`,
        `De tiro libre directo`
    ];
    return descripciones[Math.floor(Math.random() * descripciones.length)];
}

function generarDescripcionTiro() {
    const descripciones = [
        `Disparo que se va por encima del larguero`,
        `Tiro que detiene el portero`,
        `Remate que se estrella en el poste`,
        `Intento desde lejos que sale desviado`,
        `Buena parada del portero tras un disparo peligroso`
    ];
    return descripciones[Math.floor(Math.random() * descripciones.length)];
}

function generarDescripcionFalta() {
    const descripciones = [
        `Falta peligrosa cerca del área`,
        `Entrada dura que el árbitro sanciona`,
        `Infracción por mano`,
        `Falta táctica para cortar un avance`
    ];
    return descripciones[Math.floor(Math.random() * descripciones.length)];
}

// Asociar función al botón de simular
document.addEventListener('DOMContentLoaded', function() {
    const simularBtn = document.getElementById('simular-btn');
    if (simularBtn) {
        simularBtn.addEventListener('click', simularPartido);
    } else {
        console.error("No se encontró el botón de simulación");
    }
});