/// Chart Engine — standalone, reusable chart package.
///
/// Usage:
/// ```dart
/// import 'package:chart_engine/chart_engine.dart';
///
/// ChartView(
///   onCreated: (controller) => controller.setData(myBars),
///   onEvent: (event, payload) { /* react to drawings, alerts, etc. */ },
/// )
/// ```
library;

// Models
export 'src/models/chart_bar.dart';
export 'src/models/pattern_marker.dart';
export 'src/models/chart_type.dart';
export 'src/models/interval.dart';
export 'src/models/drawing.dart';
export 'src/models/indicator_config.dart';
export 'src/models/chart_theme.dart';
export 'src/models/chart_layout.dart';

// Controller + Widget
export 'src/controller/chart_controller.dart';
export 'src/controller/chart_view.dart';

// Events
export 'src/events/chart_event.dart';
