"use strict";
const common_vendor = require("../common/vendor.js");
common_vendor.Zs.database();
async function generateScenarioExercise(wordId) {
  if (!wordId) {
    return {
      success: false,
      message: "请提供有效的词语ID"
    };
  }
  try {
    const { result } = await common_vendor.Zs.callFunction({
      name: "scenarioExerciseAI",
      data: { wordId },
      timeout: 9e4
      // 90秒超时
    });
    return result;
  } catch (error) {
    console.error("生成情景练习失败:", error);
    return {
      success: false,
      message: "生成练习题失败，请稍后重试"
    };
  }
}
const generateBatchExercises = async (words) => {
  if (!Array.isArray(words) || words.length === 0) {
    return {
      success: false,
      message: "请提供有效的词语列表"
    };
  }
  try {
    const exercises = [];
    for (const word of words) {
      try {
        const result = await generateScenarioExercise(word);
        if (result.success) {
          exercises.push(result.exercise);
        }
      } catch (error) {
        console.error(`为词语 ${word} 生成练习失败:`, error);
      }
    }
    return {
      success: true,
      exercises,
      count: exercises.length
    };
  } catch (error) {
    console.error("生成批量练习失败:", error);
    return {
      success: false,
      message: "生成批量练习失败"
    };
  }
};
const scenarioExerciseAI = {
  generateScenarioExercise,
  generateBatchExercises
};
exports.scenarioExerciseAI = scenarioExerciseAI;
