"use strict";
const common_vendor = require("../../common/vendor.js");
if (!Array) {
  const _easycom_uni_icons2 = common_vendor.resolveComponent("uni-icons");
  const _easycom_uni_load_more2 = common_vendor.resolveComponent("uni-load-more");
  (_easycom_uni_icons2 + _easycom_uni_load_more2)();
}
const _easycom_uni_icons = () => "../../uni_modules/uni-icons/components/uni-icons/uni-icons.js";
const _easycom_uni_load_more = () => "../../uni_modules/uni-load-more/components/uni-load-more/uni-load-more.js";
if (!Math) {
  (OrganicBackground + _easycom_uni_icons + _easycom_uni_load_more)();
}
const OrganicBackground = () => "../../components/OrganicBackground.js";
const _sfc_main = /* @__PURE__ */ common_vendor.defineComponent({
  __name: "Dictionary",
  setup(__props) {
    const userInfo = common_vendor.index.getStorageSync("userInfo") || {};
    const userId = userInfo._id || null;
    const searchInput = common_vendor.ref("");
    const selectedWord = common_vendor.ref("");
    const selectedDictionary = common_vendor.ref("1934900239169458176");
    const isLoading = common_vendor.ref(false);
    const loadingText = common_vendor.reactive({
      contentrefresh: "加载中...",
      contentnomore: "没有更多了",
      contentdown: "上拉显示更多"
    });
    const searchHistory = common_vendor.ref([]);
    const dictionaries = common_vendor.reactive([
      {
        id: "1934900239169458176",
        name: "现代汉语语法研究教程（第4版）",
        description: "现代汉语语法研究教程第四版教材"
      },
      {
        id: "1934532306580746240",
        name: "现代汉语八百词（修订版）",
        description: "现代汉语八百词修订版教材"
      }
    ]);
    const hotWords = common_vendor.ref([]);
    const wordDetails = common_vendor.reactive({});
    const initData = async () => {
      try {
        try {
          const { result } = await common_vendor.Zs.callFunction({
            name: "getHotWords",
            data: { limit: 10 }
          });
          if (result && result.code === 200) {
            hotWords.value = result.data;
          }
        } catch (hotWordsError) {
          console.error("获取热词失败:", hotWordsError);
        }
        if (userId) {
          try {
            const { result: historyResult } = await common_vendor.Zs.callFunction({
              name: "getUserSearchHistory",
              data: {
                user_id: userId,
                limit: 10,
                sort_by: "date"
              }
            });
            if (historyResult && historyResult.code === 200) {
              searchHistory.value = historyResult.data;
            }
          } catch (historyError) {
            console.error("获取搜索历史失败:", historyError);
          }
        } else {
          const historyResult = await common_vendor.Zs.callFunction({
            name: "getSearchHistory",
            data: { limit: 5 }
          });
          if (historyResult.result && historyResult.result.code === 200) {
            searchHistory.value = historyResult.result.data;
          }
        }
      } catch (error) {
        console.error("初始化数据失败:", error);
        common_vendor.index.showToast({
          title: "加载数据失败，请稍后重试",
          icon: "none",
          duration: 3e3
        });
      }
    };
    common_vendor.onMounted(() => {
      initData();
    });
    const goBack = () => {
      common_vendor.index.navigateBack({
        delta: 1,
        fail: () => {
          common_vendor.index.switchTab({ url: "/pages/Home/Home" });
        }
      });
    };
    const handleSearch = async () => {
      const word = searchInput.value.trim();
      console.log("开始搜索词语:", word);
      if (!word) {
        console.log("搜索词为空，退出搜索");
        return;
      }
      isLoading.value = true;
      try {
        const { result } = await common_vendor.Zs.callFunction({
          name: "searchWord",
          data: {
            word,
            user_id: userId
          }
        });
        console.log("搜索结果:", result);
        if (result.code !== 200) {
          common_vendor.index.showToast({
            title: result.message,
            icon: "none",
            duration: 3e3
          });
          return;
        }
        wordDetails[word] = result.data;
        selectedWord.value = word;
        await initData();
      } catch (error) {
        console.error("查询失败:", error);
        common_vendor.index.showToast({
          title: "查询失败，请稍后重试",
          icon: "none",
          duration: 3e3
        });
      } finally {
        isLoading.value = false;
        searchInput.value = "";
      }
    };
    const selectWord = async (word) => {
      if (typeof word !== "string") {
        console.error("Invalid word type:", word);
        return;
      }
      searchInput.value = word;
      await handleSearch();
    };
    const selectDictionary = (e) => {
      const index = parseInt(e.detail.value);
      if (!isNaN(index) && index >= 0 && index < dictionaries.length) {
        selectedDictionary.value = dictionaries[index].id;
      }
    };
    const playPronunciation = () => {
      var _a;
      if (!selectedWord.value)
        return;
      try {
        const innerAudioContext = common_vendor.index.createInnerAudioContext();
        const text = selectedWord.value;
        const pinyin = ((_a = wordDetails[selectedWord.value]) == null ? void 0 : _a.pinyin) || "";
        if ("speechSynthesis" in window) {
          const speech = new SpeechSynthesisUtterance(text);
          speech.lang = "zh-CN";
          speech.rate = 0.8;
          window.speechSynthesis.speak(speech);
        } else {
          common_vendor.index.showToast({
            title: "当前环境不支持语音功能",
            icon: "none",
            duration: 2e3
          });
        }
      } catch (error) {
        console.error("播放发音失败:", error);
        common_vendor.index.showToast({
          title: "播放失败，请稍后重试",
          icon: "none",
          duration: 2e3
        });
      }
    };
    const backToSearch = () => {
      selectedWord.value = "";
    };
    const formatCount = (count) => {
      if (count >= 1e6) {
        return `${(count / 1e6).toFixed(1)}M`;
      } else if (count >= 1e3) {
        return `${(count / 1e3).toFixed(1)}K`;
      }
      return `${count}`;
    };
    const iconMap = {
      Back: "back",
      Search: "search",
      ChatLineRound: "chatbubble",
      Headset: "sound",
      Close: "closeempty",
      ArrowDown: "bottom"
    };
    return (_ctx, _cache) => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i;
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
        d: !selectedWord.value
      }, !selectedWord.value ? common_vendor.e({
        e: common_vendor.t((_a = dictionaries.find((d) => d.id === selectedDictionary.value)) == null ? void 0 : _a.name),
        f: common_vendor.p({
          type: "bottom",
          size: "24",
          color: "#909399"
        }),
        g: common_vendor.o(selectDictionary),
        h: dictionaries.findIndex((d) => d.id === selectedDictionary.value),
        i: dictionaries,
        j: common_vendor.o(handleSearch),
        k: searchInput.value,
        l: common_vendor.o(($event) => searchInput.value = $event.detail.value),
        m: common_vendor.p({
          type: iconMap.Search,
          size: "20",
          color: "#909399"
        }),
        n: common_vendor.o(handleSearch),
        o: searchHistory.value.length > 0
      }, searchHistory.value.length > 0 ? {
        p: common_vendor.f(searchHistory.value, (item, k0, i0) => {
          return {
            a: common_vendor.t(item.word),
            b: item.word,
            c: common_vendor.o(($event) => selectWord(item.word), item.word)
          };
        })
      } : {}, {
        q: hotWords.value.length > 0
      }, hotWords.value.length > 0 ? {
        r: common_vendor.f(hotWords.value, (item, index, i0) => {
          return {
            a: common_vendor.t(index + 1),
            b: index < 3 ? 1 : "",
            c: common_vendor.t(item.word),
            d: common_vendor.t(formatCount(item.count)),
            e: item.word,
            f: common_vendor.o(($event) => selectWord(item.word), item.word)
          };
        })
      } : {}) : selectedWord.value && wordDetails[selectedWord.value] ? common_vendor.e({
        t: common_vendor.p({
          type: iconMap.Close,
          size: "20",
          color: "#909399"
        }),
        v: common_vendor.o(backToSearch),
        w: common_vendor.t(wordDetails[selectedWord.value].word),
        x: wordDetails[selectedWord.value].pinyin
      }, wordDetails[selectedWord.value].pinyin ? {
        y: common_vendor.t(wordDetails[selectedWord.value].pinyin)
      } : {}, {
        z: wordDetails[selectedWord.value].pinyin
      }, wordDetails[selectedWord.value].pinyin ? {
        A: common_vendor.p({
          type: iconMap.Headset,
          size: "20"
        }),
        B: common_vendor.o(playPronunciation)
      } : {}, {
        C: wordDetails[selectedWord.value].basic_meaning
      }, wordDetails[selectedWord.value].basic_meaning ? common_vendor.e({
        D: common_vendor.t(wordDetails[selectedWord.value].basic_meaning.title),
        E: common_vendor.t(wordDetails[selectedWord.value].basic_meaning.content),
        F: wordDetails[selectedWord.value].basic_meaning.english
      }, wordDetails[selectedWord.value].basic_meaning.english ? {
        G: common_vendor.t(wordDetails[selectedWord.value].basic_meaning.english)
      } : {}) : {}, {
        H: ((_c = (_b = wordDetails[selectedWord.value].core_usage) == null ? void 0 : _b.patterns) == null ? void 0 : _c.length) > 0
      }, ((_e = (_d = wordDetails[selectedWord.value].core_usage) == null ? void 0 : _d.patterns) == null ? void 0 : _e.length) > 0 ? {
        I: common_vendor.t(wordDetails[selectedWord.value].core_usage.title),
        J: common_vendor.f(wordDetails[selectedWord.value].core_usage.patterns, (pattern, index, i0) => {
          var _a2, _b2, _c2, _d2;
          return common_vendor.e({
            a: common_vendor.t(pattern.title),
            b: pattern.structure
          }, pattern.structure ? {
            c: common_vendor.t(pattern.structure)
          } : {}, {
            d: ((_a2 = pattern.features) == null ? void 0 : _a2.length) > 0
          }, ((_b2 = pattern.features) == null ? void 0 : _b2.length) > 0 ? {
            e: common_vendor.f(pattern.features, (feature, featureIndex, i1) => {
              return {
                a: common_vendor.t(feature),
                b: featureIndex
              };
            })
          } : {}, {
            f: ((_c2 = pattern.examples) == null ? void 0 : _c2.length) > 0
          }, ((_d2 = pattern.examples) == null ? void 0 : _d2.length) > 0 ? {
            g: common_vendor.f(pattern.examples, (example, exampleIndex, i1) => {
              return {
                a: "0bfa86d8-6-" + i0 + "-" + i1,
                b: common_vendor.t(example),
                c: exampleIndex
              };
            }),
            h: common_vendor.p({
              type: iconMap.ChatLineRound,
              size: "16",
              color: "#67C23A"
            })
          } : {}, {
            i: index
          });
        })
      } : {}, {
        K: ((_g = (_f = wordDetails[selectedWord.value].common_mistakes) == null ? void 0 : _f.items) == null ? void 0 : _g.length) > 0
      }, ((_i = (_h = wordDetails[selectedWord.value].common_mistakes) == null ? void 0 : _h.items) == null ? void 0 : _i.length) > 0 ? {
        L: common_vendor.t(wordDetails[selectedWord.value].common_mistakes.title),
        M: common_vendor.f(wordDetails[selectedWord.value].common_mistakes.items, (item, index, i0) => {
          return {
            a: common_vendor.t(item.type),
            b: common_vendor.t(item.wrong),
            c: common_vendor.t(item.correct),
            d: index
          };
        })
      } : {}) : {}, {
        s: selectedWord.value && wordDetails[selectedWord.value],
        N: isLoading.value
      }, isLoading.value ? {
        O: common_vendor.p({
          status: "loading",
          ["content-text"]: loadingText
        })
      } : {});
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-0bfa86d8"]]);
wx.createPage(MiniProgramPage);
