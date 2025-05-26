// late-reason-new-app/src/app/page.tsx
'use client';

import { useState } from 'react';

export default function HomePage() {
  const [delayTime, setDelayTime] = useState('');
  const [target, setTarget] = useState('');
  const [situation, setSituation] = useState('');
  const [tone, setTone] = useState('');
  const [reasons, setReasons] = useState<{ id: string; title: string; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState('');
  const [activeTab, setActiveTab] = useState<string | null>(null);

  // タブの選択肢を定義
  const delayTimeOptions = ['5分', '15分', '30分', '1時間', '2時間以上'];
  const targetOptions = ['教授', '先輩', '友人'];
  const toneOptions = ['真面目に', '簡潔に', 'ユーモラスに', '恐縮して'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setReasons([]);
    setCopySuccess('');
    setActiveTab(null);

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
      setReasons(data.reasons);
      if (data.reasons.length > 0) {
        setActiveTab(data.reasons[0].id);
      }
    } catch (err) {
      setError('理由の生成に失敗しました。ネットワーク接続を確認するか、しばらくしてから再度お試しください。');
      console.error('Frontend Catch Error:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const inputBaseStyle: React.CSSProperties = {
    width: 'calc(100% - 16px)',
    padding: '8px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--border-color)',
    borderRadius: '4px',
    backgroundColor: 'var(--input-bg)',
    color: 'var(--input-text-color)',
  };

  const tabButtonStyle: React.CSSProperties = {
    padding: '8px 12px',
    margin: '5px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'var(--border-color)',
    borderRadius: '4px',
    backgroundColor: 'var(--button-bg)',
    color: 'var(--button-text-color)',
    cursor: 'pointer',
    transition: 'background-color 0.2s, border-color 0.2s, color 0.2s',
    whiteSpace: 'nowrap',
  };

  const selectedTabButtonStyle: React.CSSProperties = {
    ...tabButtonStyle,
    backgroundColor: 'var(--primary-color)',
    color: 'var(--primary-text-color)',
    borderColor: 'var(--primary-color)',
  };

  return (
    <main style={{ padding: '20px', maxWidth: '600px', margin: 'auto', fontFamily: 'sans-serif', lineHeight: '1.6' }}>
      <h1 style={{ textAlign: 'center', color: 'var(--text-color)' }}>遅刻理由ジェネレーター</h1>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px', backgroundColor: 'var(--content-bg)', padding: '20px', borderRadius: '8px', boxShadow: 'var(--box-shadow)' }}>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'var(--label-color)' }}>遅刻時間:</label>
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
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'var(--label-color)' }}>報告相手:</label>
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
          <label htmlFor="situation" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'var(--label-color)' }}>具体的な状況 (オプション):</label>
          <textarea
            id="situation"
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            placeholder="例: 電車が遅延した、急な腹痛など(空欄可)"
            rows={3}
            style={{ ...inputBaseStyle, resize: 'vertical' }}
          ></textarea>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: 'var(--label-color)' }}>トーン (オプション):</label>
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
            backgroundColor: loading ? 'var(--disabled-bg)' : 'var(--primary-color)',
            color: 'var(--primary-text-color)',
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

      {error && <p style={{ color: 'var(--error-color)', textAlign: 'center', marginTop: '20px' }}>{error}</p>}
      {reasons.length > 0 && (
        <div style={{ marginTop: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <h2 style={{ color: 'var(--text-color)' }}>生成された遅刻理由:</h2>
          
          <div style={{ display: 'flex', marginBottom: '15px', borderBottom: '1px solid var(--border-color)', overflowX: 'auto' }}>
            {reasons.map((r) => (
              <button
                key={r.id}
                onClick={() => setActiveTab(r.id)}
                style={{
                  padding: '10px 15px',
                  border: 'none',
                  borderBottom: activeTab === r.id ? `2px solid var(--primary-color)` : '2px solid transparent',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  fontWeight: activeTab === r.id ? 'bold' : 'normal',
                  color: activeTab === r.id ? 'var(--primary-color)' : 'var(--secondary-text-color)',
                  fontSize: '1em',
                  transition: 'color 0.2s, border-bottom-color 0.2s',
                  whiteSpace: 'nowrap', // Ensure tab titles don't wrap
                  flexShrink: 0, // Prevent tabs from shrinking
                }}
              >
                {r.title}
              </button>
            ))}
          </div>

          {reasons.map((r) => (
            activeTab === r.id && (
              <div key={r.id} style={{ backgroundColor: 'var(--content-bg)', padding: '15px', borderRadius: '5px', border: '1px solid var(--border-color)', fontSize: '1.1em', animation: 'fadeIn 0.3s forwards' }}>
                <p style={{ whiteSpace: 'pre-wrap', color: 'var(--text-color)' }}>{r.text}</p>
                <button
                  onClick={() => handleCopy(r.text)}
                  style={{
                    marginTop: '15px',
                    padding: '10px 15px',
                    backgroundColor: 'var(--success-color)',
                    color: 'var(--success-text-color)',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '15px'
                  }}
                >
                  この理由をコピー
                </button>
                {copySuccess && <span style={{ marginLeft: '10px', color: 'var(--success-color)' }}>{copySuccess}</span>}
              </div>
            )
          ))}
        </div>
      )}
      
      <style jsx global>{`
        :root {
          --main-bg: white;
          --content-bg: #f9f9f9;
          --text-color: #222; /* Darker for better general contrast */
          --secondary-text-color: #555;
          --label-color: #333;
          --border-color: #ddd;
          --input-bg: white;
          --input-text-color: #222;
          --input-placeholder-color: #999;
          --button-bg: #f0f0f0;
          --button-text-color: #333;
          --primary-color: #0070f3;
          --primary-text-color: white;
          --disabled-bg: #a0c7f8;
          --success-color: #28a745;
          --success-text-color: white;
          --error-color: #d32f2f; /* Darker red for better accessibility */
          --box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        @media (prefers-color-scheme: dark) {
          :root {
            --main-bg: #121212;
            --content-bg: #1e1e1e;
            --text-color: #e0e0e0;
            --secondary-text-color: #b0b0b0;
            --label-color: #c0c0c0;
            --border-color: #444;
            --input-bg: #2c2c2c;
            --input-text-color: #e0e0e0;
            --input-placeholder-color: #777;
            --button-bg: #333;
            --button-text-color: #e0e0e0;
            --primary-color: #3b82f6; /* Lighter blue for dark mode */
            --primary-text-color: white; 
            --disabled-bg: #374151;
            --success-color: #34d399; /* Lighter green */
            --success-text-color: #101010; /* Dark text on lighter green */
            --error-color: #f87171; /* Lighter red */
            --box-shadow: 0 2px 4px rgba(0,0,0,0.4); /* Slightly more pronounced shadow for dark mode */
          }

          input::placeholder, 
          textarea::placeholder {
            color: var(--input-placeholder-color);
            opacity: 1; /* Ensure placeholder is fully visible */
          }

          input, textarea { /* General input styles for dark mode */
            background-color: var(--input-bg);
            color: var(--input-text-color);
            border-color: var(--border-color);
          }
           /* Style scrollbars for dark mode for a more consistent feel */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          ::-webkit-scrollbar-track {
            background: var(--content-bg); 
          }
          ::-webkit-scrollbar-thumb {
            background: #555;
            border-radius: 4px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #6E6E6E;
          }
        }

        body {
          background-color: var(--main-bg);
          color: var(--text-color);
          transition: background-color 0.2s, color 0.2s;
        }
        
        /* Apply placeholder color for light mode too using variables */
        input::placeholder, 
        textarea::placeholder {
          color: var(--input-placeholder-color);
        }

        /* Ensure transitions on elements that change color based on theme */
        h1, h2, label, p, div, button, input, textarea {
          transition: color 0.2s, background-color 0.2s, border-color 0.2s;
        }
        /* More specific transitions are already on buttons and inputs, this is a general fallback */

      `}</style>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}