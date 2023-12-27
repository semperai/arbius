CREATE TABLE IF NOT EXISTS solutions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    taskid TEXT,
    validator TEXT,
    blocktime TEXT,
    claimed BOOLEAN,
    cid TEXT
);

CREATE INDEX IF NOT EXISTS solutions_taskid ON solutions(taskid);
CREATE INDEX IF NOT EXISTS solutions_validator ON solutions(validator);
