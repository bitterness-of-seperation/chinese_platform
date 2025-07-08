<template>
  <view class="profile-container">
    <OrganicBackground :color="'#4ade80'" :opacity="0.2" :animationSpeed="15"></OrganicBackground>
    
    <!-- 未登录状态 -->
    <view v-if="!userStore.isLoggedIn" class="login-section glass-effect">
      <view class="login-header">
        <text class="title">登录/注册</text>
      </view>
      
      <view class="form-group">
        <input
          v-model="formData.username"
          class="input"
          type="text"
          placeholder="用户名"
          @input="validateForm"
        />
      </view>
      
      <view class="form-group">
        <input
          v-model="formData.password"
          class="input"
          type="password"
          placeholder="密码"
          @input="validateForm"
        />
      </view>
      
      <view v-if="isRegistering" class="form-group">
        <input
          v-model="formData.nickname"
          class="input"
          type="text"
          placeholder="昵称（选填）"
        />
      </view>
      
      <view class="form-group">
        <button
          class="submit-btn"
          :disabled="!isFormValid"
          @click="handleSubmit"
        >
          {{ isRegistering ? '注册' : '登录' }}
        </button>
      </view>
      
      <view class="switch-mode" @click="toggleMode">
        {{ isRegistering ? '已有账号？点击登录' : '没有账号？点击注册' }}
      </view>
    </view>
    
    <!-- 已登录状态 -->
    <view v-else class="profile-section glass-effect">
      <view class="user-info">
        <image class="avatar" :src="userStore.userInfo?.avatar || '/static/default-avatar.png'" mode="aspectFill" />
        <view class="user-details">
          <text class="nickname">{{ userStore.userInfo?.nickname }}</text>
          <text class="username">@{{ userStore.userInfo?.username }}</text>
        </view>
      </view>
      
      <view class="stats-section">
        <view class="stat-item">
          <text class="stat-value">{{ userStore.userInfo?.learned_words || 0 }}</text>
          <text class="stat-label">已学单词</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ userStore.userInfo?.streak_days || 0 }}</text>
          <text class="stat-label">连续打卡</text>
        </view>
        <view class="stat-item">
          <text class="stat-value">{{ userStore.userInfo?.points || 0 }}</text>
          <text class="stat-label">积分</text>
        </view>
      </view>
      
      <view class="menu-section">
        <view class="menu-item" @click="handleSettings">
          <uni-icons type="gear" size="24" />
          <text>设置</text>
        </view>
        <view class="menu-item" @click="handleFeedback">
          <uni-icons type="chat" size="24" />
          <text>反馈</text>
        </view>
        <view class="menu-item" @click="handleAbout">
          <uni-icons type="info" size="24" />
          <text>关于</text>
        </view>
      </view>
      
      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useUserStore } from '@/stores/user';
import OrganicBackground from '@/components/OrganicBackground.vue';

const userStore = useUserStore();
const isRegistering = ref(false);
const isFormValid = ref(false);

const formData = reactive({
  username: '',
  password: '',
  nickname: ''
});

const validateForm = () => {
  isFormValid.value = formData.username.length >= 3 && formData.password.length >= 6;
};

const toggleMode = () => {
  isRegistering.value = !isRegistering.value;
  formData.nickname = '';
  validateForm();
};

const handleSubmit = async () => {
  if (!isFormValid.value) return;
  
  try {
    if (isRegistering.value) {
      await userStore.register({
        username: formData.username,
        password: formData.password,
        nickname: formData.nickname
      });
      uni.showToast({
        title: '注册成功',
        icon: 'success'
      });
    } else {
      await userStore.login({
        username: formData.username,
        password: formData.password
      });
      uni.showToast({
        title: '登录成功',
        icon: 'success'
      });
    }
    
    // 重置表单
    formData.username = '';
    formData.password = '';
    formData.nickname = '';
  } catch (error) {
    uni.showToast({
      title: error.message || '操作失败',
      icon: 'error'
    });
  }
};

const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.logout();
        uni.showToast({
          title: '已退出登录',
          icon: 'success'
        });
      }
    }
  });
};

const handleSettings = () => {
  uni.showToast({
    title: '功能开发中',
    icon: 'none'
  });
};

const handleFeedback = () => {
  uni.showToast({
    title: '功能开发中',
    icon: 'none'
  });
};

const handleAbout = () => {
  uni.showToast({
    title: '功能开发中',
    icon: 'none'
  });
};
</script>

<style lang="scss" scoped>
.profile-container {
  min-height: 100vh;
  padding: 32rpx;
  box-sizing: border-box;
  position: relative;
}

.glass-effect {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 2;
}

.login-section {
  margin-top: 20vh;
  
  .login-header {
    text-align: center;
    margin-bottom: 48rpx;
    
    .title {
      font-size: 48rpx;
      font-weight: bold;
      color: var(--text-primary);
    }
  }
  
  .form-group {
    margin-bottom: 24rpx;
    
    .input {
      width: 100%;
      height: 88rpx;
      border: 2rpx solid #e2e8f0;
      border-radius: 16rpx;
      padding: 0 32rpx;
      font-size: 32rpx;
      background: rgba(255, 255, 255, 0.5);
      
      &:focus {
        border-color: #10b981;
      }
    }
  }
  
  .submit-btn {
    width: 100%;
    height: 88rpx;
    background: #10b981;
    color: white;
    border-radius: 16rpx;
    font-size: 32rpx;
    font-weight: bold;
    margin-top: 32rpx;
    
    &:disabled {
      background: #9ca3af;
    }
  }
  
  .switch-mode {
    text-align: center;
    margin-top: 32rpx;
    color: #10b981;
    font-size: 28rpx;
  }
}

.profile-section {
  margin-top: 128rpx;
  
  .user-info {
    display: flex;
    align-items: center;
    margin-bottom: 48rpx;
    
    .avatar {
      width: 128rpx;
      height: 128rpx;
      border-radius: 50%;
      margin-right: 24rpx;
    }
    
    .user-details {
      .nickname {
        font-size: 40rpx;
        font-weight: bold;
        color: var(--text-primary);
        margin-bottom: 8rpx;
      }
      
      .username {
        font-size: 28rpx;
        color: var(--text-secondary);
      }
    }
  }
  
  .stats-section {
    display: flex;
    justify-content: space-around;
    margin-bottom: 48rpx;
    
    .stat-item {
      text-align: center;
      
      .stat-value {
        font-size: 48rpx;
        font-weight: bold;
        color: #10b981;
        margin-bottom: 8rpx;
      }
      
      .stat-label {
        font-size: 24rpx;
        color: var(--text-secondary);
      }
    }
  }
  
  .menu-section {
    margin-bottom: 48rpx;
    
    .menu-item {
      display: flex;
      align-items: center;
      padding: 32rpx 0;
      border-bottom: 2rpx solid #e2e8f0;
      
      uni-icons {
        margin-right: 24rpx;
        color: #64748b;
      }
      
      text {
        font-size: 32rpx;
        color: var(--text-primary);
      }
    }
  }
  
  .logout-btn {
    width: 100%;
    height: 88rpx;
    background: #ef4444;
    color: white;
    border-radius: 16rpx;
    font-size: 32rpx;
    font-weight: bold;
  }
}
</style> 