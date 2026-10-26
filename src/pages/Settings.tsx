import { useRef, useState } from "react";
import { useProgress } from "../state/context";
import { exportProgress, normalize } from "../lib/storage";
import { QUESTIONS } from "../data";

export function Settings() {
  const { progress, dispatch } = useProgress();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);

  function download() {
    const blob = new Blob([exportProgress(progress)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ipa-exam-trainer-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function importFile(file: File) {
    try {
      const p = normalize(JSON.parse(await file.text()));
      dispatch({ type: "import", progress: p });
      setMsg(`読み込みました（解答 ${p.attempts.length} 件）`);
    } catch (e) {
      setMsg(`読み込めませんでした：${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>設定</h1>
          <p>学習データはブラウザ（この端末）だけに保存されます。サーバには送られません。</p>
        </div>
      </div>

      <div className="card">
        <h3>出題</h3>
        <label className="check">
          <input
            type="checkbox"
            checked={progress.settings.shuffleChoices}
            onChange={(e) => dispatch({ type: "settings", patch: { shuffleChoices: e.target.checked } })}
          />
          選択肢の順番を毎回入れ替える（位置で覚えてしまうのを防ぐ）
        </label>
      </div>

      <div className="card">
        <h3>学習データ</h3>
        <p className="small muted">
          解答 {progress.attempts.length} 件・復習カード {Object.keys(progress.cards).length} 枚・模試 {progress.mocks.length} 回
        </p>
        <div className="row">
          <button onClick={download}>JSON で書き出す</button>
          <button onClick={() => fileRef.current?.click()}>JSON を読み込む</button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importFile(f);
              e.target.value = "";
            }}
          />
          <button
            className="danger"
            onClick={() => {
              if (window.confirm("学習データをすべて消します。元に戻せません。よろしいですか？")) {
                dispatch({ type: "reset" });
                setMsg("消去しました");
              }
            }}
          >
            すべて消去
          </button>
        </div>
        {msg && <p className="small" style={{ marginTop: "0.75rem" }}>{msg}</p>}
      </div>

      <div className="card">
        <h3>このアプリについて</h3>
        <p className="small">
          収録問題 {QUESTIONS.length} 問。問題はすべてオリジナルで、IPA の公開問題を転載したものではありません。
          問題の追加方法やソースコードは{" "}
          <a href="https://github.com/nagasakarenta/ipa-exam-trainer" target="_blank" rel="noreferrer">
            GitHub
          </a>{" "}
          を参照してください。
        </p>
      </div>
    </div>
  );
}
