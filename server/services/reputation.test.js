import { calculateVolunteerReputation } from "./reputation.js";

describe("Modulo M01: Motor de Reputacion y Scoring (server/services/reputation.js)", () => {
  test("calcula scoring alto y asigna insignia PLATINUM para asistencias perfectas y 100+ horas", () => {
    const rep = calculateVolunteerReputation({
      attendancesCount: 20,
      onTimeCount: 20,
      justifiedAbsences: 0,
      unjustifiedAbsences: 0,
      totalHours: 120,
      averageRating: 5.0,
    });

    expect(rep.reputationScore).toBe(100);
    expect(rep.rank).toBe("Leyenda");
    expect(rep.badgeCode).toBe("PLATINUM");
  });

  test("penaliza ausencias injustificadas y asigna insignia SILVER", () => {
    const rep = calculateVolunteerReputation({
      attendancesCount: 8,
      onTimeCount: 7,
      justifiedAbsences: 0,
      unjustifiedAbsences: 1,
      totalHours: 50,
      averageRating: 4.5,
    });

    expect(rep.reputationScore).toBeGreaterThanOrEqual(40);
    expect(rep.reputationScore).toBeLessThan(70);
    expect(rep.rank).toBe("Activo");
    expect(rep.badgeCode).toBe("SILVER");
  });

  test("mantiene el scoring dentro de los limites 0 y 100", () => {
    const lowRep = calculateVolunteerReputation({
      attendancesCount: 1,
      onTimeCount: 0,
      unjustifiedAbsences: 10,
      totalHours: 0,
      averageRating: 1.0,
    });
    expect(lowRep.reputationScore).toBe(6);
    expect(lowRep.rank).toBe("Novato");
  });
});
