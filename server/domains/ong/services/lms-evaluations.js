import crypto from "node:crypto";

/**
 * Motor de Evaluaciones y Exámenes LMS (Módulo M08 / RF-048 a RF-054).
 * Gestiona el tiempo límite por intento, la calificación automática y la prevención de fraudes.
 */

/**
 * Inicia una sesión de examen cronometrada para un voluntario/estudiante.
 *
 * @param {Object} options
 * @param {string} options.userId - ID del usuario/voluntario.
 * @param {string} options.courseId - ID del curso o evaluación.
 * @param {Object} options.quizConfig - Configuración del cuestionario (tiempoLimiteMinutos, maxIntentos, etc.).
 * @param {number} [options.previousAttempts=0] - Cantidad de intentos realizados previamente.
 * @returns {Object} Datos de la sesión de examen iniciada con marca de tiempo de expiración.
 */
export function startExamSession({
  userId,
  courseId,
  quizConfig,
  previousAttempts = 0,
}) {
  if (!userId || !courseId) {
    throw new Error("El ID de usuario y el ID de curso son obligatorios.");
  }
  if (!quizConfig || !Array.isArray(quizConfig.questions) || quizConfig.questions.length === 0) {
    throw new Error("El cuestionario debe contener una lista de preguntas valida.");
  }

  const maxAttempts = quizConfig.maxAttempts || 3;
  if (previousAttempts >= maxAttempts) {
    throw new Error(`Has alcanzado el limite maximo de ${maxAttempts} intentos permitidos para este examen.`);
  }

  const timeLimitMinutes = quizConfig.timeLimitMinutes || 30;
  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + timeLimitMinutes * 60 * 1000);
  const sessionId = `exam_sess_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

  return {
    sessionId,
    userId,
    courseId,
    startedAt: startedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    timeLimitMinutes,
    attemptNumber: previousAttempts + 1,
    maxAttempts,
    questionsCount: quizConfig.questions.length,
    status: "IN_PROGRESS",
  };
}

/**
 * Califica automáticamente el examen enviado y determina si el estudiante aprueba.
 *
 * @param {Object} options
 * @param {Object} options.session - Objeto de sesión creado por `startExamSession`.
 * @param {Array} options.userAnswers - Respuestas enviadas por el usuario [{ questionId, selectedOption }].
 * @param {Object} options.quizConfig - Configuración del cuestionario con respuestas correctas.
 * @param {number} [options.submissionTimestampMs] - Timestamp opcional de recepción.
 * @returns {Object} Resultado detallado de la calificación y estado de aprobación.
 */
export function gradeExamSubmission({
  session,
  userAnswers = [],
  quizConfig,
  submissionTimestampMs = Date.now(),
}) {
  if (!session || !quizConfig) {
    throw new Error("La sesion y la configuracion del cuestionario son obligatorias.");
  }

  // Verificar si la sesión ha expirado (tiempo límite sobrepasado)
  const expirationMs = new Date(session.expiresAt).getTime();
  const isTimeExpired = submissionTimestampMs > expirationMs + 5000; // 5s de tolerancia por latencia

  const questions = quizConfig.questions || [];
  const totalQuestions = questions.length;
  const passingScorePercentage = quizConfig.passingScorePercentage || 70.0;

  let correctCount = 0;
  const answersDetail = [];

  const userAnswersMap = new Map(
    userAnswers.map((ans) => [String(ans.questionId), String(ans.selectedOption)])
  );

  for (const q of questions) {
    const qId = String(q.id);
    const userSelected = userAnswersMap.get(qId) || null;
    const correctOption = String(q.correctOption);

    const isCorrect = userSelected !== null && userSelected === correctOption;
    if (isCorrect) {
      correctCount++;
    }

    answersDetail.push({
      questionId: q.id,
      questionText: q.text,
      userSelected,
      correctOption,
      isCorrect,
    });
  }

  const finalScorePercentage = totalQuestions > 0
    ? Math.round((correctCount / totalQuestions) * 100 * 100) / 100
    : 0;

  const isPassed = !isTimeExpired && finalScorePercentage >= passingScorePercentage;

  let statusReason = "Aprobado";
  if (isTimeExpired) {
    statusReason = "Examen reprobado: Tiempo limite sobrepasado.";
  } else if (!isPassed) {
    statusReason = `Examen reprobado: Puntaje (${finalScorePercentage}%) menor al umbral minimo (${passingScorePercentage}%).`;
  }

  return {
    sessionId: session.sessionId,
    userId: session.userId,
    courseId: session.courseId,
    attemptNumber: session.attemptNumber,
    submittedAt: new Date(submissionTimestampMs).toISOString(),
    isTimeExpired,
    totalQuestions,
    correctCount,
    finalScorePercentage,
    passingScorePercentage,
    isPassed,
    statusReason,
    answersDetail,
  };
}
