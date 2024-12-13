// Функция для проверки статуса аутентификации
async function checkAuth() {
    try {
        const response = await fetch('/api/check-auth', { credentials: 'include' });
        const data = await response.json();

        if (data.isAuthenticated ) {
            if (data.isAdmin) {
                document.getElementById('admin-panel').style.display = 'block';
                document.getElementById('auth-buttons').style.display = 'none';
                document.getElementById('user-cabinet').style.display = 'none';
                setupLogoutButton('logout-button-1'); 
            }
            else {
                document.getElementById('admin-panel').style.display = 'none';
                document.getElementById('auth-buttons').style.display = 'none';
                document.getElementById('user-cabinet').style.display = 'block';
                setupLogoutButton('logout-button-2');
            }
        } else {
            document.getElementById('admin-panel').style.display = 'none';
            document.getElementById('auth-buttons').style.display = 'block';
            document.getElementById('user-cabinet').style.display = 'none';
        }
    } catch (error) {
        console.error('Ошибка при проверке статуса аутентификации:', error);
    }
}

// Функция для настройки обработчика события кнопки выхода
function setupLogoutButton(id) {
    const logoutButton = document.getElementById(id);
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                const response = await fetch('/logout', { method: 'POST', credentials: 'include' });
                if (response.ok) {
                    window.location.href = '/';
                } else {
                    alert('Ошибка при выходе. Попробуйте еще раз.');
                }
            } catch (error) {
                console.error('Ошибка:', error);
                alert('Ошибка при выходе. Попробуйте еще раз.');
            }
        });
    }
}
// Вызов функции проверки статуса аутентификации при загрузке страницы
window.onload = checkAuth;