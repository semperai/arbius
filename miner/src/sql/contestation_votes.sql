CREATE TABLE IF NOT EXISTS contestation_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    taskid TEXT,
    validator TEXT,
    yea BOOLEAN
);

CREATE INDEX IF NOT EXISTS contestation_votes_taskid ON contestation_votes(taskid);
CREATE INDEX IF NOT EXISTS contestation_votes_validator ON contestation_votes(validator);
