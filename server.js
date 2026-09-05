const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const communityUsersPath = path.join(__dirname, 'comunity_page', 'users.json');
const communityPostPath = path.join(__dirname, 'comunity_page', 'post.json');
const communityMemoriesPath = path.join(__dirname, 'comunity_page', 'memories.json');

const readJSON = (filePath) => {
    if (!fs.existsSync(filePath)) return [];
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        return [];
    }
};

const writeJSON = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
};

const safeUser = (user) => {
    if (!user) return null;
    const { password, ...safeData } = user;
    return safeData;
};

const findUser = (username, password) => {
    const users = readJSON(communityUsersPath);
    return users.find(u =>
        String(u.username).toLowerCase() === String(username || '').toLowerCase() &&
        u.password === password
    );
};

const findUserByUsername = (username) => {
    const users = readJSON(communityUsersPath);
    return users.find(u => String(u.username).toLowerCase() === String(username || '').toLowerCase());
};

// ==========================================
// ENDPOINT KOMUNITAS
// ==========================================

app.post('/api/community/login', (req, res) => {
    const { username, password } = req.body;
    const user = findUser(username, password);

    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Username atau password salah!'
        });
    }

    return res.json({ success: true, user: safeUser(user) });
});

app.post('/api/community/register', (req, res) => {
    const { username, password, displayname } = req.body;
    const validRegex = /^[a-zA-Z0-9_.]+$/;

    if (!username || !password || !validRegex.test(username) || !validRegex.test(password)) {
        return res.status(400).json({
            success: false,
            message: 'Username dan password hanya boleh memakai huruf, angka, _ atau .'
        });
    }

    const users = readJSON(communityUsersPath);
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        return res.status(400).json({ success: false, message: 'Username sudah digunakan!' });
    }

    const uid = Math.floor(10000000 + Math.random() * 90000000).toString();
    const newUser = {
        uid,
        username,
        password,
        displayname: displayname || username,
        role: 'Member',
        verified: false,
        profilePic: '../images/blank.png'
    };

    users.push(newUser);
    writeJSON(communityUsersPath, users);

    res.json({ success: true, user: safeUser(newUser) });
});

app.get('/api/community/members', (req, res) => {
    res.json({ success: true, members: readJSON(communityUsersPath).map(safeUser) });
});

app.get('/api/community/profile/:uid', (req, res) => {
    const users = readJSON(communityUsersPath);
    const user = users.find(u => u.uid === req.params.uid);

    if (!user) {
        return res.status(404).json({ success: false, message: 'User tidak ditemukan!' });
    }

    res.json({ success: true, user: safeUser(user) });
});

app.post('/api/community/profile/update', (req, res) => {
    const {
        currentUsername,
        password,
        newUsername,
        newDisplayName,
        newProfilePic,
        newPassword
    } = req.body;

    const users = readJSON(communityUsersPath);
    const userIndex = users.findIndex(u =>
        u.username.toLowerCase() === String(currentUsername || '').toLowerCase() &&
        u.password === password
    );

    if (userIndex === -1) {
        return res.status(403).json({ success: false, message: 'Password konfirmasi salah!' });
    }

    const oldUsername = users[userIndex].username;

    if (newUsername && newUsername.toLowerCase() !== oldUsername.toLowerCase()) {
        if (!/^[a-zA-Z0-9_.]+$/.test(newUsername)) {
            return res.status(400).json({ success: false, message: 'Username mengandung karakter yang tidak diizinkan!' });
        }

        if (users.some(u => u.username.toLowerCase() === newUsername.toLowerCase())) {
            return res.status(400).json({ success: false, message: 'Username baru sudah dipakai!' });
        }

        const posts = readJSON(communityPostPath);
        posts.forEach(post => {
            if (post.username.toLowerCase() === oldUsername.toLowerCase()) {
                post.username = newUsername;
            }
        });
        writeJSON(communityPostPath, posts);
        users[userIndex].username = newUsername;
    }

    if (newDisplayName) users[userIndex].displayname = newDisplayName;
    if (newProfilePic) users[userIndex].profilePic = newProfilePic;
    if (newPassword) users[userIndex].password = newPassword;

    writeJSON(communityUsersPath, users);
    res.json({ success: true, user: safeUser(users[userIndex]) });
});

// ==========================================
// ENDPOINT POST
// ==========================================

app.get('/api/community/posts', (req, res) => {
    const posts = readJSON(communityPostPath);
    const users = readJSON(communityUsersPath);

    const sortedPosts = posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    const enrichedPosts = sortedPosts.map(post => {
        const author = users.find(u => u.username.toLowerCase() === post.username.toLowerCase());
        return {
            ...post,
            author: safeUser(author) || {
                username: post.username,
                displayname: 'Unknown',
                profilePic: '../images/blank.png',
                uid: ''
            }
        };
    });

    res.json({ success: true, posts: enrichedPosts });
});

app.post('/api/community/posts/create', (req, res) => {
    const { username, password, title, description, media } = req.body;
    const user = findUser(username, password);

    if (!user) {
        return res.status(403).json({ success: false, message: 'Validasi gagal! Password salah.' });
    }

    if (user.role !== 'Admin') {
        return res.status(403).json({ success: false, message: 'Hanya Admin yang dapat membuat postingan.' });
    }

    if (!title || !description) {
        return res.status(400).json({ success: false, message: 'Judul dan isi postingan wajib diisi!' });
    }

    const posts = readJSON(communityPostPath);
    let mediaType = 'image';
    if (media && /\.(mp4|webm|ogg)(\?.*)?$/i.test(media)) mediaType = 'video';

    const newPost = {
        id: 'post_' + Date.now(),
        username: user.username,
        title,
        description,
        media: media || '',
        mediaType,
        date: new Date().toISOString(),
        likes: 0
    };

    posts.push(newPost);
    writeJSON(communityPostPath, posts);

    res.json({ success: true, message: 'Post berhasil dibuat!', post: newPost });
});

app.post('/api/community/posts/like', (req, res) => {
    const { postId } = req.body;
    const posts = readJSON(communityPostPath);
    const postIndex = posts.findIndex(p => p.id === postId);

    if (postIndex === -1) {
        return res.status(404).json({ success: false, message: 'Post tidak ditemukan.' });
    }

    posts[postIndex].likes = Number(posts[postIndex].likes || 0) + 1;
    writeJSON(communityPostPath, posts);

    res.json({ success: true, likes: posts[postIndex].likes });
});

app.post('/api/community/posts/delete', (req, res) => {
    const { postId, username, password } = req.body;
    const user = findUser(username, password);

    if (!user) {
        return res.status(403).json({ success: false, message: 'Password salah!' });
    }

    if (user.role !== 'Admin') {
        return res.status(403).json({ success: false, message: 'Hanya Admin yang dapat menghapus postingan.' });
    }

    let posts = readJSON(communityPostPath);
    const post = posts.find(p => p.id === postId);

    if (!post) {
        return res.status(404).json({ success: false, message: 'Post tidak ditemukan.' });
    }

    posts = posts.filter(p => p.id !== postId);
    writeJSON(communityPostPath, posts);

    res.json({ success: true, message: 'Post berhasil dihapus!' });
});

// ==========================================
// ENDPOINT MEMORIES
// ==========================================

app.get('/api/community/memories', (req, res) => {
    const memories = readJSON(communityMemoriesPath).sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({ success: true, memories });
});

app.post('/api/community/memories/create', (req, res) => {
    const { username, password, title, description, media } = req.body;
    const user = findUser(username, password);

    if (!user) {
        return res.status(403).json({ success: false, message: 'Validasi gagal! Password salah.' });
    }

    if (user.role !== 'Admin') {
        return res.status(403).json({ success: false, message: 'Hanya Admin yang dapat menambah memories.' });
    }

    if (!title || !media) {
        return res.status(400).json({ success: false, message: 'Judul dan gambar wajib diisi!' });
    }

    const memories = readJSON(communityMemoriesPath);
    const newMemory = {
        id: 'memory_' + Date.now(),
        title,
        description: description || '',
        media,
        date: new Date().toISOString(),
        username: user.username
    };

    memories.push(newMemory);
    writeJSON(communityMemoriesPath, memories);

    res.json({ success: true, message: 'Memory berhasil ditambahkan!', memory: newMemory });
});

app.post('/api/community/memories/delete', (req, res) => {
    const { memoryId, username, password } = req.body;
    const user = findUser(username, password);

    if (!user) {
        return res.status(403).json({ success: false, message: 'Password salah!' });
    }

    if (user.role !== 'Admin') {
        return res.status(403).json({ success: false, message: 'Hanya Admin yang dapat menghapus memories.' });
    }

    const memories = readJSON(communityMemoriesPath);
    if (!memories.some(m => m.id === memoryId)) {
        return res.status(404).json({ success: false, message: 'Memory tidak ditemukan.' });
    }

    writeJSON(communityMemoriesPath, memories.filter(m => m.id !== memoryId));
    res.json({ success: true, message: 'Memory berhasil dihapus!' });
});

app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'WaliJomok server aktif.' });
});

app.listen(PORT, () => {
    console.log(`WaliJomok server berjalan di port ${PORT}`);
});
