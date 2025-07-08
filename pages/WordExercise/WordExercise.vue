<template>
  <view class="word-exercise-container">
    <!-- 导航栏 -->
    <NavBar :title="'情景练习 ' + (currentIndex + 1) + '/' + totalExercises" />
    
    <!-- 背景 -->
    <OrganicBackground :color="'#67C23A'" :opacity="0.1" />
    
    <!-- 主要内容区域 -->
    <view class="content-area">
      <!-- 场景卡片 -->
      <view class="scene-card" v-if="currentExercise">
        <view class="card-content">
          <view class="scene-header">
            <text class="scene-title">情景对话</text>
            <text class="scene-progress">{{ currentIndex + 1 }}/{{ totalExercises }}</text>
    </view>
          <text class="scene-text">{{ currentExercise.context }}</text>
          <text class="scene-translation">{{ currentExercise.translation }}</text>
          <view class="blank-sentence">
            <text>{{ currentExercise.sentence }}</text>
          </view>
        </view>
      </view>

      <!-- 选项卡片 -->
      <view class="options-card" v-if="currentExercise">
        <view class="card-content">
          <text class="options-title">选择正确的词语</text>
          <view class="options-grid">
      <view 
              v-for="(opt, idx) in currentExercise.options" 
        :key="idx"
        class="option-item"
        :class="{ 
          'selected': selectedIdx === idx,
                'correct': showAnswer && opt.is_correct,
                'incorrect': showAnswer && selectedIdx === idx && !opt.is_correct
        }"
        @click="selectOption(idx)"
      >
        <view class="option-icon">
                <uni-icons 
                  v-if="showAnswer && opt.is_correct" 
                  type="checkbox-filled" 
                  size="24" 
                  color="#67C23A"
                />
                <uni-icons 
                  v-else-if="showAnswer && selectedIdx === idx && !opt.is_correct" 
                  type="closeempty" 
                  size="24" 
                  color="#F56C6C"
                />
                <uni-icons 
                  v-else
                  type="circle" 
                  size="24" 
                  :color="selectedIdx === idx ? '#67C23A' : '#DCDFE6'"
                />
              </view>
              <text class="option-text">{{ opt.text }}</text>
        </view>
        </view>
        </view>
      </view>

      <!-- 反馈卡片 -->
      <view class="feedback-card" v-if="showAnswer">
        <view class="card-content">
          <view class="feedback-header">
            <uni-icons 
              :type="isAnswerCorrect ? 'checkmarkempty' : 'closeempty'" 
              size="24" 
              :color="isAnswerCorrect ? '#67C23A' : '#F56C6C'"
            />
            <text class="feedback-title">{{ isAnswerCorrect ? '回答正确！' : '再试一次！' }}</text>
          </view>
          <text class="feedback-text">{{ selectedExplanation }}</text>
    </view>
      </view>
      
      <!-- 底部按钮 -->
      <view class="button-area">
        <button 
          class="action-button"
          :class="{ 'disabled': selectedIdx === null && !showAnswer }"
          @click="showAnswer ? nextExercise() : checkAnswer()"
        >
          {{ showAnswer ? '继续' : '检查' }}
      </button>
    </view>
    </view>

    <!-- 提示弹窗 -->
    <uni-popup ref="popup" type="message">
      <uni-popup-message 
        type="error"
        message="缺少词ID参数"
        :duration="2000"
      />
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import NavBar from '@/components/NavBar.vue'
import OrganicBackground from '@/components/OrganicBackground.vue'
import scenarioExerciseAI from '../../api/scenarioExerciseAI'
import { useUserStore } from '../../stores/user'
import { onLoad } from '@dcloudio/uni-app'

// 状态变量
const currentIndex = ref(0)
const exercises = ref([])
const currentExercise = ref(null)
const selectedIdx = ref(null)
const showAnswer = ref(false)
const selectedExplanation = ref('')
const isAnswerCorrect = ref(false)
const wordId = ref('')
const popup = ref(null)
const bookId = ref('') // 添加词书ID的ref

// 状态管理
const userStore = useUserStore()
const isDarkMode = ref(false)
const isLoading = ref(true)
const wordToExercise = ref('') // 当前要练习的词

// 计算属性
const totalExercises = computed(() => exercises.value.length)

// 方法定义
const goBack = () => {
  uni.navigateBack({
    delta: 1,
    fail: (e) => {
      console.error('navigateBack failed', e)
      uni.switchTab({
        url: '/pages/Home/Home'
      })
    }
  })
}

const loadExercises = async (words, bookId) => {
  isLoading.value = true
  
  try {
    uni.showLoading({ 
      title: '加载练习题...' 
    })
    
    // 如果只有一个单词，直接生成
    if (words.length === 1) {
      const result = await scenarioExerciseAI.generateScenarioExercise(words[0])
      if (result.success) {
        // 确保练习题包含word_id
        const exercise = {
          ...result.exercise,
          word_id: words[0] // 使用传入的word_id
        }
        exercises.value = [exercise]
        currentExercise.value = exercise
      } else {
        throw new Error(result.message || '生成练习题失败')
      }
    } else {
      // 批量生成
      const result = await scenarioExerciseAI.generateBatchExercises(words)
      if (result.success) {
        // 确保每个练习题都包含word_id
        const exercisesWithIds = result.exercises.map((exercise, index) => ({
          ...exercise,
          word_id: words[index] // 使用对应的word_id
        }))
        exercises.value = exercisesWithIds
        currentExercise.value = exercises.value[0]
      } else {
        throw new Error(result.message || '批量生成练习题失败')
      }
    }
    
    currentIndex.value = 0
  } catch (error) {
    console.error('加载练习题失败:', error)
    // 使用popup显示错误信息
    if (popup.value) {
      popup.value.open()
    }
    
    // 设置一个默认练习题，防止页面崩溃
    exercises.value = [{
      word: words[0] || '把',
      word_id: words[0] || '把', // 确保默认练习题也有word_id
      book_id: bookId,
      sentence: '他把牛奶打翻了。',
      blank_sentence: '他___牛奶打翻了。',
      translation: 'He knocked over the milk.',
      options: [
        { text: '把', is_correct: true, explanation: '"把"用于将动作的对象提前。' },
        { text: '被', is_correct: false, explanation: '"被"用于被动句，这里是主动句。' },
        { text: '从', is_correct: false, explanation: '"从"表示起点，不适合此句。' },
        { text: '向', is_correct: false, explanation: '"向"表示方向，不适合此句。' }
      ],
      hint: '使用"把"字句时，通常将动作的对象提前，后面接动作和结果。',
      context: '在厨房里，一个人不小心碰到了杯子。',
      level: 'HSK3'
    }]
    currentExercise.value = exercises.value[0]
  } finally {
    uni.hideLoading()
    isLoading.value = false
  }
}

// 获取练习题
async function fetchExercise() {
  try {
    const result = await uniCloud.callFunction({
      name: 'getWordList',
      data: {
        wordId: wordId.value
      }
    })
    
    if (!result.result.data || result.result.data.length === 0) {
  uni.showToast({
        title: '未找到词语信息',
    icon: 'none'
      })
      return
    }

    const exerciseResult = await scenarioExerciseAI({
      name: 'scenarioExerciseAI',
      data: {
        wordId: wordId.value
      }
    })

    if (exerciseResult.result) {
      exercises.value = [exerciseResult.result]
      currentExercise.value = exercises.value[0]
    } else {
  uni.showToast({
        title: '生成练习题失败',
    icon: 'none'
      })
    }
  } catch (error) {
    console.error('获取练习题失败:', error)
    uni.showToast({
      title: '获取练习题失败',
      icon: 'none'
    })
  }
}

// 选择选项
function selectOption(idx) {
  if (showAnswer.value) return
  selectedIdx.value = idx
}

// 检查答案
async function checkAnswer() {
  if (selectedIdx.value === null) return
  showAnswer.value = true
  const selectedOption = currentExercise.value.options[selectedIdx.value]
  isAnswerCorrect.value = selectedOption.is_correct
  selectedExplanation.value = selectedOption.explanation

  // 如果答对了，更新练习状态
  if (isAnswerCorrect.value) {
    try {
      const { result } = await uniCloud.callFunction({
        name: 'updateExerciseProgress',
        data: {
          word_id: currentExercise.value.word_id,
          user_id: userStore.userId,
          wordbook_id: bookId.value,
          correct: true
        }
      })
      
      if (result.code === 200) {
        console.log('练习状态更新成功')
      } else {
        console.error('练习状态更新失败:', result.message)
      }
    } catch (error) {
      console.error('更新练习状态出错:', error)
    }
  }
}

// 下一题
function nextExercise() {
  if (currentIndex.value < exercises.value.length - 1) {
    currentIndex.value++
    currentExercise.value = exercises.value[currentIndex.value]
    resetExercise()
  } else {
    uni.showToast({
      title: '练习完成！',
      icon: 'success'
    })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }
}

// 重置练习状态
function resetExercise() {
  selectedIdx.value = null
  showAnswer.value = false
  selectedExplanation.value = ''
  isAnswerCorrect.value = false
}

// 从用户进度中获取要练习的单词
const getWordsToExercise = async (bookId) => {
  try {
    if (!bookId) {
      console.error('词书ID为空')
      uni.showModal({
        title: '提示',
        content: '请先选择词书',
        showCancel: false,
        success: () => {
          uni.navigateBack()
        }
      })
      return []
    }
    
    uni.showLoading({ 
      title: '获取词汇列表...' 
    })
    
    // 确保用户已登录
    if (!userStore.isLoggedIn || !userStore.userId) {
      uni.hideLoading()
      uni.showModal({
        title: '提示',
        content: '请先登录后再进行练习',
        showCancel: false,
        success: () => {
          uni.navigateTo({
            url: '/pages/login/login'
          })
        }
      })
      return []
    }
    
    // 调试日志
    console.log('获取练习词汇，参数:', {
      user_id: userStore.userId,
      book_id: bookId
    })
    
    // 获取用户已学习的词
    const { result } = await uniCloud.callFunction({
      name: 'getWordbookProgress',
      data: {
        user_id: userStore.userId,
        book_id: bookId
      }
    })
    
    // 调试日志
    console.log('getWordbookProgress返回结果:', result)
    
    uni.hideLoading()
    
    if (result.code === 200 && result.data) {
      const learnedWords = result.data.learned_words || []
      const exercisedWords = result.data.is_exercised || []
      
      // 调试日志
      console.log('已学习的词:', learnedWords)
      console.log('已练习的词:', exercisedWords)
      
      // 如果还没有学习任何词汇
      if (learnedWords.length === 0) {
        return new Promise((resolve) => {
          uni.showModal({
            title: '提示',
            content: '您还没有学习任何词汇，是否现在去学习？',
            success: (res) => {
              if (res.confirm) {
                uni.navigateTo({
                  url: `/pages/WordLearning/WordLearning?book_id=${bookId}`
                })
              } else {
                uni.navigateBack()
              }
              resolve([])
            }
          })
        })
      }
      
      // 过滤出未练习的词汇
      const wordsToExercise = learnedWords.filter(wordId => !exercisedWords.includes(wordId))
      console.log('待练习的词:', wordsToExercise)
      
      // 如果所有词都已练习过
      if (wordsToExercise.length === 0) {
        return new Promise((resolve) => {
          uni.showModal({
            title: '提示',
            content: '您已完成所有单词的练习，是否重新练习所学单词？',
            success: (res) => {
              if (res.confirm) {
                // 随机选择10个已学习的词重新练习
                const shuffled = shuffleArray([...learnedWords])
                resolve(shuffled.slice(0, 10))
              } else {
                uni.navigateBack()
                resolve([])
              }
            }
          })
        })
      }
      
      // 随机选择最多10个未练习的词
      const shuffled = shuffleArray([...wordsToExercise])
      return shuffled.slice(0, 10)
    }
    
    // 返回错误处理
    uni.showModal({
      title: '错误',
      content: result.message || '获取词汇列表失败',
      showCancel: false,
      success: () => {
        uni.navigateBack()
      }
    })
    return []
    
  } catch (error) {
    console.error('获取练习词汇失败:', error)
    uni.hideLoading()
    uni.showModal({
      title: '错误',
      content: '获取练习词汇失败，请稍后重试',
      showCancel: false,
      success: () => {
        uni.navigateBack()
      }
    })
    return []
  }
}

// 工具函数：随机打乱数组
function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Element Plus icons mapping to uni-icons
const iconMap = {
  Back: 'left',
  Success: 'checkmarkempty',
  Warning: 'closeempty',
  Select: 'checkbox-filled',
  CircleClose: 'closeempty',
  Circle: 'circle'
}

// 生命周期钩子
onMounted(async () => {
  // 检查用户登录状态
  if (!userStore.isLoggedIn) {
    uni.showModal({
      title: '提示',
      content: '请先登录后再进行练习',
      showCancel: false,
      success: () => {
        uni.navigateTo({
          url: '/pages/login/login'
        })
      }
    })
    return
  }
})

// 页面加载
onLoad(async (options) => {
  console.log('页面加载参数:', options)
  console.log('当前用户ID:', userStore.userId)
  
  // 检查词书ID
  if (!options.book_id) {
    console.log('缺少词书ID，准备选择词书')
    // 缺少词书ID时，显示词书选择
    selectWordbook()
    return
  }
  
  // 保存词书ID
  bookId.value = options.book_id
  console.log('词书ID:', bookId.value)
  
  try {
    // 获取用户进度
    const words = await getWordsToExercise(bookId.value)
    console.log('获取到的词语列表:', words)
    
    if (words && words.length > 0) {
      // 加载练习题
      await loadExercises(words, bookId.value)
    } else {
      uni.showModal({
        title: '提示',
        content: '没有可练习的词语，请先去学习一些词语',
        showCancel: false,
        success: () => {
          uni.navigateTo({
            url: `/pages/WordLearning/WordLearning?book_id=${bookId.value}`
          })
        }
      })
    }
  } catch (error) {
    console.error('加载练习失败:', error)
    uni.showModal({
      title: '错误',
      content: error.message || '加载练习失败，请稍后重试',
      showCancel: false,
      success: () => {
        uni.navigateBack()
      }
    })
  }
})

// 更新词书选择功能，优化用户体验
const selectWordbook = async () => {
  try {
    uni.showLoading({ 
      title: '获取词书列表...' 
    })
    
    // 确保用户已登录
    if (!userStore.isLoggedIn || !userStore.userId) {
      uni.hideLoading()
      uni.showModal({
        title: '提示',
        content: '请先登录后再进行练习',
        showCancel: false,
        success: () => {
          uni.navigateTo({
            url: '/pages/login/login'
          })
        }
      })
      return
    }
    
    // 获取所有词书列表（不传user_id参数，这样会返回所有词书）
    const { result } = await uniCloud.callFunction({
      name: 'getWordbooks'
    })

    uni.hideLoading()

    if (result.code === 200 && Array.isArray(result.data)) {
      // 如果没有任何词书，显示错误提示
      if (result.data.length === 0) {
        uni.showModal({
          title: '提示',
          content: '系统中还没有任何词书，请联系管理员添加',
          showCancel: false,
          success: () => {
            uni.navigateBack()
          }
        })
        return
      }

      // 构建词书选择列表
      const wordbookItems = result.data.map(book => ({
        text: `${book.name}（${book.total_words || 0}词）`,
        value: book._id
      }))

      // 显示词书选择
      uni.showActionSheet({
        itemList: wordbookItems.map(item => item.text),
        success: async (res) => {
          const selectedBookId = wordbookItems[res.tapIndex].value
          
          // 先检查用户是否已经开始学习这本词书
          const { result: progressResult } = await uniCloud.callFunction({
            name: 'getWordbookProgress',
            data: {
              user_id: userStore.userId,
              book_id: selectedBookId
            }
          })
          
          if (progressResult.code === 200 && progressResult.data && progressResult.data.learned_words?.length > 0) {
            // 如果已经有学习记录，直接进入练习
            uni.redirectTo({
              url: `/pages/WordExercise/WordExercise?book_id=${selectedBookId}`
            })
          } else {
            // 如果还没有学习记录，提示用户先去学习
            uni.showModal({
              title: '提示',
              content: '您还没有学习这本词书中的词汇，是否现在去学习？',
              success: (res) => {
                if (res.confirm) {
                  // 跳转到词汇学习页面，并传递词书ID
                  uni.navigateTo({
                    url: `/pages/WordLearning/WordLearning?book_id=${selectedBookId}`
                  })
                } else {
                  // 用户取消，返回上一页
                  uni.navigateBack()
                }
              }
            })
          }
        },
        fail: () => {
          // 用户取消选择，返回上一页
          uni.navigateBack()
        }
      })
    } else {
      throw new Error(result.message || '获取词书失败')
    }
  } catch (error) {
    console.error('获取词书失败:', error)
    uni.hideLoading()
    
    uni.showModal({
      title: '错误',
      content: '获取词书列表失败，请稍后再试',
      showCancel: false,
      success: () => {
        uni.navigateBack()
      }
    })
  }
}

// 监听当前练习变化，重置选中状态
watch(currentIndex, () => {
  selectedIdx.value = null
  showAnswer.value = false
})
</script>

<style lang="scss" scoped>
.word-exercise-container {
  min-height: 100vh;
  padding: 0 20rpx;
  padding-top: var(--status-bar-height);
  box-sizing: border-box;
  background-color: transparent;
  
  .content-area {
    padding: 32rpx;
    padding-bottom: 200rpx; /* 底部留出空间 */
    display: flex;
    flex-direction: column;
    gap: 24rpx;
  }
}

/* 场景卡片样式 */
.scene-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  overflow: hidden;
  backdrop-filter: blur(10px);
  
  .card-content {
    padding: 32rpx;
  }
  
  .scene-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;
  }
  
  .scene-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333333;
  }
  
  .scene-progress {
    font-size: 28rpx;
    color: #999999;
  }
  
  .scene-text {
    font-size: 32rpx;
    color: #333333;
    line-height: 1.6;
    margin-bottom: 16rpx;
  }
  
  .scene-translation {
    font-size: 28rpx;
    color: #666666;
    font-style: italic;
    margin-bottom: 24rpx;
  }
  
  .blank-sentence {
    font-size: 32rpx;
    color: #333333;
    line-height: 1.6;
    padding: 24rpx;
    background: rgba(103, 194, 58, 0.1);
    border-radius: 12rpx;
  }
}

/* 选项卡片样式 */
.options-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(10px);
  
  .card-content {
    padding: 32rpx;
  }
  
  .options-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333333;
    margin-bottom: 24rpx;
  }
  
  .options-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24rpx;
  }
  
  .option-item {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 24rpx;
    background: rgba(245, 247, 250, 0.8);
    border-radius: 16rpx;
    border: 2rpx solid transparent;
    transition: all 0.3s ease;
    
    &.selected {
      background: rgba(103, 194, 58, 0.1);
      border-color: #67C23A;
    }
    
    &.correct {
      background: rgba(103, 194, 58, 0.1);
      border-color: #67C23A;
    }
    
    &.incorrect {
      background: rgba(245, 108, 108, 0.1);
      border-color: #F56C6C;
    }
    
    .option-text {
      font-size: 32rpx;
      color: #333333;
      flex: 1;
    }
  }
}

/* 反馈卡片样式 */
.feedback-card {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(10px);
  
  .card-content {
    padding: 32rpx;
  }
  
  .feedback-header {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 16rpx;
  }
  
  .feedback-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333333;
  }
  
  .feedback-text {
    font-size: 28rpx;
    color: #666666;
    line-height: 1.6;
  }
}

/* 按钮样式 */
.button-area {
  margin-top: 32rpx;
  padding: 0 32rpx;
  
  .action-button {
    width: 100%;
    height: 88rpx;
    line-height: 88rpx;
    text-align: center;
    background: #67C23A;
    color: #FFFFFF;
    font-size: 32rpx;
    font-weight: 500;
    border-radius: 44rpx;
    border: none;
    
    &.disabled {
      background: #DCDFE6;
      color: #909399;
    }
  }
}
</style> 