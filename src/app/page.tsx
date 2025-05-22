// late-reason-new-app/src/app/page.tsx
'use client';

import { useState } from 'react';

export default function HomePage() {
  const [delayTime, setDelayTime] = useState('');
  const [target, setTarget] = useState('');
  const [situation, setSituation] = useState('');
  const [tone, setTone] = useState('');
  const [reasons, setReasons] = useState<{ id: string; title: string; text: string }[]>([]); // 複数の理由を保持する配列に変更
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState('');
  const [activeTab, setActiveTab] = useState<string | null>(null); // アクティブなタブの状態管理

  // タブの選択肢を定義
  const delayTimeOptions = ['5分', '15分', '30分', '1時間', '2時間以上'];
  const targetOptions = ['教授', '先輩', '友人'];
  const toneOptions = ['真面目に', '簡潔に', 'ユーモラスに', '恐縮して'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setReasons([]); // クリア
    setCopySuccess('');
    setActiveTab(null); // タブ選択をリセット

    try {
      const res = await fetch('/api/generate-reason', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ delayTime, target, situation, tone }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('API Response Error:', res.status, errorText);
        throw new Error('API request failed: ' + (errorText || res.statusText));
      }

      const data = await res.json();
      setReasons(data.reasons); // 生成された理由の配列をステートにセット
      if (data.reasons.length > 0) {
        setActiveTab(data.reasons[0].id); // 最初の理由をデフォルトでアクティブにする
      }
    } catch (err) {
      setError('理由の生成に失敗しました。ネットワーク接続を確認するか、しばらくしてから再度お試しください。');
      console.error('Frontend Catch Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // コピーボタンのハンドラー
  const handleCopy = (textToCopy: string) => {
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          setCopySuccess('コピーしました！');
          setTimeout(() => setCopySuccess(''), 2000);
        })
        .catch(err => {
          console.error('Failed to copy text: ', err);
          setCopySuccess('コピーに失敗しました。');
        });
    }
  };

  // タブボタンのスタイル
  const tabButtonStyle = {
    padding: '8px 12px',
    margin: '5px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#ddd',
    borderRadius: '4px',
    backgroundColor: '#f0f0f0',
    cursor: 'pointer',
    transition: 'background-color 0.2s, border-color 0.2s',
    whiteSpace: 'nowrap' as 'nowrap',
  };

  // 選択されたタブボタンのスタイル
  const selectedTabButtonStyle = {
    ...tabButtonStyle,
    backgroundColor: '#0070f3',
    color: 'white',
    borderColor: '#0070f3',
  };

  // input/textarea の基本スタイル
  const inputBaseStyle = {
    width: 'calc(100% - 16px)',
    padding: '8px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: '#ddd',
    borderRadius: '4px',
  };


  return (
    <main style={{ padding: '20px', maxWidth: '600px', margin: 'auto', fontFamily: 'sans-serif', lineHeight: '1.6' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>遅刻理由ジェネレーター</h1>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px', backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>遅刻時間:</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {delayTimeOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setDelayTime(option)}
                style={delayTime === option ? selectedTabButtonStyle : tabButtonStyle}
              >
                {option}
              </button>
            ))}
            <input
              type="text"
              value={delayTime}
              onChange={(e) => setDelayTime(e.target.value)}
              placeholder="その他"
              style={{ ...inputBaseStyle, flexGrow: 1, minWidth: '100px' }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>報告相手:</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {targetOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTarget(option)}
                style={target === option ? selectedTabButtonStyle : tabButtonStyle}
              >
                {option}
              </button>
            ))}
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="その他"
              style={{ ...inputBaseStyle, flexGrow: 1, minWidth: '100px' }}
            />
          </div>
        </div>

        <div>
          <label htmlFor="situation" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>具体的な状況 (オプション):</label>
          <textarea
            id="situation"
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            placeholder="例: 電車が遅延した(空欄でも可)"
            rows={3}
            style={{ ...inputBaseStyle, resize: 'vertical' }}
          ></textarea>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>トーン (オプション):</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {toneOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setTone(option)}
                style={tone === option ? selectedTabButtonStyle : tabButtonStyle}
              >
                {option}
              </button>
            ))}
             <input
              type="text"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              placeholder="その他"
              style={{ ...inputBaseStyle, flexGrow: 1, minWidth: '100px' }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px 20px',
            backgroundColor: loading ? '#a0c7f8' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'background-color 0.2s ease'
          }}
        >
          {loading ? '生成中...' : '理由を生成する'}
        </button>
      </form>

      {error && <p style={{ color: 'red', textAlign: 'center', marginTop: '20px' }}>{error}</p>}
      {reasons.length > 0 && ( // reasonsが配列になったため
        <div style={{ marginTop: '30px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
          <h2 style={{ color: '#333' }}>生成された遅刻理由:</h2>
          
          {/* タブナビゲーション */}
          <div style={{ display: 'flex', marginBottom: '15px', borderBottom: '1px solid #ddd' }}>
            {reasons.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveTab(r.id)}
                style={{
                  padding: '10px 15px',
                  border: 'none',
                  borderBottom: activeTab === r.id ? '2px solid #0070f3' : 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  fontWeight: activeTab === r.id ? 'bold' : 'normal',
                  color: activeTab === r.id ? '#0070f3' : '#555',
                  fontSize: '1em',
                  transition: 'color 0.2s, border-bottom 0.2s',
                }}
              >
                {r.title}
              </button>
            ))}
          </div>

          {/* タブコンテンツ */}
          {reasons.map((r) => (
            activeTab === r.id && (
              <div key={r.id} style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '5px', border: '1px solid #ddd', fontSize: '1.1em', animation: 'fadeIn 0.3s forwards' }}>
                <p style={{ whiteSpace: 'pre-wrap' }}>{r.text}</p>
                <button
                  onClick={() => handleCopy(r.text)}
                  style={{
                    marginTop: '15px',
                    padding: '10px 15px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '15px'
                  }}
                >
                  この理由をコピー
                </button>
                {copySuccess && <span style={{ marginLeft: '10px', color: '#28a745' }}>{copySuccess}</span>}
              </div>
            )
          ))}
        </div>
      )}
      {/* フェードインアニメーションのスタイルを直接記述 */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}