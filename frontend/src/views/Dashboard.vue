<template>
  <div class="page">
    <div class="container">
      
      <div class="top-bar">
        <div class="profile">
          <div class="icon">👤</div>
          <div class="admin-box">{{ userName }}</div>
        </div>
        <h1 class="title">Dashboard</h1>
      </div>

      <div class="content">
        
        <div class="panel">

          <div class="panel-header">
            <h2>Manage Appointments</h2>
            <div class="actions">
              <button
                type="button"
                class="btn-light"
                :disabled="!selectedAppointment || selectedAppointment.status === 'confirmed'"
                @click="updateStatus('confirmed')"
              >
                Confirm
              </button>

              <button
                type="button"
                class="btn-light"
                :disabled="!selectedAppointment"
                @click="openEditModal"
              >
                Edit
              </button>
              
              <button
                type="button"
                class="btn-danger"
                :disabled="!selectedAppointment"
                @click="deleteAppointment"
              >
                Delete
              </button>
            </div>
          </div>

          <div class="panel-body">
            
            <div class="list-section">
                <h4 style="margin: 0 0 10px 0; color: #555;">All Bookings</h4>
                <div v-if="loading">Loading...</div>
                <div v-else-if="appointments.length === 0">
                  No bookings found.
                  <div style="margin-top:12px; font-size:13px; color:#666;">
                    Debug: lastFetch = <pre style="display:inline">{{ lastFetchRaw }}</pre>
                  </div>
                </div>
                
                <ul v-else class="appointment-list">
                    <li 
                        v-for="app in appointments" 
                        :key="app.id"
                        :class="{ active: selectedAppointment?.id === app.id }"
                        @click="selectAppointment(app)"
                    >
                        <div style="display:flex; gap:12px; align-items:center;">
                          <div>
                            <div class="client-name">{{ app.client_name }}</div>
                            <div style="font-size:12px; color:#666;">{{ app.service_name || 'General' }} · {{ formatDate(app.appointment_date) }}</div>
                            <div style="font-size:12px; color:#666;">Ref: <span class="value code">{{ app.referenceID }}</span></div>
                          </div>
                        </div>

                        <div style="display:flex; gap:8px; align-items:center;">
                          <span :class="['status-badge', app.status]">{{ app.status }}</span>
                        </div>
                    </li>
                </ul>
            </div>

            <div class="details-section">
                <div class="empty-box" v-if="!selectedAppointment">
                  No appointment selected. Click a booking on the left to view details.
                </div>

                <div v-else class="selected-box">
                  <h3>Appointment Details</h3>
                  <p><strong>Client:</strong> {{ selectedAppointment.client_name }}</p>
                  <p><strong>Reference ID:</strong> <span class="value code">{{ selectedAppointment.referenceID }}</span></p>
                  <p><strong>Service:</strong> {{ selectedAppointment.service_name || 'General Booking' }}</p>
                  <p><strong>Date:</strong> {{ formatDate(selectedAppointment.appointment_date) }}</p>
                  <p><strong>Phone:</strong> {{ selectedAppointment.client_phone }}</p>
                  <p><strong>Email:</strong> {{ selectedAppointment.client_email }}</p>
                  <p><strong>Address:</strong> {{ selectedAppointment.address || '-' }}</p>
                  <p><strong>Status:</strong> <span :class="['status-text', selectedAppointment.status]">{{ selectedAppointment.status }}</span></p>
                </div>
            </div>

          </div>

        </div>

        <div class="side-menu">
          <button class="side-btn" @click="$router.push('/packages')">
            Show Packages <span class="arrow">➤</span>
          </button>
          <button class="side-btn" style="color: red; border-color: red;" @click="$router.push('/login')">
            Logout <span class="arrow">➤</span>
          </button>
        </div>

      </div>

      <!-- EDIT MODAL -->
      <div v-if="showEditModal" class="modal-overlay">
        <div class="modal-card">
          <h3>Edit Booking</h3>

          <form @submit.prevent="submitEdit">
            <div class="form-row two-cols">
              <div>
                <label>First Name</label>
                <input v-model="editForm.firstName" required />
              </div>
              <div>
                <label>Last Name</label>
                <input v-model="editForm.lastName" required />
              </div>
            </div>

            <div class="form-row two-cols">
              <div>
                <label>Phone</label>
                <input v-model="editForm.phone" required />
              </div>
              <div>
                <label>Email</label>
                <input type="email" v-model="editForm.email" required />
              </div>
            </div>

            <div class="form-row">
              <label>Address</label>
              <input v-model="editForm.address" />
            </div>

            <div class="form-row">
              <label>Date & Time</label>
              <input type="datetime-local" v-model="editForm.date" required />
            </div>

            <div class="form-row">
              <label>Service Name</label>
              <input v-model="editForm.serviceName" />
            </div>

            <div class="form-row">
              <label>Status</label>
              <select v-model="editForm.status">
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn-light" @click="closeEditModal">Cancel</button>
              <button type="submit" class="btn-dark">Save changes</button>
            </div>
          </form>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const appointments = ref([]);
const selectedAppointment = ref(null);
const loading = ref(false);
const userName = ref('User'); // <- dynamic display name
const lastFetchRaw = ref('(not fetched yet)');

// Edit modal
const showEditModal = ref(false);
const editForm = ref({
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  address: '',
  date: '',
  serviceName: '',
  status: 'pending',
  package_id: null
});

// normalize booking object returned by backend
function normalizeBooking(raw) {
  const id = raw.bookingID ?? raw.id ?? raw.booking_id ?? raw.id_booking ?? null;
  const firstName = raw.firstName ?? raw.first_name ?? (raw.first_name && raw.first_name) ?? '';
  const lastName = raw.lastName ?? raw.last_name ?? '';
  const client_name = (firstName || lastName) ? `${firstName} ${lastName}`.trim() : (raw.client_name ?? raw.clientName ?? 'Customer');
  const service_name = raw.serviceName ?? raw.service_name ?? raw.service ?? '';
  const appointment_date = raw.date ?? raw.appointment_date ?? raw.created_at ?? raw.date_time ?? null;
  const client_phone = raw.phone ?? raw.client_phone ?? raw.contact ?? '';
  const client_email = raw.email ?? raw.client_email ?? '';
  const status = (raw.status ?? 'pending').toString();
  const referenceID = raw.referenceID ?? raw.reference_id ?? raw.ref ?? raw.referenceId ?? null;
  const address = raw.address ?? null;
  const package_id = raw.package_id ?? raw.packageId ?? null;

  return {
    id,
    bookingID: id,
    referenceID,
    client_name,
    service_name,
    appointment_date,
    client_phone,
    client_email,
    status,
    address,
    package_id,
    raw
  };
}

// 1. Fetch Appointments
const fetchAppointments = async () => {
  loading.value = true;
  try {
    let res = await fetch('http://localhost:3000/api/bookings');
    if (res.status === 404) {
      res = await fetch('http://localhost:3000/api/bookings/all');
    }
    lastFetchRaw.value = `status:${res.status}`;
    if (!res.ok) {
      const text = await res.text().catch(()=>null);
      lastFetchRaw.value = `status:${res.status} body:${text}`;
      appointments.value = [];
      return;
    }
    const data = await res.json();
    lastFetchRaw.value = JSON.stringify(data).slice(0,2000);
    const list = Array.isArray(data) ? data : (data.rows ?? data.data ?? []);
    appointments.value = list.map(normalizeBooking);
  } catch (e) {
    console.error('fetchAppointments error', e);
    lastFetchRaw.value = 'network error: ' + (e && e.message);
    appointments.value = [];
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const d = new Date(String(dateString).replace(' ', 'T'));
  if (isNaN(d.getTime())) return String(dateString);
  return d.toLocaleString();
};

const selectAppointment = (app) => {
  selectedAppointment.value = app;
};

// 2. CONFIRM Logic
const updateStatus = async (status) => {
  if (!selectedAppointment.value) return;
  try {
    const id = selectedAppointment.value.id;
    const res = await fetch(`http://localhost:3000/api/bookings/update/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      // refresh list so UI reflects change
      await fetchAppointments();
      selectedAppointment.value = appointments.value.find(a => a.id === id) ?? null;
    } else {
      console.error('updateStatus failed:', res.status);
      alert('Update failed (see console).');
    }
  } catch (e) {
    console.error(e);
    alert('Server Error');
  }
};

// 3. DELETE Logic
const deleteAppointment = async () => {
  if (!selectedAppointment.value) return;
  if (!confirm('Are you sure you want to delete this booking?')) return;

  try {
    const id = selectedAppointment.value.id;
    const res = await fetch(`http://localhost:3000/api/bookings/delete/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      // refresh
      await fetchAppointments();
      selectedAppointment.value = null;
    } else {
      console.error('deleteAppointment failed:', res.status);
      alert('Delete failed (see console).');
    }
  } catch (e) {
    console.error(e);
    alert('Server Error');
  }
};

// EDIT modal handlers
function openEditModal() {
  if (!selectedAppointment.value) return;
  const s = selectedAppointment.value;

  // prepare datetime-local value (YYYY-MM-DDTHH:MM)
  let dt = s.appointment_date || s.date || '';
  if (dt && typeof dt === 'string') {
    dt = dt.replace(' ', 'T');
    // cut seconds if present
    if (dt.length > 16) dt = dt.slice(0,16);
  }
  editForm.value.date = dt;

  // split name if available
  if (s.raw && (s.raw.firstName || s.raw.first_name)) {
    editForm.value.firstName = s.raw.firstName ?? s.raw.first_name ?? '';
    editForm.value.lastName = s.raw.lastName ?? s.raw.last_name ?? '';
  } else {
    // fallback split
    const parts = s.client_name ? s.client_name.split(' ') : [];
    editForm.value.firstName = parts[0] ?? '';
    editForm.value.lastName = parts.slice(1).join(' ') ?? '';
  }

  editForm.value.phone = s.client_phone ?? (s.raw && (s.raw.phone ?? s.raw.client_phone)) ?? '';
  editForm.value.email = s.client_email ?? (s.raw && (s.raw.email ?? s.raw.client_email)) ?? '';
  editForm.value.address = s.address ?? (s.raw && s.raw.address) ?? '';
  editForm.value.serviceName = s.service_name ?? (s.raw && s.raw.serviceName) ?? '';
  editForm.value.status = s.status ?? 'pending';
  editForm.value.package_id = s.package_id ?? null;

  showEditModal.value = true;
}

function closeEditModal() {
  showEditModal.value = false;
}

async function submitEdit() {
  if (!selectedAppointment.value) return alert('No booking selected');
  const id = selectedAppointment.value.id;

  // convert datetime-local back to DB-friendly format (space between date/time)
  let dateVal = editForm.value.date;
  if (dateVal && dateVal.includes('T')) dateVal = dateVal.replace('T', ' ');
  
  const payload = {
    firstName: editForm.value.firstName,
    lastName: editForm.value.lastName,
    phone: editForm.value.phone,
    email: editForm.value.email,
    address: editForm.value.address,
    date: dateVal,
    serviceName: editForm.value.serviceName,
    status: editForm.value.status,
    package_id: editForm.value.package_id
  };

  try {
    const res = await fetch(`http://localhost:3000/api/bookings/update/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const txt = await res.text().catch(()=>null);
      console.error('Edit failed', res.status, txt);
      alert('Failed to update booking. See console.');
      return;
    }

    const data = await res.json().catch(()=>null);

    if (data && data.booking) {
      // use returned row (normalize) to update UI
      const normalized = normalizeBooking(data.booking);
      const idx = appointments.value.findIndex(a => a.id === normalized.id);
      if (idx !== -1) appointments.value.splice(idx, 1, normalized);
      selectedAppointment.value = appointments.value.find(a => a.id === normalized.id) ?? normalized;
    } else {
      // fallback: re-fetch
      await fetchAppointments();
      selectedAppointment.value = appointments.value.find(a => a.id === id) ?? null;
    }

    closeEditModal();
    alert('Booking updated');
  } catch (err) {
    console.error('submitEdit error', err);
    alert('Network or server error while updating.');
  }
}

// Load user name and appointments on mount
onMounted(() => {
  try {
    const raw = localStorage.getItem('user');
    if (raw) {
      const u = JSON.parse(raw);
      const lastInitial = u.lastName ? u.lastName.charAt(0).toUpperCase() + '.' : '';
      userName.value = `${u.firstName} ${lastInitial}`.trim();
    }
  } catch (e) {
    console.warn('Failed to parse user from localStorage', e);
  }

  // fetch appointments after reading user
  fetchAppointments();
});
</script>

<style scoped>
/* PAGE BACKGROUND (now allows scrolling & growing) */
.page { 
  width: 100%; 
  min-height: 100vh; 
  padding-top: 50px; 
  color: #000; 
  background: url("../assets/bg1.png") no-repeat center center fixed; 
  background-size: cover; 
  display: block; /* IMPORTANT — allows vertical growth */
}

/* MAIN WHITE CONTAINER (grows automatically) */
.container { 
  width: 100%; 
  max-width: 1300px; 
  margin: 0 auto; /* centers it */
  background: rgba(255, 255, 255, 0.95); 
  backdrop-filter: blur(6px); 
  border-radius: 20px; 
  padding: 25px 30px; 
  box-shadow: 0px 10px 30px rgba(0,0,0,0.25);
}

/* TOP BAR */
.top-bar { 
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
  gap: 20px; 
}

.profile { display: flex; align-items: center; gap: 15px; }
.icon { 
  width: 50px; height: 50px; border-radius: 50%; 
  border: 2px solid black; display: flex; justify-content: center; align-items: center; 
  font-size: 23px; 
}

.admin-box { padding: 8px 16px; border: 2px solid black; font-size: 18px; font-weight: bold; }
.title { font-size: 36px; text-align: center; flex-grow: 1; margin-right: 150px; }

/* CONTENT GRID */
.content { 
  margin-top: 30px; 
  display: grid; 
  grid-template-columns: 2.5fr 1fr; 
  gap: 25px; 
  color: black; 
}

/* MAIN PANEL */
.panel { 
  border: 2px solid #cccccc; 
  border-radius: 15px; 
  padding: 20px 25px; 
  background: white; 
  display: flex; 
  flex-direction: column;
}

/* PANEL HEADER */
.panel-header { 
  display: flex; justify-content: space-between; align-items: center; 
  border-bottom: 2px solid #dddddd; padding-bottom: 10px; gap: 10px; 
}
.panel-header h2 { margin: 0; font-size: 24px; color: black; }

/* PANEL BODY */
.panel-body { 
  display: flex; 
  gap: 20px; 
  flex-grow: 1; 
  margin-top: 20px;
}

/* LEFT LIST SECTION (grows with content) */
.list-section { 
  flex: 1; 
  padding-right: 15px; 
  border-right: 1px solid #eee; 
}

.appointment-list { list-style: none; padding: 0; margin: 0; }

.appointment-list li { 
  padding: 12px; border-bottom: 1px solid #eee; cursor: pointer; 
  display: flex; justify-content: space-between; align-items: center; 
}

.appointment-list li:hover { background: #f5f5f5; }

.appointment-list li.active { background: #e0f0ff; border-left: 4px solid #007bff; }

.client-name { font-weight:700; }

/* BADGES */
.status-badge { 
  font-size: 11px; padding: 3px 8px; border-radius: 10px; 
  text-transform: uppercase; font-weight: bold; 
}

.status-badge.pending { background: orange; color: white; }
.status-badge.confirmed { background: green; color: white; }
.status-badge.cancelled { background: #999; color: white; }

.status-text { font-weight: bold; text-transform: uppercase; }
.status-text.pending { color: orange; }
.status-text.confirmed { color: green; }
.status-text.cancelled { color: #666; }

/* BUTTONS */
.actions { display: flex; gap: 10px; }
.btn-light { border: 1px solid #777; background: #fafafa; padding: 6px 18px; border-radius: 20px; cursor: pointer; }
.btn-danger { border: 1px solid red; background: #ffe5e5; color: red; padding: 6px 18px; border-radius: 20px; cursor: pointer; }
.btn-light:disabled, .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

/* RIGHT DETAILS SECTION */
.details-section { flex: 1.5; padding-left: 15px; }

.selected-box { 
  background: #f9f9f9; padding: 20px; border-radius: 10px; border: 1px solid #ddd; 
}

.empty-box { 
  padding: 30px; text-align: center; color: #777; border: 2px dashed #ccc; border-radius: 10px; 
}

/* SIDE MENU BUTTONS */
.side-menu { display: flex; flex-direction: column; gap: 20px; }

.side-btn { 
  width: 100%; padding: 15px 20px; border: 2px solid black; border-radius: 35px; 
  background: white; display: flex; justify-content: space-between; align-items: center; 
  cursor: pointer; 
}

.side-btn:hover { background: #f2f2f2; transform: translateY(-3px); }

/* EDIT MODAL */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}
.modal-card {
  width: 520px;
  max-width: 95%;
  background: white;
  border-radius: 12px;
  padding: 16px 18px;
  box-shadow: 0 18px 50px rgba(2,6,23,0.25);
}
.modal-card h3 { margin-top: 0; }
.form-row { display:flex; flex-direction:column; gap:6px; margin-bottom:10px; }
.form-row.two-cols { display:flex; gap:12px; }
.form-row.two-cols > div { flex:1; display:flex; flex-direction:column; }
.form-row input, .form-row select { padding:8px 10px; border-radius:8px; border:1px solid #ddd; }
.modal-actions { display:flex; justify-content:flex-end; gap:10px; margin-top:10px; }

.value.code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace; font-weight:700; }
</style>
