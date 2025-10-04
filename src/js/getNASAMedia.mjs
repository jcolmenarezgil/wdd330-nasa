import { sanitizaSearchQuery } from "./Utils.js";

/**
 * Media types for Multimedia
 * @param {string} mediaTypeString - Option, String with split media types.
 * @param {string[]} defaultTypes - default type if isn't defined 'mediaTypeString'.
 */
const parseMediaType = (mediaTypeString, defaultTypes = ["image", "video"]) => {
    if (!mediaTypeString) {
        return defaultTypes;
    }

    if (!mediaTypeString.includes(',')) {
        return [mediaTypeString];
    }

    return [mediaTypeString];

}

export default class getNASAMedia {
    constructor(query, description, mediaTypes = "image,video", page = 1, page_size = 4) {
        this.URL = "https://images-api.nasa.gov";
        this.query = query;
        this.description = description;
        this.media_type = parseMediaType(mediaTypes);
        this.page = page;
        this.page_size = page_size;
    }

    async init() {
        try {
            const responses = await this.getAllMedia();
            const results = [];

            for (const response of responses) {
                if (!response.ok) {
                    const errorBody = await response.json().catch(() => ({}));
                    const status = response.status;
                    const errorMessage = errorBody.message || errorBody.reason || response.statusText;

                    console.error(`Error HTTP ${status} from ${response.url}: ${errorMessage}`);
                    results.push({ success: false, status: status, message: errorMessage, url: response.url });
                    continue;
                }
                const data = await response.json();
                results.push({ success: true, data: data });
            }

            const finalData = await this.processResult(results);
            console.log("Final data:", finalData);
            return finalData;

        } catch (error) {
            console.error(`an error has ocurred, ${error.message}`)
            return { success: false, message: error.message };
        }
    }

    async getAllMedia() {
        const query = sanitizaSearchQuery(this.query);
        const description = this.description;
        const page = this.page;
        const page_size = this.page_size;

        const fetchPromises = this.media_type.map(async mediaType => {
            const urlObj = new URL(this.URL + "/search");
            urlObj.searchParams.set("q", query);
            urlObj.searchParams.set("media_type", mediaType);
            urlObj.searchParams.set("description", description);
            urlObj.searchParams.set("page", page);
            urlObj.searchParams.set("page_size", page_size);

            return await fetch(urlObj.toString());
        });

        const responses = await Promise.all(fetchPromises);
        return responses;
    }

    async getAssetManifest(nasaId) {
        const url = `${this.URL}/asset/${nasaId}`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch asset manifest for ${nasaId}: ${response.statusText}`);
        }

        const data = await response.json();
        const videoLinks = data.collection.items
            .map(item => item.href)
            .filter(href => href.endsWith('.mp4') || href.endsWith('.webm') || href.endsWith('.mov'));
        
        return videoLinks;
    }

    async processResult(results) {
        const finalResults = [];

        for (const result of results) {
            if (!result.success) {
                finalResults.push(result);
                continue;
            }

            const items = result.data.collection.items

            for (const item of items) {
                const nasaId = item.data[0]["nasa_id"];
                const mediaType = item.data[0]["media_type"];
            
                if (mediaType === "video") {
                    try {
                        const videoUrls = await this.getAssetManifest(nasaId);

                        item.video_url = videoUrls.length > 0 ? videoUrls[0] : null;

                        const previewLink = item.links.find(l => l.rel === "preview" && l.render === "image");
                        const captionLink = item.links.find(l => l.rel === "captions");

                        item.poster_url = previewLink ? previewLink.href : null;
                        item.caption_url = captionLink ? captionLink.href : null
                    } catch (e) {
                        console.error(`Error fetching asset manifest for ${nasaId}: ${e.message}`);
                        item.video_url = null;
                    }
                }
                finalResults.push(item);
            }
        }
        return finalResults;
    }
}