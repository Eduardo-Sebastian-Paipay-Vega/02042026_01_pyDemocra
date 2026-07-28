import { startExamSession, gradeExamSubmission } from "./lms-evaluations.js";

describe("Modulo M08: Cursos y Evaluaciones LMS (server/services/lms-evaluations.js)", () => {
  const quizConfig = {
    timeLimitMinutes: 30,
    maxAttempts: 3,
    passingScorePercentage: 70,
    questions: [
      { id: "q1", text: "Pregunta 1", correctOption: "A" },
      { id: "q2", text: "Pregunta 2", correctOption: "B" },
    ],
  };

  test("inicia sesion de examen cronometrada correctamente", () => {
    const session = startExamSession({
      userId: "user-1",
      courseId: "course-101",
      quizConfig,
      previousAttempts: 0,
    });

    expect(session.sessionId).toBeDefined();
    expect(session.attemptNumber).toBe(1);
    expect(session.status).toBe("IN_PROGRESS");
  });

  test("bloquea el inicio de examen si se supera el limite maximo de intentos", () => {
    expect(() =>
      startExamSession({
        userId: "user-1",
        courseId: "course-101",
        quizConfig,
        previousAttempts: 3,
      })
    ).toThrow("Has alcanzado el limite maximo de 3 intentos");
  });

  test("califica automaticamente el examen como APROBADO cuando todas las respuestas son correctas", () => {
    const session = startExamSession({
      userId: "user-1",
      courseId: "course-101",
      quizConfig,
    });

    const userAnswers = [
      { questionId: "q1", selectedOption: "A" },
      { questionId: "q2", selectedOption: "B" },
    ];

    const result = gradeExamSubmission({
      session,
      userAnswers,
      quizConfig,
      submissionTimestampMs: new Date(session.startedAt).getTime() + 5000,
    });

    expect(result.isPassed).toBe(true);
    expect(result.finalScorePercentage).toBe(100);
    expect(result.correctCount).toBe(2);
  });

  test("reprueba el examen cuando el tiempo limite es sobrepasado", () => {
    const session = startExamSession({
      userId: "user-1",
      courseId: "course-101",
      quizConfig,
    });

    // Enviar respuestas 60 minutos después (límite era 30 mins)
    const expiredTimestamp = new Date(session.startedAt).getTime() + 60 * 60 * 1000;

    const result = gradeExamSubmission({
      session,
      userAnswers: [{ questionId: "q1", selectedOption: "A" }],
      quizConfig,
      submissionTimestampMs: expiredTimestamp,
    });

    expect(result.isPassed).toBe(false);
    expect(result.isTimeExpired).toBe(true);
  });
});
