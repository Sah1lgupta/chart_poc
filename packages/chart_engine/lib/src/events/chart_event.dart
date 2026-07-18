// chart_event.dart
// Typed event name constants for the Dart↔JS bridge.
// Using constants prevents typo-bugs when comparing event names in onEvent().

/// Event names emitted by the chart JS engine → Dart.
///
/// These match the string names used in chart.html's `emitEvent()` calls.
/// When adding a new event in a later phase, add the constant here **first**
/// (per the non-negotiable rule in 04_CHART_BRIDGE_API_SPEC.md).
class ChartEvents {
  ChartEvents._();

  /// A JS error occurred inside the chart engine.
  static const String jsError = 'jsError';

  /// The user changed the timeframe/interval via the toolbar.
  static const String timeframeChanged = 'timeframeChanged';

  /// A drawing was added to the chart.
  static const String drawingAdded = 'drawingAdded';

  /// A drawing was updated.
  static const String drawingUpdated = 'drawingUpdated';

  /// A drawing was deleted.
  static const String drawingDeleted = 'drawingDeleted';

  /// All drawings were cleared.
  static const String drawingsCleared = 'drawingsCleared';

  /// The chart type has changed.
  static const String chartTypeChanged = 'chartTypeChanged';

  /// An indicator config was added.
  static const String indicatorAdded = 'indicatorAdded';

  /// An indicator config was removed.
  static const String indicatorRemoved = 'indicatorRemoved';

  /// An alert has been requested by clicking the axis.
  static const String alertRequested = 'alertRequested';

  /// Fullscreen mode changed.
  static const String fullscreenChanged = 'fullscreenChanged';

  /// Saved layout details snapshot.
  static const String layoutSnapshot = 'layoutSnapshot';
}
