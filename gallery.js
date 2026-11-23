(async()=>{
  const grid=document.getElementById('uploaded-photo-grid');
  if(!grid)return;
  const photos=await (await fetch('assets/gallery/gallery-data.json')).json();
  const fragment=document.createDocumentFragment();
  const cards=[];
  for(const [index,photo] of photos.entries()){
    const figure=document.createElement('figure');
    figure.className='photo-card uploaded-photo';
    figure.dataset.galleryYear=photo.year||'undated';
    figure.style.setProperty('--reveal-order',String(index%12));
    const image=document.createElement('img');
    image.src=photo.src;image.alt=photo.alt||photo.title;image.loading='lazy';image.decoding='async';
    const caption=document.createElement('figcaption');
    const title=document.createElement('b');title.textContent=photo.title||'CTYBC';
    const note=document.createElement('span');note.textContent=photo.description||'A moment from the CTYBC photo archive.';
    caption.append(title,note);figure.append(image,caption);fragment.append(figure);cards.push(figure);
  }
  grid.append(fragment);
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries){
        if(!entry.isIntersecting)continue;
        entry.target.classList.add('is-inview');
        observer.unobserve(entry.target);
      }
    },{rootMargin:'35px 0px',threshold:.12});
    cards.forEach(card=>observer.observe(card));
  }else cards.forEach(card=>card.classList.add('is-inview'));
  document.querySelectorAll('.gallery-filter').forEach(button=>button.addEventListener('click',()=>{
    const selected=button.dataset.galleryFilter;
    document.querySelectorAll('.gallery-filter').forEach(item=>{
      const active=item===button;item.classList.toggle('is-active',active);item.setAttribute('aria-pressed',String(active));
    });
    cards.forEach(card=>{card.hidden=selected!=='all'&&card.dataset.galleryYear!==selected;});
  }));
})();
