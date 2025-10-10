const KEY = "recent_search";
const MAX_SEARCHES = 7;

export default class searchEngine {
    constructor() {
        this.recentSearches = this.loadSearches();
    }

    addSearch(query) {
        if (typeof query !== 'string' || query.trim() === '') {
            return;
        }

        const trimmedQuery = query.trim();

        this.recentSearches = this.recentSearches.filter(search => search !== trimmedQuery);

        this.recentSearches.unshift(trimmedQuery);

        if (this.recentSearches.length > MAX_SEARCHES) {
            this.recentSearches = this.recentSearches.slice(0, MAX_SEARCHES);
        }

        this.saveSearches();
    }

    getRecentSearches() {
        return this.recentSearches;
    }

    clearSearches() {
        this.recentSearches = [];
        this.saveSearches();
    }

    saveSearches() {
        try {
            localStorage.setItem(KEY, JSON.stringify(this.recentSearches));
        } catch (e) {
            console.error("Error saving recent searches to localStorage", e);
        }
    }

    loadSearches() {
        try {
            const searches = localStorage.getItem(KEY);
            return searches ? JSON.parse(searches) : [];
        } catch (e) {
            console.error("Error loading recent searches from localStorage", e);
            return [];
        }
    }

}