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

        console.log(`Fetching mission data for ${fullURL}...`)

        try {
            const response = await fetch(fullURL);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status} for query: ${query}`);
            }

            const data = await response.json();
            return data; 

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