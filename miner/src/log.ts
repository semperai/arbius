import * as fs from 'fs';
import { Logger, ILogObj } from "tslog";

let log: Logger<ILogObj>;

export function initializeLogger(log_path: string|null) {
  log = new Logger();

  if (log_path != null) {
    log.attachTransport((lobj) => {
      let p = '[fileNameWithLine undefined]';
      if (lobj._meta.path && lobj._meta.path.fileNameWithLine) {
        p = lobj._meta.path.fileNameWithLine;
      }

      let m = []
      for (let i=0; i<10; ++i) {
        if (lobj.hasOwnProperty(i.toString())) {
          m.push(lobj[i]);
        }
      }

      const l = `${lobj._meta.date.getTime()} ${lobj._meta.logLevelName} ${p} ${m.join('\t')}\n`;
      fs.appendFileSync(log_path, l);
    });
  }
}

export { log };
