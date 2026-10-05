(() => {
  const API_URL = "https://script.google.com/macros/s/AKfycbw3ovS6hIwHLhp50Xrs-6ejMxZkI_q-AhB-Mz6JXbsIRKSphJcMoqBELVY4nUogRR__/exec";
  const CART_KEY = "rosemoonCartV4";
  const localFallback = {
    products: [
      {id:"small",category:"Small",name:"Small Bouquet",price:500,stock:8,imageUrl:"",active:true},
      {id:"medium",category:"Medium",name:"Medium Bouquet",price:800,stock:5,imageUrl:"",active:true},
      {id:"large",category:"Large",name:"Large Bouquet",price:1500,stock:3,imageUrl:"",active:true},
      {id:"flower-basket",category:"Flower Basket",name:"Flower Basket",price:1800,stock:6,imageUrl:"",active:true},
      {id:"others",category:"Others",name:"Others",price:0,stock:0,imageUrl:"",active:true,description:JSON.stringify({rosemoonCategory:true,options:[
        {type:"Key Ring",emoji:"🔑",stock:0,imageUrl:""},
        {type:"Decoration",emoji:"🎀",stock:0,imageUrl:""},
        {type:"Clips",emoji:"📎",stock:0,imageUrl:""}
      ]})}
    ],
    music: []
  };

  let products = [...localFallback.products];
  let cart = loadCart();
  const landing = document.getElementById("landingPage");
  const shop = document.getElementById("shopPage");
  const start = document.getElementById("startShopping");
  const loader = document.getElementById("rosemoonLoader");
  const loaderFill = document.getElementById("rosemoonLoaderFill");
  const loaderPercent = document.getElementById("rosemoonLoaderPercent");
  function setLoading(percent,text){
    const n=Math.max(0,Math.min(100,Math.round(percent)));
    if(loaderFill){loaderFill.style.width=n+"%";loaderFill.style.setProperty("--loader-progress",n+"%");loaderFill.parentElement?.style.setProperty("--loader-progress",n+"%");}
    if(loaderPercent)loaderPercent.textContent=n+"%";
  }
  function finishLoading(){
    setLoading(100,"Ready");
    setTimeout(()=>loader?.classList.add("done"),180);
  }

  function money(n){ return "Rs. " + Number(n||0).toLocaleString("en-IN"); }
  function loadCart(){ try{return JSON.parse(localStorage.getItem(CART_KEY)||"[]")}catch(e){return []} }
  function saveCart(){ localStorage.setItem(CART_KEY,JSON.stringify(cart)); }
  function stockFor(id){ return Math.max(0,Number(products.find(p=>p.id===id)?.stock??0)); }
  function categoryOptions(product){
    try{
      const d=JSON.parse(String(product?.description||''));
      if(d&&d.rosemoonCategory&&Array.isArray(d.options)&&d.options.length){
        // Category flower stock is stored independently for each option.
        // Keep zero-stock options visible so the popup accurately mirrors Admin.
        return d.options.map((o,i)=>({
          type:String(o?.type||('Flower '+(i+1))),
          emoji:String(o?.emoji||choices[i]?.[1]||'🌸'),
          stock:Math.max(0,Number(o?.stock)||0),
          price:Math.max(0,Number(o?.price ?? product?.price ?? 0)),
          imageUrl:(driveImageUrl(o?.imageUrl)||((String(o?.type||'').trim().toLowerCase()==='decoration')?'assets/Decoration.webp':''))
        }));
      }
    }catch(e){}
    return choices.map(([type,emoji])=>({type,emoji,stock:stockFor(product?.id),price:Number(product?.price||0),imageUrl:product?.imageUrl||''}));
  }
  function enterShop(){
    playUISound('breeze');
    landing.style.display="none";
    shop.classList.add("active");
    shop.setAttribute("aria-hidden","false");
    window.scrollTo(0,0);
    music.init();
    music.userRequested=true;
    music.index=0;
    music.loadTitle();
    // Start playback directly from the Start Shopping user gesture. Never wait for an async fetch here.
    music.startFromUserGesture();
  }
  start?.addEventListener("click",enterShop);
  if(start)start.disabled=true;
  if(new URLSearchParams(location.search).get("returnShop")==="1") { enterShop(); history.replaceState(null,"",location.pathname+"#shopPage"); }
  // Keep header logo anchored to the left; layout behavior is controlled by style.css.
  // Keep header logo sizing/positioning in sync with the header layout.
  // Header spacing is intentionally kept compact so navigation remains visible.
  // Edit Flowers keeps the existing photo when no replacement is selected.
  document.getElementById("homeLogo")?.addEventListener("click",e=>{e.preventDefault();shop.classList.remove("active");shop.setAttribute("aria-hidden","true");landing.style.display="grid";window.scrollTo(0,0)});

  function driveImageUrl(url){
    const s=String(url||'').trim();
    if(!s)return '';
    const m=s.match(/[?&](?:id|fileId)=([^&]+)/i)||s.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if((s.includes('drive.google.com')||s.includes('docs.google.com'))&&m?.[1]){
      return 'https://drive.google.com/thumbnail?id='+encodeURIComponent(m[1])+'&sz=w1600';
    }
    return s;
  }
  const categoryImages={
    small:"https://drive.google.com/thumbnail?id=1ylFqs2sOR4cD1qiSim2WA8j4vzOpxLbF&sz=w1600",
    medium:"https://drive.google.com/thumbnail?id=1XnzoVMRUHLgt3NX6rYGOEdrajW0i3eTf&sz=w1600",
    large:"https://drive.google.com/thumbnail?id=1SdKdIhQbWoJTCQa2s1R7_5rxsufpz0wp&sz=w1600",
    "flower basket":"https://drive.google.com/thumbnail?id=1Kx5wAgLI21Whr5spBHJLJITkx7p3Vnfy&sz=w1600",
    others:"https://drive.google.com/thumbnail?id=1saWH_Zqt-FN-7BFKlZfvxTmAs5XXgq58&sz=w1600"
  };
  const categoryOrder=["Small","Medium","Large","Flower Basket","Others"];
  function categoryImageFor(p){
    const custom=driveImageUrl(p?.imageUrl);
    if(custom)return custom;
    const key=String(p?.category||p?.name||'').trim().toLowerCase();
    return categoryImages[key]||categoryImages[String(p?.name||'').trim().toLowerCase()]||"";
  }
  function categoryPriceVisible(p){
    try{const d=JSON.parse(String(p?.description||''));return d?.priceVisible!==false}catch(e){return true}
  }
  function categoryLabel(p){
    const c=String(p?.category||p?.name||'').trim();
    return c.toLowerCase()==="others" ? "Others" : c;
  }
  function isOthers(p){return String(p?.category||p?.name||'').trim().toLowerCase()==="others";}
  function searchMatches(query){
    const q=String(query||'').trim().toLowerCase();
    return products.filter(p=>{
      if(p.active===false)return false;
      if(!q)return false;
      let flowerNames=[];
      try{const d=JSON.parse(String(p.description||''));if(d&&Array.isArray(d.options))flowerNames=d.options.map(o=>o?.type).filter(Boolean)}catch(e){}
      return [p.name,p.category,p.price,"rs. "+p.price,...flowerNames].some(v=>String(v??'').toLowerCase().includes(q));
    });
  }
  function renderSearchRecommendations(){
    const box=document.getElementById('searchRecommendations');
    const input=document.getElementById('productSearch');
    if(!box||!input)return;
    const q=String(input.value||'').trim();
    if(!q){box.innerHTML='';box.classList.remove('show');return;}
    const matches=searchMatches(q);
    if(!matches.length){box.innerHTML='<div class="search-empty">🌸 No matching bouquets found</div>';box.classList.add('show');return;}
    box.innerHTML='<div class="search-recommend-title">✨ Matching bouquets</div>'+matches.map(p=>{
      const img=categoryImageFor(p);
      const art=img?'<img src="'+escapeAttr(img)+'" alt="'+escapeAttr(p.name)+'">':(p.imageUrl?'<img src="'+escapeAttr(p.imageUrl)+'" alt="'+escapeAttr(p.name)+'">':'🌹');
      return '<button class="search-recommend-item" type="button" data-search-id="'+escapeAttr(p.id)+'"><span class="search-recommend-pic">'+art+'</span><span class="search-recommend-info"><strong>'+escapeHtml(p.name)+'</strong><small>'+escapeHtml(p.category)+(categoryPriceVisible(p)?' · '+money(p.price):'')+'</small></span></button>';
    }).join('');
    box.classList.add('show');
    box.querySelectorAll('[data-search-id]').forEach(item=>item.addEventListener('click',()=>{
      const id=item.dataset.searchId; input.value=''; box.classList.remove('show'); renderProducts(); openFlowerPopup(id);
    }));
  }
  function renderProducts(){
    const grid=document.getElementById("productsGrid"); if(!grid)return;
    const query=String(document.getElementById("productSearch")?.value||"").trim().toLowerCase();
    const base=products.filter(p=>p.active!==false);
    const active=query?base.filter(p=>searchMatches(query).some(m=>m.id===p.id)):base;
    if(!active.length){
      grid.innerHTML='<div class="product" style="grid-column:1/-1;text-align:center;padding:35px"><div style="font-size:38px;margin-bottom:8px">🌸</div>No bouquets found.<br><small style="color:#9b7d88">Try another name, category or price.</small></div>';
      return;
    }
    const order=categoryOrder.map(x=>x.toLowerCase());
    active.sort((a,b)=>{
      const ai=order.indexOf(String(a.category||a.name||"").toLowerCase()), bi=order.indexOf(String(b.category||b.name||"").toLowerCase());
      return (ai<0?99:ai)-(bi<0?99:bi);
    });
    grid.innerHTML=active.map(p=>{
      const fixedImage=categoryImageFor(p);
      // Category image sizing is controlled by style.css; keep the original image ratio and never crop.
      const art=fixedImage?'<img class="category-flower-image" src="'+fixedImage+'" alt="'+escapeAttr(p.name)+'">':'';
      return '<article class="product" data-id="'+escapeAttr(p.id)+'" data-size="'+escapeAttr(p.category)+'" data-price="'+p.price+'" role="button" tabindex="0" aria-label="Open '+escapeAttr(categoryLabel(p))+' flower shop" style="cursor:pointer">'+
        '<div class="product-top">'+(categoryPriceVisible(p)?'<span class="price-badge">'+money(p.price)+'</span>':'')+'</div>'+
        '<div class="bouquet-preview"><div class="flower-art">'+art+'</div></div>'+
        '<div style="font-weight:800;margin:10px 0 3px;color:#3b202b">'+escapeHtml(categoryLabel(p))+'</div>'+
      '</article>';
    }).join("");
    grid.querySelectorAll(".product[data-id]").forEach(card=>{
      card.addEventListener("click",()=>openFlowerPopup(card.dataset.id));
      card.addEventListener("keydown",e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openFlowerPopup(card.dataset.id)}});
    });
  }
  function escapeHtml(v){return String(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function escapeAttr(v){return escapeHtml(v)}

  const productSearch=document.getElementById("productSearch");
  const clearProductSearch=document.getElementById("clearProductSearch");
  productSearch?.addEventListener("input",()=>{renderProducts();renderSearchRecommendations()});
  productSearch?.addEventListener("focus",()=>renderSearchRecommendations());
  clearProductSearch?.addEventListener("click",()=>{if(productSearch){productSearch.value="";productSearch.focus();renderProducts();renderSearchRecommendations()}});
  document.addEventListener('click',e=>{if(!e.target.closest('.rosemoon-search'))document.getElementById('searchRecommendations')?.classList.remove('show')});

  const popup=document.getElementById("flowerPopup"), grid=document.getElementById("flowerPopupGrid"), sub=document.getElementById("flowerPopupSub"), closePopup=document.getElementById("closeFlowerPopup");
  let popupProduct=null;
  const choices=[["Flower 1","🌹"],["Flower 2","🌸"],["Flower 3","🌼"],["Flower 4","🌷"],["Flower 5","🌻"]];
  function playCategorySound(product){
    const text=(product?.category||product?.name||'').toLowerCase();
    if(text.includes('basket')) return playUISound('basket');
    if(text.includes('large')) return playUISound('large');
    if(text.includes('medium')) return playUISound('medium');
    return playUISound('small');
  }
  function openFlowerPopup(id){
    popupProduct=products.find(p=>p.id===id); if(!popupProduct)return;
    playCategorySound(popupProduct);
    sub.textContent=categoryPriceVisible(popupProduct)?`${popupProduct.name} · ${money(popupProduct.price)}. Choose a flower.`:`${popupProduct.name}. Choose a flower.`;
    const options=categoryOptions(popupProduct);
    grid.innerHTML=options.map(o=>{
      const type=String(o.type||'Flower 1'),emoji=String(o.emoji||'🌸'),stock=Math.max(0,Number(o.stock)||0),price=Math.max(0,Number(o.price ?? popupProduct.price ?? 0)),imageUrl=driveImageUrl(o.imageUrl);
      const isDecoration=type.trim().toLowerCase()==='decoration';
      const art=imageUrl?`<img class="${isDecoration?'decoration-full-image':''}" src="${escapeAttr(imageUrl)}" alt="${escapeAttr(type)}">`:emoji;
      const stockClass=stock===0?"out":stock<=2?"low":"";
      return `<article class="flower-popup-card"><div class="flower-popup-art">${art}</div><h3>${escapeHtml(type)}</h3><div class="flower-popup-price">${money(price)}</div><div class="flower-popup-stock ${stockClass}">${stock===0?"Sold out":stock+" in stock"}</div><button type="button" data-popup-buy data-type="${escapeAttr(type)}" data-emoji="${escapeAttr(emoji)}" ${stock===0?'disabled':''}>🛒 Add to Cart</button></article>`;
    }).join("");
    popup.classList.add("open"); popup.setAttribute("aria-hidden","false"); lockBackgroundScroll();
  }
  let lockedScrollY=0;
  function lockBackgroundScroll(){
    lockedScrollY=window.scrollY||window.pageYOffset||0;
    document.documentElement.classList.add("flower-popup-open");
    document.body.classList.add("flower-popup-open");
  }
  function unlockBackgroundScroll(){
    document.documentElement.classList.remove("flower-popup-open");
    document.body.classList.remove("flower-popup-open");
    window.scrollTo(0,lockedScrollY);
  }
  function closeFlowerPopup(){popup.classList.remove("open");popup.setAttribute("aria-hidden","true");unlockBackgroundScroll()}
  closePopup?.addEventListener("click",closeFlowerPopup); popup?.addEventListener("click",e=>{if(e.target===popup)closeFlowerPopup()});
  grid?.addEventListener("click",e=>{const b=e.target.closest("[data-popup-buy]");if(!b||!popupProduct)return;const options=categoryOptions(popupProduct);const selected=options.find(o=>String(o.type||'')===String(b.dataset.type));const ok=addItem({id:popupProduct.id,size:popupProduct.category,name:popupProduct.name,price:Math.max(0,Number(selected?.price ?? popupProduct.price ?? 0)),type:b.dataset.type,emoji:b.dataset.emoji,imageUrl:(selected?.imageUrl||popupProduct.imageUrl)},true,b);if(ok){b.textContent="✓ Added";b.disabled=true;setTimeout(closeFlowerPopup,300)}});

  let uiSoundCtx=null;
  function playUISound(kind='normal'){
    try{
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC)return;
      if(!uiSoundCtx)uiSoundCtx=new AC();
      if(uiSoundCtx.state==='suspended')uiSoundCtx.resume();
      const now=uiSoundCtx.currentTime;
      const gain=uiSoundCtx.createGain();
      gain.gain.setValueAtTime(0.0001,now);
      gain.connect(uiSoundCtx.destination);
      const osc=uiSoundCtx.createOscillator();
      osc.connect(gain);
      osc.type=kind==='order'?'sine':kind==='cart'?'triangle':kind==='cartOpen'?'sawtooth':'sine';
      if(kind==='small' || kind==='medium' || kind==='large' || kind==='basket'){
        const profiles={
          small:[660,880,0.22],
          medium:[540,760,0.24],
          large:[440,660,0.28],
          basket:[620,980,0.30]
        };
        const [startF,endF,dur]=profiles[kind];
        osc.type='sine';
        osc.frequency.setValueAtTime(startF,now);
        osc.frequency.exponentialRampToValueAtTime(endF,now+dur*0.62);
        gain.gain.exponentialRampToValueAtTime(0.09,now+0.014);
        gain.gain.exponentialRampToValueAtTime(0.0001,now+dur);
        osc.start(now);osc.stop(now+dur+0.01);
        const o2=uiSoundCtx.createOscillator(),g2=uiSoundCtx.createGain();
        o2.type='sine';
        o2.frequency.setValueAtTime(endF*1.5,now+dur*0.45);
        g2.gain.setValueAtTime(0.0001,now);
        g2.gain.exponentialRampToValueAtTime(0.045,now+dur*0.48);
        g2.gain.exponentialRampToValueAtTime(0.0001,now+dur+0.08);
        o2.connect(g2);g2.connect(uiSoundCtx.destination);
        o2.start(now+dur*0.42);o2.stop(now+dur+0.09);
      }else if(kind==='cart'){
        osc.frequency.setValueAtTime(560,now);
        osc.frequency.exponentialRampToValueAtTime(920,now+0.10);
        gain.gain.exponentialRampToValueAtTime(0.13,now+0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001,now+0.18);
        osc.start(now);osc.stop(now+0.19);
      }else if(kind==='cartSparkle'){
        // Noticeable but gentle sparkle for each Add to Cart action.
        osc.type='sine';
        osc.frequency.setValueAtTime(620,now);
        osc.frequency.exponentialRampToValueAtTime(980,now+0.11);
        gain.gain.exponentialRampToValueAtTime(0.075,now+0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001,now+0.24);
        osc.start(now);osc.stop(now+0.25);
        [0.055,0.115,0.175].forEach((delay,i)=>{
          const o=uiSoundCtx.createOscillator(),g=uiSoundCtx.createGain();
          o.type='sine';
          o.frequency.value=[1320,1760,1480][i];
          g.gain.setValueAtTime(0.0001,now);
          g.gain.exponentialRampToValueAtTime([0.045,0.055,0.04][i],now+delay+0.008);
          g.gain.exponentialRampToValueAtTime(0.0001,now+delay+0.13);
          o.connect(g);g.connect(uiSoundCtx.destination);
          o.start(now+delay);o.stop(now+delay+0.14);
        });
      }else if(kind==='order'){
        osc.frequency.setValueAtTime(520,now);
        osc.frequency.exponentialRampToValueAtTime(780,now+0.10);
        const osc2=uiSoundCtx.createOscillator(),g2=uiSoundCtx.createGain();
        osc2.type='sine';osc2.frequency.setValueAtTime(780,now+0.09);osc2.frequency.exponentialRampToValueAtTime(1040,now+0.22);
        g2.gain.setValueAtTime(0.0001,now);g2.gain.exponentialRampToValueAtTime(0.075,now+0.10);g2.gain.exponentialRampToValueAtTime(0.0001,now+0.32);
        osc2.connect(g2);g2.connect(uiSoundCtx.destination);
        gain.gain.exponentialRampToValueAtTime(0.075,now+0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001,now+0.20);
        osc.start(now);osc.stop(now+0.21);osc2.start(now+0.08);osc2.stop(now+0.33);
      }else if(kind==='cartOpen'){
        osc.type='triangle';
        osc.frequency.setValueAtTime(300,now);
        osc.frequency.exponentialRampToValueAtTime(720,now+0.16);
        gain.gain.exponentialRampToValueAtTime(0.14,now+0.018);
        gain.gain.exponentialRampToValueAtTime(0.0001,now+0.30);
        osc.start(now);osc.stop(now+0.31);
        [0.07,0.14].forEach((delay,i)=>{
          const o=uiSoundCtx.createOscillator(),g=uiSoundCtx.createGain();
          o.type='sine';o.frequency.value=i?1120:900;
          g.gain.setValueAtTime(0.0001,now);
          g.gain.exponentialRampToValueAtTime(0.075,now+delay+0.01);
          g.gain.exponentialRampToValueAtTime(0.0001,now+delay+0.16);
          o.connect(g);g.connect(uiSoundCtx.destination);o.start(now+delay);o.stop(now+delay+0.17);
        });
      }else if(kind==='breeze'){
        // Delicate crystal-chime sound for opening Start Shopping.
        osc.type='sine';
        osc.frequency.setValueAtTime(784,now);
        gain.gain.exponentialRampToValueAtTime(0.065,now+0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001,now+0.62);
        osc.start(now);osc.stop(now+0.64);
        [0.07,0.16,0.27].forEach((delay,i)=>{
          const o=uiSoundCtx.createOscillator(),g=uiSoundCtx.createGain();
          o.type='sine';
          o.frequency.value=[1174,1568,1976][i];
          g.gain.setValueAtTime(0.0001,now);
          g.gain.exponentialRampToValueAtTime([0.052,0.045,0.035][i],now+delay+0.008);
          g.gain.exponentialRampToValueAtTime(0.0001,now+delay+0.38);
          o.connect(g);g.connect(uiSoundCtx.destination);
          o.start(now+delay);o.stop(now+delay+0.40);
        });
      }else if(kind==='sparkle'){
        osc.type='sine';
        osc.frequency.setValueAtTime(880,now);
        osc.frequency.exponentialRampToValueAtTime(1320,now+0.16);
        gain.gain.exponentialRampToValueAtTime(0.085,now+0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001,now+0.30);
        osc.start(now);osc.stop(now+0.31);
        [0.08,0.16].forEach((delay,i)=>{
          const o=uiSoundCtx.createOscillator(),g=uiSoundCtx.createGain();
          o.type='sine';o.frequency.value=i?1760:1480;
          g.gain.setValueAtTime(0.0001,now);g.gain.exponentialRampToValueAtTime(0.055,now+delay+0.01);g.gain.exponentialRampToValueAtTime(0.0001,now+delay+0.18);
          o.connect(g);g.connect(uiSoundCtx.destination);o.start(now+delay);o.stop(now+delay+0.19);
        });
      }else{
        osc.frequency.setValueAtTime(420,now);
        osc.frequency.exponentialRampToValueAtTime(500,now+0.035);
        gain.gain.exponentialRampToValueAtTime(0.042,now+0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001,now+0.055);
        osc.start(now);osc.stop(now+0.06);
      }
    }catch(e){}
  }
  document.addEventListener('click',e=>{
    const target=e.target.closest('button, a, [role="button"]');
    if(!target || target.disabled || target.getAttribute('aria-disabled')==='true')return;
    if(target.closest('[data-popup-buy]') || target.closest('[data-add-cart]') || target.closest('.product[data-id]') || target.closest('#startShopping') || target.closest('#openCartBtn')) return;
    if(target.closest('#orderForm') || target.classList.contains('checkout-btn')) playUISound('order');
    else playUISound('normal');
  },true);

  function animateCartAdd(source){
    const cartBtn=document.getElementById('openCartBtn');
    const count=document.getElementById('headerCartCount');
    const layer=document.getElementById('cartFxLayer')||(()=>{const x=document.createElement('div');x.id='cartFxLayer';document.body.appendChild(x);return x})();
    if(cartBtn){cartBtn.classList.remove('cart-add-bounce');void cartBtn.offsetWidth;cartBtn.classList.add('cart-add-bounce');setTimeout(()=>cartBtn.classList.remove('cart-add-bounce'),750)}
    if(count){count.classList.remove('cart-count-pop');void count.offsetWidth;count.classList.add('cart-count-pop')}
    if(!source||!cartBtn)return;
    const from=source.getBoundingClientRect(),to=cartBtn.getBoundingClientRect();
    const sx=from.left+from.width/2, sy=from.top+from.height/2;
    const ex=to.left+to.width/2, ey=to.top+to.height/2;
    const flyer=document.createElement('div');
    flyer.className='cart-fly-item';
    flyer.textContent=source.dataset.emoji||'🌹';
    flyer.style.left=(sx-28)+'px'; flyer.style.top=(sy-28)+'px';
    layer.appendChild(flyer);
    flyer.animate([
      {transform:'translate3d(0,0,0) scale(.45) rotate(-12deg)',opacity:0},
      {transform:'translate3d(0,0,0) scale(1.2) rotate(8deg)',opacity:1,offset:.18},
      {transform:`translate3d(${(ex-sx)*.52}px,${(ey-sy)*.52-75}px,0) scale(1.05) rotate(170deg)`,opacity:1,offset:.55},
      {transform:`translate3d(${ex-sx}px,${ey-sy}px,0) scale(.18) rotate(360deg)`,opacity:0}
    ],{duration:850,easing:'cubic-bezier(.18,.8,.22,1)',fill:'forwards'});
    const sparkChars=['✦','✧','✿','•','♡'];
    for(let i=0;i<9;i++){
      const p=document.createElement('span');p.className='cart-fx-spark';p.textContent=sparkChars[i%sparkChars.length];
      p.style.left=(sx-8)+'px';p.style.top=(sy-8)+'px';
      const angle=(Math.PI*2*i/9)+(Math.random()-.5)*.45, dist=55+Math.random()*65;
      p.style.setProperty('--sx',(Math.cos(angle)*dist)+'px');p.style.setProperty('--sy',(Math.sin(angle)*dist-15)+'px');
      layer.appendChild(p);setTimeout(()=>p.remove(),700);
    }
    setTimeout(()=>flyer.remove(),900);
  }

  function itemStockFor(item){
    const p=products.find(x=>String(x.id)===String(item?.id));
    if(!p)return 0;
    try{
      const d=JSON.parse(String(p.description||''));
      if(d?.rosemoonCategory&&Array.isArray(d.options)){
        const opt=d.options.find(o=>String(o?.type||'')===String(item?.type||''));
        if(opt)return Math.max(0,Number(opt.stock)||0);
      }
    }catch(e){}
    return stockFor(item.id);
  }
  function addItem(item,silent=false,source=null){
    const stock=itemStockFor(item), existing=cart.find(x=>x.id===item.id&&x.type===item.type);
    if((existing?.qty||0)>=stock){toast("Stock limit reached");return false}
    if(existing)existing.qty++;else cart.push({...item,qty:1});
    saveCart();renderCart();playUISound('cartSparkle');animateCartAdd(source);if(!silent)toast("Added to cart");return true;
  }
  window.rosemoonAddItem=addItem;

  const cartPanel=document.getElementById("cartPanel"), cartBackdrop=document.getElementById("cartBackdrop");
  function openCart(){playUISound('cartOpen');cartPanel.classList.add("open");cartPanel.setAttribute("aria-hidden","false");cartBackdrop.classList.add("open")}
  function closeCart(){cartPanel.classList.remove("open");cartPanel.setAttribute("aria-hidden","true");cartBackdrop.classList.remove("open")}
  document.getElementById("openCartBtn")?.addEventListener("click",openCart);document.getElementById("closeCart")?.addEventListener("click",closeCart);cartBackdrop?.addEventListener("click",closeCart);
  if(new URLSearchParams(location.search).get("openCart")==="1")setTimeout(openCart,120);

  function getDeliveryCharge(){
    const location=document.getElementById("deliveryLocation")?.value||"";
    return location==="Pokhara"?150:0;
  }
  function cartImageFor(item){
    const direct=driveImageUrl(item?.imageUrl);
    if(direct)return direct;
    const p=products.find(x=>String(x.id)===String(item?.id));
    if(p){
      try{
        const d=JSON.parse(String(p.description||''));
        const opt=Array.isArray(d?.options)?d.options.find(o=>String(o?.type||'')===String(item?.type||'')):null;
        const flower=driveImageUrl(opt?.imageUrl);
        if(flower)return flower;
      }catch(e){}
      const category=driveImageUrl(p.imageUrl);
      if(category)return category;
    }
    return categoryImageFor(p||{});
  }
  function renderCart(){
    const box=document.getElementById("cartItems"),count=cart.reduce((s,x)=>s+x.qty,0),subtotal=cart.reduce((s,x)=>s+x.qty*x.price,0),delivery=getDeliveryCharge(),total=subtotal+delivery;
    document.getElementById("headerCartCount").textContent=count;
    const sub=document.getElementById("cartSubtotal");if(sub)sub.textContent=money(subtotal);
    const dc=document.getElementById("deliveryCharge");if(dc)dc.textContent=money(delivery);
    document.getElementById("cartTotal").textContent=money(total);
    if(!cart.length){box.innerHTML='<p class="cart-empty">Your cart is empty. 🌷</p>';return}
    box.innerHTML=cart.map((x,i)=>{const cartImage=cartImageFor(x);return `<div class="cart-item"><div class="cart-icon">${cartImage?`<img src="${escapeAttr(cartImage)}" alt="" style="width:42px;height:42px;object-fit:contain;border-radius:10px">`:x.emoji}</div><div class="cart-info"><strong>${escapeHtml(x.name||x.size)}</strong><small>${escapeHtml(x.type)} · ${money(x.price)}</small></div><div class="qty"><button data-q="-" data-i="${i}">−</button><b>${x.qty}</b><button data-q="+" data-i="${i}">+</button></div><button class="remove" data-q="x" data-i="${i}">×</button></div>`}).join("");
  }
  document.getElementById("deliveryLocation")?.addEventListener("change",()=>renderCart());
  document.getElementById("cartItems")?.addEventListener("click",e=>{const b=e.target.closest("[data-q]");if(!b)return;const i=+b.dataset.i,x=cart[i];if(!x)return;if(b.dataset.q==="+"&&x.qty<itemStockFor(x))x.qty++;if(b.dataset.q==="-")x.qty--;if(b.dataset.q==="x"||x.qty<=0)cart.splice(i,1);saveCart();renderCart()});
  function toast(msg){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove("show"),1800)}
  document.getElementById("openGuide")?.addEventListener("click",()=>document.getElementById("guideModal").classList.add("open"));
  document.getElementById("closeGuide")?.addEventListener("click",()=>document.getElementById("guideModal").classList.remove("open"));
  document.querySelector("[data-close-guide]")?.addEventListener("click",()=>document.getElementById("guideModal").classList.remove("open"));

  const music={songs:[],index:0,ready:false,userRequested:false,switchToken:0,cache:{},loading:{},
    init(){
      if(this.ready)return;
      this.ready=true;
      this.audio=document.getElementById("rosemoonAudio");
    this.audio.playbackRate=1;
      this.audio.preload="auto";
      this.loadMusic();
      this.audio.addEventListener("ended",()=>this.next(true));
      this.audio.addEventListener("play",()=>this.state(true));
      this.audio.addEventListener("pause",()=>this.state(false));
      this.audio.addEventListener("error",()=>{this.state(false);document.getElementById("songStatus").textContent="Music unavailable"});
    },
    loadMusic(){
      const list=(window.rosemoonMusic||localFallback.music).map(x=>Array.isArray(x)?x:[x.title,x.url,x.fileId]).filter(x=>x&&x[1]);
      this.songs=list;
      if(!this.songs.length){this.audio.removeAttribute("src");this.audio.load();document.getElementById("songTitle").textContent="No music yet";document.getElementById("songStatus").textContent="Add music from Admin";document.getElementById("toggleMusic").disabled=true;return;}
      document.getElementById("toggleMusic").disabled=false;
      if(this.index<0||this.index>=this.songs.length)this.index=0;
      this.loadTitle();
      this.prepare(this.index);
    },
    async prepare(index){
      const s=this.songs[index];if(!s)return null;
      const key=s[2]||s[1];
      if(this.cache[key])return this.cache[key];
      if(this.loading[key])return this.loading[key];
      this.loading[key]=(async()=>{
        try{
          if(s[2]){
            const r=await fetch(`${API_URL}?action=musicFile&fileId=${encodeURIComponent(s[2])}&_=${Date.now()}`,{cache:"no-store"});
            const d=await r.json();
            if(!d.success||!d.base64)throw new Error("Music file unavailable");
            const src=`data:audio/mpeg;base64,${d.base64}`;this.cache[key]=src;return src;
          }
          this.cache[key]=s[1];return s[1];
        }catch(e){return null}finally{delete this.loading[key]}})();
      return this.loading[key];
    },
    startFromUserGesture(){
      this.init();
      if(!this.songs.length){this.userRequested=true;document.getElementById("songStatus").textContent="Music loading…";return false;}
      const s=this.songs[this.index];
      const key=s[2]||s[1];
      const src=this.cache[key]||s[1];
      if(!src){document.getElementById("songStatus").textContent="Music unavailable";return false;}
      this.audio.pause();
      this.audio.playbackRate=1;
      if(this.audio.src!==src){this.audio.src=src;this.audio.currentTime=0;}
      // This play() call is intentionally synchronous with the user's click.
      const p=this.audio.play();
      if(p&&typeof p.catch==="function")p.catch(()=>{this.state(false);document.getElementById("songStatus").textContent="Click ▶ to play";});
      return true;
    },
    async play(){
      this.init();
      if(!this.songs.length){document.getElementById("songStatus").textContent="Add music from Admin";return false;}
      const key=this.songs[this.index][2]||this.songs[this.index][1];
      let src=this.cache[key]||await this.prepare(this.index);
      if(!src){this.state(false);document.getElementById("songStatus").textContent="Music unavailable";return false;}
      if(this.audio.src!==src){this.audio.src=src;this.audio.currentTime=0; this.audio.playbackRate=1;this.audio.load();}
      try{await this.audio.play();return true}catch(e){this.state(false);document.getElementById("songStatus").textContent="Click ▶ to play";return false}
    },
    pause(){if(this.audio)this.audio.pause()},
    async switchTo(index,auto=false){
      if(!this.songs.length)return false;
      const token=++this.switchToken;
      index=(index+this.songs.length)%this.songs.length;
      const target=this.songs[index];
      if(this.audio&&!this.audio.paused)this.audio.pause();
      this.state(false);
      document.getElementById("songStatus").textContent="Switching…";
      const src=await this.prepare(index);
      if(token!==this.switchToken)return false;
      if(!src){document.getElementById("songStatus").textContent="Music unavailable";return false;}
      this.index=index;
      if(this.audio.src!==src){this.audio.src=src;this.audio.currentTime=0; this.audio.playbackRate=1;this.audio.load();}
      else this.audio.currentTime=0; this.audio.playbackRate=1;
      try{
        await this.audio.play();
        if(token!==this.switchToken)return false;
        this.loadTitle();
        return true;
      }catch(e){
        if(token!==this.switchToken)return false;
        this.loadTitle();
        this.state(false);
        document.getElementById("songStatus").textContent="Click ▶ to play";
        return false;
      }
    },
    next(auto=false){return this.switchTo(this.index+1,auto)},
    prev(){return this.switchTo(this.index-1,false)}
    ,loadTitle(){const s=this.songs[this.index]||["Rosemoon Music",""];document.getElementById("songTitle").textContent=s[0]||"Rosemoon Music";document.getElementById("songStatus").textContent="Ready"},
    state(playing){document.getElementById("musicDisc").classList.toggle("playing",playing);document.getElementById("musicWave").classList.toggle("playing",playing);document.getElementById("toggleMusic").textContent=playing?"❚❚":"▶";document.getElementById("toggleMusic").setAttribute("aria-label",playing?"Pause music":"Play music");document.getElementById("songStatus").textContent=playing?"Playing":"Paused"}
  };
  document.getElementById("toggleMusic")?.addEventListener("click",()=>{
    music.init();
    music.userRequested=true;
    if(!music.songs.length){document.getElementById("songStatus").textContent="Music is still loading…";syncMusic();return;}
    if(music.audio.paused){
      music.play();
    }else{music.pause();}
  });document.getElementById("nextSong")?.addEventListener("click",()=>music.next());document.getElementById("prevSong")?.addEventListener("click",()=>music.prev());document.getElementById("muteMusic")?.addEventListener("click",e=>{music.init();music.audio.muted=!music.audio.muted;e.currentTarget.textContent=music.audio.muted?"🔇":"🔊"});

  document.getElementById("orderForm")?.addEventListener("submit",async e=>{
    e.preventDefault();const note=document.getElementById("formNote");if(!cart.length){note.textContent="Add a bouquet first.";return}
    const deliveryLocation=document.getElementById("deliveryLocation").value;
    if(!deliveryLocation){note.textContent="Choose a delivery location.";return}
    const deliveryCharge=deliveryLocation==="Pokhara"?150:0;
    const subtotal=cart.reduce((s,x)=>s+x.qty*x.price,0),total=subtotal+deliveryCharge;for(const x of cart)if(x.qty>itemStockFor(x)){note.textContent=`Not enough stock for ${x.name}.`;return}
    const items=cart.map(x=>({productId:x.id,name:x.name,type:x.type,qty:x.qty,price:x.price}));
    try{const response=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action:"placeOrder",customer:{name:document.getElementById("name").value,phone:document.getElementById("phone").value,note:document.getElementById("note").value,payment:document.getElementById("payment").value,deliveryLocation,deliveryCharge},items,total})});const result=await response.json();if(!result.success)throw new Error(result.message||"Order failed");if(Array.isArray(result.products)){products=result.products;renderProducts()}await syncProducts();playUISound('order');note.textContent=`Order ${result.orderId||""} received.`;cart.length=0;saveCart();renderCart()}catch(err){note.textContent="Order could not be confirmed. Please try again."}
  });

  async function syncProducts(){
    try{const r=await fetch(`${API_URL}?action=products&_=${Date.now()}`,{cache:"no-store"});const d=await r.json();if(d.success&&Array.isArray(d.products)){
        products=d.products;
        if(!products.some(p=>String(p?.category||"").trim().toLowerCase()==="others")){
          products.push(localFallback.products.find(p=>p.id==="others"));
        }
        window.rosemoonProducts=products;renderProducts()
      }}
    catch(e){window.rosemoonProducts=products;renderProducts()}
  }
  async function syncMusic(){
    try{
      const r=await fetch(`${API_URL}?action=music&_=${Date.now()}`,{cache:"no-store"});
      const d=await r.json();
      if(d.success&&Array.isArray(d.music)){
        window.rosemoonMusic=d.music.filter(x=>x.active!==false).sort((a,b)=>a.sort-b.sort).map(x=>[x.title||"",x.url,x.fileId]);
        music.init();
        music.loadMusic();
        return music.songs.length;
      }
    }catch(e){}
    music.init();
    music.loadMusic();
    return music.songs.length;
  }

  async function prepareFirstMusic(){
    if(!music.songs.length){setLoading(76,"No music yet");return;}
    setLoading(60,"Preparing first song…");
    await music.prepare(0);
    setLoading(78,"Getting music ready…");
    // Start preparing the remaining tracks in the background; do not block the shop.
    for(let i=1;i<music.songs.length;i++){
      music.prepare(i).catch(()=>{});
    }
  }


  renderProducts();renderCart();window.rosemoonProducts=products;

  (async()=>{
    setLoading(8,"Loading Rosemoon…");
    await syncProducts();
    setLoading(42,"Loading music…");
    await syncMusic();
    await prepareFirstMusic();
    if(start)start.disabled=false;
    finishLoading();
  })();
  setInterval(syncProducts,30000);setInterval(syncMusic,30000);
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeFlowerPopup();document.getElementById("guideModal").classList.remove("open");closeCart()}});
})();
