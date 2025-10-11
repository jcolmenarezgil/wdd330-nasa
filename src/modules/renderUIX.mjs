

import logoSmall from '../assets/images/logo-sm.png';
import logoMedium from '../assets/images/logo-md.png';
import logoLarge from '../assets/images/logo-lg.png';

export default class RenderUIX {
    constructor() { 
        this.appContainer = document.querySelector("#app");
        this.headerContainer = document.querySelector("#header");
        this.footerContainer = document.querySelector("#footer");
        this.mainContainer = document.querySelector("#main");
    }

    renderHeader() {
        if (this.headerContainer) {
            this.headerContainer.innerHTML = `
            <div class="header-nav">
            <h1>Atlas</h1>
            <picture class="app-logo">
            <source srcset="${logoLarge}" media="(min-width: 1024px)">
            <source srcset="${logoMedium}" media="(min-width: 768px)">
            <img src="${logoSmall}" alt="NASA Data Explorer Logo" width="150" height="auto">
            </picture>
            <nav>
            
            </nav>
            </div>
            `;
        }
    }

    renderFooter() {
        if (this.footerContainer) {
            const currentYear = new Date().getFullYear();
            this.footerContainer.innerHTML = `
            <p>&copy; ${currentYear} Atlas X. All rights reserved.</p>
            <p>Data provided by NASA Open APIs (APOD, OSDR Missions, NASA Images).</p>
            `;
        }
    }

    renderLayout() {
        if (this.appContainer) {
            this.renderHeader();
            this.renderFooter();
        }
    }
}