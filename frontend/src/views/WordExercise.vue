<template>
  <PageShell title="词汇练习" :bg-color="isDarkMode ? '#2C3E50' : '#67C23A'" :bg-opacity="0.10">
    <template #header-right>
      <button class="header-icon" type="button" :class="{ collected: isCollected }" @click="toggleCollect" aria-label="收藏">
        <el-icon><Collection /></el-icon>
      </button>
    </template>

  <div class="word-exercise-advanced" :class="{ 'dark-mode': isDarkMode }">

    <!-- 2. 单词展示区 -->
    <div class="word-display">
      <!-- 图片容器 -->
      <div 
        class="image-container" 
        v-if="!showPlaceholder"
      >
        <img 
          src="../assets/image.png" 
          @error="handleImageError"
          alt="单词插图"
        >
        <div class="image-meta">
          <div 
            class="voice-icon-wrapper" 
            @click="playAudio"
          >
            <el-icon class="voice-icon" :class="{ 'is-playing': isPlaying }">
              <Promotion />
            </el-icon>
            <div class="voice-ripple" v-if="isPlaying"></div>
          </div>
        </div>
      </div>
      <div class="image-placeholder" v-else>
        <el-icon><Picture /></el-icon>
      </div>

      <!-- 英文释义 -->
      <div class="english-definition">
        {{ wordData?.definition || '—' }}
      </div>
    </div>

    <!-- 3. 中文选项区 -->
    <el-card class="options-card">
      <div 
        v-for="(opt, idx) in options" 
        :key="idx"
        class="option-item"
        :class="{ 
          'selected': selectedIdx === idx,
          'correct': showAnswer && idx === correctIdx,
          'incorrect': showAnswer && selectedIdx === idx && idx !== correctIdx
        }"
        @click="selectOption(idx)"
      >
        <div class="option-icon">
          <el-icon v-if="showAnswer && idx === correctIdx" class="correct-icon">
            <Select />
          </el-icon>
          <el-icon v-else-if="showAnswer && selectedIdx === idx && idx !== correctIdx" class="error-icon">
            <CircleClose />
          </el-icon>
          <el-icon v-else-if="selectedIdx === idx">
            <Select />
          </el-icon>
          <el-icon v-else>
            <CircleCheck />
          </el-icon>
        </div>
        <div class="option-content">
          <p class="chinese-opt">{{ opt.chinese }}</p>
          <p class="example" v-if="opt.example">{{ opt.example }}</p>
        </div>
        <div 
          class="option-voice-wrapper" 
          @click.stop="playOptionAudio(idx)"
        >
          <el-icon class="option-voice">
            <Headset />
          </el-icon>
        </div>
      </div>
    </el-card>

    <!-- 4. 答案与导航区 -->
    <div class="control-area">
      <el-button class="show-answer" @click="toggleAnswer">
        <el-icon><Key /></el-icon>
        <span>{{ showAnswer ? '隐藏答案' : '显示答案' }}</span>
      </el-button>
      
      <transition name="slide-fade">
        <div v-if="showAnswer" class="answer-box">
          <p><b>正确选项：</b>{{ options[correctIdx]?.chinese }}</p>
          <p><b>详细解释：</b>{{ wordData?.etymology || '—' }}</p>
        </div>
      </transition>
      
      <el-button class="next-btn" type="success" @click="nextWord">
        <span>下一词</span>
        <el-icon><Right /></el-icon>
      </el-button>
      <el-button class="next-btn" plain @click="loadQuestion">换一题</el-button>
    </div>
    
    <!-- 5. 底部工具栏 -->
    <div class="toolbar">
      <el-button 
        circle 
        size="small" 
        @click="toggleDarkMode"
        :class="{ 'active': isDarkMode }"
      >
        <el-icon>
          <Moon v-if="isDarkMode" />
          <Sunny v-else />
        </el-icon>
      </el-button>
    </div>
  </div>
  </PageShell>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  Collection,
  Promotion,
  Headset,
  Select,
  CircleCheck,
  CircleClose,
  Key,
  Right,
  Picture,
  Moon,
  Sunny
} from '@element-plus/icons-vue'
import PageShell from '@/components/PageShell.vue'
import { ElMessage } from 'element-plus'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

// 状态管理
const selectedIdx = ref<number | null>(null)
const showAnswer = ref(false)
const isCollected = ref(false)
const isPlaying = ref(false)
const showPlaceholder = ref(false)
const isDarkMode = ref(false)
const correctIdx = ref(0) // 假设第一个选项是正确答案

type WordRow = {
  id: string
  word: string
  pinyin: string
  type: string
  level: string
  definition: string
  etymology: string | null
  examples: string[]
  synonyms: string[]
  antonyms: string[]
}

const wordData = ref<WordRow | null>(null)
const options = ref<{ id: string; chinese: string; example?: string }[]>([])

// 方法定义
const toggleCollect = () => {
  isCollected.value = !isCollected.value
  ElMessage({
    message: isCollected.value ? '已加入收藏' : '已取消收藏',
    type: 'success'
  })
}

const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement
  if (target) {
    target.style.display = 'none'
  }
  showPlaceholder.value = true
  ElMessage.warning('图片加载失败，已显示占位图')
}

const playAudio = () => {
  isPlaying.value = true
  // 模拟音频播放
  setTimeout(() => {
    isPlaying.value = false
  }, 2000)
  ElMessage({
    message: `正在播放"${wordData.value?.word || ''}"的发音`,
    type: 'success'
  })
}

const playOptionAudio = (idx: number) => {
  ElMessage({
    message: `正在播放"${options.value[idx]?.chinese || ''}"的发音`,
    type: 'success'
  })
}

const selectOption = (idx: number) => {
  if (!showAnswer.value) {
    selectedIdx.value = idx
  }
}

const toggleAnswer = () => {
  showAnswer.value = !showAnswer.value
}

const nextWord = () => {
  if (selectedIdx.value === null) {
    ElMessage.warning('请先选择一个答案')
    return
  }
  
  showAnswer.value = true
  
  if (selectedIdx.value === correctIdx.value) {
    ElMessage({
      message: '回答正确！',
      type: 'success'
    })
  } else {
    ElMessage({
      message: '回答错误，请参考解析',
      type: 'error'
    })
  }

  // 记录学习（登录用户才写入）
  void recordLearning(selectedIdx.value === correctIdx.value)
}

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
  ElMessage({
    message: `已切换到${isDarkMode.value ? '夜间' : '日间'}模式`,
    type: 'success'
  })
}

// 生命周期钩子
onMounted(() => {
  void auth.init()
  void loadQuestion()
})

async function loadQuestion() {
  selectedIdx.value = null
  showAnswer.value = false
  showPlaceholder.value = false
  isCollected.value = false

  const { count } = await supabase.from('words').select('*', { count: 'exact', head: true })
  const total = count || 0
  if (!total) {
    ElMessage.warning('words 表暂无数据，请先导入词库')
    return
  }

  const correctOffset = Math.max(0, Math.floor(Math.random() * Math.max(1, total - 1)))
  const { data: correctArr, error: correctErr } = await supabase
    .from('words')
    .select('*')
    .range(correctOffset, correctOffset)
    .limit(1)
  if (correctErr) {
    ElMessage.error(correctErr.message)
    return
  }
  const correctWord = (correctArr?.[0] as WordRow) || null
  if (!correctWord) return
  wordData.value = correctWord

  // 取 3 个干扰项（随机 range 简化版）
  const distractors: WordRow[] = []
  for (let i = 0; i < 3; i++) {
    const off = Math.max(0, Math.floor(Math.random() * Math.max(1, total - 1)))
    const { data } = await supabase.from('words').select('*').range(off, off).limit(1)
    const w = (data?.[0] as WordRow) || null
    if (w && w.id !== correctWord.id && !distractors.find(d => d.id === w.id)) distractors.push(w)
  }
  while (distractors.length < 3) distractors.push(correctWord) // 兜底，避免空数组

  const all = [correctWord, ...distractors].slice(0, 4)
  // 洗牌
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[all[i], all[j]] = [all[j], all[i]]
  }

  options.value = all.map(w => ({ id: w.id, chinese: w.word, example: w.pinyin }))
  correctIdx.value = options.value.findIndex(o => o.id === correctWord.id)
}

async function recordLearning(correct: boolean) {
  if (!wordData.value) return
  await auth.init()
  if (!auth.user) return

  const userId = auth.user.id
  const wordId = wordData.value.id

  await supabase.from('learning_records').insert({
    user_id: userId,
    word_id: wordId,
    correct,
    learned_at: new Date().toISOString(),
  })

  // upsert user_words
  const { data: existing } = await supabase
    .from('user_words')
    .select('id, status, review_count, correct_count')
    .eq('user_id', userId)
    .eq('word_id', wordId)
    .maybeSingle()

  if (!existing) {
    await supabase.from('user_words').insert({
      user_id: userId,
      word_id: wordId,
      status: correct ? 'learning' : 'new',
      review_count: 1,
      correct_count: correct ? 1 : 0,
      last_reviewed: new Date().toISOString(),
    })
  } else {
    const nextReview = (existing as any).review_count + 1
    const nextCorrect = (existing as any).correct_count + (correct ? 1 : 0)
    const nextStatus =
      (existing as any).status === 'mastered'
        ? 'mastered'
        : nextCorrect >= 3
          ? 'mastered'
          : 'learning'

    await supabase
      .from('user_words')
      .update({
        review_count: nextReview,
        correct_count: nextCorrect,
        status: nextStatus,
        last_reviewed: new Date().toISOString(),
      })
      .eq('id', (existing as any).id)
  }
}
</script>

<style lang="scss" scoped>
/* CSS变量定义 - 支持夜间模式 */
:root {
  --primary-color: #5B8C5A;
  --primary-light: rgba(91, 140, 90, 0.1);
  --primary-hover: rgba(91, 140, 90, 0.2);
  --error-color: #F56C6C;
  --warning-color: #E6A23C;
  --text-primary: #303133;
  --text-secondary: #606266;
  --text-tertiary: #909399;
  --bg-color: #FFFFFF;
  --card-bg: rgba(255, 255, 255, 0.92);
  --border-color: #EBEEF5;
  --transition-time: 0.3s;
  --box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
  --border-radius: 12px;
}

.dark-mode {
  --primary-color: #67C23A;
  --primary-light: rgba(103, 194, 58, 0.1);
  --primary-hover: rgba(103, 194, 58, 0.2);
  --text-primary: #E5EAF3;
  --text-secondary: #A3A6AD;
  --text-tertiary: #6B6E73;
  --bg-color: #1D1E1F;
  --card-bg: rgba(37, 38, 43, 0.92);
  --border-color: #4C4D4F;
  --box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
}

/* 容器样式 */
.word-exercise-advanced {
  min-height: 100vh;
  position: relative;
  color: var(--text-primary);
  
  &.dark-mode {
    background-color: var(--bg-color);
  }
}

.header-icon {
  width: 40px;
  height: 40px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(15, 23, 42, 0.08);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.header-icon:active {
  transform: scale(0.98);
}

.header-icon.collected {
  color: var(--warning-color);
}

/* 单词展示区 */
.word-display {
  width: 90%;
  margin: 0 auto;
}

/* 图片容器 */
.image-container {
  position: relative;
  height: 320px;
  margin: 0 auto;
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: var(--box-shadow);
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s;
    
    &:hover {
      transform: scale(1.03);
    }
  }
  
  .image-meta {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
    padding: 12px;
    display: flex;
    align-items: center;
    
    .voice-icon-wrapper {
      position: relative;
      margin-right: 12px;
      cursor: pointer;
      
      .voice-icon {
        color: white;
        font-size: 24px;
        z-index: 2;
        position: relative;
        transition: all var(--transition-time);
        
        &:hover {
          transform: scale(1.2);
          color: var(--primary-color);
        }
        
        &.is-playing {
          color: var(--primary-color);
        }
      }
      
      .voice-ripple {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 24px;
        height: 24px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        z-index: 1;
        animation: ripple 2s infinite;
        
        &::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 24px;
          height: 24px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          animation: ripple 2s infinite 0.3s;
        }
      }
    }
    
    .word-info {
      display: flex;
      flex-direction: column;
      
      .chinese-text {
        font-size: 28px;
        font-weight: 600;
        color: white;
        margin-bottom: 4px;
      }
      
      .pinyin {
        color: rgba(255, 255, 255, 0.9);
        font-size: 16px;
        letter-spacing: 1px;
      }
    }
  }
}

/* 图片占位符 */
.image-placeholder {
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.03);
  border-radius: var(--border-radius);
  margin: 0 auto;
  
  .el-icon {
    font-size: 48px;
    color: var(--text-tertiary);
  }
}

/* 英文释义 */
.english-definition {
  margin: 16px auto;
  padding: 12px 16px;
  background: rgba(245, 242, 235, 0.6);
  border-left: 3px solid #8C6E5B;
  font-style: italic;
  color: #5A4B41;
  border-radius: 0 var(--border-radius) var(--border-radius) 0;
  font-size: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url("data:image/png;base64,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");
    opacity: 0.03;
    pointer-events: none;
  }
}

/* 选项卡片 */
.options-card {
  width: 90%;
  margin: 20px auto;
  background: var(--card-bg);
  border-radius: var(--border-radius);
  box-shadow: var(--box-shadow);
  border: none;
  
  :deep(.el-card__body) {
    padding: 12px;
  }
  
  .option-item {
    display: flex;
    align-items: center;
    padding: 16px;
    margin: 12px 0;
    border-radius: 8px;
    transition: all var(--transition-time);
    cursor: pointer;
    position: relative;
    border: 1px solid transparent;
    
    &:hover {
      background: var(--primary-light);
      transform: translateY(-2px);
    }
    
    &.selected {
      background: var(--primary-light);
      border-color: var(--primary-color);
      box-shadow: 0 2px 8px var(--primary-light);
    }
    
    &.correct {
      background: rgba(103, 194, 58, 0.1);
      border-color: #67C23A;
    }
    
    &.incorrect {
      background: rgba(245, 108, 108, 0.1);
      border-color: var(--error-color);
    }
    
    .option-icon {
      margin-right: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      
      .el-icon {
        font-size: 22px;
        color: var(--primary-color);
        transition: all var(--transition-time);
        
        &.correct-icon {
          color: #67C23A;
          animation: grow 0.5s ease-out;
        }
        
        &.error-icon {
          color: var(--error-color);
        }
      }
    }
    
    .option-content {
      flex: 1;
      
      .chinese-opt {
        font-size: 18px;
        font-weight: 500;
        margin: 0 0 4px 0;
        color: var(--text-primary);
      }
      
      .example {
        color: var(--text-tertiary);
        font-size: 14px;
        margin: 0;
      }
    }
    
    .option-voice-wrapper {
      padding: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      .option-voice {
        color: var(--text-tertiary);
        font-size: 20px;
        transition: all var(--transition-time);
        
        &:hover {
          color: var(--primary-color);
          transform: scale(1.1);
        }
      }
    }
  }
}

/* 控制区 */
.control-area {
  margin: 30px auto;
  width: 90%;
  display: flex;
  flex-direction: column;
  position: relative;
  
  .show-answer {
    align-self: center;
    background: transparent;
    color: var(--primary-color);
    border: 1px solid var(--primary-color);
    padding: 10px 20px;
    
    .el-icon {
      margin-right: 8px;
      transition: transform 0.5s;
      animation: float 2s infinite;
    }
    
    &:hover .el-icon {
      animation: none;
      transform: translateY(-3px);
    }
  }
  
  .answer-box {
    margin-top: 16px;
    padding: 16px;
    background: var(--primary-light);
    border-radius: var(--border-radius);
    
    p {
      margin: 8px 0;
      color: var(--text-secondary);
      line-height: 1.6;
      
      b {
        color: var(--primary-color);
        font-weight: 500;
      }
    }
  }
  
  .next-btn {
    margin-top: 20px;
    align-self: flex-end;
    background: var(--primary-color);
    border-color: var(--primary-color);
    
    .el-icon {
      margin-left: 8px;
      transition: transform var(--transition-time);
    }
    
    &:hover .el-icon {
      transform: translateX(4px);
      animation: pulse 1.5s infinite;
    }
  }
}

/* 底部工具栏 */
.toolbar {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 10;
  
  .el-button {
    background: var(--card-bg);
    color: var(--text-tertiary);
    border-color: var(--border-color);
    box-shadow: var(--box-shadow);
    transition: all var(--transition-time);
    
    &:hover, &.active {
      color: var(--primary-color);
      transform: translateY(-2px);
    }
    
    &.active {
      background: var(--primary-light);
    }
  }
}

/* 动画 */
@keyframes ripple {
  0% {
    width: 24px;
    height: 24px;
    opacity: 1;
  }
  100% {
    width: 60px;
    height: 60px;
    opacity: 0;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
  100% {
    opacity: 1;
  }
}

@keyframes grow {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 过渡效果 */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .image-container, .image-placeholder { height: 220px; }
  
  .options-card,
  .english-definition,
  .control-area,
  .word-display {
    width: 95%;
  }
  
  .option-item {
    padding: 12px !important;
    
    .option-content {
      .chinese-opt {
        font-size: 16px;
      }
    }
  }
  
  .english-definition {
    font-size: 14px;
  }
  
  .control-area {
    .show-answer, .next-btn {
      font-size: 14px;
    }
  }
}
</style> 