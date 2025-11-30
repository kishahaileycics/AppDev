<template>
  <div class="summary-root">
    <div class="summary-container">

      <!-- LEFT: Personal info -->
      <div class="left-col">
        <!-- BACK now goes to packagescustomer -->
        <button class="back-link" @click="goBack">‹ Back</button>

        <h2 class="heading">Booking Summary</h2>

        <div class="info-card">
          <div class="row">
            <label>First Name</label>
            <div class="value">{{ draft.firstName || '-' }}</div>
          </div>

          <div class="row">
            <label>Last Name</label>
            <div class="value">{{ draft.lastName || '-' }}</div>
          </div>

          <div class="row two-cols">
            <div>
              <label>Phone Number</label>
              <div class="value">{{ draft.phone || '-' }}</div>
            </div>
            <div>
              <label>Email</label>
              <div class="value">{{ draft.email || '-' }}</div>
            </div>
          </div>

          <div class="row">
            <label>Address</label>
            <div class="value">{{ draft.address || '-' }}</div>
          </div>

          <div class="row two-cols">
            <div>
              <label>Date</label>
              <div class="value">{{ prettyDate(draft.date) }}</div>
            </div>
            <div>
              <label>Time (approx)</label>
              <div class="value">{{ prettyTimeRange(draft.date) }}</div>
            </div>
          </div>

          <div class="actions-row">
            <button class="btn-light" @click="goBack">Edit</button>
            <button class="btn-dark" :disabled="submitting" @click="confirmBooking">
              {{ submitting ? 'Saving...' : 'Confirm & Book' }}
            </button>
          </div>
        </div>
      </div>

      <!-- RIGHT: Package info over background -->
      <div class="right-col">
        <div class="bg-overlay">
          <img class="bg-image" :src="bgImage" alt="bg" />
          <div class="package-card">
            <h3>Package Information</h3>

            <div v-if="draft.selectedPackage" class="pkg-details">
              <h4 class="pkg-name">{{ draft.selectedPackage.name }}</h4>
              <p class="pkg-desc">{{ draft.selectedPackage.description }}</p>
              <div class="pkg-meta">
                <span>Duration: {{ draft.selectedPackage.duration }}</span>
                <span>Price: ₱{{ draft.selectedPackage.price }}</span>
              </div>
            </div>

            <div v-else class="pkg-empty">
              No package selected yet.
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- SUCCESS MODAL -->
    <div v-if="showSuccessModal" class="modal-overlay">
      <div class="modal-card success">
        <h3>Booking Successful ✅</h3>

        <div class="success-body">
          <div class="row small">
            <label>Reference ID</label>
            <div class="value code">{{ bookingResult.referenceID }}</div>
          </div>
          <div class="row small">
            <label>Booking ID</label>
            <div class="value code">{{ bookingResult.bookingID }}</div>
          </div>

          <hr />

          <div class="row small">
            <label>Name</label>
            <div class="value">{{ draft.firstName }} {{ draft.lastName }}</div>
          </div>

          <div class="row small">
            <label>Phone / Email</label>
            <div class="value">{{ draft.phone }} / {{ draft.email }}</div>
          </div>

          <div class="row small">
            <label>Address</label>
            <div class="value">{{ draft.address || '-' }}</div>
          </div>

          <div class="row small">
            <label>Date & Time</label>
            <div class="value">{{ prettyDate(draft.date) }}</div>
          </div>

          <div class="row small" v-if="draft.selectedPackage">
            <label>Package</label>
            <div class="value">
              {{ draft.selectedPackage.name }} — ₱{{ draft.selectedPackage.price }} ({{ draft.selectedPackage.duration }})
            </div>
          </div>

          <!-- Screenshot note -->
          <div class="screenshot-note">
            <strong>Please screenshot this confirmation</strong> — you'll need the Reference ID when checking or changing your booking.
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-light" @click="closeSuccessModal">Done</button>
        </div>
      </div>
    </div>

    <!-- ERROR MODAL -->
    <div v-if="showErrorModal" class="modal-overlay">
      <div class="modal-card">
        <h3>Error</h3>
        <div class="success-body">
          <div class="row small">
            <label>Message</label>
            <div class="value">{{ errorMessage }}</div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-light" @click="closeErrorModal">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const draft = ref({});
const submitting = ref(false);
const bgImage = '/src/assets/bg1.png'; // adjust path if needed

// success modal state
const showSuccessModal = ref(false);
const bookingResult = ref({ bookingID: null, referenceID: null });

// error modal state
const showErrorModal = ref(false);
const errorMessage = ref('');

onMounted(() => {
  const raw = localStorage.getItem('pendingBooking');
  if (!raw) {
    // if no draft, send user to the start (mainbooking)
    router.push('/mainbooking');
    return;
  }
  try {
    draft.value = JSON.parse(raw);
  } catch (e) {
    console.warn('Could not parse pendingBooking', e);
    router.push('/mainbooking');
  }
});

function prettyDate(dt) {
  if (!dt) return '-';
  const iso = String(dt).replace(' ', 'T');
  const d = new Date(iso);
  if (isNaN(d.getTime())) return dt;
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function prettyTimeRange(dt) {
  if (!dt) return '-';
  const iso = String(dt).replace(' ', 'T');
  const d = new Date(iso);
  if (isNaN(d.getTime())) return dt;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function normalizeDatetimeLocal(value) {
  if (!value) return null;
  let v = String(value).replace('T', ' ');
  if (v.length === 16) v = v + ':00';
  return v;
}

async function confirmBooking() {
  if (!draft.value.firstName || !draft.value.lastName || !draft.value.phone || !draft.value.email || !draft.value.date) {
    alert('Missing required fields — please go back and fill them.');
    return;
  }
  if (!draft.value.selectedPackage) {
    alert('Please select a package first.');
    return;
  }

  submitting.value = true;

  const payload = {
    firstName: draft.value.firstName,
    lastName: draft.value.lastName,
    phone: draft.value.phone,
    email: draft.value.email,
    address: draft.value.address || null,
    date: normalizeDatetimeLocal(draft.value.date),
    serviceName: draft.value.selectedPackage.name,
    package_id: draft.value.selectedPackage.id
  };

  try {
    const res = await fetch('http://localhost:3000/api/bookings/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error('Booking creation failed:', res.status, data);
      errorMessage.value = data.message || `Server returned ${res.status}`;
      showErrorModal.value = true;
      submitting.value = false;
      return;
    }

    // success: store response and show modal
    bookingResult.value.bookingID = data.bookingID || null;
    bookingResult.value.referenceID = data.referenceID || data.referenceId || null;

    // remove draft
    localStorage.removeItem('pendingBooking');

    // open success modal
    showSuccessModal.value = true;
  } catch (err) {
    console.error('Network error', err);
    errorMessage.value = 'Network error while creating booking.';
    showErrorModal.value = true;
  } finally {
    submitting.value = false;
  }
}

function closeSuccessModal() {
  showSuccessModal.value = false;
  // redirect to main booking as requested
  router.push('/mainbooking');
}

function goToMainBooking() {
  showSuccessModal.value = false;
  router.push('/mainbooking');
}

function closeErrorModal() {
  showErrorModal.value = false;
}

// **changed**: goBack now returns to the packages selection page
function goBack() {
  router.push('/packagescustomer');
}
</script>

<style scoped>
/* keep styles the same as you used previously */
.summary-root { width:100%; min-height:100vh; display:flex; justify-content:center; align-items:flex-start; padding:30px 16px; background:#fafafa; box-sizing:border-box; }
.summary-container { width:100%; max-width:1200px; display:grid; grid-template-columns:1fr 1fr; gap:28px; align-items:start; }
.left-col { background:white; border-radius:8px; padding:18px 22px; border:1px solid #e6e6e6; box-shadow:0 6px 18px rgba(0,0,0,0.03); position:relative; }
.back-link { background:transparent; border:none; color:#111; font-weight:700; margin-bottom:8px; cursor:pointer; font-size:16px; padding:0; }
.heading { margin:4px 0 14px; font-size:20px; letter-spacing:0.4px; font-weight:700; }
.info-card { display:flex; flex-direction:column; gap:14px; }
.row { display:flex; flex-direction:column; gap:6px; }
.row.small { gap:4px; }
.row.two-cols { display:flex; gap:12px; }
.row.two-cols > div { flex:1; }
label { font-size:12px; text-transform:uppercase; color:#444; letter-spacing:0.6px; }
.value { padding:10px 12px; border-radius:20px; border:1px solid #ddd; background:#fbfbfb; color:#111; min-height:38px; display:flex; align-items:center; }
.value.code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Roboto Mono", "Segoe UI Mono", monospace; letter-spacing:0.6px; }
.actions-row { display:flex; justify-content:flex-end; gap:12px; margin-top:14px; }
.btn-light { padding:10px 18px; border-radius:20px; border:1px solid #777; background:#fff; cursor:pointer; }
.btn-dark { padding:10px 18px; border-radius:20px; border:none; background:#000; color:#fff; cursor:pointer; }
.right-col { position:relative; min-height:480px; display:flex; align-items:center; justify-content:center; }
.bg-overlay { width:100%; height:100%; position:relative; border-radius:12px; overflow:hidden; display:flex; align-items:center; justify-content:center; }
.bg-image { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; filter:blur(1px) grayscale(0.15) brightness(0.35); transform-origin:center; }
.package-card { width:88%; max-width:420px; padding:26px; border-radius:20px; border:2px solid rgba(255,255,255,0.6); backdrop-filter:blur(4px); background:linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02)); color:#fff; position:relative; z-index:2; text-align:center; }
.package-card h3 { margin:0 0 10px; letter-spacing:1px; font-size:20px; color:#fff; }
.pkg-details { color:#fff; text-align:left; margin-top:8px; }
.pkg-name { margin:6px 0; font-size:18px; font-weight:700; color:#fff; }
.pkg-desc { margin:6px 0; color:rgba(255,255,255,0.9); font-size:14px; }
.pkg-meta { display:flex; justify-content:space-between; margin-top:12px; color:rgba(255,255,255,0.9); font-weight:600; }
.pkg-empty { color:rgba(255,255,255,0.9); }

/* modal */
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.45); display:flex; justify-content:center; align-items:center; z-index:60; padding:20px; }
.modal-card { width:520px; max-width:95%; background:white; border-radius:14px; padding:18px; box-shadow:0 18px 50px rgba(2,6,23,0.35); }
.modal-card.success { border:2px solid #0bbf5c; }
.modal-card h3 { margin:0 0 12px; font-size:20px; }
.success-body { display:flex; flex-direction:column; gap:10px; margin-top:8px; }
.screenshot-note { margin-top:8px; padding:10px; border-radius:8px; background:#fff8e6; border:1px solid #f0e0c4; color:#6a4a00; font-weight:600; }
.modal-actions { margin-top:14px; display:flex; justify-content:flex-end; gap:10px; }
@media (max-width:900px) { .summary-container { grid-template-columns:1fr; } .right-col { min-height:320px; } .package-card { width:92%; } }
</style>
