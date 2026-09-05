document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('walijomok_user') || 'null');
    const container = document.getElementById('postsContainer');
    const adminCreate = document.getElementById('adminCreate');

    if (!container || !currentUser) return;
    if (currentUser.role === 'Admin') adminCreate.style.display = 'block';

    async function fetchPosts() {
        const response = await fetch('/api/community/posts');
        const data = await response.json();
        if (!data.success) throw new Error(data.message);
        renderPosts(data.posts);
    }

    function renderPosts(posts) {
        container.innerHTML = '';
        if (!posts.length) {
            container.innerHTML = '<p style="text-align:center;color:#888">Belum ada postingan.</p>';
            return;
        }

        posts.forEach(post => {
            const card = document.createElement('div');
            card.className = 'link-card';
            card.style.cssText = 'flex-direction:column;align-items:flex-start;gap:.8rem;margin-bottom:.9rem';
            const date = new Date(post.date).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'});
            let media = '';
            if (post.media) media = post.mediaType === 'video' ? `<video src="${post.media}" controls style="width:100%;max-height:420px;border-radius:9px"></video>` : `<img src="${post.media}" alt="Media" style="width:100%;max-height:420px;object-fit:cover;border-radius:9px">`;
            const deleteButton = currentUser.role === 'Admin' ? `<button class="delete-post btn-mini-outline" data-id="${post.id}" style="cursor:pointer">Hapus</button>` : '';
            card.innerHTML = `
                <div style="display:flex;align-items:center;gap:.7rem;width:100%">
                    <div style="width:38px;height:38px;border-radius:50%;background:#111;border:1px solid rgba(255,255,255,.08);overflow:hidden"><img src="${post.author.profilePic || '../images/blank.png'}" style="width:100%;height:100%;object-fit:cover"></div>
                    <div style="flex:1"><div style="font-weight:700;font-size:.92rem">${post.author.displayname}</div><div style="font-size:.7rem;color:rgba(255,255,255,.35)">${post.author.role || 'Member'} · ${date}</div></div>
                    ${deleteButton}
                </div>
                <div style="width:100%"><h3 style="margin:0 0 .45rem">${post.title}</h3><p style="font-size:.9rem;color:rgba(255,255,255,.7);line-height:1.55;white-space:pre-wrap">${post.description}</p>${media}</div>
                <div style="display:flex;gap:8px"><button class="like-post btn-mini-outline" data-id="${post.id}" style="cursor:pointer">♥ ${post.likes || 0}</button></div>`;
            container.appendChild(card);
        });

        container.querySelectorAll('.like-post').forEach(btn => btn.onclick = async () => {
            const response = await fetch('/api/community/posts/like',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({postId:btn.dataset.id})});
            const data = await response.json(); if(data.success) btn.textContent='♥ '+data.likes;
        });
        container.querySelectorAll('.delete-post').forEach(btn => btn.onclick = async () => {
            if(!confirm('Hapus postingan ini?')) return;
            const password=prompt('Masukkan password Admin:'); if(!password) return;
            const response=await fetch('/api/community/posts/delete',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({postId:btn.dataset.id,username:currentUser.username,password})});
            const data=await response.json(); if(data.success) fetchPosts(); else alert(data.message);
        });
    }

    document.getElementById('createPost')?.addEventListener('click',()=>document.getElementById('postModal').style.display='flex');
    document.getElementById('cancelPost')?.addEventListener('click',()=>document.getElementById('postModal').style.display='none');
    document.getElementById('savePost')?.addEventListener('click',async()=>{
        const title=document.getElementById('postTitle').value.trim(); const description=document.getElementById('postDescription').value.trim(); const media=document.getElementById('postMedia').value.trim(); const error=document.getElementById('postError');
        const password=prompt('Masukkan password Admin:'); if(!password) return;
        const response=await fetch('/api/community/posts/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:currentUser.username,password,title,description,media})});
        const data=await response.json(); if(data.success){document.getElementById('postModal').style.display='none';document.getElementById('postTitle').value='';document.getElementById('postDescription').value='';document.getElementById('postMedia').value='';fetchPosts();}else{error.textContent=data.message;}
    });
    fetchPosts().catch(()=>container.innerHTML='<p style="text-align:center;color:#888">Gagal memuat postingan.</p>');
});
