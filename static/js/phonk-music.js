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
            'https://audio-previews.elements.envatousercontent.com/files/273402066/preview.mp3' // KORDHELL - MURDER IN MY MIND (versión adaptada para web)
        ];

        // Configurar el audio para que se reproduzca en bucle
        this.audio.loop = true;
        
        // Establecer volumen inicial
        this.audio.volume = 0.5;
    }

    play() {
        if (!this.isPlaying) {
            // Seleccionar una canción aleatoria de la lista
            const randomIndex = Math.floor(Math.random() * this.playlist.length);
            this.audio.src = this.playlist[randomIndex];
            
            // Reproducir la música
            this.audio.play()
                .then(() => {
                    this.isPlaying = true;
                    console.log('Reproduciendo KORDHELL - MURDER IN MY MIND');
                    
                    // Añadir clase visual para indicar que está sonando
                    const phonkControls = document.querySelector('.phonk-controls');
                    if (phonkControls) {
                        phonkControls.classList.add('playing');
                    }
                })
                .catch(error => {
                    console.error('Error al reproducir música:', error);
                });
        }
    }

    pause() {
        if (this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
            console.log('KORDHELL - MURDER IN MY MIND pausada');
            
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