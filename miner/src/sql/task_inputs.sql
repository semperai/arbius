CREATE TABLE IF NOT EXISTS task_inputs (
    taskid TEXT,
    cid TEXT,
    data TEXT
);

CREATE INDEX IF NOT EXISTS task_inputs_taskid ON task_inputs(taskid);
CREATE INDEX IF NOT EXISTS task_inputs_cid ON task_inputs(cid);
