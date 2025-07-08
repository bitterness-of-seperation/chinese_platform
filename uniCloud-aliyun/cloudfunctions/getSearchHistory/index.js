'use strict';
const db = uniCloud.database();
const dictionaryCollection = db.collection('dictionary');

exports.main = async (event, context) => {
  const { limit = 5 } = event;
  
  try {
    // 获取最近搜索的词语
    const result = await dictionaryCollection
      .orderBy('update_date', 'desc')
      .limit(limit)
      .field({ word: true })
      .get();
      
    // 提取词语列表
    const words = result.data.map(item => item.word);
    
    return {
      code: 200,
      data: words,
      message: 'success'
    };
    
  } catch (error) {
    console.error('获取搜索历史失败:', error);
    return {
      code: 500,
      message: '获取搜索历史失败'
    };
  }
}; 