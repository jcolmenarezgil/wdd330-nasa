

import logoSmall from '../assets/images/logo-sm.png';
import logoMedium from '../assets/images/logo-md.png';
import logoLarge from '../assets/images/logo-lg.png';

export default class RenderUIX {
    constructor() { 
        this.appContainer = document.querySelector("#app");
        this.apodDetailsButton = null;
        this.headerContainer = document.querySelector("#header");
        this.footerContainer = document.querySelector("#footer");
        this.mainContainer = document.querySelector("#main");
    }

    renderHeader() {
        if (this.headerContainer) {
            this.headerContainer.innerHTML = `
            <div class="header-content-wrapper">
                <div class="header-nav">
                    <div class="title-container">
                        <h1>Atlas X</h1>
                        <picture class="app-logo">
                            <source srcset="${logoLarge}" media="(min-width: 1024px)">
                            <source srcset="${logoMedium}" media="(min-width: 768px)">
                            <img src="${logoSmall}" alt="NASA Data Explorer Logo" width="150" height="auto">
                        </picture>
                    </div>
                    <nav class="main-navigation">
                        <a href="/" class="nav-link current">Home</a>
                        <a href="/missions" class="nav-link">Missions</a>
                        <a href="#" class="nav-link nav-discover">Discover</a> 
                        <a href="/about" class="nav-link">About</a>
                    </nav>
                </div>
                
                <div id="apod-container" class="apod-hero-container">
                    <div class="apod-content-overlay">
                        <h2 id="apod-title" class="apod-title">Loading Image of the Day...</h2>
                        <button id="apod-details-button" class="apod-details-button" style="display:none;">See Details</button>
                    </div>
                </div>
            </div>
        `;

            this.apodDetailsButton = document.querySelector("#apod-details-button");
        }
    }

    renderFooter() {
        if (this.footerContainer) {
            const currentYear = new Date().getFullYear();
            this.footerContainer.innerHTML = `
            <p>&copy; ${currentYear} Atlas X. All rights reserved.</p>
            <a class="author" href="https://github.com/jcolmenarezgil">Created By Jose David Colmenarez Gil</a>
            <p>Data provided by NASA Open APIs (APOD, OSDR Missions, NASA Images).</p>
            `;
        }
    }

    handleAPODDetails(apodData) {
        const mappedItem = {
            data: [{
                title: apodData.title,
                media_type: apodData.media_type,
                date_created: apodData.date
            }],
            image_url: apodData.url,
            video_url: apodData.media_type === 'video' ? apodData.url : null,
            explanation: apodData.explanation
        };

        this.openModal(mappedItem);

        this.modalCaption.innerHTML = `<strong>${apodData.title}</strong><br>${apodData.explanation}`;

        if (apodData.media_type === 'image') {
            this.highResButton.style.display = 'none';
        }
    }

    renderLayout() {
        if (this.appContainer) {
            this.renderHeader();
            this.renderFooter();
        }
    }
}