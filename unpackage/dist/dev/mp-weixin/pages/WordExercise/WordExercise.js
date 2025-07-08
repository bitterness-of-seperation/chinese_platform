"use strict";
const common_vendor = require("../../common/vendor.js");
const api_scenarioExerciseAI = require("../../api/scenarioExerciseAI.js");
const stores_user = require("../../stores/user.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_uni_popup_message2 = common_vendor.resolveComponent("uni-popup-message");
  const _easycom_uni_popup2 = common_vendor.resolveComponent("uni-popup");
  (_easycom_uni_icons2 + _easycom_uni_popup_message2 + _easycom_uni_popup2)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_uni_popup_message = () => "../../uni_modules/uni-popup/components/uni-popup-message/uni-popup-message.js";
const _easycom_uni_popup = () => "../../uni_modules/uni-popup/components/uni-popup/uni-popup.js";
if (!Math) {
  (NavBar + OrganicBackground + _easycom_uni_icons + _easycom_uni_popup_message + _easycom_uni_popup)();
}
const NavBar = () => "../../components/NavBar.js";
const OrganicBackground = () => "../../components/OrganicBackground.js";
const _sfc_main = {
  __name: "WordExercise",
  setup(__props) {
    const currentIndex = common_vendor.ref(0);
    const exercises = common_vendor.ref([]);
    const currentExercise = common_vendor.ref(null);
    const selectedIdx = common_vendor.ref(null);
    const showAnswer = common_vendor.ref(false);
    const selectedExplanation = common_vendor.ref("");
    const isAnswerCorrect = common_vendor.ref(false);
    common_vendor.ref("");
    const popup = common_vendor.ref(null);
    const bookId = common_vendor.ref("");
    const userStore = stores_user.useUserStore();
    common_vendor.ref(false);
    const isLoading = common_vendor.ref(true);
    common_vendor.ref("");
    const totalExercises = common_vendor.computed(() => exercises.value.length);
    const loadExercises = async (words, bookId2) => {
      isLoading.value = true;
      try {
        common_vendor.index.showLoading({
          title: "加载练习题..."
        });
        if (words.length === 1) {
          const result = await api_scenarioExerciseAI.scenarioExerciseAI.generateScenarioExercise(words[0]);
          if (result.success) {
            const exercise = {
              ...result.exercise,
              word_id: words[0]
              // 使用传入的word_id
            };
            exercises.value = [exercise];
            currentExercise.value = exercise;
          } else {
            throw new Error(result.message || "生成练习题失败");
          }
        } else {
          const result = await api_scenarioExerciseAI.scenarioExerciseAI.generateBatchExercises(words);
          if (result.success) {
            const exercisesWithIds = result.exercises.map((exercise, index) => ({
              ...exercise,
              word_id: words[index]
              // 使用对应的word_id
            }));
            exercises.value = exercisesWithIds;
            currentExercise.value = exercises.value[0];
          } else {
            throw new Error(result.message || "批量生成练习题失败");
          }
        }
        currentIndex.value = 0;
      } catch (error) {
        console.error("加载练习题失败:", error);
        if (popup.value) {
          popup.value.open();
        }
        exercises.value = [{
          word: words[0] || "把",
          word_id: words[0] || "把",
          // 确保默认练习题也有word_id
          book_id: bookId2,
          sentence: "他把牛奶打翻了。",
          blank_sentence: "他___牛奶打翻了。",
          translation: "He knocked over the milk.",
          options: [
            { text: "把", is_correct: true, explanation: '"把"用于将动作的对象提前。' },
            { text: "被", is_correct: false, explanation: '"被"用于被动句，这里是主动句。' },
            { text: "从", is_correct: false, explanation: '"从"表示起点，不适合此句。' },
            { text: "向", is_correct: false, explanation: '"向"表示方向，不适合此句。' }
          ],
          hint: '使用"把"字句时，通常将动作的对象提前，后面接动作和结果。',
          context: "在厨房里，一个人不小心碰到了杯子。",
          level: "HSK3"
        }];
        currentExercise.value = exercises.value[0];
      } finally {
        common_vendor.index.hideLoading();
        isLoading.value = false;
      }
    };
    function selectOption(idx) {
      if (showAnswer.value)
        return;
      selectedIdx.value = idx;
    }
    async function checkAnswer() {
      if (selectedIdx.value === null)
        return;
      showAnswer.value = true;
      const selectedOption = currentExercise.value.options[selectedIdx.value];
      isAnswerCorrect.value = selectedOption.is_correct;
      selectedExplanation.value = selectedOption.explanation;
      if (isAnswerCorrect.value) {
        try {
          const { result } = await common_vendor.Zs.callFunction({
            name: "updateExerciseProgress",
            data: {
              word_id: currentExercise.value.word_id,
              user_id: userStore.userId,
              wordbook_id: bookId.value,
              correct: true
            }
          });
          if (result.code === 200) {
            console.log("练习状态更新成功");
          } else {
            console.error("练习状态更新失败:", result.message);
          }
        } catch (error) {
          console.error("更新练习状态出错:", error);
        }
      }
    }
    function nextExercise() {
      if (currentIndex.value < exercises.value.length - 1) {
        currentIndex.value++;
        currentExercise.value = exercises.value[currentIndex.value];
        resetExercise();
      } else {
        common_vendor.index.showToast({
          title: "练习完成！",
          icon: "success"
        });
        setTimeout(() => {
          common_vendor.index.navigateBack();
        }, 1500);
      }
    }
    function resetExercise() {
      selectedIdx.value = null;
      showAnswer.value = false;
      selectedExplanation.value = "";
      isAnswerCorrect.value = false;
    }
    const getWordsToExercise = async (bookId2) => {
      try {
        if (!bookId2) {
          console.error("词书ID为空");
          common_vendor.index.showModal({
            title: "提示",
            content: "请先选择词书",
            showCancel: false,
            success: () => {
              common_vendor.index.navigateBack();
            }
          });
          return [];
        }
        common_vendor.index.showLoading({
          title: "获取词汇列表..."
        });
        if (!userStore.isLoggedIn || !userStore.userId) {
          common_vendor.index.hideLoading();
          common_vendor.index.showModal({
            title: "提示",
            content: "请先登录后再进行练习",
            showCancel: false,
            success: () => {
              common_vendor.index.navigateTo({
                url: "/pages/login/login"
              });
            }
          });
          return [];
        }
        console.log("获取练习词汇，参数:", {
          user_id: userStore.userId,
          book_id: bookId2
        });
        const { result } = await common_vendor.Zs.callFunction({
          name: "getWordbookProgress",
          data: {
            user_id: userStore.userId,
            book_id: bookId2
          }
        });
        console.log("getWordbookProgress返回结果:", result);
        common_vendor.index.hideLoading();
        if (result.code === 200 && result.data) {
          const learnedWords = result.data.learned_words || [];
          const exercisedWords = result.data.is_exercised || [];
          console.log("已学习的词:", learnedWords);
          console.log("已练习的词:", exercisedWords);
          if (learnedWords.length === 0) {
            return new Promise((resolve) => {
              common_vendor.index.showModal({
                title: "提示",
                content: "您还没有学习任何词汇，是否现在去学习？",
                success: (res) => {
                  if (res.confirm) {
                    common_vendor.index.navigateTo({
                      url: `/pages/WordLearning/WordLearning?book_id=${bookId2}`
                    });
                  } else {
                    common_vendor.index.navigateBack();
                  }
                  resolve([]);
                }
              });
            });
          }
          const wordsToExercise = learnedWords.filter((wordId) => !exercisedWords.includes(wordId));
          console.log("待练习的词:", wordsToExercise);
          if (wordsToExercise.length === 0) {
            return new Promise((resolve) => {
              common_vendor.index.showModal({
                title: "提示",
                content: "您已完成所有单词的练习，是否重新练习所学单词？",
                success: (res) => {
                  if (res.confirm) {
                    const shuffled2 = shuffleArray([...learnedWords]);
                    resolve(shuffled2.slice(0, 10));
                  } else {
                    common_vendor.index.navigateBack();
                    resolve([]);
                  }
                }
              });
            });
          }
          const shuffled = shuffleArray([...wordsToExercise]);
          return shuffled.slice(0, 10);
        }
        common_vendor.index.showModal({
          title: "错误",
          content: result.message || "获取词汇列表失败",
          showCancel: false,
          success: () => {
            common_vendor.index.navigateBack();
          }
        });
        return [];
      } catch (error) {
        console.error("获取练习词汇失败:", error);
        common_vendor.index.hideLoading();
        common_vendor.index.showModal({
          title: "错误",
          content: "获取练习词汇失败，请稍后重试",
          showCancel: false,
          success: () => {
            common_vendor.index.navigateBack();
          }
        });
        return [];
      }
    };
    function shuffleArray(array) {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    }
    common_vendor.onMounted(async () => {
      if (!userStore.isLoggedIn) {
        common_vendor.index.showModal({
          title: "提示",
          content: "请先登录后再进行练习",
          showCancel: false,
          success: () => {
            common_vendor.index.navigateTo({
              url: "/pages/login/login"
            });
          }
        });
        return;
      }
    });
    common_vendor.onLoad(async (options) => {
      console.log("页面加载参数:", options);
      console.log("当前用户ID:", userStore.userId);
      if (!options.book_id) {
        console.log("缺少词书ID，准备选择词书");
        selectWordbook();
        return;
      }
      bookId.value = options.book_id;
      console.log("词书ID:", bookId.value);
      try {
        const words = await getWordsToExercise(bookId.value);
        console.log("获取到的词语列表:", words);
        if (words && words.length > 0) {
          await loadExercises(words, bookId.value);
        } else {
          common_vendor.index.showModal({
            title: "提示",
            content: "没有可练习的词语，请先去学习一些词语",
            showCancel: false,
            success: () => {
              common_vendor.index.navigateTo({
                url: `/pages/WordLearning/WordLearning?book_id=${bookId.value}`
              });
            }
          });
        }
      } catch (error) {
        console.error("加载练习失败:", error);
        common_vendor.index.showModal({
          title: "错误",
          content: error.message || "加载练习失败，请稍后重试",
          showCancel: false,
          success: () => {
            common_vendor.index.navigateBack();
          }
        });
      }
    });
    const selectWordbook = async () => {
      try {
        common_vendor.index.showLoading({
          title: "获取词书列表..."
        });
        if (!userStore.isLoggedIn || !userStore.userId) {
          common_vendor.index.hideLoading();
          common_vendor.index.showModal({
            title: "提示",
            content: "请先登录后再进行练习",
            showCancel: false,
            success: () => {
              common_vendor.index.navigateTo({
                url: "/pages/login/login"
              });
            }
          });
          return;
        }
        const { result } = await common_vendor.Zs.callFunction({
          name: "getWordbooks"
        });
        common_vendor.index.hideLoading();
        if (result.code === 200 && Array.isArray(result.data)) {
          if (result.data.length === 0) {
            common_vendor.index.showModal({
              title: "提示",
              content: "系统中还没有任何词书，请联系管理员添加",
              showCancel: false,
              success: () => {
                common_vendor.index.navigateBack();
              }
            });
            return;
          }
          const wordbookItems = result.data.map((book) => ({
            text: `${book.name}（${book.total_words || 0}词）`,
            value: book._id
          }));
          common_vendor.index.showActionSheet({
            itemList: wordbookItems.map((item) => item.text),
            success: async (res) => {
              var _a;
              const selectedBookId = wordbookItems[res.tapIndex].value;
              const { result: progressResult } = await common_vendor.Zs.callFunction({
                name: "getWordbookProgress",
                data: {
                  user_id: userStore.userId,
                  book_id: selectedBookId
                }
              });
              if (progressResult.code === 200 && progressResult.data && ((_a = progressResult.data.learned_words) == null ? void 0 : _a.length) > 0) {
                common_vendor.index.redirectTo({
                  url: `/pages/WordExercise/WordExercise?book_id=${selectedBookId}`
                });
              } else {
                common_vendor.index.showModal({
                  title: "提示",
                  content: "您还没有学习这本词书中的词汇，是否现在去学习？",
                  success: (res2) => {
                    if (res2.confirm) {
                      common_vendor.index.navigateTo({
                        url: `/pages/WordLearning/WordLearning?book_id=${selectedBookId}`
                      });
                    } else {
                      common_vendor.index.navigateBack();
                    }
                  }
                });
              }
            },
            fail: () => {
              common_vendor.index.navigateBack();
            }
          });
        } else {
          throw new Error(result.message || "获取词书失败");
        }
      } catch (error) {
        console.error("获取词书失败:", error);
        common_vendor.index.hideLoading();
        common_vendor.index.showModal({
          title: "错误",
          content: "获取词书列表失败，请稍后再试",
          showCancel: false,
          success: () => {
            common_vendor.index.navigateBack();
          }
        });
      }
    };
    common_vendor.watch(currentIndex, () => {
      selectedIdx.value = null;
      showAnswer.value = false;
    });
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          title: "情景练习 " + (currentIndex.value + 1) + "/" + totalExercises.value
        }),
        b: common_vendor.p({
          color: "#67C23A",
          opacity: 0.1
        }),
        c: currentExercise.value
      }, currentExercise.value ? {
        d: common_vendor.t(currentIndex.value + 1),
        e: common_vendor.t(totalExercises.value),
        f: common_vendor.t(currentExercise.value.context),
        g: common_vendor.t(currentExercise.value.translation),
        h: common_vendor.t(currentExercise.value.sentence)
      } : {}, {
        i: currentExercise.value
      }, currentExercise.value ? {
        j: common_vendor.f(currentExercise.value.options, (opt, idx, i0) => {
          return common_vendor.e({
            a: showAnswer.value && opt.is_correct
          }, showAnswer.value && opt.is_correct ? {
            b: "1c129567-2-" + i0,
            c: common_vendor.p({
              type: "checkbox-filled",
              size: "24",
              color: "#67C23A"
            })
          } : showAnswer.value && selectedIdx.value === idx && !opt.is_correct ? {
            e: "1c129567-3-" + i0,
            f: common_vendor.p({
              type: "closeempty",
              size: "24",
              color: "#F56C6C"
            })
          } : {
            g: "1c129567-4-" + i0,
            h: common_vendor.p({
              type: "circle",
              size: "24",
              color: selectedIdx.value === idx ? "#67C23A" : "#DCDFE6"
            })
          }, {
            d: showAnswer.value && selectedIdx.value === idx && !opt.is_correct,
            i: common_vendor.t(opt.text),
            j: idx,
            k: selectedIdx.value === idx ? 1 : "",
            l: showAnswer.value && opt.is_correct ? 1 : "",
            m: showAnswer.value && selectedIdx.value === idx && !opt.is_correct ? 1 : "",
            n: common_vendor.o(($event) => selectOption(idx), idx)
          });
        })
      } : {}, {
        k: showAnswer.value
      }, showAnswer.value ? {
        l: common_vendor.p({
          type: isAnswerCorrect.value ? "checkmarkempty" : "closeempty",
          size: "24",
          color: isAnswerCorrect.value ? "#67C23A" : "#F56C6C"
        }),
        m: common_vendor.t(isAnswerCorrect.value ? "回答正确！" : "再试一次！"),
        n: common_vendor.t(selectedExplanation.value)
      } : {}, {
        o: common_vendor.t(showAnswer.value ? "继续" : "检查"),
        p: selectedIdx.value === null && !showAnswer.value ? 1 : "",
        q: common_vendor.o(($event) => showAnswer.value ? nextExercise() : checkAnswer()),
        r: common_vendor.p({
          type: "error",
          message: "缺少词ID参数",
          duration: 2e3
        }),
        s: common_vendor.sr(popup, "1c129567-6", {
          "k": "popup"
        }),
        t: common_vendor.p({
          type: "message"
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-1c129567"]]);
wx.createPage(MiniProgramPage);
