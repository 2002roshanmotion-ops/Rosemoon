/**
 * ROSEMOON OWNER SYSTEM - Google Sheet backend
 */

const ADMIN_KEY = '1';
const PRODUCT_HEADERS = ['Product ID','Category','Name','Price','Stock','Image URL','Active','Featured','New','Description'];
const ORDER_HEADERS = ['Order ID','Date','Customer ID','Customer','Phone','Delivery Details','Payment','Items','Total','Status','Stock Updated'];
const CUSTOMER_HEADERS = ['Customer ID','Name','Phone','Delivery Details','First Order','Last Order','Order Count','Total Spent'];
const MUSIC_HEADERS = ['Music ID','Title','Audio URL','Drive File ID','Active','Sort Order','Added Date'];
const ROSEMOON_MUSIC_FOLDER_ID = '1H0G30L6xttJUGoewDKxWagkR5rmNBm4o';
const CATEGORY_HEADERS = ['Category ID','Name','Active','Sort Order'];
const OFFER_HEADERS = ['Offer ID','Code','Title','Description','Discount Type','Discount Value','Active','Start Date','End Date'];
const SETTINGS_HEADERS = ['Key','Value','Description'];
const ACTIVITY_HEADERS = ['Activity ID','Date','Action','Details'];

const DEFAULT_PRODUCTS = [
  ['small','Small','Small Bouquet',500,8,'',true,false,false,''],
  ['medium','Medium','Medium Bouquet',800,5,'',true,false,false,''],
  ['large','Large','Large Bouquet',1500,3,'',true,false,false,''],
  ['flower-basket','Flower Basket','Flower Basket',1800,6,'',true,false,false,'']
];

const DEFAULT_CATEGORIES = [
  ['small','Small',true,1],
  ['medium','Medium',true,2],
  ['large','Large',true,3],
  ['flower-basket','Flower Basket',true,4]
];

const DEFAULT_SETTINGS = [
  ['shop_name','Rosemoon','Website shop name'],
  ['welcome_message','Welcome to Rosemoon','Main welcome message'],
  ['announcement','','Website announcement'],
  ['banner_text','','Website banner text'],
  ['shop_visible','true','Show or hide the flower shop'],
  ['currency','Rs.','Display currency']
];

function getSpreadsheet_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function setupRosemoonSheet() {
  const ss = getSpreadsheet_();
  ensureSheet_(ss,'Settings',SETTINGS_HEADERS,DEFAULT_SETTINGS);
  ensureSheet_(ss,'Categories',CATEGORY_HEADERS,DEFAULT_CATEGORIES);
  ensureSheet_(ss,'Products',PRODUCT_HEADERS,DEFAULT_PRODUCTS);
  ensureSheet_(ss,'Orders',ORDER_HEADERS,[]);
  ensureSheet_(ss,'Customers',CUSTOMER_HEADERS,[]);
  ensureSheet_(ss,'Music',MUSIC_HEADERS,[]);
  ensureSheet_(ss,'Offers',OFFER_HEADERS,[]);
  ensureSheet_(ss,'Activity',ACTIVITY_HEADERS,[]);
  ensureFolder_('Rosemoon Product Photos','ROSEMOON_PHOTO_FOLDER_ID');
  ensureFolder_('Rosemoon Music','ROSEMOON_MUSIC_FOLDER_ID');
  PropertiesService.getScriptProperties().setProperty('ROSEMOON_SETUP_DONE','true');
  logActivity_('SETUP','Rosemoon Sheet structure checked/created.');
  return {success:true,message:'Rosemoon Sheet is ready.',sheets:ss.getSheets().map(s=>s.getName())};
}

function ensureSheet_(ss,name,headers,defaults) {
  let sheet=ss.getSheetByName(name);
  if(!sheet) sheet=ss.insertSheet(name);
  sheet.getRange(1,1,1,headers.length).setValues([headers]);
  if(sheet.getLastRow()===1 && defaults && defaults.length) {
    sheet.getRange(2,1,defaults.length,headers.length).setValues(defaults);
  }
  sheet.setFrozenRows(1);
  return sheet;
}

function ensureFolder_(name,propertyKey) {
  const props=PropertiesService.getScriptProperties();
  const existing=props.getProperty(propertyKey);
  if(existing) {
    try { DriveApp.getFolderById(existing); return existing; } catch(e) {}
  }
  const folders=DriveApp.getFoldersByName(name);
  const folder=folders.hasNext()?folders.next():DriveApp.createFolder(name);
  props.setProperty(propertyKey,folder.getId());
  return folder.getId();
}

function doGet(e) {
  const action=e&&e.parameter?String(e.parameter.action||''):'';
  try {
    if(action==='inventory'||action==='products') return json_(getProducts_());
    if(action==='music') return json_(getMusic_());
    if(action==='assets') return json_(getAssets_());
    if(action==='musicFile') return json_(getMusicFile_(e.parameter.fileId));
    if(action==='orders') return json_(getOrders_());
    if(action==='customers') return json_(getCustomers_());
    if(action==='categories') return json_(getCategories_());
    if(action==='offers') return json_(getOffers_());
    if(action==='settings') return json_(getSettings_());
    if(action==='site') return json_(getSiteData_());
    return json_({success:true,service:'Rosemoon Owner API',version:'2.0'});
  } catch(err) {
    return json_({success:false,message:err.message||'Server error.'});
  }
}

function doPost(e) {
  try {
    const raw=(e&&e.parameter&&e.parameter.payload)||(e&&e.postData&&e.postData.contents)||'{}';
    const payload=JSON.parse(raw);
    switch(payload.action) {
      case 'setup': requireAdmin_(payload); return json_(setupRosemoonSheet());
      case 'placeOrder': return json_(placeOrder_(payload));
      case 'updateStock': return json_(updateStock_(payload));
      case 'addProduct': return json_(addProduct_(payload));
      case 'updateProduct': return json_(updateProduct_(payload));
      case 'deleteProduct': return json_(deleteProduct_(payload));
      case 'uploadPhoto': return json_(uploadMedia_(payload,'photo'));
      case 'addAsset': return json_(addAsset_(payload));
      case 'addProductWithPhoto': {
        const upload=uploadMedia_(payload,'photo');
        return json_(addProduct_(Object.assign({},payload,{imageUrl:upload.url})));
      }
      case 'addMusic': return json_(uploadMedia_(payload,'music'));
      case 'deleteMusic': return json_(deleteMusic_(payload));
      case 'reorderMusic': return json_(reorderMusic_(payload));
      default: return json_({success:false,message:'Unknown action.'});
    }
  } catch(err) {
    return json_({success:false,message:err.message||'Server error.'});
  }
}

function requireAdmin_(payload) {
  if(String(payload.adminKey||'')!==ADMIN_KEY) throw new Error('Invalid admin key.');
}

function getProducts_() {
  const sheet=ensureSheet_(getSpreadsheet_(),'Products',PRODUCT_HEADERS,DEFAULT_PRODUCTS);
  const values=sheet.getDataRange().getValues();
  const products=[];
  for(let i=1;i<values.length;i++) {
    const id=String(values[i][0]).trim();
    if(!id) continue;
    products.push({
      id:id,
      category:String(values[i][1]||'General'),
      name:String(values[i][2]||'Untitled Flower'),
      price:Number(values[i][3])||0,
      stock:Math.max(0,Number(values[i][4])||0),
      imageUrl:String(values[i][5]||''),
      active:bool_(values[i][6],true),
      featured:bool_(values[i][7],false),
      isNew:bool_(values[i][8],false),
      description:String(values[i][9]||'')
    });
  }
  return {success:true,products:products,inventory:products};
}

function addProduct_(payload) {
  requireAdmin_(payload);
  const sheet=ensureSheet_(getSpreadsheet_(),'Products',PRODUCT_HEADERS,DEFAULT_PRODUCTS);
  const category=clean_(payload.category||'General');
  const name=clean_(payload.name||'Untitled Flower');
  const price=Number(payload.price);
  const stock=Number(payload.stock);
  if(!category||!name) throw new Error('Category and name are required.');
  if(!Number.isFinite(price)||price<0) throw new Error('Price must be 0 or higher.');
  if(!Number.isFinite(stock)||stock<0) throw new Error('Stock must be 0 or higher.');
  const id=slug_(category+'-'+name)+'-'+Utilities.getUuid().slice(0,6).toLowerCase();
  sheet.appendRow([id,category,name,Math.round(price),Math.floor(stock),String(payload.imageUrl||''),true,bool_(payload.featured,false),bool_(payload.isNew,false),clean_(payload.description||'')]);
  logActivity_('ADD_PRODUCT',name+' ('+id+')');
  return {success:true,message:'Product added.',products:getProducts_().products};
}

function updateProduct_(payload) {
  requireAdmin_(payload);
  const sheet=ensureSheet_(getSpreadsheet_(),'Products',PRODUCT_HEADERS,DEFAULT_PRODUCTS);
  const id=clean_(payload.id);
  const values=sheet.getDataRange().getValues();
  for(let i=1;i<values.length;i++) {
    if(String(values[i][0]).trim()===id) {
      if(payload.category!==undefined) sheet.getRange(i+1,2).setValue(clean_(payload.category));
      if(payload.name!==undefined) sheet.getRange(i+1,3).setValue(clean_(payload.name));
      if(payload.price!==undefined) sheet.getRange(i+1,4).setValue(Math.max(0,Math.round(Number(payload.price)||0)));
      if(payload.stock!==undefined) sheet.getRange(i+1,5).setValue(Math.max(0,Math.floor(Number(payload.stock)||0)));
      if(payload.imageUrl!==undefined) sheet.getRange(i+1,6).setValue(String(payload.imageUrl||''));
      if(payload.active!==undefined) sheet.getRange(i+1,7).setValue(bool_(payload.active,true));
      if(payload.featured!==undefined) sheet.getRange(i+1,8).setValue(bool_(payload.featured,false));
      if(payload.isNew!==undefined) sheet.getRange(i+1,9).setValue(bool_(payload.isNew,false));
      if(payload.description!==undefined) sheet.getRange(i+1,10).setValue(clean_(payload.description));
      logActivity_('UPDATE_PRODUCT',id);
      return {success:true,message:'Product updated.',products:getProducts_().products};
    }
  }
  throw new Error('Product not found.');
}

function deleteProduct_(payload) {
  requireAdmin_(payload);
  const sheet=ensureSheet_(getSpreadsheet_(),'Products',PRODUCT_HEADERS,DEFAULT_PRODUCTS);
  const id=clean_(payload.id);
  const values=sheet.getDataRange().getValues();
  for(let i=1;i<values.length;i++) {
    if(String(values[i][0]).trim()===id) {
      sheet.deleteRow(i+1);
      logActivity_('DELETE_PRODUCT',id);
      return {success:true,message:'Product deleted.',products:getProducts_().products};
    }
  }
  throw new Error('Product not found.');
}

function updateStock_(payload) {
  requireAdmin_(payload);
  return updateProduct_({adminKey:payload.adminKey,id:payload.productId,stock:payload.stock});
}

function getAssets_() {
  const folderId=ensureFolder_('Rosemoon Product Photos','ROSEMOON_PHOTO_FOLDER_ID');
  const folder=DriveApp.getFolderById(folderId);
  const it=folder.getFiles();
  const assets=[];
  while(it.hasNext()){
    const file=it.next();
    const mime=String(file.getMimeType()||'');
    if(!/^image\\/(jpeg|png|webp|gif|svg\\+xml)$/i.test(mime)) continue;
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
    assets.push({id:'asset-'+file.getId().slice(-12),name:file.getName(),fileId:file.getId(),mime:mime,url:file.getDownloadUrl(),createdAt:file.getDateCreated().getTime()});
  }
  assets.sort((a,b)=>b.createdAt-a.createdAt);
  return {success:true,assets:assets};
}

function addAsset_(payload) {
  requireAdmin_(payload);
  const dataUrl=String(payload.dataUrl||'');
  const match=dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if(!match) throw new Error('Invalid image data.');
  const mime=match[1];
  if(!/^image\\/(jpeg|png|webp|gif|svg\\+xml)$/i.test(mime)) throw new Error('Only PNG, JPEG, WebP, GIF or SVG images are allowed.');
  const bytes=Utilities.base64Decode(match[2]);
  if(bytes.length>10*1024*1024) throw new Error('Image is too large. Maximum 10 MB.');
  const folderId=ensureFolder_('Rosemoon Product Photos','ROSEMOON_PHOTO_FOLDER_ID');
  const fileName=safeFileName_(String(payload.fileName||'asset.'+(mime==='image/png'?'png':'jpg')));
  const file=DriveApp.getFolderById(folderId).createFile(Utilities.newBlob(bytes,mime,fileName));
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
  logActivity_('ADD_ASSET',file.getName());
  return {success:true,message:'Image added to Assets.',asset:{id:'asset-'+file.getId().slice(-12),name:file.getName(),fileId:file.getId(),mime:mime,url:file.getDownloadUrl(),createdAt:file.getDateCreated().getTime()},assets:getAssets_().assets};
}

function uploadMedia_(payload,type) {
  requireAdmin_(payload);
  const dataUrl=String(payload.dataUrl||'');
  const match=dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if(!match) throw new Error('Invalid file data.');
  const mime=match[1];
  const bytes=Utilities.base64Decode(match[2]);
  if(bytes.length>12*1024*1024) throw new Error('File is too large. Maximum 12 MB.');
  const fileName=String(payload.fileName||(type==='photo'?'flower.jpg':'song.mp3'));
  if(type==='music'&&!/\.mp3$/i.test(fileName)) throw new Error('Only .mp3 music files are allowed.');
  if(type==='music'&&!['audio/mpeg','audio/mp3','audio/x-mpeg','application/octet-stream'].includes(mime)) throw new Error('Only MP3 music files are allowed.');
  if(type==='photo'&&!['image/jpeg','image/png','image/webp','image/gif'].includes(mime)) throw new Error('Only image files are allowed.');
  const folderId=type==='photo'?ensureFolder_('Rosemoon Product Photos','ROSEMOON_PHOTO_FOLDER_ID'):ROSEMOON_MUSIC_FOLDER_ID;
  const blob=Utilities.newBlob(bytes,mime,safeFileName_(fileName));
  const file=DriveApp.getFolderById(folderId).createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);

  if(type==='photo') {
    logActivity_('UPLOAD_PHOTO',file.getName());
    return {success:true,type:'photo',url:file.getDownloadUrl(),fileId:file.getId(),message:'Photo uploaded.'};
  }

  const title=clean_(payload.title||file.getName().replace(/\.[^.]+$/,''));
  const meta={title:title,active:true,sort:Date.now()};
  try{file.setDescription(JSON.stringify(meta));}catch(e){}
  logActivity_('ADD_MUSIC',title);
  return {success:true,type:'music',url:file.getDownloadUrl(),fileId:file.getId(),music:getMusic_().music,message:'Music added to Rosemoon Music Drive folder.'};
}

function getMusicFile_(fileId) {
  const id=String(fileId||'').trim();
  if(!id) throw new Error('Music file ID is required.');
  const file=DriveApp.getFileById(id);
  if(!/\.mp3$/i.test(file.getName())) throw new Error('Only MP3 music files are allowed.');
  const bytes=file.getBlob().getBytes();
  if(bytes.length>12*1024*1024) throw new Error('Music file is too large.');
  return {success:true,fileId:id,name:file.getName(),mime:'audio/mpeg',base64:Utilities.base64Encode(bytes)};
}

function musicMeta_(file) {
  let meta={};
  try{meta=JSON.parse(file.getDescription()||'{}')||{};}catch(e){}
  return {
    id:'music-'+file.getId().slice(-12),
    title:String(meta.title||file.getName().replace(/\.mp3$/i,'')),
    url:file.getDownloadUrl(),
    fileId:file.getId(),
    active:meta.active!==false,
    sort:Number(meta.sort)||file.getDateCreated().getTime()
  };
}

function getMusic_() {
  const folder=DriveApp.getFolderById(ROSEMOON_MUSIC_FOLDER_ID);
  const it=folder.getFiles();
  const music=[];
  while(it.hasNext()){
    const file=it.next();
    if(!/\.mp3$/i.test(file.getName())) continue;
    music.push(musicMeta_(file));
  }
  music.sort((a,b)=>a.sort-b.sort);
  return {success:true,music:music};
}

function deleteMusic_(payload) {
  requireAdmin_(payload);
  const id=clean_(payload.id||payload.fileId);
  if(!id) throw new Error('Music file ID is required.');
  const file=DriveApp.getFileById(id);
  if(!/\.mp3$/i.test(file.getName())) throw new Error('Only MP3 music files can be deleted here.');
  file.setTrashed(true);
  logActivity_('DELETE_MUSIC',file.getName());
  return {success:true,music:getMusic_().music,message:'Music deleted from Rosemoon Music folder.'};
}

function reorderMusic_(payload) {
  requireAdmin_(payload);
  const ids=Array.isArray(payload.ids)?payload.ids.map(String):[];
  ids.forEach((id,index)=>{
    try{
      const file=DriveApp.getFileById(id);
      const old={};
      try{Object.assign(old,JSON.parse(file.getDescription()||'{}')||{});}catch(e){}
      old.sort=index+1;
      file.setDescription(JSON.stringify(old));
    }catch(e){}
  });
  logActivity_('REORDER_MUSIC',ids.join(','));
  return {success:true,music:getMusic_().music,message:'Music order updated.'};
}

function getOrders_() {
  const sheet=ensureSheet_(getSpreadsheet_(),'Orders',ORDER_HEADERS,[]);
  const values=sheet.getDataRange().getValues();
  const orders=[];
  for(let i=1;i<values.length;i++) {
    if(values[i][0]) orders.push({
      orderId:String(values[i][0]),
      date:values[i][1],
      customerId:String(values[i][2]||''),
      customer:String(values[i][3]||''),
      phone:String(values[i][4]||''),
      delivery:String(values[i][5]||''),
      payment:String(values[i][6]||''),
      items:String(values[i][7]||''),
      total:Number(values[i][8])||0,
      status:String(values[i][9]||'NEW'),
      stockUpdated:String(values[i][10]||'')
    });
  }
  return {success:true,orders:orders};
}

function placeOrder_(payload) {
  const lock=LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const customer=payload.customer||{};
    if(!customer.name||!customer.phone) throw new Error('Customer name and phone are required.');
    if(!customer.payment) throw new Error('Payment method is required.');
    if(!Array.isArray(payload.items)||!payload.items.length) throw new Error('Cart is empty.');

    const inv=ensureSheet_(getSpreadsheet_(),'Products',PRODUCT_HEADERS,DEFAULT_PRODUCTS);
    const orders=ensureSheet_(getSpreadsheet_(),'Orders',ORDER_HEADERS,[]);
    const values=inv.getDataRange().getValues();
    const rows={};

    for(let r=1;r<values.length;r++) {
      const id=String(values[r][0]).trim();
      if(id) rows[id]=r+1;
    }

    payload.items.forEach(item=>{
      const productId=String(item.productId||item.id||'');
      const row=rows[productId];
      if(!row) throw new Error('Product not found: '+productId);
      const qty=Math.max(1,Number(item.qty||item.quantity)||1);
      const totalStock=Number(inv.getRange(row,5).getValue())||0;
      if(qty>totalStock) throw new Error(String(item.name||'Product')+' has only '+totalStock+' left.');
      const options=parseCategoryOptions_(inv.getRange(row,10).getValue());
      if(options && item.type){
        const option=options.find(o=>String(o.type||'').trim()===String(item.type||'').trim());
        if(option){
          const optionStock=Math.max(0,Number(option.stock)||0);
          if(qty>optionStock) throw new Error(String(item.type)+' has only '+optionStock+' left.');
        }
      }
    });

    payload.items.forEach(item=>{
      const row=rows[String(item.productId||item.id)];
      const qty=Math.max(1,Number(item.qty||item.quantity)||1);
      const stockCell=inv.getRange(row,5);
      stockCell.setValue((Number(stockCell.getValue())||0)-qty);
      if(item.type){
        const descCell=inv.getRange(row,10);
        const options=parseCategoryOptions_(descCell.getValue());
        if(options){
          const option=options.find(o=>String(o.type||'').trim()===String(item.type||'').trim());
          if(option){option.stock=Math.max(0,(Number(option.stock)||0)-qty);descCell.setValue(JSON.stringify({rosemoonCategory:true,options:options}));}
        }
      }
    });

    const customerId=upsertCustomer_(Object.assign({},customer,{total:Number(payload.total)||0}));
    const orderId='RM-'+Utilities.getUuid().slice(0,8).toUpperCase();
    const itemText=payload.items.map(item=>`${item.qty||item.quantity}x ${item.name||item.product}${item.type?' ('+item.type+')':''}`).join(', ');

    orders.appendRow([
      orderId,new Date(),customerId,clean_(customer.name),clean_(customer.phone),
      clean_(customer.note||customer.delivery||''),clean_(customer.payment),
      itemText,Number(payload.total)||0,'NEW','YES'
    ]);

    logActivity_('NEW_ORDER',orderId+' · '+customer.name);
    return {success:true,ok:true,orderId,products:getProducts_().products,message:'Order accepted and stock updated.'};
  } finally {
    lock.releaseLock();
  }
}

function upsertCustomer_(customer) {
  const sheet=ensureSheet_(getSpreadsheet_(),'Customers',CUSTOMER_HEADERS,[]);
  const values=sheet.getDataRange().getValues();
  const phone=clean_(customer.phone);
  const now=new Date();
  let row=-1;

  for(let i=1;i<values.length;i++) {
    if(String(values[i][2]||'').trim()===phone) {row=i+1;break;}
  }

  if(row<0) {
    const id='cust-'+Utilities.getUuid().slice(0,8).toLowerCase();
    sheet.appendRow([id,clean_(customer.name),phone,clean_(customer.note||''),now,now,1,Number(customer.total)||0]);
    return id;
  }

  const count=Number(sheet.getRange(row,7).getValue())||0;
  const total=Number(sheet.getRange(row,8).getValue())||0;
  sheet.getRange(row,2).setValue(clean_(customer.name));
  sheet.getRange(row,4).setValue(clean_(customer.note||''));
  sheet.getRange(row,6).setValue(now);
  sheet.getRange(row,7).setValue(count+1);
  sheet.getRange(row,8).setValue(total+Number(customer.total||0));
  return String(sheet.getRange(row,1).getValue());
}

function getCustomers_() {
  const sheet=ensureSheet_(getSpreadsheet_(),'Customers',CUSTOMER_HEADERS,[]);
  const values=sheet.getDataRange().getValues();
  const customers=[];
  for(let i=1;i<values.length;i++) {
    if(values[i][0]) customers.push({
      id:String(values[i][0]),name:String(values[i][1]||''),phone:String(values[i][2]||''),
      delivery:String(values[i][3]||''),firstOrder:values[i][4],lastOrder:values[i][5],
      orderCount:Number(values[i][6])||0,totalSpent:Number(values[i][7])||0
    });
  }
  return {success:true,customers:customers};
}

function getCategories_() {
  const sheet=ensureSheet_(getSpreadsheet_(),'Categories',CATEGORY_HEADERS,DEFAULT_CATEGORIES);
  const values=sheet.getDataRange().getValues();
  const categories=[];
  for(let i=1;i<values.length;i++) {
    if(values[i][0]) categories.push({
      id:String(values[i][0]),name:String(values[i][1]||''),active:bool_(values[i][2],true),sort:Number(values[i][3])||i
    });
  }
  categories.sort((a,b)=>a.sort-b.sort);
  return {success:true,categories:categories};
}

function getOffers_() {
  const sheet=ensureSheet_(getSpreadsheet_(),'Offers',OFFER_HEADERS,[]);
  const values=sheet.getDataRange().getValues();
  const offers=[];
  for(let i=1;i<values.length;i++) {
    if(values[i][0]) offers.push({
      id:String(values[i][0]),code:String(values[i][1]||''),title:String(values[i][2]||''),
      description:String(values[i][3]||''),discountType:String(values[i][4]||''),
      discountValue:Number(values[i][5])||0,active:bool_(values[i][6],true),
      startDate:values[i][7],endDate:values[i][8]
    });
  }
  return {success:true,offers:offers};
}

function getSettings_() {
  const sheet=ensureSheet_(getSpreadsheet_(),'Settings',SETTINGS_HEADERS,DEFAULT_SETTINGS);
  const values=sheet.getDataRange().getValues();
  const settings={};
  for(let i=1;i<values.length;i++) if(values[i][0]) settings[String(values[i][0])]=String(values[i][1]??'');
  return {success:true,settings:settings};
}

function getSiteData_() {
  return {
    success:true,
    settings:getSettings_().settings,
    categories:getCategories_().categories,
    products:getProducts_().products,
    music:getMusic_().music,
    offers:getOffers_().offers
  };
}

function logActivity_(action,details) {
  try {
    const sheet=ensureSheet_(getSpreadsheet_(),'Activity',ACTIVITY_HEADERS,[]);
    sheet.appendRow([
      'act-'+Utilities.getUuid().slice(0,8).toLowerCase(),
      new Date(),String(action),String(details).slice(0,500)
    ]);
  } catch(e) {}
}

function parseCategoryOptions_(value) {
  try {
    const d=JSON.parse(String(value||''));
    if(d&&d.rosemoonCategory&&Array.isArray(d.options)) return d.options;
  } catch(e) {}
  return null;
}

function bool_(value,fallback) {
  if(value===undefined||value===null||value==='') return fallback;
  if(typeof value==='boolean') return value;
  return String(value).toLowerCase()!=='false'&&String(value)!=='0';
}

function clean_(value) {
  return String(value==null?'':value).trim().slice(0,500);
}

function slug_(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,60)||'product';
}

function safeFileName_(value) {
  return String(value).replace(/[\\/:*?"<>|#%{}]/g,'_').slice(0,120);
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
