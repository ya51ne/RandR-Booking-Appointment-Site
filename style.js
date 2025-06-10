// Navbar background opacity on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(245, 249, 245, 0.98)';
    } else {
        navbar.style.background = 'rgba(245, 249, 245, 0.95)';
    }
});