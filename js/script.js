document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("capitols-grid");
    const selectorTemporada = document.getElementById("selector-temporada");
    const anteriorBtn = document.getElementById("anterior-temporada");
    const seguentBtn = document.getElementById("seguent-temporada");
    const temporadaActualSpan = document.getElementById("temporada-actual");

    let temporades = [];
    let temporadaActual = 1;

    fetch('./data/episodes_data.json')
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            temporades = data.seasons.sort((a, b) => a.season_number - b.season_number);
            inicialitzarSelectorTemporades();
            carregarTemporada(1);
        })
        .catch(error => {
            console.error('Error carregant dades:', error);
            grid.innerHTML = `<div class="alert alert-danger">Error carregant els capítols</div>`;
        });

    function inicialitzarSelectorTemporades() {
        selectorTemporada.innerHTML = temporades.map(temporada => `
            <option value="${temporada.season_number}">
                Temporada ${temporada.season_number} (${temporada.year})
            </option>
        `).join('');
    }

    function carregarTemporada(numeroTemporada) {
        const temporada = temporades.find(t => t.season_number === numeroTemporada);

        if (!temporada) {
            console.error(`Temporada ${numeroTemporada} no trobada`);
            return;
        }

        temporadaActual = numeroTemporada;
        temporadaActualSpan.textContent = `Temporada ${temporada.season_number}`;
        selectorTemporada.value = temporada.season_number;

        renderCapitols(temporada.episodes);

        anteriorBtn.disabled = numeroTemporada <= 1;
        seguentBtn.disabled = numeroTemporada >= temporades.length;
    }

    function renderCapitols(episodis) {
        grid.innerHTML = '';

        if (!episodis?.length) {
            grid.innerHTML = `<div class="col-12 text-center text-white">No hi ha capítols disponibles</div>`;
            return;
        }

        episodis.forEach(episodi => {
            const traduccions = {
                'main_story': {text: 'Canon', classe: 'badge-canon'},
                'filler': {text: 'Farciment', classe: 'badge-farcit'},
                'black_organization': {text: 'Organització dels Homes de Negre', classe: 'badge-homes-de-negre'},
                'kaito_kid': {text: 'Kaito Kid', classe: 'badge-kaito-kid'}
            };

            // 1. Genera els badges PRIMER
            const badges = episodi.type.map(t => {
                const traduccio = traduccions[t] || { text: t, classe: 'badge-secondary' };
                return `<span class="badge ${traduccio.classe}">${traduccio.text}</span>`;
            }).join('');

            // 2. Construeix la card
            const card = `
            <div class="col">
                <div class="card h-100 card-episodi">
                    <div class="card-body d-flex flex-column">
                        <div class="mt-auto">
                            <h5 class="card-title">${episodi.number}. ${episodi.title}</h5>
                            <div class="d-flex flex-wrap gap-2">${badges}</div>
                        </div>
                    </div>
                </div>
            </div>`;

            // Injecta la card al DOM
            grid.insertAdjacentHTML('beforeend', card);

            // Generació de cards
            const novaCard = grid.lastElementChild.querySelector('.card-episodi');

            // Traductor d'URLs
            const sanitizeMediaPath = (path) => {
                return path.replace(/[^a-zA-Z0-9_\/\.\-:?=&%]/g, '');
            };

            // Defineix si obre un enllaç o un arxiu
            novaCard.addEventListener('click', () => {
                let mediaPath = sanitizeMediaPath(episodi.file);
                if (mediaPath.startsWith('http')) {
                    window.open(mediaPath, '_blank', 'noopener,noreferrer');
                } else {
                    mediaPath = `media/${encodeURI(mediaPath)}`; // encodeURI preserva '/'
                    window.open(mediaPath, '_blank', 'noopener,noreferrer');
                }
            });
        });
    }

    selectorTemporada.addEventListener('change', (e) => {
        carregarTemporada(Number(e.target.value));
    });

    anteriorBtn.addEventListener('click', () => {
        if (temporadaActual > 1) carregarTemporada(temporadaActual - 1);
    });

    seguentBtn.addEventListener('click', () => {
        if (temporadaActual < temporades.length) carregarTemporada(temporadaActual + 1);
    });
});