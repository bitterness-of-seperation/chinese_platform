<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import 'element-plus/dist/index.css'
import {
  Search,
  ChatLineRound,
  Star as Bookmark,
  Headset,
  Close,
} from '@element-plus/icons-vue'
import PageShell from '@/components/PageShell.vue'
import { ElMessage } from 'element-plus'
import { supabase, vocabulary } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

// 定义词典数据类型
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

const router = useRouter();
const auth = useAuthStore()

// 搜索输入
const searchInput = ref('');
const loading = ref(false)
const selectedWord = ref<WordRow | null>(null)
const trendingWords = ref<WordRow[]>([])


// 搜索处理
const handleSearch = async () => {
  const q = searchInput.value.trim()
  if (!q) return
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('words')
      .select('*')
      .or(`word.eq.${q},word.ilike.%${q}%`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw error
    if (!data) {
      ElMessage.warning('未找到该词（请确认 Supabase 的 words 表已导入数据）')
      return
    }
    selectedWord.value = data as WordRow
    searchInput.value = ''
  } catch (e: any) {
    ElMessage.error(e?.message || '查询失败')
  } finally {
    loading.value = false
  }
}

// 从热词中选择
const selectWord = (word: WordRow) => {
  selectedWord.value = word
}

// 播放发音
const playPronunciation = () => {
  // 实际应该调用发音API
  ElMessage.info('发音功能可后续接入 TTS（当前先占位）')
};

// 添加到生词本
const addToWordbook = async () => {
  await auth.init()
  if (!auth.user) {
    ElMessage.warning('请先去“我的”页登录，再加入生词本')
    router.push('/profile')
    return
  }
  if (!selectedWord.value) return
  const { error } = await vocabulary.addWord(auth.user.id, selectedWord.value.id)
  if (error) {
    const msg = String((error as any).message || error)
    if (msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('unique')) {
      ElMessage.info('该词已在生词本中')
      return
    }
    ElMessage.error(msg)
    return
  }
  ElMessage.success('已加入生词本')
}

// 返回搜索
const backToSearch = () => {
  selectedWord.value = null
}

onMounted(async () => {
  await auth.init()
  // 热词：简单取最近创建的一批（你也可以换成按热度字段）
  const { data } = await supabase
    .from('words')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(8)
  trendingWords.value = (data as WordRow[]) || []
})
</script>

<template>
  <PageShell title="词典">
    <div class="search-container">
      <el-input
        v-model="searchInput"
        placeholder="Enter a word to search..."
        class="search-input"
        :disabled="loading"
        @keyup.enter="handleSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
        <template #append>
          <el-button :loading="loading" @click="handleSearch">Search</el-button>
        </template>
      </el-input>
      
      <!-- 热词（来自 Supabase） -->
      <div class="search-helpers" v-if="!selectedWord">
        <div class="hot-words">
          <h4>Trending Words</h4>
          <div class="hot-words-list">
            <div
              v-for="(item, index) in trendingWords"
              :key="item.id"
              class="hot-word-item"
              @click="selectWord(item)"
            >
              <span class="hot-word-rank" :class="{'top-rank': index < 3}">{{ index + 1 }}</span>
              <span class="hot-word-text">{{ item.word }}</span>
              <span class="hot-word-heat">{{ item.level }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 词典详情展示 -->
      <div class="word-details" v-if="selectedWord">
        <div class="close-button" @click="backToSearch">
          <el-icon><Close /></el-icon>
        </div>
        
        <div class="word-header">
          <div class="word-title-area">
            <h2 class="word-title">{{ selectedWord.word }}</h2>
            <div class="word-pinyin">{{ selectedWord.pinyin }}</div>
            <div class="word-tags">
              <el-tag size="small" type="success">{{ selectedWord.type }}</el-tag>
              <el-tag size="small" type="warning" class="level-tag">{{ selectedWord.level }}</el-tag>
            </div>
          </div>
          <div class="word-actions">
            <el-button circle size="small" @click="playPronunciation" title="Pronunciation">
              <el-icon><Headset /></el-icon>
            </el-button>
            <el-button circle size="small" @click="addToWordbook" title="Save to Vocabulary">
              <el-icon><Bookmark /></el-icon>
            </el-button>
          </div>
        </div>
        
        <el-divider></el-divider>
        
        <div class="word-content">
          <div class="section">
            <h4>Definition</h4>
            <p>{{ selectedWord.definition }}</p>
          </div>
          
          <div class="section">
            <h4>Etymology</h4>
            <p>{{ selectedWord.etymology || '—' }}</p>
          </div>
          
          <div class="section">
            <h4>Examples</h4>
            <ul class="example-list">
              <li v-for="(example, index) in selectedWord.examples" :key="index">
                <el-icon color="#67C23A"><ChatLineRound /></el-icon>
                <span>{{ example }}</span>
              </li>
            </ul>
          </div>
          
          <div class="word-relations">
            <div class="relation-section" v-if="selectedWord.synonyms.length > 0">
              <h4>Synonyms</h4>
              <div class="relation-tags">
                <el-tag 
                  v-for="word in selectedWord.synonyms" 
                  :key="word"
                  @click="searchInput = word; handleSearch()"
                  class="clickable-tag"
                  type="info"
                  effect="plain"
                >
                  {{ word }}
                </el-tag>
              </div>
            </div>
            
            <div class="relation-section" v-if="selectedWord.antonyms.length > 0">
              <h4>Antonyms</h4>
              <div class="relation-tags">
                <el-tag 
                  v-for="word in selectedWord.antonyms" 
                  :key="word"
                  @click="searchInput = word; handleSearch()"
                  class="clickable-tag"
                  type="danger"
                  effect="plain"
                >
                  {{ word }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageShell>
</template>

<style scoped>
/* 搜索容器 */
.search-container {
  position: relative;
  z-index: 1;
}

/* 词书选择 */
.dictionary-select {
  width: 100%;
  margin-bottom: 0.75rem;
}

.dictionary-option-content {
  display: flex;
  flex-direction: column;
}

.dictionary-name {
  font-weight: 500;
}

.dictionary-desc {
  font-size: 0.75rem;
  color: #909399;
}

.search-input {
  margin-bottom: 1rem;
}

/* 搜索历史和热词 */
.search-helpers {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.search-history h4,
.hot-words h4 {
  font-size: 0.95rem;
  margin-bottom: 0.5rem;
  color: var(--text-secondary, #64748b);
}

.search-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.clickable-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.clickable-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 热搜词汇样式 */
.hot-words-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.hot-word-item {
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.hot-word-item:hover {
  background-color: rgba(255, 255, 255, 0.9);
  transform: translateX(4px);
}

.hot-word-rank {
  font-size: 0.875rem;
  font-weight: bold;
  margin-right: 0.75rem;
  color: #909399;
  width: 1.5rem;
  text-align: center;
}

.hot-word-rank.top-rank {
  color: #f56c6c;
}

.hot-word-text {
  flex: 1;
  font-size: 0.95rem;
}

.hot-word-heat {
  font-size: 0.8rem;
  color: #909399;
}

/* 词典详情样式 */
.word-details {
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 1rem;
  padding: 1.25rem;
  margin-top: 0.5rem;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  position: relative;
}

.close-button {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background-color: rgba(144, 147, 153, 0.1);
  color: #909399;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 5;
}

.close-button:hover {
  background-color: rgba(144, 147, 153, 0.2);
  transform: scale(1.1);
}

.word-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.word-title-area {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.word-title {
  font-size: 1.5rem;
  margin: 0;
  font-weight: 600;
}

.word-pinyin {
  font-size: 0.9rem;
  color: #606266;
  margin-bottom: 0.25rem;
}

.word-tags {
  display: flex;
  gap: 0.5rem;
}

.word-actions {
  display: flex;
  gap: 0.25rem;
}

.word-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.section h4 {
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
  color: #67C23A;
}

.section p {
  margin: 0;
  line-height: 1.4;
}

.example-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.example-list li {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  line-height: 1.4;
}

.example-list li el-icon {
  margin-top: 0.2rem;
}

.word-relations {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.relation-section h4 {
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
  color: #67C23A;
}

.relation-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* 深度选择器 - 背景组件样式覆盖 */
:deep(.organic-background) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .word-header {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .word-actions {
    align-self: flex-end;
  }
  
  .dictionary-container {
    padding: 0;
  }
}
</style>
