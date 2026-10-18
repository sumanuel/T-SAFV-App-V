import {
  createCurrentMonthRange,
  createCurrentWeekRange,
  createLastDaysRange,
  createTodayRange,
  formatDateRangeLabel,
  isWithinDateRange,
  normalizeDateRange,
} from "../../src/utils/dateRange";

// Miercoles 15 de octubre de 2025, mediodia local.
const NOW = new Date(2025, 9, 15, 12, 0, 0);

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(NOW);
});

afterEach(() => jest.useRealTimers());

describe("normalizeDateRange", () => {
  it("ordena inicio y fin, y lleva el fin al ultimo instante del dia", () => {
    const { start, end } = normalizeDateRange({
      start: new Date(2025, 9, 20, 18, 30),
      end: new Date(2025, 9, 10, 8, 0),
    });

    expect(start).toEqual(new Date(2025, 9, 10, 0, 0, 0, 0));
    expect(end).toEqual(new Date(2025, 9, 20, 23, 59, 59, 999));
  });

  it("deja pasar rangos incompletos sin lanzar", () => {
    expect(normalizeDateRange({ start: new Date(2025, 0, 1) }).end).toBeNull();
    expect(normalizeDateRange(undefined)).toEqual({ start: null, end: null });
    expect(normalizeDateRange({ start: "no-es-fecha", end: new Date() }).start).toBeNull();
  });
});

describe("rangos predefinidos", () => {
  it("hoy cubre solo el dia actual", () => {
    const { start, end } = createTodayRange();
    expect(start).toEqual(new Date(2025, 9, 15, 0, 0, 0, 0));
    expect(end).toEqual(new Date(2025, 9, 15, 23, 59, 59, 999));
  });

  it("ultimos 30 dias incluye hoy y 29 dias atras", () => {
    const { start, end } = createLastDaysRange(30);
    expect(start).toEqual(new Date(2025, 8, 16, 0, 0, 0, 0));
    expect(end.getDate()).toBe(15);
  });

  it("la semana empieza el lunes", () => {
    const { start } = createCurrentWeekRange();
    expect(start).toEqual(new Date(2025, 9, 13, 0, 0, 0, 0));
  });

  it("la semana de un domingo arranca el lunes anterior", () => {
    jest.setSystemTime(new Date(2025, 9, 19, 9, 0, 0));
    expect(createCurrentWeekRange().start).toEqual(new Date(2025, 9, 13, 0, 0, 0, 0));
  });

  it("el mes empieza el dia 1", () => {
    expect(createCurrentMonthRange().start).toEqual(new Date(2025, 9, 1, 0, 0, 0, 0));
  });
});

describe("isWithinDateRange", () => {
  const range = normalizeDateRange({ start: new Date(2025, 9, 1), end: new Date(2025, 9, 31) });

  it("incluye los extremos del rango", () => {
    expect(isWithinDateRange(new Date(2025, 9, 1, 0, 0, 0), range)).toBe(true);
    expect(isWithinDateRange(new Date(2025, 9, 31, 23, 59, 0), range)).toBe(true);
  });

  it("excluye fuera de rango y valores invalidos", () => {
    expect(isWithinDateRange(new Date(2025, 8, 30, 23, 59), range)).toBe(false);
    expect(isWithinDateRange(new Date(2025, 10, 1), range)).toBe(false);
    expect(isWithinDateRange(null, range)).toBe(false);
  });

  it("acepta timestamps numericos y sin rango acepta todo", () => {
    expect(isWithinDateRange(new Date(2025, 9, 10).getTime(), range)).toBe(true);
    expect(isWithinDateRange(new Date(2020, 0, 1), undefined)).toBe(true);
  });
});

describe("formatDateRangeLabel", () => {
  it('sin rango muestra "Todos"', () => {
    expect(formatDateRangeLabel(undefined)).toBe("Todos");
    expect(formatDateRangeLabel({ start: new Date() })).toBe("Todos");
  });

  it("un solo dia muestra una sola fecha; varios dias muestran inicio - fin", () => {
    const one = formatDateRangeLabel(createTodayRange());
    expect(one).not.toContain(" - ");

    const many = formatDateRangeLabel(createLastDaysRange(7));
    expect(many).toContain(" - ");
  });
});
