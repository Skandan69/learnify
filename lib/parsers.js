function extract(text, marker, nextMarker) {
  const start = text.indexOf(marker);
  if (start === -1) return '';
  const from = start + marker.length;
  const end = nextMarker ? text.indexOf(nextMarker, from) : text.length;
  return (end === -1 ? text.slice(from) : text.slice(from, end)).trim();
}

function extractLines(text, marker, nextMarker) {
  const block = extract(text, marker, nextMarker);
  return block.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
}

export function parseResponse(fmt, text) {
  if (fmt === 'story') {
    const scenes = [1,2,3,4,5,6,7,8,9,10,11,12].map((n) => ({
      label: extract(text, `[[SCENE_${n}_LABEL]]`, `[[SCENE_${n}_TEXT]]`),
      text: extract(text, `[[SCENE_${n}_TEXT]]`, n < 12 ? `[[SCENE_${n+1}_LABEL]]` : '[[TAKEAWAY]]'),
    })).filter((s) => s.label || s.text);
    return { scenes, takeaway: extract(text, '[[TAKEAWAY]]', null) };
  }

  if (fmt === 'visual') {
    const panels = [1,2,3,4,5,6,7,8,9,10,11,12].map((n) => ({
      emoji: extract(text, `[[PANEL_${n}_EMOJI]]`, `[[PANEL_${n}_TITLE]]`),
      title: extract(text, `[[PANEL_${n}_TITLE]]`, `[[PANEL_${n}_DESC]]`),
      description: extract(text, `[[PANEL_${n}_DESC]]`, n < 12 ? `[[PANEL_${n+1}_EMOJI]]` : null),
    })).filter((p) => p.title);
    return { panels };
  }

  if (fmt === 'flashcard') {
    const cards = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map((n) => ({
      question: extract(text, `[[Q${n}]]`, `[[A${n}]]`),
      answer: extract(text, `[[A${n}]]`, n < 15 ? `[[Q$kn+1}]]` : null),
    })).filter((c) => c.question);
    return { cards };
  }

  if (fmt === 'audio') {
    return {
      title: extract(text, '[[AUDIO_TITLE]]', '[[AUDIO_SCRIPT]]'),
      script: extract(text, '[[AUDIO_SCRIPT]]', null),
    };
  }

  if (fmt === 'mindmap') {
    const branches = [1,2,3,4,5,6,7,8,9,10].map((n) => ({
      title: extract(text, `[[BRANCH_${n}_TITLE]]`, `[[BRANCH_${n}_POINTS]]`),
      points: extractLines(text, `[[BRANCH_${n}_POINTS]]`, n < 10 ? `[[BRANCH_${n+1}_TITLE]]` : null),
    })).filter((b) => b.title);
    return { center: extract(text, '[[CENTER]]', '[[BRANCH_1_TITLE]]'), branches };
  }

  if (fmt === 'quiz') {
    const letterIdx = { A: 0, B: 1, C: 2, D: 3 };
    const questions = [1,2,3,4,5,6,7,8,9,10].map((n) => ({
      q: extract(text, `[[Q$kn}]]`, `[[Q${n}_A]]`),
      options: [
        extract(text, `[[Q${n}_A]]`, `[[Q${n}_B]]`),
        extract(text, `[[Q${n}_B]]`, `[[Q${n}_C]]`),
        extract(text, `[[Q$kn}_C]]`, `[[Q$kn}_D]]`),
        extract(text, `[[Q${n}_D]]`, `[[Q${n}_CORRECT]]`),
      ],
      correct: letterIdx[extract(text, `[[Q$kn}_CORRECT]]`, n < 10 ? `[[Q$kn+1}]]` : null).trim().toUpperCase()] ?? 0,
    })).filter((q) => q.q);
    return { questions };
  }

  if (fmt === 'summary') {
    return {
      overview: extract(text, '[[OVERVIEW]]', '[[KEYPOINTS]]'),
      keypoints: extractLines(text, '[[KEYPOINTS]]', '[[TERMS]]'),
      terms: extractLines(text, '[[TERMS]]', null),
    };
  }

  if (fmt === 'ppt') {
    const slides = Array.from({ length: 40 }, (_, i) => i + 1).map((n) => ({
      title: extract(text, `[[SLIDE_${n}_TITLE]]`, `[[SLIDE_${n}_BULLETS]]`),
      bullets: extractLines(text, `[[SLIDE_${n}_BULLETS]]`, n < 40 ? `[[SLIDE_${n+1}_TITLE]]` : null)
        .filter((l) => !l.startsWith('[[')),
    })).filter((s) => s.title && !s.title.startsWith('[[');
    return { slides };
  }

  if (fmt === 'analogy') {
    const analogies = [1,2,3,4,5,6,7,8,9,10,11,12].map((n) => ({
      concept: extract(text, `[[CONCEPT_${n}]]`, `[[ANALOGY_${n}]]`),
      analogy: extract(text, `[[ANALOGY_${n}]]`, `[[EXPLANATION_${n}]]`),
      explanation: extract(text, `[[EXPLANATION_${n}]]`, n < 12 ? `[[CONCEPT_${n+1}]]` : null),
    })).filter((a) => a.concept);
    return { analogies };
  }

  if (fmt === 'freewrite') {
    return {
      topic: extract(text, '[[TOPIC]]', '[[HINTS]]'),
      hints: extractLines(text, '[[HINTS]]', null),
    };
  }

  if (fmt === 'imgstory') {
    const scenes = [1,2,3,4,5,6,7,8].map((n) => ({
      label: extract(text, `[[SCENE_${n}_LABEL]]`, `[[SCENE_${n}_TEXT]]`),
      text: extract(text, `[[SCENE_${n}_TEXT]]`, `[[SCENE_${n}_PROMPT]]`),
      prompt: extract(text, `[[SCENE_${n}_PROMPT]]`, n < 8 ? `[[SCENE_${n+1}_LABEL]]` : null),
    })).filter((s) => s.label && s.text);
    return { scenes };
  }

  if (fmt === 'video') {
    const title = extract(text, '[[VIDEO_TITLE]]', '[[SCENE_1_TITLE]]');
    const scenes = [1,2,3,4,5,6,7,8,9,10,11,12].map((n) => ({
      title: extract(text, `[[SCENE_${n}_TITLE]]`, `[[SCENE_${n}_NARRATION]]`),
      narration: extract(text, `[[SCENE_${n}_NARRATION]]`, `[[SCENE_${n}_KEYFACT]]`),
      keyfact: extract(text, `[[SCENE_${n}_KEYFACT]]`, `[[SCENE_${n}_EMOJI]]`),
      emoji: extract(text, `[[SCENE_${n}_EMOJI]]`, n < 12 ? `[[SCENE_${n+1}_TITLE]]` : null),
    })).filter((s) => s.title && s.narration);
    return { title, scenes };
  }

  if (fmt === 'flowchart') {
    const title = extract(text, '[[FLOW_TITLE]]', '[[NODE_1_TYPE]]');
    const nodes = Array.from({ length: 20 }, (_, i) => i + 1).map((n) => ({
      type: extract(text, `[[NODE_${n}_TYPE]]`, `[[NODE_${n}_LABEL]]`).toLowerCase().trim(),
      label: extract(text, `[[NODE_${n}_LABEL]]`, `[[NODE_${n}_YES]]`),
      yesLabel: extract(text, `[[NODE_${n}_YES]]`, `[[NODE_${n}_NO]]`),
      noLabel: extract(text, `[[NODE_${n}_NO]]`, n < 20 ? `[[NODE_${n+1}_TYPE]]` : null),
    })).filter((n) => n.label && n.type);
    return { title, nodes };
  }

  if (fmt === 'grade') {
    const covered = extractLines(text, '[[COVERED]]', '[[MISSED]]');
    const missed = extractLines(text, '[[MISSED]]', '[[FEEDBACK]]');
    return {
      score: parseInt(extract(text, '[[SCORE]]', '[[GRADE_LABEL]]'), 10) || 0,
      gradeLabel: extract(text, '[[GRADE_LABEL]]', '[[COVERED]]'),
      covered,
      missed,
      feedback: extract(text, '[[FEEDBACK]]', null),
    };
  }

  return {};
}
