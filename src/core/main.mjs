//main.mjs
// src/ui
import searchUI from '../ui/searchUI.mjs'
import RenderUIX from '../modules/renderUIX.mjs'
import getNASAMedia from '../api/getNASAMedia.mjs'

import '../styles/style.css'

import getAPOD from '../api/getAPOD.mjs'
import defaultAPODImage from '../assets/images/earth-from-space.webp';
import saturnImage from '../assets/images/saturn.webp';
import mercuryImage from '../assets/images/mercury.webp';
import plutoImage from '../assets/images/pluto.webp';
import jwstImage from '../assets/images/james-webb-space-telescope.webp';

const uiRender = new RenderUIX();
uiRender.renderLayout();

const encodeQuery = (query) => encodeURIComponent(query);

document.querySelector('#main-content').innerHTML = `
<div class="main-search-bar">

    <div class="search-toggle">
      <input type="radio" id="searchTypeMission" name="searchType" value="mission" checked class="toggle-input">
      <label for="searchTypeMission" class="toggle-label">Mission</label>

      <input type="radio" id="searchTypeMedia" name="searchType" value="media" class="toggle-input">
      <label for="searchTypeMedia" class="toggle-label">Media</label>
    </div>

</div>

<div class="search-dropdown-wrapper">
    <div class="search-input-group">
        <input type="text" id="searchInput" name="search-input" placeholder="Type Mission identifier (use suggestions for accuracy)" autocomplete="off">
        <button id="searchButton">Search</button>
    </div>

    <div class="suggest-list"></div>
    <div class="recent-list"></div>
</div>
  <button id="clearButton">Clear History</button>
  
  <div id="results"></div>
  <div class="pagination-buttons" id="pageControls"></div>


  <div id="media-cards">
    <a href="/discover?q=${encodeQuery('Saturn From Voyager 2')}" class="media-card" style="background-image: url('${saturnImage}');">
      <h3>Saturn: A Ringed Giant</h3>
    </a>
    <a href="/discover?q=${encodeQuery('First Image of Mercury')}" class="media-card" style="background-image: url('${mercuryImage}');">
      <h3>Mercury: The First Image</h3>
    </a>
    <a href="/discover?q=${encodeQuery('Pluto in True Color')}" class="media-card" style="background-image: url('${plutoImage}');">
      <h3>Pluto: Genuine Colors</h3>
    </a>
    <a href="/discover?q=${encodeQuery('Our Solar System')}" class="media-card no-image">
      <h3>Explore Our Entire Solar System</h3>
    </a>
  </div>

  <div class="highlighted-card">
    <div class="highlighted-image-area">
        <img src="${jwstImage}" alt="James Webb Space Telescope">
    </div>
    <div class="highlighted-content">
        <h2>James Webb Space Telescope (JWST)</h2>
        <p>The James Webb Space Telescope (JWST) is a space telescope designed to conduct infrared astronomy. As the largest telescope in space, it is equipped with high-resolution and high-sensitivity instruments, allowing it to view objects too old, distant, or faint for the Hubble Space Telescope. This enables investigations across many fields of astronomy and cosmology, such as observation of the first stars and the formation of the first galaxies, and detailed atmospheric characterization of potentially habitable exoplanets.</p>
        <p class="source">Source: Wikipedia</p>
    </div>
</div>

<section class="parallax-section">
    <div class="parallax-content">
        <h3>NASA Missions</h3>
        <p>Explore the greatest feats of space exploration and the missions that have redefined our place in the cosmos.</p>
        
        <p class="image-legend">
            John F. Kennedy Space Center
        </p>
    </div>
</section>
`

const ui = new searchUI();
if (ui.searchInput) {
  ui.init();
}

const apodManager = new getAPOD();

async function loadAPOD() {
  const apodContainer = document.querySelector("#apod-container");
  const apodTitle = document.querySelector("#apod-title");
  const apodDetailsButton = document.querySelector("#apod-details-button");
  const fallbackImage = defaultAPODImage;

  if (!apodContainer || !apodTitle || !apodDetailsButton) return;

  const initialTitle = "Discover the wonders of the cosmos";
  apodTitle.textContent = initialTitle;
  apodContainer.innerHTML = `
        <div class="apod-media-bg" style="background-image: url('${fallbackImage}');"></div>
        ${apodContainer.querySelector('.apod-content-overlay').outerHTML}
    `;
  apodContainer.classList.add('is-image');
  apodDetailsButton.style.display = 'none';

  const data = await apodManager.getAPODData();
  let apodContent = '';

  const isDataValid = data && data.url;

  if (isDataValid) {
    if (data.media_type === 'video') {
      apodContent = `
                <video class="apod-media-bg" src="${data.url}" autoplay loop muted playsinline></video>
            `;
      apodContainer.classList.add('is-video');
      apodContainer.classList.remove('is-image');
    } else if (data.media_type === 'image') {
      apodContent = `
                <div class="apod-media-bg" style="background-image: url('${data.url}');"></div>
            `;
      apodContainer.classList.add('is-image');
    }

    const overlay = apodContainer.querySelector('.apod-content-overlay');

    if (overlay) {
      apodContainer.innerHTML = apodContent + overlay.outerHTML;
    } else {
      apodContainer.innerHTML = apodContent;
    }

    apodTitle.textContent = data.title;
    apodDetailsButton.style.display = 'block';

    apodDetailsButton.addEventListener('click', () => {
      ui.handleAPODDetails(data);
    });

  } else {
    apodTitle.textContent = initialTitle + " (APOD Failed, Showing Local Image)";
    apodDetailsButton.style.display = 'none';

    const currentOverlay = apodContainer.querySelector('.apod-content-overlay');
    if (!currentOverlay) {
      apodContainer.innerHTML += `
                <div class="apod-content-overlay">
                    <h2 id="apod-title" class="apod-title">${apodTitle.textContent}</h2>
                    <button id="apod-details-button" class="apod-details-button" style="display:none;">Ver Detalles</button>
                </div>
             `;
    }
    console.warn("APOD failed to load, maintaining local image: " + fallbackImage);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  ui.init();
  loadAPOD();
});