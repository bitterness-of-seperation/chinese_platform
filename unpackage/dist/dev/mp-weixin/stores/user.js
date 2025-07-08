"use strict";
const common_vendor = require("../common/vendor.js");
const useUserStore = common_vendor.defineStore("user", {
  state: () => ({
    token: common_vendor.index.getStorageSync("token") || "",
    userInfo: common_vendor.index.getStorageSync("userInfo") || null,
    tokenExpired: common_vendor.index.getStorageSync("tokenExpired") || null
  }),
  getters: {
    isLoggedIn: (state) => {
      if (!state.token || !state.userInfo || !state.tokenExpired) {
        return false;
      }
      const now = (/* @__PURE__ */ new Date()).getTime();
      const isValid = state.tokenExpired && now < state.tokenExpired;
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
        const { result } = await common_vendor.Zs.callFunction({
          name: "validateToken",
          data: { token: this.token }
        });
        if (result.code !== 200) {
          this.logout();
          return false;
        }
        return true;
      } catch (error) {
        console.error("Token 验证失败：", error);
        this.logout();
        return false;
      }
    },
    async login(loginData) {
      try {
        console.log("登录数据：", loginData);
        const loginResult = await common_vendor.Zs.callFunction({
          name: "login",
          data: loginData
        });
        console.log("登录结果：", loginResult);
        const { code, msg, data } = loginResult.result;
        if (code !== 200) {
          throw new Error(msg || "登录失败");
        }
        this.token = data.token;
        this.userInfo = data.userInfo;
        const expireTime = data.tokenExpired || Date.now() + 24 * 60 * 60 * 1e3;
        this.tokenExpired = expireTime;
        common_vendor.index.setStorageSync("token", data.token);
        common_vendor.index.setStorageSync("userInfo", data.userInfo);
        common_vendor.index.setStorageSync("tokenExpired", expireTime);
        common_vendor.index.switchTab({
          url: "/pages/Home/Home"
        });
        return data;
      } catch (error) {
        console.error("登录失败：", error);
        common_vendor.index.showToast({
          title: error.message || "登录失败",
          icon: "none",
          duration: 2e3
        });
        throw error;
      }
    },
    async register(registerData) {
      try {
        console.log("注册数据：", registerData);
        const registerResult = await common_vendor.Zs.callFunction({
          name: "register",
          data: registerData
        });
        console.log("注册结果：", registerResult);
        const { code, msg, data } = registerResult.result;
        if (code !== 200) {
          throw new Error(msg || "注册失败");
        }
        await this.login({
          username: registerData.username,
          password: registerData.password
        });
        return true;
      } catch (error) {
        console.error("注册失败：", error);
        common_vendor.index.showToast({
          title: error.message || "注册失败",
          icon: "none"
        });
        throw error;
      }
    },
    logout() {
      this.token = "";
      this.userInfo = null;
      this.tokenExpired = null;
      common_vendor.index.removeStorageSync("token");
      common_vendor.index.removeStorageSync("userInfo");
      common_vendor.index.removeStorageSync("tokenExpired");
      common_vendor.index.reLaunch({
        url: "/pages/Profile/Profile"
      });
    },
    // 检查并更新登录状态
    checkLoginStatus() {
      return this.isLoggedIn;
    }
  }
});
exports.useUserStore = useUserStore;
