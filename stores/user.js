import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
  state: () => ({
    token: uni.getStorageSync('token') || '',
    userInfo: uni.getStorageSync('userInfo') || null,
    tokenExpired: uni.getStorageSync('tokenExpired') || null
  }),
  
  getters: {
    isLoggedIn: (state) => {
      // 检查所有必要的登录状态
      if (!state.token || !state.userInfo || !state.tokenExpired) {
        return false;
      }
      
      // 检查 token 是否过期
      const now = new Date().getTime();
      const isValid = state.tokenExpired && now < state.tokenExpired;
      
      // 如果 token 已过期，自动清除登录状态
      if (!isValid) {
        const store = useUserStore();
        store.logout();
        return false;
      }
      
      return true;
    },
    
    userId: (state) => {
      return state.userInfo ? state.userInfo._id || state.userInfo.userId : null;
    }
  },
  
  actions: {
    async validateToken() {
      try {
        if (!this.token) {
          return false;
        }
        
        // 调用云函数验证 token
        const { result } = await uniCloud.callFunction({
          name: 'validateToken',
          data: { token: this.token }
        });
        
        if (result.code !== 200) {
          this.logout();
          return false;
        }
        
        return true;
      } catch (error) {
        console.error('Token 验证失败：', error);
        this.logout();
        return false;
      }
    },
    
    async login(loginData) {
      try {
        console.log('登录数据：', loginData);
        
        // 调用登录云函数
        const loginResult = await uniCloud.callFunction({
          name: 'login',
          data: loginData
        });
        
        console.log('登录结果：', loginResult);
        
        const { code, msg, data } = loginResult.result;
        
        if (code !== 200) {
          throw new Error(msg || '登录失败');
        }
        
        // 保存登录状态
        this.token = data.token;
        this.userInfo = data.userInfo;
        
        // 设置 token 过期时间（默认24小时）
        const expireTime = data.tokenExpired || (Date.now() + 24 * 60 * 60 * 1000);
        this.tokenExpired = expireTime;
        
        // 持久化存储
        uni.setStorageSync('token', data.token);
        uni.setStorageSync('userInfo', data.userInfo);
        uni.setStorageSync('tokenExpired', expireTime);
        
        // 登录成功后跳转到首页
        uni.switchTab({
          url: '/pages/Home/Home'
        });
        
        return data;
      } catch (error) {
        console.error('登录失败：', error);
        // 显示错误提示
        uni.showToast({
          title: error.message || '登录失败',
          icon: 'none',
          duration: 2000
        });
        throw error;
      }
    },

    async register(registerData) {
      try {
        console.log('注册数据：', registerData);
        
        // 调用注册云函数
        const registerResult = await uniCloud.callFunction({
          name: 'register',
          data: registerData
        });
        
        console.log('注册结果：', registerResult);
        
        const { code, msg, data } = registerResult.result;
        
        if (code !== 200) {
          throw new Error(msg || '注册失败');
        }
        
        // 注册成功后自动登录
        await this.login({
          username: registerData.username,
          password: registerData.password
        });
        
        return true;
      } catch (error) {
        console.error('注册失败：', error);
        // 显示错误提示
        uni.showToast({
          title: error.message || '注册失败',
          icon: 'none'
        });
        throw error;
      }
    },
    
    logout() {
      // 清除状态
      this.token = '';
      this.userInfo = null;
      this.tokenExpired = null;
      
      // 清除存储
      uni.removeStorageSync('token');
      uni.removeStorageSync('userInfo');
      uni.removeStorageSync('tokenExpired');
      
      // 跳转到登录页
      uni.reLaunch({
        url: '/pages/Profile/Profile'
      });
    },
    
    // 检查并更新登录状态
    checkLoginStatus() {
      return this.isLoggedIn;
    }
  }
}); 