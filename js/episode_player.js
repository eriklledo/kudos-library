document.addEventListener("DOMContentLoaded", () => {
    const episodeTitleElement = document.getElementById("episode-title");
    const episodeBadgesElement = document.getElementById("episode-badges");
    const playerPlaceholder = document.getElementById("player-placeholder");
    const html5VideoPlayer = document.getElementById("html5-video-player");
    const html5VideoSource = html5VideoPlayer.querySelector("source");
    const iframeContainer = document.getElementById("iframe-container");
    const externalVideoPlayer = document.getElementById("external-video-player");

    const prevEpisodeBtn = document.getElementById("prev-episode-btn");
    const nextEpisodeBtn = document.getElementById("next-episode-btn");

    let allEpisodesFlat = [];
    let currentEpisodeIndex = -1;

    const episodeNumber = getEpisodeNumberFromURL();

    if (!episodeNumber) {
        displayError("No s'ha especificat cap número d'episodi.");
        return;
    }

    fetch('../data/episodes_data.json')
        .then(response => {
            if (!response.ok) throw new Error(`Error HTTP! estat: ${response.status}`);
            return response.json();
        })
        .then(data => {
            allEpisodesFlat = data.seasons.reduce((acc, season) => {
                const seasonEpisodes = season.episodes.map(ep => ({ ...ep, season_number_info: season.season_number, year_info: season.year }));
                return acc.concat(seasonEpisodes);
            }, []).sort((a, b) => a.number - b.number);

            loadEpisode(episodeNumber);
        })
        .catch(error => {
            console.error('Error carregant dades de l\'episodi:', error);
            displayError("Error carregant les dades de l'episodi.");
        });

    function getEpisodeNumberFromURL() {
        const params = new URLSearchParams(window.location.search);
        return parseInt(params.get('episodeNumber'));
    }

    function loadEpisode(epNum) {
        const episode = allEpisodesFlat.find(ep => ep.number === epNum);
        currentEpisodeIndex = allEpisodesFlat.findIndex(ep => ep.number === epNum);

        if (!episode) {
            displayError(`L'episodi número ${epNum} no s'ha trobat.`);
            disableNavigationButtons();
            return;
        }

        const newUrl = `episode.html?episodeNumber=${episode.number}`;
        history.pushState({ episodeNumber: episode.number }, episode.title, newUrl);
        document.title = `${episode.number}. ${episode.title} - Kudo's Library`;


        episodeTitleElement.textContent = `${episode.number}. ${episode.title}`;
        renderBadges(episode.type);
        setupMediaPlayer(episode.file);
        updateNavigationButtons();
    }

    function renderBadges(types) {
        episodeBadgesElement.innerHTML = '';
        const traduccions = {
            'main_story': {text: 'Canon', classe: 'badge-canon'},
            'filler': {text: 'Farciment', classe: 'badge-farcit'},
            'black_organization': {text: 'Homes de Negre', classe: 'badge-homes-de-negre'},
            'kaito_kid': {text: 'Kaito Kid', classe: 'badge-kaito-kid'},
            'heiji_hattori': {text: 'Heiji Hattori', classe: 'badge-heiji-hattori'}
        };
        types.forEach(type => {
            const traduccio = traduccions[type] || { text: type, classe: 'badge-secondary' }; // Fallback per tipus no definits
            const badgeSpan = document.createElement('span');
            badgeSpan.className = `badge me-1 ${traduccio.classe}`;
            badgeSpan.textContent = traduccio.text;
            episodeBadgesElement.appendChild(badgeSpan);
        });
    }

    function sanitizeMediaPathForPlayer(path) {
        // Per a la reproducció, la sanitització podria ser menys restrictiva
        // o ajustar-se segons el tipus de reproductor.
        // Si són URL completes de Dailymotion/YouTube, normalment no cal sanititzar.
        // Per arxius locals, `encodeURI` és suficient si no hi ha caràcters molt estranys.
        return path;
    }

    function setupMediaPlayer(mediaFile) {
        const sanitizedFile = sanitizeMediaPathForPlayer(mediaFile);

        // Pausa i neteja el reproductor anterior abans de carregar nou contingut
        html5VideoPlayer.pause();
        html5VideoSource.setAttribute('src', '');
        html5VideoPlayer.load(); // Important per netejar el source

        externalVideoPlayer.src = 'about:blank'; // Netejar l'iframe

        // Amaga tots els reproductors inicialment
        html5VideoPlayer.style.display = "none";
        iframeContainer.style.display = "none";
        externalVideoPlayer.style.display = "none";


        if (sanitizedFile.startsWith('http')) {
            // És una URL externa (Dailymotion, YouTube, etc.)
            if (sanitizedFile.includes('dailymotion.com') || sanitizedFile.includes('dai.ly')) {
                const videoId = extractDailymotionVideoId(sanitizedFile);
                if (videoId) {
                    externalVideoPlayer.src = `https://geo.dailymotion.com/player.html?video=${videoId}`;
                } else {
                    externalVideoPlayer.src = sanitizedFile; // Fallback si no podem extreure l'ID
                }
            } else if (sanitizedFile.includes('youtube.com') || sanitizedFile.includes('youtu.be')) {
                const videoId = extractYouTubeVideoId(sanitizedFile);
                if (videoId) {
                    externalVideoPlayer.src = `https://www.youtube.com/embed/${videoId}?autoplay=0`; // Afegeix autoplay=0 si vols que no comenci sol
                } else {
                    externalVideoPlayer.src = sanitizedFile; // Fallback
                }
            } else {
                // Altres URLs externes genèriques (menys comú per a vídeo, potser stream)
                externalVideoPlayer.src = sanitizedFile;
            }
            iframeContainer.style.display = "block";
            externalVideoPlayer.style.display = "block";

        } else {
            // És un arxiu local
            const fullPath = `../media/${encodeURI(sanitizedFile)}`; // Ajusta el '../media/' segons la teva estructura
            html5VideoSource.setAttribute('src', fullPath);
            html5VideoPlayer.load(); // Obliga a recarregar la font del vídeo
            html5VideoPlayer.style.display = "block";
            // Opcionalment, pots afegir autoplay si vols que comencin automàticament
            // html5VideoPlayer.play();
        }
    }

    function extractDailymotionVideoId(url) {
        const regex = /(?:dailymotion\.com\/(?:video\/|embed\/video\/)|dai\.ly\/)([a-zA-Z0-9]+)/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }

    function extractYouTubeVideoId(url) {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }

    function updateNavigationButtons() {
        prevEpisodeBtn.disabled = currentEpisodeIndex <= 0;
        nextEpisodeBtn.disabled = currentEpisodeIndex < 0 || currentEpisodeIndex >= allEpisodesFlat.length - 1;
    }

    function disableNavigationButtons() {
        prevEpisodeBtn.disabled = true;
        nextEpisodeBtn.disabled = true;
    }

    prevEpisodeBtn.addEventListener("click", () => {
        if (currentEpisodeIndex > 0) {
            const prevEp = allEpisodesFlat[currentEpisodeIndex - 1];
            loadEpisode(prevEp.number);
        }
    });

    nextEpisodeBtn.addEventListener("click", () => {
        if (currentEpisodeIndex < allEpisodesFlat.length - 1) {
            const nextEp = allEpisodesFlat[currentEpisodeIndex + 1];
            loadEpisode(nextEp.number);
        }
    });

    function displayError(message) {
        episodeTitleElement.textContent = message;
        episodeBadgesElement.innerHTML = '';
        // Opcional: Netejar el reproductor o mostrar un missatge al placeholder
        playerPlaceholder.innerHTML = `<div class="alert alert-danger text-center">${message}</div>`;
    }

    // Permet que els botons anterior/següent del navegador funcionin amb l'history.pushState
    window.addEventListener('popstate', (event) => {
        if (event.state && event.state.episodeNumber) {
            loadEpisode(event.state.episodeNumber);
        } else {
            // Si no hi ha state, podria ser la càrrega inicial des d'un URL amb paràmetre
            const epNumFromURL = getEpisodeNumberFromURL();
            if (epNumFromURL) {
                loadEpisode(epNumFromURL);
            }
        }
    });
});