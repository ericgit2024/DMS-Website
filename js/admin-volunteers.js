document.addEventListener('DOMContentLoaded', () => {
    // Initialize map
    const map = L.map('volunteer-map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Initialize volunteer markers layer
    const volunteerMarkers = L.markerClusterGroup();
    map.addLayer(volunteerMarkers);

    // Handle filters
    const locationFilter = document.getElementById('location-filter');
    const skillsFilter = document.getElementById('skills-filter');
    const availabilityFilter = document.getElementById('availability-filter');
    const searchInput = document.getElementById('volunteer-search');
    const applyFiltersBtn = document.getElementById('apply-filters');
    const exportBtn = document.getElementById('export-volunteers');

    // Load and display volunteers
    async function loadVolunteers(filters = {}) {
        try {
            // Fetch volunteers from backend API (replace with your actual API endpoint)
            const queryParams = new URLSearchParams(filters);
            const response = await fetch(`/api/volunteers?${queryParams}`);
            const volunteers = await response.json();

            // Clear existing markers
            volunteerMarkers.clearLayers();

            // Update table
            const tableBody = document.getElementById('volunteer-table-body');
            tableBody.innerHTML = '';

            // Update location filter options
            const locations = new Set();
            const skills = new Set();

            volunteers.forEach(volunteer => {
                // Add table row
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${volunteer.firstName} ${volunteer.lastName}</td>
                    <td>${volunteer.location}</td>
                    <td>${volunteer.skills.join(', ')}</td>
                    <td>${volunteer.availability}</td>
                    <td>${volunteer.email}<br>${volunteer.phone}</td>
                    <td><span class="status-badge ${volunteer.status}">${volunteer.status}</span></td>
                    <td>
                        <button class="btn-icon view-volunteer" data-id="${volunteer.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon assign-volunteer" data-id="${volunteer.id}">
                            <i class="fas fa-tasks"></i>
                        </button>
                        <button class="btn-icon contact-volunteer" data-id="${volunteer.id}">
                            <i class="fas fa-envelope"></i>
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);

                // Add marker to map
                if (volunteer.coordinates) {
                    const marker = L.marker([volunteer.coordinates.lat, volunteer.coordinates.lng])
                        .bindPopup(`
                            <strong>${volunteer.firstName} ${volunteer.lastName}</strong><br>
                            Skills: ${volunteer.skills.join(', ')}<br>
                            Status: ${volunteer.status}<br>
                            <button onclick="showVolunteerDetails('${volunteer.id}')">View Details</button>
                        `);
                    volunteerMarkers.addLayer(marker);
                }

                // Collect unique locations and skills
                locations.add(volunteer.location);
                volunteer.skills.forEach(skill => skills.add(skill));
            });

            // Update filter options
            updateFilterOptions(locationFilter, Array.from(locations));
            updateFilterOptions(skillsFilter, Array.from(skills));

            // Fit map to markers
            if (volunteerMarkers.getLayers().length > 0) {
                map.fitBounds(volunteerMarkers.getBounds());
            }

            // Add event listeners
            document.querySelectorAll('.view-volunteer').forEach(btn => {
                btn.addEventListener('click', () => showVolunteerDetails(btn.dataset.id));
            });

            document.querySelectorAll('.assign-volunteer').forEach(btn => {
                btn.addEventListener('click', () => assignVolunteer(btn.dataset.id));
            });

            document.querySelectorAll('.contact-volunteer').forEach(btn => {
                btn.addEventListener('click', () => contactVolunteer(btn.dataset.id));
            });
        } catch (error) {
            showNotification('Failed to load volunteers', 'error');
        }
    }

    // Update filter options
    function updateFilterOptions(selectElement, options) {
        const currentValue = selectElement.value;
        selectElement.innerHTML = '<option value="">All</option>';
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            selectElement.appendChild(optionElement);
        });
        selectElement.value = currentValue;
    }

    // Apply filters
    applyFiltersBtn.addEventListener('click', () => {
        const filters = {
            location: locationFilter.value,
            skills: skillsFilter.value,
            availability: availabilityFilter.value,
            search: searchInput.value
        };
        loadVolunteers(filters);
    });

    // Search functionality
    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const filters = {
                location: locationFilter.value,
                skills: skillsFilter.value,
                availability: availabilityFilter.value,
                search: searchInput.value
            };
            loadVolunteers(filters);
        }, 500);
    });

    // Show volunteer details
    async function showVolunteerDetails(volunteerId) {
        try {
            const response = await fetch(`/api/volunteers/${volunteerId}`);
            const volunteer = await response.json();

            const modal = document.getElementById('volunteer-details-modal');
            
            // Populate modal with volunteer data
            document.getElementById('volunteer-name').textContent = `${volunteer.firstName} ${volunteer.lastName}`;
            document.getElementById('volunteer-email').textContent = volunteer.email;
            document.getElementById('volunteer-phone').textContent = volunteer.phone;
            document.getElementById('volunteer-location').textContent = volunteer.location;
            document.getElementById('volunteer-skills').textContent = volunteer.skills.join(', ');
            document.getElementById('volunteer-availability').textContent = volunteer.availability;
            document.getElementById('volunteer-emergency-contact').textContent = volunteer.emergencyContact;

            // Show deployment history
            const historyContainer = document.getElementById('deployment-history');
            historyContainer.innerHTML = '';
            if (volunteer.deployments && volunteer.deployments.length > 0) {
                volunteer.deployments.forEach(deployment => {
                    const deploymentElement = document.createElement('div');
                    deploymentElement.className = 'deployment-item';
                    deploymentElement.innerHTML = `
                        <h5>${deployment.alertTitle}</h5>
                        <p>Date: ${new Date(deployment.date).toLocaleDateString()}</p>
                        <p>Role: ${deployment.role}</p>
                        <p>Status: ${deployment.status}</p>
                    `;
                    historyContainer.appendChild(deploymentElement);
                });
            } else {
                historyContainer.innerHTML = '<p>No deployment history available</p>';
            }

            modal.classList.add('active');
        } catch (error) {
            showNotification('Failed to load volunteer details', 'error');
        }
    }

    // Assign volunteer to alert
    async function assignVolunteer(volunteerId) {
        try {
            // Fetch active alerts
            const alertsResponse = await fetch('/api/alerts?status=active');
            const alerts = await alertsResponse.json();

            // Create and show assignment modal
            const assignmentModal = document.createElement('div');
            assignmentModal.className = 'modal active';
            assignmentModal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Assign Volunteer to Alert</h3>
                        <button class="close-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="assignment-form">
                            <div class="form-group">
                                <label for="alert-select">Select Alert</label>
                                <select id="alert-select" required>
                                    ${alerts.map(alert => `
                                        <option value="${alert.id}">${alert.title}</option>
                                    `).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="role-select">Role</label>
                                <select id="role-select" required>
                                    <option value="first-responder">First Responder</option>
                                    <option value="medical">Medical Support</option>
                                    <option value="logistics">Logistics</option>
                                    <option value="communication">Communication</option>
                                </select>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                        <button class="btn primary" onclick="submitAssignment('${volunteerId}')">Assign</button>
                    </div>
                </div>
            `;
            document.body.appendChild(assignmentModal);
        } catch (error) {
            showNotification('Failed to load alerts for assignment', 'error');
        }
    }

    // Submit volunteer assignment
    window.submitAssignment = async (volunteerId) => {
        const alertId = document.getElementById('alert-select').value;
        const role = document.getElementById('role-select').value;

        try {
            const response = await fetch('/api/assignments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    volunteerId,
                    alertId,
                    role,
                    status: 'assigned',
                    assignedAt: new Date().toISOString()
                })
            });

            if (response.ok) {
                showNotification('Volunteer assigned successfully', 'success');
                document.querySelector('.modal').remove();
                loadVolunteers(); // Refresh volunteer list
            } else {
                throw new Error('Failed to assign volunteer');
            }
        } catch (error) {
            showNotification(error.message, 'error');
        }
    };

    // Contact volunteer
    async function contactVolunteer(volunteerId) {
        try {
            const response = await fetch(`/api/volunteers/${volunteerId}`);
            const volunteer = await response.json();

            const contactModal = document.createElement('div');
            contactModal.className = 'modal active';
            contactModal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Contact Volunteer</h3>
                        <button class="close-modal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="contact-form">
                            <div class="form-group">
                                <label for="contact-subject">Subject</label>
                                <input type="text" id="contact-subject" required>
                            </div>
                            <div class="form-group">
                                <label for="contact-message">Message</label>
                                <textarea id="contact-message" rows="5" required></textarea>
                            </div>
                            <div class="form-group">
                                <label>Contact Methods</label>
                                <div class="checkbox-group">
                                    <label>
                                        <input type="checkbox" value="email" checked> Email (${volunteer.email})
                                    </label>
                                    <label>
                                        <input type="checkbox" value="sms"> SMS (${volunteer.phone})
                                    </label>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                        <button class="btn primary" onclick="sendMessage('${volunteerId}')">Send</button>
                    </div>
                </div>
            `;
            document.body.appendChild(contactModal);
        } catch (error) {
            showNotification('Failed to load volunteer contact information', 'error');
        }
    }

    // Send message to volunteer
    window.sendMessage = async (volunteerId) => {
        const subject = document.getElementById('contact-subject').value;
        const message = document.getElementById('contact-message').value;
        const methods = Array.from(document.querySelectorAll('#contact-form input[type="checkbox"]:checked'))
            .map(cb => cb.value);

        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    volunteerId,
                    subject,
                    message,
                    methods
                })
            });

            if (response.ok) {
                showNotification('Message sent successfully', 'success');
                document.querySelector('.modal').remove();
            } else {
                throw new Error('Failed to send message');
            }
        } catch (error) {
            showNotification(error.message, 'error');
        }
    };

    // Export volunteers data
    exportBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/volunteers/export');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `volunteers_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            showNotification('Failed to export volunteers data', 'error');
        }
    });

    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.remove();
        }
    });

    // Notification helper function
    function showNotification(message, type) {
        // Implement your notification system here
        alert(message);
    }

    // Initial load
    loadVolunteers();
}); 