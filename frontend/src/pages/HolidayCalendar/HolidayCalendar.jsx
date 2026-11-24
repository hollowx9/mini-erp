import { useState } from "react";


const holidays = [
  { date: "2026-01-01", name: "New Year" },
  { date: "2026-04-06", name: "Easter Monday" },
  { date: "2026-05-01", name: "Labour Day" },
  { date: "2026-05-08", name: "Victory Day" },
  { date: "2026-05-14", name: "Ascension Day" },
  { date: "2026-05-25", name: "Whit Monday" },
  { date: "2026-07-14", name: "Bastille Day" },
  { date: "2026-08-15", name: "Assumption Day" },
  { date: "2026-11-01", name: "All Saints' Day" },
  { date: "2026-11-11", name: "Armistice Day" },
  { date: "2026-12-25", name: "Christmas Day" },
];

function HolidayCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const daysInMonth = lastDay.getDate();

  const calendarDays = [];

  for (let i = 0; i < startDay; i++) {
    calendarDays.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getHoliday = (day) => {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;

    return holidays.find((holiday) => holiday.date === date);
  };

  return (
    <div className="holiday-page">
      <div className="holiday-header">
        <div>
          <h1>Holiday Calendar</h1>
          <p>View all official holidays in a real monthly calendar.</p>
        </div>

        <div className="calendar-controls">
          <button onClick={previousMonth}>Previous</button>
          <h2>{monthName}</h2>
          <button onClick={nextMonth}>Next</button>
        </div>
      </div>

      <div className="calendar">
        <div className="calendar-weekdays">
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
          <span>Sun</span>
        </div>

        <div className="calendar-grid">
          {calendarDays.map((day, index) => {
            const holiday = day ? getHoliday(day) : null;

            return (
              <div
                key={index}
                className={`calendar-day ${holiday ? "holiday" : ""}`}
              >
                {day && (
                  <>
                    <span className="day-number">{day}</span>
                    {holiday && (
                      <span className="holiday-name">{holiday.name}</span>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default HolidayCalendar;