from flask import Flask, render_template, request, jsonify
from dotenv import load_dotenv
import requests
import os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io
import base64
import numpy as np
import time
import logging
import json

# Configuración de logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# Carga variables de entorno desde .env
load_dotenv()

app = Flask(__name__)

# API Key de OpenRouter
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
if not OPENROUTER_API_KEY:
    raise RuntimeError(
        "📣 La variable OPENROUTER_API_KEY no está definida.\n"
        "   ➜ Crea un archivo .env en la raíz con:\n"
        "     OPENROUTER_API_KEY=tu_api_key_aqui"
    )

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/get_explanation', methods=['POST'])
def get_explanation():
    """
    Obtiene la explicación detallada de la predicción utilizando OpenRouter
    """
    start_time = time.time()
    try:
        data = request.json
        if not data:
            app.logger.error("No se proporcionaron datos en la solicitud")
            return jsonify({"error": "No se proporcionaron datos"}), 400

        # Validación de campos requeridos
        required_fields = ['team1', 'team2', 'favoriteTeam', 'winProbability']
        for field in required_fields:
            if field not in data:
                app.logger.error(f"Falta el campo requerido: {field}")
                return jsonify({"error": f"Falta el campo requerido: {field}"}), 400

        team1 = data['team1']
        team2 = data['team2']
        favorite_team = data['favoriteTeam']
        win_probability = data['winProbability']
        
        # Obtener información del modelo recomendado si está disponible
        recommended_model = data.get('modelReliability', {}).get('reliableModel', 'Poisson')
        model_scenario = data.get('modelReliability', {}).get('scenario', '')
        
        # Obtener probabilidades de los diferentes modelos
        poisson_prob = None
        logistic_prob = None
        xgboost_prob = None
        
        if favorite_team == team1['name']:
            poisson_prob = team1.get('winProbability', 0)
            logistic_prob = data.get('logisticRegression', {}).get('team1Win', 0)
            xgboost_prob = data.get('xgboost', {}).get('team1Win', 0)
        elif favorite_team == team2['name']:
            poisson_prob = team2.get('winProbability', 0)
            logistic_prob = data.get('logisticRegression', {}).get('team2Win', 0)
            xgboost_prob = data.get('xgboost', {}).get('team2Win', 0)
        else:
            # Si es empate
            poisson_prob = data.get('drawProbability', 0)
            logistic_prob = data.get('logisticRegression', {}).get('draw', 0)
            xgboost_prob = data.get('xgboost', {}).get('draw', 0)

        # Construir prompt para la API
        prompt = f"""
Actúa como un analista deportivo experto y explica detalladamente por qué {favorite_team} tiene {win_probability}% de probabilidad de ganar contra su oponente según las siguientes estadísticas:

Equipo 1: {team1['name']}
- Goles promedio anotados: {team1['stats']['goalsScored']}
- Goles promedio recibidos: {team1['stats']['goalsConceded']}
- Posesión de balón: {team1['stats']['possession']}%
- Tiros a puerta por partido: {team1['stats']['shotsOnTarget']}
- Precisión de pases: {team1['stats']['passingAccuracy']}%
- Faltas cometidas: {team1['stats']['fouls']}
- Promedio de corners: {team1['stats']['corners']}
- Tarjetas amarillas: {team1['stats']['yellowCards']}
- Tarjetas rojas: {team1['stats']['redCards']}

Equipo 2: {team2['name']}
- Goles promedio anotados: {team2['stats']['goalsScored']}
- Goles promedio recibidos: {team2['stats']['goalsConceded']}
- Posesión de balón: {team2['stats']['possession']}%
- Tiros a puerta por partido: {team2['stats']['shotsOnTarget']}
- Precisión de pases: {team2['stats']['passingAccuracy']}%
- Faltas cometidas: {team2['stats']['fouls']}
- Promedio de corners: {team2['stats']['corners']}
- Tarjetas amarillas: {team2['stats']['yellowCards']}
- Tarjetas rojas: {team2['stats']['redCards']}

Puntuación calculada:
- {team1['name']}: {team1.get('score', team1.get('lambda', 0))} puntos ({team1.get('probability', team1.get('winProbability'))}%)
- {team2['name']}: {team2.get('score', team2.get('lambda', 0))} puntos ({team2.get('probability', team2.get('winProbability'))}%)

Resultados de diferentes modelos predictivos:
- Modelo de Poisson: {poisson_prob}%
- Modelo de Regresión Logística: {logistic_prob}%
- Modelo XGBoost: {xgboost_prob}%

Modelo recomendado: {recommended_model}
Escenario detectado: {model_scenario}

Por favor, proporciona una explicación detallada y personalizada de por qué {favorite_team} tiene mayor probabilidad de ganar, basándote en las estadísticas proporcionadas. Compara los puntos fuertes y débiles de ambos equipos. Explica también por qué el modelo {recommended_model} es el más confiable para este escenario específico. Usa un tono profesional pero amigable, como si estuvieras explicando en un programa deportivo.
"""

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPENROUTER_API_KEY}"
        }

        # Lista de modelos a probar, en orden de preferencia
        fallback_models = [
        "meta-llama/llama-4-maverick:free",
        "moonshotai/kimi-vl-a3b-thinking:free",
        "mistralai/mistral-small-3:free"
        ]

        
        # Intentar con cada modelo hasta que uno funcione
        explanation = None
        for model in fallback_models:
            try:
                payload = {
                    "model": model,
                    "messages": [
                        {"role": "system", "content": "Eres un analista deportivo experto que proporciona explicaciones detalladas sobre predicciones de partidos de fútbol basadas en estadísticas."},
                        {"role": "user", "content": prompt}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 1000
                }

                app.logger.info(f"Enviando solicitud a OpenRouter con modelo {model}")
                response = requests.post(
                    OPENROUTER_API_URL,
                    headers=headers,
                    json=payload,
                    timeout=None
                )

                if response.status_code == 200:
                    result = response.json()
                    if 'choices' in result and result['choices']:
                        explanation = result['choices'][0]['message']['content']
                        app.logger.info(f"Respuesta exitosa del modelo {model}")
                        break
                    else:
                        app.logger.warning(f"Respuesta vacía del modelo {model}: {result}")
                else:
                    app.logger.warning(f"Error con el modelo {model}: {response.status_code} - {response.text}")
            
            except Exception as e:
                app.logger.warning(f"Error al usar el modelo {model}: {e}")
                continue

        if not explanation:
            return jsonify({"error": "No se pudo obtener una respuesta de ningún modelo disponible"}), 500

        elapsed_time = time.time() - start_time
        app.logger.info(f"Análisis completado en {elapsed_time:.2f}s")

        return jsonify({"explanation": explanation})

    except requests.exceptions.Timeout:
        app.logger.error("Timeout en la solicitud a OpenRouter")
        return jsonify({"error": "Timeout en la solicitud a OpenRouter. Intenta nuevamente."}), 504

    except requests.exceptions.ConnectionError:
        app.logger.error("Error de conexión con OpenRouter")
        return jsonify({"error": "No se pudo conectar a OpenRouter."}), 503

    except Exception as e:
        app.logger.error(f"Error inesperado: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route('/generate_chart', methods=['POST'])
def generate_chart():
    try:
        data = request.json
        team1 = data['team1']
        team2 = data['team2']

        # Crear figura con tema oscuro para coincidir con la UI
        plt.style.use('dark_background')
        fig, ax = plt.subplots(figsize=(10, 6))
        
        # Lista expandida de estadísticas para mostrar
        stats = ['goalsScored', 'goalsConceded', 'possession', 'shotsOnTarget', 'passingAccuracy']
        labels = ['Goles anotados', 'Goles recibidos', 'Posesión', 'Tiros a puerta', 'Precisión pases']

        x = np.arange(len(labels))
        width = 0.35

        values1 = [team1['stats'][stat] for stat in stats]
        values2 = [team2['stats'][stat] for stat in stats]

        # Colores que coinciden con el frontend
        bars1 = ax.bar(x - width/2, values1, width, label=team1['name'], color='#36a2eb', alpha=0.8)
        bars2 = ax.bar(x + width/2, values2, width, label=team2['name'], color='#ff6384', alpha=0.8)

        # Añadir valores encima de las barras
        def add_values_above_bars(bars):
            for bar in bars:
                height = bar.get_height()
                ax.text(bar.get_x() + bar.get_width()/2., height + 0.1,
                        f'{height:.1f}', ha='center', va='bottom', color='white', fontsize=9)

        add_values_above_bars(bars1)
        add_values_above_bars(bars2)

        ax.set_title('Comparación de Estadísticas', color='white', fontsize=14)
        ax.set_xticks(x)
        ax.set_xticklabels(labels, color='white')
        ax.legend(framealpha=0.8)
        
        # Mejoras visuales
        plt.grid(axis='y', linestyle='--', alpha=0.3)
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.spines['bottom'].set_color('#ffffff')
        ax.spines['left'].set_color('#ffffff')
        
        # Fondo transparente para mejor integración con el tema oscuro de la web
        fig.patch.set_alpha(0.0)
        ax.patch.set_alpha(0.1)

        buf = io.BytesIO()
        fig.tight_layout()
        plt.savefig(buf, format='png', dpi=100, transparent=True)
        buf.seek(0)
        img_data = base64.b64encode(buf.getvalue()).decode('utf-8')
        plt.close(fig)

        return jsonify({"chart": f"data:image/png;base64,{img_data}"})

    except Exception as e:
        app.logger.error(f"Error al generar gráfico: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route('/save_prediction', methods=['POST'])
def save_prediction():
    """
    Guarda los resultados de la predicción para futuras referencias
    """
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No se proporcionaron datos"}), 400
            
        # Crear directorio si no existe
        predictions_dir = os.path.join(os.path.dirname(__file__), 'predictions')
        os.makedirs(predictions_dir, exist_ok=True)
        
        # Generar nombre de archivo con timestamp
        timestamp = int(time.time())
        filename = f"prediction_{timestamp}.json"
        filepath = os.path.join(predictions_dir, filename)
        
        # Guardar predicción
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        return jsonify({
            "success": True, 
            "message": "Predicción guardada correctamente",
            "filename": filename
        })
        
    except Exception as e:
        app.logger.error(f"Error al guardar predicción: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route('/get_historical', methods=['GET'])
def get_historical():
    """
    Obtiene las predicciones históricas guardadas
    """
    try:
        predictions_dir = os.path.join(os.path.dirname(__file__), 'predictions')
        if not os.path.exists(predictions_dir):
            return jsonify({"predictions": []})
            
        files = os.listdir(predictions_dir)
        predictions = []
        
        for file in sorted(files, reverse=True)[:10]:  # Mostrar solo las 10 más recientes
            if file.endswith('.json'):
                try:
                    with open(os.path.join(predictions_dir, file), 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        # Extraer información relevante
                        predictions.append({
                            "id": file.replace("prediction_", "").replace(".json", ""),
                            "team1": data.get("team1", {}).get("name", "Equipo 1"),
                            "team2": data.get("team2", {}).get("name", "Equipo 2"),
                            "favoriteTeam": data.get("favoriteTeam", "Desconocido"),
                            "winProbability": data.get("winProbability", "N/A"),
                            "timestamp": int(file.replace("prediction_", "").replace(".json", ""))
                        })
                except Exception as e:
                    app.logger.error(f"Error al procesar archivo {file}: {e}")
                    
        return jsonify({"predictions": predictions})
        
    except Exception as e:
        app.logger.error(f"Error al obtener predicciones históricas: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.errorhandler(404)
def page_not_found(e):
    return jsonify({"error": "Ruta no encontrada"}), 404


@app.errorhandler(500)
def internal_server_error(e):
    return jsonify({"error": "Error interno del servidor"}), 500


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.logger.info(f"Iniciando servidor en puerto {port}")
    app.run(host='0.0.0.0', port=port, debug=True)