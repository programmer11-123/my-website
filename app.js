// Smart Ambulance Alert and Road Safety System - Enhanced with Real Road Routing
// Updated with Royal College of Engineering & Technology as starting location

// Application Data - UPDATED COORDINATES
let appData = {
  governmentUsers: [
    { username: "admin", password: "1234", role: "government" }
  ],
  hospitalApplications: [
    {
      id: 1,
      name: "City General Hospital",
      regNo: "CGH2024001",
      address: "123 Main Street, Downtown",
      contact: "+1-555-0101",
      email: "admin@citygeneral.com",
      password: "hospital123",
      status: "pending",
      documents: "license.pdf"
    },
    {
      id: 2,
      name: "Metro Medical Center", 
      regNo: "MMC2024002",
      address: "456 Health Ave, Medical District",
      contact: "+1-555-0102", 
      email: "info@metromedical.com",
      password: "metro456",
      status: "approved",
      credentials: { username: "metro_hosp", password: "metro123" }
    }
  ],
  drivers: [
    {
      id: 1,
      name: "John Smith",
      driverId: "DRV001",
      password: "driver123",
      email: "john.smith@gmail.com",
      hospitalId: 2
    },
    {
      id: 2,
      name: "Sarah Johnson",
      driverId: "DRV002", 
      password: "sarah456",
      email: "sarah.johnson@gmail.com",
      hospitalId: 2
    }
  ],
  // UPDATED: New starting location and hospital destinations
  hospitalDestinations: [
    {
      name: "Ansar Hospital",
      address: "Ansar Hospital, Kerala",
      coordinates: [10.703474633587362, 76.08967508973821]
    },
    {
      name: "Al Ameen Hospital",
      address: "Al Ameen Hospital, Kerala", 
      coordinates: [10.670586537993877, 76.1104557892575]
    },
    {
      name: "Government Hospital Chalissery",
      address: "Government Hospital Chalissery, Kerala",
      coordinates: [10.738291812123968, 76.08795116093631]
    }
  ],
  // UPDATED: New starting location
  defaultLocation: {
    name: "Ansar English School Perumpilavu",
    address: "Perumpilavu, Kerala 680604",
    coordinates: [10.69952872011843, 76.09067759573631]
  }
};

// Application State
let appState = {
  currentUser: null,
  currentPage: 'home',
  map: null,
  routingControl: null,
  selectedDestination: null,
  emergencyActive: false,
  currentRoute: null
};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
  initializeTheme();
  checkExistingSession();
  showPage('home');
  setupEventListeners();
});

// Theme Management
function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.body.setAttribute('data-color-scheme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.body.getAttribute('data-color-scheme');
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  document.body.setAttribute('data-color-scheme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const icon = document.querySelector('.theme-icon');
  if (icon) {
    icon.textContent = theme === 'light' ? '🌙' : '☀️';
  }
}

// Event Listeners
function setupEventListeners() {
  // Theme toggle
  document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
  
  // Form submissions
  document.getElementById('government-login-form')?.addEventListener('submit', handleGovernmentLogin);
  document.getElementById('hospital-login-form')?.addEventListener('submit', handleHospitalLogin);
  document.getElementById('hospital-register-form')?.addEventListener('submit', handleHospitalRegistration);
  document.getElementById('driver-login-form')?.addEventListener('submit', handleDriverLogin);
  document.getElementById('add-driver-form')?.addEventListener('submit', handleAddDriver);
  
  // Driver navigation controls
  document.getElementById('destination-select')?.addEventListener('change', handleDestinationChange);
  document.getElementById('start-navigation')?.addEventListener('click', startNavigation);
  document.getElementById('trigger-emergency')?.addEventListener('click', triggerEmergency);
  document.getElementById('open-google-maps')?.addEventListener('click', openGoogleMaps);
  document.getElementById('stop-emergency')?.addEventListener('click', stopEmergency);
}

// Session Management
function checkExistingSession() {
  const user = localStorage.getItem('currentUser');
  if (user) {
    appState.currentUser = JSON.parse(user);
    showUserDashboard(appState.currentUser);
    document.getElementById('logout-btn').classList.remove('hidden');
  }
}

function saveSession(user) {
  appState.currentUser = user;
  localStorage.setItem('currentUser', JSON.stringify(user));
  document.getElementById('logout-btn').classList.remove('hidden');
}

function logout() {
  appState.currentUser = null;
  localStorage.removeItem('currentUser');
  document.getElementById('logout-btn').classList.add('hidden');
  stopEmergency();
  showPage('home');
  showModal('Success', 'Logged out successfully');
}

// Page Navigation
function showPage(pageId) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  
  // Show target page
  const targetPage = document.getElementById(pageId + '-page') || document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add('active');
    appState.currentPage = pageId;
    
    // Initialize page-specific functionality
    if (pageId === 'driver-dashboard') {
      initializeDriverMap();
    } else if (pageId === 'government-dashboard') {
      updateGovernmentDashboard();
    } else if (pageId === 'hospital-dashboard') {
      updateHospitalDashboard();
    }
  }
}

function showUserDashboard(user) {
  switch (user.role) {
    case 'government':
      showPage('government-dashboard');
      break;
    case 'hospital':
      showPage('hospital-dashboard');
      document.getElementById('hospital-name').textContent = user.name;
      break;
    case 'driver':
      showPage('driver-dashboard');
      document.getElementById('driver-name').textContent = `Welcome, ${user.name}`;
      break;
    default:
      showPage('home');
  }
}

// Authentication Handlers
function handleGovernmentLogin(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const username = formData.get('username');
  const password = formData.get('password');
  
  const user = appData.governmentUsers.find(u => 
    u.username === username && u.password === password
  );
  
  if (user) {
    saveSession(user);
    showPage('government-dashboard');
    showModal('Success', 'Welcome, Government Administrator!');
  } else {
    showError(e.target, 'Invalid credentials. Use admin/1234 for demo.');
  }
}

function handleHospitalLogin(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const email = formData.get('email');
  const password = formData.get('password');
  
  const hospital = appData.hospitalApplications.find(h => 
    h.email === email && h.status === 'approved'
  );
  
  if (!hospital) {
    showError(e.target, 'Hospital not found or not approved yet.');
    return;
  }
  
  const isValidPassword = 
    (hospital.credentials && hospital.credentials.password === password) ||
    hospital.password === password;
  
  if (isValidPassword) {
    const user = { ...hospital, role: 'hospital' };
    saveSession(user);
    showPage('hospital-dashboard');
    showModal('Success', `Welcome, ${hospital.name}!`);
  } else {
    showError(e.target, 'Invalid password.');
  }
}

function handleHospitalRegistration(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  
  const hospital = {
    id: Date.now(),
    name: formData.get('name'),
    regNo: formData.get('regNo'),
    address: formData.get('address'),
    contact: formData.get('contact'),
    email: formData.get('email'),
    password: formData.get('password'),
    status: 'pending'
  };
  
  // Check if email already exists
  const existingHospital = appData.hospitalApplications.find(h => h.email === hospital.email);
  if (existingHospital) {
    showError(e.target, 'Hospital with this email already exists.');
    return;
  }
  
  appData.hospitalApplications.push(hospital);
  e.target.reset();
  
  showModal('Success', 
    'Registration Submitted Successfully!<br>Your hospital registration has been submitted to the government for approval. You will receive login credentials via email once approved.'
  );
}

function handleDriverLogin(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const driverId = formData.get('driverId');
  const password = formData.get('password');
  
  const driver = appData.drivers.find(d => 
    d.driverId === driverId && d.password === password
  );
  
  if (driver) {
    const user = { ...driver, role: 'driver' };
    saveSession(user);
    showPage('driver-dashboard');
    showModal('Success', `Welcome, ${driver.name}!`);
  } else {
    showError(e.target, 'Invalid driver credentials.');
  }
}

function handleAddDriver(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  
  const driver = {
    id: Date.now(),
    name: formData.get('name'),
    driverId: formData.get('driverId'),
    password: formData.get('password'),
    email: formData.get('email') || '',
    hospitalId: appState.currentUser.id
  };
  
  // Check if driver ID already exists
  const existingDriver = appData.drivers.find(d => d.driverId === driver.driverId);
  if (existingDriver) {
    showError(e.target, 'Driver ID already exists.');
    return;
  }
  
  appData.drivers.push(driver);
  e.target.reset();
  updateHospitalDashboard();
  
  // Show credentials modal
  showModal('Driver Added Successfully', 
    `<div style="background: #f0f9ff; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
      <h4>📧 Credentials Sent to: ${driver.email || 'Hospital Administrator'}</h4>
      <p><strong>Driver Name:</strong> ${driver.name}</p>
      <p><strong>Driver ID:</strong> ${driver.driverId}</p>
      <p><strong>Password:</strong> ${driver.password}</p>
      <p><em>The driver can now access the navigation system.</em></p>
    </div>`
  );
}

// Government Dashboard
function updateGovernmentDashboard() {
  const stats = {
    total: appData.hospitalApplications.length,
    approved: appData.hospitalApplications.filter(h => h.status === 'approved').length,
    pending: appData.hospitalApplications.filter(h => h.status === 'pending').length
  };
  
  document.getElementById('total-requests').textContent = stats.total;
  document.getElementById('approved-hospitals').textContent = stats.approved;
  document.getElementById('pending-requests').textContent = stats.pending;
  
  updateHospitalRequestsTable();
}

function updateHospitalRequestsTable() {
  const tbody = document.getElementById('hospital-requests-tbody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  
  appData.hospitalApplications.forEach(hospital => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${hospital.name}</td>
      <td>${hospital.regNo}</td>
      <td>${hospital.address}</td>
      <td>${hospital.contact}</td>
      <td>${hospital.email}</td>
      <td>
        <span class="status-badge status-${hospital.status}">
          ${hospital.status.charAt(0).toUpperCase() + hospital.status.slice(1)}
        </span>
      </td>
      <td>
        ${hospital.status === 'pending' ? `
          <button class="btn btn--sm btn--success" onclick="approveHospital(${hospital.id})">
            Approve
          </button>
          <button class="btn btn--sm" style="background: #ef4444; color: white;" onclick="rejectHospital(${hospital.id})">
            Reject
          </button>
        ` : hospital.status === 'approved' ? `
          <span style="color: #059669;">✓ Approved</span>
        ` : `
          <span style="color: #dc2626;">✗ Rejected</span>
        `}
      </td>
    `;
    tbody.appendChild(row);
  });
}

function approveHospital(hospitalId) {
  const hospital = appData.hospitalApplications.find(h => h.id === hospitalId);
  if (!hospital) return;
  
  // Generate credentials
  const username = hospital.name.toLowerCase().replace(/\s+/g, '_') + '_admin';
  const password = generateSecurePassword();
  
  hospital.status = 'approved';
  hospital.credentials = { username, password };
  
  updateGovernmentDashboard();
  
  // Show email simulation modal
  showModal('📧 Email Sent Successfully', 
    `<div style="background: #f0f9ff; padding: 1rem; border-radius: 0.5rem;">
      <h4>Email sent to: ${hospital.email}</h4>
      <div style="background: #e0f2fe; padding: 1rem; border-radius: 0.5rem; margin: 1rem 0;">
        <h5>Login Credentials for ${hospital.name}</h5>
        <p><strong>Username:</strong> ${username}</p>
        <p><strong>Password:</strong> ${password}</p>
        <p><strong>Portal:</strong> Hospital Login</p>
      </div>
      <p><em>The hospital can now log in using these credentials.</em></p>
    </div>`
  );
}

function rejectHospital(hospitalId) {
  const hospital = appData.hospitalApplications.find(h => h.id === hospitalId);
  if (!hospital) return;
  
  hospital.status = 'rejected';
  hospital.rejectionReason = 'Incomplete documentation';
  
  updateGovernmentDashboard();
  showModal('Hospital Rejected', 'Hospital application has been rejected.');
}

// Hospital Dashboard
function updateHospitalDashboard() {
  const hospitalDrivers = appData.drivers.filter(d => d.hospitalId === appState.currentUser.id);
  
  document.getElementById('total-drivers').textContent = hospitalDrivers.length;
  document.getElementById('active-ambulances').textContent = hospitalDrivers.length;
  
  updateDriversTable();
}

function updateDriversTable() {
  const tbody = document.getElementById('drivers-tbody');
  if (!tbody) return;
  
  const hospitalDrivers = appData.drivers.filter(d => d.hospitalId === appState.currentUser.id);
  
  tbody.innerHTML = '';
  
  hospitalDrivers.forEach(driver => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${driver.name}</td>
      <td>${driver.driverId}</td>
      <td>${driver.email || 'Not provided'}</td>
      <td>
        <button class="btn btn--sm btn--secondary" onclick="editDriver(${driver.id})">
          Edit
        </button>
        <button class="btn btn--sm" style="background: #ef4444; color: white;" onclick="deleteDriver(${driver.id})">
          Delete
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function editDriver(driverId) {
  showModal('Feature Coming Soon', 'Driver editing functionality will be available in the next update.');
}

function deleteDriver(driverId) {
  if (confirm('Are you sure you want to delete this driver?')) {
    appData.drivers = appData.drivers.filter(d => d.id !== driverId);
    updateHospitalDashboard();
    showModal('Success', 'Driver deleted successfully.');
  }
}

// Driver Dashboard and Enhanced Navigation
function initializeDriverMap() {
  if (appState.map) {
    appState.map.remove();
  }
  
  // Initialize map with the new starting location - UPDATED COORDINATES
  appState.map = L.map('map').setView(appData.defaultLocation.coordinates, 14);
  
  // Add high-quality tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c']
  }).addTo(appState.map);
  
  // Add current location marker with enhanced styling - UPDATED LOCATION
  const startIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      border: 3px solid white;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
      font-size: 16px;
    ">📍</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
  
  L.marker(appData.defaultLocation.coordinates, { icon: startIcon })
    .addTo(appState.map)
    .bindPopup(`<b>${appData.defaultLocation.name}</b><br>${appData.defaultLocation.address}`)
    .openPopup();
  
  // Populate destination dropdown with updated hospitals
  populateDestinationDropdown();
}

function populateDestinationDropdown() {
  const select = document.getElementById('destination-select');
  if (!select) return;
  
  select.innerHTML = '<option value="">Select Hospital</option>';
  
  // UPDATED: Using new hospital destinations
  appData.hospitalDestinations.forEach((hospital, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = hospital.name;
    select.appendChild(option);
  });
}

function handleDestinationChange(e) {
  const destinationIndex = parseInt(e.target.value);
  
  if (isNaN(destinationIndex)) {
    // No destination selected
    appState.selectedDestination = null;
    document.getElementById('start-navigation').disabled = true;
    document.getElementById('open-google-maps').disabled = true;
    document.getElementById('distance-info').textContent = '--';
    document.getElementById('eta-info').textContent = '--';
    
    // Clear existing route
    if (appState.routingControl) {
      appState.map.removeControl(appState.routingControl);
      appState.routingControl = null;
    }
    return;
  }
  
  const destination = appData.hospitalDestinations[destinationIndex];
  appState.selectedDestination = destination;
  
  // Enable buttons
  document.getElementById('start-navigation').disabled = false;
  document.getElementById('open-google-maps').disabled = false;
  
  // Calculate enhanced route with REAL ROAD ROUTING
  calculateEnhancedRoute(destination);
}

function calculateEnhancedRoute(destination) {
  // Clear existing route
  if (appState.routingControl) {
    appState.map.removeControl(appState.routingControl);
  }
  
  try {
    // ENHANCED ROUTING WITH OSRM - NO API KEY REQUIRED
    // Uses real road data and turn-by-turn navigation
    appState.routingControl = L.Routing.control({
      waypoints: [
        L.latLng(appData.defaultLocation.coordinates[0], appData.defaultLocation.coordinates[1]),
        L.latLng(destination.coordinates[0], destination.coordinates[1])
      ],
      router: L.Routing.osrmv1({
        serviceUrl: 'https://router.project-osrm.org/route/v1',
        profile: 'driving',
        // Request detailed geometry for curves and road following
        geometries: 'geojson',
        overview: 'full',
        steps: true,
        annotations: true
        
        // ========================================
        // FOR MAPBOX API (if you want to use it instead):
        // Replace the above router with:
        // router: L.Routing.mapbox('PASTE_YOUR_MAPBOX_API_KEY_HERE'),
        // 
        // FOR GOOGLE MAPS API (requires more integration):
        // You would need to use Google Directions API separately
        // and process the response to create the route
        // ========================================
      }),
      addWaypoints: false,
      draggableWaypoints: false,
      routeWhileDragging: false,
      fitSelectedRoutes: true,
      showAlternatives: true,
      altLineOptions: {
        styles: [
          { color: '#888', weight: 6, opacity: 0.4 },
          { color: '#fff', weight: 4, opacity: 0.8 }
        ]
      },
      lineOptions: {
        styles: [
          // Google Maps-like route styling with multiple layers
          { color: '#1976d2', weight: 8, opacity: 0.8 },
          { color: '#2196f3', weight: 6, opacity: 1.0 },
          { color: '#fff', weight: 4, opacity: 0.8 }
        ]
      },
      createMarker: function(i, waypoint, n) {
        if (i === 0) {
          // Enhanced start marker
          return L.marker(waypoint.latLng, {
            icon: L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                border-radius: 50%;
                width: 35px;
                height: 35px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                border: 3px solid white;
                box-shadow: 0 4px 15px rgba(16, 185, 129, 0.6);
                font-size: 14px;
              ">A</div>`,
              iconSize: [35, 35],
              iconAnchor: [17, 17]
            })
          });
        } else {
          // Enhanced destination marker (hospital)
          return L.marker(waypoint.latLng, {
            icon: L.divIcon({
              className: 'custom-div-icon',
              html: `<div style="
                background: linear-gradient(135deg, #ef4444, #dc2626);
                color: white;
                border-radius: 50%;
                width: 35px;
                height: 35px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                border: 3px solid white;
                box-shadow: 0 4px 15px rgba(239, 68, 68, 0.6);
                font-size: 14px;
              ">🏥</div>`,
              iconSize: [35, 35],
              iconAnchor: [17, 17]
            })
          });
        }
      },
      // Enhanced instruction panel with turn-by-turn navigation
      show: true,
      collapsible: true,
      collapsed: false
    }).on('routesfound', function(e) {
      const routes = e.routes;
      const summary = routes[0].summary;
      
      // Store route for navigation
      appState.currentRoute = routes[0];
      
      // Update distance and ETA with enhanced formatting
      const distanceKm = (summary.totalDistance / 1000).toFixed(1);
      const durationMin = Math.round(summary.totalTime / 60);
      const hours = Math.floor(durationMin / 60);
      const mins = durationMin % 60;
      
      let timeString;
      if (hours > 0) {
        timeString = `${hours}h ${mins}m`;
      } else {
        timeString = `${mins} min`;
      }
      
      document.getElementById('distance-info').textContent = `${distanceKm} km`;
      document.getElementById('eta-info').textContent = timeString;
      
      // Add enhanced visual feedback
      showRouteDetails(routes[0]);
      
    }).on('routingerror', function(e) {
      console.error('Routing error:', e);
      handleRoutingError();
    });
    
    // Apply custom styling to make it more Google Maps-like
    setTimeout(() => {
      styleRoutingPanel();
    }, 100);
    
    appState.routingControl.addTo(appState.map);
    
  } catch (error) {
    console.error('Error creating route:', error);
    handleRoutingError();
  }
}

function styleRoutingPanel() {
  // Enhanced styling for the routing panel
  const routingContainer = document.querySelector('.leaflet-routing-container');
  if (routingContainer) {
    routingContainer.style.cssText = `
      background: rgba(255, 255, 255, 0.95) !important;
      backdrop-filter: blur(10px) !important;
      border: 1px solid rgba(255, 255, 255, 0.3) !important;
      border-radius: 12px !important;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2) !important;
      max-width: 320px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
    `;
  }
}

function showRouteDetails(route) {
  // Show brief route info notification
  setTimeout(() => {
    const routeInfo = document.createElement('div');
    routeInfo.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(33, 128, 141, 0.95);
      color: white;
      padding: 12px 24px;
      border-radius: 25px;
      font-weight: 600;
      font-size: 14px;
      z-index: 1000;
      box-shadow: 0 4px 15px rgba(33, 128, 141, 0.4);
      backdrop-filter: blur(10px);
    `;
    routeInfo.textContent = `📍 Route to ${appState.selectedDestination.name} calculated`;
    document.body.appendChild(routeInfo);
    
    setTimeout(() => {
      routeInfo.remove();
    }, 3000);
  }, 500);
}

function handleRoutingError() {
  // Show error modal and offer Google Maps fallback
  showModal('Routing Service Busy', 
    'The routing service is currently busy. Would you like to open directions in Google Maps instead?',
    [
      { text: 'Cancel', action: 'close' },
      { text: 'Open Google Maps', action: openGoogleMaps }
    ]
  );
}

function startNavigation() {
  if (!appState.selectedDestination || !appState.currentRoute) {
    showModal('Error', 'Please select a destination and wait for route calculation.');
    return;
  }
  
  // Update button state
  const button = document.getElementById('start-navigation');
  button.textContent = '🧭 Navigation Active';
  button.disabled = true;
  button.style.background = 'linear-gradient(135deg, #059669, #047857)';
  
  // Add pulsing effect to route
  addNavigationEffects();
  
  showModal('Navigation Started', 
    `<div style="text-align: center;">
      <div style="font-size: 24px; margin-bottom: 10px;">🚑</div>
      <h3 style="margin-bottom: 10px;">Emergency Navigation Active</h3>
      <p>Turn-by-turn navigation to <strong>${appState.selectedDestination.name}</strong> is now active.</p>
      <p style="color: #059669; font-weight: 600;">Follow the blue route on the map</p>
      <div style="margin-top: 15px; padding: 10px; background: rgba(16, 185, 129, 0.1); border-radius: 8px;">
        <p style="margin: 0; font-size: 13px;">📍 Distance: ${document.getElementById('distance-info').textContent}</p>
        <p style="margin: 0; font-size: 13px;">⏱️ ETA: ${document.getElementById('eta-info').textContent}</p>
      </div>
    </div>`
  );
}

function addNavigationEffects() {
  // Add pulsing animation to the route
  const style = document.createElement('style');
  style.textContent = `
    @keyframes routePulse {
      0% { stroke-width: 6; stroke-opacity: 1; }
      50% { stroke-width: 10; stroke-opacity: 0.7; }
      100% { stroke-width: 6; stroke-opacity: 1; }
    }
    
    .leaflet-routing-line {
      animation: routePulse 2s ease-in-out infinite !important;
    }
  `;
  document.head.appendChild(style);
}

function openGoogleMaps() {
  if (!appState.selectedDestination) {
    showModal('Error', 'Please select a destination first.');
    return;
  }
  
  // UPDATED: Using new coordinates
  const startLat = appData.defaultLocation.coordinates[0];
  const startLng = appData.defaultLocation.coordinates[1];
  const destLat = appState.selectedDestination.coordinates[0];
  const destLng = appState.selectedDestination.coordinates[1];
  
  const url = `https://www.google.com/maps/dir/?api=1&origin=${startLat},${startLng}&destination=${destLat},${destLng}&travelmode=driving`;
  
  window.open(url, '_blank');
  
  // Show feedback
  setTimeout(() => {
    const feedback = document.createElement('div');
    feedback.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(66, 165, 245, 0.95);
      color: white;
      padding: 15px 25px;
      border-radius: 8px;
      font-weight: 600;
      z-index: 1001;
      backdrop-filter: blur(10px);
    `;
    feedback.textContent = '🗺️ Opening in Google Maps...';
    document.body.appendChild(feedback);
    
    setTimeout(() => {
      feedback.remove();
    }, 2000);
  }, 100);
}

function triggerEmergency() {
  if (!appState.emergencyActive) {
    appState.emergencyActive = true;
    document.getElementById('emergency-banner').classList.remove('hidden');
    
    const button = document.getElementById('trigger-emergency');
    button.textContent = '🚨 Emergency Active';
    button.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
    button.style.color = 'white';
    button.style.animation = 'pulse 1s infinite';
    
    // Add emergency styling to the route
    addEmergencyEffects();
    
    showModal('🚨 Emergency Signal Activated', 
      `<div style="text-align: center;">
        <div style="font-size: 32px; margin-bottom: 15px; animation: pulse 1s infinite;">🚨</div>
        <h3 style="color: #ef4444; margin-bottom: 15px;">EMERGENCY MODE ACTIVE</h3>
        <div style="background: rgba(239, 68, 68, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
          <p style="margin: 0; font-weight: 600;">✓ Priority corridor established</p>
          <p style="margin: 0; font-weight: 600;">✓ Emergency services notified</p>
          <p style="margin: 0; font-weight: 600;">✓ Traffic management activated</p>
        </div>
        <p style="color: #666; font-size: 14px;">Route: ${appData.defaultLocation.name} → ${appState.selectedDestination?.name || 'Selected Hospital'}</p>
      </div>`
    );
  }
}

function addEmergencyEffects() {
  // Add emergency styling
  const emergencyStyle = document.createElement('style');
  emergencyStyle.id = 'emergency-effects';
  emergencyStyle.textContent = `
    @keyframes emergencyPulse {
      0% { 
        stroke: #ef4444; 
        stroke-width: 8; 
        stroke-opacity: 1; 
      }
      50% { 
        stroke: #fca5a5; 
        stroke-width: 12; 
        stroke-opacity: 0.8; 
      }
      100% { 
        stroke: #ef4444; 
        stroke-width: 8; 
        stroke-opacity: 1; 
      }
    }
    
    .leaflet-routing-line {
      animation: emergencyPulse 1s ease-in-out infinite !important;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.7; transform: scale(1.05); }
    }
  `;
  document.head.appendChild(emergencyStyle);
}

function stopEmergency() {
  appState.emergencyActive = false;
  document.getElementById('emergency-banner').classList.add('hidden');
  
  const button = document.getElementById('trigger-emergency');
  if (button) {
    button.textContent = '🚨 Trigger Signal';
    button.style.background = '';
    button.style.color = '';
    button.style.animation = '';
  }
  
  // Remove emergency effects
  const emergencyStyle = document.getElementById('emergency-effects');
  if (emergencyStyle) {
    emergencyStyle.remove();
  }
  
  // Reset navigation button if needed
  const navButton = document.getElementById('start-navigation');
  if (navButton && appState.selectedDestination) {
    navButton.textContent = '🧭 Start Emergency Navigation';
    navButton.disabled = false;
    navButton.style.background = '';
  }
}

// Utility Functions
function generateSecurePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

function showError(form, message) {
  // Remove existing error messages
  const existingError = form.querySelector('.error-message');
  if (existingError) {
    existingError.remove();
  }
  
  // Create new error message
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  
  // Insert at the beginning of the form
  form.insertBefore(errorDiv, form.firstChild);
  
  // Shake animation for form
  form.style.animation = 'shake 0.5s ease-in-out';
  setTimeout(() => {
    form.style.animation = '';
  }, 500);
}

function showModal(title, message, buttons) {
  // Remove existing modal
  const existingModal = document.querySelector('.modal-overlay');
  if (existingModal) {
    existingModal.remove();
  }
  
  const buttonsHtml = buttons ? buttons.map(btn => 
    `<button class="btn btn--primary" onclick="${typeof btn.action === 'function' ? btn.action.name + '()' : 'closeModal()'}">${btn.text}</button>`
  ).join('') : '<button class="btn btn--primary" onclick="closeModal()">OK</button>';
  
  // Create modal HTML
  const modalHTML = `
    <div class="modal-overlay" onclick="closeModal()">
      <div class="modal-content" onclick="event.stopPropagation()" style="
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(15px);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 16px;
        padding: 2rem;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        animation: slideUp 0.3s ease-out;
      ">
        <h3 style="margin-bottom: 1rem; color: var(--text-primary);">${title}</h3>
        <div style="margin-bottom: 1.5rem; color: var(--text-secondary); line-height: 1.6;">${message}</div>
        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
          ${buttonsHtml}
        </div>
      </div>
    </div>
  `;
  
  // Add to document
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Add enhanced modal styles if not present
  if (!document.querySelector('#enhanced-modal-styles')) {
    const modalStyles = document.createElement('style');
    modalStyles.id = 'enhanced-modal-styles';
    modalStyles.textContent = `
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease-out;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      @keyframes slideUp {
        from {
          opacity: 0;
          transform: translateY(50px) scale(0.9);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;
    document.head.appendChild(modalStyles);
  }
}

function closeModal() {
  const modal = document.querySelector('.modal-overlay');
  if (modal) {
    modal.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
}

// Global functions for onclick handlers
window.showPage = showPage;
window.approveHospital = approveHospital;
window.rejectHospital = rejectHospital;
window.editDriver = editDriver;
window.deleteDriver = deleteDriver;
window.closeModal = closeModal;
