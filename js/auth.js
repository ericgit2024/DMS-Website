/**
 * Authentication handling for DisasterGuard
 */
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    const userLoggedIn = localStorage.getItem('disasterguard_user');
    
    // Get login-related elements if they exist on the page
    const loginLinks = document.querySelectorAll('a[href="login.html"]');
    const signupLinks = document.querySelectorAll('a[href="signup.html"]');
    const adminLinks = document.querySelectorAll('a[href="admin-signup.html"]');
    
    if (userLoggedIn) {
        // If user is logged in, change login links to dashboard or logout
        loginLinks.forEach(link => {
            link.textContent = 'Dashboard';
            link.href = 'dashboard.html';
        });
        
        // Add logout option
        const navLinks = document.querySelector('.nav-links');
        if (navLinks) {
            const logoutLi = document.createElement('li');
            const logoutLink = document.createElement('a');
            logoutLink.href = '#';
            logoutLink.textContent = 'Logout';
            logoutLink.addEventListener('click', function(e) {
                e.preventDefault();
                localStorage.removeItem('disasterguard_user');
                window.location.reload();
            });
            logoutLi.appendChild(logoutLink);
            navLinks.appendChild(logoutLi);
        }
    }
    
    // Password visibility toggle if on login or signup pages
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');
    
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const passwordField = this.previousElementSibling;
            
            if (passwordField.type === 'password') {
                passwordField.type = 'text';
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
            } else {
                passwordField.type = 'password';
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
            }
        });
    });
    
    // Handle authentication state changes
    window.handleLogin = function(userData) {
        localStorage.setItem('disasterguard_user', JSON.stringify(userData));
        window.location.href = 'dashboard.html';
    };
    
    window.handleLogout = function() {
        localStorage.removeItem('disasterguard_user');
        window.location.href = 'index.html';
    };
}); 