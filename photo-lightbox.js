(()=>{
  const dialog=document.querySelector('.photo-lightbox');if(!dialog)return;
  const image=dialog.querySelector('img'),caption=dialog.querySelector('p'),close=dialog.querySelector('.lightbox-close');
  document.addEventListener('click',event=>{
    const photo=event.target.closest('.photo-card img');if(!photo)return;
    event.preventDefault();image.src=photo.currentSrc||photo.src;image.alt=photo.alt||'CTYBC photograph';caption.textContent=photo.closest('figure')?.querySelector('figcaption')?.innerText||photo.alt||'';dialog.showModal();
  });
  close.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
})();
