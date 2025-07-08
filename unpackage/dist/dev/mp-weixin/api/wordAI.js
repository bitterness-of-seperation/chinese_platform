"use strict";
const common_vendor = require("../common/vendor.js");
const API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
const API_TOKEN = "adeaa36163c848749b91e5f9f8a3373c.6jurvrlT5pWxfzje";
const sendRequest = async (data) => {
  return new Promise((resolve, reject) => {
    common_vendor.index.request({
      url: API_URL,
      method: "POST",
      data: {
        model: data.model || "glm-4",
        messages: data.messages,
        tools: data.tools,
        tool_choice: "auto",
        temperature: data.temperature || 0.7,
        top_p: data.top_p || 0.7,
        request_id: Date.now().toString(),
        do_sample: true,
        max_tokens: data.max_tokens || 1500
      },
      header: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_TOKEN}`
      },
      success: (res) => {
        console.log("API响应:", res);
        resolve(res);
      },
      fail: (err) => {
        console.error("请求失败:", err);
        reject(err);
      }
    });
  });
};
const generateBatchWordData = async (words = [], bookType = "HSK3", userId = "", bookId = "") => {
  var _a, _b, _c, _d;
  try {
    console.log(`正在为${bookType}词书生成学习数据`);
    let learnedWords = [];
    let learnedWordsPrompt = "";
    if (userId && bookId) {
      try {
        const { result } = await common_vendor.Zs.callFunction({
          name: "getWordbookProgress",
          data: {
            user_id: userId,
            book_id: bookId
          }
        });
        if (result.code === 200 && result.data.learned_words) {
          learnedWords = result.data.learned_words;
          learnedWordsPrompt = learnedWords.length > 0 ? `请注意：用户已经学习过以下单词，请不要在生成的内容中包含这些单词：${learnedWords.join(", ")}。` : "";
        }
      } catch (error) {
        console.error("获取已学习单词失败:", error);
      }
    }
    const response = await sendRequest({
      model: "glm-4",
      messages: [
        {
          role: "system",
          content: `你是一个中文教学专家。请从${bookType}词书中选择5个重要词语生成学习数据，包括拼音、词性、定义和例句。${learnedWordsPrompt}

请按照以下JSON格式返回一个数组：
[
  {
    "word": "词语",
    "pinyin": "拼音",
    "type": "词性",
    "definitions": ["主要定义", "其他定义"],
    "answer_options": [
      {"text": "正确的词义", "isCorrect": true},
      {"text": "错误选项1", "isCorrect": false},
      {"text": "错误选项2", "isCorrect": false},
      {"text": "错误选项3", "isCorrect": false}
    ],
    "grammar": {
      "title": "语法重点",
      "pattern": "语法结构",
      "notes": "用法提示",
      "level": "难度级别"
    },
    "examples": [
      {
        "text": "例句原文",
        "pinyin": "例句拼音",
        "translation": "英文翻译"
      }
    ],
    "phrases": [
      {
        "chinese": "相关词组",
        "pinyin": "词组拼音",
        "english": "词组英文"
      }
    ]
  }
]

注意：
1. 必须提供4个答案选项，其中只有1个是正确的
2. 答案选项应该有一定的干扰性，难度适中
3. 确保返回的是有效的JSON格式
4. 不要生成用户已学习过的单词`
        },
        {
          role: "user",
          content: words.length > 0 ? `请为这些词语生成学习数据：${words.join(", ")}` : `请生成${bookType}词书中的5个新词语的学习数据`
        }
      ]
    });
    if (!((_d = (_c = (_b = (_a = response.data) == null ? void 0 : _a.choices) == null ? void 0 : _b[0]) == null ? void 0 : _c.message) == null ? void 0 : _d.content)) {
      console.error("API返回数据为空");
      return fallbackWordData(words.length > 0 ? words : ["把", "被", "让", "从", "给"]);
    }
    const content = response.data.choices[0].message.content.trim();
    console.log("API返回batch content:", content);
    try {
      const result = parseJSON(content);
      if (result && result.length > 0) {
        const validatedResult = result.map((item) => validateWordData(item));
        return validatedResult;
      }
      console.error("无法解析有效的词汇数据");
      return fallbackWordData(words.length > 0 ? words : ["把", "被", "让", "从", "给"]);
    } catch (error) {
      console.error("解析JSON失败:", error, "\n原始内容:", content);
      return fallbackWordData(words.length > 0 ? words : ["把", "被", "让", "从", "给"]);
    }
  } catch (error) {
    console.error("生成批量词汇数据失败:", error);
    return fallbackWordData(words.length > 0 ? words : ["把", "被", "让", "从", "给"]);
  }
};
const validateWordData = (wordData) => {
  var _a, _b, _c, _d;
  if (!wordData)
    return null;
  let answerOptions = wordData.answer_options || [];
  if (!Array.isArray(answerOptions) || answerOptions.length < 4) {
    const correctOption = {
      text: wordData.definitions && wordData.definitions.length > 0 ? wordData.definitions[0] : "默认定义",
      isCorrect: true
    };
    answerOptions = [
      correctOption,
      { text: "用于表示时间的词语", isCorrect: false },
      { text: "用于表示地点的词语", isCorrect: false },
      { text: "用于表示方式的词语", isCorrect: false }
    ];
  }
  return {
    word: wordData.word || "未知词语",
    pinyin: wordData.pinyin || "",
    type: wordData.type || "未知词性",
    definitions: Array.isArray(wordData.definitions) ? wordData.definitions : ["无定义"],
    answer_options: answerOptions,
    grammar: {
      title: ((_a = wordData.grammar) == null ? void 0 : _a.title) || "语法说明",
      pattern: ((_b = wordData.grammar) == null ? void 0 : _b.pattern) || "",
      notes: ((_c = wordData.grammar) == null ? void 0 : _c.notes) || "",
      level: ((_d = wordData.grammar) == null ? void 0 : _d.level) || "HSK3"
    },
    examples: Array.isArray(wordData.examples) ? wordData.examples.map((example) => ({
      text: example.text || "",
      pinyin: example.pinyin || "",
      translation: example.translation || ""
    })) : [],
    phrases: Array.isArray(wordData.phrases) ? wordData.phrases.map((phrase) => ({
      chinese: phrase.chinese || "",
      pinyin: phrase.pinyin || "",
      english: phrase.english || ""
    })) : []
  };
};
const fallbackWordData = (words) => {
  return words.map((word) => ({
    word,
    pinyin: "pīn yīn",
    type: "词性",
    definitions: ["默认释义"],
    answer_options: [
      { text: "默认释义", isCorrect: true },
      { text: "用于表示时间的词语", isCorrect: false },
      { text: "用于表示地点的词语", isCorrect: false },
      { text: "用于表示方式的词语", isCorrect: false }
    ],
    grammar: {
      title: "语法说明",
      pattern: "语法结构",
      notes: "用法说明",
      level: "HSK3"
    },
    examples: [{
      text: `这是使用"${word}"的例句。`,
      pinyin: "zhè shì shǐ yòng de lì jù",
      translation: `This is an example using "${word}".`
    }],
    phrases: [{
      chinese: `${word}短语`,
      pinyin: "duǎn yǔ",
      english: "phrase"
    }]
  }));
};
const extractJSONFromContent = (content) => {
  try {
    if (content.includes("```json")) {
      const matches = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (matches && matches[1]) {
        return matches[1].trim();
      }
    }
    const arrayMatch = content.match(/\[\s*{[\s\S]*}\s*\]/);
    if (arrayMatch) {
      return arrayMatch[0];
    }
    const objectsMatch = content.match(/\{\s*"word"[\s\S]*?\}\s*(?=,|$)/g);
    if (objectsMatch && objectsMatch.length > 0) {
      return `[${objectsMatch.join(",")}]`;
    }
    throw new Error("无法提取有效的JSON数据");
  } catch (error) {
    console.error("提取JSON失败:", error);
    return null;
  }
};
const parseJSON = (content) => {
  try {
    let jsonStr = extractJSONFromContent(content);
    if (!jsonStr) {
      throw new Error("无法提取JSON内容");
    }
    const result = JSON.parse(jsonStr);
    if (Array.isArray(result)) {
      return result;
    } else if (result && typeof result === "object") {
      return [result];
    }
    throw new Error("解析结果不是有效的数组或对象");
  } catch (error) {
    console.error("解析JSON失败:", error, "\n原始内容:", content);
    return null;
  }
};
exports.generateBatchWordData = generateBatchWordData;
