"use strict";
const common_vendor = require("../../common/vendor.js");
const api_chineseAI = require("../../api/chineseAI.js");
const stores_user = require("../../stores/user.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  _easycom_uni_icons2();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
if (!Math) {
  (OrganicBackground + _easycom_uni_icons)();
}
const OrganicBackground = () => "../../components/OrganicBackground.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "Assistant",
  setup(__props) {
    const userStore = stores_user.useUserStore();
    const userId = common_vendor.computed(() => {
      var _a;
      return ((_a = userStore.userInfo) == null ? void 0 : _a._id) || "";
    });
    const chatId = common_vendor.ref("");
    const isProcessing = common_vendor.ref(false);
    const scrollTop = common_vendor.ref(0);
    const isRefreshing = common_vendor.ref(false);
    const scrollViewId = common_vendor.ref("qa-scroll-view");
    const goBack = () => {
      common_vendor.index.navigateBack({
        delta: 1,
        fail: (e) => {
          console.error("navigateBack failed", e);
          common_vendor.index.switchTab({
            url: "/pages/Home/Home"
          });
        }
      });
    };
    const chatMessages = common_vendor.reactive([
      {
        role: "system",
        content: "欢迎使用汉语学习助手，我可以帮助您解答任何关于中文学习的问题。"
      }
    ]);
    common_vendor.watch(chatMessages, () => {
      scrollToBottom();
    }, { deep: true });
    const scrollToBottom = () => {
      common_vendor.nextTick$1(() => {
        setTimeout(() => {
          scrollTop.value = 999999;
          try {
            const query = common_vendor.index.createSelectorQuery();
            query.select(`#${scrollViewId.value}`).boundingClientRect();
            query.selectViewport().scrollOffset();
            query.exec((res) => {
              if (res && res[0] && res[1]) {
                const scrollHeight = res[0].height;
                common_vendor.index.pageScrollTo({
                  scrollTop: scrollHeight,
                  duration: 300
                });
              }
            });
          } catch (error) {
            console.error("滚动失败:", error);
          }
        }, 300);
      });
    };
    const userInput = common_vendor.ref("");
    const isAdvancedMode = common_vendor.ref(false);
    const handleModeChange = (e) => {
      isAdvancedMode.value = e.detail.value;
      chatMessages.push({
        role: "system",
        content: isAdvancedMode.value ? "已切换至专业模式，我将以语言学专家的视角为您解答问题。" : "已切换至基础模式，我将用简单易懂的方式为您解答问题。"
      });
      scrollToBottom();
    };
    const loadChatHistory = async () => {
      try {
        if (!userId.value) {
          console.warn("用户未登录，无法加载聊天记录");
          return;
        }
        console.log("开始加载聊天记录，用户ID:", userId.value);
        const { result } = await common_vendor.Zs.callFunction({
          name: "getChatHistory",
          data: {
            user_id: userId.value,
            chat_id: chatId.value
          }
        });
        console.log("获取聊天记录结果:", result);
        if (result.code === 200) {
          if (chatId.value && result.data && !Array.isArray(result.data)) {
            console.log("获取到特定聊天记录:", result.data);
            if (Array.isArray(result.data.chat_records) && result.data.chat_records.length > 0) {
              chatMessages.length = 1;
              chatMessages.push(...result.data.chat_records);
              console.log("已加载聊天记录，共", result.data.chat_records.length, "条消息");
              scrollToBottom();
            }
          } else if (Array.isArray(result.data)) {
            console.log("获取到用户聊天记录列表，共", result.data.length, "条记录");
            if (result.data.length > 0) {
              const firstChat = result.data[0];
              chatId.value = firstChat._id;
              console.log("使用第一条聊天记录，ID:", chatId.value);
              const detailResult = await common_vendor.Zs.callFunction({
                name: "getChatHistory",
                data: {
                  user_id: userId.value,
                  chat_id: chatId.value
                }
              });
              console.log("获取详细聊天记录结果:", detailResult);
              if (detailResult.result.code === 200 && detailResult.result.data && Array.isArray(detailResult.result.data.chat_records)) {
                chatMessages.length = 1;
                chatMessages.push(...detailResult.result.data.chat_records);
                console.log("已加载聊天记录，共", detailResult.result.data.chat_records.length, "条消息");
                scrollToBottom();
              } else {
                console.log("获取详细聊天记录失败或记录为空");
              }
            } else {
              console.log("用户没有聊天记录，第一次发消息时将创建");
            }
          } else {
            console.log("未获取到任何聊天记录");
          }
        } else {
          console.warn("获取聊天记录失败:", result.message);
        }
      } catch (error) {
        console.error("加载聊天记录失败:", error);
        common_vendor.index.showToast({
          title: "加载聊天记录失败",
          icon: "none"
        });
      }
    };
    const onRefresh = async () => {
      isRefreshing.value = true;
      await loadChatHistory();
      isRefreshing.value = false;
    };
    const loadMoreHistory = () => {
      console.log("加载更多历史记录");
    };
    const saveChatHistory = async (question, answer, mode) => {
      try {
        if (!userId.value) {
          console.warn("用户未登录，无法保存聊天记录");
          common_vendor.index.showToast({
            title: "请先登录再保存聊天记录",
            icon: "none"
          });
          return false;
        }
        console.log("开始保存用户消息，参数:", {
          user_id: userId.value,
          chat_id: chatId.value || "",
          message: question,
          mode
        });
        const msgResult = await common_vendor.Zs.callFunction({
          name: "saveChatMessage",
          data: {
            user_id: userId.value,
            chat_id: chatId.value || "",
            message: question,
            mode
          }
        });
        console.log("保存用户消息结果:", msgResult);
        if (msgResult.result.code !== 200) {
          throw new Error(msgResult.result.message);
        }
        const newChatId = chatId.value || msgResult.result.data.chat_id;
        chatId.value = newChatId;
        console.log("开始保存AI回复，参数:", {
          user_id: userId.value,
          chat_id: newChatId,
          response: answer,
          mode
        });
        const aiResult = await common_vendor.Zs.callFunction({
          name: "saveAIResponse",
          data: {
            user_id: userId.value,
            chat_id: newChatId,
            response: answer,
            mode
          }
        });
        console.log("保存AI回复结果:", aiResult);
        if (aiResult.result.code !== 200) {
          throw new Error(aiResult.result.message);
        }
        return true;
      } catch (error) {
        console.error("保存聊天记录失败:", error);
        return false;
      }
    };
    const sendMessage = async () => {
      if (!userInput.value.trim() || isProcessing.value)
        return;
      const question = userInput.value.trim();
      userInput.value = "";
      isProcessing.value = true;
      chatMessages.push({
        role: "user",
        content: question
      });
      scrollToBottom();
      try {
        const response = isAdvancedMode.value ? await api_chineseAI.chineseAI.getProfessionalResponse(question) : await api_chineseAI.chineseAI.getSimpleResponse(question);
        if (response.success) {
          chatMessages.push({
            role: "assistant",
            content: response.content
          });
          scrollToBottom();
          if (userId.value) {
            try {
              const saveResult = await saveChatHistory(
                question,
                response.content,
                isAdvancedMode.value ? "professional" : "normal"
              );
              console.log("保存聊天记录结果:", saveResult);
            } catch (saveError) {
              console.error("保存聊天记录失败:", saveError);
            }
          } else {
            console.warn("用户未登录，跳过保存聊天记录");
          }
        } else {
          chatMessages.push({
            role: "system",
            content: "抱歉，我现在无法回答您的问题，请稍后再试。"
          });
          scrollToBottom();
        }
      } catch (error) {
        console.error("处理消息失败:", error);
        chatMessages.push({
          role: "system",
          content: "发生错误，请稍后重试。"
        });
        scrollToBottom();
      } finally {
        isProcessing.value = false;
      }
    };
    const onKeyboardHeightChange = (e) => {
      console.log("Keyboard height changed:", e.detail.height);
      scrollToBottom();
    };
    const checkUserLogin = () => {
      if (!userId.value) {
        console.warn("用户未登录，某些功能可能受限");
      } else {
        console.log("用户已登录，ID:", userId.value);
      }
    };
    const iconMap = {
      Back: "back",
      ChatLineRound: "chatbubble",
      DocumentAdd: "compose"
    };
    common_vendor.onMounted(async () => {
      checkUserLogin();
      if (userId.value) {
        await loadChatHistory();
      } else {
        console.warn("用户未登录，无法加载聊天记录");
      }
      scrollToBottom();
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          color: "#67C23A",
          opacity: 0.1
        }),
        b: common_vendor.o(goBack),
        c: common_vendor.p({
          type: iconMap.Back,
          size: "24",
          color: "#67C23A"
        }),
        d: isAdvancedMode.value
      }, isAdvancedMode.value ? {} : {}, {
        e: isAdvancedMode.value,
        f: common_vendor.o(handleModeChange),
        g: common_vendor.f(chatMessages, (msg, index, i0) => {
          return common_vendor.e({
            a: msg.role === "system"
          }, msg.role === "system" ? {
            b: "bde7e025-2-" + i0,
            c: common_vendor.p({
              type: iconMap.DocumentAdd,
              size: "14"
            })
          } : msg.role === "assistant" ? {
            e: "bde7e025-3-" + i0,
            f: common_vendor.p({
              type: iconMap.ChatLineRound,
              size: "14"
            }),
            g: common_vendor.t(isAdvancedMode.value ? "汉语专家" : "汉语助教")
          } : {}, {
            d: msg.role === "assistant",
            h: common_vendor.t(msg.content),
            i: index,
            j: common_vendor.n(msg.role)
          });
        }),
        h: scrollTop.value,
        i: common_vendor.o(loadMoreHistory),
        j: isRefreshing.value,
        k: common_vendor.o(onRefresh),
        l: scrollViewId.value,
        m: isProcessing.value,
        n: common_vendor.o(sendMessage),
        o: common_vendor.o(onKeyboardHeightChange),
        p: userInput.value,
        q: common_vendor.o(($event) => userInput.value = $event.detail.value),
        r: common_vendor.t(isProcessing.value ? "思考中..." : "发送"),
        s: !userInput.value.trim() || isProcessing.value,
        t: common_vendor.o(sendMessage)
      });
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-bde7e025"]]);
wx.createPage(MiniProgramPage);
