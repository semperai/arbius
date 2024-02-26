CREATE TABLE IF NOT EXISTS task_txids (
    taskid TEXT,
    txid TEXT
);

CREATE INDEX IF NOT EXISTS task_txids_taskid ON task_txids(taskid);
CREATE INDEX IF NOT EXISTS task_txids_txid ON task_txids(txid);
