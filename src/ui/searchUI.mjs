import searchEngine from "../core/searchEngine.mjs";
import getOSDRMissions from "../api/getOSDRMissions.mjs";
import getNASAMedia from "../api/getNASAMedia.mjs";

export default class searchUI {
    constructor() {
        this.searchManager = new searchEngine();
        this.missionManager = new getOSDRMissions();
        this.mediaManager = new getNASAMedia();
        this.allMissions = [];
        this.currentPage = 1;
        this.currentMediaQuery = "";
        this.totalPages = 0;
        this.pageSize = 10;

        this.fetchData = async (query) => {
            return await this.missionManager.searchMission(query);
        }

        this.paginationContainer = document.querySelector("#pageControls");
        this.searchInput = document.querySelector("#searchInput");
        this.searchButton = document.querySelector("#searchButton");
        this.listContainer = document.querySelector(".recent-list");
        this.suggestList = document.querySelector(".suggest-list");
        this.clearButton = document.querySelector("#clearButton");
        this.missionRadio = document.querySelector("#searchTypeMission");
        this.mediaRadio = document.querySelector("#searchTypeMedia");
        this.resultsContainer = document.querySelector("#results");
        this.modal = document.querySelector("#imageModal");
        this.closeButton = document.querySelector(".close-button");
        this.modalContent = document.querySelector(".modal-content");
        this.modalImage = document.querySelector("#modalImage");
        this.modalCaption = document.querySelector("#modalCaption");
        this.highResButton = document.querySelector("#highResButton");
        this.apodContainer = document.querySelector("#apod-container");

        if (!this.searchInput || !this.searchButton || !this.listContainer || !this.clearButton || !this.suggestList || !this.resultsContainer || !this.missionRadio || !this.mediaRadio || !this.apodContainer) {
            console.error("Error: search-input, search-button, or .recent-list was not found in the DOM.");
            return;
        }

        if (!this.modal || !this.closeButton || !this.modalImage) {
            console.error("Error: Modal elements not found in the DOM.");
        }

        this.loadAllMissions();
    }

    init() {
        this.updateClearButtonState(); 
        this.searchButton.addEventListener("click", this.handleSearch.bind(this));
        this.searchInput.addEventListener("keydown", this.handleEnterKey.bind(this));
        this.clearButton.addEventListener("click", this.handleClearSearches.bind(this));
        this.searchInput.addEventListener("input", this.handleInputSuggestions.bind(this));
        this.setupModal();
        this.searchInput.addEventListener('focus', () => {
            if (this.searchInput.value.length > 0) {
                this.showDropdown(this.suggestList);
            } else {
                this.renderRecentSearches(this.searchManager.getRecentSearches());
                this.showDropdown(this.listContainer);
            }
        });
        this.searchInput.addEventListener('blur', () => {
            setTimeout(() => {
                this.hideDropdown(this.suggestList);
                this.hideDropdown(this.listContainer);
                this.updateClearButtonState(); 
            }, 200);
        });
        this.missionRadio.addEventListener("change", this.handleSearchTypeChange.bind(this));
        this.mediaRadio.addEventListener("change", this.handleSearchTypeChange.bind(this));
    }

    setupModal() {
        const closeModal = () => {
            this.modal.style.display = "none";

            const videoPlayer = this.modal.querySelector(".modal-video-player");
            if (videoPlayer) {
                videoPlayer.pause();
                videoPlayer.currentTime = 0;
                videoPlayer.remove();
            }

            this.highResButton.textContent = "View High Resolution Version";
            this.highResButton.style.backgroundColor = "";
        }

        this.closeButton.addEventListener("click", closeModal);

        window.addEventListener("click", (event) => {
            if (event.target === this.modal) {
                closeModal();
            }
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && this.modal.style.display === "block") {
                closeModal();
            }
        });

        this.highResButton.addEventListener("click", this.handleHighResRequest.bind(this));
    }

    openModal(itemData) { 
        if (!this.modal) return;

        this._renderModalContent(itemData);
        this.modal.style.display = "block";
    }

    /**
     * Renders the appropriate content (Image or Video Player) inside the modal.
     * @param {object} itemData - The processed media item data.
     */
    _renderModalContent(itemData) {
        const mediaType = itemData.data[0].media_type;
        const title = itemData.data[0].title;
        const nasaId = itemData.data[0].nasa_id;

        const existingVideo = this.modal.querySelector('.modal-video-player');
        if (existingVideo) {
            existingVideo.remove();
        }

        this.modalCaption.querySelectorAll('a').forEach(a => a.remove());

        this.modalCaption.innerHTML = `<strong>${title}</strong>`;

        if (mediaType === 'image') {
            const imageUrl = itemData.image_url;

            this.modalImage.style.display = 'block';
            this.modalImage.src = imageUrl;

            this.highResButton.style.display = 'block';
            this.highResButton.disabled = false;
            this.highResButton.textContent = "View High Resolution Version";
            this.highResButton.dataset.nasaId = nasaId;
            this.highResButton.style.backgroundColor = '';

        } else if (mediaType === 'video') {
            const videoUrl = itemData.video_url;
            const posterUrl = itemData.poster_url;
            const captionUrl = itemData.caption_url;

            if (!videoUrl) {
                this.modalCaption.innerHTML = `<strong>${title}</strong><p class="error">Error: Video URL not found in the manifest.</p>`;
                this.modalImage.style.display = 'none';
                this.highResButton.style.display = 'none';
                return;
            }

            this.modalImage.style.display = 'none'; 
            this.highResButton.style.display = 'none'; 

            const videoElement = document.createElement('video');
            videoElement.controls = true;
            videoElement.autoplay = true;
            videoElement.poster = posterUrl || '';
            videoElement.className = 'modal-video-player';

            const sourceElement = document.createElement('source');
            sourceElement.src = videoUrl;
            sourceElement.type = 'video/mp4';
            videoElement.appendChild(sourceElement);

            if (captionUrl) {
                const trackElement = document.createElement('track');
                trackElement.kind = 'captions';
                trackElement.src = captionUrl;
                trackElement.srclang = 'en';
                trackElement.label = 'English';
                videoElement.appendChild(trackElement);
            }

            this.modalContent.insertBefore(videoElement, this.modalCaption);
        }
    }

    /**
     * Handles the user's request to obtain the high-resolution image.
     */
    async handleHighResRequest(event) {
        const button = event.target;
        const nasaId = button.dataset.nasaId;

        if (!nasaId) return;

        button.disabled = true;
        button.textContent = "Loading High Resolution...";

        try {
            const highResUrl = await this.mediaManager.getHighResImageUrl(nasaId);

            if (highResUrl) {
                this.modalImage.src = highResUrl;
                button.textContent = "High Resolution Loaded";
                button.style.backgroundColor = "#4CAF50";

                this.modalCaption.querySelectorAll('a').forEach(a => a.remove());

                const link = document.createElement('a');
                link.href = highResUrl;
                link.style.color = "#d1d415ff";
                link.textContent = "Open Original in New Tab";
                link.target = "_blank";
                link.style.marginLeft = '10px';
                this.modalCaption.appendChild(link);

            } else {
                button.textContent = "HR not available";
                button.style.backgroundColor = "#f44336";
            }
        } catch (error) {
            console.error("Error loading HR image:", error);
            button.textContent = "Loading Error";
            button.style.backgroundColor = "#f44336";
        }

    }

    handleSearchTypeChange() {
        this.searchInput.value = "";
        this.resultsContainer.innerHTML = "";
        this.suggestList.innerHTML = "";
        this.totalPages = 0;
        this.renderPaginationControls();
        this.updateClearButtonState();

        const currentType = this.getCurrentSearchType();

        if (currentType == "media") {
            this.toggleApodSize(false);
            this.listContainer.innerHTML = "";
            console.log("Search mode changed to NASA Media");
        } else {
            this.toggleApodSize(false);
            this.renderRecentSearches(this.searchManager.getRecentSearches());
            console.log("Search mode changed to NASA Missions. Autocomplete enabled.")
        }
    }

    getCurrentSearchType() {
        if (this.missionRadio.checked) {
            this.searchInput.placeholder = "Type Mission identifier (use suggestions for accuracy)";
            return "mission";
        }
        if (this.mediaRadio.checked) {
            this.searchInput.placeholder = "Explore and discover the Universe with Atlas X...";
            return "media";
        }
        return "mission"; // Default
    }

    handleInputSuggestions() {
        const query = this.searchInput.value.trim();

        if (this.getCurrentSearchType() !== 'mission' || query.length === 0) {
            this.hideDropdown(this.suggestList);
            this.showDropdown(this.listContainer);
            return;
        }

        this.hideDropdown(this.listContainer);

        const lowerQuery = query.toLowerCase();
        const suggestions = this.allMissions
            .filter(mission => mission.identifier && mission.identifier.toLowerCase().includes(lowerQuery))
            .slice(0, 5);

        this.renderSuggestions(suggestions);

        this.showDropdown(this.suggestList);
        this.updateClearButtonState();
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

            const missionsArray = Array.isArray(data.data) ? data.data : [];

            this.allMissions = missionsArray.map(item => {
                const url = item.mission || '';

                const parts = url.split('/mission/');
                let identifier = parts.length > 1 ? parts[parts.length - 1] : '';

                try {
                    identifier = decodeURIComponent(identifier);
                } catch (e) {
                    console.warn("Could not decode URI component:", identifier);
                }

                return { identifier: identifier };
            }).filter(item => item.identifier.length > 0);

            console.log(`[ALL MISSIONS] count ${this.allMissions.length} missions.`);

            this.renderRecentSearches(this.searchManager.getRecentSearches());

        } catch (error) {
            console.error("Error loading all missions", error);
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

        this.updateClearButtonState();
        console.log("Recent search history deleted.");
    }

    handleEnterKey(event) {
        if (event.key === 'Enter' || event.keyCode === 13) {
            event.preventDefault();
            this.handleSearch();
        }
    }

    async handleSearch(page = 1) {
        const query = this.searchInput.value.trim();
        const searchType = this.getCurrentSearchType();

        if (!query) return;

        this.toggleLoadingState(true);
        this.resultsContainer.innerHTML = "";

        /**
         * TODO
         */
        //this.resultsContainer.innerHTML = this.renderSkeleton(this.pageSize);

        try {
            let data;

            if (searchType === 'mission') {
                data = await this.missionManager.searchMission(query);

                if (!data || Object.keys(data).length === 0 || data.error) {
                    const suggestions = this.getFuzzyMissionSuggestions(query);

                    if (suggestions.length > 0) {
                        this.renderFuzzySuggestions(query, suggestions);
                    } else {
                        this.renderFuzzySuggestions(query, []);
                    }
                    return;
                }
                this.toggleApodSize(true);
                this.renderMissionResults(data);

            } else if (searchType === "media") {

                if (this.currentMediaQuery !== query) {
                    this.currentPage = 1;
                    this.currentMediaQuery = query
                }

                const pageToSearch = page;

                const mediaResponse = await this.mediaManager.search(
                    query,
                    "image,video",
                    this.pageSize,
                    pageToSearch
                );

                data = mediaResponse.results;

                this.currentPage = pageToSearch;
                this.totalPages = Math.ceil(mediaResponse.totalHits / this.pageSize)
                console.log("[NASA MEDIA DATA]", data);
                this.toggleApodSize(true);
                this.renderMediaResults(data);
                this.renderPaginationControls();
            }

            this.searchManager.addSearch(query);
            if (searchType === 'mission') {
                this.renderRecentSearches(this.searchManager.getRecentSearches());
                this.updateClearButtonState();
            }

        } catch (error) {
            console.error("Search failed:", error);

            if (searchType === 'mission') {
                this.resultsContainer.innerHTML = `<div class="search-error-box"><p>🛰️ Houston, we have a problem fetching data for the mission "<strong>${query}</strong>". It might be a temporary issue. In the meantime, here is the complete mission catalog.</p></div>`;
                this.renderAllMissionsCatalog();
            } else {
                this.resultsContainer.innerHTML = `<div class="search-error-box"><p>🛰️ We encountered some cosmic interference while searching for "<strong>${query}</strong>". Please check your connection and try again.</p></div>`;
            }

        } finally {
            this.toggleLoadingState(false);
            this.suggestList.innerHTML = "";
            this.updateClearButtonState();
        }
    }

    renderPaginationControls() {
        if (this.getCurrentSearchType() !== "media" || this.totalPages <= 1) {
            this.paginationContainer.innerHTML = "";
            return;
        }

        this.paginationContainer.innerHTML = "";
        const controls = document.createElement("div");
        controls.className = "pagination-buttons";

        //previous button
        const prevButton = document.createElement("button");
        prevButton.textContent = "◀ Previous";
        prevButton.disabled = this.currentPage === 1;
        prevButton.addEventListener("click", () => {
            if (this.currentPage > 1) {
                this.handleSearch(this.currentPage - 1);
            }
        });
        controls.appendChild(prevButton);

        const status = document.createElement("span");
        status.textContent = `Page ${this.currentPage} of ${this.totalPages}`;
        controls.appendChild(status);

        //next button
        const nextButton = document.createElement("button");
        nextButton.textContent = "Next ▶";
        nextButton.disabled = this.currentPage >= this.totalPages;
        nextButton.addEventListener("click", () => {
            if (this.currentPage < this.totalPages) {
                this.handleSearch(this.currentPage + 1);
            }
        });
        controls.appendChild(nextButton);

        this.paginationContainer.appendChild(controls);
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

    renderMediaResults(results) {
        this.resultsContainer.innerHTML = '';
        if (results.length === 0) {
            this.resultsContainer.innerHTML = '<p>No multimedia results were found.</p>';
            return;
        }

        const gridContainer = document.createElement('div');
        gridContainer.className = 'media-results-grid';

        results.forEach(item => {
            const nasaId = item.data[0].nasa_id;

            if (item.success === false) return;

            const card = document.createElement('div');
            card.className = 'media-item-card';

            const title = item.data[0].title;
            const mediaType = item.data[0].media_type;
            const dateCreated = item.data[0].date_created ? new Date(item.data[0].date_created).toLocaleDateString() : 'Date unknown';

            let visualUrl = null;
            let mediaHTML = '';

            if (mediaType === 'image' && item.image_url) {
                mediaHTML = `<img src="${item.image_url}" alt="${title}" loading="lazy" class="media-preview-img">`;
                visualUrl = item.image_url; // thumbnail URL
            } else if (mediaType === 'video' && item.poster_url) {
                mediaHTML = `
                    <div class="media-preview-wrapper video-preview-wrapper">
                        <img src="${item.poster_url}" alt="Poster para ${title}" loading="lazy" class="media-preview-img">
                        <div class="video-play-icon">▶</div>
                    </div>
                `;
                visualUrl = item.poster_url;
            } else if (mediaType === 'video' && item.video_url) {
                mediaHTML = `<div class="video-placeholder">Video content available.</div>`;
            }

            card.innerHTML = `
                <div class="media-visual-area">
                    ${mediaHTML}
                </div>
                <div class="media-info-overlay">
                    <h5 class="media-title">${title}</h5>
                    <p class="media-meta">${mediaType.toUpperCase()} | ${dateCreated}</p>
                </div>
            `;

            if (mediaType === 'image' && visualUrl) {
                card.addEventListener('click', () => {
                    this.openModal(visualUrl, title);
                });
            } else if (mediaType === 'video') {
                // TODO: video render player
            }

            if (mediaType === 'image' && visualUrl) {
                card.addEventListener('click', () => {
                    this.openModal(visualUrl, title, nasaId);
                });
            }

            if (visualUrl) { 
                card.addEventListener('click', () => {
                    this.openModal(item); 
                });
            }

            gridContainer.appendChild(card);
        });
        this.resultsContainer.appendChild(gridContainer);
    }

    renderMissionResults(missionData) {
        this.resultsContainer.innerHTML = '';

        if (!missionData || Object.keys(missionData).length === 0) {
            this.resultsContainer.innerHTML = '<p>Mission not found. Check the mission name (case sensitive) or use autocomplete.</p>';
            return;
        }

        // ---- BASIC RENDER ----

        const card = document.createElement('div');
        card.classList.add('mission-card-basic');

        const identifier = missionData.identifier || "NA";
        const startDate = missionData.startDate || "Unknown";
        const endDate = missionData.endDate || "Current";
        const aliases = (missionData.aliases && missionData.aliases.join(", ") || "None");
        const vehicleName = this.getVehicleName(missionData.vehicle);
        const gldsStudiesCount = missionData.parents?.GLDS_Study?.length || 0;

        card.innerHTML = `
        <h3>Mission NASA: ${identifier}</h3>
        <p><strong>ID: </strong> ${missionData.id || "NA"}</p>
        <p><strong>Duration: </strong> ${startDate} - ${endDate}</p>
        <p><strong>Aliases: </strong> ${aliases}</p>

        <div class="mission-details">
            <p>Vehicle: ${vehicleName}</p>
            <p>Related GLDS studies: ${gldsStudiesCount}</p>
        </div>

        <p class="data-status"> OSDR mission data successfully loaded.</p> 
        `;

        this.resultsContainer.appendChild(card);
    }

    /**
     * Extracts the vehicle name from the API URL.
     * @param {Object} vehicleObj - The missionData.vehicle object.
     * @returns {string} The vehicle name.
     */
    getVehicleName(vehicleObj) {
        const url = vehicleObj?.vehicle;
        if (!url || typeof url !== 'string') {
            return "Unspecified";
        }

        const parts = url.split('/');
        let name = parts[parts.length - 1];

        try {
            name = decodeURIComponent(name);
        } catch (e) {
            console.warn("Could not decode URI component:", name);
        }

        return name || "Unspecified";
    }

    /**
     * Renders the complete list of missions grouped alphabetically.
     */
    renderAllMissionsCatalog() {
        this.resultsContainer.innerHTML = '';

        if (!Array.isArray(this.allMissions) || this.allMissions.length === 0) {
            this.resultsContainer.innerHTML = '<p>The mission catalog could not be loaded.</p>';
            return;
        }

        const groups = this.allMissions.reduce((acc, mission) => {
            const identifier = mission.identifier;
            if (!identifier) return acc;

            const firstLetter = identifier.charAt(0).toUpperCase();
            if (!acc[firstLetter]) {
                acc[firstLetter] = [];
            }
            acc[firstLetter].push(identifier);
            return acc;
        }, {});

        const sortedLetters = Object.keys(groups).sort();
        const catalogContainer = document.createElement('div');
        catalogContainer.className = 'mission-catalog';

        catalogContainer.innerHTML = '<h2>Complete Catalog of NASA Missions 🚀</h2>';

        sortedLetters.forEach(letter => {
            groups[letter].sort();

            const letterSection = document.createElement('section');
            letterSection.innerHTML = `
                <h3>${letter}.</h3>
                <ul class="mission-list-group">
                    ${groups[letter].map(name =>
                `<li data-mission-id="${name.replace(/\s/g, '_')}">${name}</li>`
            ).join('')}
                </ul>
            `;
            catalogContainer.appendChild(letterSection);
        });

        this.resultsContainer.appendChild(catalogContainer);

        this.addCatalogClickListener(catalogContainer);
    }

    /**
     * Add a listener so that when you click on the name of a mission, 
     * a search is initiated.
     */
    addCatalogClickListener(container) {
        container.querySelectorAll('li').forEach(item => {
            item.addEventListener('click', (event) => {
                const missionName = event.target.textContent;

                this.searchInput.value = missionName;
                this.handleSearch();

                this.searchInput.focus();
            });
        });
    }

    /**
     * Search for missions that vaguely match the query, using the cache.
     * @param {string} query - The user's search term.
     * @returns {string[]} An array of suggested mission identifiers.
     */
    getFuzzyMissionSuggestions(query) {
        if (!Array.isArray(this.allMissions) || this.allMissions.length === 0) {
            return [];
        }

        const lowerQuery = query.trim().toLowerCase();

        // Suggestion Criteria:
        // 1. Word stem match (most relevant)
        const startsWith = this.allMissions
            .filter(mission => mission.identifier.toLowerCase().startsWith(lowerQuery))
            .map(mission => mission.identifier);

        // 2. Partial match anywhere (less relevant)
        const includes = this.allMissions
            .filter(mission => mission.identifier.toLowerCase().includes(lowerQuery) &&
                !startsWith.includes(mission.identifier)) // Avoid duplicates
            .map(mission => mission.identifier);

        // Combine, limiting the total to a reasonable number (e.g., 10)
        return [...startsWith, ...includes].slice(0, 10);
    }

    /**
     * Render nearby search suggestions.
     * @param {string} originalQuery - The original query failed.
     * @param {string[]} suggestions - List of suggested mission names.
     */
    renderFuzzySuggestions(originalQuery, suggestions) {
        this.resultsContainer.innerHTML = '';

        const container = document.createElement('div');
        container.className = 'fuzzy-suggestions-box';

        if (suggestions.length === 0) {
            // 🎯 CASE: ZERO CLOSE MATCHES

            container.innerHTML = `
                <p class="fuzzy-no-results-icon">🤷‍♂️</p>
                <p>The identifier you entered, <strong>"${originalQuery}"</strong>, did not yield any results.</p>
                <p class="catalog-link">Don't worry, here is the complete catalog of missions for you to explore.</p>`;

            this.resultsContainer.appendChild(container);

            this.renderAllMissionsCatalog();
            return;
        }

        // 🎯 CASE: THERE ARE SUGGESTIONS
        container.innerHTML = ` 
            <p>🤔 Did you mean any of these? Click to search:</p>
            <ul class="fuzzy-list">
                ${suggestions.map(name =>
            `<li data-mission-name="${name}">${name}</li>`
        ).join('')}
            </ul>
            <p class="catalog-link">Or consult the complete catalog to see all the missions.</p>
        `;
        this.resultsContainer.appendChild(container);

        container.querySelectorAll('li').forEach(item => {
            item.addEventListener('click', () => {
                this.searchInput.value = item.dataset.missionName;
                this.handleSearch();
            });
        });

        // 🎯 In this case (there are suggestions), we do want the button to display the catalog.
        const showCatalogButton = document.createElement('button');
        showCatalogButton.textContent = 'Ver Catálogo Completo';
        showCatalogButton.addEventListener('click', this.renderAllMissionsCatalog.bind(this));
        container.appendChild(showCatalogButton);
    }

    /**
 * @description Toggles the size of the APOD container based on whether results are visible.
 * @param {boolean} hasResults - True if results are being shown, false otherwise.
 */
    toggleApodSize(hasResults) {
        if (hasResults) {
            this.apodContainer.classList.add('search-active-small-apod');
        } else {
            this.apodContainer.classList.remove('search-active-small-apod');
        }
    }

    /**
     * Displays the list of suggestions or recents.
     * @param {HTMLElement} listElement - The list container (suggestList or listContainer).
     */
    showDropdown(listElement) {
        if (listElement === this.suggestList) {
            this.hideDropdown(this.listContainer);
        } else {
            this.hideDropdown(this.suggestList);
        }

        if (listElement.innerHTML.trim() !== '') {
            listElement.classList.add('visible');
            this.searchInput.classList.add('focused-dropdown');
        }
        this.updateClearButtonState();
    }

    /**
    * Hides the dropdown.
    * @param {HTMLElement} listElement - The list container (suggestList or listContainer).
    */
    hideDropdown(listElement) {
        listElement.classList.remove('visible');
        this.searchInput.classList.remove('focused-dropdown');
    }

    updateClearButtonState() {
        const hasHistory = this.searchManager.getRecentSearches().length > 0;
        const suggestionsVisible = this.suggestList.classList.contains('visible');

        this.clearButton.style.display = hasHistory && !suggestionsVisible ? 'inline-block' : 'none';
        this.clearButton.disabled = !hasHistory;
    }


}
