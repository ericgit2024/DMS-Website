document.addEventListener('DOMContentLoaded', function() {
  const infoLink = document.getElementById('info-dropdown-link');
  const dropdown = document.getElementById('info-dropdown');
  if (infoLink && dropdown) {
    infoLink.addEventListener('click', function(e) {
      e.preventDefault();
      dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });
    document.addEventListener('click', function(e) {
      if (!infoLink.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });
  }
});
