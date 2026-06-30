export const ROLE_HINTS = {
  student: 'Use simple language, relatable analogies, and memory hooks. The reader is a student.',
  trainer: 'Structure for someone who will present or teach this. Clarity and pacing matter.',
  professor: 'Maintain academic depth and precision while improving accessibility.',
  professional: 'Prioritise practical, actionable takeaways. The reader is busy and time-poor.',
};

export const FORMAT_META = {
  story:     { label: 'Story mode',      icon: '📖', sub: 'Narrative scenes' },
  visual:    { label: 'Visual storyboard', icon: '🖼️', sub: 'Storyboard panels' },
  flashcard: { label: 'Flashcards',      icon: '🃏', sub: 'Flip and quiz' },
  audio:     { label: 'Audio script',    icon: '🎙️', sub: 'Podcast style' },
  mindmap:   { label: 'Mind map',        icon: '🗺️', sub: 'Topic branches' },
  quiz:      { label: 'Quiz',            icon: '❓', sub: 'MCQ self-test' },
  summary:   { label: 'Smart summary',   icon: '📋', sub: 'Key points only' },
  ppt:       { label: 'Slide outline',   icon: '📊', sub: 'PPT-ready' },
  analogy:   { label: 'Analogy',         icon: '💡', sub: 'Real-world links' },
  freewrite: { label: 'Write & Check',   icon: '✏️', sub: 'AI-graded answer' },
  imgstory:  { label: 'Image Story',     icon: '🎨', sub: 'Illustrated scenes' },
  video:     { label: 'Video Story',     icon: '🎬', sub: 'Documentary player' },
  flowchart: { label: 'Flowchart',       icon: '🔀', sub: 'Visual flow diagram' },
};

const CORE_RULE = (hint) =>
  `CRITICAL RULE: You must include EVERY fact, name, date, term, event, and detail from the study content below. Do not skip, summarise away, or omit anything. Every piece of information in the source must appear in your output. Your job is only to change the FORMAT and PRESENTATION to make it engaging — never the completeness of the content. ${hint}`;

export function buildPrompt(fmt, content, role) {
  const hint = ROLE_HINTS[role] || '';
  const rule = CORE_RULE(hint);

  const sceneBlock = (n) => [
    `[[SCENE_${n}_LABEL]]`,
    `Scene ${n}: <vivid scene title>`,
    `[[SCENE_${n}_TEXT]]`,
    `<Narrative covering the facts for this scene. Include every specific detail, name, date, term from this section.>`,
  ].join('\n');

  const panelBlock = (n) => [
    `[[PANEL_${n}_EMOJI]]`,
    '<single emoji>',
    `[[PANEL_${n}_TITLE]]`,
    '<short title max 6 words>',
    `[[PANEL_${n}_DESC]]`,
    '<All facts for this topic in 2-4 sentences. Include every name, date, term.>',
  ].join('\n');

  const cardBlock = (n) => [`[[Q${n}]]`, '<Specific question about one fact>', `[[A${n}]]`, '<Precise, complete answer>'].join('\n');

  const quizBlock = (n) => [
    `[[Q${n}]]`, '<Question testing a specific fact>',
    `[[Q${n}_A]]`, '<Option A>',
    `[[Q${n}_B]]`, '<Option B>',
    `[[Q$kn}_C]]`, '<Option C>',
    `[[Q$kn}_D]]`, '<Option D>',
    `[[Q$kn}_CORRECT]]`, '<Write only the letter A, B, C, or D>',
  ].join('\n');

  const slideBlock = (n) => [
    `[[SLIDE_${n}_TITLE]]`, '<Topic title>',
    `[[SLIDE_${n}_BULLETS]]`, '<Specific bullet with names/dates/terms>', '<bullet 2>', '<bullet 3>', '<bullet 4>',
  ].join('\n');

  const branchBlock = (n) => [
    `[[BRANCH_${n}_TITLE]]`, `<Branch ${n}>`,
    `[[BRANCH_${n}_POINTS]]`, '<fact / sub-point 1>', '<fact / sub-point 2>', '<fact / sub-point 3>', '<fact / sub-point 4>',
  ].join('\n');

  const analogyBlock = (n) => [
    `[[CONCEPT_${n}]]`, '<Concept, person, or event name>',
    `[[ANALOGY_${n}]]`, '<One punchy analogy sentence>',
    `[[EXPLANATION_${n}]]`, '<2-3 sentences tying the analogy back to the actual facts, including specific names, dates, terms>',
  ].join('\n');

  const imgSceneBlock = (n) => [
    `[[SCENE_${n}_LABEL]]`, '<Scene number and vivid title>',
    `[[SCENE_${n}_TEXT]]`, '<2-3 sentences narrating this scene, covering every fact from this section of the content>',
    `[[SCENE_${n}_PROMPT]]`, '<Detailed visual image prompt: describe the scene, setting, characters, colours, style>',
  ].join('\n');

  const nodeBlock = (n) => [
    `[[NODE_${n}_TYPE]]`, '<start | process | decision | end>',
    `[[NODE_${n}_LABEL]]`, '<Short label for this step>',
    `[[NODE_${n}_YES]]`, '<If decision: label for YES branch, else leave blank>',
    `[[NODE_${n}_NO]]`, '<If decision: label for NO branch, else leave blank>',
  ].join('\n');

  const templates = {
    story: [
      'You are a creative learning coach. Transform the study content into an engaging narrative story.',
      rule, '',
      'Write as many scenes as needed to cover ALL the content. Do not stop until every fact is included.',
      'Use vivid analogies and relatable situations but weave in every specific name, date, term, and event.',
      '',
      'Use EXACTLY this format (add more scenes as needed):',
      ...[1,2,3,4,5,6,7,8].map(sceneBlock),
      '[[TAKEAWAY]]', '<One punchy sentence summarising the single most important lesson>',
      '', 'Study content (include EVERY fact from this):', content,
    ].join('\n'),

    visual: [
      'You are a visual learning designer. Break the study content into storyboard panels — for one panel per major topic or sub-topic.',
      rule, '',
      'Create as many panels as needed to cover ALL content. Do not merge or skip topics to reduce panel count.',
      '',
      'Use EXACTLY this format (repeat for as many panels as needed):',
      ...[1,2,3,4,5,6,7,8,10].map(panelBlock),
      '', 'Study content (include EVERY fact):', content,
    ].join('\n'),

    flashcard: [
      'Create flashcards from the study content — one card per distinct fact, concept, person, date, or term.',
      rule, '',
      'Create as many cards as needed so that NO fact is left out.',
      '',
      'Use EXACTLY this format (repeat for as many cards as needed):',
      ...[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15].map(cardBlock),
      '', 'Study content (every fact must appear on at least one card):', content,
    ].join('\n'),

    audio: [
      'You are a skilled podcast host. Create an engaging audio script from the study content.',
      hint, '',
      'RULES:',
      '- Cover ALL facts, names, dates, and terms from the source — do not omit anything',
      '- Write as natural SPOKEN WORDS — conversational, warm, and engaging like a great teacher',
      '- DO NOT just read out facts mechanically — weave them into explanation, context, and memorable hooks',
      '- Add [pause] markers between major sections for natural breath',
      '- Use phrases like "here is something fascinating", "pay close attention here", "let me break this down"',
      '- Vary sentence length - short punchy sentences for emphasis, longer ones for explanation',
      '',
      'Use EXACTLY this format:',
      '[[AUDIO_TITLE]]', '<Engaging podcast episode title - make it compelling>',
      '[[AUDIO_SCRIPT]]', '<Full spoken script. Every fact included. Add [pause] between sections.>',
      '', 'Study content (every fact must be covered in engaging spoken style):', content,
    ].join('\n'),

    mindmap: [
      'Create a comprehensive mind map from the study content.',
      rule, '',
      'Create as many branches and sub-points as needed to capture EVERY fact.',
      '',
      'Use EXACTLY this format (add more branches as needed):',
      '[[CENTER]]', '<Central topic>',
      ...[1,2,3,4,5,6,7].map(branchBlock),
      '', 'Study content (every fact must appear somewhere in the map):', content,
    ].join('\n'),

    quiz: [
      'Create multiple-choice quiz questions covering the study content.',
      rule, '',
      'Create enough questions so that EVERY major fact, name, date, and concept is tested. Minimum 10 questions.',
      '',
      'Use EXACTLY this format (repeat for all questions):',
      ...[1,2,3,4,5,6,7,8,9,10].map(quizBlock),
      '', 'Study content (every fact must be tested):', content,
    ].join('\n'),

    summary: [
      'Create a comprehensive smart summary of the study content.',
      rule, '',
      'The overview must cover the full scope. Key points must include EVERY fact. Terms list must include every named person, place, event, and concept.',
      '',
      'Use EXACTLY this format:',
      '[[OVERVIEW]]', '<3-4 sentences covering the complete scope of the content>',
      '[[KEYPOINTS]]', '<Every key fact as its own line - include all names, dates, events, terms. Add as many lines as needed.>',
      '[[TERMS]]', '<Every named person, place, dynasty, term, inscription, university, title - one per line>',
      '', 'Study content (nothing can be left out):', content,
    ].join('\n'),

    ppt: [
      'Create a presentation outline from the study content.',
      rule, '',
      'Create as many slides as needed so that EVERY fact appears somewhere. Do not merge topics to reduce slide count.',
      'Each slide covers one topic. Bullets must be specific - include names, dates, and terms.',
      '',
      'Use EXACTLY this format (add more slides as needed):',
      '[[SLIDE_1_TITLE]]', '<Title slide>',
      '[[SLIDE_1_BULLETS]]', '<subtitle>', '<context line>',
      ...[2,3,4,5,6,7,8,9,10,11,12].map(slideBlock),
      '', 'Add more slides using the same pattern if needed.',
      'Study content (every fact must appear on a slide):', content,
    ].join('\n'),

    analogy: [
      'Explain every concept from the study content using real-world analogies.',
      rule, '',
      'Create one analogy block per major concept, person, or event. Do not skip any.',
      '',
      'Use EXACTLY this format (repeat for every concept):',
      ...[1,2,3,4,5,6,7,8].map(analogyBlock),
      '', 'Study content (cover every concept, person, and event):', content,
    ].join('\n'),

    freewrite: [
      'You are a study coach. Read the study content and create a free-writing challenge.',
      hint, '',
      'Create one broad topic question that covers the whole content, and list 8-10 key concept hints.',
      '',
      'Use EXACTLY this format:',
      '[[TOPIC]]', '<A broad, open-ended question asking the student to write everything they know about the content>',
      '[[HINTS]]', '<hint concept 1>', '<hint concept 2>', '<hint concept 3>', '<hint concept 4>',
      '<hint concept 5>', '<hint concept 6>', '<hint concept 7>', '<hint concept 8>',
      '', 'Study content:', content,
    ].join('\n'),

    imgstory: [
      'You are a visual storytelling director. Break the study content into a sequence of illustrated scenes.',
      hint, '',
      'Create 6-8 scenes. Each scene needs a label, narrative caption, and a detailed image generation prompt.',
      '',
      'Use EXACTLY this format:',
      ...[1,2,3,4,5,6,7,8].map(imgSceneBlock),
      '', 'Study content (cover every fact across all scenes):', content,
    ].join('\n'),

    video: [
      'You are a documentary filmmaker and educator. Transform the study content into a narrated video documentary script.',
      rule, '',
      'Create 8-12 scenes. Each scene has a title, spoken narration (2-3 natural spoken sentences), a key fact for on-screen display, and one emoji.',
      'Cover EVERY fact from the study content across all scenes.',
      '',
      'Use EXACTLY this format:',
      '[[VIDEO_TITLE]]', '<Short compelling documentary title>',
      ...[1,2,3,4,5,6,7,8,9,10,11,12].map((n) => [
        `[[SCENE_${n}_TITLE]]`, '<Scene title 3-6 words>',
        `[[SCENE_${n}_NARRATION]]`, '<2-3 sentences of natural spoken narration. Sound like a great documentary narrator. Weave in all the facts for this section.>',
        `[[SCENE_${n}_KEYFACT]]`, '<One punchy fact, date, or statistic to display on screen>',
        `[[SCENE_${n}_EMOJI]]`, '<One emoji representing this scene>',
      ].join('\n')),
      '', 'Study content (include every fact):', content,
    ].join('\n'),

    flowchart: [
      'You are a learning designer. Convert the study content into a step-by-step flowchart.',
      rule, '',
      'Create a linear flowchart with 6-14 nodes. Use these node types:',
      '  start     — the opening/introduction node (use once at the start)',
      '  process   — a regular step, fact, or concept',
      '  decision  — a branching question with yes/no labels',
      '  end       — the closing/conclusion node (use once at the end)',
      '',
      'Use EXACTLY this format (add more nodes as needed, max 20):',
      '[[FLOW_TITLE]]', '<Short title for the flowchart>',
      ...[1,2,3,4,5,6,7,8,9,10,11,12].map(nodeBlock),
      '', 'Study content (every key fact must appear as a node):', content,
    ].join('\n'),
  };

  return templates[fmt] || templates.summary;
}
