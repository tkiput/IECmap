/* ==========================================================================
   【重要】データ追加・編集マニュアル
   ・文字列（日本語・英数字）は必ずダブルクォーテーション " " で囲んでください。
   ・項目の末尾には半角カンマ , を付けてください（※グループの最後の項目は不要）。
   ========================================================================== */

const circlesData = [
  {
    /* [サークル 1] */
    "id": "circle-01",                     /* 【変更不可】重複しない英数字ID */
    "name": "軽音サークル",                 /* 【編集可】サークル名 */
    "location": "ホール (B) ステージ",      /* 【編集可】開催場所・ブース */
    "title": "クリスマススペシャルライブ",   /* 【編集可】企画タイトル */
    "description": "人気のクリスマスソングを中心にアコースティック生演奏をお届けします！心温まる音楽を一緒に楽しみましょう。", /* 【編集可】説明文 */
    "image": "images/circles/keion.jpg",   /* 【編集可】画像ファイルのパス */
    "mapPinId": "pin-hall-stage"           /* 【編集可】マップ上の連動ピンID */
  },
  {
    /* [サークル 2] */
    "id": "circle-02",
    "name": "ゲーム制作同好会",
    "location": "校舎 2F 201教室",
    "title": "自作レトロ風RPG体験会",
    "description": "メンバーが制作したクリスマステーマのオリジナルドット絵RPGを遊べます！ハイスコアで限定シールプレゼント！",
    "image": "images/circles/game.jpg",
    "mapPinId": "pin-201"
  },
  {
    /* [サークル 3] */
    "id": "circle-03",
    "name": "写真部",
    "location": "校舎 1F 101教室",
    "title": "冬のきらめき写真展＆チェキ会",
    "description": "「冬」をテーマにした学内フォトコンテスト作品を展示中。クリスマス衣装を着たポートレート撮影体験（チェキ）も実施！",
    "image": "images/circles/photo.jpg",
    "mapPinId": "pin-101"
  },
  {
    /* [サークル 4] */
    "id": "circle-04",
    "name": "茶道サークル",
    "location": "校舎 1F 103教室",
    "title": "クリスマス和カフェ「一期一会」",
    "description": "和菓子と本格的なお抹茶をお出しします。洋風にアレンジしたクリスマス創作和菓子をご用意しております！",
    "image": "images/circles/sado.jpg",
    "mapPinId": "pin-103"
  },
  {
    /* [サークル 5] */
    "id": "circle-05",
    "name": "謎解き同好会",
    "location": "校舎 2F 204教室",
    "title": "サンタクロースからの挑戦状",
    "description": "教室内に隠された謎を解き明かして、サンタの盗まれたプレゼントを取り戻そう！制限時間15分の本格脱出ゲーム。",
    "image": "images/circles/nazotoki.jpg",
    "mapPinId": "pin-204"
  },
  {
    /* [サークル 6] */
    "id": "circle-06",
    "name": "手芸・クラフトクラブ",
    "location": "校舎 2F 202教室",
    "title": "手作りオーナメントワークショップ",
    "description": "フェルトや木の実を使って、オリジナルのクリスマスオーナメントを作ってみませんか？初心者も大歓迎、持ち帰りも可能です。",
    "image": "images/circles/handicraft.jpg",
    "mapPinId": "pin-202"
  },
  {
    /* [サークル 7] */
    "id": "circle-07",
    "name": "パソコン研究会",
    "location": "校舎 2F 203教室",
    "title": "VRクリスマスジェットコースター",
    "description": "VRゴーグルをかけて、雪山を猛スピードで駆け抜けるジェットコースターを体験！圧倒的な臨場感をお楽しみください。",
    "image": "images/circles/pc.jpg",
    "mapPinId": "pin-203"
  },
  {
    /* [サークル 8] */
    "id": "circle-08",
    "name": "美術部",
    "location": "校舎 1F 102教室",
    "title": "巨大キャンドルアート＆イラスト展",
    "description": "部員全員で制作した巨大なクリスマスキャンドルアートの展示と、幻想的な冬のイラスト原画を展示・販売しています。",
    "image": "images/circles/art.jpg",
    "mapPinId": "pin-102"
  },
  {
    /* [サークル 9] */
    "id": "circle-09",
    "name": "クッキング部",
    "location": "校舎 1F 104教室",
    "title": "焼きたてジンジャーブレッドハウス",
    "description": "スパイスの効いたジンジャーブレッドクッキーや、アイシングでデコレーションされたお菓子の家を販売。お土産にどうぞ！",
    "image": "images/circles/cooking.jpg",
    "mapPinId": "pin-104"
  },
  {
    /* [サークル 10] */
    "id": "circle-10",
    "name": "演劇サークル",
    "location": "ホール (B) サブエリア",
    "title": "クリスマス朗読劇「賢者の贈り物」",
    "description": "名作「賢者の贈り物」を、音楽と光の演出に乗せてお届けするアットホームな朗読劇。心温まるひとときをお過ごしください。",
    "image": "images/circles/drama.jpg",
    "mapPinId": "pin-hall-sub"
  }
];

const scheduleData = [
  {
    "time": "10:00 - 10:30",
    "title": "オープニング＆開会宣言",
    "circleId": "",
    "location": "ホール (B) ステージ"
  },
  {
    "time": "10:30 - 11:30",
    "title": "クリスマススペシャルライブ",
    "circleId": "circle-01",
    "location": "ホール (B) ステージ"
  },
  {
    "time": "11:30 - 12:30",
    "title": "各ブース体験タイム＆展示公開",
    "circleId": "",
    "location": "校舎 1F / 2F 各教室"
  },
  {
    "time": "12:30 - 13:00",
    "title": "お楽しみビンゴ大会（第1部）",
    "circleId": "",
    "location": "ホール (B) ステージ"
  },
  {
    "time": "13:00 - 14:00",
    "title": "クリスマス朗読劇「賢者の贈り物」",
    "circleId": "circle-10",
    "location": "ホール (B) サブエリア"
  },
  {
    "time": "14:00 - 15:00",
    "title": "クリスマス和カフェ・実演茶会",
    "circleId": "circle-04",
    "location": "校舎 1F 103教室"
  },
  {
    "time": "15:00 - 15:30",
    "title": "お楽しみビンゴ大会（第2部）",
    "circleId": "",
    "location": "ホール (B) ステージ"
  },
  {
    "time": "15:30 - 16:00",
    "title": "エンディングステージ＆閉会式",
    "circleId": "",
    "location": "ホール (B) ステージ"
  }
];

const infoData = {
  "eventName": "クリスマス会 × FESTA",
  "eventDate": "2026-12-25T10:00:00",
  "contactEmail": "honbu@example.com",
  "rules": [
    "飲食可能エリア: 校舎1F食堂、中庭フリースペース、およびホール(B)の指定席のみ可能です。教室や展示スペースでの飲食はご遠慮ください。",
    "ゴミの分別: 会場内3箇所（中庭・ホール入り口・校舎1F昇降口）に分別ゴミ箱（可燃ゴミ・プラスチック・ビン缶ペットボトル）を設置しています。",
    "避難経路: 万が一の地震・火災発生時は、スタッフの指示に従って速やかにグラウンド（屋外避難場所）へ避難してください。"
  ]
};
