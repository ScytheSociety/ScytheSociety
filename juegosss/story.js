/**
 * Hell Shooter - Story System
 * Sistema de historia y selector de música
 */

const StorySystem = {
  // Modal de historia
  showStory() {
    const storyModal = document.createElement("div");
    storyModal.id = "story-modal";
    storyModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            overflow-y: auto;
            padding: 20px;
        `;

    storyModal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #1a0000 0%, #4a0000 100%);
                border: 3px solid #8B0000;
                border-radius: 20px;
                padding: 30px;
                max-width: 800px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 0 30px #FF0000;
                position: relative;
            ">
                <button onclick="closeStory()" style="
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: #8B0000;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    font-size: 20px;
                    cursor: pointer;
                ">✕</button>

                <h2 style="
                    text-align: center;
                    color: #FF0000;
                    text-shadow: 0 0 20px #FF0000;
                    margin-bottom: 20px;
                    font-size: 2em;
                ">La Leyenda de Hell</h2>

                <img src="../imagenes/imagenesjuegosss/hell_story.jpg" style="
                    width: 100%;
                    max-width: 600px;
                    height: auto;
                    border-radius: 15px;
                    margin: 0 auto 20px;
                    display: block;
                    box-shadow: 0 0 20px #000;
                " alt="Hell - La Guardiana">

                <div style="
                    color: #FFF;
                    line-height: 1.8;
                    font-size: 16px;
                    text-align: justify;
                ">
                    <p style="font-style: italic; color: #FFB6C1;">
                        "En las profundidades del inframundo, donde las almas perdidas vagan sin descanso..."
                    </p>
                    
                    <p>Hell era una niña elegida por el destino para proteger el <strong style="color: #FFD700;">Osario Eterno</strong>, 
                    el lugar sagrado donde descansan los huesos de antiguos guerreros caídos en batalla. 
                    Estos huesos no eran simples restos, sino recipientes del honor y la valentía de quienes dieron su vida por proteger el equilibrio entre los mundos.</p>

                    <p>Un día fatídico, el <strong style="color: #FF0000;">Rey Poring</strong> y su ejército de criaturas corrompidas invadieron el reino oscuro. 
                    Su objetivo: robar las almas de los guerreros para crear un ejército invencible y conquistar tanto el inframundo como el mundo de los vivos.</p>

                    <h3 style="color: #FF6B6B; margin-top: 20px;">El Viaje de Hell</h3>
                    
                    <p><strong style="color: #FFD700;">Niveles 1-3:</strong> Los Porings, Drops y Lunatics fueron los primeros en ser corrompidos. 
                    Pequeños pero numerosos, atacan en hordas interminables.</p>

                    <p><strong style="color: #FFD700;">Niveles 4-6:</strong> Tarou, Chonchon y Picky representan la segunda oleada. 
                    Más agresivos y rápidos, han perdido toda su humanidad.</p>

                    <p><strong style="color: #FFD700;">Niveles 7-9:</strong> Fabre, Pupa y Butterfly simbolizan la corrupción de la naturaleza misma. 
                    La transformación oscura ha alcanzado hasta a las criaturas más puras.</p>

                    <p><strong style="color: #FFD700;">Nivel 10:</strong> Baphomet Jr., el lugarteniente del Rey Poring, 
                    guarda la entrada al trono con poderes demoníacos robados.</p>

                    <p><strong style="color: #FFD700;">Nivel 11:</strong> El Rey Poring, hinchado con el poder de miles de almas robadas, 
                    espera en su trono de huesos. Solo Hell puede detenerlo y liberar las almas atrapadas.</p>

                    <p style="font-style: italic; text-align: center; color: #FFB6C1; margin-top: 30px;">
                        "Cada hueso que lanza está imbuido con el espíritu de un guerrero caído que busca venganza..."
                    </p>
                </div>
            </div>
        `;

    document.body.appendChild(storyModal);
  },

  // Modal de selector de música
  showMusicSelector() {
    const musicModal = document.createElement("div");
    musicModal.id = "music-modal";
    musicModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

    const tracks = [
      { file: "background.mp3", name: "Azkal - Elegía", icon: "🎵" },
      { file: "bgm_menu.mp3", name: "Menú Épico", icon: "🎹" },
      { file: "bgm_battle1.mp3", name: "Batalla Intensa", icon: "⚔️" },
      { file: "bgm_battle2.mp3", name: "Batalla Heroica", icon: "🗡️" },
      { file: "bgm_boss.mp3", name: "Boss Final", icon: "👹" },
      { file: "bgm_epic.mp3", name: "Épica Total", icon: "🔥" },
    ];

    musicModal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #1a0000 0%, #4a0000 100%);
                border: 3px solid #8B0000;
                border-radius: 20px;
                padding: 30px;
                max-width: 500px;
                box-shadow: 0 0 30px #FF0000;
                position: relative;
            ">
                <button onclick="closeMusicSelector()" style="
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: #8B0000;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 40px;
                    height: 40px;
                    font-size: 20px;
                    cursor: pointer;
                ">✕</button>

                <h2 style="
                    text-align: center;
                    color: #FF0000;
                    text-shadow: 0 0 20px #FF0000;
                    margin-bottom: 25px;
                ">🎵 Selector de Música 🎵</h2>

                <div style="display: flex; flex-direction: column; gap: 12px;">
                    ${tracks
                      .map(
                        (track, index) => `
                        <button onclick="selectMusic('${track.file}')" style="
                            background: linear-gradient(135deg, #2a0000 0%, #5a0000 100%);
                            color: white;
                            border: 2px solid #8B0000;
                            border-radius: 10px;
                            padding: 15px 20px;
                            font-size: 16px;
                            cursor: pointer;
                            transition: all 0.3s;
                            display: flex;
                            align-items: center;
                            gap: 10px;
                        " onmouseover="this.style.background='linear-gradient(135deg, #5a0000 0%, #8a0000 100%)'; this.style.transform='scale(1.05)'" 
                           onmouseout="this.style.background='linear-gradient(135deg, #2a0000 0%, #5a0000 100%)'; this.style.transform='scale(1)'">
                            <span style="font-size: 24px;">${track.icon}</span>
                            <span>${track.name}</span>
                        </button>
                    `
                      )
                      .join("")}
                </div>

                <div style="
                    margin-top: 20px;
                    text-align: center;
                    color: #AAA;
                    font-size: 14px;
                ">
                    <p>Música actual: <span id="current-track" style="color: #FFD700;">Tema Original</span></p>
                </div>
            </div>
        `;

    document.body.appendChild(musicModal);
  },
};

// Funciones globales para el HTML
window.showStory = () => StorySystem.showStory();
window.showMusicSelector = () => StorySystem.showMusicSelector();

window.closeStory = () => {
  const modal = document.getElementById("story-modal");
  if (modal) modal.remove();
};

window.closeMusicSelector = () => {
  const modal = document.getElementById("music-modal");
  if (modal) modal.remove();
};

window.selectMusic = (trackFile) => {
  // Detener música actual
  if (AudioManager.sounds.background) {
    AudioManager.stopBackgroundMusic();
  }

  // Cambiar a nueva pista
  AudioManager.sounds.background.audio.src = `sounds/${trackFile}`;
  AudioManager.sounds.background.audio.load();

  // Actualizar display
  const trackName = trackFile
    .replace(".mp3", "")
    .replace("bgm_", "")
    .replace("_", " ");
  document.getElementById("current-track").textContent = trackName;

  console.log(`🎵 Música cambiada a: ${trackFile}`);
};
