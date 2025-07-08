"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_wordStats = require("../../stores/wordStats.js");
const stores_user = require("../../stores/user.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_uni_tag2 = common_vendor.resolveComponent("uni-tag");
  const _easycom_uni_collapse_item2 = common_vendor.resolveComponent("uni-collapse-item");
  const _easycom_uni_collapse2 = common_vendor.resolveComponent("uni-collapse");
  (_easycom_uni_icons2 + _easycom_uni_tag2 + _easycom_uni_collapse_item2 + _easycom_uni_collapse2)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_uni_tag = () => "../../uni_modules/uni-tag/components/uni-tag/uni-tag.js";
const _easycom_uni_collapse_item = () => "../../uni_modules/uni-collapse/components/uni-collapse-item/uni-collapse-item.js";
const _easycom_uni_collapse = () => "../../uni_modules/uni-collapse/components/uni-collapse/uni-collapse.js";
if (!Math) {
  (NavBar + OrganicBackground + _easycom_uni_icons + _easycom_uni_tag + _easycom_uni_collapse_item + _easycom_uni_collapse)();
}
const NavBar = () => "../../components/NavBar.js";
const OrganicBackground = () => "../../components/OrganicBackground.js";
const _sfc_main = {
  __name: "WordLearning",
  setup(__props) {
    const activeNames = common_vendor.ref(["phrases"]);
    const isStarred = common_vendor.ref(false);
    const showLearningView = common_vendor.ref(false);
    const selectedOption = common_vendor.ref(null);
    const correctOptionIndex = common_vendor.ref(null);
    const currentWordIndex = common_vendor.ref(0);
    const totalWords = common_vendor.ref(5);
    const loading = common_vendor.ref(false);
    const wordData = common_vendor.ref({});
    common_vendor.ref([]);
    const currentBatch = common_vendor.ref([]);
    const wordOptions = common_vendor.ref([]);
    const starredWords = common_vendor.ref([]);
    const selectedCorrect = common_vendor.ref(false);
    const hasChecked = common_vendor.ref(false);
    const params = common_vendor.reactive({
      userId: "",
      bookId: "",
      level: "HSK3",
      wordIds: []
    });
    const wordStatsStore = stores_wordStats.useWordStatsStore();
    stores_user.useUserStore();
    common_vendor.onLoad(async (options) => {
      params.userId = options.userId || "";
      params.bookId = options.bookId || "";
      params.level = options.level || "HSK3";
      wordStatsStore.initStats();
      if (params.userId) {
        try {
          const { result } = await common_vendor.Zs.callFunction({
            name: "getUserStats",
            data: { user_id: params.userId }
          });
          if (result.code === 200 && result.data) {
            const now = /* @__PURE__ */ new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const serverDate = new Date(result.data.date);
            if (serverDate.getTime() === today.getTime()) {
              wordStatsStore.todayNewWords = result.data.new_words_count || 0;
              wordStatsStore.todayFavoriteWords = result.data.favorite_words_count || 0;
              wordStatsStore.lastUpdateDate = today;
              wordStatsStore.updateStatsToServer();
              console.log("从服务器加载统计数据:", wordStatsStore.todayNewWords, wordStatsStore.todayFavoriteWords);
            }
          }
        } catch (error) {
          console.error("获取服务器统计数据失败:", error);
        }
      }
      if (options.wordIds) {
        try {
          params.wordIds = JSON.parse(decodeURIComponent(options.wordIds));
        } catch (error) {
          console.error("解析wordIds失败:", error);
          params.wordIds = [];
        }
      }
      if (options.wordData) {
        try {
          const parsedWordData = JSON.parse(decodeURIComponent(options.wordData));
          currentBatch.value = parsedWordData;
          totalWords.value = parsedWordData.length;
          const starred = common_vendor.index.getStorageSync("starred_words") || [];
          starredWords.value = starred;
          if (parsedWordData.length > 0) {
            loadWordDataFromCache(0);
          }
          console.log("成功从URL参数加载单词数据");
        } catch (error) {
          console.error("解析词汇数据失败:", error);
          common_vendor.index.showToast({
            title: "数据加载失败，请返回重试",
            icon: "none",
            duration: 2e3
          });
          setTimeout(() => {
            common_vendor.index.navigateBack();
          }, 2e3);
        }
      } else {
        getNewWordList();
      }
    });
    const getNewWordList = async () => {
      try {
        loading.value = true;
        const { result } = await common_vendor.Zs.callFunction({
          name: "getWordList",
          data: {
            bookId: params.bookId,
            limit: 5,
            userId: params.userId
            // 添加userId参数
          }
        });
        if (result.code === 200) {
          if (result.data.length === 0) {
            common_vendor.index.showModal({
              title: "提示",
              content: result.message || "当前词书的单词已经全部学习完成！",
              showCancel: false,
              success: () => {
                common_vendor.index.navigateBack();
              }
            });
            return;
          }
          currentBatch.value = result.data;
          totalWords.value = result.data.length;
          wordStatsStore.setRemainingWords(result.total_remaining);
          if (result.data.length > 0) {
            loadWordDataFromCache(0);
          }
        } else {
          common_vendor.index.showToast({
            title: "获取单词列表失败",
            icon: "none"
          });
        }
      } catch (error) {
        console.error("获取单词列表失败:", error);
        common_vendor.index.showToast({
          title: "获取单词列表失败",
          icon: "none"
        });
      } finally {
        loading.value = false;
      }
    };
    const loadWordDataFromCache = (index) => {
      try {
        if (index >= 0 && index < currentBatch.value.length) {
          const data = currentBatch.value[index];
          wordData.value = {
            word: data.word,
            pronunciation: data.pinyin,
            type: data.type,
            definition: data.definitions.join("; "),
            grammar: {
              title: data.grammar.title,
              pattern: data.grammar.pattern,
              notes: data.grammar.notes,
              level: data.grammar.level
            },
            examples: data.examples.map((example) => ({
              text: example.text,
              pinyin: example.pinyin,
              translation: example.translation
            })),
            phrases: data.phrases || []
          };
          isStarred.value = starredWords.value.includes(data.word);
          if (data.answer_options && Array.isArray(data.answer_options) && data.answer_options.length >= 4) {
            wordOptions.value = data.answer_options;
            correctOptionIndex.value = data.answer_options.findIndex((option) => option.isCorrect);
          } else {
            wordOptions.value = generateDefaultOptions(data.definitions[0]);
            correctOptionIndex.value = 0;
          }
          currentWordIndex.value = index;
        }
      } catch (error) {
        console.error("从缓存加载单词数据失败:", error);
      }
    };
    const toggleStar = async () => {
      if (!wordData.value.word)
        return;
      const newStarStatus = !isStarred.value;
      isStarred.value = newStarStatus;
      const word = wordData.value.word;
      let starred = common_vendor.index.getStorageSync("starred_words") || [];
      if (isStarred.value) {
        if (!starred.includes(word)) {
          starred.push(word);
        }
      } else {
        starred = starred.filter((w) => w !== word);
      }
      common_vendor.index.setStorageSync("starred_words", starred);
      starredWords.value = starred;
      common_vendor.index.showToast({
        title: isStarred.value ? "已收藏" : "已取消收藏",
        icon: "none"
      });
      try {
        const { result } = await common_vendor.Zs.callFunction({
          name: "updateWordProgress",
          data: {
            word,
            user_id: params.userId,
            book_id: params.bookId,
            is_learned: false,
            // 收藏不影响学习状态
            is_favorite: newStarStatus,
            update_count: true
            // 设置为true，让云函数更新收藏计数
          }
        });
        if (result.code === 200) {
          console.log("成功更新收藏状态");
          if (newStarStatus) {
            wordStatsStore.addFavoriteWord();
          } else {
            wordStatsStore.removeFavoriteWord();
          }
          wordStatsStore.updateStatsToServer();
        }
      } catch (error) {
        console.error("更新收藏状态失败:", error);
      }
    };
    const checkAnswer = async () => {
      if (selectedOption.value === null) {
        return;
      }
      if (hasChecked.value) {
        showLearningView.value = true;
        return;
      }
      const isCorrect = wordOptions.value[selectedOption.value].isCorrect;
      hasChecked.value = true;
      selectedCorrect.value = isCorrect;
      if (isCorrect) {
        try {
          const saveResult = await common_vendor.Zs.callFunction({
            name: "saveWords",
            data: {
              word: {
                word: wordData.value.word,
                pinyin: wordData.value.pronunciation,
                type: wordData.value.type,
                definitions: wordData.value.definition,
                grammar: wordData.value.grammar,
                examples: wordData.value.examples,
                phrases: wordData.value.phrases || []
              },
              bookId: params.bookId,
              userId: params.userId,
              level: params.level,
              correctOnly: true
            }
          });
          if (saveResult.result.code === 200 && saveResult.result.data.word_ids.length > 0) {
            console.log("单词保存成功，ID:", saveResult.result.data.word_ids[0]);
            await markWordAsLearned(saveResult.result.data.word_ids[0]);
          }
        } catch (error) {
          console.error("保存单词失败:", error);
        }
      }
      common_vendor.index.showToast({
        title: isCorrect ? "回答正确！" : "回答错误",
        icon: isCorrect ? "success" : "error",
        duration: 1500
      });
    };
    const markWordAsLearned = async (wordId) => {
      try {
        if (!wordId || !wordData.value.word) {
          console.log("无效的单词ID或单词数据");
          return;
        }
        const progressResult = await common_vendor.Zs.callFunction({
          name: "updateWordProgress",
          data: {
            word: wordData.value.word,
            user_id: params.userId,
            book_id: params.bookId,
            is_learned: true,
            update_count: true
            // 设置为true，表示需要更新学习计数
          }
        });
        if (progressResult.result.code === 200) {
          console.log("单词进度更新成功");
          try {
            if (!progressResult.result.data.is_already_learned) {
              wordStatsStore.incrementWordsLearned(1);
              console.log("统计数据更新成功");
            } else {
              console.log("单词已学习过，不更新统计数据");
            }
          } catch (error) {
            console.error("更新统计数据失败:", error);
          }
        }
      } catch (error) {
        console.error("标记单词为已学习失败:", error);
      }
    };
    const nextWord = () => {
      if (currentWordIndex.value < currentBatch.value.length - 1) {
        selectedOption.value = null;
        correctOptionIndex.value = null;
        selectedCorrect.value = false;
        hasChecked.value = false;
        showLearningView.value = false;
        loadWordDataFromCache(currentWordIndex.value + 1);
      } else {
        common_vendor.index.showToast({
          title: "已经是最后一个单词了",
          icon: "none"
        });
        setTimeout(() => {
          updateBookProgress();
          common_vendor.index.navigateBack();
        }, 1500);
      }
    };
    const updateBookProgress = async () => {
      try {
        if (params.userId && params.bookId) {
          const { result } = await common_vendor.Zs.callFunction({
            name: "getWordbookProgress",
            data: {
              user_id: params.userId,
              book_id: params.bookId
            }
          });
          if (result.code === 200) {
            console.log("词书进度更新成功，已学习单词数:", result.data.learned_count);
          }
        }
      } catch (error) {
        console.error("更新词书进度失败:", error);
      }
    };
    const generateDefaultOptions = (correctAnswer) => {
      const options = [
        { text: correctAnswer, isCorrect: true },
        { text: "用于表示时间的词语", isCorrect: false },
        { text: "用于表示地点的词语", isCorrect: false },
        { text: "用于表示方式的词语", isCorrect: false }
      ];
      return options.sort(() => Math.random() - 0.5);
    };
    const selectOption = (index) => {
      if (hasChecked.value)
        return;
      selectedOption.value = index;
    };
    const playPronunciation = () => {
      console.log("Playing pronunciation");
    };
    const loadLearningData = () => {
      try {
        const starred = common_vendor.index.getStorageSync("starred_words") || [];
        starredWords.value = starred;
      } catch (error) {
        console.error("加载学习数据失败:", error);
      }
    };
    loadLearningData();
    return (_ctx, _cache) => {
      return common_vendor.e({
        a: common_vendor.p({
          title: "单词学习"
        }),
        b: common_vendor.p({
          color: "#67C23A",
          opacity: 0.1
        }),
        c: !showLearningView.value
      }, !showLearningView.value ? {
        d: common_vendor.t(currentWordIndex.value + 1),
        e: common_vendor.t(totalWords.value),
        f: common_vendor.t(wordData.value.word),
        g: common_vendor.t(wordData.value.pronunciation),
        h: common_vendor.p({
          type: "star",
          size: "24",
          color: isStarred.value ? "#FFB302" : "#909399"
        }),
        i: common_vendor.o(toggleStar),
        j: common_vendor.f(wordOptions.value, (option, index, i0) => {
          return {
            a: common_vendor.t(option.text),
            b: index,
            c: selectedOption.value === index ? 1 : "",
            d: hasChecked.value && option.isCorrect ? 1 : "",
            e: hasChecked.value && selectedOption.value === index && !option.isCorrect ? 1 : "",
            f: common_vendor.o(($event) => selectOption(index), index)
          };
        }),
        k: common_vendor.t(hasChecked.value ? "查看详情" : "提交答案"),
        l: common_vendor.o(checkAnswer),
        m: selectedOption.value === null ? 1 : ""
      } : {
        n: common_vendor.t(wordData.value.word),
        o: common_vendor.o(playPronunciation),
        p: common_vendor.p({
          type: "headphones",
          size: "18"
        }),
        q: common_vendor.t(wordData.value.pronunciation),
        r: common_vendor.p({
          type: "success",
          text: wordData.value.type
        }),
        s: common_vendor.t(wordData.value.definition),
        t: common_vendor.t(wordData.value.grammar.title),
        v: common_vendor.p({
          size: "small",
          type: "warning",
          text: wordData.value.grammar.level
        }),
        w: common_vendor.p({
          type: "arrow-right",
          color: "#67C23A",
          size: "18"
        }),
        x: common_vendor.t(wordData.value.grammar.pattern),
        y: common_vendor.t(wordData.value.grammar.notes),
        z: common_vendor.f(wordData.value.examples, (example, index, i0) => {
          return {
            a: "bfa6013d-7-" + i0,
            b: common_vendor.t(example.text),
            c: common_vendor.t(example.pinyin),
            d: common_vendor.t(example.translation),
            e: index
          };
        }),
        A: common_vendor.p({
          type: "chatboxes-fill",
          size: "18"
        }),
        B: common_vendor.f(wordData.value.phrases, (phrase, index, i0) => {
          return {
            a: common_vendor.t(phrase.chinese),
            b: common_vendor.t(phrase.pinyin),
            c: common_vendor.t(phrase.english),
            d: index
          };
        }),
        C: common_vendor.p({
          title: "Related phrases",
          name: "phrases"
        }),
        D: common_vendor.o(($event) => activeNames.value = $event),
        E: common_vendor.p({
          modelValue: activeNames.value
        }),
        F: common_vendor.p({
          type: "reload",
          size: "26"
        }),
        G: common_vendor.o(nextWord),
        H: common_vendor.p({
          type: "arrow-right",
          size: "26"
        })
      });
    };
  }
};
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-bfa6013d"]]);
wx.createPage(MiniProgramPage);
