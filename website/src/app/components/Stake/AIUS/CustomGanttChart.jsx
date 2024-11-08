import React from 'react';

const CustomGanttChart = () => {
  const tasks = [
  { name: 'Task 1', startDate: '2024-09-01', endDate: '2025-03-15' },
  { name: 'Task 2', startDate: '2024-09-02', endDate: '2024-09-25' },
  { name: 'Task 3', startDate: '2024-09-03', endDate: '2024-10-05' },
];
  const today = new Date();
  const earliestStart = new Date(Math.min(...tasks.map(task => new Date(task.startDate))));
  const latestEnd = new Date(Math.max(...tasks.map(task => new Date(task.endDate))));
  const totalDays = (latestEnd - earliestStart) / (1000 * 60 * 60 * 24);

  const getElapsedAndRemainingPercentages = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const totalDuration = endDate - startDate;
    const elapsedDuration = Math.max(0, Math.min(today - startDate, totalDuration));
    const remainingDuration = Math.max(0, totalDuration - elapsedDuration);

    return {
      elapsed: (elapsedDuration / totalDuration) * 100,
      remaining: (remainingDuration / totalDuration) * 100
    };
  };

  const getPositionAndWidth = (start, end) => {
    const startPosition = (new Date(start) - earliestStart) / (1000 * 60 * 60 * 24);
    const width = (new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24);
    return {
      left: `${(startPosition / totalDays) * 100}%`,
      width: `${(width / totalDays) * 100}%`,
    };
  };

  const generateMonthTimeline = () => {
    const months = [];
    let currentDate = new Date(earliestStart);
    currentDate.setDate(1); // Start from the first day of the month

    while (currentDate <= latestEnd) {
      months.push(new Date(currentDate));
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return months.map((month, index) => {
      const position = (month - earliestStart) / (1000 * 60 * 60 * 24);
      const width = (index === months.length - 1 ? totalDays - position : 30) / totalDays * 100;
      return (
        <div key={month.toISOString()} className="month-marker" style={{ left: `${(position / totalDays) * 100}%`, width: `${width}%` }}>
          {month.toLocaleString('default', { month: 'short', year: 'numeric' })}
        </div>
      );
    });
  };

  return (
    <div className="gantt-chart">
      <div className="timeline">
        {generateMonthTimeline()}
      </div>
      {tasks.map((task, index) => {
        const { elapsed, remaining } = getElapsedAndRemainingPercentages(task.startDate, task.endDate);
        return (
          <div key={index} className="task-row">
            <div className="task-info">
              <span className="task-name">{task.name}</span>
              <span className="task-dates">
                {new Date(task.startDate).toLocaleDateString()} - {new Date(task.endDate).toLocaleDateString()}
              </span>
            </div>
            <div className="task-bar-container">
              <div
                className="task-bar"
                style={getPositionAndWidth(task.startDate, task.endDate)}
              >
                <div className="task-progress-elapsed" style={{ width: `${elapsed}%` }} />
                <div className="task-progress-remaining" style={{ width: `${remaining}%` }} />
              </div>
            </div>
          </div>
        );
      })}
      <style jsx>{`
        .gantt-chart {
          font-family: Arial, sans-serif;
          width: 100%;
          padding-top: 30px;
          position: relative;
        }
        .timeline {
          position: absolute;
          top: 0;
          left: 200px;
          right: 0;
          height: 30px;
          display: flex;
        }
        .month-marker {
          position: absolute;
          height: 100%;
          border-left: 1px solid #ccc;
          padding-left: 5px;
          font-size: 0.8em;
          color: #666;
        }
        .task-row {
          display: flex;
          margin-bottom: 10px;
          align-items: center;
        }
        .task-info {
          width: 200px;
          padding-right: 20px;
        }
        .task-name {
          font-weight: bold;
          display: block;
        }
        .task-dates {
          font-size: 0.8em;
          color: #666;
        }
        .task-bar-container {
          flex-grow: 1;
          height: 30px;
          background-color: #f0f0f0;
          position: relative;
        }
        .task-bar {
          position: absolute;
          height: 100%;
          display: flex;
        }
        .task-progress-elapsed {
          height: 100%;
          background-color: #4CAF50;
        }
        .task-progress-remaining {
          height: 100%;
          background-color: #FF5252;
        }
      `}</style>
    </div>
  );
};

export default CustomGanttChart;