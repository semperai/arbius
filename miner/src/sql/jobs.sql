CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    priority INTEGER,
    waituntil INTEGER,
    concurrent BOOLEAN,
    method TEXT,
    data TEXT
);
