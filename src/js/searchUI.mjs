import searchEngine from "./searchEngine.mjs";
import getOSDRMissions from "./getOSDRMissions.mjs";

export default class searchUI {
    constructor() {
        this.searchManager = new searchEngine();
        this.missionManager = new getOSDRMissions();
        this.allMissions = [];

        this.fetchData = async (query) => {
            return await this.missionManager.searchMission(query);
        }

        this.searchInput = document.querySelector("#searchInput");
        this.searchButton = document.querySelector("#searchButton");
        this.listContainer = document.querySelector(".recent-list");
        this.clearButton = document.querySelector("#clearButton");
        this.suggestList = document.querySelector(".suggest-list");

        if (!this.searchInput || !this.searchButton || !this.listContainer || !this.clearButton || !this.suggestList) {
            console.error("Error: search-input, search-button, or .recent-list was not found in the DOM.");
            return;
        }

        this.loadAllMissions();
    }

    init() {
        this.renderRecentSearches(this.searchManager.getRecentSearches());
        this.searchButton.addEventListener("click", this.handleSearch.bind(this));
        this.searchInput.addEventListener("keydown", this.handleEnterKey.bind(this));
        this.clearButton.addEventListener("click", this.handleClearSearches.bind(this));
        this.searchInput.addEventListener("input", this.handleInputSuggestions.bind(this));
    }

    handleInputSuggestions() {
        const query = this.searchInput.value.trim();

        if (query.length === 0) {
            this.renderSuggestions([]);
            this.renderRecentSearches(this.searchManager.getRecentSearches());
            return;
        }

        //recent list
        this.listContainer.innerHTML = "";

        const lowerQuery = query.toLowerCase();
        const suggestions = this.allMissions
            .filter(mission => mission.identifier && mission.identifier.toLowerCase().includes(lowerQuery))
            .slice(0, 5);
        
        this.renderSuggestions(suggestions);
    }

    renderSuggestions(suggestions) {
        this.suggestList.innerHTML = "";

        if (suggestions.length === 0) {
            if (this.searchInput.value.trim().length > 0) {
                this.suggestList.innerHTML = `<li style="list-style: none; color: #aaa;">No suggestions found.</li>`;
            }
            return;
        }

        suggestions.forEach(mission => {
            const listItem = document.createElement("li");
            listItem.textContent = mission.identifier;

            listItem.addEventListener("click", () => {
                this.searchInput.value = mission.identifier;
                this.handleSearch();
                this.suggestList.innerHTML = "";
            });

            this.suggestList.appendChild(listItem);
        })
    }

    async loadAllMissions() {
        try {
            console.log("Loading all missions to autocomplete");
            const data = await this.missionManager.getAllMissions();

            // 1. Accedemos al array correcto (data.data) y nos aseguramos de que sea un array
            const missionsArray = Array.isArray(data.data) ? data.data : [];

            // 2. Mapeamos la lista para extraer el identificador de la URL 'mission'
            this.allMissions = missionsArray.map(item => {
                // Ejemplo de URL: https://osdr.nasa.gov/geode-py/ws/api/mission/VSS%20Unity
                const url = item.mission || '';

                // Extraemos la última parte después de '/mission/'
                const parts = url.split('/mission/');
                let identifier = parts.length > 1 ? parts[parts.length - 1] : '';

                // Decodificamos la URI para que "VSS%20Unity" se convierta en "VSS Unity"
                try {
                    identifier = decodeURIComponent(identifier);
                } catch (e) {
                    console.warn("Could not decode URI component:", identifier);
                }

                // Devolvemos el objeto en un formato que el filtro pueda usar
                return { identifier: identifier };
            }).filter(item => item.identifier.length > 0); // Filtramos cualquier elemento sin identificador

            console.log(`[ALL MISSIONS] count ${this.allMissions.length} missions.`);

            // Renderizamos el historial solo después de haber inicializado this.allMissions
            this.renderRecentSearches(this.searchManager.getRecentSearches());

        } catch (error) {
            console.error("Error loading all missions", error);
            // Si hay un error, dejamos this.allMissions como [] (inicializado en el constructor)
        }
    }

    toggleLoadingState(isLoading) {
        this.searchInput.disabled = isLoading;
        this.searchButton.disabled = isLoading;
        this.clearButton.disabled = isLoading;

        if (isLoading) {
            this.searchInput.classList.add('loading');
            this.searchButton.textContent = 'Searching...';
        } else {
            this.searchInput.classList.remove('loading');
            this.searchButton.textContent = 'Search';
        }
    }

    handleClearSearches() {
        this.searchManager.clearSearches();
        this.listContainer.innerHTML = "";
        this.suggestList.innerHTML = "";
        this.searchInput.value = "";

        console.log("Recent search history deleted.");
    }

    handleEnterKey(event) {
        if (event.key === 'Enter' || event.keyCode === 13) {
            event.preventDefault();
            this.handleSearch();
        }
    }

    async handleSearch() {
        const query = this.searchInput.value.trim();

        if (!query) {
            return;
        }

        this.toggleLoadingState(true);

        try {
            const data = await this.fetchData(query);

            console.log("[NASA MISSION DATA]", data);

            this.searchManager.addSearch(query);
            this.renderRecentSearches(this.searchManager.getRecentSearches());

        } catch (error) {
            console.error("Search failed:", error);

        } finally {
            this.toggleLoadingState(false);
            this.searchInput.value = '';
            this.suggestList.innerHTML = "";
        }
    }

    renderRecentSearches(searches) {
        this.listContainer.innerHTML = "";

        searches.forEach(search => {
            const listItem = document.createElement("li");
            listItem.textContent = search;

            listItem.addEventListener("click", () => {
                this.searchInput.value = search;
                this.searchButton.click();
            });

            this.listContainer.appendChild(listItem);
        });
    }
}
