/* ---------- 初期データと起動 ---------- */
if (state.sentences.length === 0) {
  [["I'm looking forward to seeing you.", "あなたに会えるのを楽しみにしています。", "会話"],
   ["Could you tell me how to get to the station?", "駅への行き方を教えていただけますか？", "旅行"],
   ["It depends on the situation.", "状況によります。", "会話"],
   ["I couldn't agree with you more.", "全く同感です。", "会話"]]
   .forEach(([en, ja, c]) => addSentence(en, ja, c, false));
  save();
}

go('home');
