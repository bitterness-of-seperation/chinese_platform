-- 示例词库（用于快速跑通前端全链路）
-- Supabase Dashboard -> SQL Editor 执行即可

insert into public.words (word, pinyin, type, level, definition, etymology, examples, synonyms, antonyms)
values
('把', 'bǎ', '介词/结构助词', 'HSK2', '用于“把”字句，把宾语提前，强调处置结果。', '“把”本义为握持，引申为处置标记。', array['请把门关上。','他把作业写完了。'], array['将'], array[]::text[]),
('被', 'bèi', '介词/结构助词', 'HSK3', '用于被动句，强调受事。', '“被”本义为覆盖，引申为遭受。', array['我的手机被他拿走了。','他被老师表扬了。'], array[]::text[], array[]::text[]),
('让', 'ràng', '动词', 'HSK2', '使；叫；允许。', null, array['请让我想一想。','他让大家先坐下。'], array['使','叫'], array[]::text[]),
('来', 'lái', '动词', 'HSK1', '从别处到这里；发生；用来……', null, array['他明天来北京。','我来帮你。'], array[]::text[], array['去']),
('虽然', 'suī rán', '连词', 'HSK3', '表示转折关系，常与“但是/可是”呼应。', null, array['虽然下雨，但是我们还是出发了。'], array[]::text[], array[]::text[]),
('但是', 'dàn shì', '连词', 'HSK3', '表示转折。', null, array['我想去，但是没时间。'], array['可是'], array[]::text[]),
('因为', 'yīn wèi', '连词', 'HSK2', '表示原因，常与“所以”呼应。', null, array['因为下雨，所以我没去。'], array[]::text[], array[]::text[]),
('所以', 'suǒ yǐ', '连词', 'HSK2', '表示结果。', null, array['他很努力，所以进步很快。'], array[]::text[], array[]::text[]),
('已经', 'yǐ jīng', '副词', 'HSK2', '表示动作完成或状态变化。', null, array['我已经吃过饭了。'], array[]::text[], array[]::text[]),
('正在', 'zhèng zài', '副词', 'HSK2', '表示动作正在进行。', null, array['我正在写作业。'], array[]::text[], array[]::text[]),
('刚才', 'gāng cái', '名词/副词', 'HSK2', '表示刚过去不久的时间。', null, array['他刚才出去了一会儿。'], array[]::text[], array[]::text[]),
('马上', 'mǎ shàng', '副词', 'HSK2', '立刻；不久。', null, array['我马上回来。'], array['立刻'], array[]::text[]),
('如果', 'rú guǒ', '连词', 'HSK3', '表示假设条件，常与“就”呼应。', null, array['如果你有空，就来找我。'], array[]::text[], array[]::text[]),
('就', 'jiù', '副词', 'HSK2', '表示结果、强调或时间上的紧接。', null, array['你来我就走。','我吃完饭就去。'], array[]::text[], array[]::text[]),
('一点儿', 'yì diǎn er', '数量词', 'HSK1', '少量。', null, array['给我一点儿水。'], array[]::text[], array[]::text[]),
('可能', 'kě néng', '副词/形容词', 'HSK2', '表示推测或能力。', null, array['他可能迟到了。'], array['也许'], array[]::text[]),
('一定', 'yí dìng', '副词', 'HSK2', '表示肯定或必要。', null, array['你一定要来。'], array['肯定'], array[]::text[]),
('应该', 'yīng gāi', '助动词', 'HSK2', '表示建议、义务或推测。', null, array['你应该早点睡。'], array['需要'], array[]::text[]),
('喜欢', 'xǐ huan', '动词', 'HSK1', '对人或事物有好感。', null, array['我喜欢学习中文。'], array['爱'], array['讨厌']),
('讨厌', 'tǎo yàn', '动词', 'HSK2', '不喜欢；反感。', null, array['我讨厌等太久。'], array['厌烦'], array['喜欢']);

