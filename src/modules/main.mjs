import '../styles/style.css'
import searchUI from './searchUI.mjs'
import RenderUIX from './renderUIX.mjs'
import getAPOD from './getAPOD.mjs'
import getNASAMedia from './getNASAMedia.mjs'

const uiRender = new RenderUIX();
uiRender.renderLayout();

document.querySelector('#main-content').innerHTML = `
<div class="main-search-bar">
  <div class="search-options">
    <input type="radio" id="searchTypeMission" name="searchType" value="mission" checked>
    <label for="searchTypeMission">NASA Missions</label>

    <input type="radio" id="searchTypeMedia" name="searchType" value="media">
    <label for="searchTypeMedia">NASA Media</label>
  </div>
</div>
  <input type="text" id="searchInput" name="search-input" autocomplete="off">
  <button id="searchButton">Search</button>
  <button id="clearButton">Clear History</button>

  <div class="suggest-list"></div>
  <div class="recent-list"></div>
  <div id="results"></div>
  <div class="pagination-buttons" id="pageControls"></div>
`

const uiManager = new searchUI();
if (uiManager.searchInput) {
  uiManager.init();
}

/* //APOD backend is working!
const APOD = new getAPOD();
APOD.init();

//NASA Media is working for videos
const ImagesNASA = new getNASAMedia("James Webb Space Telescope", "mission", "video");
const results = await ImagesNASA.init(); 
//Single video player
const videoContainer = document.querySelector('#video-container');
//return item_video_url
const videoItem = results.find(item => item.video_url);

if (videoItem) {
  // 'videoItem' backend preview
  const videoHTML = `
        <h2>Video playback: ${videoItem.data[0].title}</h2>
        <video controls poster="${videoItem.poster_url}" style="max-width: 100%; height: auto;">
            <source src="${videoItem.video_url}" type="video/mp4">
            ${videoItem.caption_url ? `<track kind="captions" src="${videoItem.caption_url}" srclang="en" label="English">` : ''}
            Your browser does not support the video tag.
        </video>
    `;

  // show video preview in DOM
  videoContainer.innerHTML = videoHTML;
} else {
  // if video is not found
  videoContainer.innerHTML = "<p>No videos found with the direct file URL.</p>";
}
 */
//NASA Missions
//const OSDRMissions = new getOSDRMissions("VSS%20Unity");
//OSDRMissions.init();