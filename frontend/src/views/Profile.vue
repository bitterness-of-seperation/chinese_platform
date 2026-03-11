<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import OrganicBackground from '@/components/OrganicBackground.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const mode = ref<'signin' | 'signup'>('signin')
const email = ref('')
const password = ref('')
const loading = ref(false)

const title = computed(() => (auth.isAuthed ? '我的' : mode.value === 'signin' ? '登录' : '注册'))

onMounted(async () => {
  await auth.init()
})

async function submit() {
  if (!email.value.trim() || !password.value.trim()) {
    ElMessage.warning('请输入邮箱和密码')
    return
  }
  loading.value = true
  try {
    if (mode.value === 'signin') {
      await auth.signIn(email.value.trim(), password.value)
      ElMessage.success('登录成功')
    } else {
      await auth.signUp(email.value.trim(), password.value)
      ElMessage.success('注册成功（如开启邮箱验证，请先完成邮箱验证）')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败')
  } finally {
    loading.value = false
  }
}

async function logout() {
  loading.value = true
  try {
    await auth.signOut()
    ElMessage.success('已退出登录')
  } catch (e: any) {
    ElMessage.error(e?.message || '退出失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="profile-page">
    <OrganicBackground :color="'#67C23A'" :opacity="0.08" />

    <div class="card">
      <div class="header">
        <h2>{{ title }}</h2>
        <p v-if="auth.isAuthed" class="sub">已登录：{{ auth.user?.email }}</p>
        <p v-else class="sub">登录后可同步生词本与学习进度</p>
      </div>

      <template v-if="auth.isAuthed">
        <div class="info">
          <div class="row">
            <span class="k">等级</span>
            <span class="v">{{ auth.profile?.level ?? 1 }}</span>
          </div>
          <div class="row">
            <span class="k">经验</span>
            <span class="v">{{ auth.profile?.experience ?? 0 }}</span>
          </div>
          <div class="row">
            <span class="k">用户名</span>
            <span class="v">{{ auth.profile?.username ?? '未设置' }}</span>
          </div>
        </div>

        <el-button type="danger" plain :loading="loading" @click="logout">退出登录</el-button>
      </template>

      <template v-else>
        <div class="tabs">
          <button class="tab" :class="{ active: mode === 'signin' }" @click="mode = 'signin'">登录</button>
          <button class="tab" :class="{ active: mode === 'signup' }" @click="mode = 'signup'">注册</button>
        </div>

        <el-form label-position="top" class="form">
          <el-form-item label="邮箱">
            <el-input v-model="email" placeholder="name@example.com" autocomplete="email" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="password" placeholder="至少 6 位" show-password autocomplete="current-password" />
          </el-form-item>
          <el-button type="primary" :loading="loading" @click="submit">{{ mode === 'signin' ? '登录' : '注册' }}</el-button>
        </el-form>
      </template>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  min-height: 100vh;
  padding: 16px;
  position: relative;
  max-width: 720px;
  margin: 0 auto;
}

.card {
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

.header h2 {
  margin: 0 0 8px;
}

.sub {
  margin: 0 0 12px;
  color: #64748b;
  font-size: 13px;
}

.tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.tab {
  height: 36px;
  border-radius: 10px;
  background: rgba(103, 194, 58, 0.08);
  color: #2c3e50;
  border: 1px solid rgba(103, 194, 58, 0.18);
}

.tab.active {
  background: rgba(103, 194, 58, 0.18);
  border-color: rgba(103, 194, 58, 0.35);
  font-weight: 600;
}

.info {
  display: grid;
  gap: 10px;
  margin: 12px 0 16px;
}

.row {
  display: flex;
  justify-content: space-between;
  padding: 10px 12px;
  background: rgba(15, 23, 42, 0.03);
  border-radius: 12px;
}

.k {
  color: #64748b;
  font-size: 13px;
}

.v {
  font-weight: 600;
}
</style>

