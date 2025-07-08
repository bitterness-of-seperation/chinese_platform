<template>
  <view class="dictionary-container">
    <!-- 背景层 -->
    <OrganicBackground :color="'#67C23A'" :opacity="0.1"></OrganicBackground>
    
    <!-- 顶部导航栏  -->
    <view class="nav-bar">
      <uni-icons class="nav-icon" :type="iconMap.Back" size="24" color="#67C23A" @click="goBack"></uni-icons>
      <text class="page-title">Dictionary</text>
      <view class="placeholder-space"></view>
    </view>
    
    <!-- 搜索区域 -->
    <scroll-view scroll-y="true" class="search-container">
      <!-- 词书选择和搜索框 -->
      <view v-if="!selectedWord">
        <picker 
          @change="selectDictionary"
          :value="dictionaries.findIndex(d => d.id === selectedDictionary)"
          :range="dictionaries"
          range-key="name"
          class="dictionary-select"
        >
          <view class="picker-content">
            <text class="dictionary-name">{{ dictionaries.find(d => d.id === selectedDictionary)?.name }}</text>
            <view class="arrow-wrapper">
              <uni-icons type="bottom" size="24" color="#909399"></uni-icons>
            </view>
          </view>
        </picker>
        
        <view class="search-input-wrapper">
          <input
            v-model="searchInput"
            placeholder="输入要查询的词语..."
            class="search-input"
            confirm-type="search"
            @confirm="handleSearch"
          />
          <uni-icons class="search-icon" :type="iconMap.Search" size="20" color="#909399"></uni-icons>
          <button @click="handleSearch" class="search-button">搜索</button>
        </view>
        
        <!-- 历史记录和热搜 -->
        <view class="search-helpers">
          <view class="search-history" v-if="searchHistory.length > 0">
            <text class="section-title">搜索历史</text>
            <view class="search-tags">
              <view
                v-for="item in searchHistory"
                :key="item.word"
                class="history-tag"
                @click="selectWord(item.word)"
              >{{ item.word }}</view>
            </view>
          </view>
          
          <view class="hot-words" v-if="hotWords.length > 0">
            <text class="section-title">热词搜索</text>
            <view class="hot-words-list">
              <view 
                v-for="(item, index) in hotWords" 
                :key="item.word"
                class="hot-word-item"
                @click="selectWord(item.word)"
              >
                <text class="hot-word-rank" :class="{'top-rank': index < 3}">{{ index + 1 }}</text>
                <text class="hot-word-text">{{ item.word }}</text>
                <text class="hot-word-count">{{ formatCount(item.count) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 词语详情展示 -->
      <view v-else-if="selectedWord && wordDetails[selectedWord]" class="word-details">
        <view class="close-button" @click="backToSearch">
          <uni-icons :type="iconMap.Close" size="20" color="#909399"></uni-icons>
        </view>
        
        <!-- 词语标题区 -->
        <view class="word-header">
          <view class="word-title-area">
            <text class="word-title">{{ wordDetails[selectedWord].word }}</text>
            <text class="word-pinyin" v-if="wordDetails[selectedWord].pinyin">{{ wordDetails[selectedWord].pinyin }}</text>
          </view>
          <view class="word-actions">
            <button class="action-button" @click="playPronunciation" v-if="wordDetails[selectedWord].pinyin">
              <uni-icons :type="iconMap.Headset" size="20"></uni-icons>
            </button>
          </view>
        </view>

        <!-- 基本意义 -->
        <view class="section meaning-section" v-if="wordDetails[selectedWord].basic_meaning">
          <text class="section-title">{{ wordDetails[selectedWord].basic_meaning.title }}</text>
          <text class="section-content">{{ wordDetails[selectedWord].basic_meaning.content }}</text>
          <text class="section-english" v-if="wordDetails[selectedWord].basic_meaning.english">
            {{ wordDetails[selectedWord].basic_meaning.english }}
          </text>
        </view>

        <!-- 核心用法 -->
        <view class="section usage-section" v-if="wordDetails[selectedWord].core_usage?.patterns?.length > 0">
          <text class="section-title">{{ wordDetails[selectedWord].core_usage.title }}</text>
          <view 
            v-for="(pattern, index) in wordDetails[selectedWord].core_usage.patterns" 
            :key="index"
            class="usage-pattern"
          >
            <text class="pattern-title">{{ pattern.title }}</text>
            <text class="pattern-structure" v-if="pattern.structure">{{ pattern.structure }}</text>
            <view class="feature-list" v-if="pattern.features?.length > 0">
              <text 
                v-for="(feature, featureIndex) in pattern.features" 
                :key="featureIndex" 
                class="feature-item"
              >{{ feature }}</text>
            </view>
            <view class="example-list" v-if="pattern.examples?.length > 0">
              <view 
                v-for="(example, exampleIndex) in pattern.examples" 
                :key="exampleIndex"
                class="example-item"
              >
                <uni-icons :type="iconMap.ChatLineRound" size="16" color="#67C23A"></uni-icons>
                <text>{{ example }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 常见偏误 -->
        <view class="section mistakes-section" v-if="wordDetails[selectedWord].common_mistakes?.items?.length > 0">
          <text class="section-title">{{ wordDetails[selectedWord].common_mistakes.title }}</text>
          <view class="mistake-list">
            <view 
              v-for="(item, index) in wordDetails[selectedWord].common_mistakes.items"
              :key="index"
              class="mistake-item"
            >
              <text class="mistake-type">{{ item.type }}</text>
              <view class="mistake-content">
                <text class="wrong">{{ item.wrong }}</text>
                <text class="correct">{{ item.correct }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 加载状态 -->
      <view class="loading-overlay" v-if="isLoading">
        <uni-load-more status="loading" :content-text="loadingText"></uni-load-more>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import OrganicBackground from '../../components/OrganicBackground.vue';
import zhipuai from '../../api/zhipuai';

// 声明 uni 全局变量
declare const uni: any;

// 类型定义
interface WordDetail {
  word: string;
  pinyin: string;
  basic_meaning: {
    title: string;
    content: string;
    english: string;
  };
  core_usage: {
    title: string;
    patterns: {
      title: string;
      structure: string;
      features: string[];
      examples: string[];
    }[];
  };
  common_mistakes: {
    title: string;
    items: {
      type: string;
      wrong: string;
      correct: string;
    }[];
  };
}

interface Dictionary {
  id: string;
  name: string;
  description: string;
}

interface SearchHistoryItem {
  word: string;
  word_id?: string;
  search_date: number;
  search_count?: number;
}

// 获取用户ID
const userInfo = uni.getStorageSync('userInfo') || {};
const userId = userInfo._id || null;

// 状态管理
const searchInput = ref('');
const selectedWord = ref('');
const selectedDictionary = ref('1934900239169458176');
const isLoading = ref(false);
const loadingText = reactive({
  contentrefresh: "加载中...",
  contentnomore: "没有更多了",
  contentdown: "上拉显示更多"
});

// 搜索历史记录
const searchHistory = ref([]);

// 词书数据
const dictionaries = reactive<Dictionary[]>([
  {
    id: '1934900239169458176',
    name: '现代汉语语法研究教程（第4版）',
    description: '现代汉语语法研究教程第四版教材'
  },
  {
    id: '1934532306580746240',
    name: '现代汉语八百词（修订版）',
    description: '现代汉语八百词修订版教材'
  }
]);

// 热搜词汇
const hotWords = ref([]);

// 词典详情数据
const wordDetails = reactive({});

// 初始化数据
const initData = async () => {
  try {
    // 加载全局热词（无论用户是否登录）
    try {
      const { result } = await uniCloud.callFunction({
        name: 'getHotWords',
        data: { limit: 10 }
      });
      
      if (result && result.code === 200) {
        hotWords.value = result.data;
      }
    } catch (hotWordsError) {
      console.error('获取热词失败:', hotWordsError);
    }
    
    // 如果用户已登录，获取其搜索历史
    if (userId) {
      try {
        // 获取最近搜索历史（按时间排序）
        const { result: historyResult } = await uniCloud.callFunction({
          name: 'getUserSearchHistory',
          data: { 
            user_id: userId,
            limit: 10,
            sort_by: 'date'
          }
        });
        
        if (historyResult && historyResult.code === 200) {
          searchHistory.value = historyResult.data;
        }
      } catch (historyError) {
        console.error('获取搜索历史失败:', historyError);
      }
    } else {
      // 未登录时使用全局搜索历史
      const historyResult = await uniCloud.callFunction({
        name: 'getSearchHistory',
        data: { limit: 5 }
      });
      
      if (historyResult.result && historyResult.result.code === 200) {
        searchHistory.value = historyResult.result.data;
      }
    }
  } catch (error) {
    console.error('初始化数据失败:', error);
    uni.showToast({
      title: '加载数据失败，请稍后重试',
      icon: 'none',
      duration: 3000
    });
  }
};

// 页面加载时初始化数据
onMounted(() => {
  initData();
});

// 返回上一页
const goBack = () => {
  uni.navigateBack({
    delta: 1,
    fail: () => {
      uni.switchTab({ url: '/pages/Home/Home' });
    }
  });
};

// 搜索词语
const handleSearch = async () => {
  const word = searchInput.value.trim();
  console.log('开始搜索词语:', word);
  
  if (!word) {
    console.log('搜索词为空，退出搜索');
    return;
  }
  
  isLoading.value = true;
  
  try {
    // 调用搜索云函数
    const { result } = await uniCloud.callFunction({
      name: 'searchWord',
      data: { 
        word,
        user_id: userId
      }
    });
    
    console.log('搜索结果:', result);
    
    if (result.code !== 200) {
      uni.showToast({
        title: result.message,
        icon: 'none',
        duration: 3000
      });
      return;
    }
    
    // 更新词典数据
    wordDetails[word] = result.data;
    selectedWord.value = word;
    
    // 刷新搜索历史
    await initData();
    
  } catch (error) {
    console.error('查询失败:', error);
    uni.showToast({
      title: '查询失败，请稍后重试',
      icon: 'none',
      duration: 3000
    });
  } finally {
    isLoading.value = false;
    searchInput.value = '';
  }
};

// 从历史记录中选择词
const selectWord = async (word: string) => {
  if (typeof word !== 'string') {
    console.error('Invalid word type:', word);
    return;
  }
  searchInput.value = word;
  await handleSearch();
};

// 切换词典
const selectDictionary = (e: any) => {
  const index = parseInt(e.detail.value);
  if (!isNaN(index) && index >= 0 && index < dictionaries.length) {
    selectedDictionary.value = dictionaries[index].id;
  }
};

// 播放发音
const playPronunciation = () => {
  if (!selectedWord.value) return;
  
  // 尝试创建一个语音合成示例
  try {
    const innerAudioContext = uni.createInnerAudioContext();
    
    // 使用百度语音合成API（示例）
    // 实际使用需要替换为可用的API或本地音频
    const text = selectedWord.value;
    const pinyin = wordDetails[selectedWord.value]?.pinyin || '';

    // 临时方案：使用浏览器内置的语音合成
    if ('speechSynthesis' in window) {
      const speech = new SpeechSynthesisUtterance(text);
      speech.lang = 'zh-CN';
      speech.rate = 0.8;
      window.speechSynthesis.speak(speech);
    } else {
      uni.showToast({
        title: '当前环境不支持语音功能',
        icon: 'none',
        duration: 2000
      });
    }
  } catch (error) {
    console.error('播放发音失败:', error);
    uni.showToast({
      title: '播放失败，请稍后重试',
      icon: 'none',
      duration: 2000
    });
  }
};

// 返回搜索
const backToSearch = () => {
  selectedWord.value = '';
};

// 格式化搜索次数
const formatCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return `${count}`;
};

const iconMap = {
  Back: 'back',
  Search: 'search',
  ChatLineRound: 'chatbubble',
  Headset: 'sound',
  Close: 'closeempty',
  ArrowDown: 'bottom'
};
</script>

<style lang="scss" scoped>
.dictionary-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: relative;
  max-width: 1600rpx;
  margin: 0 auto;
  box-sizing: border-box;
  overflow: hidden;
}

.nav-bar {
  display: flex;
  align-items: center;
  padding: 24rpx 32rpx;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20rpx);
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.05);
  z-index: 100;
  border-radius: 0 0 32rpx 32rpx;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding-top: var(--status-bar-height, 40rpx);
  
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
}

.nav-icon {
  font-size: 50rpx;
  padding: 16rpx;
  border-radius: 50%;
  transition: all 0.3s;
  color: var(--ep-color-success, #67C23A);
}

.search-container {
  flex: 1;
  padding: 32rpx;
  box-sizing: border-box;
  margin-top: calc(88rpx + var(--status-bar-height, 40rpx)); /* 导航栏高度 + 状态栏高度 */
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

.dictionary-select {
  width: 100%;
  margin-bottom: 24rpx;
  
  .picker-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20rpx 24rpx;
    border: 1px solid #EBEEF5;
    border-radius: 16rpx;
    background-color: white;
    
    .arrow-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48rpx;
      height: 48rpx;
    }
  }
}

.dictionary-name {
  font-weight: 500;
  font-size: 32rpx;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  margin-bottom: 32rpx;
  border: 1px solid #EBEEF5;
  border-radius: 16rpx;
  background-color: white;
  padding: 16rpx 24rpx;
  
  .search-input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 32rpx;
    padding-right: 16rpx;
  }
  
  .search-icon {
    margin-right: 16rpx;
  }
  
  .search-button {
    background-color: #67C23A;
    color: white;
    border-radius: 12rpx;
    font-size: 28rpx;
    padding: 16rpx 24rpx;
    height: auto;
    line-height: 1;
  }
}

.search-helpers {
  display: flex;
  flex-direction: column;
  gap: 40rpx;
}

.section-title {
  font-size: 30rpx;
  margin-bottom: 16rpx;
  color: var(--text-secondary, #64748b);
  font-weight: bold;
}

.search-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  
  .history-tag {
    padding: 8rpx 20rpx;
    background-color: #f5f7fa;
    border: 1px solid #e4e7ed;
    border-radius: 8rpx;
    font-size: 28rpx;
    color: #606266;
    cursor: pointer;
    transition: all 0.3s;
    
    &:active {
      background-color: #e4e7ed;
    }
  }
}

.hot-words-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.hot-word-item {
  display: flex;
  align-items: center;
  padding: 16rpx 24rpx;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 16rpx;
  transition: all 0.2s;
  
  .hot-word-rank {
    font-size: 28rpx;
    font-weight: bold;
    margin-right: 24rpx;
    color: #909399;
    width: 48rpx;
    text-align: center;
    
    &.top-rank {
      color: #f56c6c;
    }
  }
  
  .hot-word-text {
    flex: 1;
    font-size: 30rpx;
  }
  
  .hot-word-count {
    font-size: 24rpx;
    color: #909399;
  }
}

.word-details {
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 32rpx;
  padding: 40rpx;
  margin-top: 16rpx;
  backdrop-filter: blur(20rpx);
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.05);
  position: relative;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.word-header {
  padding-top: 48rpx;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40rpx;
  
  .word-title-area {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
    
    .word-title {
      font-size: 60rpx;
      font-weight: 600;
      color: #303133;
      margin: 0;
    }
    
    .word-pinyin {
      font-size: 32rpx;
      color: #606266;
      font-family: 'PingFang SC', sans-serif;
      
      &:empty {
        display: none;
      }
    }
    
    .word-stats {
      display: flex;
      flex-wrap: wrap;
      margin-top: 16rpx;
      gap: 24rpx;
      
      .stat-item {
        display: flex;
        align-items: center;
        gap: 8rpx;
        
        .stat-label {
          font-size: 24rpx;
          color: #909399;
        }
        
        .stat-value {
          font-size: 26rpx;
          color: #67C23A;
          font-weight: 500;
        }
        
        .proficiency-stars {
          display: flex;
          gap: 4rpx;
        }
      }
    }
  }
  
  .word-actions {
    display: flex;
    gap: 16rpx;
    
    .action-button {
      width: 80rpx;
      height: 80rpx;
      border-radius: 50%;
      background-color: rgba(103, 194, 58, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      transition: all 0.3s ease;
      margin-left: 16rpx;
      
      &:active {
        transform: scale(0.95);
        background-color: rgba(103, 194, 58, 0.2);
      }
      
      &.active {
        background-color: rgba(103, 194, 58, 0.3);
        color: #67C23A;
      }
    }
  }
}

.section {
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  border: 1px solid rgba(103, 194, 58, 0.2);
  
  .section-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #303133;
    margin-bottom: 16rpx;
    display: block;
  }
  
  .section-content {
    font-size: 30rpx;
    color: #606266;
    line-height: 1.6;
    margin-bottom: 12rpx;
    display: block;
  }
  
  .section-english {
    font-size: 28rpx;
    color: #909399;
    font-style: italic;
    display: block;
  }
}

.usage-pattern {
  margin-bottom: 24rpx;
  padding: 16rpx;
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 12rpx;
  
  .pattern-title {
    font-size: 30rpx;
    font-weight: 500;
    color: #303133;
    margin-bottom: 12rpx;
    display: block;
  }
  
  .pattern-structure {
    font-size: 28rpx;
    color: #606266;
    margin-bottom: 12rpx;
    padding: 8rpx 16rpx;
    background-color: rgba(103, 194, 58, 0.05);
    border-radius: 8rpx;
    display: block;
  }
  
  .feature-list {
    display: flex;
    flex-wrap: wrap;
    gap: 12rpx;
    margin-bottom: 12rpx;
    
    .feature-item {
      font-size: 26rpx;
      color: #67C23A;
      padding: 4rpx 12rpx;
      background-color: rgba(103, 194, 58, 0.1);
      border-radius: 6rpx;
    }
  }
  
  .example-list {
    .example-item {
      display: flex;
      align-items: flex-start;
      gap: 8rpx;
      margin-bottom: 8rpx;
      padding: 8rpx 0;
      
      text {
        font-size: 28rpx;
        color: #606266;
        line-height: 1.6;
      }
    }
  }
}

.mistake-list {
  .mistake-item {
    margin-bottom: 20rpx;
    
    .mistake-type {
      font-size: 28rpx;
      font-weight: 500;
      color: #303133;
      margin-bottom: 8rpx;
      display: block;
    }
    
    .mistake-content {
      padding-left: 24rpx;
      
      .wrong {
        font-size: 28rpx;
        color: #F56C6C;
        display: block;
        margin-bottom: 4rpx;
        
        &::before {
          content: '✕';
          margin-right: 8rpx;
        }
      }
      
      .correct {
        font-size: 28rpx;
        color: #67C23A;
        display: block;
        
        &::before {
          content: '✓';
          margin-right: 8rpx;
        }
      }
    }
  }
}

.close-button {
  position: absolute;
  top: 24rpx;
  right: 24rpx;
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: rgba(144, 147, 153, 0.1);
  transition: all 0.3s ease;
  
  &:active {
    background-color: rgba(144, 147, 153, 0.2);
    transform: scale(0.95);
  }
}

.word-relations {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.relation-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

/* 响应式调整 */
@media (max-width: 750rpx) {
  .word-header {
    flex-direction: column;
    gap: 24rpx;
  }
  .word-actions {
    align-self: flex-end;
  }
  .dictionary-container {
    padding: 0;
  }
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
}

.hot-words {
  margin-top: 48rpx;
  
  .hot-words-list {
    margin-top: 24rpx;
  }
  
  .hot-word-item {
    display: flex;
    align-items: center;
    padding: 20rpx 0;
    border-bottom: 1px solid #EBEEF5;
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  .hot-word-rank {
    width: 48rpx;
    height: 48rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28rpx;
    color: #909399;
    font-weight: 500;
    
    &.top-rank {
      color: #67C23A;
      font-weight: 600;
    }
  }
  
  .hot-word-text {
    flex: 1;
    margin: 0 24rpx;
    font-size: 32rpx;
  }
}

.notes-section {
  border: 1px dashed rgba(103, 194, 58, 0.5);
  background-color: rgba(103, 194, 58, 0.05);
  
  .notes-content {
    font-size: 28rpx;
    padding: 16rpx;
    background-color: rgba(255, 255, 255, 0.5);
    border-radius: 8rpx;
    color: #606266;
    line-height: 1.6;
    white-space: pre-wrap;
  }
}
</style> 