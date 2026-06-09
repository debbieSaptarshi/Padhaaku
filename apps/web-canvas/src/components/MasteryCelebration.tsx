export default function MasteryCelebration({ topic }: { topic: string }) {
  return (
    <div className="mastery-celebration" role="status">
      <span className="mastery-icon" aria-hidden>
        🎉
      </span>
      <div>
        <strong>You&apos;ve got {topic}!</strong>
        <p>Your understanding score crossed the mastery line. Nice productive struggle.</p>
      </div>
    </div>
  );
}
