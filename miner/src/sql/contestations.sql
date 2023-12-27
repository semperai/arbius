CREATE TABLE IF NOT EXISTS contestations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    taskid TEXT,
    validator TEXT,
    blocktime TEXT,
    finish_start_index TEXT
);

CREATE INDEX IF NOT EXISTS contestations_taskid ON contestations(taskid);
CREATE INDEX IF NOT EXISTS contestations_validator ON contestations(validator);
