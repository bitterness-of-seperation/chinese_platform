import { defineStore } from 'pinia';
import { useUserStore } from './user';

export const useWordStatsStore = defineStore('wordStats', {
  state: () => ({
    todayNewWords: 0,
    todayFavoriteWords: 0,
    lastUpdateDate: null,
    remainingWords: 0 // 添加剩余未学习单词数
  }),
  
  getters: {
    getTodayNewWords: (state) => state.todayNewWords,
    getTodayFavoriteWords: (state) => state.todayFavoriteWords,
    getRemainingWords: (state) => state.remainingWords
  },
  
  actions: {
    // 初始化统计数据，检查是否需要重置
    initStats() {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // 首先尝试从本地存储加载
      this.loadStatsFromLocal();
      
      // 如果存储的最后更新日期不是今天，则重置计数
      if (!this.lastUpdateDate || new Date(this.lastUpdateDate).getTime() !== today.getTime()) {
        this.todayNewWords = 0;
        this.todayFavoriteWords = 0;
        this.lastUpdateDate = today;
        
        // 清除旧的本地存储
        try {
          uni.removeStorageSync('today_stats');
        } catch (error) {
          console.error('清除本地统计数据失败:', error);
        }
      }
    },
    
    // 从本地存储加载统计数据
    loadStatsFromLocal() {
      try {
        const localStats = uni.getStorageSync('today_stats');
        if (localStats) {
          const statsDate = new Date(localStats.date);
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          
          // 只有当本地存储的日期是今天时才加载
          if (statsDate && statsDate.getTime() === today.getTime()) {
            this.todayNewWords = localStats.newWords || 0;
            this.todayFavoriteWords = localStats.favoriteWords || 0;
            this.lastUpdateDate = statsDate;
            console.log('从本地存储加载统计数据:', this.todayNewWords, this.todayFavoriteWords);
          }
        }
      } catch (error) {
        console.error('加载本地统计数据失败:', error);
      }
    },
    
    // 增加已学习单词数
    incrementWordsLearned(count = 1) {
      this.initStats(); // 确保日期检查
      this.todayNewWords += count;
      
      // 更新服务器统计数据
      this.updateStatsToServer();
    },
    
    // 更新服务器统计数据
    async updateStatsToServer() {
      // 不再将计数发送到服务器，由updateWordProgress负责统计
      // 只在本地存储计数，以便显示
      console.log('本地统计已更新，今日新学单词数:', this.todayNewWords);
      
      // 可以选择保存到本地存储，以便在页面刷新后仍能看到
      try {
        uni.setStorageSync('today_stats', {
          newWords: this.todayNewWords,
          favoriteWords: this.todayFavoriteWords,
          date: this.lastUpdateDate
        });
      } catch (error) {
        console.error('保存本地统计数据失败:', error);
      }
    },
    
    // 增加今日新学单词数
    addNewWords(count = 5) {
      this.initStats(); // 确保日期检查
      this.todayNewWords += count;
    },
    
    // 增加今日收藏单词数
    addFavoriteWord() {
      this.initStats(); // 确保日期检查
      this.todayFavoriteWords += 1;
    },
    
    // 移除收藏单词
    removeFavoriteWord() {
      this.initStats(); // 确保日期检查
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
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      this.todayNewWords = 0;
      this.todayFavoriteWords = 0;
      this.lastUpdateDate = today;
    },
    
    // 从服务器加载统计数据
    async loadStatsFromServer(userId) {
      if (!userId) return;
      
      try {
        const { result } = await uniCloud.callFunction({
          name: 'getUserStats',
          data: { user_id: userId }
        });
        
        if (result.code === 200) {
          // 只有当服务器返回的日期是今天时才更新
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const serverDate = new Date(result.data.date);
          
          if (serverDate.getTime() === today.getTime()) {
            this.todayNewWords = result.data.new_words_count || 0;
            this.todayFavoriteWords = result.data.favorite_words_count || 0;
            this.lastUpdateDate = today;
          } else {
            // 如果服务器日期不是今天，则重置并保持为0
            this.resetStats();
          }
        }
      } catch (error) {
        console.error('加载统计数据失败:', error);
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