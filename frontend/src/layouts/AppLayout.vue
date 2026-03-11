<script setup lang="ts">
import BottomNavbar from '@/components/BottomNavbar.vue'
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()

// 首页/助手页已经各自有沉浸式背景与顶部栏，这里只负责统一“安全区 + 底部导航”
const hideBottomNav = computed(() => route.meta?.hideBottomNav === true)
</script>

<template>
  <div class="layout-root">
    <div class="layout-content">
      <RouterView />
    </div>

    <BottomNavbar v-if="!hideBottomNav" />
  </div>
</template>

<style scoped>
.layout-root {
  min-height: 100vh;
  width: 100%;
}

.layout-content {
  width: 100%;
  min-height: 100vh;
  padding-bottom: 68px; /* 给固定底部导航留空间 */
}
</style>

