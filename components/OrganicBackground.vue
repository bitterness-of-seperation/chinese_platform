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
  <view class="organic-background">
    <view class="shape shape-1" :style="{ 
      backgroundColor: `${color}4d`, 
      animationDuration: `${animationSpeed + 5}s` 
    }"></view>
    <view class="shape shape-2" :style="{ 
      backgroundColor: `${color}33`, 
      animationDuration: `${animationSpeed}s` 
    }"></view>
    <view class="shape shape-3" :style="{ 
      backgroundColor: `${color}26`, 
      animationDuration: `${animationSpeed + 10}s` 
    }"></view>
    <view class="shape shape-4" :style="{ 
      backgroundColor: `${color}1a`, 
      animationDuration: `${animationSpeed + 15}s` 
    }"></view>
  </view>
</template>

<style scoped lang="scss">
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
  filter: blur(80rpx); /* 40px -> 80rpx */
  animation: float infinite ease-in-out alternate;
}

.shape-1 {
  width: 800rpx; /* 400px -> 800rpx */
  height: 800rpx; /* 400px -> 800rpx */
  top: -400rpx; /* -200px -> -400rpx */
  right: -200rpx; /* -100px -> -200rpx */
}

.shape-2 {
  width: 600rpx; /* 300px -> 600rpx */
  height: 600rpx; /* 300px -> 600rpx */
  top: 200rpx; /* 100px -> 200rpx */
  left: -300rpx; /* -150px -> -300rpx */
}

.shape-3 {
  width: 700rpx; /* 350px -> 700rpx */
  height: 700rpx; /* 350px -> 700rpx */
  bottom: -240rpx; /* -120px -> -240rpx */
  right: 100rpx; /* 50px -> 100rpx */
}

.shape-4 {
  width: 500rpx; /* 250px -> 500rpx */
  height: 500rpx; /* 250px -> 500rpx */
  bottom: 100rpx; /* 50px -> 100rpx */
  left: 200rpx; /* 100px -> 200rpx */
}

@keyframes float {
  0% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(40rpx, 40rpx); /* 20px -> 40rpx */
  }
  100% {
    transform: translate(-40rpx, -40rpx); /* -20px -> -40rpx */
  }
}
</style> 