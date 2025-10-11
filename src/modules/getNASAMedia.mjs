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
    return mediaTypeString.split(',').map(type => type.trim());
}

export default class getNASAMedia {
    constructor() {
        this.URL = "https://images-api.nasa.gov";
        this.lastQuery = {};
    }

    /**
     * Search in NASA media library
     * @param { string } query - Search term.
     * @param { string } mediaType - Source types (ex. "image,video")
     * @param { number } pageSize - result per page.
     * @param { number } page - The page to request.
     * @returns {Promise<Object[]} - An array with process results */
    async search(query, mediaType = "image,video", pageSize = 10, page = 1) {
        if (!query || query.trim() === '') return { results: [], totalHits: 0, currentPage: 1 };

        this.media_type = parseMediaType(mediaType);
        this.query = query;
        this.page_size = pageSize;
        this.page = page;

        try {
            const responses = await this.getAllMedia();
            const results = [];
            let totalHits = 0;

            for (const response of responses) {
                if (response.ok) {
                    const data = await response.json();

                    if (data.collection.metadata && data.collection.metadata.total_hits) {
                        totalHits = Math.max(totalHits, data.collection.metadata.total_hits);
                    }

                    results.push({ success: true, data: data });
                } else {
                    const errorBody = await response.json().catch(() => ({}));
                    const status = response.status;
                    const errorMessage = errorBody.message || errorBody.reason || response.statusText;
                    console.error(`Error HTTP ${status} from ${response.url}: ${errorMessage}`);
                    results.push({ success: false, status: status, message: errorMessage, url: response.url });
                    continue;
                }
            }

            const finalResults = await this.processResult(results);

            return {
                results: finalResults,
                totalHits: totalHits,
                currentPage: this.page,
                pageSize: this.page_size,
            }
        } catch (error) {
            console.error(`An error has occurred in media search, ${error.message}`)
            return { success: [], totalHits: 0, currentPage: 1, pageSize: this.page_size };
        }
    }

    async getAllMedia() {
        const query = sanitizaSearchQuery(this.query);
        const page = this.page;
        const page_size = this.page_size;

        const fetchPromises = this.media_type.map(async mediaType => {
            const urlObj = new URL(this.URL + "/search");
            urlObj.searchParams.set("q", query);
            urlObj.searchParams.set("media_type", mediaType);
            urlObj.searchParams.set("page", this.page);
            urlObj.searchParams.set("page_size", this.page_size);

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

                else if (mediaType === "image") {
                    const previewLink = item.links.find(l => l.rel === "preview");
                    item.image_url = previewLink ? previewLink.href : null;
                }
                finalResults.push(item);
            }
        }
        return finalResults;
    }

    /**
     * Get the URL of the HIGHEST resolution image (Original/Large) from the asset bundle.
     * @param {string} nasaId - NASA's unique ID.
     * @returns {Promise<string|null>} - The URL of the large image or null.
     */
    async getHighResImageUrl(nasaId) {
        const url = `${this.URL}/asset/${nasaId}`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                console.error(`Error fetching asset manifest for ${nasaId}: ${response.statusText}`);
                return null;
            }

            const data = await response.json();

            const originalLink = data.collection.items.find(item =>
                item.href.includes('~orig.jpg') ||
                item.href.endsWith('.jpg') ||
                item.href.endsWith('.jpeg')
            );

            if (originalLink && !originalLink.href.toLowerCase().endsWith('.tiff')) {
                return originalLink.href;
            }

            const largeLink = data.collection.items
                .map(item => item.href)
                .find(href => href.endsWith('.jpg') || href.endsWith('.jpeg'));

            return largeLink || null;

        } catch (e) {
            console.error(`Error al obtener asset manifest para ${nasaId}: ${e.message}`);
            return null;
        }
    }
}