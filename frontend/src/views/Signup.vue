<template>
  <div class="signup-page">
    <div class="signup-card">

      <div class="header-top">
        <img src="../assets/logo-black.png" class="logo" alt="Logo" />
        <div class="header-text">
          <h1 class="title">Sign Up</h1>
          <p class="subtitle">Sign up to continue</p>
        </div>
      </div>

      <form @submit.prevent="submitForm" class="form">

        <div class="field">
          <label>FIRST NAME</label>
          <input type="text" v-model="firstName" />
        </div>

        <div class="field">
          <label>LAST NAME</label>
          <input type="text" v-model="lastName" />
        </div>

        <div class="field">
          <label>PHONE NUMBER</label>
          <input type="text" v-model="phone" />
        </div>

        <div class="field">
          <label>EMAIL</label>
          <input type="email" v-model="email" />
        </div>

        <div class="field">
          <label>PASSWORD</label>
          <div class="password-wrapper">
            <input
              :type="showPassword ? 'text' : 'password'"
              v-model="password"
              class="password-input"
            />
            <button type="button" class="toggle-btn" @click="showPassword = !showPassword">
              {{ showPassword ? 'Hide' : 'Show' }}
            </button>
          </div>
        </div>

        <div class="field">
          <label>RE-ENTER PASSWORD</label>
          <div class="password-wrapper">
            <input
              :type="showPassword2 ? 'text' : 'password'"
              v-model="confirmPassword"
              class="password-input"
            />
            <button type="button" class="toggle-btn" @click="showPassword2 = !showPassword2">
               {{ showPassword2 ? 'Hide' : 'Show' }}
            </button>
          </div>
        </div>

        <button type="submit" class="signup-btn">Sign Up</button>
      </form>

      <p class="login-text">
        Already have an account?
        <router-link to="/login" class="login-link">Log in</router-link>
      </p>

    </div>
  </div>
</template>

<script>
export default {
  name: "SignUp",
  data() {
    return {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      password: "",
      confirmPassword: "",
      showPassword: false,
      showPassword2: false
    };
  },
  methods: {
    async submitForm() {
    
      if (!this.firstName || !this.lastName || !this.phone || !this.email || !this.password) {
        alert("All fields are required.");
        return;
      }
      if (this.password !== this.confirmPassword) {
        alert("Passwords do not match.");
        return;
      }

    
      try {
        const response = await fetch("http://localhost:3000/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: this.firstName,
            lastName: this.lastName,
            phone: this.phone,
            email: this.email,
            password: this.password,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          alert("✅ User registered successfully!");
          this.$router.push('/login'); 
        } else {
          alert("❌ Error: " + data.message);
        }
      } catch (error) {
        console.error("Error:", error);
        alert("❌ Failed to connect to server. Is the backend running?");
      }
    }
  }
};
</script>

<style scoped>
.signup-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;

  background: url("../assets/bg1.png") no-repeat center center fixed;
  background-size: cover;
  font-family: "Poppins", sans-serif;
}

.signup-card {
  width: 430px;
  background: rgba(255, 255, 255, 0.9);
  padding: 40px;
  border-radius: 14px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
}

.header-top { display: flex; align-items: center; gap: 15px; margin-bottom: 25px; }
.logo { width: 90px; margin-left: 20px; }
.header-text { text-align: left; }
.title { font-family: Georgia, serif; font-size: 55px; font-weight: 500; margin: 0; color: #000; }
.subtitle { font-size: 14px; margin-top: 5px; color: #000; }

.field { margin-bottom: 20px; color: #000; }
.field label { font-size: 12px; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 6px; display: block; }
.field input, .password-input { box-sizing: border-box; width: 100%; padding: 12px 18px; border-radius: 22px; border: 1px solid #444; background: rgba(255, 255, 255, 0.9); font-size: 14px; outline: none; color: #000; }
.password-wrapper { position: relative; }
.toggle-btn { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 12px; color: #555; }

.signup-btn { width: 100%; padding: 14px; border-radius: 26px; border: none; background: black; color: white; font-size: 16px; font-weight: 600; cursor: pointer; margin-top: 10px; }
.signup-btn:hover { opacity: 0.9; }
.login-text { margin-top: 22px; font-size: 13px; color: #000; text-align: center; }
.login-link { color: #1a73e8; text-decoration: underline; cursor: pointer; }
</style>