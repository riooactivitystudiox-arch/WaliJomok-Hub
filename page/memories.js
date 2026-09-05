document.addEventListener('DOMContentLoaded', async () => {
    const grid=document.getElementById('galleryGrid');
    const user=JSON.parse(localStorage.getItem('walijomok_user')||'null');
    async function load(){
        const res=await fetch('/api/community/memories'); const data=await res.json(); if(!data.success) throw new Error();
        grid.innerHTML='';
        data.memories.forEach(memory=>{
            const div=document.createElement('div'); div.className='gallery-item'; div.onclick=()=>openLightbox(memory.media);
            div.innerHTML=`<img src="${memory.media}" alt="${memory.title}"><div style="padding:6px 8px;font-size:.75rem;color:#aaa">${memory.title}</div>${user?.role==='Admin'?`<button class="delete-memory" data-id="${memory.id}" style="margin:0 8px 8px;background:none;border:1px solid #333;color:#fff;border-radius:6px;padding:4px 7px">Hapus</button>`:''}`;
            grid.appendChild(div);
        });
        if(user?.role==='Admin'){
            const add=document.createElement('button'); add.className='add-photo-btn'; add.textContent='+'; add.title='Tambah memory'; add.onclick=()=>openAdd(); grid.appendChild(add);
            grid.querySelectorAll('.delete-memory').forEach(btn=>btn.onclick=async e=>{e.stopPropagation();if(!confirm('Hapus memory ini?'))return;const password=prompt('Password Admin:');if(!password)return;const r=await fetch('/api/community/memories/delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({memoryId:btn.dataset.id,username:user.username,password})});const d=await r.json();if(d.success)load();else alert(d.message);});
        } else { const add=document.createElement('div'); add.className='add-photo-btn'; add.textContent='+'; add.title='Hanya Admin'; grid.appendChild(add); }
    }
    function openAdd(){const title=prompt('Judul memory:');if(!title)return;const media=prompt('URL/path gambar:');if(!media)return;const description=prompt('Deskripsi (opsional):')||'';const password=prompt('Password Admin:');if(!password)return;fetch('/api/community/memories/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:user.username,password,title,media,description})}).then(r=>r.json()).then(d=>{if(d.success)load();else alert(d.message);});}
    window.openLightbox=function(src){document.getElementById('lightbox').classList.add('active');document.getElementById('lightboxImage').src=src;document.body.style.overflow='hidden';};
    window.closeLightbox=function(){document.getElementById('lightbox').classList.remove('active');document.body.style.overflow='auto';};
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeLightbox();});
    try{await load();}catch(e){grid.innerHTML='<p style="grid-column:1/-1;text-align:center;color:#888">Gagal memuat memories.</p>';}
});
