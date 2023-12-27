CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    modelid TEXT,
    fee TEXT,
    address TEXT,
    blocktime TEXT,
    version INT,
    cid TEXT,
    retracted BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS tasks_id ON tasks(id);
CREATE INDEX IF NOT EXISTS tasks_modelid ON tasks(modelid);
CREATE INDEX IF NOT EXISTS tasks_address ON tasks(address);
