<script setup lang="ts">
// 有机形状背景组件
defineProps({
  color: {
    type: String,
    default: '#31C48D'
  },
  opacity: {
    type: Number,
    default: 0.3
  },
  animationSpeed: {
    type: Number,
    default: 20
  }
});
</script>

<template>
  <div class="organic-background">
    <div class="shape shape-1" :style="{ 
      backgroundColor: `${color}4d`, 
      animationDuration: `${animationSpeed + 5}s` 
    }"></div>
    <div class="shape shape-2" :style="{ 
      backgroundColor: `${color}33`, 
      animationDuration: `${animationSpeed}s` 
    }"></div>
    <div class="shape shape-3" :style="{ 
      backgroundColor: `${color}26`, 
      animationDuration: `${animationSpeed + 10}s` 
    }"></div>
    <div class="shape shape-4" :style="{ 
      backgroundColor: `${color}1a`, 
      animationDuration: `${animationSpeed + 15}s` 
    }"></div>
  </div>
</template>

<style scoped>
.organic-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: -1;
}

.shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(40px);
  animation: float infinite ease-in-out alternate;
}

.shape-1 {
  width: 400px;
  height: 400px;
  top: -200px;
  right: -100px;
}

.shape-2 {
  width: 300px;
  height: 300px;
  top: 100px;
  left: -150px;
}

.shape-3 {
  width: 350px;
  height: 350px;
  bottom: -120px;
  right: 50px;
}

.shape-4 {
  width: 250px;
  height: 250px;
  bottom: 50px;
  left: 100px;
}

@keyframes float {
  0% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(20px, 20px);
  }
  100% {
    transform: translate(-20px, -20px);
  }
}
</style> 