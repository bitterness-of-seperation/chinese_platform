<template>
  <view class="word-learning-container">
    <!-- 导航栏 -->
    <NavBar title="单词学习" />
    
    <!-- 背景 -->
    <OrganicBackground :color="'#67C23A'" :opacity="0.1" />
    
    <!-- 预览视图 -->
    <view v-if="!showLearningView" class="preview-view">
      <view class="preview-card">
        <text class="progress-text">{{ currentWordIndex + 1 }}/{{ totalWords }}</text>

        <view class="word-header">
          <view class="word-info">
            <text class="word-text">{{ wordData.word }}</text>
            <text class="pinyin-text">{{ wordData.pronunciation }}</text>
          </view>
          <view class="favorite-btn" @click="toggleStar">
            <uni-icons type="star" size="24" :color="isStarred ? '#FFB302' : '#909399'"></uni-icons>
          </view>
        </view>

        <view class="divider"></view>

        <view class="options-container">
          <text class="options-hint">选择你认为正确的词义：</text>
          <view class="options-grid">
            <view 
              v-for="(option, index) in wordOptions" 
              :key="index"
              class="option-btn"
              :class="{ 
                'selected': selectedOption === index,
                'correct': hasChecked && option.isCorrect,
                'wrong': hasChecked && selectedOption === index && !option.isCorrect
              }"
              @click="selectOption(index)"
            >
              <text class="option-text">{{ option.text }}</text>
            </view>
          </view>
        </view>

        <view 
          class="check-answer-btn" 
          @click="checkAnswer"
          :class="{ 'disabled': selectedOption === null }"
        >
          <text class="answer-text">{{ hasChecked ? '查看详情' : '提交答案' }}</text>
        </view>
      </view>
    </view>
    
    <!-- 学习视图 -->
    <view v-else class="learning-view">
    <!-- 单词信息卡片 -->
    <view class="word-card">
      <view class="word-card-header">
        <h1 class="word-title">{{ wordData.word }}</h1>
        <view class="pronunciation">
            <uni-icons type="headphones" size="18" @click="playPronunciation"></uni-icons>
          <span>{{ wordData.pronunciation }}</span>
        </view>
      </view>
      <uni-tag type="success" :text="wordData.type" class="word-type"></uni-tag>
      <text class="definition">{{ wordData.definition }}</text>
    </view>
    
    <!-- 语法和例句卡片并排显示 -->
    <view class="cards-flex-container">
    <!-- 语法卡片 -->
    <view class="grammar-card">
        <view class="grammar-header">
          <h3>{{ wordData.grammar.title }}</h3>
          <uni-tag size="small" type="warning" :text="wordData.grammar.level"></uni-tag>
        </view>
      <view class="grammar-content">
            <text class="pattern">
              <uni-icons type="arrow-right" color="#67C23A" size="18"></uni-icons>
              sentence pattern: {{ wordData.grammar.pattern }}
            </text>
        <text class="notes">notes: {{ wordData.grammar.notes }}</text>
      </view>
    </view>
    
    <!-- 例句卡片 -->
    <view class="example-card">
        <view class="example-card-header">Example sentences</view>
      <view
        v-for="(example, index) in wordData.examples"
        :key="index"
        class="example-item"
      >
            <uni-icons type="chatboxes-fill" class="example-icon" size="18"></uni-icons>
        <view class="example-content">
          <text class="chinese-text">{{ example.text }}</text>
          <text class="pinyin">{{ example.pinyin }}</text>
          <text class="translation">{{ example.translation }}</text>
        </view>
      </view>
    </view>
    </view>
    
    <!-- 词组扩展区 -->
    <uni-collapse v-model="activeNames" class="phrase-collapse">
      <uni-collapse-item title="Related phrases" name="phrases">
        <view
          v-for="(phrase, index) in wordData.phrases"
          :key="index"
          class="phrase-item"
        >
          <view class="phrase-chinese">
            <text class="chinese">{{ phrase.chinese }}</text>
            <text class="pinyin">{{ phrase.pinyin }}</text>
          </view>
          <text class="phrase-english">{{ phrase.english }}</text>
        </view>
      </uni-collapse-item>
    </uni-collapse>
    
    <!-- 底部导航 -->
    <view class="footer-nav">
        <uni-icons type="reload" class="nav-icon" size="26"></uni-icons>
        <uni-icons type="arrow-right" class="nav-icon" size="26" @click="nextWord"></uni-icons>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import NavBar from '@/components/NavBar.vue'
import OrganicBackground from '@/components/OrganicBackground.vue'
import { generateWordData, generateBatchWordData } from '@/api/wordAI.js'
import { useWordStatsStore } from '@/stores/wordStats'
import { useUserStore } from '@/stores/user'
import { onLoad } from '@dcloudio/uni-app'

// 页面状态
const activeNames = ref(['phrases'])
const isStarred = ref(false)
const showLearningView = ref(false)
const selectedOption = ref(null)
const correctOptionIndex = ref(null)
const currentWordIndex = ref(0)
const totalWords = ref(5)
const loading = ref(false)
const wordData = ref({})
const wordList = ref([])
const currentBatch = ref([])
const wordOptions = ref([])
const starredWords = ref([])
const selectedCorrect = ref(false)
const hasChecked = ref(false)

// 路由参数
const params = reactive({
  userId: '',
  bookId: '',
  level: 'HSK3',
  wordIds: []
})

// 获取Pinia stores
const wordStatsStore = useWordStatsStore()
const userStore = useUserStore()

// 页面加载
onLoad(async (options) => {
  // 从URL参数中获取词汇数据和ID信息
  params.userId = options.userId || '';
  params.bookId = options.bookId || '';
  params.level = options.level || 'HSK3';
  
  // 初始化本地统计
  wordStatsStore.initStats();
  
  // 如果有用户ID，从服务器获取最新统计
  if (params.userId) {
    try {
      const { result } = await uniCloud.callFunction({
        name: 'getUserStats',
        data: { user_id: params.userId }
      });
      
      if (result.code === 200 && result.data) {
        // 服务器返回的统计数据是最权威的，直接使用
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const serverDate = new Date(result.data.date);
        
        if (serverDate.getTime() === today.getTime()) {
          // 更新前端统计数据
          wordStatsStore.todayNewWords = result.data.new_words_count || 0;
          wordStatsStore.todayFavoriteWords = result.data.favorite_words_count || 0;
          wordStatsStore.lastUpdateDate = today;
          wordStatsStore.updateStatsToServer(); // 更新本地存储
          console.log('从服务器加载统计数据:', wordStatsStore.todayNewWords, wordStatsStore.todayFavoriteWords);
        }
      }
    } catch (error) {
      console.error('获取服务器统计数据失败:', error);
    }
  }
  
  if (options.wordIds) {
    try {
      params.wordIds = JSON.parse(decodeURIComponent(options.wordIds));
    } catch (error) {
      console.error('解析wordIds失败:', error);
      params.wordIds = [];
    }
  }
  
  // 从URL参数中获取词汇数据
  if (options.wordData) {
    try {
      const parsedWordData = JSON.parse(decodeURIComponent(options.wordData));
      currentBatch.value = parsedWordData;
      totalWords.value = parsedWordData.length;
      
      // 加载已收藏的单词
      const starred = uni.getStorageSync('starred_words') || [];
      starredWords.value = starred;
      
      // 加载第一个单词
      if (parsedWordData.length > 0) {
        loadWordDataFromCache(0);
      }
      
      console.log('成功从URL参数加载单词数据');
    } catch (error) {
      console.error('解析词汇数据失败:', error);
      uni.showToast({
        title: '数据加载失败，请返回重试',
        icon: 'none',
        duration: 2000
      });
      
      setTimeout(() => {
        uni.navigateBack();
      }, 2000);
    }
  } else {
    // 如果没有传入wordData，从服务器获取新的单词列表
    getNewWordList();
  }
});

// 获取新的单词列表
const getNewWordList = async () => {
  try {
    loading.value = true;
    const { result } = await uniCloud.callFunction({
      name: 'getWordList',
      data: {
        bookId: params.bookId,
        limit: 5,
        userId: params.userId // 添加userId参数
      }
    });
    
    if (result.code === 200) {
      if (result.data.length === 0) {
        // 如果没有未学习的单词了
        uni.showModal({
          title: '提示',
          content: result.message || '当前词书的单词已经全部学习完成！',
          showCancel: false,
          success: () => {
            uni.navigateBack();
          }
        });
        return;
      }
      
      currentBatch.value = result.data;
      totalWords.value = result.data.length;
      // 更新剩余未学习单词数
      wordStatsStore.setRemainingWords(result.total_remaining);
      
      // 加载第一个单词
      if (result.data.length > 0) {
        loadWordDataFromCache(0);
      }
    } else {
      uni.showToast({
        title: '获取单词列表失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('获取单词列表失败:', error);
    uni.showToast({
      title: '获取单词列表失败',
      icon: 'none'
    });
  } finally {
    loading.value = false;
  }
};

// 从缓存加载单词数据
const loadWordDataFromCache = (index) => {
  try {
    if (index >= 0 && index < currentBatch.value.length) {
      const data = currentBatch.value[index]
      wordData.value = {
        word: data.word,
        pronunciation: data.pinyin,
        type: data.type,
        definition: data.definitions.join('; '),
        grammar: {
          title: data.grammar.title,
          pattern: data.grammar.pattern,
          notes: data.grammar.notes,
          level: data.grammar.level
        },
        examples: data.examples.map(example => ({
          text: example.text,
          pinyin: example.pinyin,
          translation: example.translation
        })),
        phrases: data.phrases || []
      }
      
      // 检查该单词是否已收藏
      isStarred.value = starredWords.value.includes(data.word)
      
      // 使用API返回的答案选项
      if (data.answer_options && Array.isArray(data.answer_options) && data.answer_options.length >= 4) {
        wordOptions.value = data.answer_options;
        // 记录正确答案的索引
        correctOptionIndex.value = data.answer_options.findIndex(option => option.isCorrect);
      } else {
        // 如果没有答案选项，则生成默认选项
        wordOptions.value = generateDefaultOptions(data.definitions[0]);
        correctOptionIndex.value = 0;
      }
      
      currentWordIndex.value = index
    }
  } catch (error) {
    console.error('从缓存加载单词数据失败:', error)
  }
}

// 收藏单词
const toggleStar = async () => {
  if (!wordData.value.word) return;
  
  const newStarStatus = !isStarred.value;
  isStarred.value = newStarStatus;
  
  // 更新收藏状态
  const word = wordData.value.word;
  let starred = uni.getStorageSync('starred_words') || [];
  
  if (isStarred.value) {
    // 添加到收藏
    if (!starred.includes(word)) {
      starred.push(word);
    }
  } else {
    // 从收藏中移除
    starred = starred.filter(w => w !== word);
  }
  
  // 保存到本地
  uni.setStorageSync('starred_words', starred);
  starredWords.value = starred;
  
  // 显示提示
  uni.showToast({
    title: isStarred.value ? '已收藏' : '已取消收藏',
    icon: 'none'
  });
  
  try {
    // 调用新的云函数更新收藏状态
    const { result } = await uniCloud.callFunction({
      name: 'updateWordProgress',
      data: {
        word: word,
        user_id: params.userId,
        book_id: params.bookId,
        is_learned: false, // 收藏不影响学习状态
        is_favorite: newStarStatus,
        update_count: true // 设置为true，让云函数更新收藏计数
      }
    });
    
    if (result.code === 200) {
      console.log('成功更新收藏状态');
      
      // 更新Pinia store中的收藏计数
      if (newStarStatus) {
        wordStatsStore.addFavoriteWord();
      } else {
        wordStatsStore.removeFavoriteWord();
      }
      
      // 更新本地存储中的统计数据
      wordStatsStore.updateStatsToServer();
    }
  } catch (error) {
    console.error('更新收藏状态失败:', error);
  }
};

// 检查答案
const checkAnswer = async () => {
  if (selectedOption.value === null) {
    return;
  }
  
  // 如果已经检查过答案，直接显示学习视图
  if (hasChecked.value) {
    showLearningView.value = true;
    return;
  }
  
  const isCorrect = wordOptions.value[selectedOption.value].isCorrect;
  hasChecked.value = true;
  selectedCorrect.value = isCorrect;
    
  if (isCorrect) {
    // 如果回答正确，保存单词并更新进度
    try {
      const saveResult = await uniCloud.callFunction({
        name: 'saveWords',
        data: {
          word: {
            word: wordData.value.word,
            pinyin: wordData.value.pronunciation,
            type: wordData.value.type,
            definitions: wordData.value.definition,
            grammar: wordData.value.grammar,
            examples: wordData.value.examples,
            phrases: wordData.value.phrases || []
          },
          bookId: params.bookId,
          userId: params.userId,
          level: params.level,
          correctOnly: true
        }
      });
      
      if (saveResult.result.code === 200 && saveResult.result.data.word_ids.length > 0) {
        console.log('单词保存成功，ID:', saveResult.result.data.word_ids[0]);
        // 标记单词为已学习
        await markWordAsLearned(saveResult.result.data.word_ids[0]);
      }
    } catch (error) {
      console.error('保存单词失败:', error);
    }
  }
    
  // 显示正确/错误提示
  uni.showToast({
    title: isCorrect ? '回答正确！' : '回答错误',
    icon: isCorrect ? 'success' : 'error',
    duration: 1500
  });
};
    
// 标记单词为已学习
const markWordAsLearned = async (wordId) => {
  try {
    // 防止重复调用
    if (!wordId || !wordData.value.word) {
      console.log('无效的单词ID或单词数据');
      return;
    }
    
    // 更新单词进度
    const progressResult = await uniCloud.callFunction({
      name: 'updateWordProgress',
      data: {
        word: wordData.value.word,
        user_id: params.userId,
        book_id: params.bookId,
        is_learned: true,
        update_count: true // 设置为true，表示需要更新学习计数
      }
    });
    
    if (progressResult.result.code === 200) {
      console.log('单词进度更新成功');
      try {
        // 只有单词是新学习的（非已学习过的）才更新本地统计数据
        if (!progressResult.result.data.is_already_learned) {
          // 更新本地统计数据
          wordStatsStore.incrementWordsLearned(1);
          console.log('统计数据更新成功');
        } else {
          console.log('单词已学习过，不更新统计数据');
        }
      } catch (error) {
        console.error('更新统计数据失败:', error);
      }
    }
  } catch (error) {
    console.error('标记单词为已学习失败:', error);
  }
};

// 下一个单词
const nextWord = () => {
  if (currentWordIndex.value < currentBatch.value.length - 1) {
    // 重置状态
    selectedOption.value = null
    correctOptionIndex.value = null
    selectedCorrect.value = false
    hasChecked.value = false
    showLearningView.value = false
    
    // 加载下一个单词
    loadWordDataFromCache(currentWordIndex.value + 1)
  } else {
    // 已经是最后一个单词
    uni.showToast({
      title: '已经是最后一个单词了',
      icon: 'none'
    })
    
    // 所有单词学习完毕，准备返回
    setTimeout(() => {
      // 更新词书总进度
      updateBookProgress();
      
      // 返回上一页
      uni.navigateBack();
    }, 1500);
  }
}

// 更新词书总进度
const updateBookProgress = async () => {
  try {
    if (params.userId && params.bookId) {
      // 获取用户在当前词书中已学习的单词总数
      const { result } = await uniCloud.callFunction({
        name: 'getWordbookProgress',
        data: {
          user_id: params.userId,
          book_id: params.bookId
        }
      });
      
      if (result.code === 200) {
        console.log('词书进度更新成功，已学习单词数:', result.data.learned_count);
      }
    }
  } catch (error) {
    console.error('更新词书进度失败:', error);
  }
}

// 生成默认选项（如API未返回选项时使用）
const generateDefaultOptions = (correctAnswer) => {
  const options = [
    { text: correctAnswer, isCorrect: true },
    { text: '用于表示时间的词语', isCorrect: false },
    { text: '用于表示地点的词语', isCorrect: false },
    { text: '用于表示方式的词语', isCorrect: false }
  ];
  
  // 随机排序选项
  return options.sort(() => Math.random() - 0.5);
}

const handleBack = () => {
  if (showLearningView.value) {
    showLearningView.value = false
  } else {
    uni.navigateBack()
  }
}

const selectOption = (index) => {
  if (hasChecked.value) return;
  selectedOption.value = index;
}

const playPronunciation = () => {
  // 实现播放发音的逻辑
  console.log('Playing pronunciation')
}

// 从本地存储获取学习数据
const loadLearningData = () => {
  try {
    // 加载已收藏的单词
    const starred = uni.getStorageSync('starred_words') || []
    starredWords.value = starred
  } catch (error) {
    console.error('加载学习数据失败:', error)
  }
}

// 初始加载
loadLearningData()
</script>

<style lang="scss" scoped>
/* 颜色系统 */
$--primary-green: #67C23A;
$--dark-green: #5B8C00;
$--light-bg: #F0F9EB;
$--text-primary: #303133;
$--text-regular: #606266;
$--text-secondary: #909399;
$--border-color: #EBEEF5;
$--option-bg: #F5F7FA;
$--option-hover-bg: #FFFFFF;
$--option-border: #DCDFE6;
$--button-green: #95D475;

/* 间距系统 */
$--spacing-base: 12rpx;
$--spacing-sm: 24rpx;
$--spacing-md: 36rpx;
$--spacing-lg: 60rpx;
$--spacing-xl: 84rpx;

/* 容器样式 */
.word-learning-container {
  min-height: 100vh;
  padding: $--spacing-md;
  position: relative;
  margin: 0 auto;
  box-sizing: border-box;
  padding-bottom: 160rpx;
  padding-top: 88rpx;
}

/* 进度条样式 */
.progress-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $--spacing-md;
  
  .progress-text {
    font-size: 28rpx;
    color: $--text-regular;
    display: block;
    margin-bottom: $--spacing-lg;
  }
  
  .favorite-btn {
    padding: $--spacing-sm;
    
    &.is-favorite {
      color: #FF6B6B;
    }
  }
}

/* 预览视图样式 */
.preview-view {
  padding: 32rpx;
  margin-top: calc(88rpx + var(--status-bar-height, 40rpx)); /* 导航栏高度 + 状态栏高度 */
  
  .preview-card {
    background: $--light-bg;
    border-radius: 24rpx;
    padding: $--spacing-lg;
  }

  .progress-text {
    font-size: 28rpx;
    color: $--text-regular;
    display: flex;
    justify-content: center;
    margin-bottom: $--spacing-lg;
  }

  .word-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: $--spacing-lg;

    .word-info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    .word-text {
      font-size: 72rpx;
      color: $--text-primary;
      font-weight: bold;
      line-height: 1.2;
    }

    .pinyin-text {
      font-size: 32rpx;
      color: $--text-regular;
      margin-top: $--spacing-sm;
    }

    .favorite-btn {
      padding: $--spacing-sm;
      height: 48rpx;
      width: 48rpx;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .divider {
    height: 2rpx;
    background-color: $--border-color;
    margin: $--spacing-lg 0;
  }
  
  .options-container {
    .options-hint {
      display: block;
      color: $--text-regular;
      font-size: 32rpx;
      margin-bottom: $--spacing-lg;
    }
    
    .options-grid {
      display: flex;
      flex-direction: column;
      gap: $--spacing-md;
      margin-bottom: $--spacing-lg;
    }
    
    .option-btn {
      background: $--option-bg;
      border: 2rpx solid $--option-border;
      border-radius: 8rpx;
      height: 88rpx;
      margin: 0;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .option-text {
        font-size: 32rpx;
        color: $--text-regular;
        text-align: center;
        width: 100%;
        padding: 0 $--spacing-md;
      }
      
      &.selected {
        background: $--light-bg;
        border-color: $--primary-green;
        
        .option-text {
          color: $--primary-green;
        }
      }
      
      &.correct {
        background: $--button-green;
        border-color: $--primary-green;
        
        .option-text {
          color: white;
        }
      }
      
      &.wrong {
        background: #FF6B6B;
        border-color: #FF6B6B;
        
        .option-text {
          color: white;
        }
      }
      
      &:active {
        background: $--option-hover-bg;
      }
    }
  }
  
  .check-answer-btn {
    width: 100%;
    background: $--button-green;
    border: none;
    border-radius: 8rpx;
    height: 88rpx;
    margin-top: $--spacing-lg;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .answer-text {
      font-size: 36rpx;
      color: white;
      text-align: center;
    }
    
    &.disabled {
      background: $--option-border;
      opacity: 0.7;
      
      .answer-text {
        color: $--text-secondary;
      }
    }
  }
}

/* 顶部操作栏 */
.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: $--spacing-md;
  padding: $--spacing-base;

  .action-icon {
    font-size: 44rpx; // 22px * 2
    color: $--primary-green;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:active { // uni-app 中用 active 模拟 hover
      transform: scale(1.1);
    }

    &.is-starred {
      color: #E6A23C;
    }
  }
}

/* 单词卡片 */
.word-card {
  background: $--light-bg;
  border: none;
  border-radius: 24rpx; // 12px * 2
  margin-bottom: $--spacing-md;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.08); // 2px * 2, 12px * 2

  .word-card-header {
    padding: $--spacing-md;
  }

  .word-title {
    align-items: center;
    text-align: center;
    font-size: 40rpx; // 20px * 2
    color: $--text-primary;
    margin: 0 0 $--spacing-base 0;
  }

  .pronunciation {
    display: flex;
    text-align: center;
    justify-content: center;
    align-items: center;
    gap: $--spacing-base;
    color: $--text-regular;
    margin-bottom: $--spacing-base;
    font-size: 36rpx; // 18px * 2
  }

  .word-type {
    margin: 0 auto $--spacing-base auto;
    font-size: 36rpx; // 18px * 2
	display: flex;
	justify-content: center;
	align-items: center;
  }

  .definition {
    text-align: center;
    color: $--text-regular;
    line-height: 1.6;
    margin: 0;
    font-size: 36rpx; // 18px * 2
    display: block; // text 默认是 inline
  }
}

/* 语法和例句卡片并排显示 */
.cards-flex-container {
  display: flex;
  gap: $--spacing-sm;
  margin-bottom: $--spacing-md;
}

/* 语法卡片 */
.grammar-card {
  background: $--light-bg;
  border: none;
  border-radius: 24rpx; // 12px * 2
  flex: 1;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.08); // 2px * 2, 12px * 2
  display: flex;
  flex-direction: column;

  .grammar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $--spacing-base;
    padding: $--spacing-md;

    h3 {
      color: $--text-primary;
      margin: 0;
      font-size: 40rpx; // 20px * 2
      font-weight: 600;
    }
  }

  .grammar-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: $--spacing-md;

    .pattern {
      color: $--text-primary;
      font-weight: 500;
      margin-bottom: $--spacing-sm;
      font-size: 36rpx; // 18px * 2
      line-height: 1.5;
      display: block;
    }

    .notes {
      color: $--text-regular;
      font-size: 36rpx; // 18px * 2
      line-height: 1.6;
      display: block;
    }
  }
}

/* 例句卡片 */
.example-card {
  background: $--light-bg;
  border: none;
  border-radius: 24rpx; // 12px * 2
  flex: 1;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.08); // 2px * 2, 12px * 2
  display: flex;
  flex-direction: column;

  .example-card-header {
    font-size: 40rpx; // 20px * 2
    font-weight: 600;
    padding: $--spacing-md;
  }

  .example-item {
    display: flex;
    gap: $--spacing-base;
    padding: $--spacing-md;

    &:not(:last-child) {
      margin-bottom: $--spacing-md;
      padding-bottom: $--spacing-md;
      border-bottom: 2rpx solid $--border-color; // 1px * 2
    }
  }

  .example-icon {
    font-size: 36rpx; // 18px * 2
    color: $--primary-green;
    margin-top: 6rpx; // 3px * 2
    flex-shrink: 0;
  }

  .example-content {
    flex: 1;
    display: flex;
    flex-direction: column;

    .chinese-text {
      color: $--text-primary;
      font-size: 36rpx; // 18px * 2
      margin-bottom: $--spacing-sm;
      margin-top: 0;
      line-height: 1.5;
      display: block;
    }

    .pinyin {
      color: $--text-regular;
      font-size: 36rpx; // 18px * 2
      margin-bottom: $--spacing-sm;
      margin-top: 0;
      line-height: 1.4;
      display: block;
    }

    .translation {
      color: $--text-secondary;
      font-size: 36rpx; // 18px * 2
      font-style: italic;
      margin-bottom: 0;
      margin-top: 0;
      line-height: 1.4;
      display: block;
    }
  }
}

/* 词组扩展区 */
.phrase-collapse {
  background: transparent;
  border: none;
  margin-bottom: $--spacing-lg;

  // uni-collapse-item 的 title 部分
  .uni-collapse-item__title {
    font-size: 32rpx; // 16px * 2
    font-weight: 600;
    color: $--text-primary;
    border: none;
    padding: $--spacing-md;
    background: $--light-bg;
    border-radius: 24rpx; // 12px * 2
    margin-bottom: $--spacing-base;
  }

  // uni-collapse-item 的 content 部分
  .uni-collapse-item__wrap {
    padding: 0;
  }

  .phrase-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: $--spacing-sm $--spacing-md;
    background: $--light-bg;
    border-radius: 36rpx; // 18px * 2
    margin-bottom: $--spacing-base;

    &:last-child {
      margin-bottom: 0;
    }

    .phrase-chinese {
      display: flex;
      flex-direction: column;

      .chinese {
        color: $--text-primary;
        font-size: 36rpx; // 18px * 2
        margin-bottom: $--spacing-base;
        display: block;
      }

      .pinyin {
        color: $--text-regular;
        font-size: 36rpx; // 18px * 2
        display: block;
      }
    }

    .phrase-english {
      color: $--text-primary;
      font-size: 36rpx; // 18px * 2
      text-align: right;
      display: block;
    }
  }
}

/* 底部导航 */
.footer-nav {
  position: fixed;
  bottom: 32rpx; // 16px * 2
  right: 32rpx; // 16px * 2
  display: flex;
  gap: $--spacing-md;
  background: rgba(255, 255, 255, 0.9);
  padding: $--spacing-base;
  border-radius: 40rpx; // 20px * 2
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.1); // 2px * 2, 12px * 2

  .nav-icon {
    font-size: 52rpx; // 26px * 2
    color: $--primary-green;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:active {
      transform: scale(1.1);
    }
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .word-learning-container {
    padding: $--spacing-base;
  }

  .cards-flex-container {
    flex-direction: column;
    gap: $--spacing-md;
  }

  .word-card {
    .word-title {
      font-size: 48rpx; // 24px * 2
    }
  }

  .phrase-collapse {
    .phrase-item {
      flex-direction: column;
      gap: $--spacing-sm;

      .phrase-english {
        text-align: left;
      }
    }
  }

  .footer-nav {
    bottom: 24rpx; // 12px * 2
    right: 24rpx; // 12px * 2
    padding: $--spacing-base;

    .nav-icon {
      font-size: 40rpx; // 20px * 2
    }
  }
}
</style> 