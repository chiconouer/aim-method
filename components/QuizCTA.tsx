import Link from "next/link";

export function QuizCTA({
  moduleId,
  quizCompleted,
}: {
  moduleId: number;
  quizCompleted: boolean;
}) {
  return (
    <div className="glass-card rounded-2xl p-6 text-center">
      <div className="text-3xl mb-2">{quizCompleted ? "🎯" : "📝"}</div>
      <h3 className="text-white font-bold text-lg mb-1">
        {quizCompleted ? "Quiz completed" : "Ready for the Module Quiz?"}
      </h3>
      <p className="text-gray-400 text-sm mb-5">
        {quizCompleted
          ? "You've already completed this quiz. Feel free to retake it anytime."
          : `Test what you learned in Module ${moduleId}. Passing the quiz unlocks the next module.`}
      </p>
      <Link
        href={`/dashboard/module/${moduleId}/quiz`}
        className="purple-btn text-white font-bold py-3 px-6 rounded-xl text-sm inline-block"
      >
        {quizCompleted ? "Retake Quiz" : "Take the Module Quiz"}
      </Link>
    </div>
  );
}
