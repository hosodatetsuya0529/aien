// ランキングのタイトル表示まわり。
// ・displayTitle: 末尾の「ベスト10」「TOP5」等を除去（バッジと二重表示にしない）
// ・rankLabel: 件数に応じて「ベストN」、ネガティブなテーマは「ワーストN」で統一
const TRAILING_RANK = /\s*(ベスト|ワースト|top|best|worst)\s*\d+\s*$/i;
const NEGATIVE = /(ワースト|最低|最悪|がっかり|つまらない|二度と観|見たくない|観たくない|ひどい|駄作|クソ|うざい|嫌い)/;

export function displayTitle(title: string): string {
  return title.replace(TRAILING_RANK, "").trim();
}

export function rankLabel(title: string, count: number): string {
  return (NEGATIVE.test(title) ? "ワースト" : "ベスト") + count;
}
