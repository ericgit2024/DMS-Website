// Admin Alerts Management System
class AlertsManager {
    constructor() {
        this.alerts = [];
        this.subscribers = [];
        this.init();
    }

    init() {
        // Load alerts from localStorage
        const savedAlerts = localStorage.getItem('adminAlerts');
        if (savedAlerts) {
            this.alerts = JSON.parse(savedAlerts);
        }
    }

    createAlert(alertData) {
        const alert = {
            id: Date.now(),
            ...alertData,
            published: true,
            publishedAt: new Date().toISOString(),
            adminId: this.getCurrentAdminId(),
            status: 'active'
        };

        this.alerts.push(alert);
        this.saveAlerts();
        this.notifySubscribers(alert);
        return alert;
    }

    updateAlert(alertId, updateData) {
        const index = this.alerts.findIndex(alert => alert.id === alertId);
        if (index !== -1) {
            this.alerts[index] = {
                ...this.alerts[index],
                ...updateData,
                lastUpdated: new Date().toISOString()
            };
            this.saveAlerts();
            return true;
        }
        return false;
    }

    deleteAlert(alertId) {
        const index = this.alerts.findIndex(alert => alert.id === alertId);
        if (index !== -1) {
            this.alerts.splice(index, 1);
            this.saveAlerts();
            return true;
        }
        return false;
    }

    getActiveAlerts() {
        return this.alerts.filter(alert => 
            alert.published && 
            alert.status === 'active' && 
            new Date(alert.expires) > new Date()
        );
    }

    getAlertsByRegion(region) {
        return this.getActiveAlerts().filter(alert => alert.region === region);
    }

    getAlertsByType(type) {
        return this.getActiveAlerts().filter(alert => alert.type === type);
    }

    subscribeToAlerts(callback) {
        this.subscribers.push(callback);
    }

    notifySubscribers(alert) {
        this.subscribers.forEach(callback => callback(alert));
    }

    saveAlerts() {
        localStorage.setItem('adminAlerts', JSON.stringify(this.alerts));
    }

    getCurrentAdminId() {
        // Get the current admin's ID from the session
        const adminData = sessionStorage.getItem('adminData');
        return adminData ? JSON.parse(adminData).id : null;
    }
}

// Initialize the alerts manager
const alertsManager = new AlertsManager();

// Handle alert form submission
document.addEventListener('DOMContentLoaded', () => {
    const alertForm = document.getElementById('admin-alert-form');
    if (alertForm) {
        alertForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const formData = new FormData(alertForm);
            const alertData = {
                type: formData.get('type'),
                severity: formData.get('severity'),
                title: formData.get('title'),
                description: formData.get('description'),
                region: formData.get('region'),
                location: formData.get('location'),
                date: new Date().toISOString(),
                expires: formData.get('expires'),
            };

            const alert = alertsManager.createAlert(alertData);
            
            // Show success message
            const successMessage = document.createElement('div');
            successMessage.className = 'alert-success';
            successMessage.textContent = 'Alert published successfully!';
            alertForm.appendChild(successMessage);
            
            // Reset form
            alertForm.reset();
            
            // Remove success message after 3 seconds
            setTimeout(() => {
                successMessage.remove();
            }, 3000);
        });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    // Initialize map
    const map = L.map('alert-map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    let drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    // Initialize drawing controls
    const drawControl = new L.Control.Draw({
        draw: {
            polygon: true,
            polyline: true,
            circle: true,
            marker: true,
            rectangle: true
        },
        edit: {
            featureGroup: drawnItems
        }
    });
    map.addControl(drawControl);

    // Handle drawn items
    map.on('draw:created', (e) => {
        const layer = e.layer;
        drawnItems.addLayer(layer);
        document.getElementById('area-coordinates').value = JSON.stringify(layer.toGeoJSON());
    });

    // Form handling
    const alertForm = document.getElementById('disaster-alert-form');
    const newAlertBtn = document.getElementById('new-alert-btn');
    const cancelBtn = document.getElementById('cancel-alert');
    const alertFormContainer = document.getElementById('new-alert-form');

    // Show/hide form
    newAlertBtn.addEventListener('click', () => {
        alertFormContainer.style.display = 'block';
        map.invalidateSize(); // Refresh map size
    });

    cancelBtn.addEventListener('click', () => {
        alertFormContainer.style.display = 'none';
        alertForm.reset();
        drawnItems.clearLayers();
    });

    // Handle form submission
    alertForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(alertForm);
        const alertData = {
            title: formData.get('title'),
            type: formData.get('type'),
            severity: formData.get('severity'),
            description: formData.get('description'),
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate'),
            region: formData.get('region'),
            populationAffected: formData.get('populationAffected'),
            evacuationCenters: formData.get('evacuationCenters'),
            emergencyContacts: formData.get('emergencyContacts'),
            resourcesNeeded: formData.get('resourcesNeeded'),
            coordinates: formData.get('coordinates'),
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        try {
            // Send to backend API (replace with your actual API endpoint)
            const response = await fetch('/api/alerts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(alertData)
            });

            if (response.ok) {
                showNotification('Alert created successfully', 'success');
                alertForm.reset();
                drawnItems.clearLayers();
                alertFormContainer.style.display = 'none';
                loadAlerts(); // Refresh alerts table
            } else {
                throw new Error('Failed to create alert');
            }
        } catch (error) {
            showNotification(error.message, 'error');
        }
    });

    // Load and display existing alerts
    async function loadAlerts() {
        try {
            // Fetch alerts from backend API (replace with your actual API endpoint)
            const response = await fetch('/api/alerts');
            const alerts = await response.json();

            const tableBody = document.getElementById('alerts-table-body');
            tableBody.innerHTML = '';

            alerts.forEach(alert => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${alert.title}</td>
                    <td>${alert.type}</td>
                    <td><span class="severity-badge ${alert.severity}">${alert.severity}</span></td>
                    <td>${alert.region}</td>
                    <td>${new Date(alert.startDate).toLocaleDateString()}</td>
                    <td><span class="status-badge ${alert.status}">${alert.status}</span></td>
                    <td>
                        <button class="btn-icon edit-alert" data-id="${alert.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon delete-alert" data-id="${alert.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });

            // Add event listeners for edit and delete buttons
            document.querySelectorAll('.edit-alert').forEach(btn => {
                btn.addEventListener('click', () => editAlert(btn.dataset.id));
            });

            document.querySelectorAll('.delete-alert').forEach(btn => {
                btn.addEventListener('click', () => deleteAlert(btn.dataset.id));
            });
        } catch (error) {
            showNotification('Failed to load alerts', 'error');
        }
    }

    // Edit alert function
    async function editAlert(alertId) {
        try {
            const response = await fetch(`/api/alerts/${alertId}`);
            const alert = await response.json();

            // Populate form with alert data
            for (const [key, value] of Object.entries(alert)) {
                const input = alertForm.elements[key];
                if (input) {
                    input.value = value;
                }
            }

            // Show form
            alertFormContainer.style.display = 'block';
            map.invalidateSize();

            // Draw area on map if coordinates exist
            if (alert.coordinates) {
                drawnItems.clearLayers();
                const geoJSON = JSON.parse(alert.coordinates);
                L.geoJSON(geoJSON).addTo(drawnItems);
                map.fitBounds(drawnItems.getBounds());
            }
        } catch (error) {
            showNotification('Failed to load alert details', 'error');
        }
    }

    // Delete alert function
    async function deleteAlert(alertId) {
        if (confirm('Are you sure you want to delete this alert?')) {
            try {
                const response = await fetch(`/api/alerts/${alertId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    showNotification('Alert deleted successfully', 'success');
                    loadAlerts(); // Refresh alerts table
                } else {
                    throw new Error('Failed to delete alert');
                }
            } catch (error) {
                showNotification(error.message, 'error');
            }
        }
    }

    // Notification helper function
    function showNotification(message, type) {
        // Implement your notification system here
        alert(message);
    }

    // Initial load
    loadAlerts();
}); 