import { redirect } from "next/navigation";

// ホームはルート直下（/）に移動。旧 /movies はトップへ転送（既存リンク/ブックマーク救済）。
export default function MoviesIndex() {
  redirect("/");
}
