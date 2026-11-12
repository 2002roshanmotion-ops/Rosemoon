(()=>{
 const ratios={square:1,portrait:3/4,landscape:16/9};
 function attach(input){
  if(!input||input.dataset.cropReady==='1')return;
  const section=input.closest('.flower-image-section')||input.closest('.field')||input.parentElement;
  if(!section)return;
  input.dataset.cropReady='1';
  const isCategory=input.id==='manageCategoryPhoto';
  let image=null,scale=1,panX=0,panY=0,drag=null,objectUrl='';
  const preview=section.querySelector('.flower-photo-preview')||section.querySelector('#manageCategoryPhotoPreview');
  const editor=document.createElement('div');
  editor.className='rm-photo-editor';
  editor.style.cssText='display:none;margin:14px 0;padding:16px;border:2px solid #e9b8c8;border-radius:16px;background:#fff8fa;position:relative;z-index:5';
  editor.innerHTML='<strong style="display:block;margin-bottom:12px;color:#633447">✂️ Crop & Resize Image</strong><div data-editor-message role="status" style="font-size:13px;color:#805565;margin-bottom:10px">Choose the crop shape and move the image inside the frame.</div><div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px"><label style="font-size:12px;font-weight:800">CROP SHAPE<select data-ratio style="display:block;margin-top:5px;padding:9px;border:1px solid #e2cbd4;border-radius:9px"><option value="square">Square 1:1</option><option value="portrait">Portrait 3:4</option><option value="landscape">Landscape 16:9</option></select></label><label style="font-size:12px;font-weight:800">OUTPUT SIZE<select data-size style="display:block;margin-top:5px;padding:9px;border:1px solid #e2cbd4;border-radius:9px"><option>600</option><option selected>900</option><option>1200</option></select></label></div><canvas width="700" height="700" style="width:min(100%,420px);height:auto;display:block;margin:0 auto;background:#30252a;border-radius:12px;touch-action:none"></canvas><div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-top:12px"><button type="button" class="secondary" data-zoom="-1">− Zoom</button><button type="button" class="secondary" data-zoom="1">＋ Zoom</button><button type="button" class="secondary" data-reset>↺ Reset</button><button type="button" class="primary" data-save>💾 Save Image</button><button type="button" class="secondary" data-close>Close</button></div><p style="font-size:12px;color:#80636e;margin:10px 0 0;text-align:center">Drag the image to position it. Save Image uploads the cropped image to Rosemoon.</p>';
  let editBtn=section.querySelector(isCategory?'#manageCategoryPhotoEdit':'[data-flower-crop-button]');
  if(!editBtn){editBtn=document.createElement('button');editBtn.type='button';editBtn.className='secondary';editBtn.style.cssText='display:block;margin-top:10px';if(isCategory){editBtn.id='manageCategoryPhotoEdit';editBtn.textContent='✂️ Edit / Crop Category Image'}else{editBtn.dataset.flowerCropButton='1';editBtn.textContent='✂️ Edit / Crop Flower Image'}(preview||input).insertAdjacentElement('afterend',editBtn)}
  editBtn.type='button';
  editBtn.onclick=()=>openCurrentImage();
  editBtn.insertAdjacentElement('afterend',editor);
  const canvas=editor.querySelector('canvas'),ctx=canvas.getContext('2d'),ratio=editor.querySelector('[data-ratio]'),message=editor.querySelector('[data-editor-message]');
  function frame(){const r=ratios[ratio.value]||1;let w=660,h=660;if(r>1)h=w/r;else w=h*r;return{x:(700-w)/2,y:(700-h)/2,w,h}}
  function draw(){ctx.clearRect(0,0,700,700);ctx.fillStyle='#30252a';ctx.fillRect(0,0,700,700);const c=frame();if(image){const fit=Math.max(c.w/image.width,c.h/image.height),s=fit*scale,w=image.width*s,h=image.height*s;ctx.drawImage(image,(700-w)/2+panX,(700-h)/2+panY,w,h)}ctx.fillStyle='rgba(20,10,15,.55)';ctx.fillRect(0,0,700,c.y);ctx.fillRect(0,c.y+c.h,700,700-c.y-c.h);ctx.fillRect(0,c.y,c.x,c.h);ctx.fillRect(c.x+c.w,c.y,700-c.x-c.w,c.h);ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.strokeRect(c.x,c.y,c.w,c.h)}
  function reset(){scale=1;panX=0;panY=0;draw()}
  function show(){editor.style.display='block';editor.scrollIntoView({behavior:'smooth',block:'nearest'})}
  function chooseOriginal(reason){message.textContent=reason+' Please choose the original image file; then the crop editor will open.';show();input.click()}
  function showEditor(src,remote){image=new Image();image.onload=()=>{message.textContent='Drag the image to position it, then press Save Image.';reset();show()};image.onerror=()=>{image=null;draw();chooseOriginal('The saved preview cannot be edited directly from its image host.');};if(remote)image.crossOrigin='anonymous';image.src=src}
  function openCurrentImage(){const file=input.files&&input.files[0];if(file){if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=URL.createObjectURL(file);showEditor(objectUrl,false);return}const current=section.querySelector('.flower-photo-preview img')||section.querySelector('#manageCategoryPhotoPreview img');if(current&&current.src){showEditor(current.src,true);return}chooseOriginal('No current image preview was found.')}
  input.addEventListener('change',()=>{const file=input.files&&input.files[0];if(!file)return;if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=URL.createObjectURL(file);showEditor(objectUrl,false)});
  ratio.addEventListener('change',reset);
  editor.querySelectorAll('[data-zoom]').forEach(b=>b.addEventListener('click',()=>{if(!image)return;scale=Math.max(.2,Math.min(8,scale*(Number(b.dataset.zoom)>0?1.12:1/1.12)));draw()}));
  editor.querySelector('[data-reset]').addEventListener('click',reset);
  editor.querySelector('[data-close]').addEventListener('click',()=>{editor.style.display='none'});
  canvas.addEventListener('pointerdown',e=>{if(!image)return;const r=canvas.getBoundingClientRect();drag={x:e.clientX,y:e.clientY,px:panX,py:panY,sx:700/r.width};canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener('pointermove',e=>{if(!drag)return;panX=drag.px+(e.clientX-drag.x)*drag.sx;panY=drag.py+(e.clientY-drag.y)*drag.sx;draw()});
  const stop=()=>drag=null;canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);
  editor.querySelector('[data-save]').addEventListener('click',async()=>{
   if(!image){chooseOriginal('Choose an image before saving.');return}
   const save=editor.querySelector('[data-save]');save.disabled=true;save.textContent='Saving…';
   try{
    const c=frame(),long=Math.max(300,Math.min(2400,Number(editor.querySelector('[data-size]').value)||900)),w=c.w>=c.h?long:Math.round(long*c.w/c.h),h=c.h>=c.w?long:Math.round(long*c.h/c.w),out=document.createElement('canvas');out.width=w;out.height=h;
    const s=Math.max(c.w/image.width,c.h/image.height)*scale,iw=image.width*s,ih=image.height*s,ix=(700-iw)/2+panX,iy=(700-ih)/2+panY;
    out.getContext('2d').drawImage(image,(c.x-ix)/s,(c.y-iy)/s,c.w/s,c.h/s,0,0,w,h);
    const blob=await new Promise((resolve,reject)=>out.toBlob(b=>b?resolve(b):reject(new Error('Could not create the cropped image.')),'image/jpeg',.92));
    const file=new File([blob],'rosemoon-cropped.jpg',{type:'image/jpeg'}),dt=new DataTransfer();dt.items.add(file);input.files=dt.files;
    if(preview)preview.innerHTML='<img src="'+URL.createObjectURL(blob)+'" alt="Cropped image preview" style="width:120px;height:120px;object-fit:contain;border-radius:14px;background:#fff">';
    message.textContent='Uploading and saving the cropped image…';
    if(typeof window.saveCategoryManager!=='function')throw new Error('The Rosemoon save function is not available. Please reload the admin page.');
    await window.saveCategoryManager();
    const saveStatus=document.getElementById('manageCategoryMessage');
    if(saveStatus&&saveStatus.textContent.includes('❌'))throw new Error(saveStatus.textContent);
    editor.style.display='none';
   }catch(error){message.textContent='Could not save this crop: '+(error.message||error)+' If this is an existing online image, choose its original file from your device.'}
   finally{save.disabled=false;save.textContent='💾 Save Image'}
  });
 }
 function init(){const category=document.getElementById('manageCategoryPhoto');if(category)attach(category);document.querySelectorAll('#manageFlowerOptions input[type="file"][id^="manageFlowerPhoto"]').forEach(attach)}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 const flowerBox=document.getElementById('manageFlowerOptions');if(flowerBox&&'MutationObserver'in window)new MutationObserver(init).observe(flowerBox,{childList:true,subtree:true});
 document.addEventListener('change',e=>{if(e.target.matches('#manageCategoryPhoto,#manageFlowerOptions input[type="file"][id^="manageFlowerPhoto"]'))attach(e.target)});
})();
