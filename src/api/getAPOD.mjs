export default class getAPOD {
    constructor() {
        this.URL = "https://api.nasa.gov/planetary/apod";
        this.API_KEY = import.meta.env.VITE_API_KEY; // This should be replaced by Vite during build
        this.count = 0;

        // Add a check to ensure the API key is loaded, especially for production builds.
        if (!this.API_KEY) {
            console.error("VITE_API_KEY is not defined. Please check your .env file or environment variables.");
        }
    }

    async getAPODData() {
        try {
            const response = await fetch(this.URL + "?api_key=" + this.API_KEY);
            if (!response.ok) {
                // Throw error if response is not 200 (e.g., 429 rate limit)
                throw new Error(`APOD fetch failed with status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("An error occurred while fetching APOD:", error);
            // Return null or fallback data on failure
            return null;
        }
    }

    async getLastAPOD() {
        const response = await fetch(this.URL + "?api_key=" + this.API_KEY);
        const data = await response.json();
        return data;
    }

    async getAPODByDate(date) {
        const dateObj = new Date(date.replace(/\//g, "-"));
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        const fecthDate = `${year}-${month}-${day}`;
        console.log(fecthDate);
        const response = await fetch(this.URL + "?api_key=" + this.API_KEY + "&date=" + fecthDate);
        const data = await response.json();
        return data;
    }

    async getRandomAPOD() {
        const count = 5;
        this.count = count;
        const response = await fetch(this.URL + "?api_key=" + this.API_KEY + "&count=" + this.count);
        const data = await response.json();
        return data;
    }
}