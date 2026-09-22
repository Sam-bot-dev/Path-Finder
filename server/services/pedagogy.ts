export interface DiagnosticQuestion {
  id: string
  skill: string
  prompt: string
  options: string[]
  answer: number
  explanation: string
}

export interface LearningLesson {
  id: string
  title: string
  description: string
  minutes: number
  content: string[]
  example: { title: string; text: string }
  practice: DiagnosticQuestion[]
  videoQuery: string
  resourceUrl: string
  resourceLabel: string
  focus?: boolean
}

// Subskill generator for arbitrary topic
export function deriveSubskills(topic: string, count: number): string[] {
  const clean = topic.trim()
  const baseSkills = [
    `Foundational Principles of ${clean}`,
    `Core Terminology & Mechanisms in ${clean}`,
    `Practical Problem Solving in ${clean}`,
    `Critical Analysis & Common Pitfalls in ${clean}`,
    `Advanced Synthesis & Systemic Concepts in ${clean}`,
    `Application to Real-World Scenarios in ${clean}`,
    `Evaluation & Quantitative Reasoning in ${clean}`,
    `Structural Patterns in ${clean}`,
    `Comparative Perspectives on ${clean}`,
    `Mastery & Capstone Challenges in ${clean}`
  ]

  return baseSkills.slice(0, Math.max(5, Math.min(10, count)))
}

export function generatePedagogicalDiagnostic(topic: string, count: number = 5): DiagnosticQuestion[] {
  const skills = deriveSubskills(topic, count)
  return skills.map((skill, idx) => {
    const id = `diag-${Date.now()}-${idx + 1}`
    let prompt = ''
    let options: string[] = []
    let answer = 0
    let explanation = ''

    if (idx === 0) {
      prompt = `Which statement best describes the foundational starting point of ${skill}?`
      options = [
        `It establishes the fundamental definitions and axiomatic concepts that govern ${topic}.`,
        `It operates independently of any theoretical framework or baseline criteria.`,
        `It exclusively applies to peripheral edge cases without affecting core logic.`,
        `It replaces the need for any formal analysis or empirical verification.`
      ]
      answer = 0
      explanation = `Understanding foundational definitions is essential because all advanced reasoning in ${topic} builds directly upon these core premises.`
    } else if (idx === 1) {
      prompt = `When analyzing ${skill}, what is the primary mechanism that connects cause and effect?`
      options = [
        `Arbitrary fluctuations that cannot be systematically predicted.`,
        `A structured workflow where inputs and principles determine observable outcomes.`,
        `Relying solely on intuition without documented rules or models.`,
        `An isolated step that has no bearing on subsequent results.`
      ]
      answer = 1
      explanation = `Systematic outcomes depend on structured mechanisms. Recognizing how components interact is key to mastering this skill.`
    } else if (idx === 2) {
      prompt = `In practical problem-solving within ${skill}, which strategy yields the most reliable outcome?`
      options = [
        `Skipping intermediate validation steps to reach an estimate faster.`,
        `Applying inconsistent assumptions across different parts of the problem.`,
        `Decomposing the problem systematically and verifying boundary conditions.`,
        `Ignoring prior constraints whenever a direct solution appears difficult.`
      ]
      answer = 2
      explanation = `Systematic decomposition combined with constraint verification ensures robustness and prevents common miscalculations.`
    } else if (idx === 3) {
      prompt = `What is a common misconception or pitfall learners encounter regarding ${skill}?`
      options = [
        `Verifying work using multiple distinct perspectives.`,
        `Assuming correlation guarantees causation without checking structural factors.`,
        `Clearly documenting assumptions before drawing conclusions.`,
        `Practicing with diverse, varied sample problems.`
      ]
      answer = 1
      explanation = `A classic trap in ${topic} is confusing superficial alignment with genuine causal relationships.`
    } else if (idx === 4) {
      prompt = `How does ${skill} integrate with broader systems in ${topic}?`
      options = [
        `It serves as an integrative bridge connecting isolated components into a unified model.`,
        `It has no measurable connection to any other facet of the subject.`,
        `It completely invalidates earlier foundational concepts.`,
        `It functions only when all surrounding variables are held strictly static.`
      ]
      answer = 0
      explanation = `Synthesizing concepts allows you to view ${topic} holistically rather than as isolated fragments.`
    } else {
      prompt = `When evaluating an advanced scenario involving ${skill}, what is the decisive metric for success?`
      options = [
        `Consistent, reproducible results aligned with core theoretical standards.`,
        `High variance with unpredictable responses under standard conditions.`,
        `Total divergence from established empirical benchmarks.`,
        `Subjective impressions without reproducible verification.`
      ]
      answer = 0
      explanation = `In advanced applications of ${topic}, reproducible consistency and alignment with core criteria are the gold standards.`
    }

    return {
      id,
      skill,
      prompt,
      options,
      answer,
      explanation
    }
  })
}

export function generatePedagogicalPath(
  topic: string,
  questions: DiagnosticQuestion[],
  answers: number[],
  resourceUrl: string,
  resourceLabel: string
): LearningLesson[] {
  return questions.map((q, idx) => {
    const isCorrect = answers[idx] === q.answer
    const focus = !isCorrect
    const minutes = focus ? 12 : 7
    const id = `lesson-${idx + 1}-${Date.now()}`

    const content = focus
      ? [
          `Welcome to your dedicated focus session on ${q.skill}. During your check-in, this area presented an opportunity for deeper growth. We'll start from the ground up to establish intuition and clarity.`,
          `At its core, ${q.skill} revolves around understanding the underlying principles that make ${topic} predictable and manageable. Rather than memorizing formulas or rote facts, notice how each component leads naturally into the next. Take special care when dealing with boundary conditions and nuanced edge cases.`,
          `With regular practice and careful observation of these building blocks, this skill will transition from a sticking point into one of your strongest conceptual assets.`
        ]
      : [
          `You demonstrated strong foundational familiarity with ${q.skill} during your check-in. In this module, we'll quickly refresh key points and push into more advanced nuances and applications.`,
          `Even when concepts in ${q.skill} feel intuitive, examining edge scenarios, optimization strategies, and subtle trade-offs reveals deeper insights into ${topic}.`,
          `Keep an eye on how this skill bridges into adjacent topics and real-world system designs.`
        ]

    const example = {
      title: focus ? `Core Demonstration: Overcoming Pitfalls in ${q.skill}` : `Advanced Application: Synthesis in ${q.skill}`,
      text: focus
        ? `Consider a scenario where you are faced with a challenging problem in ${topic}. Step 1: Identify all known parameters. Step 2: Formulate the model using the primary definition. Step 3: Test against common traps like ${q.prompt.slice(0, 40)}... Notice how adhering to standard principles resolves ambiguities seamlessly.`
        : `Consider how professional practitioners leverage ${q.skill} in complex environments. By optimizing the transition between steps and eliminating unnecessary overhead, the overall workflow becomes faster, clearer, and far more reliable.`
    }

    const practice: DiagnosticQuestion[] = [
      {
        id: `prac-${idx + 1}-1`,
        skill: q.skill,
        prompt: `Practice 1: Which technique provides the most resilient defense against errors in ${q.skill}?`,
        options: [
          `Relying entirely on automatic default settings without checking outputs.`,
          `Systematic validation of assumptions at each critical milestone.`,
          `Omitting documentation and intermediate test results.`,
          `Applying rules inconsistently depending on speed constraints.`
        ],
        answer: 1,
        explanation: `Systematic validation at every step ensures defects and misunderstandings are caught early and fixed decisively.`
      },
      {
        id: `prac-${idx + 1}-2`,
        skill: q.skill,
        prompt: `Practice 2: When applying ${q.skill} under shifting constraints, what is the best approach?`,
        options: [
          `Revert immediately to foundational principles and re-evaluate parameters.`,
          `Force previous assumptions even when variables contradict them.`,
          `Abandon the analysis completely until conditions return to normal.`,
          `Guess the outcome based on unrelated historical trends.`
        ],
        answer: 0,
        explanation: `Grounding your thought process in core principles gives you the agility to adapt when problem conditions change.`
      }
    ]

    return {
      id,
      title: `${focus ? 'Deep Dive' : 'Refresher'}: ${q.skill}`,
      description: focus
        ? `Step-by-step guidance, real examples, and reinforced practice to build mastery.`
        : `A rapid conceptual overview and advanced challenges to cement your understanding.`,
      minutes,
      content,
      example,
      practice,
      videoQuery: `${topic} ${q.skill} tutorial lesson`,
      resourceUrl,
      resourceLabel,
      focus
    }
  })
}
