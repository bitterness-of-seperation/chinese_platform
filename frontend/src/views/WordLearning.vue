<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { 
  Star, 
  Headset, 
  ChatLineRound, 
  Refresh, 
  ArrowRight, 
} from '@element-plus/icons-vue'
import PageShell from '@/components/PageShell.vue'
import { ElMessage } from 'element-plus'
import { supabase, vocabulary } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const activeNames = ref(['phrases'])
const isStarred = ref(false)
const loading = ref(false)

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
const pronunciation = computed(() => wordData.value?.pinyin || '')

const toggleStar = async () => {
  await auth.init()
  if (!auth.user) {
    ElMessage.warning('请先去“我的”页登录，再收藏到生词本')
    router.push('/profile')
    return
  }
  if (!wordData.value) return

  loading.value = true
  try {
    if (!isStarred.value) {
      const { error } = await vocabulary.addWord(auth.user.id, wordData.value.id)
      if (error) throw error
      isStarred.value = true
      ElMessage.success('已加入生词本')
    } else {
      const { error } = await supabase
        .from('user_words')
        .delete()
        .eq('user_id', auth.user.id)
        .eq('word_id', wordData.value.id)
      if (error) throw error
      isStarred.value = false
      ElMessage.success('已从生词本移除')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败')
  } finally {
    loading.value = false
  }
}

async function loadRandomWord() {
  loading.value = true
  try {
    const { count } = await supabase
      .from('words')
      .select('*', { count: 'exact', head: true })
    const total = count || 0
    if (!total) {
      ElMessage.warning('words 表暂无数据，请先导入词库')
      wordData.value = null
      return
    }

    const from = Math.max(0, Math.floor(Math.random() * Math.max(1, total - 1)))
    const { data, error } = await supabase
      .from('words')
      .select('*')
      .range(from, from)
      .limit(1)

    if (error) throw error
    wordData.value = (data?.[0] as WordRow) || null

    await auth.init()
    if (auth.user && wordData.value) {
      const { data: uw } = await supabase
        .from('user_words')
        .select('id')
        .eq('user_id', auth.user.id)
        .eq('word_id', wordData.value.id)
        .maybeSingle()
      isStarred.value = !!uw
    } else {
      isStarred.value = false
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadRandomWord()
})
</script>

<template>
  <PageShell title="单词学习">
    <template #header-right>
      <button class="header-icon" type="button" :class="{ starred: isStarred }" @click="toggleStar" aria-label="收藏">
        <el-icon><Star /></el-icon>
      </button>
    </template>

  <div class="word-learning-container">
    
    <!-- 单词信息卡片 -->
    <el-card class="word-card">
      <template #header>
      <h1 class="word-title">{{ wordData?.word || '—' }}</h1>
      <div class="pronunciation">
        <el-icon><Headset /></el-icon>
        <span>{{ pronunciation }}</span>
      </div>
      </template>
      <el-tag type="success" class="word-type">{{ wordData?.type || '—' }}</el-tag>
      <p class="definition">{{ wordData?.definition || '暂无释义' }}</p>
    </el-card>
    
    <!-- 语法和例句卡片并排显示 -->
    <div class="cards-flex-container">
    <!-- 语法卡片 -->
    <el-card class="grammar-card">
        <template #header>
        <div class="grammar-header">
        <h3>语源 / 词源</h3>
        <el-tag size="small" type="warning">{{ wordData?.level || '—' }}</el-tag> 
        </div>
        </template>
      <div class="grammar-content">
          <p class="pattern"><el-icon color="#67C23A" justify="center"><ArrowRight/></el-icon>词源：{{ wordData?.etymology || '—' }}</p>
        <p class="notes">提示：你可以点击右下角继续随机学习。</p>
      </div>
    </el-card>
    
    <!-- 例句卡片 -->
    <el-card class="example-card">
        <template #header>Example sentences</template>
      <div 
        v-for="(example, index) in (wordData?.examples || [])" 
        :key="index"
        class="example-item"
      >
        <el-icon class="example-icon"><ChatLineRound /></el-icon>
        <div class="example-content">
          <p class="chinese-text">{{ example }}</p>
        </div>
      </div>
    </el-card>
    </div>
    
    <!-- 词组扩展区 -->
    <el-collapse v-model="activeNames" class="phrase-collapse">
      <el-collapse-item title="Related phrases" name="phrases">
        <div class="phrase-item">
          <div class="phrase-chinese">
            <span class="chinese">同义词</span>
            <span class="pinyin">{{ (wordData?.synonyms || []).join('、') || '—' }}</span>
          </div>
        </div>
        <div class="phrase-item">
          <div class="phrase-chinese">
            <span class="chinese">反义词</span>
            <span class="pinyin">{{ (wordData?.antonyms || []).join('、') || '—' }}</span>
          </div>
        </div>
      </el-collapse-item>
    </el-collapse>
    
    <!-- 底部导航 -->
    <div class="footer-nav">
      <el-icon class="nav-icon" @click="loadRandomWord"><Refresh /></el-icon>
      <el-icon class="nav-icon" @click="loadRandomWord"><ArrowRight /></el-icon>
    </div>
  </div>
  </PageShell>
</template>

<style lang="scss" scoped>
/* 颜色系统 */
$--primary-green: #67C23A;
$--dark-green: #5B8C00;
$--light-bg: rgba(240, 249, 235, 0.9);
$--text-primary: #303133;
$--text-regular: #606266;
$--text-secondary: #909399;
$--border-color: #EBEEF5;

/* 间距系统 */
$--spacing-base: 6px;
$--spacing-sm: $--spacing-base * 2;
$--spacing-md: $--spacing-base * 3;
$--spacing-lg: $--spacing-base * 5;
$--spacing-xl: $--spacing-base * 7;

/* 容器样式 */
.word-learning-container {
  min-height: 100vh;
  position: relative;
  box-sizing: border-box;
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
}

.header-icon.starred {
  color: #E6A23C;
}

/* 单词卡片 */
.word-card {
  background: $--light-bg;
  border: none;
  border-radius: 12px;
  margin-bottom: $--spacing-md;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  
  :deep(.el-card__body) {
    padding: $--spacing-md;
  }
  
  .word-title {
    align-items: center;
    text-align: center;
    font-size: 20px;
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
    font-size: 18px;
    
    .el-icon {
      font-size: 18px;
      color: $--primary-green;
    }
  }
  
  .word-type {
    text-align: center;
    display: flex;
    justify-content: center;
    margin-bottom: $--spacing-base;
    font-size: 18px;
  }
  
  .definition {
    text-align: center;
    color: $--text-regular;
    line-height: 1.6;
    margin: 0;
    font-size: 18px;
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
  border-radius: 12px;
  flex: 1;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  
  :deep(.el-card__body) {
    padding: $--spacing-md;
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .grammar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: $--spacing-base;
    
    h3 {
      color: $--text-primary;
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }
  }
  
  .grammar-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    
    .pattern {
      color: $--text-primary;
      font-weight: 500;
      margin-bottom: $--spacing-sm;
      font-size: 18px;
      line-height: 1.5;
    }
    
    .notes {
      color: $--text-regular;
      font-size: 18px;
      line-height: 1.6;
    }
  }
}

/* 例句卡片 */
.example-card {
  background: $--light-bg;
  border: none;
  border-radius: 12px;
  flex: 1;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  
  :deep(.el-card__header) {
    font-size: 20px;
    font-weight: 600;
    padding: $--spacing-md;
  }
  
  :deep(.el-card__body) {
    padding: $--spacing-md;
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .example-item {
    display: flex;
    gap: $--spacing-base;
    
    &:not(:last-child) {
      margin-bottom: $--spacing-md;
      padding-bottom: $--spacing-md;
      border-bottom: 1px solid $--border-color;
    }
  }
  
  .example-icon {
    font-size: 18px;
    color: $--primary-green;
    margin-top: 3px;
    flex-shrink: 0;
  }
  
  .example-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    
    .chinese-text {
      color: $--text-primary;
      font-size: 18px;
      margin-bottom: $--spacing-sm;
      margin-top: 0;
      line-height: 1.5;
    }
    
    .pinyin {
      color: $--text-regular;
      font-size: 18px;
      margin-bottom: $--spacing-sm;
      margin-top: 0;
      line-height: 1.4;
    }
    
    .translation {
      color: $--text-secondary;
      font-size: 18px;
      font-style: italic;
      margin-bottom: 0;
      margin-top: 0;
      line-height: 1.4;
    }
  }
}

/* 词组扩展区 */
.phrase-collapse {
  background: transparent;
  border: none;
  margin-bottom: $--spacing-lg;
  
  :deep(.el-collapse-item__header) {
    font-size: 16px;
    font-weight: 600;
    color: $--text-primary;
    border: none;
    padding: $--spacing-md;
    background: $--light-bg;
    border-radius: 12px;
    margin-bottom: $--spacing-base;
  }
  
  :deep(.el-collapse-item__content) {
    padding: 0;
  }
  
  .phrase-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: $--spacing-sm $--spacing-md;
    background: $--light-bg;
    border-radius: 18px;
    margin-bottom: $--spacing-base;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .phrase-chinese {
      display: flex;
      flex-direction: column;
      
      .chinese {
        color: $--text-primary;
        font-size: 18px;
        margin-bottom: $--spacing-base;
      }
      
      .pinyin {
        color: $--text-regular;
        font-size: 18px;
      }
    }
    
    .phrase-english {
      color: $--text-primary;
      font-size: 18px;
      text-align: right;
    }
  }
}

/* 底部导航 */
.footer-nav {
  position: sticky;
  bottom: 12px;
  margin-top: 16px;
  margin-left: auto;
  display: flex;
  gap: $--spacing-md;
  background: rgba(255, 255, 255, 0.9);
  padding: $--spacing-base;
  border-radius: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  
  .nav-icon {
    font-size: 26px;
    color: $--primary-green;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover {
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
      font-size: 24px;
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
    bottom: 12px;
    right: 12px;
    padding: $--spacing-base;
    
    .nav-icon {
      font-size: 20px;
    }
  }
}
</style> 