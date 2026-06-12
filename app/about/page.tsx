import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "AIENについて / プライバシーポリシー",
  description: "AIEN（アイエン）のサービス説明・プライバシーポリシー・免責事項・データ出典。",
};

const RAINBOW =
  "linear-gradient(95deg, #ff4d6d, #ff9a3c, #ffe14d, #38e08b, #2bd2ff, #5b7bff, #b15cff)";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-9">
      <h2 className="text-[17px] font-bold text-white mb-2.5">{title}</h2>
      <div className="space-y-2.5 text-[14px] leading-relaxed text-white/70">{children}</div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-[100dvh] bg-neutral-950 text-neutral-100">
      <div className="w-full max-w-2xl mx-auto px-6 py-12 pb-24">
        {/* ロゴ（サイトへ戻る） */}
        <Link href="/" className="inline-block leading-none select-none">
          <span
            className="text-[26px] font-black tracking-tight"
            style={{
              backgroundImage: RAINBOW,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              WebkitTextFillColor: "transparent",
            }}
          >
            AIEN
          </span>
        </Link>

        <Section title="AIENについて">
          <p>
            AIEN（アイエン）は、AIが「ニッチで刺さるテーマ別ランキング」を次々と自動生成する、
            映画・ドラマ・アニメの“発見”サービスです。「人生で必ず観るべき名作」のような王道ではなく、
            『登場人物の口癖だけで誰か特定できる作品』『観終わったら自分の選択肢を疑い始める作品』のように、
            思わず気になる切り口で、あなたがまだ知らない一本に出会えます。
          </p>
          <p>
            サブスクで観る今の時代、映画もドラマもアニメも区別なく、ひとつのランキングに混ざり合います。
            各作品がどの配信サービス（Netflix・Disney+・U-NEXT・Prime Video 等）で観られるかを表示し、
            気になった作品はワンタップで視聴ページへ。さらにAIが一作ごとに“辛口の一言”を添えるのも、AIENならではの楽しみです。
          </p>
          <p>
            ランキングは時間とともに新しく生み出され、並び順も入れ替わり続けます。
            「このランキング、どう？」のグッド／バッドであなたの反応も反映。
            スワイプするたびに新しいテーマと出会える、いつ開いても表情が変わるサイトです。
          </p>
        </Section>

        <Section title="プライバシーポリシー">
          <p>
            <strong className="text-white/85">1. 取得する情報</strong><br />
            本サイトはユーザー登録不要で、氏名・メールアドレス等の個人情報は取得しません。
            「いいね」「グッド／バッド」の重複を防ぐため、端末ごとの匿名キーをブラウザの
            ローカルストレージ等に保存します。これは個人を特定するものではありません。
          </p>
          <p>
            <strong className="text-white/85">2. アクセス解析</strong><br />
            サービス改善のため、ページの閲覧状況などを匿名で計測する場合があります。個人を特定する情報は含みません。
          </p>
          <p>
            <strong className="text-white/85">3. Cookie・ローカルストレージ</strong><br />
            上記の匿名キーや表示設定の保存に使用します。ブラウザの設定からいつでも削除・無効化できます。
          </p>
          <p>
            <strong className="text-white/85">4. 外部サービス・リンク</strong><br />
            作品データ（ポスター・あらすじ・配信状況等）は TMDB（The Movie Database）を利用しています。
            配信サービスへのリンクをクリックすると各社のサイトへ移動します。リンク先での個人情報の取り扱いは、
            各サービスのプライバシーポリシーに従います。
          </p>
          <p>
            <strong className="text-white/85">5. 第三者提供</strong><br />
            取得した匿名情報を、第三者へ販売・提供することはありません。
          </p>
          <p>
            <strong className="text-white/85">6. アフィリエイトについて</strong><br />
            将来的に、配信サービスへの紹介リンク（アフィリエイト）を導入する場合があります。
            導入時には本ポリシーを更新してお知らせします。
          </p>
          <p>
            <strong className="text-white/85">7. 本ポリシーの改定</strong><br />
            本ポリシーは、必要に応じて予告なく改定されることがあります。
          </p>
        </Section>

        <Section title="免責事項">
          <p>
            配信状況や作品情報は変更される場合があり、内容の正確性・最新性を保証するものではありません。
            実際に視聴できるかどうかは、各配信サービスでご確認ください。本サイトの利用により生じた
            いかなる損害についても、運営者は責任を負いかねます。
          </p>
        </Section>

        <Section title="データ出典">
          <p>
            本サイトは TMDB（The Movie Database）の API を利用していますが、TMDB の承認・認定を受けたものではありません。
          </p>
          <p className="text-white/45 text-[13px]">
            This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
        </Section>

        <Section title="運営・お問い合わせ">
          <p>運営：AIEN 運営チーム</p>
          <p className="text-white/45 text-[13px]">お問い合わせ窓口は準備中です。</p>
        </Section>

        <p className="mt-12 text-[12px] text-white/35">最終更新日：2026年6月12日</p>

        <div className="mt-8">
          <Link
            href="/"
            className="inline-block rounded-full border border-white/20 bg-white/[0.06] px-5 py-2 text-[13px] font-bold text-white/90 hover:bg-white/12 transition"
          >
            ← AIEN トップへ
          </Link>
        </div>
      </div>
    </div>
  );
}
