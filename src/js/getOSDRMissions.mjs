export default class getOSDRMissions {
    constructor() {
        this.URL = "/nasa-api/api";
    }
    
    async searchMission(query) {
        if (!query || query.trim() === "") {
            return null;
        }

        const encodedQuery = encodeURIComponent(query.trim());
        const fullURL = `${this.URL}/mission/${encodedQuery}`;

        console.log(`Fetching mission data for ${fullURL.split(this.URL)[1]}...`);

        try {
            const response = await fetch(fullURL);

            if (response.ok) {
                const data = await response.json();
                return data;
            }

            // Handling SEARCH ERRORS (400 or 404)
            if (response.status === 404 || response.status === 400) {
                console.log(`Mission not found (Status ${response.status}) for query: ${query}`);
                return {};
            }

            // Handling other HTTP errors (5xx, etc.)
            throw new Error(`HTTP error! Status: ${response.status} for query: ${query}`);

        } catch (error) {
            console.error(`Error fetching mission data for ${query}: `, error);
            throw error;
        }
    }

    async getAllMissions() {
        const response = await fetch(this.URL + "/missions");
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return await response.json();
    }
}