<template>
  <div class="page">
    <div class="container">
      <div class="top-bar">
        <!-- BACK button: goes to /mainbooking -->
        <button class="back-link" @click="goBackToBooking">‹ Back</button>
        <h1 class="title">Packages</h1>
      </div>

      <div v-if="!hasDraft" class="no-draft">
        <p>No booking draft found. Please start with the personal info page first.</p>
        <div style="margin-top:12px;">
          <button @click="$router.push('/mainbooking')" class="btn-light">Start Booking</button>
        </div>
      </div>

      <div v-else>
        <!-- Selected big package (centered) -->
        <div v-if="selectedPackage" class="selected-banner-wrapper">
          <div class="selected-banner">
            <div class="banner-left">
              <h2 class="banner-title">{{ selectedPackage.name }}</h2>
              <p class="banner-desc">{{ selectedPackage.description }}</p>
              <div class="banner-meta">
                <span>Duration: {{ selectedPackage.duration }}</span>
                <span>Price: ₱{{ selectedPackage.price }}</span>
              </div>
            </div>
            <div class="banner-actions">
              <button class="deselect-btn" @click="clearSelection()">Deselect</button>
              <button class="choose-btn" @click="confirmSelect()">Choose & Continue</button>
            </div>
          </div>
        </div>

        <!-- PACKAGES GRID -->
        <div class="blocks">
          <div v-if="loading" class="no-packages">Loading packages…</div>
          <div v-else-if="!packages.length" class="no-packages">No packages available.</div>

          <div v-else class="grid">
            <div v-for="pkg in packages" :key="pkg.id" class="block">
              <div class="block-content">
                <h3 class="pkg-name">{{ pkg.name }}</h3>
                <p class="pkg-desc">{{ pkg.description }}</p>
                <div class="meta">
                  <span>Duration: {{ pkg.duration }}</span>
                  <span>Price: ₱{{ pkg.price }}</span>
                </div>
                <div class="meta small">Last updated: {{ pkg.updated_at || '-' }}</div>
              </div>

              <div class="block-actions">
                <button class="select-btn" @click="selectPackage(pkg)">
                  Select this package
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- modal kept for details -->
      <div v-if="showModal" class="modal-overlay">
        <div class="modal-card">
          <h3 class="modal-title">Package details</h3>
          <div class="field"><strong>Name:</strong> {{ form.name }}</div>
          <div class="field"><strong>Description:</strong> {{ form.description }}</div>
          <div class="field"><strong>Duration:</strong> {{ form.duration }}</div>
          <div class="field"><strong>Price:</strong> ₱{{ form.price }}</div>
          <div class="modal-actions">
            <button class="btn-light" @click="closeModal">Close</button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();

const packages = ref([]);
const loading = ref(false);
const showModal = ref(false);
const form = ref({ id: null, name: '', description: '', duration: '', price: '' });
const selectedPackage = ref(null);
const hasDraft = ref(false);
let draft = null;

const apiBase = "http://localhost:3000/api/packages";

onMounted(async () => {
  const raw = localStorage.getItem('pendingBooking');
  if (!raw) {
    hasDraft.value = false;
  } else {
    try {
      draft = JSON.parse(raw);
      hasDraft.value = true;
    } catch (e) {
      hasDraft.value = false;
    }
  }
  await fetchPackages();
});

async function fetchPackages() {
  loading.value = true;
  try {
    const res = await fetch(apiBase);
    if (!res.ok) {
      const txt = await res.text();
      console.error('fetchPackages failed:', res.status, txt);
      packages.value = [];
      return;
    }
    const data = await res.json();
    packages.value = Array.isArray(data) ? data.map(p => ({
      id: p.package_id,
      name: p.name,
      description: p.description,
      duration: p.duration_hour,
      price: (p.price !== null && p.price !== undefined) ? parseFloat(p.price).toFixed(2) : "0.00",
      created_at: p.created_at,
      updated_at: p.updated_at
    })) : [];
  } catch (err) {
    console.error('fetchPackages exception:', err);
    packages.value = [];
  } finally {
    loading.value = false;
  }
}

function selectPackage(pkg) {
  selectedPackage.value = pkg;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function confirmSelect() {
  if (!hasDraft.value) {
    alert('No booking draft found. Please start at the personal info page.');
    router.push('/mainbooking');   // <-- changed
    return;
  }
  const raw = localStorage.getItem('pendingBooking');
  if (!raw) { router.push('/mainbooking'); return; } // <-- changed
  try {
    const d = JSON.parse(raw);
    d.selectedPackage = {
      id: selectedPackage.value.id,
      name: selectedPackage.value.name,
      description: selectedPackage.value.description,
      duration: selectedPackage.value.duration,
      price: selectedPackage.value.price
    };
    localStorage.setItem('pendingBooking', JSON.stringify(d));
    router.push('/summarybooking');
  } catch (e) {
    console.error('Failed to attach package to draft:', e);
    alert('An error occurred. Please try again.');
  }
}

function clearSelection() { selectedPackage.value = null; }
function closeModal() { showModal.value = false; }

// **new**: go back to the main booking page
function goBackToBooking() {
  router.push('/mainbooking');
}
</script>

<style scoped>
/* reuse your styles, unchanged except small additions */
.page { width:100vw; min-height:100vh; display:block; padding-top:40px; background:url("/src/assets/bg1.png") no-repeat center center fixed; background-size:cover; color:#000; }
.container { width:90%; max-width:1300px; margin:0 auto; background:rgba(255,255,255,0.95); border-radius:20px; padding:25px 30px; box-shadow:0 10px 30px rgba(0,0,0,0.25); box-sizing:border-box; }

/* top bar adjusted for back button + centered title */
.top-bar { display:flex; align-items:center; margin-bottom:16px; gap:12px; }
.back-link { background:transparent; border:none; color:#111; font-weight:700; cursor:pointer; font-size:16px; padding:0; }
.title { font-size:36px; margin:0; color:black; flex:1; text-align:center; }

/* ensure back button doesn't push title off center on small screens */
@media (max-width:540px) {
  .title { font-size:24px; }
}

/* rest unchanged */
.selected-banner-wrapper { display:flex; justify-content:center; margin-bottom:22px; }
.selected-banner { width:min(100%,900px); background:linear-gradient(180deg,#ffffff,#fbfbfb); border:2px solid #e0e0e0; border-radius:14px; padding:18px 22px; display:flex; align-items:center; gap:18px; box-shadow:0 6px 18px rgba(0,0,0,0.06); }
.banner-left { flex:1; }
.banner-title { margin:0 0 6px 0; font-size:22px; }
.banner-desc { margin:0 0 10px 0; color:#444; }
.banner-meta { display:flex; gap:12px; color:#555; font-size:14px; }
.banner-actions { display:flex; gap:10px; align-items:center; }
.deselect-btn { padding:8px 16px; border-radius:18px; border:1px solid #777; background:#fafafa; cursor:pointer; }
.choose-btn { padding:8px 16px; border-radius:18px; border:none; background:black; color:white; cursor:pointer; }

/* grid blocks */
.blocks { margin-top:10px; }
.grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:18px; margin-top:10px; }
.block { background:white; border:1px solid #ddd; border-radius:10px; padding:16px; display:flex; flex-direction:column; justify-content:space-between; min-height:160px; }
.block-content { margin-bottom:10px; }
.pkg-name { margin:0 0 6px 0; font-size:18px; }
.pkg-desc { margin:0 0 10px 0; color:#444; font-size:14px; }
.meta { display:flex; justify-content:space-between; font-size:13px; color:#555; }
.meta.small { font-size:12px; color:#777; margin-top:8px; }

/* button */
.block-actions { display:flex; justify-content:center; margin-top:12px; }
.select-btn { width:80%; padding:12px 20px; font-size:16px; font-weight:600; border-radius:25px; border:none; background:black; color:white; cursor:pointer; transition:0.2s; }
.select-btn:hover { transform:translateY(-3px); background:#222; }
.no-packages { padding:30px; color:#666; text-align:center; }

/* modal */
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.35); display:flex; justify-content:center; align-items:center; z-index:50; }
.modal-card { width:380px; max-width:95%; background:white; border-radius:18px; padding:20px 22px; box-shadow:0 10px 25px rgba(0,0,0,0.3); }
.modal-actions { margin-top:12px; display:flex; justify-content:flex-end; gap:10px; }
.btn-light, .btn-dark { padding:6px 14px; border-radius:20px; cursor:pointer; }
.btn-light { border:1px solid #777; background:#fafafa; }
.btn-dark { border:1px solid black; background:black; color:white; }
.no-draft { padding:18px; background:#fffaf0; border-radius:8px; border:1px solid #f0e6d6; color:#333; }
</style>
