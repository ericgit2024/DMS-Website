// Disaster Alerts Functionality
document.addEventListener('DOMContentLoaded', () => {
    const alertList = document.getElementById('alert-list');
    const regionFilter = document.getElementById('region-filter');
    const disasterFilter = document.getElementById('disaster-filter');
    const filterButton = document.getElementById('filter-button');
    const noAlertsMessage = document.getElementById('no-alerts-message');
    
    // Format date for display
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // Calculate time remaining until alert expires
    function getTimeRemaining(expiresDate) {
        const now = new Date();
        const expires = new Date(expiresDate);
        const diff = expires - now;
        
        if (diff <= 0) return 'Expired';
        
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) return `${days}d ${hours}h remaining`;
        if (hours > 0) return `${hours}h ${minutes}m remaining`;
        return `${minutes}m remaining`;
    }
    
    // Create alert card element
    function createAlertCard(alert) {
        const card = document.createElement('div');
        card.className = `alert-card ${alert.severity.toLowerCase()}`;
        card.innerHTML = `
            <div class="alert-header">
                <span class="alert-type">${alert.type}</span>
                <span class="alert-severity">${alert.severity}</span>
            </div>
            <h3 class="alert-title">${alert.title}</h3>
            <p class="alert-description">${alert.description}</p>
            <div class="alert-details">
                <p><strong>Location:</strong> ${alert.location}</p>
                <p><strong>Region:</strong> ${alert.region}</p>
                <p><strong>Published:</strong> ${formatDate(alert.publishedAt)}</p>
                <p class="time-remaining" data-expires="${alert.expires}">
                    ${getTimeRemaining(alert.expires)}
                </p>
            </div>
            <div class="alert-actions">
                <button class="btn-details" onclick="showAlertDetails('${alert.id}')">View Details</button>
                <button class="btn-share" onclick="shareAlert('${alert.id}')">Share</button>
            </div>
        `;
        return card;
    }
    
    // Display alerts
    function displayAlerts(alerts) {
        alertList.innerHTML = '';
        
        if (alerts.length === 0) {
            noAlertsMessage.style.display = 'block';
            return;
        }
        
        noAlertsMessage.style.display = 'none';
        alerts.forEach(alert => {
            alertList.appendChild(createAlertCard(alert));
        });
    }
    
    // Filter alerts
    function filterAlerts() {
        const selectedRegion = regionFilter.value;
        const selectedType = disasterFilter.value;
        
        let filteredAlerts = alertsManager.getActiveAlerts();
        
        if (selectedRegion !== 'all') {
            filteredAlerts = alertsManager.getAlertsByRegion(selectedRegion);
        }
        
        if (selectedType !== 'all') {
            filteredAlerts = alertsManager.getAlertsByType(selectedType);
        }
        
        displayAlerts(filteredAlerts);
    }
    
    // Update time remaining for each alert
    function updateTimeRemaining() {
        const timeElements = document.querySelectorAll('.time-remaining');
        timeElements.forEach(element => {
            const expires = element.dataset.expires;
            element.textContent = getTimeRemaining(expires);
        });
    }
    
    // Initial display
    displayAlerts(alertsManager.getActiveAlerts());
    
    // Set up event listeners
    filterButton.addEventListener('click', filterAlerts);
    
    // Subscribe to new alerts
    alertsManager.subscribeToAlerts((newAlert) => {
        displayAlerts(alertsManager.getActiveAlerts());
    });
    
    // Update time remaining every minute
    setInterval(updateTimeRemaining, 60000);
});

// Alert detail view function
function showAlertDetails(alertId) {
    // Implementation for showing detailed view of an alert
    console.log('Showing details for alert:', alertId);
}

// Share alert function
function shareAlert(alertId) {
    // Implementation for sharing an alert
    console.log('Sharing alert:', alertId);
} 