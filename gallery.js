(async()=>{
  const grid=document.getElementById('uploaded-photo-grid');if(!grid)return;
  const [storedPhotos,cmsResult]=await Promise.all([
    fetch('assets/gallery/gallery-data.json').then(response=>response.json()).catch(()=>[]),
    fetch('/api/cms/content',{cache:'no-store'}).then(response=>response.ok?response.json():null).catch(()=>null)
  ]);
  const photos=[...storedPhotos,...(Array.isArray(cmsResult?.gallery)?cmsResult.gallery:[])];
  const fragment=document.createDocumentFragment(),cards=[];
  const filterGroup=document.querySelector('.gallery-filters');
  const years=[...new Set([...Array.from({length:12},(_,i)=>String(2014+i)),...photos.map(photo=>String(photo.year||'')).filter(year=>/^\d{4}$/.test(year))])].sort();
  for(const year of years){const button=document.createElement('button');button.type='button';button.className='gallery-filter';button.dataset.galleryFilter=year;button.setAttribute('aria-pressed','false');button.textContent=year==='2019'?'2019 outreach':`${year} photos`;filterGroup?.append(button)}
  for(const [index,photo] of photos.entries()){
    const figure=document.createElement('figure');figure.className='photo-card uploaded-photo';figure.dataset.galleryYear=photo.year||'undated';figure.style.setProperty('--reveal-order',String(index%12));
    const image=document.createElement('img');image.src=photo.src;image.alt=photo.alt||photo.title||'CTYBC';image.loading='lazy';image.decoding='async';
    const caption=document.createElement('figcaption');const title=document.createElement('b');title.textContent=photo.title||'CTYBC';const note=document.createElement('span');note.textContent=photo.description||'A moment from the CTYBC photo archive.';caption.append(title,note);figure.append(image,caption);fragment.append(figure);cards.push(figure);
  }
  grid.append(fragment);
  if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){entry.target.classList.add('is-inview');observer.unobserve(entry.target)}}},{rootMargin:'35px 0px',threshold:.12});cards.forEach(card=>observer.observe(card))}else cards.forEach(card=>card.classList.add('is-inview'));
  filterGroup?.querySelectorAll('.gallery-filter').forEach(button=>button.addEventListener('click',()=>{const selected=button.dataset.galleryFilter;filterGroup.querySelectorAll('.gallery-filter').forEach(item=>{const active=item===button;item.classList.toggle('is-active',active);item.setAttribute('aria-pressed',String(active))});cards.forEach(card=>{card.hidden=selected!=='all'&&card.dataset.galleryYear!==selected})}));
})();
