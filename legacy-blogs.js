(async()=>{
  const mount=document.getElementById('legacy-blog-grid');
  const dialog=document.getElementById('story-dialog');
  if(!mount||!dialog)return;
  const posts=await fetch('assets/blog-posts.json').then(r=>r.json());
  const fragment=document.createDocumentFragment();
  const dateValue=s=>{const d=new Date(s);return Number.isNaN(+d)?0:+d};
  const readableDate=s=>new Date(`${s}T12:00:00`).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
  posts.sort((a,b)=>dateValue(b.date)-dateValue(a.date));

  function appendBody(target,post){
    for(const block of post.body||[]){
      if(block.type==='image'){
        const img=document.createElement('img');img.src=block.src;img.alt=block.alt||post.title;img.loading='lazy';target.append(img);continue;
      }
      let value=block.text||'';
      if(block.type==='p'){
        value=value.replace(/^Blog post description\.\s*/i,'');
        const normalized=value.trim().toLowerCase();
        if(!value.trim()||normalized===String(post.author||'').trim().toLowerCase()||normalized===String(post.category||'').trim().toLowerCase()||normalized===String(post.dateLabel||'').trim().toLowerCase()||/^\d{1,2}\/\d{1,2}\/\d{4}\s*\d+\s*min read$/i.test(value.trim()))continue;
      }
      const tag=['h2','h3','h4','ul','ol','blockquote'].includes(block.type)?block.type:'p';
      const element=document.createElement(tag);element.textContent=value;
      if(tag==='ul'||tag==='ol')element.className='imported-list-text';
      target.append(element);
    }
  }

  function snippet(post){
    const useful=(post.body||[]).find(block=>{
      if(block.type==='image')return false;
      const value=(block.text||'').replace(/^Blog post description\.\s*/i,'').trim();
      const low=value.toLowerCase();
      return value.length>55&&!low.includes('welcome to guiding little feet')&&!low.startsWith('a daily space of truth')&&low!==String(post.author||'').toLowerCase()&&low!==String(post.category||'').toLowerCase()&&!/^\d{1,2}\/\d{1,2}\/\d{4}/.test(value);
    });
    const value=useful?.text||'A story from the CTYBC archive.';
    return value.length>175?`${value.slice(0,172).trimEnd()}…`:value;
  }

  for(const post of posts){
    const card=document.createElement('article');card.className='blog-card imported-story';
    const art=document.createElement('div');art.className='imported-story-art';
    const cover=(post.body||[]).find(block=>block.type==='image');
    if(cover){const img=document.createElement('img');img.src=cover.src;img.alt='';img.loading='lazy';art.append(img);}
    const meta=document.createElement('span');meta.className='blog-meta';meta.textContent=`${post.category||'CTYBC'} · ${readableDate(post.date)}`;
    const artTitle=document.createElement('strong');artTitle.textContent=post.title;
    art.append(meta,artTitle);
    const copy=document.createElement('div');copy.className='imported-story-copy';
    const title=document.createElement('h3');title.textContent=post.title;
    const excerpt=document.createElement('p');excerpt.textContent=snippet(post);
    const button=document.createElement('button');button.type='button';button.textContent='Read story';button.setAttribute('aria-label',`Read ${post.title}`);
    button.addEventListener('click',()=>{
      const inner=dialog.querySelector('.story-dialog-inner');inner.replaceChildren();
      const close=document.createElement('button');close.className='story-dialog-close';close.type='button';close.textContent='×';close.setAttribute('aria-label','Close story');close.addEventListener('click',()=>dialog.close());
      const meta=document.createElement('span');meta.className='story-dialog-meta';meta.textContent=`${post.category||'CTYBC'} · ${readableDate(post.date)}`;
      const heading=document.createElement('h2');heading.textContent=post.title;
      const body=document.createElement('div');body.className='imported-story-body';appendBody(body,post);
      inner.append(close,meta,heading,body);dialog.showModal();
    });
    copy.append(title,excerpt,button);card.append(art,copy);fragment.append(card);
  }
  mount.append(fragment);
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
})();
