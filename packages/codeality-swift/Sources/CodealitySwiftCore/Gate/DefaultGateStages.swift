/// The spec's stage order: format, swiftlint, structure, duplicates.
public func defaultGateStages(projectRoot: String, config: SwiftConfig, baseline: BaselineFile?)
    -> [GateStage]
{
    [
        { await formatStage(projectRoot: projectRoot, config: config) },
        { await swiftlintStage(projectRoot: projectRoot, config: config, baseline: baseline) },
        { await structureStage(projectRoot: projectRoot, config: config, baseline: baseline) },
        { await duplicatesStage(projectRoot: projectRoot, config: config, baseline: baseline) },
    ]
}
