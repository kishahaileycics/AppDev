<template>
  <div class="summary-root">
    <div class="summary-container">

      <!-- LEFT COLUMN -->
      <div class="left-col">
        <button class="back-link" @click="goBack">‹ Back</button>

        <h2 class="heading">Booking Summary</h2>

        <div class="info-card">
          <div class="row">
            <label>First Name</label>
            <div class="value">{{ draft.firstName || "-" }}</div>
          </div>

          <div class="row">
            <label>Last Name</label>
            <div class="value">{{ draft.lastName || "-" }}</div>
          </div>

          <div class="row">
            <label>Phone Number</label>
            <div class="value">{{ draft.phone || "-" }}</div>
          </div>

          <div class="row">
            <label>Email</label>
            <div class="value">{{ draft.email || "-" }}</div>
          </div>

          <div class="row">
            <label>Address</label>
            <div class="value">{{ draft.address || "-" }}</div>
          </div>

          <div class="row">
            <label>Date</label>
            <div class="value">{{ prettyDate(draft.date) }}</div>
          </div>

          <div class="row">
            <label>Time (approx)</label>
            <div class="value">{{ prettyTimeRange(draft.date) }}</div>
          </div>

          <div class="actions-row">
            <button class="btn-light" @click="goBack">Edit</button>
            <button class="btn-dark" :disabled="submitting" @click="confirmBooking">
              {{ submitting ? "Saving..." : "Confirm & Book" }}
            </button>
          </div>
        </div>
      </div>

      <!-- RIGHT COLUMN — IMPROVED PACKAGE INFO -->
      <div class="right-col">
        <div class="package-card" :class="{ 'is-empty': !draft.selectedPackage }">

          <!-- HEADER -->
          <div class="pkg-header">
            <div class="pkg-title-block">
              <p class="pkg-label">Selected Package</p>

              <h3 class="pkg-title">
                {{ draft.selectedPackage ? draft.selectedPackage.name : "No package selected" }}
              </h3>
            </div>

            <!-- PRICE PILL -->
            <div v-if="draft.selectedPackage" class="pkg-price-pill">
              <span class="currency">₱</span>
              <span class="amount">{{ draft.selectedPackage.price }}</span>
            </div>
          </div>

          <!-- DESCRIPTION -->
          <p v-if="draft.selectedPackage?.description" class="pkg-desc">
            {{ draft.selectedPackage.description }}
          </p>

          <!-- META INFO -->
          <div v-if="draft.selectedPackage" class="pkg-meta-grid">
            <div class="meta-item">
              <span class="meta-label">Duration</span>
              <span class="meta-value">{{ draft.selectedPackage.duration }}</span>
            </div>

            <div class="meta-item">
              <span class="meta-label">Date</span>
              <span class="meta-value">{{ prettyDate(draft.date) }}</span>
            </div>

            <div class="meta-item">
              <span class="meta-label">Time</span>
              <span class="meta-value">{{ prettyTimeRange(draft.date) }}</span>
            </div>
          </div>

          <!-- EMPTY STATE -->
          <div v-else class="pkg-empty">
            No package selected yet. Choose a package to see its details.
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
            <div class="value">{{ draft.address }}</div>
          </div>

          <div class="row small">
            <label>Date & Time</label>
            <div class="value">{{ prettyDate(draft.date) }}</div>
          </div>

          <div class="row small">
            <label>Package</label>
            <div class="value">
              {{ draft.selectedPackage.name }} — ₱{{ draft.selectedPackage.price }}
            </div>
          </div>

          <div class="screenshot-note">
            <strong>Please screenshot this confirmation</strong> — you'll need your Reference ID.
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
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const draft = ref({});
const submitting = ref(false);

const showSuccessModal = ref(false);
const bookingResult = ref({ bookingID: null, referenceID: null });
const showErrorModal = ref(false);
const errorMessage = ref("");

// Load pending booking
onMounted(() => {
  const raw = localStorage.getItem("pendingBooking");
  if (!raw) {
    router.push("/mainbooking");
    return;
  }

  try {
    draft.value = JSON.parse(raw);
  } catch (e) {
    console.warn("Failed to parse booking draft", e);
    router.push("/mainbooking");
  }
});

function prettyDate(dt) {
  if (!dt) return "-";
  const iso = String(dt).replace(" ", "T");
  const d = new Date(iso);
  if (isNaN(d.getTime())) return dt;
  return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function prettyTimeRange(dt) {
  if (!dt) return "-";
  const iso = String(dt).replace(" ", "T");
  const d = new Date(iso);
  if (isNaN(d.getTime())) return dt;
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function normalizeDatetimeLocal(value) {
  if (!value) return null;
  let v = String(value).replace("T", " ");
  if (v.length === 16) v += ":00";
  return v;
}

async function confirmBooking() {
  if (!draft.value.firstName || !draft.value.lastName || !draft.value.phone || !draft.value.email || !draft.value.date) {
    alert("Missing required fields.");
    return;
  }
  if (!draft.value.selectedPackage) {
    alert("Please select a package first.");
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
    package_id: draft.value.selectedPackage.id,
  };

  try {
    const res = await fetch("http://localhost:3000/api/bookings/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      errorMessage.value = data.message || `Error ${res.status}`;
      showErrorModal.value = true;
      submitting.value = false;
      return;
    }

    bookingResult.value.bookingID = data.bookingID || null;
    bookingResult.value.referenceID = data.referenceID || data.referenceId || null;

    localStorage.removeItem("pendingBooking");

    showSuccessModal.value = true;
  } catch (err) {
    console.error("Network error", err);
    errorMessage.value = "Network error while saving booking.";
    showErrorModal.value = true;
  } finally {
    submitting.value = false;
  }
}

function closeSuccessModal() {
  showSuccessModal.value = false;
  router.push("/mainbooking");
}

function closeErrorModal() {
  showErrorModal.value = false;
}

function goBack() {
  router.push("/packagescustomer");
}
</script>

<style scoped>
/* =====================================================
   FULL PAGE BACKGROUND
===================================================== */
.summary-root {
  width: 100%;
  min-height: 100vh;
  padding: 32px 24px;
  display: flex;
  justify-content: center;
  align-items: flex-start;

  background-image: url("/src/assets/bg1.png");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;

  position: relative;
}

.summary-root::before {
  content: "";
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
  z-index: -1;
}

/* =====================================================
   GRID LAYOUT
===================================================== */
.summary-container {
  width: 100%;
  max-width: 1200px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px;
}

/* =====================================================
   LEFT COLUMN
===================================================== */
.left-col {
  background: #ffffff;
  border-radius: 14px;
  padding: 20px 24px;
  border: 1px solid #e6e6e6;
}

.heading {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 16px;
}

.value {
  padding: 10px 14px;
  border-radius: 18px;
  border: 1px solid #ddd;
  background: #fafafa;
}

.actions-row {
  margin-top: 16px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-dark {
  padding: 10px 24px;
  border-radius: 20px;
  background: black;
  color: white;
}

.btn-light {
  padding: 10px 24px;
  border-radius: 20px;
  border: 1px solid #777;
  background: white;
}

/* =====================================================
   RIGHT COLUMN — Glassy Package Info
===================================================== */
.right-col {
  display: flex;
  align-items: center;
  justify-content: center;
}

.package-card {
  width: 100%;
  max-width: 430px;
  padding: 24px 22px;
  border-radius: 24px;

  background: radial-gradient(circle at top left, rgba(255,255,255,0.15), rgba(0,0,0,0.75));
  border: 1px solid rgba(255,255,255,0.35);
  box-shadow: 0 18px 40px rgba(0,0,0,0.55);
  backdrop-filter: blur(10px);

  color: #f5f5f5;
}

/* Header row */
.pkg-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.pkg-label {
  font-size: 11px;
  opacity: 0.85;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.pkg-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

/* Price pill */
.pkg-price-pill {
  padding: 8px 14px;
  background: rgba(0,0,0,0.45);
  border: 1px solid rgba(255,255,255,0.35);
  border-radius: 999px;
  display: inline-flex;
  align-items: baseline;
  gap: 3px;
  font-weight: 700;
  box-shadow: 0 10px 25px rgba(0,0,0,0.45);
}

.pkg-desc {
  margin: 8px 0 14px;
  font-size: 14px;
}

/* Meta info grid */
.pkg-meta-grid {
  margin-top: 10px;
  padding-top: 12px;
  border-top: 1px solid rgba(255,255,255,0.28);
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.meta-label {
  font-size: 11px;
  text-transform: uppercase;
  opacity: 0.8;
}

.meta-value {
  font-size: 14px;
  font-weight: 600;
}

/* Empty package card */
.pkg-empty {
  padding: 18px 14px;
  border-radius: 18px;
  border: 1px dashed rgba(255,255,255,0.45);
  text-align: center;
  color: #fff;
}

/* =====================================================
   MODALS
===================================================== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.modal-card {
  background: white;
  border-radius: 14px;
  padding: 20px;
  width: 500px;
}

.screenshot-note {
  background: #fff8e6;
  padding: 10px;
  border-radius: 8px;
  margin-top: 10px;
}

.back-link {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  font-weight: 700;
  margin-bottom: 8px;
}
</style>
