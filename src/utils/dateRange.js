function toDateOnly(value) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return null;
  }

  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function getTimestampMillis(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (value?.toMillis) {
    return value.toMillis();
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  return 0;
}

export function normalizeDateRange(range) {
  const rawStart = toDateOnly(range?.start);
  const rawEnd = toDateOnly(range?.end);

  if (!rawStart || !rawEnd) {
    return { start: rawStart, end: rawEnd };
  }

  const orderedStart = rawStart <= rawEnd ? rawStart : rawEnd;
  const orderedEnd = rawStart <= rawEnd ? rawEnd : rawStart;

  return {
    start: orderedStart,
    end: new Date(
      orderedEnd.getFullYear(),
      orderedEnd.getMonth(),
      orderedEnd.getDate(),
      23,
      59,
      59,
      999,
    ),
  };
}

export function createLastDaysRange(days = 30) {
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = new Date(end);
  start.setDate(end.getDate() - Math.max(0, days - 1));

  return normalizeDateRange({ start, end });
}

export function createTodayRange() {
  return createLastDaysRange(1);
}

export function createCurrentWeekRange() {
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = new Date(end);
  const weekDay = (end.getDay() + 6) % 7;
  start.setDate(end.getDate() - weekDay);

  return normalizeDateRange({ start, end });
}

export function createCurrentMonthRange() {
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = new Date(today.getFullYear(), today.getMonth(), 1);

  return normalizeDateRange({ start, end });
}

let sharedOperationalDateRange = createLastDaysRange(30);

export function getSharedOperationalDateRange() {
  return normalizeDateRange(sharedOperationalDateRange);
}

export function setSharedOperationalDateRange(range) {
  sharedOperationalDateRange = normalizeDateRange(range);
  return sharedOperationalDateRange;
}

export function isWithinDateRange(value, range) {
  const timestamp = getTimestampMillis(value);

  if (!timestamp) {
    return false;
  }

  const startMillis = getTimestampMillis(range?.start);
  const endMillis = getTimestampMillis(range?.end);

  if (startMillis && timestamp < startMillis) {
    return false;
  }

  if (endMillis && timestamp > endMillis) {
    return false;
  }

  return true;
}

export function formatDateRangeLabel(range) {
  const startDate = range?.start;
  const endDate = range?.end;

  if (!startDate || !endDate) {
    return "Todos";
  }

  const formatDate = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return "?";
    }

    return date.toLocaleDateString("es-VE", {
      day: "numeric",
      month: "short",
    });
  };

  const startLabel = formatDate(startDate);
  const endLabel = formatDate(endDate);

  if (startLabel === endLabel) {
    return startLabel;
  }

  return `${startLabel} - ${endLabel}`;
}
