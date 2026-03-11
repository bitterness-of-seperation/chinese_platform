<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Right, 
  Plus, 
  Star, 
  Check, 
  Timer,
  Refresh,
  Warning,
  Close,
  Delete,
  Cellphone
} from '@element-plus/icons-vue'
import PageShell from '@/components/PageShell.vue'
import { ElMessage } from 'element-plus'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const book = ref('HSK-3')
const bookOptions = [
  { label: 'HSK-3', value: 'HSK-3' },
  { label: 'HSK-4', value: 'HSK-4' },
  { label: 'HSK-5', value: 'HSK-5' },
]

const loading = ref(false)
const totalWords = ref(0)
const learnedWords = ref(0)
const masteredWords = ref(0)
const todayNew = ref(0)
const todayReview = ref(0)
const todayMinutes = ref(0)
const todayOpen = ref(0)

// 动画计数器
const progressPercent = computed(() => {
  if (!totalWords.value) return 0
  return Math.min(100, Math.round((learnedWords.value / totalWords.value) * 1000) / 10)
})

const navigateToLearn = () => {
  if (!auth.user) {
    ElMessage.warning('请先去“我的”页登录，再开始学习')
    router.push('/profile')
    return
  }
  router.push('/vocabulary-learning')
}

async function loadStats() {
  loading.value = true
  try {
    await auth.init()
    if (!auth.user) {
      ElMessage.info('未登录：进度页只展示词库总量，登录后可同步学习进度')
    }

    const { count: wordsCount } = await supabase
      .from('words')
      .select('*', { count: 'exact', head: true })
    totalWords.value = wordsCount || 0

    if (auth.user) {
      const { count: uwCount } = await supabase
        .from('user_words')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', auth.user.id)
      learnedWords.value = uwCount || 0

      const { count: masteredCount } = await supabase
        .from('user_words')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', auth.user.id)
        .eq('status', 'mastered')
      masteredWords.value = masteredCount || 0

      const start = new Date()
      start.setHours(0, 0, 0, 0)
      const { data: records } = await supabase
        .from('learning_records')
        .select('correct, learned_at, word_id')
        .eq('user_id', auth.user.id)
        .gte('learned_at', start.toISOString())

      const recs = records || []
      todayReview.value = recs.length
      todayNew.value = new Set(recs.map((r: any) => r.word_id)).size
      todayMinutes.value = Math.min(180, Math.round(recs.length * 0.6))
      todayOpen.value = Math.min(99, Math.max(1, Math.round(recs.length / 3)))
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '加载统计失败')
  } finally {
    loading.value = false
  }
}

onMounted(loadStats)
</script>

<template>
  <PageShell title="词汇进度">
  <div class="vocabulary-progress">
    <!-- 顶部双卡片 -->
    <el-row :gutter="16" class="top-cards">
      <!-- 词书选择卡片 -->
      <el-col :span="12">
        <el-card class="book-card">
          <div class="card-content">
            <h3>Vocabulary</h3>
            <el-select v-model="book" class="book-select" color="var(--orange-color)">
              <el-option
                v-for="item in bookOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value">
              </el-option>
            </el-select>
            <div class="book-info">
              <span>6,085 words totally</span>
              <span class="start-learning" @click="navigateToLearn">
                <el-icon class="learn-icon"><Right /></el-icon>
                <span>start</span>
              </span>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 进度卡片 -->
      <el-col :span="12">
        <el-card class="progress-card">
          <div class="card-content">
            <h3>Progress</h3>
            <div class="progress-value">{{ progressPercent }}<span class="percent">%</span></div>
            <div class="book-info">
              <span v-if="auth.user">{{ learnedWords }} words learned / {{ masteredWords }} mastered</span>
              <span v-else>{{ totalWords }} words in library</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 打卡区 -->
    <el-card class="attendance-card">
      <div class="attendance-header">
        <div class="header-left">
          <h3>Daily Attendance</h3>
        </div>
        <el-icon class="info-icon"><Warning /></el-icon>
      </div>
      <div class="date-grid">
        <div class="date-item completed">
          <div class="date-day">Aug 9</div>
            <el-icon class="success-icon"><Check /></el-icon>
        </div>
        <div class="date-item completed">
          <div class="date-day">Aug 8</div>
            <el-icon class="success-icon"><Check /></el-icon>
        </div>
        <div class="date-item completed">
          <div class="date-day">Aug 7</div>
            <el-icon class="success-icon"><Check /></el-icon>
        </div>
        <div class="date-item missed">
          <div class="date-day">Aug 6</div>
            <el-icon class="missed-icon"><Close /></el-icon>
        </div>
      </div>
    </el-card>

    <!-- 今日数据区 -->
    <el-card class="today-card">
      <div class="today-header">
        <h3>Today</h3>
      </div>
      <div class="today-grid">
        <div class="today-item review">
          <div class="today-icon"><el-icon class="review-icon"><Refresh /></el-icon></div>
          <div class="today-data">
            <div class="today-value">{{ todayReview }}</div>
            <div class="today-label">复习单词</div>
          </div>
        </div>
        <div class="today-item new">
          <div class="today-icon"><el-icon class="new-icon"><Plus /></el-icon></div>
          <div class="today-data">
            <div class="today-value">{{ todayNew }}</div>
            <div class="today-label">新学单词</div>
          </div>
        </div>
        <div class="today-item star">
          <div class="today-icon"><el-icon class="star-icon"><Star /></el-icon></div>
          <div class="today-data">
            <div class="today-value">{{ learnedWords }}</div>
            <div class="today-label">收藏单词</div>
          </div>
        </div>
        <div class="today-item delete">
          <div class="today-icon"><el-icon class="delete-icon"><Delete /></el-icon></div>
          <div class="today-data">
            <div class="today-value">0</div>
            <div class="today-label">移除单词</div>
          </div>
        </div>
        <div class="today-item study">
          <div class="today-icon"><el-icon class="study-icon"><Timer /></el-icon></div>
          <div class="today-data">
            <div class="today-value">{{ todayMinutes }}<span class="unit">分钟</span></div>
            <div class="today-label">共学习</div>
          </div>
        </div>
        <div class="today-item app">
          <div class="today-icon"><el-icon class="app-icon"><Cellphone /></el-icon></div>
          <div class="today-data">
            <div class="today-value">{{ todayOpen }}<span class="unit">次</span></div>
            <div class="today-label">打开APP</div>
          </div>
        </div>
      </div>
    </el-card>

    <div class="heatmap-container">
      <span class="heatmap-title">Heatmap</span>
      <div class="heatmap-icon"></div>
    </div>
  </div>
  </PageShell>
</template>

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
  --card-hover-shadow: 0 6px 18px rgba(103, 194, 58, 0.12);
  
  /* 新增颜色 */
  --orange-color: #FF9A2F;
  --blue-color: #58A8FF;
  --red-color: #F56C6C;
  --cyan-color: #36cfc9;
  --purple-color: #9254de;
  --yellow-color: #faad14;
}

/* 间距系统 */
$--spacing-base: 4px;
$--spacing-sm: $--spacing-base * 2;
$--spacing-md: $--spacing-base * 4;
$--spacing-lg: $--spacing-base * 6;

/* 容器样式 */
.vocabulary-progress {
  min-height: 100vh;
  position: relative;
}

/* 卡片统一风格 */
.el-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  margin-bottom: $--spacing-md;
  transition: transform 0.3s, box-shadow 0.3s;
  will-change: transform, box-shadow;
  overflow: hidden;
  border: none;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: var(--card-hover-shadow);
  }
  
  :deep(.el-card__body) {
    padding: 16px;
  }
}

/* 顶部双卡片 */
.top-cards {
  margin-bottom: $--spacing-md;
  
  .el-card {
    height: 180px;
    display: flex;
    flex-direction: column;
    
    :deep(.el-card__body) {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: $--spacing-md;
    }
  }
}

/* 词书选择卡片 */
.book-card {
  padding-top: 0%;
  background: linear-gradient(135deg, #ffefba, #ffffff);
  
  .card-content {
    padding-top: 0%;
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
    z-index: 1;
    
    h3 {
      color: var(--text-primary);
      margin: 0 0 $--spacing-sm 0;
      font-size: 26px;
      font-weight: 600;
    }
    
    .book-select {
      width: 100%;
      margin-bottom: $--spacing-sm;
      
      :deep(.el-input__wrapper) {
        background-color: rgba(255, 154, 47, 0.1);
        box-shadow: none;
        border: none;
      }
      
      :deep(.el-input__inner) {
        color: var(--orange-color);
        font-size: 18px;
        font-weight: bold;
      }
      
      :deep(.el-select-dropdown__item.selected) {
        color: var(--orange-color);
        font-weight: bold;
      }
    }
    
    .book-info {
      color: var(--text-secondary);
      font-size: 14px;
      margin-bottom: auto;
    }
  }
  
  .start-learning {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $--spacing-sm $--spacing-md;
    border-radius: 8px;
    background-color: rgba(255, 154, 47, 0.2);
    color: var(--orange-color);
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.3s;
    margin-top: $--spacing-md;
    
    &:hover {
      background-color: rgba(255, 154, 47, 0.3);
      
      .learn-icon {
        transform: translateX(3px);
      }
    }
    
    .learn-icon {
      margin-right: $--spacing-sm;
      color: var(--orange-color);
      transition: transform 0.3s;
      will-change: transform;
    }
  }
}

/* 进度卡片 */
.progress-card {
  position: relative;
  background: linear-gradient(135deg, #e0f7d9, #ffffff);
  
  .card-content {
    padding-top: 0%;
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
    z-index: 1;
    
    h3 {
      color: var(--text-primary);
      margin: 0 0 $--spacing-sm 0;
      font-size: 26px;
      font-weight: 600;
    }
    
    .progress-value {
      color: var(--primary-color);
      font-size: 44px;
      font-weight: bold;
      margin: 0 0 $--spacing-sm 0;
      
      .percent {
        font-size: 69px;
        margin-left: 2px;
      }
    }
    
    .book-info {
      color: var(--text-secondary);
      font-size: 14px;
      margin-bottom: auto;
    }
  }
}

/* 打卡区卡片 */
.attendance-card {
  position: relative;
  background-color: white;
  
  .attendance-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $--spacing-md;
    
    .header-left {
      h3 {
        color: var(--text-primary);
        margin: 0;
        font-size: 26px;
        font-weight: 600;
      }
    }
    
    .info-icon {
      color: white;
      background-color: var(--primary-color);
      font-size: 14px;
      border-radius: 50%;
      padding: 4px;
      cursor: pointer;
    }
  }
  
  .date-grid {
    display: flex;
    justify-content: space-between;
    gap: $--spacing-sm;
    
    .date-item {
      text-align: center;
      flex: 1;
      padding: $--spacing-sm;
      border-radius: 10px;
      transition: all 0.3s ease;
      
      .date-day {
        font-size: 12px;
        color: var(--text-regular);
        margin-bottom: $--spacing-sm;
        background-color: transparent;
      }
      
      .date-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        margin: 0 auto;
        background-color: transparent;
        
        .success-icon {
          font-size: 18px;
          color: var(--primary-color);
        }
        
        .missed-icon {
          font-size: 18px;
          color: var(--red-color);
        }
      }
      
      &.completed {
        background-color: rgba(103, 194, 58, 0.15);
        
        .date-icon {
          background-color: rgba(255, 255, 255, 0.8);
        }
      }
      
      &.missed {
        background-color: rgba(245, 108, 108, 0.15);
        
        .date-icon {
          background-color: rgba(255, 255, 255, 0.8);
        }
      }
    }
  }
}

/* 今日数据卡片 */
.today-card {
  position: relative;
  background-color: white;
  
  .today-header {
    margin-bottom: $--spacing-md;
    
    h3 {
      color: var(--text-primary);
      margin: 0;
      font-size: 26px;
      font-weight: 600;
    }
  }
  
  .today-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $--spacing-md;
    
    .today-item {
      display: flex;
      align-items: center;
      padding: $--spacing-sm;
      border-radius: 10px;
      transition: all 0.3s ease;
      
      .today-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border-radius: 8px;
        margin-right: $--spacing-md;
        background-color: transparent;
      }
      
      .today-data {
        flex: 1;
        
        .today-value {
          font-size: 18px;
          font-weight: bold;
          color: var(--text-primary);
          line-height: 1.2;
          
          .unit {
            font-size: 12px;
            font-weight: normal;
            margin-left: 2px;
            color: var(--text-secondary);
          }
        }
        
        .today-label {
          font-size: 13px;
          color: var(--text-secondary);
        }
      }
      
      .review-icon {
        color: var(--blue-color);
        font-size: 20px;
      }
      
      .new-icon {
        color: var(--primary-color);
        font-size: 20px;
      }
      
      .star-icon {
        color: var(--orange-color);
        font-size: 20px;
      }
      
      .delete-icon {
        color: var(--red-color);
        font-size: 20px;
      }
      
      .study-icon {
        color: var(--cyan-color);
        font-size: 20px;
      }
      
      .app-icon {
        color: var(--purple-color);
        font-size: 20px;
      }
      
      &.review {
        background-color: rgba(88, 168, 255, 0.15);
      }
      
      &.new {
        background-color: rgba(103, 194, 58, 0.15);
      }
      
      &.star {
        background-color: rgba(255, 154, 47, 0.15);
      }
      
      &.delete {
        background-color: rgba(245, 108, 108, 0.15);
      }
      
      &.study {
        background-color: rgba(54, 207, 201, 0.15);
      }
      
      &.app {
        background-color: rgba(146, 84, 222, 0.15);
      }
    }
  }
}

/* Heatmap底部容器 */
.heatmap-container {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 14px;
  margin: $--spacing-md 0;
  opacity: 0.8;
  
  .heatmap-title {
    margin-right: $--spacing-sm;
  }
  
  .heatmap-icon {
    width: 16px;
    height: 16px;
    background-color: var(--orange-color);
    border-radius: 4px;
  }
}

/* 动画 */
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .vocabulary-progress {
    padding: $--spacing-sm;
  }
  
  .top-cards {
    .el-col {
      width: 100%;
      margin-bottom: $--spacing-md;
      
      &:last-child {
        margin-bottom: 0;
      }
    }
    
    .el-card {
      height: auto; // 移动端高度自适应
      
      :deep(.el-card__body) {
        padding: $--spacing-md;
      }
    }
  }
  
  .book-card {
    .card-content {
      .book-select {
        :deep(.el-input__inner) {
          font-size: 16px;
        }
      }
      
      .book-info {
        margin-bottom: $--spacing-md;
      }
    }
  }
  
  .progress-card {
    .card-content {
      .progress-value {
        font-size: 28px;
      }
    }
  }
  
  .attendance-card {
    .date-grid {
      flex-wrap: wrap;
      
      .date-item {
        flex: 0 0 calc(20% - 8px);
      }
    }
  }
  
  .today-card {
    .today-grid {
      grid-template-columns: 1fr;
      gap: $--spacing-sm;
    }
  }
}
</style> 