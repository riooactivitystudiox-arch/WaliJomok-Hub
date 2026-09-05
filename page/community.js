document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('memberGrid');
    if (!grid) return;

    try {
        const response = await fetch('/api/community/members');
        const data = await response.json();
        if (!data.success) throw new Error(data.message);

        grid.innerHTML = '';
        data.members.forEach((member, i) => {
            const a = document.createElement('a');
            a.href = `../member/${member.username}.html`;
            a.className = 'profile-item';
            a.setAttribute('data-role', member.role || 'Member');
            a.style.animationDelay = `${0.04 + i * 0.04}s`;

            const badge = member.verified ? `
                <span class="verified-badge" title="Verified">
                    <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </span>` : '';

            a.innerHTML = `
                <div class="avatar"><img src="${member.profilePic || '../images/blank.png'}" alt="${member.displayname}"></div>
                <div class="member-row"><span class="member-name">${member.displayname}</span>${badge}</div>
                <div class="member-role">${member.role || 'Member'}</div>
            `;
            grid.appendChild(a);
        });
    } catch (error) {
        grid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#888">Gagal memuat member.</p>';
    }
});
