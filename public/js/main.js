// Main JavaScript file for DisasterGuard

document.addEventListener('DOMContentLoaded', function() {
  // Initialize mobile navigation toggle
  initMobileNav();
  
  // Initialize form validation
  initFormValidation();
  
  // Initialize alert filters if on alerts page
  if (document.querySelector('.alerts-filter')) {
    initAlertFilters();
  }
  
  // Initialize admin dashboard if on admin page
  if (document.querySelector('.admin-dashboard')) {
    initAdminDashboard();
  }
});

// Mobile Navigation Toggle
function initMobileNav() {
  const navToggle = document.querySelector('.nav-toggle');
  if (!navToggle) return;
  
  const navMenu = document.querySelector('nav ul');
  
  navToggle.addEventListener('click', function() {
    navMenu.classList.toggle('show');
    navToggle.classList.toggle('active');
  });
}

// Form Validation
function initFormValidation() {
  const forms = document.querySelectorAll('form');
  
  forms.forEach(form => {
    form.addEventListener('submit', function(event) {
      let isValid = true;
      
      // Validate required fields
      const requiredFields = form.querySelectorAll('[required]');
      requiredFields.forEach(field => {
        if (!field.value.trim()) {
          isValid = false;
          showError(field, 'This field is required');
        } else {
          clearError(field);
        }
      });
      
      // Validate email fields
      const emailFields = form.querySelectorAll('input[type="email"]');
      emailFields.forEach(field => {
        if (field.value.trim() && !isValidEmail(field.value)) {
          isValid = false;
          showError(field, 'Please enter a valid email address');
        }
      });
      
      // Validate phone fields
      const phoneFields = form.querySelectorAll('input[type="tel"]');
      phoneFields.forEach(field => {
        if (field.value.trim() && !isValidPhone(field.value)) {
          isValid = false;
          showError(field, 'Please enter a valid phone number');
        }
      });
      
      if (!isValid) {
        event.preventDefault();
      }
    });
  });
}

// Show error message
function showError(field, message) {
  // Clear any existing error
  clearError(field);
  
  // Add error class to the field
  field.classList.add('error');
  
  // Create and append error message
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.innerText = message;
  
  const parent = field.parentElement;
  parent.appendChild(errorDiv);
}

// Clear error message
function clearError(field) {
  field.classList.remove('error');
  
  const parent = field.parentElement;
  const errorDiv = parent.querySelector('.error-message');
  if (errorDiv) {
    parent.removeChild(errorDiv);
  }
}

// Email validation
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Phone validation
function isValidPhone(phone) {
  // Basic phone validation - can be customized for specific formats
  const phoneRegex = /^[0-9\-\+\s\(\)]{10,15}$/;
  return phoneRegex.test(phone);
}

// Alert Filters
function initAlertFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const alertCards = document.querySelectorAll('.alert-card');
  
  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      this.classList.add('active');
      
      const filter = this.dataset.filter;
      
      // Show/hide alert cards based on filter
      alertCards.forEach(card => {
        if (filter === 'all') {
          card.style.display = 'block';
        } else {
          if (card.classList.contains(filter)) {
            card.style.display = 'block';
          } else {
            card.style.display = 'none';
          }
        }
      });
    });
  });
}

// Admin Dashboard
function initAdminDashboard() {
  // Toggle alert form
  const newAlertBtn = document.querySelector('#new-alert-btn');
  const alertForm = document.querySelector('#alert-form');
  
  if (newAlertBtn && alertForm) {
    newAlertBtn.addEventListener('click', function() {
      alertForm.classList.toggle('show');
    });
  }
  
  // Alert type selection
  const alertTypeSelect = document.querySelector('#alert-type');
  const severityField = document.querySelector('#severity-field');
  
  if (alertTypeSelect && severityField) {
    alertTypeSelect.addEventListener('change', function() {
      if (this.value === 'flood') {
        severityField.style.display = 'block';
      } else {
        severityField.style.display = 'none';
      }
    });
  }
  
  // Delete confirmation
  const deleteButtons = document.querySelectorAll('.delete-btn');
  
  deleteButtons.forEach(button => {
    button.addEventListener('click', function(event) {
      if (!confirm('Are you sure you want to delete this item?')) {
        event.preventDefault();
      }
    });
  });
}

// Function to display volunteer form when "Volunteer Help" button is clicked
function showVolunteerForm(alertId) {
  // Store the alert ID in session storage to use it when submitting the form
  sessionStorage.setItem('volunteerForAlertId', alertId);
  
  // Redirect to volunteer registration page
  window.location.href = '/volunteer';
}

// Function to load alert details on the volunteer page if coming from an alert
function loadAlertDetailsForVolunteer() {
  const alertId = sessionStorage.getItem('volunteerForAlertId');
  const alertInfoElement = document.querySelector('#alert-info');
  
  if (alertId && alertInfoElement) {
    // Fetch alert details from the server
    fetch(`/api/alerts/${alertId}`)
      .then(response => response.json())
      .then(alert => {
        // Display alert information on the volunteer form
        alertInfoElement.innerHTML = `
          <div class="alert-card ${alert.type === 'flood' ? 'danger' : 'warning'}">
            <div class="alert-header">
              <h3 class="alert-title">${alert.title}</h3>
              <span class="alert-date">${new Date(alert.date).toLocaleDateString()}</span>
            </div>
            <div class="alert-content">
              <p>${alert.description}</p>
            </div>
            <div class="alert-footer">
              <span class="alert-location">${alert.location}</span>
            </div>
          </div>
        `;
        
        // Set the alert ID in the hidden form field
        const alertIdField = document.querySelector('#alert-id');
        if (alertIdField) {
          alertIdField.value = alertId;
        }
      })
      .catch(error => {
        console.error('Error fetching alert details:', error);
        alertInfoElement.innerHTML = '<p class="error">Unable to load alert details.</p>';
      });
  }
}