<template>
  <view class="login-container">
    <view class="login-box">
      <image class="logo" src="/static/logo.png" mode="aspectFit"></image>
      <text class="title">智言汉语</text>
      
      <view class="input-group">
        <input 
          class="input" 
          type="text" 
          v-model="username" 
          placeholder="请输入用户名"
          @input="clearError"
        />
      </view>
      
      <view class="input-group">
        <input 
          class="input" 
          type="password" 
          v-model="password" 
          placeholder="请输入密码"
          @input="clearError"
        />
      </view>
      
      <text v-if="errorMessage" class="error-message">{{errorMessage}}</text>
      
      <button class="login-btn" @click="handleLogin" :loading="loading">登录</button>
      
      <view class="actions">
        <text class="action-link" @click="goToRegister">注册账号</text>
        <text class="action-link" @click="goToResetPassword">忘记密码？</text>
      </view>
    </view>
  </view>
</template>

<script>
import { useUserStore } from '../../stores/user';
import { mapActions } from 'pinia';

export default {
  data() {
    return {
      username: '',
      password: '',
      errorMessage: '',
      loading: false
    }
  },
  methods: {
    ...mapActions(useUserStore, ['login']),
    
    clearError() {
      this.errorMessage = '';
    },
    
    async handleLogin() {
      if (!this.username || !this.password) {
        this.errorMessage = '请输入用户名和密码';
        return;
      }
      
      this.loading = true;
      try {
        await this.login({
          username: this.username,
          password: this.password
        });
        
        // 登录成功后跳转到首页
        uni.switchTab({
          url: '/pages/Home/Home'
        });
      } catch (error) {
        this.errorMessage = error.message || '登录失败，请重试';
      } finally {
        this.loading = false;
      }
    },
    
    goToRegister() {
      uni.navigateTo({
        url: '/pages/register/register'
      });
    },
    
    goToResetPassword() {
      uni.navigateTo({
        url: '/pages/reset-password/reset-password'
      });
    }
  }
}
</script>

<style lang="scss">
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  padding: 20px;
  
  .login-box {
    width: 100%;
    max-width: 400px;
    background-color: #fff;
    border-radius: 12px;
    padding: 30px 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .logo {
      width: 80px;
      height: 80px;
      margin-bottom: 16px;
    }
    
    .title {
      font-size: 24px;
      font-weight: bold;
      color: #333;
      margin-bottom: 30px;
    }
    
    .input-group {
      width: 100%;
      margin-bottom: 16px;
      
      .input {
        width: 100%;
        height: 44px;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 0 16px;
        font-size: 16px;
        
        &:focus {
          border-color: #007AFF;
        }
      }
    }
    
    .error-message {
      color: #ff4d4f;
      font-size: 14px;
      margin-bottom: 16px;
    }
    
    .login-btn {
      width: 100%;
      height: 44px;
      background-color: #007AFF;
      color: #fff;
      border-radius: 8px;
      font-size: 16px;
      margin-bottom: 20px;
      
      &:active {
        opacity: 0.8;
      }
    }
    
    .actions {
      width: 100%;
      display: flex;
      justify-content: space-between;
      
      .action-link {
        color: #007AFF;
        font-size: 14px;
        
        &:active {
          opacity: 0.8;
        }
      }
    }
  }
}
</style> 