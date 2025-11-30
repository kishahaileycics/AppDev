<template>
  <div class="login-container">
    <div class="left-section">
      <img src="../assets/logo-white.png" alt="Logo" class="big-logo" />

      <h1 class="welcome-title">WELCOME BACK!</h1>

      <p class="description">
        The General Appointment System that provides you with full control over
        studio operations. Designed with efficiency in mind to ensure that
        every client experience stays seamless.
      </p>
    </div>

    <div class="right-section">
      <h2 class="login-title">User Login</h2>
      <p class="login-subtitle">Enter your Details</p>

      <form class="login-form" @submit.prevent="handleLogin">
        <label>Email</label>
        <input type="email" v-model="email" placeholder="Enter your email" required />

        <label>Password</label>
        <input type="password" v-model="password" placeholder="Enter your password" required />

        <a class="forgot-password">Forgot Password?</a>

        <button class="login-btn">LOGIN</button>

        <div class="divider">OR</div>

        <button type="button" class="signup-btn" @click="$router.push('/signup')">SIGN UP</button>
      </form>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      email: "",
      password: ""
    };
  },

  methods: {
  async handleLogin() {
    try {
      const response = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: this.email, password: this.password })
      });

      const data = await response.json();

      if (response.ok) {
        // store user object for other pages
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        alert("✅ Login Successful!");
        this.$router.push('/dashboard');
      } else {
        alert("❌ " + data.message);
      }
    } catch (error) {
      console.error(error);
      alert("❌ Server error. Is the backend running?");
    }
  }
}
};
</script>


<style scoped>
.login-container { display: flex; width: 100vw; height: 100vh; font-family: "Poppins", sans-serif; }


.left-section {
  width: 100%; padding: 60px; color: white;
  
  background-image: url("../assets/bg1.png"); 
  background-size: cover; background-position: center; position: relative;
  display: flex; flex-direction: column; align-items: center; text-align: center;
}
.left-section::after { content: ""; position: absolute; inset: 0; background: rgba(0, 0, 0, 0.6); }
.left-section * { position: relative; z-index: 2; }

.big-logo { width: 150px; margin-bottom: 30px; }
.welcome-title { font-size: 65px; font-weight: 800; margin-bottom: 20px; text-align: center; }
.description { width: 90%; font-size: 25px; line-height: 1.7; margin-top: 10px; text-align: justify; }


.right-section { width: 50%; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 40px 80px; }
.login-title{ font-size: 30px; margin-bottom: 0px; }
.login-subtitle{ font-size: 14px; margin-top: 0px; }
.login-form { display: flex; flex-direction: column; align-items: center; width: 100%; max-width: 350px; }

.login-form input, .login-btn, .signup-btn { width: 100%; box-sizing: border-box; padding: 10px 6px; border-radius: 50px; }
.login-form label { margin-top: 15px; margin-bottom: 5px; align-self: flex-start; }
.forgot-password { margin-top: 5px; align-self: flex-end; font-size: 13px; cursor: pointer; }

.login-btn, .signup-btn { padding: 12px; border-radius: 30px; cursor: pointer; }
.login-btn { margin-top: 25px; margin-bottom: 25px; border: none; background: black; color: white; font-size: 16px; }
.signup-btn { margin-top: 25px; border: 2px solid black; background: white; color: black; font-size: 16px; }

.divider { display: flex; align-items: center; text-align: center; width: 100%; font-size: 14px; margin: 25px 0; color: black; }
.divider::before, .divider::after { content: ""; flex: 1; height: 1px; background-color: black; margin: 0 10px; }
</style>