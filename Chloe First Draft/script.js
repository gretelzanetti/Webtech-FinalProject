// script for Chloe First Draft: load recipes, render featured, search, filters, detail and favorites
(function(){
  const DATA_URL = 'data/recipes.json';

  async function fetchRecipes(){
    try{
      const res = await fetch(DATA_URL);
      return await res.json();
    }catch(e){
      console.error('Could not load recipes', e);
      return [];
    }
  }

  function byQueryParam(name){
    return new URLSearchParams(location.search).get(name);
  }

  function saveFavorites(favs){ localStorage.setItem('mc:favs', JSON.stringify(favs)); }
  function loadFavorites(){ try{return JSON.parse(localStorage.getItem('mc:favs')||'[]')}catch(e){return []} }

  function isRecipePage(){ return document.body.querySelector('#recipe-article') !== null }

  async function renderFeatured(){
    const data = await fetchRecipes();
    const grid = document.getElementById('featured-grid');
    if(!grid) return;
    const featured = data.filter(r=>r.featured).slice(0,4);
    grid.innerHTML = featured.map(r=>`<a class="card" href="recipe.html?id=${encodeURIComponent(r.id)}"><img src="${r.image}" alt="${r.title}"/><h3>${r.title}</h3><p class="muted">${r.category} • ${r.difficulty}</p></a>`).join('');
  }

  function recipeCardHTML(r){
    return `<article class="card">
      <a href="recipe.html?id=${encodeURIComponent(r.id)}"><img src="${r.image}" alt="${r.title}"></a>
      <h3><a href="recipe.html?id=${encodeURIComponent(r.id)}">${r.title}</a></h3>
      <p class="muted">${r.prepTime} • ${r.difficulty}</p>
      <p>${r.description||''}</p>
    </article>`;
  }

  async function renderRecipes(){
    const data = await fetchRecipes();
    const grid = document.getElementById('recipes-grid');
    if(!grid) return;
    const q = (document.getElementById('search-input')||{}).value || byQueryParam('q') || '';
    const cat = byQueryParam('category') || (document.getElementById('category-filter')||{}).value || 'all';
    const diff = (document.getElementById('difficulty-filter')||{}).value || 'all';

    const filtered = data.filter(r=>{
      if(cat && cat!=='all' && r.category !== cat) return false;
      if(diff && diff!=='all' && r.difficulty !== diff) return false;
      if(q){
        const qi = q.toLowerCase();
        if(r.title.toLowerCase().includes(qi)) return true;
        if(r.ingredients.join(' ').toLowerCase().includes(qi)) return true;
        return false;
      }
      return true;
    });

    grid.innerHTML = filtered.map(recipeCardHTML).join('') || '<p>No recipes found.</p>';
  }

  async function renderDetail(){
    const id = byQueryParam('id');
    if(!id) return;
    const data = await fetchRecipes();
    const r = data.find(x=>String(x.id)===String(id));
    const el = document.getElementById('recipe-article');
    if(!r || !el){ el && (el.innerHTML = '<p>Recipe not found.</p>'); return; }

    const favs = loadFavorites();
    const isFav = favs.includes(r.id);

    el.innerHTML = `
      <div>
        <img src="${r.image}" alt="${r.title}" style="width:100%;border-radius:12px;max-height:420px;object-fit:cover" />
        <h1>${r.title}</h1>
        <div class="recipe-meta">
          <div>${r.prepTime} • ${r.difficulty}</div>
          <button id="fav-btn" class="fav">${isFav? 'Saved' : 'Save'}</button>
        </div>
        <h3>Ingredients</h3>
        <ul>${r.ingredients.map(i=>`<li>${i}</li>`).join('')}</ul>
      </div>
      <aside class="card">
        <h3>Instructions</h3>
        <ol>${r.instructions.map(s=>`<li>${s}</li>`).join('')}</ol>
      </aside>
    `;

    document.getElementById('fav-btn').addEventListener('click', ()=>{
      const f = loadFavorites();
      const i = f.indexOf(r.id);
      if(i===-1){ f.push(r.id); saveFavorites(f); document.getElementById('fav-btn').textContent='Saved' }
      else { f.splice(i,1); saveFavorites(f); document.getElementById('fav-btn').textContent='Save' }
    });
  }

  function wireControls(){
    const s = document.getElementById('search-input');
    if(s){ s.addEventListener('input', ()=>{ if(location.pathname.endsWith('recipes.html')) renderRecipes(); else location.href = 'recipes.html?q='+encodeURIComponent(s.value) }); }
    const cat = document.getElementById('category-filter');
    if(cat) cat.addEventListener('change', renderRecipes);
    const diff = document.getElementById('difficulty-filter');
    if(diff) diff.addEventListener('change', renderRecipes);

    // dark mode toggle
    document.querySelectorAll('#dark-toggle').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        document.documentElement.classList.toggle('dark');
      });
    });
  }

  // Init
  document.addEventListener('DOMContentLoaded', ()=>{
    wireControls();
    renderFeatured();
    if(isRecipePage()) renderDetail();
    renderRecipes();
  });

})();
