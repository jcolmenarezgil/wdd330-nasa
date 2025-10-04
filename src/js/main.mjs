import '../styles/style.css'
import { setupCounter } from './counter.js'
import getAPOD from './getAPOD.mjs'
import getNASAMedia from './getNASAMedia.mjs'

document.querySelector('#app').innerHTML = `
  <div>
    <h1>Test Backend Week</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Open console for API result preview.
    </p>
  </div>
  
`

setupCounter(document.querySelector('#counter'))
//APOD backend is working!
const APOD = new getAPOD();
APOD.init();

const ImagesNASA = new getNASAMedia("James Webb Space Telescope", "mission", "video");

const results = await ImagesNASA.init(); 

const videoContainer = document.querySelector('#video-container');

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