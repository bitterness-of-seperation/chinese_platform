'use strict';
const db = uniCloud.database();
const wordsCollection = db.collection('words');

exports.main = async (event, context) => {
  const { wordData, word, bookId, userId, level = 'HSK3', correctOnly = true, isTest = false } = event;
  

  // 检查参数：接受单个word对象或wordData数组
  if ((!wordData && !word) || !userId || !bookId) {
    console.error('缺少必要参数:', { wordData: !!wordData, word: !!word, userId: !!userId, bookId: !!bookId });
    return {
      code: 400,
      message: '缺少必要参数'
    };
  }
  
  try {
    // 准备处理的单词数据数组
    const wordsToProcess = wordData ? (Array.isArray(wordData) ? wordData : [wordData]) : [word];
  
    if (wordsToProcess.length === 0) {
      console.error('没有提供有效的单词数据');
    return {
      code: 400,
        message: '没有提供有效的单词数据'
    };
  }
  
    
    // 获取表中当前最大的order值
    const { data: maxOrderData } = await wordsCollection
      .where({
        book_id: bookId,
        level: level
      })
      .orderBy('order', 'desc')
      .limit(1)
      .get();
    
    let maxOrder = maxOrderData.length > 0 ? maxOrderData[0].order : 0;
    console.log('当前最大order值:', maxOrder);
    
    // 处理并保存所有单词
    const savedWords = [];
    const savedWordIds = [];
    
    // 默认情况下，我们只保存第一个单词（假设它是用户已经回答正确的）
    // 如果correctOnly为false，则保存所有单词
    const wordsToSave = correctOnly ? [wordsToProcess[0]] : wordsToProcess;
    
    
    for (const wordItem of wordsToSave) {
      if (!wordItem || !wordItem.word) {
        console.error('单词数据不完整，跳过:', wordItem);
        continue;
      }
      
      
    const now = new Date();
      
      // 获取例句数据
      const exampleSentences = (wordItem.examples || []).map(example => ({
        chinese: example.text || '',
        pinyin: example.pinyin || '',
        english: example.translation || ''
      }));
      
      // 转换语法结构
      const grammar = {
        level: wordItem.grammar?.level || `${level}级`,
        pattern: wordItem.grammar?.pattern || '',
        notes: wordItem.grammar?.notes || ''
      };
      
      // 确定词性
      let wordType = 'Other';
      if (wordItem.type) {
        if (wordItem.type.includes('名词') || wordItem.type.includes('noun')) {
          wordType = 'Nouns';
        } else if (wordItem.type.includes('动词') || wordItem.type.includes('verb')) {
          wordType = 'Verbs';
        } else if (wordItem.type.includes('形容词') || wordItem.type.includes('adj')) {
          wordType = 'Adjectives';
        } else if (wordItem.type.includes('量词') || wordItem.type.includes('measure')) {
          wordType = 'Measure words';
        } else if (wordItem.type.includes('助词') || wordItem.type.includes('auxiliary')) {
          wordType = 'Auxiliary words';
        }
      }
      
      // 获取翻译内容
      const translation = Array.isArray(wordItem.definitions) ? 
        wordItem.definitions.join('; ') : 
        (typeof wordItem.definitions === 'string' ? wordItem.definitions : '');
      
      // 提取可能的标签
      const tags = [];
      if (wordItem.phrases && Array.isArray(wordItem.phrases)) {
        wordItem.phrases.forEach(phrase => {
          if (phrase.chinese) {
            tags.push(phrase.chinese);
          }
        });
      }
      
      // 递增order值
      maxOrder += 1;
      
      // 构建单词数据
      const processedWordData = {
        word: wordItem.word || '',
        pinyin: wordItem.pinyin || '',
        translation: translation,
        word_type: wordType,
        level: level,
        grammar_structure: grammar,
        example_sentences: exampleSentences,
        difficulty: 3,
        frequency: 3,
        book_id: bookId,
        order: maxOrder,
        tags: tags.length > 0 ? tags : undefined,
        create_date: now
      };
      
    
      // 检查是否已存在相同的单词
      const { data: existingWords } = await wordsCollection
        .where({
          word: wordItem.word,
          level: level
        })
        .get();
      
      let wordId;
      if (existingWords.length > 0) {
        // 已存在，使用现有ID
        wordId = existingWords[0]._id;
      } else {
        // 不存在，添加新单词
        const result = await wordsCollection.add(processedWordData);
        wordId = result.id;
      }
      
      savedWords.push({
        id: wordId,
        word: processedWordData.word
      });
      
      savedWordIds.push(wordId);
      
      // 注意：不再在这里调用updateWordProgress云函数
      // 这个操作将由WordLearning.vue中的markWordAsLearned函数处理
      // 这样可以避免重复更新学习计数
    }
    
    
    return {
      code: 200,
      data: {
        words: savedWords,
        word_ids: savedWordIds
      },
      message: '保存成功'
    };
  } catch (error) {
    console.error('保存单词数据失败:', error);
    return {
      code: 500,
      message: '保存失败: ' + error.message
    };
  }
}; 