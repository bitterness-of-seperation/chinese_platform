<template>
  <view class="assistant-container">
    <!-- 背景层 -->
    <OrganicBackground :color="'#67C23A'" :opacity="0.1"></OrganicBackground>
    
    <!-- 顶部导航栏  -->
    <view class="nav-bar">
      <uni-icons class="nav-icon" :type="iconMap.Back" size="24" color="#67C23A" @click="goBack"></uni-icons>
      <text class="page-title">汉语学习助手</text>
      <!-- 功能切换普通与专业 -->
      <switch
        :checked="isAdvancedMode"
        class="mode-switch"
        @change="handleModeChange"
        color="#67C23A"
      >
        <text v-if="isAdvancedMode">专业模式</text>
        <text v-else>基础模式</text>
      </switch>
    </view>
    
    <!-- 内容区占位元素，确保内容不被导航栏遮挡 -->
    <view class="nav-placeholder"></view>
    
    <!-- 对话式问答布局 -->
    <scroll-view 
      scroll-y="true" 
      class="qa-container" 
      :scroll-top="scrollTop"
      @scrolltoupper="loadMoreHistory"
      :refresher-enabled="true"
      :refresher-triggered="isRefreshing"
      @refresherrefresh="onRefresh"
      :scroll-with-animation="true"
      :id="scrollViewId"
    >
      <view class="messages-list">
        <view 
          v-for="(msg, index) in chatMessages" 
          :key="index"
          class="message"
          :class="msg.role"
        >
          <view class="message-content">
            <view v-if="msg.role === 'system'" class="system-badge">
              <uni-icons :type="iconMap.DocumentAdd" size="14"></uni-icons>
              <text>系统</text>
            </view>
            <view v-else-if="msg.role === 'assistant'" class="assistant-badge">
              <uni-icons :type="iconMap.ChatLineRound" size="14"></uni-icons>
              <text>{{ isAdvancedMode ? '汉语专家' : '汉语助教' }}</text>
            </view>
            <text>{{ msg.content }}</text>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部输入框 -->
    <view class="input-container">
      <view class="input-area">
        <textarea
          v-model="userInput"
          class="uni-textarea-input"
          :auto-height="true"
          :disabled="isProcessing"
          placeholder="请输入您的问题..."
          @confirm="sendMessage"
          @keyboardheightchange="onKeyboardHeightChange"
        />
        <button 
          type="primary" 
          class="send-btn"
          :disabled="!userInput.trim() || isProcessing"
          @click="sendMessage"
        >
          {{ isProcessing ? '思考中...' : '发送' }}
        </button>
      </view>
      <text class="tip-text">按回车键快速发送</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick, watch } from 'vue';
import OrganicBackground from '../../components/OrganicBackground.vue';
import chineseAI from '../../api/chineseAI';
import { useUserStore } from '../../stores/user';

const userStore = useUserStore();
// 计算属性获取用户ID
const userId = computed(() => userStore.userInfo?._id || '');
const chatId = ref('');
const isProcessing = ref(false);
const scrollTop = ref(0);
const isRefreshing = ref(false);
const scrollViewId = ref('qa-scroll-view');

// 导航返回
const goBack = () => {
  uni.navigateBack({
    delta: 1,
    fail: (e: any) => {
      console.error('navigateBack failed', e);
      uni.switchTab({
        url: '/pages/Home/Home'
      });
    }
  });
};

// 聊天消息数据
const chatMessages = reactive([
  {
    role: 'system',
    content: '欢迎使用汉语学习助手，我可以帮助您解答任何关于中文学习的问题。'
  }
]);

// 监听聊天消息变化，自动滚动到底部
watch(chatMessages, () => {
  scrollToBottom();
}, { deep: true });

// 滚动到底部
const scrollToBottom = () => {
  nextTick(() => {
    setTimeout(() => {
      scrollTop.value = 999999;
      
      // 备用滚动方法，使用选择器滚动
      try {
        const query = uni.createSelectorQuery();
        query.select(`#${scrollViewId.value}`).boundingClientRect();
        query.selectViewport().scrollOffset();
        query.exec((res) => {
          if (res && res[0] && res[1]) {
            const scrollHeight = res[0].height;
            uni.pageScrollTo({
              scrollTop: scrollHeight,
              duration: 300
            });
          }
        });
      } catch (error) {
        console.error('滚动失败:', error);
      }
    }, 300);
  });
};

// 输入框内容
const userInput = ref('');

// 模式切换
const isAdvancedMode = ref(false);

// 处理模式切换
const handleModeChange = (e: any) => {
  isAdvancedMode.value = e.detail.value;
  // 添加模式切换提示
  chatMessages.push({
    role: 'system',
    content: isAdvancedMode.value 
      ? '已切换至专业模式，我将以语言学专家的视角为您解答问题。' 
      : '已切换至基础模式，我将用简单易懂的方式为您解答问题。'
  });
  
  // 模式切换后滚动到底部
  scrollToBottom();
};

// 加载历史记录
const loadChatHistory = async () => {
  try {
    // 检查用户是否登录
    if (!userId.value) {
      console.warn('用户未登录，无法加载聊天记录');
      return;
    }
    
    console.log('开始加载聊天记录，用户ID:', userId.value);
    
    const { result } = await uniCloud.callFunction({
      name: 'getChatHistory',
      data: {
        user_id: userId.value,
        chat_id: chatId.value
      }
    });
    
    console.log('获取聊天记录结果:', result);
    
    if (result.code === 200) {
      // 处理两种可能的返回情况
      if (chatId.value && result.data && !Array.isArray(result.data)) {
        // 情况1: 请求了特定的聊天记录，返回单个对象
        console.log('获取到特定聊天记录:', result.data);
        if (Array.isArray(result.data.chat_records) && result.data.chat_records.length > 0) {
          chatMessages.length = 1; // 保留系统欢迎消息
          chatMessages.push(...result.data.chat_records);
          console.log('已加载聊天记录，共', result.data.chat_records.length, '条消息');
          
          // 加载完记录后滚动到底部
          scrollToBottom();
        }
      } else if (Array.isArray(result.data)) {
        // 情况2: 请求了用户的所有聊天记录，返回数组
        console.log('获取到用户聊天记录列表，共', result.data.length, '条记录');
        
        if (result.data.length > 0) {
          // 使用第一条聊天记录
          const firstChat = result.data[0];
          chatId.value = firstChat._id;
          console.log('使用第一条聊天记录，ID:', chatId.value);
          
          // 再次获取完整的聊天记录内容
          const detailResult = await uniCloud.callFunction({
            name: 'getChatHistory',
            data: {
              user_id: userId.value,
              chat_id: chatId.value
            }
          });
          
          console.log('获取详细聊天记录结果:', detailResult);
          
          if (detailResult.result.code === 200 && 
              detailResult.result.data && 
              Array.isArray(detailResult.result.data.chat_records)) {
            chatMessages.length = 1; // 保留系统欢迎消息
            chatMessages.push(...detailResult.result.data.chat_records);
            console.log('已加载聊天记录，共', detailResult.result.data.chat_records.length, '条消息');
            
            // 加载完记录后滚动到底部
            scrollToBottom();
          } else {
            console.log('获取详细聊天记录失败或记录为空');
          }
        } else {
          console.log('用户没有聊天记录，第一次发消息时将创建');
        }
      } else {
        console.log('未获取到任何聊天记录');
      }
    } else {
      console.warn('获取聊天记录失败:', result.message);
    }
  } catch (error) {
    console.error('加载聊天记录失败:', error);
    uni.showToast({
      title: '加载聊天记录失败',
      icon: 'none'
    });
  }
};

// 下拉刷新
const onRefresh = async () => {
  isRefreshing.value = true;
  await loadChatHistory();
  isRefreshing.value = false;
};

// 上拉加载更多历史记录
const loadMoreHistory = () => {
  // 这里可以实现加载更早的聊天记录
  console.log('加载更多历史记录');
};

// 保存聊天记录
const saveChatHistory = async (question, answer, mode) => {
  try {
    // 检查用户是否登录
    if (!userId.value) {
      console.warn('用户未登录，无法保存聊天记录');
      uni.showToast({
        title: '请先登录再保存聊天记录',
        icon: 'none'
      });
      return false;
    }
    
    console.log('开始保存用户消息，参数:', {
      user_id: userId.value,
      chat_id: chatId.value || '',
      message: question,
      mode: mode
    });
    
    // 保存用户消息
    const msgResult = await uniCloud.callFunction({
      name: 'saveChatMessage',
      data: {
        user_id: userId.value,
        chat_id: chatId.value || '',
        message: question,
        mode: mode
      }
    });
    
    console.log('保存用户消息结果:', msgResult);
    
    if (msgResult.result.code !== 200) {
      throw new Error(msgResult.result.message);
    }
    
    // 获取或更新chatId
    const newChatId = chatId.value || msgResult.result.data.chat_id;
    chatId.value = newChatId;
    
    console.log('开始保存AI回复，参数:', {
      user_id: userId.value,
      chat_id: newChatId,
      response: answer,
      mode: mode
    });
    
    // 保存AI回复
    const aiResult = await uniCloud.callFunction({
      name: 'saveAIResponse',
      data: {
        user_id: userId.value,
        chat_id: newChatId,
        response: answer,
        mode: mode
      }
    });
    
    console.log('保存AI回复结果:', aiResult);
    
    if (aiResult.result.code !== 200) {
      throw new Error(aiResult.result.message);
    }
    
    return true;
  } catch (error) {
    console.error('保存聊天记录失败:', error);
    return false;
  }
};

// 发送消息
const sendMessage = async () => {
  if (!userInput.value.trim() || isProcessing.value) return;
  
  const question = userInput.value.trim();
  userInput.value = '';
  isProcessing.value = true;
  
  // 添加用户消息
  chatMessages.push({
    role: 'user',
    content: question
  });
  
  // 发送消息后立即滚动到底部
  scrollToBottom();
  
  try {
    // 根据模式选择不同的API调用
    const response = isAdvancedMode.value
      ? await chineseAI.getProfessionalResponse(question)
      : await chineseAI.getSimpleResponse(question);
    
    if (response.success) {
      // 添加AI回复
      chatMessages.push({
        role: 'assistant',
        content: response.content
      });
      
      // 添加AI回复后再次滚动到底部
      scrollToBottom();
      
      // 尝试保存聊天记录（如果用户已登录）
      if (userId.value) {
        try {
          const saveResult = await saveChatHistory(
            question,
            response.content,
            isAdvancedMode.value ? 'professional' : 'normal'
          );
          console.log('保存聊天记录结果:', saveResult);
        } catch (saveError) {
          console.error('保存聊天记录失败:', saveError);
        }
      } else {
        console.warn('用户未登录，跳过保存聊天记录');
      }
    } else {
      chatMessages.push({
        role: 'system',
        content: '抱歉，我现在无法回答您的问题，请稍后再试。'
      });
      
      // 添加系统消息后再次滚动到底部
      scrollToBottom();
    }
  } catch (error) {
    console.error('处理消息失败:', error);
    chatMessages.push({
      role: 'system',
      content: '发生错误，请稍后重试。'
    });
    
    // 发生错误后再次滚动到底部
    scrollToBottom();
  } finally {
    isProcessing.value = false;
  }
};

// 键盘高度变化处理
const onKeyboardHeightChange = (e: any) => {
  console.log('Keyboard height changed:', e.detail.height);
  // 键盘高度变化时滚动到底部
  scrollToBottom();
};

// 检查用户登录状态
const checkUserLogin = () => {
  if (!userId.value) {
    console.warn('用户未登录，某些功能可能受限');
  } else {
    console.log('用户已登录，ID:', userId.value);
  }
};

// Element Plus icons mapping to uni-icons
const iconMap = {
  Back: 'back',
  ChatLineRound: 'chatbubble',
  DocumentAdd: 'compose'
};

// 组件挂载时加载聊天记录
onMounted(async () => {
  // 检查用户登录状态
  checkUserLogin();
  
  // 如果用户已登录，立即加载聊天记录
  if (userId.value) {
    await loadChatHistory();
  } else {
    console.warn('用户未登录，无法加载聊天记录');
  }
  
  // 页面加载后滚动到底部
  scrollToBottom();
});

</script>

<style scoped lang="scss">
.assistant-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: relative;
  max-width: 800rpx;
  margin: 0 auto;
  box-sizing: border-box;
  overflow: hidden; /* 确保背景不溢出容器 */
}

/* 顶部导航栏 */
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
  width: 100%;
  box-sizing: border-box;
}

/* 导航栏占位元素 */
.nav-placeholder {
  height: calc(88rpx + var(--status-bar-height, 40rpx));
  width: 100%;
}

.nav-icon {
  font-size: 50rpx;
  /* cursor: pointer; */ /* 移除 */
  padding: 16rpx;
  border-radius: 50%;
  transition: all 0.3s;
  color: var(--ep-color-success, #67C23A);
}

/* 移除 hover 效果 */
/* .nav-icon:hover {
  transform: scale(1.1);
  background-color: rgba(103, 194, 58, 0.1);
} */

.page-title {
  flex: 1;
  margin: 0;
  text-align: center;
  font-size: 36rpx;
  font-weight: 600;
}

.mode-switch {
  margin-right: 16rpx;
  --el-switch-on-color: var(--ep-color-success, #67C23A);
  transform: scale(0.8); /* 缩小开关大小以适应 uni-app 默认开关样式 */
  transform-origin: right center;
}

/* 对话式问答容器 */
.qa-container {
  flex: 1;
  overflow-y: auto;
  padding: 32rpx;
  display: flex;
  flex-direction: column;
  position: relative; /* 确保层级正确 */
  z-index: 1; /* 确保内容在背景上方 */
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
  padding-bottom: 32rpx;
}

.message {
  max-width: 85%;
  display: flex;
  margin-bottom: 16rpx;
}

.message.user {
  align-self: flex-end;
}

.message.assistant,
.message.system {
  align-self: flex-start;
}

.message-content {
  padding: 24rpx 32rpx;
  border-radius: 32rpx;
  position: relative;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.05);
  font-size: 30rpx;
  line-height: 1.5;
}

.message.user .message-content {
  background-color: var(--ep-color-success, #67C23A);
  color: white;
  border-top-right-radius: 8rpx;
}

.message.assistant .message-content {
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10rpx);
  color: var(--text-primary, #1e293b);
  border-top-left-radius: 8rpx;
}

.message.system .message-content {
  background-color: rgba(100, 116, 139, 0.1);
  color: var(--text-secondary, #64748b);
  border-radius: 24rpx;
  font-size: 28rpx;
  width: 100%;
  text-align: center;
}

.assistant-badge, .system-badge {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  margin-bottom: 8rpx;
  opacity: 0.7;
}

/* 输入区域 */
.input-container {
  padding: 24rpx 32rpx 40rpx;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20rpx);
  box-shadow: 0 -2rpx 6rpx rgba(0, 0, 0, 0.05);
  z-index: 10;
  border-radius: 32rpx 32rpx 0 0;
  margin-top: 16rpx;
  position: relative; /* 确保层级正确 */
}

.input-area {
  display: flex;
  gap: 16rpx;
  align-items: flex-end; /* Align textarea and button at the bottom */
}

.uni-textarea-input {
  flex: 1;
  min-height: 64rpx; /* Adjust min-height for textarea */
  padding: 16rpx 24rpx;
  border-radius: 24rpx;
  border: 1px solid #EBEEF5; /* Add border for textarea */
  font-size: 30rpx;
  line-height: 1.5;
  box-sizing: border-box;
}

.send-btn {
  padding: 0 40rpx;
  height: 80rpx;
  border-radius: 24rpx;
  transition: all 0.3s;
  background-color: var(--ep-color-success, #67C23A);
  border-color: var(--ep-color-success, #67C23A);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
}

/* 移除 hover 效果 */
/* .send-btn:hover:not(:disabled) {
  transform: translateY(-4rpx);
  box-shadow: 0 8rpx 12rpx rgba(103, 194, 58, 0.2);
  background-color: #5ab62e;
  border-color: #5ab62e;
} */

.tip-text {
  font-size: 24rpx;
  color: var(--text-secondary, #64748b);
  text-align: right;
  margin-top: 8rpx;
  opacity: 0.7;
}

/* 背景组件样式覆盖 - 移除，由 OrganicBackground 组件提供 */
/* .organic-background-placeholder { ... } */

/* 响应式调整 */
@media (max-width: 750rpx) { /* Approximate breakpoint for smaller screens */
  .message {
    max-width: 90%;
  }
  
  .send-btn {
    padding: 0 24rpx;
  }
  
  .assistant-container {
    padding: 0;
  }
}
</style> 