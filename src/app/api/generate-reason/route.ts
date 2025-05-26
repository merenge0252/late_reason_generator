// late-reason-new-app/src/app/api/generate-reason/route.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error('GEMINI_API_KEY is not set');
}

const genAI = new GoogleGenerativeAI(API_KEY);

// calculateRelevance関数は変更なし
function calculateRelevance(situation: string | undefined, excuseText: string): number {
  if (!situation || situation.trim() === '') {
    return 0;
  }
  const situationKeywords = situation.toLowerCase().split(/[\s、,。.]+/).filter(Boolean);
  const excuseKeywords = excuseText.toLowerCase().split(/[\s、,。.]+/).filter(Boolean);
  if (situationKeywords.length === 0) {
    return 0;
  }
  let matchingKeywords = 0;
  for (const sKeyword of situationKeywords) {
    if (excuseKeywords.some(eKeyword => eKeyword.includes(sKeyword) || sKeyword.includes(eKeyword))) {
      matchingKeywords++;
    }
  }
  return matchingKeywords / situationKeywords.length;
}

export async function POST(request: Request) {
  try {
    const { delayTime, target, situation, tone } = await request.json();

    // ユーザー確認に基づきモデル名を gemini-2.0-flash に修正
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const humorousTones = ['ユーモラスに', 'コミカルに', 'ふざけて'];
    const isHumorousTone = humorousTones.includes(tone || '');

    const casualTargets = ['友人', '友達', '親友', '後輩'];
    const isCasualTarget = casualTargets.includes(target || '');
    const avoidPoliteLanguage = isHumorousTone && isCasualTarget;

    let prompt = `# 前提条件:
- タイトル： 遅刻の言い訳を提案するプロンプト
- 依頼者条件： 遅刻をしてしまった人
- 制作者条件： 遅刻の言い訳を思いつく能力を持った人
- 目的と目標： ${target}が納得するような、**物的証拠を必要とせず、口頭での説明で十分に納得させられる**遅刻の言い訳を**10個**提案する

# 実行指示:
あなたは遅刻の言い訳を思いつく能力を持ったプロフェッショナルです。
${target}に対して、${delayTime}の遅刻という状況に従って、
相手が納得するような遅刻の言い訳を**10個**提案してください。
遅れた時間を最重要項目として、ステップバイステップで合理的な言い訳を具体的に考えてください。
各言い訳は、具体的な状況を盛り込み、説得力のあるものにしてください。

**最重要指示 (優先順位順):**
1.  **もしトーンが指定されている場合（現在のトーンは「${tone || '指定なし'}」です）、そのトーンを極めて厳密に守って文章全体を生成してください。特に言葉遣い、雰囲気、ユーモアの有無、感情表現などを「${tone || '指定なし'}」に合わせてください。**
    ${tone === 'ユーモラスに' ? '  - 「ユーモラスに」の場合、クスッと笑えるような、しかし決して不真面目ではない、機知に富んだり、少し間の抜けたような、微笑ましい出来事を想像してください。相手を不快にさせない範囲で、軽妙な言い回しや意外な展開を試みてください。この場合、**現実的な実現可能性よりも、面白さやユニークさを優先してください。**\n' : ''}
    ${tone === '真面目に' ? '  - 「真面目に」の場合、誠実さと反省の意が伝わるように、簡潔かつ丁寧に理由を説明してください。\n' : ''}
    ${tone === '丁寧に' ? '  - 「丁寧に」の場合、非常に丁寧な言葉遣いを心がけ、恐縮している気持ちが伝わるように表現してください。\n' : ''}
    ${tone === '簡潔に' ? '  - 「簡潔に」の場合、要点を絞り、余分な言葉を省いて短く、しかし必要な情報は含めてください。\n' : ''}
    ${tone === '恐縮して' ? '  - 「恐縮して」の場合、最大限の謝罪と恐縮の気持ちを表現し、相手への配慮を前面に出してください。\n' : ''}
`;

    let instructionCounter = 2;
    if (avoidPoliteLanguage) {
        prompt += `${instructionCounter}. **特に、敬語を使わず、タメ口やフランクな言葉遣いで理由を記述してください。**\n`;
        instructionCounter++;
    }

    if (situation) {
        prompt += `${instructionCounter}. **提供された「具体的な状況」(${situation}) を最優先事項として最大限活用し、その詳細を盛り込んで説得力のある言い訳を構築してください。もしこの「具体的な状況」が非日常的またはユーモラスな要素を含む場合、生成する言い訳もその性質を強く反映させてください。この指示は他の指示よりも優先されます。**\n`;
        instructionCounter++;
    }

    if (!isHumorousTone) {
        if (!situation) {
            prompt += `${instructionCounter}. **物的証拠がなくても、口頭での説明で十分に納得させられる、日常的に起こりうる範囲の理由を優先して生成してください。交通事故、救急車の出動、入院、犯罪に巻き込まれるなど極めて稀で深刻な事態や、遅延証明書が必要になるような電車の遅延（例：30分以上の遅延）は避けてください。**\n`;
        } else {
            // 状況指定あり、かつユーモアトーンでない場合：指定状況を使いつつ、無関係な深刻な事態は避ける
            prompt += `${instructionCounter}. **提供された「具体的な状況」(${situation}) を元にしつつ、その状況とは無関係な、他の極めて稀で深刻な事態（例：依頼者が指定していない交通事故、救急車の出動、入院など）や、提供された状況と関連がない遅延証明書が必要となるような電車の遅延（例：30分以上の遅延）は避けてください。**\n`;
        }
        instructionCounter++;
    }
    // ユーモアトーンの場合は、深刻な事態を避ける指示は「ユーモラスに」の指示に内包されると解釈

    prompt += `
以下の情報も参考にしてください：
`;
    if (situation) {
      prompt += `- 具体的な状況: ${situation}\n`;
      // 「最大限活用し」という指示は最重要指示で強化したため、ここでは状況の提示のみで十分
    } else {
      prompt += `- 具体的な状況: （提供されていません）\n`;
      prompt += `「具体的な状況」が提供されていない場合は、現実的で、かつ説得力があり、**${!isHumorousTone ? '物的証拠を必要とせず口頭で説明がしやすい、日常的に起こりうる範囲の' : '面白さやユニークさを追求した'}**具体的な出来事を想像して言い訳を生成してください。\n`;
    }

    prompt += `- 交通機関: 電車、バス、自家用車など（想定される一般的な交通機関を活用してください）

次に、各言い訳に対して説得力、実現可能性、**口頭説明の容易さ**の観点から数値で評価してください。
口頭説明の容易さとは、遅延証明書や領収書などの**物的証拠がなくとも、具体的な状況描写や話し方で相手を納得させやすいか**を指します。高いほど良いです。
${isHumorousTone ? 'ただし、トーンがユーモラスな場合は、実現可能性の評価はあまり気にせず、面白さやユニークさを重視した評価を行ってください。\n' : ''}
${(situation && !isHumorousTone) ? `提供された「具体的な状況」(${situation}) が非日常的な場合でも、その状況を前提とした場合に、その枠組みの中での「実現可能性」を評価してください。一般的な実現可能性である必要はありません。\n` : ''}

# 参考情報:
- 説得力: どれだけ相手に信じてもらえるか (0-100)
- 実現可能性: 実際に起こりうる可能性 (0-100)
- 口頭説明の容易さ: 物的証拠不要で、口頭説明で納得させやすいか (0-100, 高いほど良い)

# 参考フォーマット:
[遅刻理由の本文（謝罪、具体的な理由、今後の対応まで全て含める）]
説得力: [数値], 実現可能性: [数値], 口頭説明の容易さ: [数値]
　証拠を求められたら: [証拠とその提示方法、または証拠を提示できない場合の理由と助言]
(上記フォーマットを10回繰り返す)

# 追加指示:
- 各言い訳の本文は、見出しや箇条書きなどのマークダウンを一切使用せず、平文で具体的に記述してください。
- 謝罪の言葉、具体的な遅刻理由、今後の対応（例：急いで向かいます）まで、一連の遅刻連絡として完結した文章を生成してください。**この一連の文章のトーンが、上記の「最重要指示」で指定されたトーンと完全に一致するようにしてください。**
- 嘘や不確かな情報は含めないでください。
- 同じような言い訳は避けてください。
- 余計な前置き、結論やまとめは書かないでください。
- 指示の復唱はしないでください。
- 自己評価はしないでください。
- **各言い訳の前に番号（例: 1., 2. など）を絶対につけないでください。**
- 参考フォーマットを厳密に守り、**10個**の言い訳を提案してください。
`;

    console.log("Prompt sent to Gemini:", prompt);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const fullText = response.text();

    console.log("Full AI response text (raw):", fullText); 
    
    const processedText = fullText.replace(/\r\n/g, '\n').trim();
    const excuses = [];
    // 正規表現は前回の修正案を維持
    const fullExcuseBlockPattern = /(.+?)\s*説得力:\s*(\d+),\s*実現可能性:\s*(\d+),\s*口頭説明の容易さ:\s*(\d+)(?:\s*証拠を求められたら:\s*(.+?))?(?=(?:\n\n|$))/g;

    let match;
    while ((match = fullExcuseBlockPattern.exec(processedText)) !== null) {
        const rawText = match[1].trim()
            .replace(/^\d+\.\s*/, '') // ★★★ この行を追加して、行頭の "1. " や "4. " などを除去 ★★★
            .replace(/^\*\*\s*|\s*\*\*$/g, '') 
            .replace(/^[-\*#]\s*/g, '') 
            .replace(/[\u200B-\u200D\uFEFF]/g, ''); 

        const 説得力 = parseInt(match[2], 10);
        const 実現可能性 = parseInt(match[3], 10);
        const verbalExplanationEase = parseInt(match[4], 10);
        const evidenceAdvice = match[5] ? match[5].trim() : '';

        let currentScore = 0;
        let scoreWeightRealism = 0.2;
        let scoreWeightVerbalEase = 0.4;

        if (isHumorousTone) {
            scoreWeightRealism = 0.05; 
            scoreWeightVerbalEase = 0.55; 
        }

        const relevanceScore = situation ? calculateRelevance(situation, rawText) : 0;
        const RELEVANCE_THRESHOLD = 0.3; 
        const PENALTY_FACTOR = 0.01; 
        const SUPER_RELEVANCE_BONUS = 200; // 関連性が高い場合のボーナスを維持

        if (situation && relevanceScore < RELEVANCE_THRESHOLD) {
            currentScore = (説得力 * 0.4 + 実現可能性 * scoreWeightRealism + verbalExplanationEase * scoreWeightVerbalEase) * PENALTY_FACTOR;
        } else {
            currentScore = 説得力 * 0.4 + 実現可能性 * scoreWeightRealism + verbalExplanationEase * scoreWeightVerbalEase;
            // 状況が指定されている場合、関連性ボーナスを加算
            if (situation) {
                 currentScore += relevanceScore * SUPER_RELEVANCE_BONUS;
            }
        }
        
        if (!isHumorousTone && verbalExplanationEase < 60) {
            currentScore *= 0.6;
        }
        
        excuses.push({
            text: rawText,
            説得力: 説得力,
            実現可能性: 実現可能性,
            verbalExplanationEase: verbalExplanationEase,
            evidenceAdvice: evidenceAdvice,
            score: currentScore,
            relevanceScore: relevanceScore // デバッグ用に保持
        });
    }

    console.log("Parsed excuses array size:", excuses.length); 
    if (excuses.length > 0) {
        console.log("Sample parsed excuse with scores:", excuses[0]);
    }


    excuses.sort((a, b) => b.score - a.score);
    const top3Excuses = excuses.slice(0, 3); 

    console.log("Top 3 excuses (after slice):", top3Excuses.length, top3Excuses); 

    if (top3Excuses.length > 0) {
      const formattedReasons = top3Excuses.map((excuse, index) => ({
        id: `reason${index + 1}`,
        title: `理由${index + 1}`,
        text: excuse.text,
      }));
      console.log("Final reasons sent to frontend:", formattedReasons.length, formattedReasons);
      return NextResponse.json({ reasons: formattedReasons });
    } else {
      if (excuses.length > 0 && top3Excuses.length === 0) {
        console.warn("Parsing succeeded, but no suitable excuses found after scoring. All parsed excuses with scores:", excuses.map(e => ({text: e.text, score: e.score, relevance: e.relevanceScore })));
      } else {
        console.warn("No suitable excuses found or parsing failed. Full AI response (processed):", processedText);
      }
      return NextResponse.json({ error: '適切な遅刻理由を生成できませんでした。' }, { status: 500 });
    }

  } catch (error) {
    console.error('Gemini API Error or processing error:', error);
    const errorMessage = error instanceof Error ? error.message : '理由の生成に失敗しました。';
    return NextResponse.json({ error: `理由の生成に失敗しました: ${errorMessage}` }, { status: 500 });
  }
}