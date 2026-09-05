(function () {
    const currentUser = JSON.parse(localStorage.getItem('walijomok_user') || 'null');
    const page = location.pathname.split('/').pop();

    if (!currentUser && page !== 'index.html' && page !== '') {
        location.replace('../index.html');
        return;
    }

    window.wjUser = currentUser;
    window.wjLogout = function () {
        localStorage.removeItem('walijomok_user');
        location.href = '../index.html';
    };
})();
