<script setup lang="ts">
import { ref, reactive } from 'vue'
import 'element-plus/dist/index.css'
import {
  ChatLineRound,
  DocumentAdd
} from '@element-plus/icons-vue'
import { chat, type ChatMessage } from '@/lib/ai'
import PageShell from '@/components/PageShell.vue'

// 聊天消息数据
const chatMessages = reactive([
  {
    type: 'system',
    content: 'Welcome to ZhiYan Chinese Assistant. You can ask me any questions about learning Chinese.'
  }
]);

// 输入框内容
const userInput = ref('');

// 模式切换
const isAdvancedMode = ref(false);
const isSending = ref(false);

// 根据不同模式处理对话
const processUserQuery = async (query: string) => {
  // 添加用户消息
  chatMessages.push({
    type: 'user',
    content: query
  });
  
  // 根据模式生成不同回复
  if (isAdvancedMode.value) {
    await processAdvancedMode();
  } else {
    processSimpleMode(query);
  }
};

// 普通模式处理函数 - 简单应答
const processSimpleMode = (query: string) => {
  let response = '';
  
  // 简单规则匹配
  if (query.includes('你好') || query.includes('您好')) {
    response = '你好！我是智言汉语助手，很高兴为您服务。';
  } else if (query.includes('谢谢') || query.includes('感谢')) {
    response = '不客气，这是我的荣幸！';
  } else if (query.includes('再见')) {
    response = '再见，祝您学习愉快！';
  } else if (query.includes('把')) {
    response = '根据现代汉语的语法知识以及提供的文章，句子"这样小小的关心会把我们的环境更加美"存在语法错误。具体错误在于"把"字句的结构不正确。在"把"字句中，"把"的宾语应该是一个具体的、已知的事物，并且动词后面应该有一个表示动作结果的成分。在这个句子中，"把"字后的宾语是"我们的环境"，但动词"更加美"并不是一个表示动作结果的成分，而是形容词短语，这不符合"把"字句的语法结构。\n正确的句子应该是："这样小小的关心会把我们的环境变得更加美丽。"\n 以下是三个符合"把"字句语法结构的例句：\n1. 他把书放在桌子上。\n2. 她把房间打扫得干干净净。\n3. 我们把计划提前了一周。这些例句中的"把"字句的宾语都是具体的、已知的事物，并且动词后面都有一个表示动作结果的成分，符合"把"字句的语法要求。 ';
  } else {
    response = 'Sorry, in basic mode my abilities are limited. You can switch to advanced mode for more detailed answers, or try asking simpler questions.';
  }
  
  // 添加延迟，模拟思考时间
  setTimeout(() => {
    chatMessages.push({
      type: 'assistant',
      content: response
    });
  }, 500);
};

// 专业模式处理函数 - 调后端AI接口（失败则降级到基础模式）
const processAdvancedMode = async () => {
  if (isSending.value) return;
  isSending.value = true;

  try {
    const messages: ChatMessage[] = chatMessages
      .filter(m => m.type !== 'system')
      .map(m => ({
        role: m.type === 'user' ? 'user' : 'assistant',
        content: m.content,
      }));

    const { reply } = await chat(messages, '你正在帮助用户学习中文。请尽量用中文解释，并给出例句。');

    chatMessages.push({
      type: 'assistant',
      content: reply || '（空回复）'
    });
  } catch (e: any) {
    chatMessages.push({
      type: 'assistant',
      content: `高级模式暂时不可用：${e?.message || '请求失败'}\n\n我已自动切回基础模式，你也可以检查后端是否已启动以及 VITE_AI_SERVICE_URL 是否正确。`
    });
    isAdvancedMode.value = false;
  } finally {
    isSending.value = false;
  }
};

// 发送消息
const sendMessage = async () => {
  if (!userInput.value.trim()) return;
  if (isSending.value) return;
  
  // 处理用户输入
  await processUserQuery(userInput.value);
  
  // 清空输入框
  userInput.value = '';
};

</script>

<template>
  <PageShell title="AI 助手" :bg-color="'#67C23A'" :bg-opacity="0.08">
    <template #header-right>
      <el-switch
        v-model="isAdvancedMode"
        class="mode-switch"
        :active-text="isAdvancedMode ? 'Advanced' : ''"
        :inactive-text="!isAdvancedMode ? 'Basic' : ''"
        inline-prompt
      />
    </template>

    <div class="assistant-container">
      <div class="qa-container">
        <div class="messages-list">
        <div 
          v-for="(msg, index) in chatMessages" 
          :key="index"
          class="message"
          :class="msg.type"
        >
          <div class="message-content">
            <div v-if="msg.type === 'system'" class="system-badge">
              <el-icon><DocumentAdd /></el-icon>
              System
            </div>
            <div v-else-if="msg.type === 'assistant'" class="assistant-badge">
              <el-icon><ChatLineRound /></el-icon>
              Assistant
            </div>
            <p v-html="msg.content.replace(/\n/g, '<br>')"></p>
          </div>
        </div>
      </div>
    </div>

      <!-- 底部输入框 -->
      <div class="input-container">
        <div class="input-area">
          <el-input
            v-model="userInput"
            type="textarea"
            :rows="2"
            resize="none"
            placeholder="输入你的问题..."
            @keyup.enter.ctrl="sendMessage"
          />
          <el-button 
            type="primary" 
            class="send-btn"
            :loading="isSending"
            :disabled="!userInput.trim() || isSending"
            @click="sendMessage"
          >
            发送
          </el-button>
        </div>
        <div class="tip-text">Ctrl + Enter 快速发送</div>
      </div>
    </div>
  </PageShell>

</template>

<style scoped>
.assistant-container {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 112px);
  position: relative;
  max-width: 800px;
  margin: 0 auto;
  box-sizing: border-box;
  overflow: hidden; /* 确保背景不溢出容器 */
}

/* 顶部导航栏 */
.nav-bar {
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  z-index: 10;
  border-radius: 0 0 16px 16px;
  position: relative; /* 确保层级正确 */
}

.nav-icon {
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.3s;
  color: var(--ep-color-success, #67C23A);
}

.nav-icon:hover {
  transform: scale(1.1);
  background-color: rgba(103, 194, 58, 0.1);
}

.nav-bar h3 {
  flex: 1;
  margin: 0;
  text-align: center;
  font-size: 1.125rem;
  font-weight: 600;
}

.mode-switch {
  margin-right: 2px;
  --el-switch-on-color: var(--ep-color-success, #67C23A);
}

/* 对话式问答容器 */
.qa-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px 8px 12px;
  display: flex;
  flex-direction: column;
  position: relative; /* 确保层级正确 */
  z-index: 1; /* 确保内容在背景上方 */
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 1rem;
}

.message {
  max-width: 85%;
  display: flex;
  margin-bottom: 0.5rem;
}

.message.user {
  align-self: flex-end;
}

.message.assistant,
.message.system {
  align-self: flex-start;
}

.message-content {
  padding: 0.75rem 1rem;
  border-radius: 16px;
  position: relative;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.08);
  font-size: 0.95rem;
  line-height: 1.5;
}

.message.user .message-content {
  background-color: var(--ep-color-success, #67C23A);
  color: white;
  border-top-right-radius: 4px;
}

.message.assistant .message-content {
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(5px);
  color: var(--text-primary, #1e293b);
  border-top-left-radius: 4px;
}

.message.system .message-content {
  background-color: rgba(100, 116, 139, 0.1);
  color: var(--text-secondary, #64748b);
  border-radius: 12px;
  font-size: 0.875rem;
  width: 100%;
  text-align: center;
}

.assistant-badge, .system-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  margin-bottom: 0.25rem;
  opacity: 0.7;
}

/* 输入区域 */
.input-container {
  padding: 10px 10px 12px;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(12px);
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
  z-index: 10;
  border-radius: 16px;
  margin-top: 8px;
  position: relative;
}

.input-area {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.send-btn {
  padding: 0 1.25rem;
  height: 2.5rem;
  border-radius: 12px;
  transition: all 0.3s;
  background-color: var(--ep-color-success, #67C23A);
  border-color: var(--ep-color-success, #67C23A);
}

.send-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(103, 194, 58, 0.2);
  background-color: #5ab62e;
  border-color: #5ab62e;
}

.tip-text {
  font-size: 0.75rem;
  color: var(--text-secondary, #64748b);
  text-align: right;
  margin-top: 0.25rem;
  opacity: 0.7;
}

/* 背景组件样式覆盖 */
:deep(.organic-background) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0; /* 确保背景在底层 */
}

/* 响应式调整 */
@media (max-width: 768px) {
  .message {
    max-width: 90%;
  }
  
  .send-btn {
    padding: 0 0.75rem;
  }
  
  .assistant-container {
    height: calc(100vh - 120px);
  }
}
</style> 