<template>
  <div class="landing-page">
    <div class="nav-links">
      <a class="nav-left">Admin</a>
      <img :src="logo" alt="Logo" class="logo" />
      <a class="nav-right">About</a>
    </div>

    <div class="content">
      <h1 class="title">WELCOME TO SHINE SPOT STUDIO</h1>
      <p class="subtitle">WHERE EVERY MOMENT MATTERS, AND EVERY CLICK TELLS A STORY.</p>
      <button class="login-btn" @click="$router.push('/login')">Login</button>
    </div>
  </div>
</template>

<script setup>

import bg from "../assets/bg1.png"; 
import logo from "../assets/logo-white.png";
</script>

<style scoped>

.landing-page {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  

  background-image: v-bind("'url(' + bg + ')'");
  
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  overflow: hidden;
}


.landing-page::after {
  content: "";
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.55);
  z-index: 1;
}


.nav-links {
  position: absolute;
  top: 30px;
  width: 90%;
  display: flex;
  justify-content: space-between;
  padding: 0 40px;
  z-index: 2;
  align-items: center;
}

.nav-left, .nav-right {
  font-size: 20px;
  color: white;
  font-weight: 500;
  cursor: pointer;
  font-family: 'Poppins', sans-serif; 
  text-transform: uppercase;
}

.logo { height: 100px; filter: brightness(100%); }


.content { z-index: 2; text-align: center; color: white; }

.title {
  font-size: 48px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-family: 'Poppins', sans-serif;
}

.subtitle {
  font-size: 18px;
  margin-top: 10px;
  font-weight: 500;
  letter-spacing: 1px;
  font-family: 'Poppins', sans-serif;
}

.login-btn {
  margin-top: 40px;
  padding: 12px 40px;
  font-size: 18px;
  border-radius: 30px;
  border: 2px solid white;
  background: transparent;
  color: white;
  cursor: pointer;
  transition: 0.3s;
}

.login-btn:hover { background: white; color: black; }
</style>