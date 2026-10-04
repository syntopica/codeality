/** One line of `ps -axo pid=,ppid=,rss=`; rss in KB. */
export type ProcessRow = { pid: number; ppid: number; rss: number }
