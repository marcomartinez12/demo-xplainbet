// Controlador de música phonk para XplainBet

class PhonkMusicPlayer {
    constructor() {
        this.audio = null;
        this.isPlaying = false;
        
        // Probar múltiples rutas posibles para encontrar el archivo
        this.playlist = [
            window.location.origin + '/static/audio/phonk_music.mp3',
            '/static/audio/phonk_music.mp3',
            './static/audio/phonk_music.mp3',
            '../static/audio/phonk_music.mp3',
            '../../static/audio/phonk_music.mp3',
            '/audio/phonk_music.mp3',
            'phonk_music.mp3',
            'c:/xplainbet-git/demo-xplainbet/static/audio/phonk_music.mp3'
        ];
        
        this.debug = true; // Habilitar mensajes de depuración
        
        if (this.debug) {
            console.log('URLs a probar:', this.playlist);
            console.log('Ubicación actual:', window.location.href);
            console.log('Origen:', window.location.origin);
        }
        
        this.initialize();
    }

    initialize() {
        // Crear elemento de audio y configurarlo directamente
        this.audio = new Audio();
        
        // Canción phonk específica solicitada por el usuario - probando diferentes formatos de ruta
        this.playlist = [
            '/static/audio/phonk_music.mp3', // Ruta absoluta desde la raíz del servidor
            './static/audio/phonk_music.mp3', // Ruta relativa
            window.location.origin + '/static/audio/phonk_music.mp3', // Ruta absoluta completa
            'http://127.0.0.1:5000/static/audio/phonk_music.mp3' // URL directa
        ];

        // Configurar el audio para que se reproduzca en bucle
        this.audio.loop = true;
        
        // Establecer volumen inicial
        this.audio.volume = 0.5;
        
        // Intentar precargar el audio
        try {
            this.audio.src = this.playlist[0];
            this.audio.load();
            console.log('Audio precargado con la ruta:', this.playlist[0]);
        } catch (error) {
            console.error('Error al precargar el audio:', error);
        }
    }

    play() {
        if (!this.isPlaying) {
            this.tryPlayWithNextUrl(0);
        }
    }
    
    // Método para intentar reproducir con diferentes URLs hasta que una funcione
    tryPlayWithNextUrl(index) {
        if (index >= this.playlist.length) {
            console.error('No se pudo reproducir el audio con ninguna de las URLs disponibles');
            alert('No se pudo reproducir el audio. Por favor, verifica que el archivo exista y sea accesible.');
            return;
        }
        
        try {
            const songUrl = this.playlist[index];
            console.log(`Intento ${index + 1}/${this.playlist.length}: Reproduciendo desde URL:`, songUrl);
            
            // Crear un nuevo elemento de audio para cada intento
            this.audio = new Audio();
            this.audio.src = songUrl;
            this.audio.volume = 0.5;
            this.audio.loop = true;
            
            // Manejar el evento de error para probar la siguiente URL
            this.audio.addEventListener('error', (e) => {
                console.error(`Error con URL ${index + 1}/${this.playlist.length}:`, e);
                console.error('Código de error:', this.audio.error ? this.audio.error.code : 'desconocido');
                console.error('Mensaje de error:', this.audio.error ? this.audio.error.message : 'desconocido');
                
                // Intentar con la siguiente URL
                this.tryPlayWithNextUrl(index + 1);
            });
            
            // Manejar el evento de éxito
            this.audio.addEventListener('canplay', () => {
                console.log(`URL ${index + 1}/${this.playlist.length} está lista para reproducirse:`, songUrl);
            });
            
            // Intentar reproducir
            this.audio.play()
                .then(() => {
                    this.isPlaying = true;
                    console.log(`¡Éxito! Reproduciendo con URL ${index + 1}/${this.playlist.length}:`, songUrl);
                    
                    // Añadir clase visual para indicar que está sonando
                    const phonkControls = document.querySelector('.phonk-controls');
                    if (phonkControls) {
                        phonkControls.classList.add('playing');
                    }
                    
                    // Actualizar el botón de música
                    const togglePhonkBtn = document.getElementById('toggle-phonk-btn');
                    if (togglePhonkBtn) {
                        togglePhonkBtn.innerHTML = '<i class="fas fa-pause me-1"></i>Pausar Música';
                        togglePhonkBtn.classList.remove('btn-outline-success');
                        togglePhonkBtn.classList.add('btn-outline-danger');
                    }
                })
                .catch(error => {
                    console.error(`Error al reproducir con URL ${index + 1}/${this.playlist.length}:`, error);
                    
                    // Intentar con la siguiente URL
                    this.tryPlayWithNextUrl(index + 1);
                });
        } catch (error) {
            console.error(`Error general con URL ${index + 1}/${this.playlist.length}:`, error);
            
            // Intentar con la siguiente URL
            this.tryPlayWithNextUrl(index + 1);
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