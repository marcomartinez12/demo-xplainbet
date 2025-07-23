// Controlador de música phonk para XplainBet

class PhonkMusicPlayer {
    constructor() {
        this.audio = null;
        this.isPlaying = false;
        this.initialize();
    }

    initialize() {
        // Crear elemento de audio
        this.audio = new Audio();
        
        // Canción phonk específica solicitada por el usuario
        this.playlist = [
            '/static/audio/phonk_music.mp3' // Archivo de música phonk local
        ];

        // Configurar el audio para que se reproduzca en bucle
        this.audio.loop = true;
        
        // Establecer volumen inicial
        this.audio.volume = 0.5;
    }

    play() {
        if (!this.isPlaying) {
            try {
                // Seleccionar una canción aleatoria de la lista
                const randomIndex = Math.floor(Math.random() * this.playlist.length);
                const songUrl = this.playlist[randomIndex];
                console.log('Intentando reproducir canción desde URL:', songUrl);
                
                this.audio.src = songUrl;
                
                // Añadir manejadores de eventos para depuración
                this.audio.addEventListener('canplay', () => {
                    console.log('El audio está listo para reproducirse');
                });
                
                this.audio.addEventListener('error', (e) => {
                    console.error('Error en el elemento de audio:', e);
                    console.error('Código de error:', this.audio.error ? this.audio.error.code : 'desconocido');
                    console.error('Mensaje de error:', this.audio.error ? this.audio.error.message : 'desconocido');
                });
                
                // Reproducir la música
                this.audio.play()
                    .then(() => {
                        this.isPlaying = true;
                        console.log('Reproduciendo música phonk descargada');
                        
                        // Añadir clase visual para indicar que está sonando
                        const phonkControls = document.querySelector('.phonk-controls');
                        if (phonkControls) {
                            phonkControls.classList.add('playing');
                        }
                    })
                    .catch(error => {
                        console.error('Error al reproducir música:', error);
                    });
            } catch (error) {
                console.error('Error general al intentar reproducir:', error);
            }
        }
    }

    pause() {
        if (this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
            console.log('Música phonk pausada');
            
            // Quitar clase visual cuando se pausa la música
            const phonkControls = document.querySelector('.phonk-controls');
            if (phonkControls) {
                phonkControls.classList.remove('playing');
            }
        }
    }

    setVolume(volume) {
        // Asegurar que el volumen esté entre 0 y 1
        const newVolume = Math.max(0, Math.min(1, volume));
        this.audio.volume = newVolume;
    }
}

// Exportar la clase para su uso en otros archivos
window.PhonkMusicPlayer = PhonkMusicPlayer;