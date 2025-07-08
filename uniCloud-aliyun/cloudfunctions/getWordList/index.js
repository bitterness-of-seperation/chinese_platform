'use strict';
const db = uniCloud.database();
const wordbooks = db.collection('wordbooks');
const words = db.collection('words');
const userWordbookProgress = db.collection('user_wordbook_progress');

exports.main = async (event, context) => {
	//event为客户端上传的参数
	console.log('event : ', event);
	
	const { bookId, limit = 5, userId } = event;
	
	if (!bookId) {
		return {
			code: 400,
			message: '缺少必要参数bookId'
		};
	}
	
	try {
		// 1. 获取词书信息
		const bookResult = await wordbooks.doc(bookId).get();
		if (!bookResult.data || !bookResult.data.length) {
			return {
				code: 404,
				message: '未找到指定词书'
			};
		}
		
		const book = bookResult.data[0];
		
		// 2. 从words表获取该词书的所有单词
		const wordsResult = await words.where({
			book_id: bookId
		}).get();
		
		const wordsData = wordsResult.data || [];
		if (wordsData.length === 0) {
			return {
				code: 200,
				message: '该词书中没有单词',
				data: []
			};
		}
		
		const wordIds = wordsData.map(word => word._id);
		
		// 3. 如果提供了userId，获取已学习的单词列表
		let learnedWordIds = [];
		if (userId) {
			const progressResult = await userWordbookProgress.where({
				user_id: userId,
				wordbook_id: bookId
			}).get();
			
			if (progressResult.data && progressResult.data.length > 0) {
				learnedWordIds = progressResult.data[0].learned_words || [];
			}
		}
		
		// 4. 过滤掉已学习的单词
		const unlearntWords = wordsData.filter(word => !learnedWordIds.includes(word._id));
		
		// 如果所有单词都已学习完，返回特殊消息
		if (unlearntWords.length === 0) {
			return {
				code: 200,
				message: '所有单词已学习完成',
				data: []
			};
		}
		
		// 5. 随机选择limit个未学习的单词
		let selectedWords = [];
		
		// 如果未学习单词数小于limit，则全部返回
		if (unlearntWords.length <= limit) {
			selectedWords = unlearntWords;
		} else {
			// 随机选择limit个单词
			const shuffled = [...unlearntWords];
			for (let i = shuffled.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
			}
			selectedWords = shuffled.slice(0, limit);
		}
		
		return {
			code: 200,
			message: '获取单词列表成功',
			data: selectedWords,
			total_remaining: unlearntWords.length
		};
		
	} catch (error) {
		console.error('获取单词列表失败:', error);
		return {
			code: 500,
			message: '服务器内部错误',
			error: error.message
		};
	}
}; 