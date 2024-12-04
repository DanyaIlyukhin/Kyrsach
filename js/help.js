function openModal() {
    document.getElementById("authModal").style.display = "block";
}

function closeModal() {
    document.getElementById("authModal").style.display = "none";
}

function showRegistration() {
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("registrationForm").style.display = "block";
    
    document.getElementById('loginTab').classList.remove('active');
    document.getElementById('registrationTab').classList.add('active');
}

function showLogin() {
    document.getElementById("registrationForm").style.display = "none";
    document.getElementById("loginForm").style.display = "block";

    document.getElementById('registrationTab').classList.remove('active');
    document.getElementById('loginTab').classList.add('active');
}

// Закрытие модального окна при клике вне его
window.onclick = function(event) {
    const modal = document.getElementById("authModal");
    if (event.target == modal) {
        closeModal();
    }
}