"use strict";
const common_vendor = require("../common/vendor.js");
require("./user.js");
const useWordStatsStore = common_vendor.defineStore("wordStats", {
  state: () => ({
    todayNewWords: 0,
    todayFavoriteWords: 0,
    lastUpdateDate: null,
    remainingWords: 0
    // 添加剩余未学习单词数
  }),
  getters: {
    getTodayNewWords: (state) => state.todayNewWords,
    getTodayFavoriteWords: (state) => state.todayFavoriteWords,
    getRemainingWords: (state) => state.remainingWords
  },
  actions: {
    // 初始化统计数据，检查是否需要重置
    initStats() {
      const now = /* @__PURE__ */ new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      this.loadStatsFromLocal();
      if (!this.lastUpdateDate || new Date(this.lastUpdateDate).getTime() !== today.getTime()) {
        this.todayNewWords = 0;
        this.todayFavoriteWords = 0;
        this.lastUpdateDate = today;
        try {
          common_vendor.index.removeStorageSync("today_stats");
        } catch (error) {
          console.error("清除本地统计数据失败:", error);
        }
      }
    },
    // 从本地存储加载统计数据
    loadStatsFromLocal() {
      try {
        const localStats = common_vendor.index.getStorageSync("today_stats");
        if (localStats) {
          const statsDate = new Date(localStats.date);
          const now = /* @__PURE__ */ new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          if (statsDate && statsDate.getTime() === today.getTime()) {
            this.todayNewWords = localStats.newWords || 0;
            this.todayFavoriteWords = localStats.favoriteWords || 0;
            this.lastUpdateDate = statsDate;
            console.log("从本地存储加载统计数据:", this.todayNewWords, this.todayFavoriteWords);
          }
        }
      } catch (error) {
        console.error("加载本地统计数据失败:", error);
      }
    },
    // 增加已学习单词数
    incrementWordsLearned(count = 1) {
      this.initStats();
      this.todayNewWords += count;
      this.updateStatsToServer();
    },
    // 更新服务器统计数据
    async updateStatsToServer() {
      console.log("本地统计已更新，今日新学单词数:", this.todayNewWords);
      try {
        common_vendor.index.setStorageSync("today_stats", {
          newWords: this.todayNewWords,
          favoriteWords: this.todayFavoriteWords,
          date: this.lastUpdateDate
        });
      } catch (error) {
        console.error("保存本地统计数据失败:", error);
      }
    },
    // 增加今日新学单词数
    addNewWords(count = 5) {
      this.initStats();
      this.todayNewWords += count;
    },
    // 增加今日收藏单词数
    addFavoriteWord() {
      this.initStats();
      this.todayFavoriteWords += 1;
    },
    // 移除收藏单词
    removeFavoriteWord() {
      this.initStats();
      if (this.todayFavoriteWords > 0) {
        this.todayFavoriteWords -= 1;
      }
    },
    // 设置收藏状态（增加或减少）
    setFavoriteStatus(isFavorite) {
      if (isFavorite) {
        this.addFavoriteWord();
      } else {
        this.removeFavoriteWord();
      }
    },
    // 重置统计数据
    resetStats() {
      const now = /* @__PURE__ */ new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      this.todayNewWords = 0;
      this.todayFavoriteWords = 0;
      this.lastUpdateDate = today;
    },
    // 从服务器加载统计数据
    async loadStatsFromServer(userId) {
      if (!userId)
        return;
      try {
        const { result } = await common_vendor.Zs.callFunction({
          name: "getUserStats",
          data: { user_id: userId }
        });
        if (result.code === 200) {
          const now = /* @__PURE__ */ new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const serverDate = new Date(result.data.date);
          if (serverDate.getTime() === today.getTime()) {
            this.todayNewWords = result.data.new_words_count || 0;
            this.todayFavoriteWords = result.data.favorite_words_count || 0;
            this.lastUpdateDate = today;
          } else {
            this.resetStats();
          }
        }
      } catch (error) {
        console.error("加载统计数据失败:", error);
      }
    },
    // 设置剩余未学习单词数
    setRemainingWords(count) {
      this.remainingWords = count;
    },
    // 减少剩余未学习单词数
    decreaseRemainingWords() {
      if (this.remainingWords > 0) {
        this.remainingWords--;
      }
    }
  }
});
exports.useWordStatsStore = useWordStatsStore;
