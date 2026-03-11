<script setup lang="ts">
// 空白页面组件 - 作为其他功能页面的占位符
import OrganicBackground from '../components/OrganicBackground.vue';
</script>

<template>
  <div class="blank-view-container">
    <div class="construction-notice">
      <OrganicBackground />
      <div class="icon">🚧</div>
      <h2>功能开发中</h2>
      <router-link to="/" class="back-button">返回主页</router-link>
    </div>
  </div>
</template>

<style scoped>
.blank-view-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: radial-gradient(circle at center, rgba(240, 240, 240, 0.6) 0%, rgba(220, 220, 220, 0.3) 100%);
}

.construction-notice {
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  padding: 3rem;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  animation: fadeIn 0.6s ease-out;
}

.icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: bounce 2s infinite;
}

h2 {
  color: #555;
  margin-bottom: 1rem;
  font-weight: 500;
}

p {
  color: #777;
  margin-bottom: 2rem;
}

.back-button {
  display: inline-block;
  padding: 0.75rem 2rem;
  background: #689F38;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.back-button:hover {
  background: #558B2F;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(104, 159, 56, 0.3);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
</style> 