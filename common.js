// ── CONFIG (à remplir / vérifier) ────────────────────────────────────────────
window.CL_CLOUD  = 'dspfazrxe';        // cloud Cloudinary
window.CL_PRESET = 'limpiu';           // preset d'upload non signé
window.AT_TOKEN  = 'patnHCzOZQd2cjZa8.c4818d1eb7d4f6f4f2321e211d459959c9cdce3732e36e61e3daa09df6743eb8';
window.AT_BASE   = 'app6BTLS4lCF9PlyT';       // base Airtable Limpiu
window.AT_TABLE  = 'Demandes de devis';       // nom EXACT de la table
window.AT_HEADERS = {'Authorization':'Bearer '+window.AT_TOKEN,'Content-Type':'application/json'};

// ── Nav au scroll ─────────────────────────────────────────────────────────────
(function(){
  var nav=document.getElementById('nav');
  if(!nav) return;
  window.addEventListener('scroll',function(){
    if(window.scrollY>30)nav.classList.add('scrolled');else nav.classList.remove('scrolled');
  });
})();

// ── Reveal au scroll ──────────────────────────────────────────────────────────
(function(){
  var obs=new IntersectionObserver(function(entries){
    entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');obs.unobserve(e.target);}});
  },{threshold:.12});
  document.querySelectorAll('.reveal').forEach(function(el){obs.observe(el);});
})();

// ── Champ "village" si commune = Autre ────────────────────────────────────────
function toggleAutreCommune(){
  var v=document.getElementById('commune').value;
  var f=document.getElementById('autre-commune-field');
  if(f) f.style.display = (v==='Autre') ? 'block' : 'none';
}

// ── Photos (accumulées, max 3) ────────────────────────────────────────────────
window.photoFiles=[];
function addPhotos(input){
  var added=Array.prototype.slice.call(input.files);
  for(var i=0;i<added.length;i++){
    if(window.photoFiles.length>=3){alert('3 photos maximum.');break;}
    window.photoFiles.push(added[i]);
  }
  input.value='';
  renderPhotos();
}
function removePhoto(i){ window.photoFiles.splice(i,1); renderPhotos(); }
function renderPhotos(){
  var list=document.getElementById('photo-list');
  if(!list) return;
  list.innerHTML='';
  window.photoFiles.forEach(function(f,i){
    var div=document.createElement('div');
    div.className='upload-item';
    div.textContent='— '+f.name+'  ';
    var x=document.createElement('span');
    x.textContent='✕';
    x.style.cssText='cursor:pointer;color:#9a8c5c;margin-left:6px;font-weight:600';
    x.onclick=function(){removePhoto(i);};
    div.appendChild(x);
    list.appendChild(div);
  });
}

// ── Upload Cloudinary (renvoie l'URL sécurisée) ───────────────────────────────
async function uploadToCloudinary(file){
  var fd=new FormData();
  fd.append('file',file);
  fd.append('upload_preset',window.CL_PRESET);
  var res=await fetch('https://api.cloudinary.com/v1_1/'+window.CL_CLOUD+'/image/upload',{method:'POST',body:fd});
  if(!res.ok) throw new Error('Échec upload photo');
  var data=await res.json();
  return data.secure_url;
}

// ── Helpers de lecture de champs ───────────────────────────────────────────────
function val(id){var el=document.getElementById(id);return el?el.value.trim():'';}
function num(id){var v=val(id);return v===''?null:Number(v);}
function checked(id){var el=document.getElementById(id);return el?el.checked:false;}

// ── Envoi générique vers Airtable (upload photos incluses) ────────────────────
async function sendDevisToAirtable(fields, btn){
  var files=window.photoFiles.slice(0,3);
  var photos=[];
  for(var i=0;i<files.length;i++){
    if(btn) btn.textContent='Upload photo '+(i+1)+'/'+files.length+'…';
    var url=await uploadToCloudinary(files[i]);
    photos.push({url:url});
  }
  if(btn) btn.textContent='Envoi…';
  if(photos.length) fields['Photos']=photos;
  fields['Statut']='Nouveau';
  fields['Origine de la demande']='Site web';
  fields['Date de demande']=new Date().toISOString().split('T')[0];

  var res=await fetch('https://api.airtable.com/v0/'+window.AT_BASE+'/'+encodeURIComponent(window.AT_TABLE),{
    method:'POST', headers:window.AT_HEADERS,
    body:JSON.stringify({records:[{fields:fields}], typecast:true})
  });
  if(!res.ok){var e=await res.json();throw new Error(e.error&&e.error.message?e.error.message:'Erreur Airtable '+res.status);}
}

// ── Message de succès ──────────────────────────────────────────────────────────
function showDevisSuccess(nom){
  var wrap=document.querySelector('.devis-wrap');
  if(!wrap) return;
  wrap.innerHTML =
    '<div style="text-align:center;padding:2rem 1rem">'+
    '<div style="font-size:42px;color:var(--green2);margin-bottom:1rem">✓</div>'+
    '<h3 style="font-family:\'Cormorant Garamond\',serif;font-size:26px;color:var(--ink);margin-bottom:.8rem">Demande reçue !</h3>'+
    '<p style="color:var(--green2);line-height:1.7">Merci '+nom+'. On revient vers vous sous 24 h.<br>Pour un besoin urgent : <a href="tel:0650638021" style="color:var(--gold)">06 50 63 80 21</a>.</p>'+
    '</div>';
}
