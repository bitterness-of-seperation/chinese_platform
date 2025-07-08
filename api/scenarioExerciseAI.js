const API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
const API_TOKEN = 'adeaa36163c848749b91e5f9f8a3373c.6jurvrlT5pWxfzje';
const db = uniCloud.database()

/**
 * 为指定的汉语词语生成情景练习
 * @param {string} wordId - 要练习的词语ID
 * @returns {Promise<Object>} - 返回结构化的情景练习题目
 */
async function generateScenarioExercise(wordId) {
  if (!wordId) {
    return {
      success: false,
      message: '请提供有效的词语ID'
    }
  }

  try {
    // 调用云函数
    const { result } = await uniCloud.callFunction({
      name: 'scenarioExerciseAI',
      data: { wordId },
      timeout: 90000 // 90秒超时
    });
    
    return result;
  } catch (error) {
    console.error('生成情景练习失败:', error)
    return {
      success: false,
      message: '生成练习题失败，请稍后重试'
    }
  }
}

// 验证练习题格式
function validateExercise(exercise) {
  const requiredFields = [
    'word',
    'sentence',
    'blank_sentence',
    'translation',
    'options',
    'hint',
    'context',
    'level'
  ]

  // 检查必需字段
  for (const field of requiredFields) {
    if (!exercise[field]) return false
  }

  // 检查选项
  if (!Array.isArray(exercise.options) || exercise.options.length !== 4) return false

  // 检查每个选项的格式
  const hasValidOptions = exercise.options.every(option => 
    option.text && 
    typeof option.is_correct === 'boolean' && 
    option.explanation
  )

  // 确保只有一个正确答案
  const correctCount = exercise.options.filter(opt => opt.is_correct).length

  return hasValidOptions && correctCount === 1
}

/**
 * 为多个汉语词语批量生成情景练习
 * @param {Array<string>} words - 要练习的词语数组
 * @returns {Promise<Object>} - 返回结构化的多个情景练习题目
 */
const generateBatchExercises = async (words) => {
  if (!Array.isArray(words) || words.length === 0) {
    return {
      success: false,
      message: "请提供有效的词语列表"
    }
  }
  
  try {
    const exercises = []
    for (const word of words) {
      try {
        const result = await generateScenarioExercise(word)
      if (result.success) {
          exercises.push(result.exercise)
        }
      } catch (error) {
        console.error(`为词语 ${word} 生成练习失败:`, error)
      }
    }
    
    return {
      success: true,
      exercises: exercises,
      count: exercises.length
    }
  } catch (error) {
    console.error('生成批量练习失败:', error)
    return {
      success: false,
      message: "生成批量练习失败"
    }
  }
}

// 工具函数：随机打乱数组顺序
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// 导出函数
export default {
  generateScenarioExercise,
  generateBatchExercises
} 