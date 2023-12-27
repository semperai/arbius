CREATE TABLE IF NOT EXISTS invalid_tasks (
    taskid TEXT PRIMARY KEY
);

CREATE INDEX IF NOT EXISTS invalid_tasks_taskid ON invalid_tasks(taskid);
