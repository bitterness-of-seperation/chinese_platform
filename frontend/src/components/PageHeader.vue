<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'

const props = withDefaults(
  defineProps<{
    title: string
    showBack?: boolean
    backTo?: string
    translucent?: boolean
  }>(),
  {
    showBack: true,
    translucent: true,
  },
)

const router = useRouter()

function onBack() {
  if (props.backTo) router.push(props.backTo)
  else router.back()
}
</script>

<template>
  <div class="page-header" :class="{ translucent: props.translucent }">
    <div class="left">
      <button v-if="props.showBack" class="icon-btn" type="button" @click="onBack" aria-label="返回">
        <el-icon><ArrowLeft /></el-icon>
      </button>
      <div v-else class="spacer"></div>
    </div>

    <div class="center">
      <div class="title">{{ props.title }}</div>
    </div>

    <div class="right">
      <slot name="right">
        <div class="spacer"></div>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: 56px 1fr 56px;
  align-items: center;
  padding: 10px 12px;
  border-radius: 0 0 16px 16px;
  background: #ffffff;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.06);
}

.page-header.translucent {
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(12px);
}

.title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.2px;
  text-align: center;
  color: #0f172a;
}

.left,
.right {
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn {
  width: 40px;
  height: 40px;
  border-radius: 9999px;
  background: rgba(103, 194, 58, 0.12);
  border: 1px solid rgba(103, 194, 58, 0.18);
  color: #2e7d32;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease;
}

.icon-btn:active {
  transform: scale(0.98);
}

.spacer {
  width: 40px;
  height: 40px;
}
</style>

