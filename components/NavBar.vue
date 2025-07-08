<template>
  <view class="nav-bar">
    <view class="nav-bar-content">
    <uni-icons class="nav-icon" :type="iconMap.Back" size="24" color="#67C23A" @click="goBack"></uni-icons>
    <text class="page-title">{{ title }}</text>
    <view class="placeholder-space"></view>
    </view>
    <view class="nav-placeholder"></view>
  </view>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string;
}>();

const iconMap = {
  Back: 'back'
};

const goBack = () => {
  uni.navigateBack({
    delta: 1,
    fail: () => {
      uni.switchTab({ url: '/pages/Home/Home' });
    }
  });
};
</script>

<style lang="scss" scoped>
.nav-bar {
  width: 100%;
  z-index: 100;
}

.nav-bar-content {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  padding: 24rpx 32rpx;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20rpx);
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.05);
  border-radius: 0 0 32rpx 32rpx;
  box-sizing: border-box;
  padding-top: var(--status-bar-height, 40rpx);
}

.nav-placeholder {
  height: calc(88rpx + var(--status-bar-height, 40rpx));
  width: 100%;
}
  
  .page-title {
    flex: 1;
    margin: 0;
    text-align: center;
    font-size: 36rpx;
    font-weight: 600;
  }
  
  .placeholder-space {
    width: 64rpx;
}

.nav-icon {
  font-size: 50rpx;
  padding: 16rpx;
  border-radius: 50%;
  transition: all 0.3s;
  color: var(--ep-color-success, #67C23A);
}
</style> 