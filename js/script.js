document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("capitols-grid");
    const selectorTemporada = document.getElementById("selector-temporada");
    const anteriorBtn = document.getElementById("anterior-temporada");
    const seguentBtn = document.getElementById("seguent-temporada");
    const temporadaActualSpan = document.getElementById("temporada-actual");

    let temporades = [];
    let temporadaActual = 1;

    // 1. Correcció en la ruta del JSON
    fetch('../data/episodes_data.json') // Assegura't que la ruta és correcta
        .then(response => {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            temporades = data.seasons.sort((a, b) => a.season_number - b.season_number);
            inicialitzarSelectorTemporades();
            carregarTemporada(1); // Carregar primera temporada per defecte
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

        if (!episodis || episodis.length === 0) {
            grid.innerHTML = `<div class="col-12 text-center text-white">No hi ha capítols disponibles</div>`;
            return;
        }

        episodis.forEach(episodi => {
            const traduccions = {
                'main_story': { text: 'Canon', classe: 'badge-canon' },
                'filler': { text: 'Farcit', classe: 'badge-farcit' },
                'black_organization': { text: 'Homes de Negre', classe: 'badge-homes-de-negre' },
                'kaito_kid': { text: 'Kaito Kid', classe: 'badge-kaito-kid' }
            };

            const badges = episodi.type.map(t => {
                const traduccio = traduccions[t] || { text: t, classe: 'badge-secondary' };
                return `<span class="badge ${traduccio.classe}">${traduccio.text}</span>`;
            }).join('');

            const card = `
            <div class="col">
                <div class="card h-100 card-episodi">
                    <div class="card-body d-flex flex-column">
                        <div class="mt-auto"> <!-- Empuja el contingut cap avall -->
                            <h5 class="card-title">${episodi.number}. ${episodi.title}</h5>
                            <div class="d-flex flex-wrap gap-2">${badges}</div>
                        </div>
                    </div>
                </div>
            </div>`;
            document.querySelectorAll('.card-episodi').forEach(card => {
                card.addEventListener('click', (e) => {
                    // Evita obrir l'enllaç si estàs fent clic a la card
                    e.preventDefault();

                    // Obtenir l'URL del vídeo
                    const videoUrl = card.querySelector('a')?.href;

                    if(videoUrl) {
                        window.open(videoUrl, '_blank'); // O obrir en modal
                    }
                });
            });

            grid.insertAdjacentHTML('beforeend', card);
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