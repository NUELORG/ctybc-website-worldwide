(async()=>{
  const grid=document.getElementById('outreach-photo-grid');
  const filters=document.querySelector('.outreach-year-filters');
  const message=document.querySelector('.outreach-year-message');
  if(!grid||!filters)return;
  const years=Array.from({length:12},(_,i)=>String(2014+i));
  let stored=[];let cms=[];
  try{stored=await fetch('assets/gallery/gallery-data.json').then(r=>r.json())}catch{}
  try{const response=await fetch('/api/cms/content',{cache:'no-store'});if(response.ok)cms=(await response.json()).gallery||[]}catch{}
  const photos=[...stored.filter(p=>p.year==='2019'&&/outreach/i.test(p.title||'')),...cms.filter(p=>p.category==='outreach')];
  const render=(year)=>{
    const selected=photos.filter(p=>String(p.year)===year);
    grid.replaceChildren();
    selected.forEach((photo,index)=>{
      const figure=document.createElement('figure');figure.className='photo-card is-inview';figure.style.setProperty('--reveal-order',String(index%12));
      const img=document.createElement('img');img.src=photo.src;img.alt=photo.alt||photo.title||`CTYBC outreach ${year}`;img.loading='lazy';img.decoding='async';
      const caption=document.createElement('figcaption');const title=document.createElement('b');title.textContent=photo.title||'CTYBC';const desc=document.createElement('span');desc.textContent=photo.description||`CTYBC community outreach · ${year}`;caption.append(title,desc);figure.append(img,caption);grid.append(figure);
    });
    message.textContent=selected.length?`${selected.length} photo${selected.length===1?'':'s'} from ${year}.`:`No outreach photos have been added for ${year} yet. CTYBC can add them in the website editor under Photo archive → Community outreach.`;
  };
  years.forEach((year,index)=>{const button=document.createElement('button');button.type='button';button.className='gallery-filter'+(index===0?' is-active':'');button.textContent=year;button.setAttribute('aria-pressed',String(index===0));button.addEventListener('click',()=>{filters.querySelectorAll('button').forEach(b=>{const active=b===button;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active))});render(year)});filters.append(button)});
  const initial=photos.length?String(photos[0].year):'2014';
  if(initial!=='2014'){const buttons=[...filters.querySelectorAll('button')];buttons.forEach(b=>{const active=b.textContent===initial;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active))})}
  render(initial);
})();
