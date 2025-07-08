'use strict';
const db = uniCloud.database();
const dictionaryCollection = db.collection('dictionary');

exports.main = async (event, context) => {
  const { limit = 5 } = event;
  
  try {
    // 获取搜索次数最多的词语
    const result = await dictionaryCollection
      .aggregate()
      .match({
        search_count: db.command.exists(true),
        search_count: db.command.gt(0) // 确保搜索次数大于0
      })
      .sort({
        search_count: -1, // 按搜索次数降序排列
        create_date: -1 // 相同搜索次数时，按创建时间降序
      })
      .limit(limit)
      .project({
        word: 1,
        pinyin: 1,
        search_count: 1,
        _id: 0
      })
      .end();
    
    // 确保返回数据格式一致
    const hotWords = result.data.map(item => ({
      word: item.word,
      count: item.search_count || 0,
      pinyin: item.pinyin || ''
    }));
      
    return {
      code: 200,
      data: hotWords,
      message: 'success'
    };
    
  } catch (error) {
    console.error('获取热门词语失败:', error);
    return {
      code: 500,
      message: '获取热门词语失败'
    };
  }
}; 