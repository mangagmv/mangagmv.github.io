window.console.clear = ()=>{};
let fetchCache = {};
function geturl(url) {
  return new Promise((resolve, reject) => {
    if (fetchCache[url]) {
      resolve(fetchCache[url]);
      return;
    }
    fetch(`https://api.fsh.plus/file?url=${encodeURIComponent(url)}`)
      .then(res=>res.text())
      .then(res=>{
        fetchCache[url] = res;
        resolve(res);
      });
  });
}
function getImgUrl(url) {
  return `https://api.fsh.plus/file?url=${encodeURIComponent(url)}`;
}
function download(url, name) {
  let a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function showSearch(con) {
  document.getElementById('results').innerHTML = `<p>${con.length} results</p>
${state[si].n>1?`<button onclick="state[state.length]={page:'search',q:state[si].q,n:${state[si].n-1},provider:state[si].provider};si=state.length-1;setTop();">Prev</button>`:''}
${state[si].n>1?state[si].n:''}
${con.length>[19,23][state[si].provider]?`<button onclick="state[state.length]={page:'search',q:state[si].q,n:${state[si].n+1},provider:state[si].provider};si=state.length-1;setTop();">Next</button>`:''}
<div class="wrap">
  ${con.map(m=>`<div onclick="state[state.length]={page:'${state[si].provider===0?'view':'ep'}',id:'${m.id}',t:\`${m.title.replaceAll('"','”')}\`,img:'${m.img}',provider:state[si].provider};si=state.length-1;setTop();" class="clicky"><img src="${m.img}" loading="lazy"><span>${m.title}</span></div>`).join('')}
</div>`;
}
function search() {
  if (state[si].q==='doom') location.href='https://animegmv.github.io/doom';
  let page = state[si].n;
  let query = state[si].q;
  let provider = state[si].provider??0;
  switch (provider) {
    case 0:
      geturl(query.length?`https://pdfroom.com/search?query=${query}&page=${page}`:'https://pdfroom.com').then(res=>{
        let parser = new DOMParser();
        let doc = parser.parseFromString(res, 'text/html');
        let con = Array.from(doc.querySelectorAll('body > div > div.container.mx-auto.px-4.lg > div.my-2 > div.flex.flex-col > div'));
        showSearch(con.map(manga=>{
          return {
            id: manga.querySelector('a').href,
            title: manga.querySelector('img').alt,
            img: manga.querySelector('img').src
          };
        }));
      })
      break;
    case 1:
      geturl(`https://zonatmo.com/library?_pg=1&title=${query}&page=${page}`).then(res=>{
        let parser = new DOMParser();
        let doc = parser.parseFromString(res, 'text/html');
        let con = Array.from(doc.querySelectorAll('#app > main > div:nth-child(2) > div.col-12.col-lg-8.col-xl-9 > div:nth-child(3) > div > a'));
        showSearch(con.map(manga=>{
          return {
            id: manga.querySelector('a').href,
            title: manga.querySelector('h4').innerText,
            img: manga.querySelector('style').innerHTML.match(/background-image: url\('(.*?)'\);/)[1]
          };
        }));
      })
      break;
  }
}
function showEpisodes(res) {
  document.getElementById('results').innerHTML = `<div class="anime">
  <div>
    <img src="${state[si].img}">
  </div>
  <div style="flex:1">
    <b>Episodes</b>
    <br>
    ${res.map(e=>`<li onclick="state[state.length]={page:'view',id:'${state[si].id}',t:\`${state[si].t}\`,e:'${e.n}',eid:'${e.id}',provider:state[si].provider};si=state.length-1;setTop();" class="clicky">EP ${e.n}</li>`).join('')}
  </div>
</div>`;
}
function episodes() {
  let provider = state[si].provider??0;
  switch(provider) {
    case 1:
      geturl(state[si].id).then(res=>{
        let parser = new DOMParser();
        let doc = parser.parseFromString(res, 'text/html');
        let con = Array.from(doc.querySelectorAll('#chapters > ul > li')).concat(Array.from(doc.querySelectorAll('#chapters > ul > #chapters-collapsed > li')) ?? []);
        showEpisodes(con.map(e=>{return { id: e.querySelector('div > div > ul > li > div > div.col-2.col-sm-1.text-right > a').href, n: e.querySelector('h4 > div > div > a').innerHTML.split('>').slice(-1)[0] }}));
      });
      break;
  }
}

function showVideo(videos, provider) {
  document.getElementById('results').innerHTML = `${videos.map(s=>`<button onclick="updateVid('${s.code}', ${provider}, '${s.title}')">${s.title}${s.ads?' (ADS)':''}</button>`).join('')}
<br>
<div>
  <iframe allowfullscreen referrerpolicy="no-referrer" sandbox="allow-downloads allow-forms allow-modals allow-orientation-lock allow-presentation allow-scripts allow-same-origin" allow="autoplay; compute-pressure; cross-origin-isolated; encrypted-media; fullscreen; gamepad; local-fonts; midi; picture-in-picture; screen-wake-lock; speaker-selection; storage-access; web-share"></iframe>
</div>
<span style="display:flex">
  <button onclick="state[state.length]={page:'vid',id:'${state[si].id}',t:\`${state[si].t}\`,e:'${Number(state[si].e-1)}',provider:state[si].provider};si=state.length-1;setTop();"${state[si].e<2?' style="display:none"':''}>Prev</button>
  <span style="flex:1"></span>
  <button onclick="download('${videos[0]?.url}', '${state[si].t}', '${state[si].id}')" style="display:none">Download</button>
  <span style="flex:1"></span>
  <button onclick="state[state.length]={page:'vid',id:'${state[si].id}',t:\`${state[si].t}\`,e:'${Number(state[si].e)+1}',provider:state[si].provider};si=state.length-1;setTop();">Next</button>
</span>`;
}
function view() {
  let provider = state[si].provider??0;
  switch (provider) {
    case 0:
      geturl(`https://www3.animeflv.net/ver/${state[si].id}-${state[si].e}`)
        .then(res=>{
          let videos = JSON.parse(res.match(/var videos = {[^¬].*?};/)[0].split(';')[0].split(' = ')[1]);
          showVideo(videos.SUB, provider);
          updateVid(videos.SUB[0].code, 0, videos.SUB[0].title);
        });
      break;
    case 1:
      geturl(`https://${['aniwatchtv','hianime','9animetv'][provider-3]}.to/ajax/${provider===5?'':'v2/'}episode/servers?episodeId=${state[si].id.split('-').slice(-1)[0]}`)
        .then(res=>{
          const parser = new DOMParser();
          let doc = parser.parseFromString(JSON.parse(res).html, 'text/html');
          let videos = Array.from(doc.querySelectorAll('div.item.server-item'))
            .map(v => {
              return {
                title: v.querySelector('a').innerText,
                ads: false,
                code: v.getAttribute('data-id')
              }
            });
          showVideo(videos, provider);
          updateVid(videos[0].code, provider);
        });
      break;
  }
}

var state = [{page:'search',q:'',n:1,provider:0}];
var si = 0;
if (location.hash) {
  state.push(JSON.parse(decodeURIComponent(location.hash.slice(1))));
  si += 1;
}

function setTop() {
  if (si>0) history.replaceState(null, null, '#'+JSON.stringify(state.slice(-1)[0]));
  let top = document.getElementById('top');
  top.innerHTML = (state.length>1?((si<1?'':'<button onclick="si--;setTop()">Back</button>')+(state.length-1===si?'':'<button onclick="si++;setTop()">Next</button>')):'');
  switch (state[si].page) {
    case 'search':
      top.innerHTML += `<input type="search" id="buswa" onkeyup="if(event.key=='Enter'){state[state.length]={page:'search',q:this.value.trim(),n:1,provider:${state[si].provider}};si=state.length-1;setTop();}" value="${state[si].q}">
<button onclick="state[state.length]={page:'search',q:document.getElementById('buswa').value,n:1,provider:${state[si].provider}};si=state.length-1;setTop();">Search</button>
<span style="flex:1"></span>
<select id="provider">
  <option value="0">pdfroom.com</option>
  <option value="1">zonatmo.com</option>
</select>`;
      document.getElementById('provider').value = state[si].provider??0;
      document.getElementById('provider').onchange = (evt)=>{
        state[state.length] = state[si];
        si=state.length-1;
        state[si].n = 1;
        state[si].provider = Number(evt.target.value)??0;
        setTop();
      };
      search();
      break;
    case 'ep':
      top.innerHTML += `${state[si].t}`;
      episodes();
      break;
    case 'view':
      top.innerHTML += `${state[si].t} - ${state[si].e??'Manga'}`;
      view();
      break;
    default:
      alert(state[si].page);
      throw new Error('unknown '+state[si].page);
  }
}

setTop();