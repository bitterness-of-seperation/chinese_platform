<template>
  <view class="blank-view-container">
    <OrganicBackground :color="'#4ade80'" :opacity="0.2" :animationSpeed="15"></OrganicBackground>
    
    <!-- Profile 页面 -->
    <template v-if="pageType === 'profile'">
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
    </template>

    <!-- 其他页面类型的占位内容 -->
    <template v-else>
      <view class="construction-notice">
        <view class="icon">🚧</view>
        <h2>功能开发中</h2>
        <button class="back-button" @click="navigateToHome">返回主页</button>
      </view>
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import OrganicBackground from '../../components/OrganicBackground.vue';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const pageType = ref('profile'); // 默认显示 profile
const isRegistering = ref(false);
const isFormValid = ref(false);

const formData = reactive({
  username: '',
  password: '',
  nickname: ''
});

onMounted(() => {
  // 获取页面参数
  const pages = getCurrentPages();
  const page = pages[pages.length - 1];
  // @ts-ignore
  const type = page.$page?.options?.type;
  if (type) {
    pageType.value = type;
  }
  
  // 如果已登录且在登录页面，跳转到首页
  if (userStore.isLoggedIn && pageType.value === 'profile' && !page.$page?.options?.force) {
    uni.reLaunch({
      url: '/pages/Home/Home'
    });
  }
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
  uni.navigateTo({ url: '/pages/Settings/Settings' });
};

const handleFeedback = () => {
  uni.navigateTo({ url: '/pages/Feedback/Feedback' });
};

const handleAbout = () => {
  uni.navigateTo({ url: '/pages/About/About' });
};

const navigateToHome = () => {
  uni.navigateTo({
    url: '/pages/Home/Home'
  });
};
</script>

<style lang="scss" scoped>
.blank-view-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  padding: 32rpx;
}

/* 登录部分样式 */
.login-section {
  width: 100%;
  max-width: 600rpx;
  padding: 48rpx;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 32rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(20rpx);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.form-group {
  width: 100%;
  margin-bottom: 20px;
}

.input {
  width: 100%;
  height: 45px;
  padding: 0 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.9);
}

.submit-btn {
  width: 100%;
  height: 45px;
  background: #10b981;
  color: white;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  
  &[disabled] {
    background: #ccc;
    cursor: not-allowed;
  }
}

.switch-mode {
  text-align: center;
  margin-top: 15px;
  color: #10b981;
  font-size: 14px;
}

/* 个人资料部分样式 */
.profile-section {
  width: 100%;
  max-width: 600rpx;
  padding: 48rpx;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 32rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(20rpx);
}

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 32rpx;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  margin-right: 24rpx;
}

.user-details {
  flex: 1;
}

.nickname {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 8rpx;
  display: block;
}

.username {
  font-size: 28rpx;
  color: #666;
  display: block;
}

.stats-section {
  display: flex;
  justify-content: space-around;
  margin: 32rpx 0;
  padding: 24rpx 0;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 36rpx;
  font-weight: bold;
  color: #10b981;
  display: block;
}

.stat-label {
  font-size: 24rpx;
  color: #666;
  margin-top: 8rpx;
  display: block;
}

.menu-section {
  margin: 32rpx 0;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  
  &:last-child {
    border-bottom: none;
  }
  
  text {
    margin-left: 16rpx;
    font-size: 28rpx;
    color: #333;
  }
}

.logout-btn {
  width: 100%;
  height: 45px;
  background: #ef4444;
  color: white;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  margin-top: 32rpx;
}

/* 开发中页面样式 */
.construction-notice {
  text-align: center;
  background: rgba(255, 255, 255, 0.9);
  padding: 60rpx;
  border-radius: 24rpx;
  box-shadow: 0 16rpx 60rpx rgba(0, 0, 0, 0.1);
  max-width: 800rpx;
  animation: fadeIn 0.6s ease-out;
}

.icon {
  font-size: 80rpx;
  margin-bottom: 20rpx;
  animation: bounce 2s infinite;
}

h2 {
  color: #555;
  margin-bottom: 20rpx;
  font-weight: 500;
}

.back-button {
  display: inline-block;
  padding: 15rpx 40rpx;
  background: #10b981;
  color: white;
  text-decoration: none;
  border-radius: 12rpx;
  font-weight: 500;
  transition: all 0.3s ease;
  
  &:active {
    background: #059669;
    transform: translateY(-4rpx);
    box-shadow: 0 8rpx 24rpx rgba(16, 185, 129, 0.3);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(40rpx);
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
    transform: translateY(-20rpx);
  }
}

.glass-effect {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20rpx);
}
</style> 