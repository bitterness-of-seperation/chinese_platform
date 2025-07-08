'use strict';
const db = uniCloud.database();
const userWordRelationCollection = db.collection('user_word_relation');
const wordsCollection = db.collection('words');

exports.main = async (event, context) => {
  const { user_id, word_ids, book_id, level } = event;
  
  if (!user_id) {
    return {
      code: 400,
      message: '缺少用户ID'
    };
  }
  
  try {
    let query = userWordRelationCollection.where({ user_id });
    
    // 如果提供了单词ID数组，则限制查询范围
    if (word_ids && Array.isArray(word_ids) && word_ids.length > 0) {
      query = query.where({
        word_id: db.command.in(word_ids)
      });
    }
    
    // 如果提供了词书ID，则限制查询范围
    if (book_id) {
      query = query.where({ book_id });
    }
    
    // 获取用户单词关系数据
    const { data: relations } = await query.get();
    
    // 如果有关系数据，则获取对应的单词详情
    if (relations.length > 0) {
      const wordIds = relations.map(rel => rel.word_id);
      
      // 构建words表查询条件
      let wordsQuery = wordsCollection.where({
        _id: db.command.in(wordIds)
      });
      
      // 如果提供了级别，则进一步限制查询范围
      if (level) {
        wordsQuery = wordsQuery.where({ level });
      }
      
      const { data: words } = await wordsQuery.get();
      
      // 将单词详情和关系数据合并
      const result = relations.map(rel => {
        const wordInfo = words.find(w => w._id === rel.word_id) || {};
        return {
          ...rel,
          word_info: wordInfo
        };
      });
      
      return {
        code: 200,
        data: result,
        message: 'success'
      };
    }
    
    return {
      code: 200,
      data: [],
      message: 'success'
    };
  } catch (error) {
    console.error('获取用户单词关系失败:', error);
    return {
      code: 500,
      message: '获取失败: ' + error.message
    };
  }
}; 