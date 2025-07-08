"use strict";
const common_vendor = require("../../common/vendor.js");
const stores_user = require("../../stores/user.js");
const stores_wordStats = require("../../stores/wordStats.js");
const api_wordAI = require("../../api/wordAI.js");
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
  __name: "WordProgress",
  setup(__props) {
    const userStore = stores_user.useUserStore();
    const wordStatsStore = stores_wordStats.useWordStatsStore();
    const currentBook = common_vendor.ref(null);
    const bookOptions = common_vendor.ref([]);
    const isLoading = common_vendor.ref(true);
    const fetchWordbooks = async () => {
      var _a;
      try {
        const { result } = await common_vendor.Zs.callFunction({
          name: "getWordbooks"
        });
        if (result.code === 200) {
          bookOptions.value = result.data.map((book) => ({
            label: book.name,
            value: book._id,
            ...book
          }));
          if (bookOptions.value.length > 0) {
            currentBook.value = bookOptions.value[0];
            if ((_a = userStore.userInfo) == null ? void 0 : _a._id) {
              fetchBookProgress(currentBook.value._id);
            }
          }
        } else {
          common_vendor.index.showToast({
            title: "获取词书列表失败",
            icon: "none"
          });
        }
      } catch (error) {
        console.error("获取词书列表失败:", error);
        common_vendor.index.showToast({
          title: "获取词书列表失败",
          icon: "none"
        });
      } finally {
        isLoading.value = false;
      }
    };
    const fetchBookProgress = async (bookId) => {
      var _a;
      if (!bookId || !((_a = userStore.userInfo) == null ? void 0 : _a._id))
        return;
      try {
        const { result } = await common_vendor.Zs.callFunction({
          name: "getWordbookProgress",
          data: {
            user_id: userStore.userInfo._id,
            book_id: bookId
          }
        });
        if (result.code === 200) {
          const bookIndex = bookOptions.value.findIndex((book) => book._id === bookId);
          if (bookIndex >= 0) {
            const updatedBook = {
              ...bookOptions.value[bookIndex],
              learned_words_count: result.data.learned_count,
              progress_percentage: result.data.progress_percentage
            };
            bookOptions.value[bookIndex] = updatedBook;
            if (currentBook.value && currentBook.value._id === bookId) {
              currentBook.value = updatedBook;
            }
          }
        }
      } catch (error) {
        console.error("获取词书进度失败:", error);
      }
    };
    const onBookChange = async (e) => {
      var _a;
      currentBook.value = bookOptions.value[e.detail.value];
      if (currentBook.value && ((_a = userStore.userInfo) == null ? void 0 : _a._id)) {
        fetchBookProgress(currentBook.value._id);
      }
    };
    const formatNumber = (num) => {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };
    const todayData = common_vendor.ref([
      { icon: "plus-filled", value: 0, label: "新学单词" },
      { icon: "star-filled", value: 0, label: "收藏单词" },
      { icon: "phone", value: 0, label: "使用APP" }
    ]);
    const updateTodayDataFromStore = () => {
      todayData.value[0].value = wordStatsStore.todayNewWords;
      todayData.value[1].value = wordStatsStore.todayFavoriteWords;
    };
    const animatedValues = common_vendor.ref(todayData.value.map(() => 0));
    const startCountAnimation = () => {
      todayData.value.forEach((item, index) => {
        let current = 0;
        const target = item.value;
        const duration = 1e3;
        const interval = 20;
        const steps = duration / interval;
        const increment = target / steps;
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          animatedValues.value[index] = Math.floor(current);
        }, interval);
      });
    };
    const iconMap = {
      Back: "back",
      Search: "search",
      ChatLineRound: "chatbubble",
      Bookmark: "star-filled",
      Headset: "sound",
      Close: "closeempty",
      ArrowDown: "bottom"
    };
    const goBack = () => {
      common_vendor.index.navigateBack({
        delta: 1,
        fail: () => {
          common_vendor.index.switchTab({ url: "/pages/Home/Home" });
        }
      });
    };
    const navigateToLearn = async () => {
      var _a;
      if (!currentBook.value) {
        common_vendor.index.showToast({
          title: "请先选择词书",
          icon: "none"
        });
        return;
      }
      if (!((_a = userStore.userInfo) == null ? void 0 : _a._id)) {
        common_vendor.index.showToast({
          title: "请先登录",
          icon: "none"
        });
        return;
      }
      try {
        common_vendor.index.showLoading({
          title: "正在加载词汇..."
        });
        let level = "HSK3";
        if (currentBook.value.name.includes("HSK3")) {
          level = "HSK3";
        } else if (currentBook.value.name.includes("HSK4")) {
          level = "HSK4";
        } else if (currentBook.value.name.includes("HSK5")) {
          level = "HSK5";
        } else if (currentBook.value.name.includes("HSK6")) {
          level = "HSK6";
        }
        const wordData = await api_wordAI.generateBatchWordData(
          [],
          currentBook.value.name,
          userStore.userInfo._id,
          currentBook.value._id
        );
        console.log("成功生成单词数据:", wordData);
        const urlParams = {
          bookId: currentBook.value._id,
          userId: userStore.userInfo._id,
          level,
          wordData: JSON.stringify(wordData),
          wordIds: JSON.stringify([])
          // 初始为空数组，用户学习过程中会填充
        };
        console.log("URL参数:", urlParams);
        const encodedParams = Object.entries(urlParams).map(
          ([key, value]) => `${key}=${encodeURIComponent(value)}`
        ).join("&");
        console.log("编码后的URL参数:", encodedParams);
        const url = `/pages/WordLearning/WordLearning?${encodedParams}`;
        console.log("完整URL:", url);
        common_vendor.index.navigateTo({
          url,
          fail: (e) => {
            console.error("navigateTo failed", e);
          }
        });
      } catch (error) {
        console.error("准备学习数据失败:", error);
        common_vendor.index.showToast({
          title: "加载失败，请重试",
          icon: "none"
        });
      } finally {
        common_vendor.index.hideLoading();
      }
    };
    const attendanceRecords = common_vendor.ref([]);
    const attendanceInfo = common_vendor.computed(() => userStore.getAttendanceInfo);
    const fetchAttendanceRecords = async () => {
      var _a;
      if (!((_a = userStore.userInfo) == null ? void 0 : _a._id))
        return;
      try {
        const { result } = await common_vendor.Zs.callFunction({
          name: "attendance",
          data: {
            user_id: userStore.userInfo._id,
            type: "get"
          }
        });
        console.log("打卡记录原始数据:", JSON.stringify(result));
        if (result.code === 200 && result.data.records) {
          result.data.records.forEach((record, index) => {
            console.log(
              `记录${index + 1}日期:`,
              record.date,
              "年份:",
              new Date(record.date).getFullYear(),
              "是否签到:",
              record.is_signed
            );
          });
          const emptyRecords = [];
          const today = /* @__PURE__ */ new Date();
          today.setHours(0, 0, 0, 0);
          for (let i = 3; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            emptyRecords.push({
              date,
              is_signed: false
            });
          }
          const serverRecords = result.data.records || [];
          attendanceRecords.value = serverRecords;
          calculateAppUsageTime();
          console.log("更新后的打卡记录:", attendanceRecords.value);
        } else {
          console.error("获取打卡记录失败:", result.message);
          initAttendanceRecords();
        }
      } catch (error) {
        console.error("获取打卡记录失败:", error);
        initAttendanceRecords();
      }
    };
    const initAttendanceRecords = () => {
      const records = [];
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      for (let i = 3; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        records.push({
          date,
          is_signed: false
        });
      }
      attendanceRecords.value = records;
    };
    const formatDate = (date) => {
      if (!date)
        return "Unknown";
      let dateObj;
      try {
        dateObj = date instanceof Date ? date : new Date(date);
        if (isNaN(dateObj.getTime())) {
          console.error("无效的日期:", date);
          return "Invalid";
        }
        const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
        if (dateObj.getFullYear() > currentYear + 1 || dateObj.getFullYear() < currentYear - 1) {
          console.warn("日期年份异常，可能需要调整:", date);
          dateObj.setFullYear(currentYear);
        }
      } catch (e) {
        console.error("日期解析错误:", e);
        return "Error";
      }
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const dateToCompare = new Date(dateObj);
      dateToCompare.setHours(0, 0, 0, 0);
      if (dateToCompare.getTime() === today.getTime()) {
        return "Today";
      }
      const month = dateObj.toLocaleString("en", { month: "short" });
      const day = dateObj.getDate();
      return `${month} ${day}`;
    };
    const calculateAppUsageTime = () => {
      if (!attendanceRecords.value || attendanceRecords.value.length === 0)
        return;
      const now = /* @__PURE__ */ new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const todayRecord = attendanceRecords.value.find((record) => {
        const recordDate = new Date(record.date);
        recordDate.setHours(0, 0, 0, 0);
        return recordDate.getTime() === today.getTime() && record.is_signed;
      });
      if (todayRecord) {
        let usageMinutes = 0;
        const signTime = todayRecord.sign_time ? new Date(todayRecord.sign_time) : todayRecord.create_date ? new Date(todayRecord.create_date) : null;
        if (signTime) {
          const diffMs = now.getTime() - signTime.getTime();
          usageMinutes = Math.round(diffMs / (1e3 * 60));
          usageMinutes = Math.max(1, usageMinutes);
          usageMinutes = Math.min(480, usageMinutes);
        } else {
          usageMinutes = 1;
        }
        todayData.value[2].value = usageMinutes;
        animatedValues.value[2] = 0;
        let current = 0;
        const target = todayData.value[2].value;
        const duration = 1e3;
        const interval = 20;
        const steps = duration / interval;
        const increment = target / steps;
        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          animatedValues.value[2] = Math.floor(current);
        }, interval);
      }
    };
    let usageTimer = null;
    const updateStats = async () => {
      var _a, _b;
      if ((_a = userStore.userInfo) == null ? void 0 : _a._id) {
        await wordStatsStore.loadStatsFromServer(userStore.userInfo._id);
        updateTodayDataFromStore();
        startCountAnimation();
        if ((_b = currentBook.value) == null ? void 0 : _b._id) {
          await fetchBookProgress(currentBook.value._id);
        } else {
          await fetchWordbooks();
        }
      }
    };
    common_vendor.onShow(() => {
      updateStats();
    });
    common_vendor.onMounted(async () => {
      var _a, _b;
      if ((_a = userStore.userInfo) == null ? void 0 : _a._id) {
        await wordStatsStore.loadStatsFromServer(userStore.userInfo._id);
        updateTodayDataFromStore();
      }
      startCountAnimation();
      await fetchWordbooks();
      initAttendanceRecords();
      if ((_b = userStore.userInfo) == null ? void 0 : _b._id) {
        await fetchAttendanceRecords();
        calculateAppUsageTime();
        usageTimer = setInterval(() => {
          calculateAppUsageTime();
        }, 6e4);
      }
    });
    common_vendor.onBeforeUnmount(() => {
      if (usageTimer) {
        clearInterval(usageTimer);
        usageTimer = null;
      }
    });
    return (_ctx, _cache) => {
      var _a, _b, _c, _d, _e;
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
        d: common_vendor.t(((_a = currentBook.value) == null ? void 0 : _a.name) || "Loading..."),
        e: common_vendor.p({
          type: "down",
          size: "16",
          color: "#666"
        }),
        f: common_vendor.o(onBookChange),
        g: bookOptions.value.findIndex((o) => {
          var _a2;
          return o.value === ((_a2 = currentBook.value) == null ? void 0 : _a2._id);
        }),
        h: bookOptions.value,
        i: isLoading.value,
        j: common_vendor.t(formatNumber(((_b = currentBook.value) == null ? void 0 : _b.total_words) || 0)),
        k: common_vendor.p({
          type: "right",
          size: "16",
          color: "#666"
        }),
        l: common_vendor.o(navigateToLearn),
        m: common_vendor.t(((_c = currentBook.value) == null ? void 0 : _c.learned_words_count) || 0),
        n: `${((_d = currentBook.value) == null ? void 0 : _d.progress_percentage) || 0}%`,
        o: common_vendor.t(((_e = currentBook.value) == null ? void 0 : _e.progress_percentage) || 0),
        p: attendanceInfo.value && attendanceInfo.value.continuous_days
      }, attendanceInfo.value && attendanceInfo.value.continuous_days ? {
        q: common_vendor.t(attendanceInfo.value.continuous_days)
      } : {}, {
        r: common_vendor.f(attendanceRecords.value, (record, index, i0) => {
          return {
            a: common_vendor.t(formatDate(record.date)),
            b: common_vendor.n(record.is_signed ? "success-icon" : "missed-icon"),
            c: "46e5b566-4-" + i0,
            d: common_vendor.p({
              type: record.is_signed ? "checkmarkempty" : "closeempty",
              size: "18",
              color: record.is_signed ? "var(--primary-color)" : "var(--red-color)"
            }),
            e: index,
            f: record.is_signed ? 1 : "",
            g: !record.is_signed ? 1 : ""
          };
        }),
        s: common_vendor.p({
          type: "plus",
          size: "24",
          color: "#67C23A"
        }),
        t: common_vendor.t(animatedValues.value[0]),
        v: common_vendor.p({
          type: "star",
          size: "24",
          color: "#67C23A"
        }),
        w: common_vendor.t(animatedValues.value[1]),
        x: common_vendor.p({
          type: "phone",
          size: "24",
          color: "#67C23A"
        }),
        y: common_vendor.t(animatedValues.value[2])
      });
    };
  }
});
const MiniProgramPage = /* @__PURE__ */ common_vendor._export_sfc(_sfc_main, [["__scopeId", "data-v-46e5b566"]]);
wx.createPage(MiniProgramPage);
