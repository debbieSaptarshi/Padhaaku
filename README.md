# Fermi Practice

An Expo React Native prototype that recreates the core Fermi learning loop from the supplied whitepaper:

1. Measure concept-level mastery.
2. Assign targeted STEM practice.
3. Coach with stepwise hints instead of final answers.
4. Update the learner model after each attempt.
5. Repeat through high-volume practice.

## What is included

- A polished mobile dashboard for mastery, attempts, and hint reliance.
- Whitepaper evidence cards highlighting mastery gains, high-volume practice, and independence signals.
- A local adaptive practice queue across Physics, Math, and Chemistry concepts.
- Stepwise hint reveal flow that preserves student reasoning.
- Answer checking that stores concept score and hint count separately.
- Concept mastery bars and recent attempt traces updated in local state.

## Run the app

```bash
npm install
npm run start
```

Then open the project in Expo Go, an Android emulator, iOS simulator, or the web target:

```bash
npm run android
npm run ios
npm run web
```

## Validate

```bash
npm run typecheck
```

## Notes

This is a front-end MVP with in-memory sample data. The next production steps would be to connect the practice queue, tutor messages, and mastery updates to a backend service and an AI tutoring API with answer-withholding guardrails.
