// ===== CONFIG =====
const API_URL = window.location.origin + '/api';
const SOCKET_URL = window.location.origin;

let socket = null;
let authToken = localStorage.getItem('authToken') || null;
let currentUser = localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')) : null;
let currentMode = null;

// ===== SOCKET.IO INITIALIZATION =====
function initializeSocket() {
    socket = io(SOCKET_URL);

    socket.on('connect', () => {
        console.log('Connected to server');
        if (currentUser) {
            socket.emit('officer:online', { officerId: currentUser.id });
        }
    });

    socket.on('call:created', (call) => {
        if (currentMode === 'dispatch') {
            renderDispatcherView();
        } else if (currentMode === 'officer') {
            renderOfficerView();
        }
    });

    socket.on('call:updated', (call) => {
        if (currentMode === 'dispatch') {
            renderDispatcherView();
        } else if (currentMode === 'officer') {
            renderOfficerView();
        }
    });

    socket.on('unit:updated', (unit) => {
        if (currentMode === 'dispatch') {
            renderUnitsList();
        }
    });

    socket.on('unit:status', (data) => {
        if (currentMode === 'dispatch') {
            renderUnitsList();
        }
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });
}

// ===== API HELPERS =====
async function apiCall(method, endpoint, data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (authToken) {
        options.headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'API Error');
        }

        return result;
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
}

// ===== LOGIN SYSTEM =====
function switchLoginTab(tab) {
    document.querySelectorAll('.login-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.login-tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tab === 'login' ? 'loginForm' : 'registerForm').classList.add('active');
}

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const role = document.getElementById('userRole').value;
    const badge = document.getElementById('loginBadge').value;
    const password = document.getElementById('loginPassword').value;

    if (!role || !badge || !password) {
        alert('Please fill in all fields');
        return;
    }

    const result = await apiCall('POST', '/auth/login', {
        badge,
        password,
    });

    if (result) {
        authToken = result.token;
        currentUser = result.user;
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        initializeSocket();

        document.getElementById('loginScreen').classList.remove('active');
        
        if (result.user.role === 'dispatcher') {
            switchMode('dispatch');
        } else {
            switchMode('officer');
        }
    } else {
        alert('Login failed');
    }
});

document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const role = document.getElementById('regRole').value;
    const name = document.getElementById('regName').value;
    const badge = document.getElementById('regBadge').value;
    const password = document.getElementById('regPassword').value;

    if (!role || !name || !badge || !password) {
        alert('Please fill in all fields');
        return;
    }

    const result = await apiCall('POST', '/auth/register', {
        name,
        badge,
        password,
        role,
    });

    if (result) {
        alert('Registration successful! Please log in.');
        document.getElementById('registerForm').reset();
        switchLoginTab('login');
    } else {
        alert('Registration failed');
    }
});

// ===== MODE SWITCHING =====
function switchMode(mode) {
    if (!currentUser) return;

    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    if (mode === 'dispatch' && currentUser.role === 'dispatcher') {
        document.getElementById('dispatcherScreen').classList.add('active');
        currentMode = 'dispatch';
        renderDispatcherView();
    } else if (mode === 'officer' && currentUser.role === 'officer') {
        document.getElementById('officerScreen').classList.add('active');
        currentMode = 'officer';
        renderOfficerView();
    }
}

function logOut() {
    if (socket) {
        socket.emit('officer:offline', { officerId: currentUser.id });
        socket.disconnect();
    }

    currentUser = null;
    currentMode = null;
    authToken = null;
    socket = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');

    document.getElementById('loginForm').reset();
    document.getElementById('registerForm').reset();
    document.getElementById('loginScreen').classList.add('active');
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
}

// ===== DISPATCHER VIEW =====
async function renderDispatcherView() {
    await renderActiveCallsList();
    await renderUnitsList();
}

async function renderActiveCallsList() {
    const calls = await apiCall('GET', '/calls');
    const container = document.getElementById('activeCallsList');
    container.innerHTML = '';

    if (!calls || calls.length === 0) {
        container.innerHTML = '<p class="placeholder">No active calls</p>';
        document.getElementById('callCount').textContent = '0';
        return;
    }

    document.getElementById('callCount').textContent = calls.length;

    calls.forEach((call, index) => {
        const callEl = document.createElement('div');
        callEl.className = 'call-item' + (index === 0 ? ' active' : '');
        
        callEl.innerHTML = `
            <div class="call-item-header">
                <span class="call-id">${call.callId}</span>
                <span class="call-priority priority-${call.priority}">${call.priority.toUpperCase()}</span>
            </div>
            <div class="call-type">${formatCallType(call.type)}</div>
            <div class="call-location">${call.location}</div>
        `;

        callEl.addEventListener('click', () => {
            document.querySelectorAll('.call-item').forEach(item => item.classList.remove('active'));
            callEl.classList.add('active');
            renderCallDetails(call);
        });

        container.appendChild(callEl);
    });

    if (calls.length > 0) {
        renderCallDetails(calls[0]);
    }
}

function renderCallDetails(call) {
    const container = document.getElementById('callDetailsContainer');
    
    const unitsHtml = call.assignedUnits.map(unit => 
        `<div class="status-badge">${unit.unitId} - ${unit.officer ? unit.officer.name : 'N/A'}</div>`
    ).join('');

    container.innerHTML = `
        <div class="call-detail-item">
            <div class="detail-label">Call ID</div>
            <div class="detail-value">${call.callId}</div>
        </div>
        <div class="call-detail-item">
            <div class="detail-label">Type</div>
            <div class="detail-value">${formatCallType(call.type)}</div>
        </div>
        <div class="call-detail-item">
            <div class="detail-label">Priority</div>
            <div class="detail-value">${call.priority.toUpperCase()}</div>
        </div>
        <div class="call-detail-item">
            <div class="detail-label">Status</div>
            <div class="detail-value">${call.status.toUpperCase()}</div>
        </div>
        <div class="call-detail-item">
            <div class="detail-label">Location</div>
            <div class="detail-value">${call.location}</div>
        </div>
        <div class="call-detail-item">
            <div class="detail-label">Description</div>
            <div class="detail-value">${call.description}</div>
        </div>
        <div class="call-detail-item">
            <div class="detail-label">Caller</div>
            <div class="detail-value">${call.caller}</div>
        </div>
        <div class="call-detail-item">
            <div class="detail-label">Phone</div>
            <div class="detail-value">${call.phone}</div>
        </div>
        <div class="call-detail-item">
            <div class="detail-label">Assigned Units</div>
            <div class="detail-value">${unitsHtml || 'None'}</div>
        </div>
        <div class="call-detail-item">
            <div class="detail-label">Actions</div>
            <div>
                <button class="btn btn-success" onclick="assignUnitToCall('${call._id}')">Assign Unit</button>
                <button class="btn btn-cancel" onclick="closeCall('${call._id}')">Close Call</button>
            </div>
        </div>
    `;
}

async function renderUnitsList() {
    const units = await apiCall('GET', '/units');
    const container = document.getElementById('unitsList');
    container.innerHTML = '';

    if (!units) return;

    units.forEach(unit => {
        const unitEl = document.createElement('div');
        unitEl.className = 'unit-item';

        unitEl.innerHTML = `
            <div class="unit-name">${unit.name}</div>
            <div class="unit-status">
                Badge: ${unit.badge}
                <span class="status-badge status-${unit.status}">${unit.status.toUpperCase()}</span>
            </div>
            <div class="unit-status">Location: ${unit.location}</div>
        `;

        container.appendChild(unitEl);
    });
}

async function assignUnitToCall(callId) {
    const units = await apiCall('GET', '/units');
    const availableUnits = units.filter(u => u.status === 'available');
    
    if (availableUnits.length === 0) {
        alert('No available units');
        return;
    }

    const unitId = prompt('Enter Unit ID (e.g., U-001):', availableUnits[0].unitId);
    if (!unitId) return;

    const unit = units.find(u => u.unitId === unitId);
    if (!unit) {
        alert('Unit not found');
        return;
    }

    const result = await apiCall('POST', `/calls/${callId}/assign-unit`, {
        unitId: unit._id,
    });

    if (result) {
        renderDispatcherView();
        alert(`Unit ${unitId} assigned to call`);
    }
}

async function closeCall(callId) {
    if (confirm('Close this call?')) {
        const result = await apiCall('POST', `/calls/${callId}/close`);
        if (result) {
            renderDispatcherView();
        }
    }
}

// ===== CREATE CALL MODAL =====
function openCreateCall() {
    document.getElementById('createCallModal').classList.add('active');
}

function closeCreateCall() {
    document.getElementById('createCallModal').classList.remove('active');
    document.getElementById('createCallForm').reset();
}

async function submitCreateCall(e) {
    e.preventDefault();

    const newCallData = {
        type: document.getElementById('callType').value,
        priority: document.getElementById('callPriority').value,
        location: document.getElementById('callLocation').value,
        description: document.getElementById('callDescription').value,
        caller: document.getElementById('callCaller').value || 'Anonymous',
        phone: document.getElementById('callPhone').value || 'Unknown',
    };

    const result = await apiCall('POST', '/calls', newCallData);

    if (result) {
        closeCreateCall();
        renderDispatcherView();
        alert(`Call ${result.callId} created successfully!`);
    }
}

// ===== OFFICER VIEW =====
async function renderOfficerView() {
    document.getElementById('officerName').textContent = currentUser.name;
    document.getElementById('officerBadge').textContent = `Badge: ${currentUser.badge}`;
    
    await renderOfficerCalls();
    await renderAllCalls();
    await renderCitizensDB();
    await renderVehiclesDB();
}

async function renderOfficerCalls() {
    const calls = await apiCall('GET', '/calls');
    const container = document.getElementById('officerCalls');
    container.innerHTML = '';

    if (!calls) return;

    const myCalls = calls.filter(call => 
        call.assignedUnits.some(unit => unit.officer && unit.officer._id === currentUser.id)
    );

    if (myCalls.length === 0) {
        container.innerHTML = '<p class="placeholder">No calls assigned to you</p>';
        return;
    }

    myCalls.forEach(call => {
        const callCard = createCallCard(call, true);
        container.appendChild(callCard);
    });
}

async function renderAllCalls() {
    const calls = await apiCall('GET', '/calls');
    const container = document.getElementById('allCallsList');
    container.innerHTML = '';

    if (!calls || calls.length === 0) {
        container.innerHTML = '<p class="placeholder">No active calls</p>';
        return;
    }

    calls.forEach(call => {
        const callCard = createCallCard(call, false);
        container.appendChild(callCard);
    });
}

function createCallCard(call, isAssigned) {
    const card = document.createElement('div');
    card.className = 'mdt-call-card' + (isAssigned ? ' assigned' : '');

    card.innerHTML = `
        <div class="call-card-header">
            <span class="call-card-id">${call.callId}</span>
            <span class="call-priority priority-${call.priority}">${call.priority.toUpperCase()}</span>
        </div>
        <div class="call-card-type">${formatCallType(call.type)}</div>
        <div class="call-card-location">${call.location}</div>
        <div class="call-card-status">Status: ${call.status.toUpperCase()}</div>
    `;

    card.addEventListener('click', () => {
        showCallDetailsModal(call);
    });

    return card;
}

function showCallDetailsModal(call) {
    const content = document.getElementById('callDetailsContent');
    
    content.innerHTML = `
        <div style="padding: 1.5rem;">
            <div class="call-detail-item">
                <div class="detail-label">Call ID</div>
                <div class="detail-value">${call.callId}</div>
            </div>
            <div class="call-detail-item">
                <div class="detail-label">Type</div>
                <div class="detail-value">${formatCallType(call.type)}</div>
            </div>
            <div class="call-detail-item">
                <div class="detail-label">Priority</div>
                <div class="detail-value">${call.priority.toUpperCase()}</div>
            </div>
            <div class="call-detail-item">
                <div class="detail-label">Location</div>
                <div class="detail-value">${call.location}</div>
            </div>
            <div class="call-detail-item">
                <div class="detail-label">Description</div>
                <div class="detail-value">${call.description}</div>
            </div>
            <div class="call-detail-item">
                <div class="detail-label">Caller</div>
                <div class="detail-value">${call.caller}</div>
            </div>
            <div class="call-detail-item">
                <div class="detail-label">Phone</div>
                <div class="detail-value">${call.phone}</div>
            </div>
            <button class="btn btn-success" onclick="respondToCall('${call._id}')">Respond to Call</button>
        </div>
    `;

    document.getElementById('callDetailsModal').classList.add('active');
}

async function respondToCall(callId) {
    const result = await apiCall('PUT', `/calls/${callId}`, {
        status: 'in-progress',
    });

    if (result) {
        renderOfficerView();
        closeCallDetails();
        alert('You are now responding to this call');
    }
}

function closeCallDetails() {
    document.getElementById('callDetailsModal').classList.remove('active');
}

async function renderCitizensDB() {
    const citizens = await apiCall('GET', '/citizens');
    const container = document.getElementById('citizensList');
    container.innerHTML = '';

    if (!citizens) return;

    citizens.forEach(citizen => {
        const item = document.createElement('div');
        item.className = 'db-item';

        item.innerHTML = `
            <div class="db-item-title">${citizen.name}</div>
            <div class="db-item-info">
                <div class="db-item-info-line">
                    <span class="db-item-label">ID:</span> ${citizen.citizenId}
                </div>
                <div class="db-item-info-line">
                    <span class="db-item-label">DOB:</span> ${citizen.dateOfBirth || 'N/A'}
                </div>
                <div class="db-item-info-line">
                    <span class="db-item-label">License:</span> ${citizen.licenseNumber || 'N/A'}
                </div>
                <div class="db-item-info-line">
                    <span class="db-item-label">Warrants:</span> ${citizen.warrants.length}
                </div>
            </div>
        `;

        container.appendChild(item);
    });
}

async function renderVehiclesDB() {
    const vehicles = await apiCall('GET', '/vehicles');
    const container = document.getElementById('vehiclesList');
    container.innerHTML = '';

    if (!vehicles) return;

    vehicles.forEach(vehicle => {
        const item = document.createElement('div');
        item.className = 'db-item';

        item.innerHTML = `
            <div class="db-item-title">${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})</div>
            <div class="db-item-info">
                <div class="db-item-info-line">
                    <span class="db-item-label">Plate:</span> ${vehicle.licensePlate}
                </div>
                <div class="db-item-info-line">
                    <span class="db-item-label">Year:</span> ${vehicle.year}
                </div>
                <div class="db-item-info-line">
                    <span class="db-item-label">VIN:</span> ${vehicle.vin}
                </div>
                <div class="db-item-info-line">
                    <span class="db-item-label">Registered:</span> ${vehicle.registered ? 'Yes' : 'No'}
                </div>
                <div class="db-item-info-line">
                    <span class="db-item-label">Flags:</span> ${vehicle.flags.length}
                </div>
            </div>
        `;

        container.appendChild(item);
    });
}

async function searchCitizens() {
    const query = document.getElementById('citizenSearch').value;
    if (!query) {
        renderCitizensDB();
        return;
    }

    const citizens = await apiCall('GET', `/citizens/search?query=${query}`);
    const container = document.getElementById('citizensList');
    container.innerHTML = '';

    if (!citizens || citizens.length === 0) {
        container.innerHTML = '<p class="placeholder">No citizens found</p>';
        return;
    }

    citizens.forEach(citizen => {
        const item = document.createElement('div');
        item.className = 'db-item';

        item.innerHTML = `
            <div class="db-item-title">${citizen.name}</div>
            <div class="db-item-info">
                <div class="db-item-info-line">
                    <span class="db-item-label">ID:</span> ${citizen.citizenId}
                </div>
                <div class="db-item-info-line">
                    <span class="db-item-label">DOB:</span> ${citizen.dateOfBirth || 'N/A'}
                </div>
                <div class="db-item-info-line">
                    <span class="db-item-label">License:</span> ${citizen.licenseNumber || 'N/A'}
                </div>
                <div class="db-item-info-line">
                    <span class="db-item-label">Warrants:</span> ${citizen.warrants.length}
                </div>
            </div>
        `;

        container.appendChild(item);
    });
}

async function searchVehicles() {
    const query = document.getElementById('vehicleSearch').value;
    if (!query) {
        renderVehiclesDB();
        return;
    }

    const vehicles = await apiCall('GET', `/vehicles/search?query=${query}`);
    const container = document.getElementById('vehiclesList');
    container.innerHTML = '';

    if (!vehicles || vehicles.length === 0) {
        container.innerHTML = '<p class="placeholder">No vehicles found</p>';
        return;
    }

    vehicles.forEach(vehicle => {
        const item = document.createElement('div');
        item.className = 'db-item';

        item.innerHTML = `
            <div class="db-item-title">${vehicle.make} ${vehicle.model} (${vehicle.licensePlate})</div>
            <div class="db-item-info">
                <div class="db-item-info-line">
                    <span class="db-item-label">Plate:</span> ${vehicle.licensePlate}
                </div>
                <div class="db-item-info-line">
                    <span class="db-item-label">Year:</span> ${vehicle.year}
                </div>
                <div class="db-item-info-line">
                    <span class="db-item-label">VIN:</span> ${vehicle.vin}
                </div>
                <div class="db-item-info-line">
                    <span class="db-item-label">Registered:</span> ${vehicle.registered ? 'Yes' : 'No'}
                </div>
                <div class="db-item-info-line">
                    <span class="db-item-label">Flags:</span> ${vehicle.flags.length}
                </div>
            </div>
        `;

        container.appendChild(item);
    });
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(`tab-${tabName}`).classList.add('active');
    event.target.classList.add('active');
}

async function updateUnitStatus() {
    const status = document.getElementById('unitStatus').value;
    socket.emit('unit:status:update', {
        unitId: currentUser.id,
        status: status,
        timestamp: new Date(),
    });
}

// ===== UTILITY FUNCTIONS =====
function formatCallType(type) {
    const types = {
        'welfare-check': 'Welfare Check',
        'noise': 'Noise Complaint',
        'traffic-stop': 'Traffic Stop',
        'assault': 'Assault',
        'robbery': 'Robbery',
        'burglary': 'Burglary',
        'accident': 'Traffic Accident',
        'suspicious': 'Suspicious Activity',
        'welfare': 'Welfare Check',
        'other': 'Other',
    };
    return types[type] || type;
}

// ===== INITIALIZATION =====
window.addEventListener('load', () => {
    if (authToken && currentUser) {
        initializeSocket();
        if (currentUser.role === 'dispatcher') {
            switchMode('dispatch');
        } else {
            switchMode('officer');
        }
    }
});

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    const createModal = document.getElementById('createCallModal');
    const detailsModal = document.getElementById('callDetailsModal');

    if (e.target === createModal) {
        closeCreateCall();
    }
    if (e.target === detailsModal) {
        closeCallDetails();
    }
});