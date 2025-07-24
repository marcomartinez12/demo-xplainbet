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
let phonkPlayer = null; // Reproductor de música phonk
let isSpeedMode = false; // Modo de velocidad x2

// Evento al cargar el DOM
document.addEventListener('DOMContentLoaded', function() {
    // Referencia al formulario
    const form = document.getElementById('prediction-form');
    const demoButton = document.getElementById('demo-btn');
    const explanationBtn = document.getElementById('explanation-btn');
    const clearButton = document.getElementById('clear-btn');
    const speedToggleBtn = document.getElementById('speed-toggle-btn');

    // Inicializar el reproductor de música phonk
    phonkPlayer = new PhonkMusicPlayer();
    
    // Control de volumen para la música phonk
    const volumeControl = document.getElementById('phonk-volume');
    if (volumeControl) {
        volumeControl.addEventListener('input', function() {
            if (phonkPlayer) {
                // Convertir el valor del rango (0-100) a escala de volumen (0-1)
                const volume = this.value / 100;
                phonkPlayer.setVolume(volume);
            }
        });
    }
    
    // Añadir un evento de clic en el documento para habilitar la reproducción de audio
    document.addEventListener('click', function() {
        console.log('Clic detectado en el documento, intentando habilitar audio...');
        // Crear un contexto de audio para desbloquear la reproducción
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContext.resume().then(() => {
                console.log('AudioContext reanudado después del clic del usuario');
                // Intentar reproducir un sonido silencioso para desbloquear el audio
                const silentBuffer = audioContext.createBuffer(1, 1, 22050);
                const source = audioContext.createBufferSource();
                source.buffer = silentBuffer;
                source.connect(audioContext.destination);
                source.start(0);
                console.log('Sonido silencioso reproducido para desbloquear audio');
            });
        } catch (error) {
            console.error('Error al crear/reanudar AudioContext:', error);
        }
    }, { once: true }); // Solo necesitamos un clic para desbloquear
    
    // El botón de prueba de música ha sido eliminado
    // La música ahora se controla con el botón x2
    
    // La música phonk se reproducirá automáticamente durante el cálculo
    console.log('Reproductor de música phonk inicializado. Se activará automáticamente durante el cálculo.');

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
    
    // Manejador para el botón de velocidad x2
    if (speedToggleBtn) {
        speedToggleBtn.addEventListener('click', function() {
            isSpeedMode = !isSpeedMode;
            
            if (isSpeedMode) {
                // Activar modo velocidad x2
                speedToggleBtn.classList.add('active');
                speedToggleBtn.innerHTML = '<i class="fas fa-forward"></i> x2 ON';
                
                // Duplicar la velocidad reduciendo los tiempos a la mitad
                animationSpeed = 300; // De 600 a 300
                calculationDelay = 400; // De 800 a 400
                typingSpeed = 10; // De 20 a 10
                
                // Reproducir música Phonk automáticamente
                if (phonkPlayer) {
                    // Crear un contexto de audio para desbloquear la reproducción
                    try {
                        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                        audioContext.resume().then(() => {
                            console.log('AudioContext reanudado para reproducción de música');
                            // Intentar reproducir un sonido silencioso primero
                            const silentBuffer = audioContext.createBuffer(1, 1, 22050);
                            const source = audioContext.createBufferSource();
                            source.buffer = silentBuffer;
                            source.connect(audioContext.destination);
                            source.start(0);
                            
                            // Ahora reproducir la música real
                            setTimeout(() => {
                                phonkPlayer.play();
                                console.log('Música phonk iniciada automáticamente con x2');
                            }, 100);
                        });
                    } catch (error) {
                        console.error('Error al intentar reproducir música:', error);
                        // Intentar reproducir directamente como último recurso
                        phonkPlayer.play();
                    }
                }
                
                // Mostrar mensaje en la terminal si está visible
                const terminal = document.getElementById('terminal-content');
                if (terminal && terminal.children.length > 0) {
                    const line = document.createElement('div');
                    line.className = 'line';
                    line.innerHTML = '<span class="highlight">🚀 Modo velocidad x2 activado! 🎵 Música Phonk activada. 🎵</span>';
                    terminal.appendChild(line);
                    terminal.scrollTop = terminal.scrollHeight;
                }
            } else {
                // Desactivar modo velocidad x2
                speedToggleBtn.classList.remove('active');
                speedToggleBtn.innerHTML = '<i class="fas fa-forward"></i> x2';
                
                // Restaurar velocidades originales
                animationSpeed = 600;
                calculationDelay = 800;
                typingSpeed = 20;
                
                // Pausar la música Phonk
                if (phonkPlayer && phonkPlayer.isPlaying) {
                    phonkPlayer.pause();
                    console.log('Música phonk pausada al desactivar x2');
                }
                
                // Mostrar mensaje en la terminal si está visible
                const terminal = document.getElementById('terminal-content');
                if (terminal && terminal.children.length > 0) {
                    const line = document.createElement('div');
                    line.className = 'line';
                    line.innerHTML = '<span class="info">🐢 Velocidad normal restaurada. 🎵 Música Phonk pausada. 🎵</span>';
                    terminal.appendChild(line);
                    terminal.scrollTop = terminal.scrollHeight;
                }
            }
        });
    }

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
    // La música phonk ahora se controla exclusivamente con el botón x2
    // Solo reproducimos música si el modo velocidad x2 está activado
    if (isSpeedMode && phonkPlayer && !phonkPlayer.isPlaying) {
        console.log('Modo x2 activo, asegurando que la música esté sonando...');
        phonkPlayer.play();
    }
    
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
    if (isSpeedMode && phonkPlayer && phonkPlayer.isPlaying) {
        await typeTerminalText(terminal, `$ <span class="highlight">🎵 Música Phonk activa en modo velocidad x2... 🎵</span>`);
    } else {
        await typeTerminalText(terminal, `$ <span class="info">💡 Activa el modo x2 para escuchar música Phonk durante el análisis.</span>`);
    }
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
    
    // La música phonk ahora se controla exclusivamente con el botón x2
    // No pausamos la música al finalizar el cálculo, solo mostramos un mensaje informativo
    if (phonkPlayer && isSpeedMode && phonkPlayer.isPlaying) {
        // En modo velocidad x2, mostrar mensaje de que la música continúa
        await typeTerminalText(terminal, `$ <span class="highlight">🎵 Música Phonk continúa sonando en modo velocidad x2. 🎵</span>`);
    } else if (phonkPlayer && !isSpeedMode) {
        // En modo normal, mostrar mensaje de que no hay música
        await typeTerminalText(terminal, `$ <span class="info">🎵 Activa el modo x2 para escuchar música Phonk. 🎵</span>`);
    }
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
        // Obtener la probabilidad más alta entre los tres modelos
        const team1 = currentResults.team1.name;
        const team2 = currentResults.team2.name;
        const favoriteTeam = currentResults.favoriteTeam;
        
        // Obtener probabilidades para el equipo favorito de cada modelo
        let poissonProb, logisticProb, xgboostProb;
        
        if (favoriteTeam === team1) {
            poissonProb = parseFloat(currentResults.team1.winProbability);
            logisticProb = currentResults.logisticRegression ? parseFloat(currentResults.logisticRegression.team1Win) : 0;
            xgboostProb = currentResults.xgboost ? parseFloat(currentResults.xgboost.team1Win) : 0;
        } else if (favoriteTeam === team2) {
            poissonProb = parseFloat(currentResults.team2.winProbability);
            logisticProb = currentResults.logisticRegression ? parseFloat(currentResults.logisticRegression.team2Win) : 0;
            xgboostProb = currentResults.xgboost ? parseFloat(currentResults.xgboost.team2Win) : 0;
        } else {
            // Si el favorito es empate
            poissonProb = parseFloat(currentResults.drawProbability);
            logisticProb = currentResults.logisticRegression ? parseFloat(currentResults.logisticRegression.draw) : 0;
            xgboostProb = currentResults.xgboost ? parseFloat(currentResults.xgboost.draw) : 0;
        }
        
        // Determinar la probabilidad más alta
        let highestProb = poissonProb;
        let bestModel = "Poisson";
        
        if (logisticProb > highestProb) {
            highestProb = logisticProb;
            bestModel = "Regresión Logística";
        }
        
        if (xgboostProb > highestProb) {
            highestProb = xgboostProb;
            bestModel = "XGBoost";
        }
        
        // Preparar datos para enviar al servidor
        const requestData = {
            team1: currentResults.team1,
            team2: currentResults.team2,
            favoriteTeam: favoriteTeam,
            winProbability: highestProb.toFixed(2),
            drawProbability: currentResults.drawProbability,
            resultMatrix: currentResults.resultMatrix,
            logisticRegression: currentResults.logisticRegression,
            xgboost: currentResults.xgboost,
            modelReliability: {
                reliableModel: bestModel,
                scenario: currentResults.modelReliability ? currentResults.modelReliability.scenario : "Estándar"
            }
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch('/get_explanation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData),
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

// Clase para el modelo de Regresión Logística
class LogisticRegressionModel {
    constructor() {
        // Coeficientes del modelo (simulados)
        this.coefficients = {
            goalsScored: 0.65,
            goalsConceded: -0.55,
            possession: 0.40,
            shotsOnTarget: 0.45,
            passingAccuracy: 0.35,
            fouls: -0.15,
            corners: 0.25,
            yellowCards: -0.10,
            redCards: -0.30
        };
    }
    
    predict(stats1, stats2) {
        // Calcular puntuación para cada equipo
        let score1 = 0;
        let score2 = 0;
        
        for (const [stat, coef] of Object.entries(this.coefficients)) {
            // Normalizar estadísticas porcentuales
            if (stat === 'possession' || stat === 'passingAccuracy') {
                score1 += (stats1[stat] / 100) * coef;
                score2 += (stats2[stat] / 100) * coef;
            } else {
                score1 += stats1[stat] * coef;
                score2 += stats2[stat] * coef;
            }
        }
        
        // Calcular probabilidades con función logística
        const diff = score1 - score2;
        const team1Win = 100 / (1 + Math.exp(-diff * 1.5));
        const team2Win = 100 / (1 + Math.exp(diff * 1.5));
        
        // Ajustar para que sumen 100% con la probabilidad de empate
        const total = team1Win + team2Win;
        const normalizedTeam1Win = (team1Win / total) * 85; // Dejamos 15% para empate
        const normalizedTeam2Win = (team2Win / total) * 85;
        const draw = 100 - normalizedTeam1Win - normalizedTeam2Win;
        
        return {
            team1Win: normalizedTeam1Win,
            team2Win: normalizedTeam2Win,
            draw: draw
        };
    }
}

// Clase para el modelo XGBoost
class XGBoostModel {
    constructor() {
        // Simulación de árboles de decisión
        this.trees = [
            {
                feature: 'goalsScored',
                threshold: 2.0,
                weight: 0.8,
                leftNode: { value: -0.3 },
                rightNode: { value: 0.5 }
            },
            {
                feature: 'goalsConceded',
                threshold: 1.0,
                weight: 0.7,
                leftNode: { value: 0.4 },
                rightNode: { value: -0.2 }
            },
            {
                feature: 'possession',
                threshold: 60,
                weight: 0.5,
                leftNode: { value: -0.1 },
                rightNode: { value: 0.3 }
            },
            {
                feature: 'shotsOnTarget',
                threshold: 5.5,
                weight: 0.6,
                leftNode: { value: -0.2 },
                rightNode: { value: 0.4 }
            },
            {
                feature: 'passingAccuracy',
                threshold: 85,
                weight: 0.4,
                leftNode: { value: -0.1 },
                rightNode: { value: 0.2 }
            }
        ];
    }
    
    predict(stats1, stats2) {
        // Preparar características combinadas
        const features = {
            goalsScored: (stats1.goalsScored - stats2.goalsScored) / 5,
            goalsConceded: (stats2.goalsConceded - stats1.goalsConceded) / 5,
            possession: (stats1.possession - stats2.possession) / 100,
            shotsOnTarget: (stats1.shotsOnTarget - stats2.shotsOnTarget) / 5,
            passingAccuracy: (stats1.passingAccuracy - stats2.passingAccuracy) / 100,
            combinedAttack: ((stats1.shotsOnTarget + stats1.corners) - (stats2.shotsOnTarget + stats2.corners)) / 5,
            discipline: ((stats2.yellowCards + stats2.redCards * 3) - (stats1.yellowCards + stats1.redCards * 3)) / 5
        };
        
        // Calcular puntuación base
        let score = 0;
        
        // Aplicar cada árbol
        for (const tree of this.trees) {
            const featureValue = features[tree.feature] || 0;
            if (featureValue <= tree.threshold) {
                score += tree.leftNode.value * tree.weight;
            } else {
                score += tree.rightNode.value * tree.weight;
            }
        }
        
        // Convertir puntuación a probabilidades
        const team1Win = 100 / (1 + Math.exp(-score * 2));
        const team2Win = 100 - team1Win;
        
        // Ajustar para incluir empate
        const adjustedTeam1Win = team1Win * 0.85;
        const adjustedTeam2Win = team2Win * 0.85;
        const draw = 100 - adjustedTeam1Win - adjustedTeam2Win;
        
        return {
            team1Win: adjustedTeam1Win,
            team2Win: adjustedTeam2Win,
            draw: draw
        };
    }
}

// Función para determinar el modelo más confiable según el escenario
function determineReliableModel(stats1, stats2, poissonProb, logisticProb, xgboostProb) {
    // Detectar escenarios específicos
    const isHighScoring = stats1.goalsScored > 2.5 && stats2.goalsScored > 2.5;
    const isLowScoring = stats1.goalsScored < 1.5 && stats2.goalsScored < 1.5;
    const isBalanced = Math.abs(stats1.goalsScored - stats2.goalsScored) < 0.5;
    const isUnbalanced = Math.abs(stats1.goalsScored - stats2.goalsScored) > 1.5;
    
    let reliableModel = "Poisson";
    let scenario = "Estándar";
    
    // Determinar escenario y modelo más confiable
    if (isHighScoring) {
        scenario = "Equipos de alto rendimiento ofensivo";
        reliableModel = "XGBoost";
    } else if (isLowScoring) {
        scenario = "Equipos defensivos";
        reliableModel = "Regresión Logística";
    } else if (isBalanced) {
        scenario = "Equipos equilibrados";
        reliableModel = "Consenso";
    } else if (isUnbalanced) {
        scenario = "Diferencia significativa entre equipos";
        reliableModel = "Poisson";
    }
    
    // Calcular probabilidades de consenso (promedio ponderado)
    const consensusProb = {
        team1Win: (poissonProb.team1Win * 0.4 + logisticProb.team1Win * 0.3 + xgboostProb.team1Win * 0.3),
        draw: (poissonProb.draw * 0.4 + logisticProb.draw * 0.3 + xgboostProb.draw * 0.3),
        team2Win: (poissonProb.team2Win * 0.4 + logisticProb.team2Win * 0.3 + xgboostProb.team2Win * 0.3)
    };
    
    return {
        scenario,
        reliableModel,
        consensusProb
    };
}

// Función para crear gráfico comparativo de modelos
function createModelComparisonChart(team1, team2, poissonProb, logisticProb, xgboostProb) {
    // Destruir gráfico anterior si existe
    if (chart) {
        chart.destroy();
    }
    
    const ctx = document.getElementById('stats-chart').getContext('2d');
    
    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [`Victoria ${team1}`, 'Empate', `Victoria ${team2}`],
            datasets: [
                {
                    label: 'Poisson',
                    data: [poissonProb.team1Win, poissonProb.draw, poissonProb.team2Win],
                    backgroundColor: 'rgba(54, 162, 235, 0.7)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Regresión Logística',
                    data: [logisticProb.team1Win, logisticProb.draw, logisticProb.team2Win],
                    backgroundColor: 'rgba(255, 99, 132, 0.7)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                },
                {
                    label: 'XGBoost',
                    data: [xgboostProb.team1Win, xgboostProb.draw, xgboostProb.team2Win],
                    backgroundColor: 'rgba(75, 192, 192, 0.7)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
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
                                label += context.parsed.y.toFixed(2) + '%';
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Función para actualizar el modelo recomendado en la interfaz
function updateRecommendedModel() {
    if (!currentResults || !currentResults.logisticRegression || !currentResults.xgboost) {
        return; // No hay resultados de los tres modelos todavía
    }
    
    const team1 = currentResults.team1.name;
    const team2 = currentResults.team2.name;
    const favoriteTeam = currentResults.favoriteTeam;
    
    // Obtener probabilidades para el equipo favorito de cada modelo
    let poissonProb, logisticProb, xgboostProb;
    
    if (favoriteTeam === team1) {
        poissonProb = parseFloat(currentResults.team1.winProbability);
        logisticProb = parseFloat(currentResults.logisticRegression.team1Win);
        xgboostProb = parseFloat(currentResults.xgboost.team1Win);
    } else if (favoriteTeam === team2) {
        poissonProb = parseFloat(currentResults.team2.winProbability);
        logisticProb = parseFloat(currentResults.logisticRegression.team2Win);
        xgboostProb = parseFloat(currentResults.xgboost.team2Win);
    } else {
        // Si el favorito es empate
        poissonProb = parseFloat(currentResults.drawProbability);
        logisticProb = parseFloat(currentResults.logisticRegression.draw);
        xgboostProb = parseFloat(currentResults.xgboost.draw);
    }
    
    // Determinar el modelo con la probabilidad más alta
    let bestModel = "Poisson";
    let highestProb = poissonProb;
    
    if (logisticProb > highestProb) {
        bestModel = "Regresión Logística";
        highestProb = logisticProb;
    }
    
    if (xgboostProb > highestProb) {
        bestModel = "XGBoost";
        highestProb = xgboostProb;
    }
    
    // Actualizar el elemento HTML que muestra el modelo recomendado
    const recommendedModelElement = document.getElementById('recommended-model');
    if (recommendedModelElement) {
        recommendedModelElement.textContent = `Modelo recomendado: ${bestModel}`;
    }
    
    // Actualizar la probabilidad de victoria con el valor más alto
    const winProbabilityElement = document.getElementById('win-probability');
    if (winProbabilityElement) {
        winProbabilityElement.textContent = `${highestProb.toFixed(2)}%`;
    }
}

// Modificar la función calculatePrediction para incluir los nuevos modelos
const originalCalculatePrediction = calculatePrediction;

calculatePrediction = async function() {
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
    
    // Ocultar equipo favorito y probabilidad hasta que se completen todos los modelos
    document.getElementById('favorite-team').textContent = "Calculando...";
    document.getElementById('win-probability').textContent = "...";
    document.getElementById('recommended-model').textContent = "Modelo recomendado: Calculando...";
    
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
    await typeTerminalText(terminal, `$ Iniciando cálculo de predicción con múltiples modelos...`);
    await typeTerminalText(terminal, `$ Analizando estadísticas para ${team1} y ${team2}...`);
    await new Promise(resolve => setTimeout(resolve, calculationDelay));
    
    // ===== MODELO DE POISSON =====
    await typeTerminalText(terminal, '\n$ Ejecutando modelo de Poisson...');
    
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
    
    await typeTerminalText(terminal, `\n<span class="info">Probabilidad victoria ${team1} (Poisson):</span> <span class="result">${team1WinProb.toFixed(2)}%</span>`);
    await typeTerminalText(terminal, `<span class="info">Probabilidad empate (Poisson):</span> <span class="result">${drawProb.toFixed(2)}%</span>`);
    await typeTerminalText(terminal, `<span class="info">Probabilidad victoria ${team2} (Poisson):</span> <span class="result">${team2WinProb.toFixed(2)}%</span>`);
    
    // Determinar equipo favorito según Poisson
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
    
    // Guardar resultados de Poisson
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
        resultMatrix: resultMatrix.slice(0, maxGoals + 1).map(row => row.slice(0, maxGoals + 1))
    };
    
    // Convertir probabilidades de Poisson al formato común
    const poissonProb = {
        team1Win: team1WinProb,
        draw: drawProb,
        team2Win: team2WinProb
    };
    
    // ===== REGRESIÓN LOGÍSTICA =====
    await typeTerminalText(terminal, '\n$ Ejecutando modelo de Regresión Logística...');
    
    // Mostrar proceso paso a paso de Regresión Logística
    await typeTerminalText(terminal, `<span class="info">Analizando diferencias estadísticas entre ${team1} y ${team2}...</span>`);
    
    // Crear y ejecutar el modelo de Regresión Logística
    const logisticModel = new LogisticRegressionModel();
    
    // Mostrar los coeficientes del modelo
    await typeTerminalText(terminal, `<span class="highlight">Coeficientes del modelo:</span>`);
    for (const [stat, coef] of Object.entries(logisticModel.coefficients)) {
        await typeTerminalText(terminal, `<span class="info">${stat}:</span> ${coef.toFixed(2)}`);
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Calcular diferencias entre equipos para cada estadística
    const statDiffs = {};
    for (const stat in logisticModel.coefficients) {
        statDiffs[stat] = stats1[stat] - stats2[stat];
        
        // Normalizar diferencias para estadísticas porcentuales
        if (stat === 'possession' || stat === 'passingAccuracy') {
            statDiffs[stat] /= 100;
        }
        
        await typeTerminalText(terminal, `<span class="info">Diferencia en ${stat}:</span> ${statDiffs[stat].toFixed(2)}`);
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Calcular puntuaciones
    await typeTerminalText(terminal, `<span class="highlight">Calculando puntuaciones...</span>`);
    
    // Obtener las probabilidades
    const logisticProb = logisticModel.predict(stats1, stats2);
    
    await typeTerminalText(terminal, `<span class="result">Probabilidad victoria ${team1} (Regresión Logística):</span> <span class="highlight">${logisticProb.team1Win.toFixed(2)}%</span>`);
    await typeTerminalText(terminal, `<span class="result">Probabilidad empate (Regresión Logística):</span> <span class="highlight">${logisticProb.draw.toFixed(2)}%</span>`);
    await typeTerminalText(terminal, `<span class="result">Probabilidad victoria ${team2} (Regresión Logística):</span> <span class="highlight">${logisticProb.team2Win.toFixed(2)}%</span>`);
    
    // ===== XGBOOST =====
    await typeTerminalText(terminal, '\n$ Ejecutando modelo XGBoost...');
    
    // Mostrar proceso paso a paso de XGBoost
    await typeTerminalText(terminal, `<span class="info">Preparando características para el modelo XGBoost...</span>`);
    
    // Crear y ejecutar el modelo XGBoost
    const xgboostModel = new XGBoostModel();
    
    // Calcular características combinadas
    await typeTerminalText(terminal, `<span class="highlight">Características combinadas:</span>`);
    
    const features = {
        goalsScored: (stats1.goalsScored - stats2.goalsScored) / 5,
        goalsConceded: (stats2.goalsConceded - stats1.goalsConceded) / 5,
        possession: (stats1.possession - stats2.possession) / 100,
        shotsOnTarget: (stats1.shotsOnTarget - stats2.shotsOnTarget) / 5,
        passingAccuracy: (stats1.passingAccuracy - stats2.passingAccuracy) / 100,
        combinedAttack: ((stats1.shotsOnTarget + stats1.corners) - (stats2.shotsOnTarget + stats2.corners)) / 5,
        discipline: ((stats2.yellowCards + stats2.redCards * 3) - (stats1.yellowCards + stats1.redCards * 3)) / 5
    };
    
    for (const [feature, value] of Object.entries(features)) {
        await typeTerminalText(terminal, `<span class="info">${feature}:</span> ${value.toFixed(3)}`);
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Mostrar proceso de árboles de decisión
    await typeTerminalText(terminal, `<span class="highlight">Evaluando árboles de decisión...</span>`);
    
    for (let i = 0; i < xgboostModel.trees.length; i++) {
        const tree = xgboostModel.trees[i];
        const featureValue = features[tree.feature];
        const path = featureValue <= tree.threshold ? "izquierda" : "derecha";
        const contribution = featureValue <= tree.threshold ? 
            tree.leftNode.value * tree.weight : 
            tree.rightNode.value * tree.weight;
        
        await typeTerminalText(terminal, `<span class="info">Árbol ${i+1} (${tree.feature}):</span> Valor=${featureValue.toFixed(3)}, Umbral=${tree.threshold}, Camino=${path}, Contribución=${contribution.toFixed(3)}`);
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // Obtener las probabilidades
    const xgboostProb = xgboostModel.predict(stats1, stats2);
    
    await typeTerminalText(terminal, `<span class="result">Probabilidad victoria ${team1} (XGBoost):</span> <span class="highlight">${xgboostProb.team1Win.toFixed(2)}%</span>`);
    await typeTerminalText(terminal, `<span class="result">Probabilidad empate (XGBoost):</span> <span class="highlight">${xgboostProb.draw.toFixed(2)}%</span>`);
    await typeTerminalText(terminal, `<span class="result">Probabilidad victoria ${team2} (XGBoost):</span> <span class="highlight">${xgboostProb.team2Win.toFixed(2)}%</span>`);
    
    // Determinar modelo más confiable
    const reliability = determineReliableModel(stats1, stats2, poissonProb, logisticProb, xgboostProb);
    
    await typeTerminalText(terminal, '\n$ Analizando confiabilidad de modelos...');
    await typeTerminalText(terminal, `<span class="highlight">Escenario detectado:</span> ${reliability.scenario}`);
    await typeTerminalText(terminal, `<span class="highlight">Modelo más confiable:</span> ${reliability.reliableModel}`);
    
    if (reliability.reliableModel === "Consenso") {
        await typeTerminalText(terminal, `<span class="info">Probabilidad consenso ${team1}:</span> <span class="result">${reliability.consensusProb.team1Win.toFixed(2)}%</span>`);
        await typeTerminalText(terminal, `<span class="info">Probabilidad consenso empate:</span> <span class="result">${reliability.consensusProb.draw.toFixed(2)}%</span>`);
        await typeTerminalText(terminal, `<span class="info">Probabilidad consenso ${team2}:</span> <span class="result">${reliability.consensusProb.team2Win.toFixed(2)}%</span>`);
    }
    
    // Actualizar resultados actuales con los nuevos modelos
    currentResults.logisticRegression = {
        team1Win: logisticProb.team1Win.toFixed(2),
        draw: logisticProb.draw.toFixed(2),
        team2Win: logisticProb.team2Win.toFixed(2)
    };
    
    currentResults.xgboost = {
        team1Win: xgboostProb.team1Win.toFixed(2),
        draw: xgboostProb.draw.toFixed(2),
        team2Win: xgboostProb.team2Win.toFixed(2)
    };
    
    currentResults.modelReliability = {
        scenario: reliability.scenario,
        reliableModel: reliability.reliableModel,
        consensusProb: reliability.consensusProb
    };
    
    // Crear gráfico comparativo de modelos
    createModelComparisonChart(team1, team2, poissonProb, logisticProb, xgboostProb);
    
    // Actualizar el modelo recomendado y la probabilidad más alta
    updateRecommendedModel();
    
    // Mostrar sección de resultados con animación
    await new Promise(resolve => setTimeout(resolve, 500));
    predictionResults.classList.add('show');
    
    // Mostrar equipo favorito (ahora que tenemos todos los modelos)
    document.getElementById('favorite-team').textContent = favoriteTeam;
};

// ... existing code ...

// ==========================================
// MÓDULO DE MACHINE LEARNING PARA TÁCTICAS
// ==========================================

// Dataset ficticio para entrenamiento de modelos
let ml_dataset = [];
let ml_model = null;
let ml_modelType = '';
let ml_accuracy = 0;
let currentTeam1 = null;
let currentTeam2 = null;

// Función para generar dataset ficticio
function generarDatasetTacticas(numRegistros = 500) {
    const dataset = [];
    const tacticas = [
        'Mantener 4-3-3 ofensivo',
        'Cambiar a 4-4-2 defensivo',
        'Presión alta y líneas adelantadas',
        'Jugar al contragolpe',
        'Bajar ritmo y mantener posesión',
        'Atacar por bandas',
        'Defensa con cinco jugadores'
    ];
    
    // Generar registros aleatorios
    for (let i = 0; i < numRegistros; i++) {
        // Generar estadísticas aleatorias realistas
        const goalsScored = Math.random() * 3 + 0.5; // 0.5 a 3.5
        const goalsConceded = Math.random() * 2.5 + 0.2; // 0.2 a 2.7
        const possession = Math.random() * 40 + 30; // 30 a 70
        const shotsOnTarget = Math.random() * 8 + 2; // 2 a 10
        const passingAccuracy = Math.random() * 20 + 70; // 70 a 90
        const fouls = Math.random() * 10 + 5; // 5 a 15
        const corners = Math.random() * 8 + 2; // 2 a 10
        const yellowCards = Math.random() * 3 + 0.5; // 0.5 a 3.5
        const redCards = Math.random() * 0.3; // 0 a 0.3
        
        // Asignar táctica basada en patrones realistas
        let tacticaIndex;
        
        // Equipos ofensivos con buena posesión
        if (goalsScored > 2.5 && possession > 60 && passingAccuracy > 85) {
            tacticaIndex = Math.random() > 0.5 ? 0 : 4; // 4-3-3 ofensivo o mantener posesión
        }
        // Equipos defensivos
        else if (goalsConceded < 1 && shotsOnTarget < 5) {
            tacticaIndex = Math.random() > 0.5 ? 1 : 6; // 4-4-2 defensivo o defensa con 5
        }
        // Equipos de presión
        else if (fouls > 12 && yellowCards > 2) {
            tacticaIndex = 2; // Presión alta
        }
        // Equipos de contragolpe
        else if (possession < 45 && goalsScored > 1.5) {
            tacticaIndex = 3; // Contragolpe
        }
        // Equipos de bandas
        else if (corners > 6) {
            tacticaIndex = 5; // Atacar por bandas
        }
        else {
            // Asignar aleatoriamente para el resto
            tacticaIndex = Math.floor(Math.random() * tacticas.length);
        }
        
        // Añadir registro al dataset
        dataset.push({
            features: [goalsScored, goalsConceded, possession, shotsOnTarget, 
                      passingAccuracy, fouls, corners, yellowCards, redCards],
            tactica: tacticas[tacticaIndex]
        });
    }
    
    return dataset;
}

// Función para normalizar datos
function normalizarDatos(datos) {
    // Calcular min y max para cada característica
    const numFeatures = datos[0].features.length;
    const mins = Array(numFeatures).fill(Infinity);
    const maxs = Array(numFeatures).fill(-Infinity);
    
    // Encontrar min y max
    for (const dato of datos) {
        for (let i = 0; i < numFeatures; i++) {
            mins[i] = Math.min(mins[i], dato.features[i]);
            maxs[i] = Math.max(maxs[i], dato.features[i]);
        }
    }
    
    // Normalizar datos
    const datosNormalizados = datos.map(dato => {
        const featuresNormalizados = dato.features.map((val, i) => {
            // Evitar división por cero
            return maxs[i] === mins[i] ? 0.5 : (val - mins[i]) / (maxs[i] - mins[i]);
        });
        
        return {
            features: featuresNormalizados,
            tactica: dato.tactica
        };
    });
    
    return {
        datosNormalizados,
        mins,
        maxs
    };
}

// Implementación simplificada de MLPClassifier
class MLPClassifier {
    constructor(hiddenLayerSizes = [10], learningRate = 0.01, maxIter = 100) {
        this.hiddenLayerSizes = hiddenLayerSizes;
        this.learningRate = learningRate;
        this.maxIter = maxIter;
        this.weights = [];
        this.biases = [];
        this.classes = [];
        this.accuracy = 0;
    }
    
    // Función de activación sigmoid
    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }
    
    // Derivada de sigmoid
    sigmoidDerivative(x) {
        const sig = this.sigmoid(x);
        return sig * (1 - sig);
    }
    
    // Entrenar el modelo
    fit(X, y) {
        // Obtener clases únicas
        this.classes = [...new Set(y)];
        const numClasses = this.classes.length;
        const numFeatures = X[0].length;
        
        // Inicializar pesos y sesgos
        const layerSizes = [numFeatures, ...this.hiddenLayerSizes, numClasses];
        
        for (let i = 0; i < layerSizes.length - 1; i++) {
            // Inicializar pesos con valores pequeños aleatorios
            const weights = Array(layerSizes[i + 1]).fill().map(() => 
                Array(layerSizes[i]).fill().map(() => Math.random() * 0.2 - 0.1)
            );
            
            // Inicializar sesgos con ceros
            const biases = Array(layerSizes[i + 1]).fill(0);
            
            this.weights.push(weights);
            this.biases.push(biases);
        }
        
        // Convertir etiquetas a one-hot encoding
        const yOneHot = y.map(label => {
            const encoded = Array(numClasses).fill(0);
            encoded[this.classes.indexOf(label)] = 1;
            return encoded;
        });
        
        // Entrenamiento con descenso de gradiente
        for (let iter = 0; iter < this.maxIter; iter++) {
            let totalError = 0;
            
            // Para cada ejemplo de entrenamiento
            for (let j = 0; j < X.length; j++) {
                // Forward pass
                const activations = [X[j]];
                const zs = [];
                
                for (let layer = 0; layer < this.weights.length; layer++) {
                    const z = Array(this.weights[layer].length).fill(0);
                    
                    // Calcular z = w*a + b
                    for (let neuron = 0; neuron < this.weights[layer].length; neuron++) {
                        for (let prev = 0; prev < activations[layer].length; prev++) {
                            z[neuron] += this.weights[layer][neuron][prev] * activations[layer][prev];
                        }
                        z[neuron] += this.biases[layer][neuron];
                    }
                    
                    zs.push(z);
                    
                    // Aplicar función de activación
                    const activation = z.map(val => this.sigmoid(val));
                    activations.push(activation);
                }
                
                // Calcular error
                const outputError = activations[activations.length - 1].map((a, i) => {
                    const error = a - yOneHot[j][i];
                    totalError += error * error;
                    return error;
                });
                
                // Backward pass
                let deltas = [outputError.map((err, i) => 
                    err * this.sigmoidDerivative(zs[zs.length - 1][i])
                )];
                
                // Propagar el error hacia atrás
                for (let layer = this.weights.length - 2; layer >= 0; layer--) {
                    const delta = Array(this.weights[layer].length).fill(0);
                    
                    for (let neuron = 0; neuron < this.weights[layer].length; neuron++) {
                        for (let next = 0; next < this.weights[layer + 1].length; next++) {
                            delta[neuron] += deltas[0][next] * this.weights[layer + 1][next][neuron];
                        }
                        delta[neuron] *= this.sigmoidDerivative(zs[layer][neuron]);
                    }
                    
                    deltas.unshift(delta);
                }
                
                // Actualizar pesos y sesgos
                for (let layer = 0; layer < this.weights.length; layer++) {
                    for (let neuron = 0; neuron < this.weights[layer].length; neuron++) {
                        for (let prev = 0; prev < this.weights[layer][neuron].length; prev++) {
                            this.weights[layer][neuron][prev] -= this.learningRate * deltas[layer][neuron] * activations[layer][prev];
                        }
                        this.biases[layer][neuron] -= this.learningRate * deltas[layer][neuron];
                    }
                }
            }
            
            // Calcular error promedio
            totalError /= X.length;
            
            // Salir temprano si el error es suficientemente pequeño
            if (totalError < 0.01) break;
        }
        
        // Calcular precisión en el conjunto de entrenamiento
        let correctPredictions = 0;
        for (let i = 0; i < X.length; i++) {
            const predicted = this.predict([X[i]])[0];
            if (predicted === y[i]) correctPredictions++;
        }
        this.accuracy = correctPredictions / X.length;
        
        return this;
    }
    
    // Predecir para nuevos datos
    predict(X) {
        return X.map(x => {
            // Forward pass
            let activation = x;
            
            for (let layer = 0; layer < this.weights.length; layer++) {
                const z = Array(this.weights[layer].length).fill(0);
                
                // Calcular z = w*a + b
                for (let neuron = 0; neuron < this.weights[layer].length; neuron++) {
                    for (let prev = 0; prev < activation.length; prev++) {
                        z[neuron] += this.weights[layer][neuron][prev] * activation[prev];
                    }
                    z[neuron] += this.biases[layer][neuron];
                }
                
                // Aplicar función de activación
                activation = z.map(val => this.sigmoid(val));
            }
            
            // Obtener la clase con mayor probabilidad
            let maxIndex = 0;
            for (let i = 1; i < activation.length; i++) {
                if (activation[i] > activation[maxIndex]) maxIndex = i;
            }
            
            return this.classes[maxIndex];
        });
    }
}

// Función para entrenar modelos
function entrenarModelos() {
    // Generar dataset
    ml_dataset = generarDatasetTacticas(500);
    
    // Separar características y etiquetas
    const X = ml_dataset.map(d => d.features);
    const y = ml_dataset.map(d => d.tactica);
    
    // Normalizar datos
    const { datosNormalizados, mins, maxs } = normalizarDatos(ml_dataset);
    const X_norm = datosNormalizados.map(d => d.features);
    
    // Guardar mins y maxs para normalizar nuevos datos
    ml_dataset.mins = mins;
    ml_dataset.maxs = maxs;
    
    // Entrenar modelo MLP
    ml_model = new MLPClassifier([15, 10], 0.01, 200);
    ml_model.fit(X_norm, y);
    ml_accuracy = ml_model.accuracy;
    ml_modelType = 'Red Neuronal Multicapa';
    
    console.log(`Modelo entrenado con precisión: ${(ml_accuracy * 100).toFixed(2)}%`);
}

// Función para normalizar nuevos datos
function normalizarNuevosDatos(datos) {
    if (!ml_dataset.mins || !ml_dataset.maxs) {
        console.error("No se han calculado los valores de normalización");
        return datos;
    }
    
    return datos.map((val, i) => {
        // Evitar división por cero
        return ml_dataset.maxs[i] === ml_dataset.mins[i] ? 
            0.5 : (val - ml_dataset.mins[i]) / (ml_dataset.maxs[i] - ml_dataset.mins[i]);
    });
}

// Función para recomendar táctica basada en estadísticas
function recomendar_tactica_ml(stats) {
    // Verificar que el modelo esté entrenado
    if (!ml_model) {
        console.error("El modelo no ha sido entrenado");
        return {
            tactica: "No disponible",
            explicacion: "El modelo de ML no ha sido entrenado correctamente.",
            modelo: "Ninguno",
            precision: 0
        };
    }
    
    // Extraer características en el mismo orden que el dataset
    const features = [
        stats.goalsScored,
        stats.goalsConceded,
        stats.possession,
        stats.shotsOnTarget,
        stats.passingAccuracy,
        stats.fouls,
        stats.corners,
        stats.yellowCards,
        stats.redCards
    ];
    
    // Normalizar datos
    const featuresNormalizados = normalizarNuevosDatos(features);
    
    // Realizar predicción
    const tacticaRecomendada = ml_model.predict([featuresNormalizados])[0];
    
    // Generar explicación basada en estadísticas
    let explicacion = "";
    
    if (tacticaRecomendada === "Mantener 4-3-3 ofensivo") {
        explicacion = `Con un promedio de ${stats.goalsScored.toFixed(1)} goles por partido y ${stats.possession.toFixed(1)}% de posesión, el equipo tiene un perfil ofensivo. La formación 4-3-3 permitirá maximizar el potencial de ataque manteniendo equilibrio defensivo.`;
    } else if (tacticaRecomendada === "Cambiar a 4-4-2 defensivo") {
        explicacion = `Con ${stats.goalsConceded.toFixed(1)} goles recibidos por partido, el equipo necesita reforzar su defensa. La formación 4-4-2 defensiva proporcionará mayor solidez y permitirá contragolpes efectivos.`;
    } else if (tacticaRecomendada === "Presión alta y líneas adelantadas") {
        explicacion = `Con ${stats.passingAccuracy.toFixed(1)}% de precisión en pases y ${stats.shotsOnTarget.toFixed(1)} tiros a puerta, el equipo puede beneficiarse de una presión alta para recuperar el balón en campo contrario y crear más oportunidades.`;
    } else if (tacticaRecomendada === "Jugar al contragolpe") {
        explicacion = `Con una posesión de ${stats.possession.toFixed(1)}% pero anotando ${stats.goalsScored.toFixed(1)} goles por partido, el equipo es eficiente en transiciones. El contragolpe permitirá aprovechar espacios y la velocidad de los delanteros.`;
    } else if (tacticaRecomendada === "Bajar ritmo y mantener posesión") {
        explicacion = `Con ${stats.passingAccuracy.toFixed(1)}% de precisión en pases y ${stats.possession.toFixed(1)}% de posesión, el equipo puede controlar el juego. Mantener la posesión desgastará al rival y creará oportunidades de calidad.`;
    } else if (tacticaRecomendada === "Atacar por bandas") {
        explicacion = `Con un promedio de ${stats.corners.toFixed(1)} córners por partido, el equipo muestra fortaleza en el juego por las bandas. Explotar esta vía de ataque generará más oportunidades de gol y centros peligrosos.`;
    } else if (tacticaRecomendada === "Defensa con cinco jugadores") {
        explicacion = `Con ${stats.goalsConceded.toFixed(1)} goles recibidos y ${stats.yellowCards.toFixed(1)} tarjetas amarillas por partido, una defensa de cinco proporcionará mayor solidez defensiva y reducirá la exposición a contraataques.`;
    }
    
    return {
        tactica: tacticaRecomendada,
        explicacion: explicacion,
        modelo: ml_modelType,
        precision: ml_accuracy
    };
}

// Inicializar el módulo ML cuando se cargue la página
document.addEventListener('DOMContentLoaded', function() {
    // Verificar si el botón existe
    const mlButton = document.getElementById('simulation-ml');
    if (mlButton) {
        mlButton.addEventListener('click', function() {
            // Verificar que hay datos de equipos
            if (!currentResults) {
                alert("Primero debes realizar una predicción antes de solicitar un análisis");
                return;
            }
            
            // Actualizar variables globales con los datos actuales
            currentTeam1 = {
                name: currentResults.team1.name,
                stats: currentResults.team1.stats
            };
            
            currentTeam2 = {
                name: currentResults.team2.name,
                stats: currentResults.team2.stats
            };
            
            // Mostrar cargando
            const mlResult = document.getElementById('ml-result');
            if (mlResult) {
                mlResult.innerHTML = `
  <style>
    @keyframes fillBar {
      from { width: 0%; }
      to   { width: 100%; }
    }
  </style>
  <div class="text-center mb-4">
    <h5>Analizando tácticas óptimas</h5>
    <div class="progress" style="height: 25px;">
      <div class="progress-bar bg-success" 
           role="progressbar"
           style="
             width: 0%;
             animation: fillBar 1s linear forwards;
           "
           aria-valuemin="0"
           aria-valuemax="100">
        <!-- Opcional: porcentaje fijo o vacío -->
      </div>
    </div>
  </div>
`;
                
                // Pequeño retraso para mostrar la animación de carga
                setTimeout(() => {
                    // Obtener recomendación para ambos equipos
                    const recomendacionEquipo1 = recomendar_tactica_ml(currentTeam1.stats);
                    const recomendacionEquipo2 = recomendar_tactica_ml(currentTeam2.stats);
                    
                    // Mostrar resultado para ambos equipos
                    mlResult.innerHTML = `
                        <div class="row">
                            <div class="col-md-6">
                                <div class="card bg-dark text-white mb-4">
                                    <div class="card-header bg-primary">
                                        <h5>Recomendación Táctica para ${currentTeam1.name}</h5>
                                    </div>
                                    <div class="card-body">
                                        <h4 class="text-success mb-3">${recomendacionEquipo1.tactica}</h4>
                                        <p>${recomendacionEquipo1.explicacion}</p>
                                        <div class="mt-3 pt-3 border-top border-secondary">
                                            <small class="text-muted">
                                                Modelo utilizado: ${recomendacionEquipo1.modelo} (Precisión: ${(recomendacionEquipo1.precision * 100).toFixed(2)}%)
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="card bg-dark text-white mb-4">
                                    <div class="card-header bg-danger">
                                        <h5>Recomendación Táctica para ${currentTeam2.name}</h5>
                                    </div>
                                    <div class="card-body">
                                        <h4 class="text-success mb-3">${recomendacionEquipo2.tactica}</h4>
                                        <p>${recomendacionEquipo2.explicacion}</p>
                                        <div class="mt-3 pt-3 border-top border-secondary">
                                            <small class="text-muted">
                                                Modelo utilizado: ${recomendacionEquipo2.modelo} (Precisión: ${(recomendacionEquipo2.precision * 100).toFixed(2)}%)
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }, 1500);
            }
        });
    }
    
    // Pre-entrenar modelos en segundo plano
    setTimeout(() => {
        console.log("Pre-entrenando modelos de ML...");
        entrenarModelos();
    }, 3000);
});