import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

type Concept = {
  id: string;
  name: string;
  mastery: number;
  trend: number;
  attempts: number;
};

type PracticeQuestion = {
  id: string;
  conceptId: string;
  subject: string;
  difficulty: 1 | 2 | 3;
  prompt: string;
  answerKeywords: string[];
  focusPoint: string;
  hints: string[];
  explanation: string;
};

type Attempt = {
  id: string;
  conceptName: string;
  score: number;
  hintCount: number;
  difficulty: number;
};

const initialConcepts: Concept[] = [
  {
    id: 'projectile-motion',
    name: 'Projectile motion',
    mastery: 4.7,
    trend: 1.6,
    attempts: 18,
  },
  {
    id: 'energy-conservation',
    name: 'Energy conservation',
    mastery: 6.1,
    trend: 1.2,
    attempts: 14,
  },
  {
    id: 'quadratic-roots',
    name: 'Quadratic roots',
    mastery: 5.4,
    trend: 0.9,
    attempts: 12,
  },
  {
    id: 'stoichiometry',
    name: 'Stoichiometry',
    mastery: 3.8,
    trend: 1.9,
    attempts: 9,
  },
];

const practiceQuestions: PracticeQuestion[] = [
  {
    id: 'q-projectile-01',
    conceptId: 'projectile-motion',
    subject: 'Physics',
    difficulty: 2,
    prompt:
      'A ball is launched horizontally from a 20 m high cliff at 12 m/s. What should you calculate first to find where it lands?',
    answerKeywords: ['time', 'fall', 'height', 'vertical'],
    focusPoint: 'Separate horizontal and vertical motion before solving.',
    hints: [
      'Start with the vertical direction. The initial vertical velocity is zero.',
      'Use h = 1/2 g t^2 to find the time of fall before using horizontal speed.',
      'After time is known, horizontal distance is speed multiplied by time.',
    ],
    explanation:
      'First solve the vertical fall time from the 20 m height. Then multiply that time by the 12 m/s horizontal velocity.',
  },
  {
    id: 'q-energy-01',
    conceptId: 'energy-conservation',
    subject: 'Physics',
    difficulty: 3,
    prompt:
      'A block slides down a frictionless ramp. Which quantities should appear in the conservation equation, and why?',
    answerKeywords: ['potential', 'kinetic', 'mgh', 'velocity'],
    focusPoint: 'Track how gravitational potential energy becomes kinetic energy.',
    hints: [
      'Ask what form of energy the block has at the top.',
      'On a frictionless ramp, no energy is lost to heat.',
      'Write initial gravitational potential energy equal to final kinetic energy.',
    ],
    explanation:
      'Use mgh = 1/2 mv^2 when the block starts from rest. Potential energy at height h converts into kinetic energy.',
  },
  {
    id: 'q-quadratic-01',
    conceptId: 'quadratic-roots',
    subject: 'Math',
    difficulty: 2,
    prompt:
      'For x^2 - 5x + 6 = 0, explain how you would find the roots without using the quadratic formula.',
    answerKeywords: ['factor', '2', '3', 'zero'],
    focusPoint: 'Factor by finding two numbers that multiply to 6 and add to 5.',
    hints: [
      'Look for two numbers whose product is 6.',
      'Those same numbers should add to 5 because the middle term is -5x.',
      'Set each factor equal to zero after factoring.',
    ],
    explanation:
      'x^2 - 5x + 6 factors into (x - 2)(x - 3). The roots are x = 2 and x = 3.',
  },
  {
    id: 'q-stoich-01',
    conceptId: 'stoichiometry',
    subject: 'Chemistry',
    difficulty: 1,
    prompt:
      'If 2H2 + O2 -> 2H2O, what mole ratio connects hydrogen gas to water?',
    answerKeywords: ['2', '2:2', '1:1', 'ratio'],
    focusPoint: 'Use coefficients from the balanced equation as mole ratios.',
    hints: [
      'Read the coefficient in front of H2.',
      'Read the coefficient in front of H2O.',
      'Reduce the coefficient ratio if possible.',
    ],
    explanation:
      'The balanced coefficients show 2 mol H2 produce 2 mol H2O, so the simplified ratio is 1:1.',
  },
];

const loopSteps = ['Measure', 'Assign', 'Coach', 'Update', 'Repeat'];

const metricCards = [
  {
    label: 'Observed mastery gain',
    value: '+2.60',
    detail: 'among students with 10+ attempts',
  },
  {
    label: 'High-volume practice',
    value: '50.6%',
    detail: 'reached 100+ attempts',
  },
  {
    label: 'Independence signal',
    value: '-21%',
    detail: 'hints per attempt over time',
  },
];

const clampMastery = (value: number) => Math.max(0, Math.min(10, value));

const getScoreFromResponse = (response: string, keywords: string[]) => {
  const normalized = response.toLowerCase();
  const matches = keywords.filter((keyword) => normalized.includes(keyword.toLowerCase()));

  if (matches.length === 0) {
    return 2;
  }

  const rawScore = Math.round((matches.length / keywords.length) * 10);
  return Math.max(4, Math.min(10, rawScore));
};

const getMasteryTone = (mastery: number) => {
  if (mastery >= 7.5) {
    return styles.masteryStrong;
  }

  if (mastery >= 5) {
    return styles.masteryBuilding;
  }

  return styles.masteryNeedsWork;
};

export default function App() {
  const [concepts, setConcepts] = useState(initialConcepts);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [response, setResponse] = useState('');
  const [hintsRevealed, setHintsRevealed] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([
    {
      id: 'seed-1',
      conceptName: 'Stoichiometry',
      score: 4,
      hintCount: 3,
      difficulty: 1,
    },
    {
      id: 'seed-2',
      conceptName: 'Projectile motion',
      score: 6,
      hintCount: 2,
      difficulty: 2,
    },
    {
      id: 'seed-3',
      conceptName: 'Energy conservation',
      score: 8,
      hintCount: 1,
      difficulty: 3,
    },
  ]);

  const activeQuestion = practiceQuestions[activeQuestionIndex];
  const activeConcept = concepts.find((concept) => concept.id === activeQuestion.conceptId);

  const averageMastery = useMemo(() => {
    const total = concepts.reduce((sum, concept) => sum + concept.mastery, 0);
    return total / concepts.length;
  }, [concepts]);

  const weakestConcept = useMemo(
    () => [...concepts].sort((a, b) => a.mastery - b.mastery)[0],
    [concepts],
  );

  const averageHints = useMemo(() => {
    const totalHints = attempts.reduce((sum, attempt) => sum + attempt.hintCount, 0);
    return totalHints / attempts.length;
  }, [attempts]);

  const shownHints = activeQuestion.hints.slice(0, hintsRevealed);
  const canRevealHint = hintsRevealed < activeQuestion.hints.length;

  const moveToNextQuestion = () => {
    setActiveQuestionIndex((current) => (current + 1) % practiceQuestions.length);
    setResponse('');
    setHintsRevealed(0);
    setFeedback(null);
  };

  const revealHint = () => {
    if (!canRevealHint) {
      return;
    }

    setHintsRevealed((current) => current + 1);
  };

  const submitAnswer = () => {
    const trimmedResponse = response.trim();

    if (!trimmedResponse) {
      setFeedback('Write your reasoning first. Fermi grades the thinking path, not just a final answer.');
      return;
    }

    const score = getScoreFromResponse(trimmedResponse, activeQuestion.answerKeywords);
    const conceptName = activeConcept?.name ?? activeQuestion.subject;

    setConcepts((currentConcepts) =>
      currentConcepts.map((concept) => {
        if (concept.id !== activeQuestion.conceptId) {
          return concept;
        }

        const updatedMastery = clampMastery(concept.mastery * 0.72 + score * 0.28);

        return {
          ...concept,
          mastery: Number(updatedMastery.toFixed(1)),
          trend: Number((updatedMastery - concept.mastery).toFixed(1)),
          attempts: concept.attempts + 1,
        };
      }),
    );

    setAttempts((currentAttempts) => [
      {
        id: `${activeQuestion.id}-${Date.now()}`,
        conceptName,
        score,
        hintCount: hintsRevealed,
        difficulty: activeQuestion.difficulty,
      },
      ...currentAttempts.slice(0, 5),
    ]);

    setFeedback(
      score >= 8
        ? `Mastery signal: ${score}/10. Strong reasoning. ${activeQuestion.explanation}`
        : `Mastery signal: ${score}/10. Review the scaffold: ${activeQuestion.focusPoint}`,
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.brandRow}>
            <View style={styles.logoMark}>
              <Text style={styles.logoText}>F</Text>
            </View>
            <View>
              <Text style={styles.eyebrow}>Fermi practice</Text>
              <Text style={styles.title}>AI-assisted STEM mastery</Text>
            </View>
          </View>

          <Text style={styles.heroCopy}>
            Practice stays at the center. The tutor measures concept understanding, assigns targeted
            problems, and gives stepwise coaching without turning into an answer machine.
          </Text>

          <View style={styles.loopRow}>
            {loopSteps.map((step, index) => (
              <View key={step} style={styles.loopPill}>
                <Text style={styles.loopIndex}>{index + 1}</Text>
                <Text style={styles.loopText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <View style={[styles.dashboardCard, styles.primaryMetricCard]}>
            <Text style={styles.cardLabel}>Current mastery</Text>
            <Text style={styles.masteryValue}>{averageMastery.toFixed(1)}/10</Text>
            <Text style={styles.cardDetail}>
              Weakest focus: {weakestConcept.name}. Keep return-after-failure low with fast wins.
            </Text>
          </View>

          <View style={styles.dashboardCard}>
            <Text style={styles.cardLabel}>Attempts</Text>
            <Text style={styles.metricValue}>{attempts.length}</Text>
            <Text style={styles.cardDetail}>Recent local session attempts tracked by concept.</Text>
          </View>

          <View style={styles.dashboardCard}>
            <Text style={styles.cardLabel}>Hints / attempt</Text>
            <Text style={styles.metricValue}>{averageHints.toFixed(1)}</Text>
            <Text style={styles.cardDetail}>Moderate hints support productive struggle.</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Evidence snapshot</Text>
          <Text style={styles.sectionSubtitle}>From the uploaded Fermi whitepaper</Text>
        </View>

        <View style={styles.evidenceRow}>
          {metricCards.map((card) => (
            <View key={card.label} style={styles.evidenceCard}>
              <Text style={styles.evidenceValue}>{card.value}</Text>
              <Text style={styles.evidenceLabel}>{card.label}</Text>
              <Text style={styles.evidenceDetail}>{card.detail}</Text>
            </View>
          ))}
        </View>

        <View style={styles.practiceCard}>
          <View style={styles.practiceHeader}>
            <View>
              <Text style={styles.eyebrow}>Assigned practice</Text>
              <Text style={styles.practiceTitle}>{activeConcept?.name}</Text>
            </View>
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>D{activeQuestion.difficulty}</Text>
            </View>
          </View>

          <Text style={styles.subjectText}>{activeQuestion.subject}</Text>
          <Text style={styles.prompt}>{activeQuestion.prompt}</Text>

          <View style={styles.focusBox}>
            <Text style={styles.focusLabel}>Coach objective</Text>
            <Text style={styles.focusText}>{activeQuestion.focusPoint}</Text>
          </View>

          <TextInput
            multiline
            placeholder="Write your next step or explanation..."
            placeholderTextColor="#8a94a6"
            style={styles.input}
            textAlignVertical="top"
            value={response}
            onChangeText={setResponse}
          />

          <View style={styles.actionRow}>
            <Pressable
              accessibilityRole="button"
              disabled={!canRevealHint}
              style={({ pressed }) => [
                styles.secondaryButton,
                !canRevealHint && styles.buttonDisabled,
                pressed && canRevealHint && styles.buttonPressed,
              ]}
              onPress={revealHint}
            >
              <Text style={styles.secondaryButtonText}>
                {canRevealHint ? 'Get a hint' : 'All hints used'}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
              onPress={submitAnswer}
            >
              <Text style={styles.primaryButtonText}>Check reasoning</Text>
            </Pressable>
          </View>

          {shownHints.length > 0 && (
            <View style={styles.hintStack}>
              <Text style={styles.hintTitle}>Stepwise coaching</Text>
              {shownHints.map((hint, index) => (
                <View key={hint} style={styles.hintItem}>
                  <Text style={styles.hintNumber}>{index + 1}</Text>
                  <Text style={styles.hintText}>{hint}</Text>
                </View>
              ))}
            </View>
          )}

          {feedback && (
            <View style={styles.feedbackBox}>
              <Text style={styles.feedbackTitle}>Attempt feedback</Text>
              <Text style={styles.feedbackText}>{feedback}</Text>
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [styles.nextButton, pressed && styles.buttonPressed]}
                onPress={moveToNextQuestion}
              >
                <Text style={styles.nextButtonText}>Next targeted problem</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Concept mastery</Text>
          <Text style={styles.sectionSubtitle}>Updated after every checked response</Text>
        </View>

        <View style={styles.conceptsList}>
          {concepts.map((concept) => (
            <View key={concept.id} style={styles.conceptCard}>
              <View style={styles.conceptTopRow}>
                <View>
                  <Text style={styles.conceptName}>{concept.name}</Text>
                  <Text style={styles.conceptMeta}>{concept.attempts} attempts</Text>
                </View>
                <Text style={styles.conceptScore}>{concept.mastery.toFixed(1)}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    getMasteryTone(concept.mastery),
                    { width: `${concept.mastery * 10}%` },
                  ]}
                />
              </View>
              <Text style={styles.trendText}>
                {concept.trend >= 0 ? '+' : ''}
                {concept.trend.toFixed(1)} since last update
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent attempt trace</Text>
          <Text style={styles.sectionSubtitle}>Scores and assistance stay separate</Text>
        </View>

        <View style={styles.attemptList}>
          {attempts.map((attempt) => (
            <View key={attempt.id} style={styles.attemptRow}>
              <View>
                <Text style={styles.attemptConcept}>{attempt.conceptName}</Text>
                <Text style={styles.attemptMeta}>
                  Difficulty {attempt.difficulty} - {attempt.hintCount} hints
                </Text>
              </View>
              <Text style={styles.attemptScore}>{attempt.score}/10</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#eef4ff',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  hero: {
    backgroundColor: '#101a33',
    borderRadius: 32,
    padding: 24,
    shadowColor: '#101a33',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 14,
  },
  logoMark: {
    alignItems: 'center',
    backgroundColor: '#70f3c6',
    borderRadius: 20,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  logoText: {
    color: '#101a33',
    fontSize: 24,
    fontWeight: '900',
  },
  eyebrow: {
    color: '#5d6b85',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
    maxWidth: 260,
  },
  heroCopy: {
    color: '#dbe8ff',
    fontSize: 15,
    lineHeight: 23,
    marginTop: 18,
  },
  loopRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 22,
  },
  loopPill: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  loopIndex: {
    color: '#70f3c6',
    fontSize: 12,
    fontWeight: '900',
  },
  loopText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 18,
  },
  dashboardCard: {
    backgroundColor: '#ffffff',
    borderColor: '#dfe8f6',
    borderRadius: 24,
    borderWidth: 1,
    flexGrow: 1,
    minWidth: 148,
    padding: 16,
    width: '47%',
  },
  primaryMetricCard: {
    width: '100%',
  },
  cardLabel: {
    color: '#65738b',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  masteryValue: {
    color: '#101a33',
    fontSize: 42,
    fontWeight: '900',
    marginTop: 8,
  },
  metricValue: {
    color: '#101a33',
    fontSize: 30,
    fontWeight: '900',
    marginTop: 8,
  },
  cardDetail: {
    color: '#66758f',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  sectionHeader: {
    marginBottom: 12,
    marginTop: 28,
  },
  sectionTitle: {
    color: '#101a33',
    fontSize: 22,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: '#66758f',
    fontSize: 13,
    marginTop: 4,
  },
  evidenceRow: {
    gap: 12,
  },
  evidenceCard: {
    backgroundColor: '#ffffff',
    borderColor: '#dfe8f6',
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  evidenceValue: {
    color: '#315cff',
    fontSize: 28,
    fontWeight: '900',
  },
  evidenceLabel: {
    color: '#101a33',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  evidenceDetail: {
    color: '#66758f',
    fontSize: 13,
    marginTop: 4,
  },
  practiceCard: {
    backgroundColor: '#ffffff',
    borderColor: '#dfe8f6',
    borderRadius: 30,
    borderWidth: 1,
    marginTop: 28,
    padding: 20,
  },
  practiceHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  practiceTitle: {
    color: '#101a33',
    fontSize: 24,
    fontWeight: '900',
    marginTop: 2,
  },
  difficultyBadge: {
    backgroundColor: '#fff2cf',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  difficultyText: {
    color: '#805500',
    fontSize: 13,
    fontWeight: '900',
  },
  subjectText: {
    color: '#315cff',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 18,
  },
  prompt: {
    color: '#18223a',
    fontSize: 19,
    fontWeight: '800',
    lineHeight: 27,
    marginTop: 8,
  },
  focusBox: {
    backgroundColor: '#f3f7ff',
    borderRadius: 18,
    marginTop: 16,
    padding: 14,
  },
  focusLabel: {
    color: '#315cff',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  focusText: {
    color: '#2a3654',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  input: {
    backgroundColor: '#f8fbff',
    borderColor: '#d6e1f2',
    borderRadius: 20,
    borderWidth: 1,
    color: '#101a33',
    fontSize: 16,
    lineHeight: 22,
    marginTop: 16,
    minHeight: 120,
    padding: 16,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#315cff',
    borderRadius: 18,
    flex: 1,
    justifyContent: 'center',
    padding: 15,
  },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#edf3ff',
    borderRadius: 18,
    flex: 1,
    justifyContent: 'center',
    padding: 15,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  secondaryButtonText: {
    color: '#315cff',
    fontSize: 14,
    fontWeight: '900',
  },
  buttonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  hintStack: {
    gap: 10,
    marginTop: 18,
  },
  hintTitle: {
    color: '#101a33',
    fontSize: 16,
    fontWeight: '900',
  },
  hintItem: {
    alignItems: 'flex-start',
    backgroundColor: '#f8fbff',
    borderRadius: 18,
    flexDirection: 'row',
    gap: 10,
    padding: 12,
  },
  hintNumber: {
    color: '#315cff',
    fontSize: 14,
    fontWeight: '900',
    width: 18,
  },
  hintText: {
    color: '#2a3654',
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  feedbackBox: {
    backgroundColor: '#ecfff8',
    borderColor: '#bcefdc',
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 18,
    padding: 15,
  },
  feedbackTitle: {
    color: '#087a56',
    fontSize: 14,
    fontWeight: '900',
  },
  feedbackText: {
    color: '#1e4d40',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  nextButton: {
    alignItems: 'center',
    backgroundColor: '#101a33',
    borderRadius: 16,
    marginTop: 12,
    padding: 13,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  conceptsList: {
    gap: 12,
  },
  conceptCard: {
    backgroundColor: '#ffffff',
    borderColor: '#dfe8f6',
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
  },
  conceptTopRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  conceptName: {
    color: '#101a33',
    fontSize: 16,
    fontWeight: '900',
  },
  conceptMeta: {
    color: '#66758f',
    fontSize: 13,
    marginTop: 4,
  },
  conceptScore: {
    color: '#101a33',
    fontSize: 22,
    fontWeight: '900',
  },
  progressTrack: {
    backgroundColor: '#edf2fb',
    borderRadius: 999,
    height: 10,
    marginTop: 14,
    overflow: 'hidden',
  },
  progressFill: {
    borderRadius: 999,
    height: '100%',
  },
  masteryStrong: {
    backgroundColor: '#19bf83',
  },
  masteryBuilding: {
    backgroundColor: '#ffba42',
  },
  masteryNeedsWork: {
    backgroundColor: '#ff6f6f',
  },
  trendText: {
    color: '#66758f',
    fontSize: 13,
    marginTop: 8,
  },
  attemptList: {
    backgroundColor: '#ffffff',
    borderColor: '#dfe8f6',
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },
  attemptRow: {
    alignItems: 'center',
    borderBottomColor: '#edf2fb',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
  },
  attemptConcept: {
    color: '#101a33',
    fontSize: 15,
    fontWeight: '900',
  },
  attemptMeta: {
    color: '#66758f',
    fontSize: 13,
    marginTop: 4,
  },
  attemptScore: {
    color: '#315cff',
    fontSize: 16,
    fontWeight: '900',
  },
});
