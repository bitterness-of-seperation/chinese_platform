<template>
  <view class="vocabulary-progress">
    <!-- 背景层 -->
    <OrganicBackground :color="'#67C23A'" :opacity="0.1"></OrganicBackground>
    
    <!-- 顶部导航栏  -->
    <view class="nav-bar">
      <uni-icons class="nav-icon" :type="iconMap.Back" size="24" color="#67C23A" @click="goBack"></uni-icons>
      <text class="page-title">WordProgress</text>
      <view class="placeholder-space"></view>
    </view>
    
    <!-- 顶部双卡片 -->
    <view class="top-cards">
      <!-- 词书选择卡片 -->
      <view class="book-card">
        <view class="card-content">
          <text class="card-title">Vocabulary</text>
          <picker 
            @change="onBookChange" 
            :value="bookOptions.findIndex(o => o.value === currentBook?._id)" 
            :range="bookOptions" 
            range-key="label"
            :disabled="isLoading"
          >
            <view class="book-select">
              <text class="book-name">{{ currentBook?.name || 'Loading...' }}</text>
              <uni-icons type="down" size="16" color="#666"></uni-icons>
            </view>
          </picker>
          <view class="book-info">
            <text class="word-count">{{ formatNumber(currentBook?.total_words || 0) }} words totally</text>
            <view class="start-btn" @click="navigateToLearn">
              <text>start</text>
              <uni-icons type="right" size="16" color="#666"></uni-icons>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 进度卡片 -->
      <view class="progress-card">
        <view class="card-content">
          <text class="card-title">Progress</text>
          <view class="progress-info">
            <text class="progress-value">{{ currentBook?.learned_words_count || 0 }}</text>
            <text class="words-learned">words learned</text>
            
            <!-- 进度百分比 -->
            <view class="progress-percentage">
              <view 
                class="progress-bar-container"
              >
                <view 
                  class="progress-bar-fill" 
                  :style="{ width: `${currentBook?.progress_percentage || 0}%` }"
                ></view>
              </view>
              <text class="percentage-text">{{ currentBook?.progress_percentage || 0 }}%</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 打卡区 -->
    <view class="attendance-card">
      <view class="attendance-header">
        <view class="header-left">
          <text class="card-title">Daily Attendance</text>
        </view>
        <view class="header-right">
          <text class="continuous-days" v-if="attendanceInfo && attendanceInfo.continuous_days">
            连续签到: <text class="days-count">{{ attendanceInfo.continuous_days }}</text> 天
          </text>
        </view>
      </view>
      <view class="date-grid">
        <view 
          v-for="(record, index) in attendanceRecords" 
          :key="index"
          class="date-item"
          :class="{ completed: record.is_signed, missed: !record.is_signed }"
        >
          <text class="date-day">{{ formatDate(record.date) }}</text>
          <uni-icons 
            :class="record.is_signed ? 'success-icon' : 'missed-icon'"
            :type="record.is_signed ? 'checkmarkempty' : 'closeempty'"
            size="18" 
            :color="record.is_signed ? 'var(--primary-color)' : 'var(--red-color)'"
          ></uni-icons>
        </view>
      </view>
    </view>

    <!-- 今日数据区 -->
    <view class="today-card">
      <view class="today-header">
        <text class="card-title">Today</text>
      </view>
      <view class="today-grid">
        <view class="today-item new">
          <view class="today-icon"><uni-icons class="new-icon" type="plus" size="24" color="#67C23A"></uni-icons></view>
          <view class="today-data">
			  <view>
				  <text class="today-value">{{ animatedValues[0] }}</text>
			  </view>
            <text class="today-label">新学单词</text>
          </view>
        </view>
        <view class="today-item star">
          <view class="today-icon"><uni-icons class="star-icon" type="star" size="24" color="#67C23A"></uni-icons></view>
          <view class="today-data">
			  <view>
				  <text class="today-value">{{ animatedValues[1] }}</text>
			  </view>
            <text class="today-label">收藏单词</text>
          </view>
        </view>
        <view class="today-item app">
          <view class="today-icon"><uni-icons class="app-icon" type="phone" size="24" color="#67C23A"></uni-icons></view>
          <view class="today-data">
			  <view>
				  <text class="today-value">{{ animatedValues[2] }}<text class="unit">分钟</text></text>
			  </view>
            <text class="today-label">使用APP</text>
          </view>
        </view>
      </view>
    </view>

    <view class="heatmap-container">
      <text class="heatmap-title">Heatmap</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from 'vue';
import OrganicBackground from '../../components/OrganicBackground.vue';
import { useUserStore } from '../../stores/user';
import { useWordStatsStore } from '../../stores/wordStats';
import { generateBatchWordData } from '@/api/wordAI.js';

// 导入uni-app的生命周期钩子
import { onShow as uniOnShow } from '@dcloudio/uni-app';

const userStore = useUserStore();
const wordStatsStore = useWordStatsStore();

// 词书数据
const currentBook = ref(null);
const bookOptions = ref([]);
const isLoading = ref(true);

// 获取词书列表
const fetchWordbooks = async () => {
  try {
    const { result } = await uniCloud.callFunction({
      name: 'getWordbooks'
    });
    
    if (result.code === 200) {
      bookOptions.value = result.data.map(book => ({
        label: book.name,
        value: book._id,
        ...book
      }));
      
      // 默认选择第一本词书
      if (bookOptions.value.length > 0) {
        currentBook.value = bookOptions.value[0];
        // 获取当前词书的学习进度
        if (userStore.userInfo?._id) {
          fetchBookProgress(currentBook.value._id);
        }
      }
    } else {
      uni.showToast({
        title: '获取词书列表失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('获取词书列表失败:', error);
    uni.showToast({
      title: '获取词书列表失败',
      icon: 'none'
    });
  } finally {
    isLoading.value = false;
  }
};

// 获取词书学习进度
const fetchBookProgress = async (bookId) => {
  if (!bookId || !userStore.userInfo?._id) return;
  
  try {
    const { result } = await uniCloud.callFunction({
      name: 'getWordbookProgress',
      data: {
        user_id: userStore.userInfo._id,
        book_id: bookId
      }
    });
    
    if (result.code === 200) {
      const bookIndex = bookOptions.value.findIndex(book => book._id === bookId);
      if (bookIndex >= 0) {
        // 更新词书进度信息
        const updatedBook = {
          ...bookOptions.value[bookIndex],
          learned_words_count: result.data.learned_count,
          progress_percentage: result.data.progress_percentage
        };
        bookOptions.value[bookIndex] = updatedBook;
        
        // 如果是当前选中的词书，也更新currentBook
        if (currentBook.value && currentBook.value._id === bookId) {
          currentBook.value = updatedBook;
        }
      }
    }
  } catch (error) {
    console.error('获取词书进度失败:', error);
  }
};

// 词书切换
const onBookChange = async (e: any) => {
  currentBook.value = bookOptions.value[e.detail.value];
  
  // 获取新选择词书的学习进度
  if (currentBook.value && userStore.userInfo?._id) {
    fetchBookProgress(currentBook.value._id);
  }
};

// 格式化数字
const formatNumber = (num: number) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};


// 今日统计数据
const todayData = ref([
  { icon: 'plus-filled', value: 0, label: '新学单词' },
  { icon: 'star-filled', value: 0, label: '收藏单词' },
  { icon: 'phone', value: 0, label: '使用APP' }
]);

// 监听Pinia中的统计数据变化，更新UI
const updateTodayDataFromStore = () => {
  todayData.value[0].value = wordStatsStore.todayNewWords;
  todayData.value[1].value = wordStatsStore.todayFavoriteWords;
  // APP使用时间保持不变，由calculateAppUsageTime计算
};

// 动画计数器
const animatedValues = ref(todayData.value.map(() => 0));

// 启动计数动画
const startCountAnimation = () => {
  todayData.value.forEach((item, index) => {
    let current = 0;
    const target = item.value;
    const duration = 1000;
    const interval = 20;
    const steps = duration / interval;
    const increment = target / steps;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      animatedValues.value[index] = Math.floor(current);
    }, interval);
  });
};

// 图标映射
const iconMap = {
  Back: 'back',
  Search: 'search',
  ChatLineRound: 'chatbubble',
  Bookmark: 'star-filled',
  Headset: 'sound',
  Close: 'closeempty',
  ArrowDown: 'bottom'
};

// 返回上一页
const goBack = () => {
  uni.navigateBack({
    delta: 1,
    fail: () => {
      uni.switchTab({ url: '/pages/Home/Home' });
    }
  });
};

// 跳转到学习页面
const navigateToLearn = async () => {
  if (!currentBook.value) {
    uni.showToast({
      title: '请先选择词书',
      icon: 'none'
    });
    return;
  }
  
  if (!userStore.userInfo?._id) {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    });
    return;
  }
  
  try {
    uni.showLoading({
      title: '正在加载词汇...'
    });
    
    // 确定单词所属级别
    let level = 'HSK3';
    if (currentBook.value.name.includes('HSK3')) {
      level = 'HSK3';
    } else if (currentBook.value.name.includes('HSK4')) {
      level = 'HSK4';
    } else if (currentBook.value.name.includes('HSK5')) {
      level = 'HSK5';
    } else if (currentBook.value.name.includes('HSK6')) {
      level = 'HSK6';
    }
    
    // 不再提供固定词汇，让大模型自动生成
    // 使用wordAI直接生成词汇学习数据
    const wordData = await generateBatchWordData(
      [], 
      currentBook.value.name,
      userStore.userInfo._id,
      currentBook.value._id
    );
    
    // 注意：在这里不再预先保存单词数据，而是等用户回答正确后再保存
    // 我们只传递生成的单词数据到学习页面
    console.log('成功生成单词数据:', wordData);
    
    // 构建URL参数
    const urlParams = {
      bookId: currentBook.value._id,
      userId: userStore.userInfo._id,
      level: level,
      wordData: JSON.stringify(wordData),
      wordIds: JSON.stringify([]) // 初始为空数组，用户学习过程中会填充
    };
    
    console.log('URL参数:', urlParams);
    
    // 编码URL参数
    const encodedParams = Object.entries(urlParams).map(([key, value]) => 
      `${key}=${encodeURIComponent(value)}`
    ).join('&');
    
    console.log('编码后的URL参数:', encodedParams);
    
    // 跳转到学习页面并传递数据
    const url = `/pages/WordLearning/WordLearning?${encodedParams}`;
    console.log('完整URL:', url);
    
    uni.navigateTo({
      url: url,
      fail: (e) => {
        console.error('navigateTo failed', e);
      }
    });
  } catch (error) {
    console.error('准备学习数据失败:', error);
    uni.showToast({
      title: '加载失败，请重试',
      icon: 'none'
    });
  } finally {
    uni.hideLoading();
  }
};

// 打卡相关数据
const attendanceRecords = ref([]);
const attendanceInfo = computed(() => userStore.getAttendanceInfo);

// 获取打卡记录
const fetchAttendanceRecords = async () => {
  if (!userStore.userInfo?._id) return;
  
  try {
    const { result } = await uniCloud.callFunction({
      name: 'attendance',
      data: {
        user_id: userStore.userInfo._id,
        type: 'get'
      }
    });
    
    console.log('打卡记录原始数据:', JSON.stringify(result));
    
    if (result.code === 200 && result.data.records) {
      // 打印每条记录的日期详情
      result.data.records.forEach((record, index) => {
        console.log(`记录${index + 1}日期:`, record.date, 
                    '年份:', new Date(record.date).getFullYear(),
                    '是否签到:', record.is_signed);
      });
      
      // 准备空的打卡记录（最近4天）
      const emptyRecords = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (let i = 3; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        emptyRecords.push({
          date: date,
          is_signed: false
        });
      }
      
      // 将服务器返回的签到记录合并到空记录中
      const serverRecords = result.data.records || [];
      
      // 直接使用服务器返回的记录，不做额外处理
      // 服务器已经为每一天返回了正确的 is_signed 状态
      attendanceRecords.value = serverRecords;
      
      // 计算APP使用时间
      calculateAppUsageTime();
      console.log('更新后的打卡记录:', attendanceRecords.value);
    } else {
      console.error('获取打卡记录失败:', result.message);
      initAttendanceRecords(); // 获取失败时初始化空记录
    }
  } catch (error) {
    console.error('获取打卡记录失败:', error);
    initAttendanceRecords(); // 获取失败时初始化空记录
  }
};

// 初始化空记录
const initAttendanceRecords = () => {
  const records = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 3; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    records.push({
      date: date,
      is_signed: false
    });
  }
  
  attendanceRecords.value = records;
};

// 格式化日期
const formatDate = (date) => {
  // 转换为日期对象（如果不是）
  if (!date) return 'Unknown';
  
  let dateObj;
  try {
    dateObj = date instanceof Date ? date : new Date(date);
    
    // 检查是否有效日期
    if (isNaN(dateObj.getTime())) {
      console.error('无效的日期:', date);
      return 'Invalid';
    }
    
    // 检查日期是否在有效范围内
    const currentYear = new Date().getFullYear();
    if (dateObj.getFullYear() > currentYear + 1 || dateObj.getFullYear() < currentYear - 1) {
      console.warn('日期年份异常，可能需要调整:', date);
      // 修正到当前年份
      dateObj.setFullYear(currentYear);
    }
  } catch (e) {
    console.error('日期解析错误:', e);
    return 'Error';
  }
  
  // 对于今天的日期，显示"Today"
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dateToCompare = new Date(dateObj);
  dateToCompare.setHours(0, 0, 0, 0);
  
  if (dateToCompare.getTime() === today.getTime()) {
    return 'Today';
  }
  
  // 使用简短的月份和日期
  const month = dateObj.toLocaleString('en', { month: 'short' });
  const day = dateObj.getDate();
  return `${month} ${day}`;
};

// 计算使用APP时间
const calculateAppUsageTime = () => {
  if (!attendanceRecords.value || attendanceRecords.value.length === 0) return;
  
  // 查找今日签到记录
  const now = new Date(); // 当前精确时间
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  
  const todayRecord = attendanceRecords.value.find(record => {
    const recordDate = new Date(record.date);
    recordDate.setHours(0, 0, 0, 0);
    return recordDate.getTime() === today.getTime() && record.is_signed;
  });
  
  if (todayRecord) {
    // 计算从签到时间到现在的分钟数
    let usageMinutes = 0;
    const signTime = todayRecord.sign_time ? new Date(todayRecord.sign_time) : todayRecord.create_date ? new Date(todayRecord.create_date) : null;
    
    if (signTime) {
      // 计算从签到时间到现在的分钟数
      const diffMs = now.getTime() - signTime.getTime();
      usageMinutes = Math.round(diffMs / (1000 * 60)); // 转换为分钟
      
      // 如果计算结果为负数或者不合理，设置最小值为1分钟
      usageMinutes = Math.max(1, usageMinutes);
      
      // 设置最大显示时间为480分钟（8小时）
      usageMinutes = Math.min(480, usageMinutes);
    } else {
      // 如果找不到签到时间但确实签到了，则至少显示1分钟
      usageMinutes = 1;
    }
    
    // 更新使用时间
    todayData.value[2].value = usageMinutes;
    
    // 重新启动动画
    animatedValues.value[2] = 0;
    
    let current = 0;
    const target = todayData.value[2].value;
    const duration = 1000;
    const interval = 20;
    const steps = duration / interval;
    const increment = target / steps;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      animatedValues.value[2] = Math.floor(current);
    }, interval);
  }
};

// 定时更新APP使用时间的定时器
let usageTimer = null;

// 页面显示时更新统计数据
const updateStats = async () => {
  if (userStore.userInfo?._id) {
    // 加载统计数据
    await wordStatsStore.loadStatsFromServer(userStore.userInfo._id);
    updateTodayDataFromStore();
    startCountAnimation();
    
    // 刷新当前词书进度
    if (currentBook.value?._id) {
      await fetchBookProgress(currentBook.value._id);
    } else {
      // 如果当前没有选中的词书，重新获取词书列表
      await fetchWordbooks();
    }
  }
};

// 使用uni-app的onShow生命周期钩子
uniOnShow(() => {
  updateStats();
});

// 页面加载
onMounted(async () => {
  // 初始化wordStats store并从服务器加载数据
  if (userStore.userInfo?._id) {
    await wordStatsStore.loadStatsFromServer(userStore.userInfo._id);
    updateTodayDataFromStore();
  }
  
  startCountAnimation();
  
  // 获取词书列表
  await fetchWordbooks();
  // 初始化空记录
  initAttendanceRecords();
  // 获取打卡记录
  if (userStore.userInfo?._id) {
    await fetchAttendanceRecords();
    // 计算APP使用时间
    calculateAppUsageTime();
    
    // 设置定时器，每分钟更新一次使用时间
    usageTimer = setInterval(() => {
      calculateAppUsageTime();
    }, 60000); // 每分钟更新一次
  }
});

// 页面卸载前清除定时器
onBeforeUnmount(() => {
  if (usageTimer) {
    clearInterval(usageTimer);
    usageTimer = null;
  }
});
</script>

<style lang="scss" scoped>
/* 颜色系统 */
:root {
  --primary-color: #67C23A;
  --primary-dark: #5B8C00;
  --text-primary: #303133;
  --text-regular: #606266;
  --text-secondary: #909399;
  --border-color: #EBEEF5;
  --card-bg: rgba(240, 249, 235, 0.9);
  --card-hover-shadow: 0 12rpx 36rpx rgba(103, 194, 58, 0.12);
  
  /* 新增颜色 */
  --orange-color: #FF9A2F;
  --blue-color: #58A8FF;
  --red-color: #F56C6C;
  --cyan-color: #36cfc9;
  --purple-color: #9254de;
  --yellow-color: #faad14;
}

/* 间距系统 */
$--spacing-base: 8rpx;
$--spacing-sm: 16rpx;
$--spacing-md: 32rpx;
$--spacing-lg: 48rpx;

/* 容器样式 */
.vocabulary-progress {
  min-height: 100vh;
  padding: $--spacing-md;
  position: relative;
  width: 100%;
  box-sizing: border-box;
  padding-top: 180rpx; // 为导航栏预留空间
}

/* 导航栏 */
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

/* 卡片统一风格 */
.book-card, .progress-card, .attendance-card, .today-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 24rpx;
  margin-bottom: $--spacing-md;
  transition: transform 0.3s, box-shadow 0.3s;
  will-change: transform, box-shadow;
  overflow: hidden;
  border: none;
  width: 100%;
  padding: 32rpx;
}

/* 顶部双卡片 */
.top-cards {
  display: flex;
  gap: 24rpx;
  margin-bottom: 24rpx;
  margin-top: calc(88rpx + var(--status-bar-height, 40rpx)); /* 导航栏高度 + 状态栏高度 */
  
  .book-card, .progress-card {
    flex: 1;
    background: #ffffff;
    border-radius: 20rpx;
    
    .card-content {
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 24rpx;
    }
  }
}

/* 统一所有卡片标题样式 */
.book-card .card-title,
.progress-card .card-title,
.attendance-card .card-title,
.today-card .card-title {
      font-size: 32rpx;
      color: #333;
  font-weight: bold;
  margin-bottom: 32rpx;
}

/* 词书选择卡片 */
.book-card {
  background: rgba(255, 247, 237, 0.9) !important;
  
  .book-select {
    background: rgba(255, 247, 237, 0.9);
    padding: 16rpx 24rpx;
    border-radius: 12rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin: 16rpx 0;
    
    .book-name {
      font-size: 32rpx;
      color: #333;
      font-weight: normal;
    }
  }
  
  .book-info {
    margin-top: 16rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .word-count {
      font-size: 26rpx;
      color: #666;
    }
    
    .start-btn {
      display: flex;
      align-items: center;
      gap: 8rpx;
      font-size: 26rpx;
      color: #666;
    }
  }
}

/* 进度卡片 */
.progress-card {
  background: rgba(236, 246, 255, 0.9) !important;
  
  .progress-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 12rpx;
    margin-top: 16rpx;
    
    .progress-value {
      font-size: 100rpx;
      color: #2196F3;
      font-weight: normal;
      line-height: 1;
    }
    
    .words-learned {
      font-size: 26rpx;
      color: #666;
    }
    
    /* 进度百分比 */
    .progress-percentage {
      margin-top: 24rpx;
      
      .progress-bar-container {
        width: 100%;
        height: 20rpx;
        background-color: #EBEEF5;
        border-radius: 10rpx;
        overflow: hidden;
        margin-bottom: 8rpx;
      }
      
      .progress-bar-fill {
        height: 100%;
        background-color: #2196F3;
        transition: width 0.3s ease;
      }
      
      .percentage-text {
        font-size: 24rpx;
        color: #2196F3;
        display: block;
        text-align: right;
      }
    }
  }
}

/* 打卡区卡片 */
.attendance-card {
  background-color: #ffffff;
  margin-right: 50rpx;
  
  .attendance-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;
    
    .header-right {
      .continuous-days {
        font-size: 28rpx;
        color: var(--text-regular);
        
        .days-count {
          color: var(--primary-color);
          font-weight: bold;
          font-size: 32rpx;
        }
      }
    }
  }
  
  .date-grid {
    display: flex;
    justify-content: space-between;
    gap: 16rpx;
    flex-wrap: wrap;
    
    .date-item {
      text-align: center;
      flex: 1;
      min-width: calc(25% - 16rpx);
      padding: 16rpx;
      border-radius: 20rpx;
      transition: all 0.3s ease;
      
      .date-day {
        font-size: 24rpx;
        color: var(--text-regular);
        margin-bottom: 12rpx;
        background-color: transparent;
        display: block;
        text-align: center;
      }
      
      .success-icon, .missed-icon {
        font-size: 36rpx;
        display: block;
        margin: 0 auto;
      }

      &.completed {
        background-color: rgba(103, 194, 58, 0.15);
      }
      
      &.missed {
        background-color: rgba(245, 108, 108, 0.15);
      }
    }
  }
}

/* 今日数据卡片 */
.today-card {
  background-color: #ffffff;
  
  .today-header {
    margin-bottom: 24rpx;
  }
  
  .today-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200rpx, 1fr));
    gap: 24rpx;
    
    .today-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24rpx;
      border-radius: 16rpx;
      background-color: rgba(240, 249, 235, 0.5);
      text-align: center;
      
      .today-icon {
        width: 80rpx;
        height: 80rpx;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16rpx;
        
        .review-icon, .new-icon, .star-icon, .delete-icon, .study-icon, .app-icon {
          font-size: 48rpx;
          color: white;
        }
      }
      
      .today-data {
        .today-value {
          font-size: 48rpx;
          font-weight: bold;
          color: var(--text-primary);
          .unit {
            font-size: 28rpx;
            margin-left: 4rpx;
          }
        }
        
        .today-label {
          font-size: 28rpx;
          color: var(--text-secondary);
          margin-top: 8rpx;
      }
    }

      &.review .today-icon {
      background-color: var(--primary-color);
    }
      &.new .today-icon {
      background-color: var(--orange-color);
    }
      &.star .today-icon {
      background-color: var(--blue-color);
    }
      &.delete .today-icon {
      background-color: var(--red-color);
    }
      &.study .today-icon {
      background-color: var(--cyan-color);
    }
      &.app .today-icon {
      background-color: var(--purple-color);
      }
    }
  }
}

/* Heatmap */
.heatmap-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: $--spacing-md;
  
  .heatmap-title {
    font-size: 40rpx;
    font-weight: bold;
    color: var(--text-primary);
    margin-right: $--spacing-sm;
  }
  
  .heatmap-icon {
    width: 48rpx;
    height: 48rpx;
    background-color: var(--primary-color);
    border-radius: 8rpx;
  }
}
</style> 