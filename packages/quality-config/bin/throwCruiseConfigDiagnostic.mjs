import ts from 'typescript'

export function throwCruiseConfigDiagnostic(diagnostic) {
  throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
}
