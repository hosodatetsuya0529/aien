// 無記名でも荒らし対策できるよう、端末ごとに匿名の識別子を1つ持たせる。
// （ログイン無しMVP用。後でアカウント連携に差し替え可能）
const KEY = "kabu_voter_key";

export function getVoterKey(): string {
  if (typeof window === "undefined") return "";
  let v = localStorage.getItem(KEY);
  if (!v) {
    v =
      (crypto.randomUUID?.() ??
        Math.random().toString(36).slice(2) + Date.now().toString(36)) +
      "-" +
      Math.random().toString(36).slice(2);
    localStorage.setItem(KEY, v);
  }
  return v;
}
