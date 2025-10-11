export default class getAPOD {
    constructor() {
        this.URL = "https://api.nasa.gov/planetary/apod";
        this.API_KEY = import.meta.env.VITE_API_KEY;
        this.count = 0;
    }

    async init() {
        try {
            const response = await this.getLastAPOD();
            console.log(response);

            const responseByDate = await this.getAPODByDate("2025/01/01");
            console.log(responseByDate);

            const responseRandom = await this.getRandomAPOD();
            console.log(responseRandom);
        } catch (error) {
            console.log("An error has ocurred, " + error)
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