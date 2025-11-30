<template>
  <div class="booking-page">
    <div class="form-container">
      <h2 class="title">
        {{ selectedService ? 'BOOKING: ' + selectedService : 'PERSONAL INFORMATION' }}
      </h2>

      <form class="form-grid" @submit.prevent="submitBooking">
        <div class="row">
          <div class="input-box">
            <label>First Name</label>
            <input type="text" v-model="form.firstName" required />
          </div>

          <div class="input-box">
            <label>Last Name</label>
            <input type="text" v-model="form.lastName" required />
          </div>
        </div>

        <div class="row">
          <div class="input-box">
            <label>Phone Number</label>
            <input type="text" v-model="form.phone" required />
          </div>

          <div class="input-box">
            <label>Email</label>
            <input type="email" v-model="form.email" required />
          </div>
        </div>

        <div class="row-full">
          <div class="input-box">
            <label>Address</label>
            <input type="text" v-model="form.address" placeholder="Barangay, City, Province" />
          </div>
        </div>

        <div class="row-full">
          <div class="input-box">
            <label>Preferred Date & Time</label>
            <input type="datetime-local" v-model="form.date" required />
          </div>
        </div>

        <div class="button-wrapper">
          <button class="next-btn" type="submit">Next</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const selectedService = ref('');

// optionally prefill service from query ?service=...
onMounted(() => {
  if (route.query.service) selectedService.value = route.query.service;
  // also load an existing draft to prefill fields if present
  const raw = localStorage.getItem('pendingBooking');
  if (raw) {
    try {
      const d = JSON.parse(raw);
      // only copy personal fields to form if they exist
      if (d.firstName) form.firstName = d.firstName;
      if (d.lastName) form.lastName = d.lastName;
      if (d.phone) form.phone = d.phone;
      if (d.email) form.email = d.email;
      if (d.address) form.address = d.address;
      if (d.date) form.date = d.date;
    } catch (e) { /* ignore parse errors */ }
  }
});

const form = reactive({
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  address: '',
  date: ''
});

// Save draft to localStorage and go to package selection
const submitBooking = () => {
  // basic front-end validation (HTML `required` already covers)
  if (!form.firstName || !form.lastName || !form.phone || !form.email || !form.date) {
    alert('Please fill required fields.');
    return;
  }

  const draft = {
    firstName: form.firstName,
    lastName: form.lastName,
    phone: form.phone,
    email: form.email,
    address: form.address || '',
    date: form.date, // keep raw datetime-local string (YYYY-MM-DDTHH:MM)
    // keep service if preselected or null
    serviceName: selectedService.value || null,
    selectedPackage: null // will be filled on package selection
  };

  localStorage.setItem('pendingBooking', JSON.stringify(draft));

  // navigate to packages page
  router.push('/packagescustomer');
};
</script>

<style scoped>
/* keep styles you had — unchanged */
.booking-page {
  width: 100%;
  min-height: 100vh;
  background: url('../assets/bg1.png') center/cover no-repeat;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: "Poppins", sans-serif;
}

.form-container {
  width: 80%;
  max-width: 900px;
  background: white;
  padding: 40px 50px;
  border: 2px solid #ccc;
  border-radius: 5px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.2);
}

.title {
  text-align:center;
  font-weight:700;
  font-size:20px;
  margin-bottom:30px;
  letter-spacing:1px;
  text-transform:uppercase;
}

.form-grid { width:100%; }

.row {
  display:flex;
  gap:20px;
  margin-bottom:20px;
}

.row .input-box input {
  width: 85%; /* 🔥 shortened textboxes */
}

.row-full { margin-bottom:20px; }

.input-box {
  display:flex;
  flex-direction:column;
  flex:1;
}

label {
  font-size:12px;
  text-transform:uppercase;
  margin-bottom:6px;
  font-weight:600;
}

input {
  padding:10px 14px;
  border:2px solid #bbb;
  border-radius:20px;
  background:#e9e9e9;
}

input:focus {
  background:white;
  border-color:black;
}

.button-wrapper {
  text-align:right;
  margin-top:10px;
}

.next-btn {
  background:black;
  color:white;
  border:none;
  padding:12px 35px;
  border-radius:20px;
  font-size:14px;
  cursor:pointer;
  font-weight:600;
}

.next-btn:hover {
  opacity:0.85;
}

</style>
