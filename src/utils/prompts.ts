export function buildStage2Prompt(startupIdea: string, assessmentsText: string): string {
  return `You previously assessed a startup idea. Now, review the anonymized assessments from all advisors (including your own, though you don't know which is yours).

Startup Idea: ${startupIdea}

Here are all the assessments:

${assessmentsText}

Your task:
1. Evaluate each assessment. What does each one get right? What does each miss?
2. Identify the strongest and weakest assessment overall.
3. Provide a FINAL RANKING from best to worst.

IMPORTANT: Your final ranking MUST be formatted EXACTLY as:
FINAL RANKING:
1. Assessment [Letter]
2. Assessment [Letter]
3. Assessment [Letter]
4. Assessment [Letter]

Provide your evaluation and ranking now:`;
}

export function buildDecisionAgentPrompt(
  startupIdea: string,
  stage1Text: string,
  stage2Text: string,
): string {
  return `You are the Decision Agent for a Startup Council. Four expert advisors have independently assessed a startup idea, then cross-reviewed each other's assessments. Your job is to synthesize everything into a final, actionable recommendation.

## The Startup Idea
${startupIdea}

## Stage 1: Individual Expert Assessments
${stage1Text}

## Stage 2: Cross-Reviews and Rankings
${stage2Text}

## Your Task
Synthesize all assessments, reviews, and rankings into a comprehensive final report. Consider:
- Where the experts agree and disagree
- The strength of arguments from each perspective
- The aggregate rankings (which assessments were rated highest by peers)
- Hidden risks or opportunities that emerge from combining perspectives

Structure your final report as follows:

# Startup Council Decision Report

## Executive Summary
[2-3 sentences capturing the overall verdict]

## Verdict: [STRONG PURSUE / PURSUE WITH CAUTION / PIVOT NEEDED / PASS]

## Key Strengths (Consensus)
- [Strengths that multiple advisors identified]

## Critical Risks (Consensus)
- [Risks that multiple advisors flagged]

## Divergent Opinions
[Where advisors disagreed and what that means]

## Recommended Next Steps
1. [Ordered list of the 3-5 most important actions]

## Conditions for Success
- [What must be true for this startup to work]

## Overall Council Score: [X/10]
[Weighted average considering all perspectives and cross-reviews]`;
}
