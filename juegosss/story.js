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
                background: linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 50%, #2a0a0a 100%);
                border: 3px solid #4a0a0a;
                border-radius: 20px;
                padding: 30px;
                max-width: 800px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 0 40px #660000, inset 0 0 20px #1a0000;
                position: relative;
                backdrop-filter: blur(5px);
            ">
                <button onclick="closeStory()" style="
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: #4a0a0a;
                    color: #cccccc;
                    border: 2px solid #660000;
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    min-width: 32px;
                    min-height: 32px;
                    max-width: 32px;
                    max-height: 32px;
                    font-size: 18px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-sizing: border-box;
                    padding: 0;
                    line-height: 1;
                    aspect-ratio: 1 / 1;
                    transition: all 0.3s ease;
                " onmouseover="this.style.background='#660000'; this.style.color='white';" 
                   onmouseout="this.style.background='#4a0a0a'; this.style.color='#cccccc';">✕</button>

                <h2 style="
                    text-align: center;
                    color: #b30000;
                    text-shadow: 0 0 30px #990000, 0 0 50px #660000;
                    margin-bottom: 25px;
                    font-size: 2.2em;
                    font-family: 'Serif', serif;
                    letter-spacing: 2px;
                ">La Maldición de Hell</h2>

                <img src="../imagenes/imagenesjuegosss/hell_story.jpg" style="
                    width: 100%;
                    max-width: 600px;
                    height: auto;
                    border-radius: 15px;
                    margin: 0 auto 25px;
                    display: block;
                    box-shadow: 0 0 30px #000000, 0 0 50px #330000;
                    filter: sepia(20%) saturate(80%) hue-rotate(320deg);
                " alt="Hell - La Guardiana de los Huesos">

                <div style="
                    color: #e6e6e6;
                    line-height: 1.9;
                    font-size: 16px;
                    text-align: justify;
                    font-family: 'Serif', serif;
                ">
                    <p style="
                        font-style: italic; 
                        color: #cc9999; 
                        text-align: center;
                        font-size: 18px;
                        margin-bottom: 25px;
                        text-shadow: 0 0 10px #990000;
                    ">
                        "En las profundidades donde el eco de los lamentos nunca cesa, donde la muerte abraza a los vivos..."
                    </p>
                    
                    <p><strong style="color: #ff6666;">Hell</strong> no es una niña común. Es un esqueleto viviente, 
                    condenada por la eternidad a vagar por la maldita <strong style="color: #ffcc66;">Cueva de los Lamentos</strong>, 
                    un lugar olvidado por los dioses y abandonado por la esperanza. Sus huesos blanquecinos brillan con una luz espectral, 
                    y sus cuencas vacías arden con el fuego de las almas perdidas que protege.</p>

                    <p>La cueva, aparentemente habitada por criaturas débiles e inofensivas, es en realidad una trampa mortal. 
                    <em style="color: #cc9999;">Los aventureros llegan buscando la fortuna prometida por el legendario Rey Poring, 
                    pero ninguno... absolutamente ninguno... ha regresado jamás para contarlo.</em></p>

                    <h3 style="
                        color: #b30000; 
                        margin: 25px 0 15px 0;
                        text-shadow: 0 0 15px #660000;
                        font-size: 1.4em;
                    ">El Ritual Macabro</h3>
                    
                    <p style="background: rgba(102, 0, 0, 0.1); padding: 15px; border-left: 4px solid #660000; margin: 20px 0;">
                    <strong style="color: #ff9999;">Los Niveles del Horror:</strong><br><br>
                    Cada nivel de la cueva está sembrado con los restos de aquellos que cayeron antes. 
                    Hell camina entre las sombras, recogiendo los huesos blanqueados de guerreros, magos, arqueros y ladrones. 
                    Con cada hueso que toca, absorbe los últimos susurros de terror de sus almas atormentadas.</p>

                    <p><strong style="color: #ffcc66;">Niveles 1-3:</strong> <em>Los Ecos del Primer Descenso</em><br>
                    Aquí yacen los novatos, aquellos que subestimaron la cueva. Sus huesos aún conservan la inocencia perdida. 
                    Los Porings, Drops y Lunatics devoran lentamente sus recuerdos, alimentándose del miedo que una vez sintieron.</p>

                    <p><strong style="color: #ffcc66;">Niveles 4-6:</strong> <em>El Susurro de la Desesperación</em><br>
                    Los aventureros experimentados que llegaron más lejos. Sus esqueletos cuentan historias de batallas feroces 
                    contra Tarou, Chonchon y Picky, criaturas que se volvieron más sanguinarias con cada alma que consumieron.</p>

                    <p><strong style="color: #ffcc66;">Niveles 7-9:</strong> <em>La Metamorfosis del Terror</em><br>
                    En estas profundidades, hasta la naturaleza se corrompió. Fabre, Pupa y Butterfly no son insectos, 
                    sino manifestaciones físicas de las pesadillas de los caídos. Sus huesos están marcados con cicatrices de terror puro.</p>

                    <p><strong style="color: #ffcc66;">Nivel 10:</strong> <em>El Guardián de la Perdición</em><br>
                    <strong style="color: #ff6666;">Baphomet Jr.</strong> no es solo un monstruo, es el eco vengativo de todos los aventureros 
                    que casi llegaron al final. Sus huesos son los más valiosos, imbuidos con la furia de la derrota.</p>

                    <p><strong style="color: #ffcc66;">Nivel 11:</strong> <em>El Trono de Huesos</em><br>
                    <strong style="color: #ff3333;">El Rey Poring</strong> no es lo que parece. Es una entidad ancestral que se alimenta del terror 
                    y la desesperación. Ha construido su trono con los cráneos de mil aventureros, y cada uno de ellos aún grita en silencio. 
                    Usa trucos viles: invoca las almas de los caídos para confundir a Hell, crea ilusiones de esperanza solo para destrozarlas, 
                    y cuando se ve acorralado, no duda en usar los propios huesos de los aventureros como armas contra su protectora.</p>

                    <div style="
                        background: linear-gradient(135deg, #1a0000 0%, #330000 100%);
                        padding: 20px;
                        border-radius: 10px;
                        margin: 25px 0;
                        border: 2px solid #660000;
                        box-shadow: inset 0 0 20px #000000;
                    ">
                        <h4 style="color: #ff9999; margin-bottom: 15px; text-align: center;">La Maldición de Hell</h4>
                        <p style="color: #cccccc; text-align: center; font-style: italic;">
                        Hell está condenada a repetir este ciclo eternamente. Con cada hueso que lanza, 
                        libera temporalmente el alma atrapada en él, pero el precio es que debe continuar su búsqueda infinita. 
                        Solo derrotando al Rey Poring puede romper la maldición... pero cada vez que lo logra, 
                        el tiempo se reinicia y todo vuelve a comenzar, con nuevos aventureros llegando a la cueva, 
                        buscando la misma fortuna maldita que los condenará.
                        </p>
                    </div>

                    <p style="
                        font-style: italic; 
                        text-align: center; 
                        color: #cc9999; 
                        margin-top: 30px;
                        font-size: 18px;
                        text-shadow: 0 0 15px #990000;
                        border-top: 2px solid #660000;
                        padding-top: 20px;
                    ">
                        "Cada hueso que Hell arroja lleva consigo el último aliento de un sueño destrozado, 
                        y en el viento de la cueva aún se escuchan los lamentos de aquellos que nunca volverán a casa..."
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
      { file: "background.mp3", name: "Elegía - Azkal", icon: "🎵" },
      { file: "bgm_menu.mp3", name: "Payon Theme - Hell", icon: "🎹" },
      { file: "bgm_battle1.mp3", name: "Batalla Intensa", icon: "⚔️" },
      { file: "bgm_battle2.mp3", name: "Depair - Mintjam Arrange", icon: "🗡️" },
      { file: "bgm_boss.mp3", name: "Dreamers - Destructive Ange", icon: "👹" },
      { file: "bgm_epic.mp3", name: "Retro Metro - Shade", icon: "🔥" },
    ];

    // Obtener la canción actual
    let currentTrack = "Elegía - Azkal"; // Por defecto
    if (window.currentMusicTrack) {
      currentTrack = window.currentMusicTrack;
    }

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
                    width: 32px;
                    height: 32px;
                    min-width: 32px;
                    min-height: 32px;
                    max-width: 32px;
                    max-height: 32px;
                    font-size: 18px;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-sizing: border-box;
                    padding: 0;
                    line-height: 1;
                    aspect-ratio: 1 / 1;
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
                        <button onclick="selectMusic('${track.file}', '${track.name}')" style="
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
                    <p>Música actual: <span id="current-track" style="color: #FFD700;">${currentTrack}</span></p>
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

window.selectMusic = (trackFile, trackName) => {
  console.log(`🎵 Cambiando música a: ${trackName} (${trackFile})`);

  // Detener música actual SOLO para cambiar
  if (AudioManager.sounds.background) {
    AudioManager.stopBackgroundMusic();
  }

  // Cambiar a nueva pista
  AudioManager.sounds.background.audio.src = `sounds/${trackFile}`;
  AudioManager.sounds.background.audio.load();

  // Guardar el nombre de la pista actual globalmente
  window.currentMusicTrack = trackName;

  // INICIAR la nueva música inmediatamente
  setTimeout(() => {
    AudioManager.startBackgroundMusic();
    console.log(`🎵 Nueva música iniciada: ${trackName}`);
  }, 100);

  // Actualizar ticker de música
  if (window.UI && window.UI.updateMusicTicker) {
    window.UI.updateMusicTicker(trackName);
  }

  // Actualizar display en selector
  const currentTrackElement = document.getElementById("current-track");
  if (currentTrackElement) {
    currentTrackElement.textContent = trackName;
  }

  console.log(`🎵 Música configurada: ${trackName}`);

  // Cerrar modal después de un pequeño delay
  setTimeout(() => {
    window.closeMusicSelector();
  }, 300);
};
