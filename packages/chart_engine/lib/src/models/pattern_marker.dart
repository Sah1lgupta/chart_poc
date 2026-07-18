/// A pattern marker to render above/below a candle (feeds the
/// "39 patterns" auto-detection feature — detection logic lives in
/// your backend/Dart, this just tells the chart where to draw the tag).
class PatternMarker {
  final int time;
  final String position; // 'aboveBar' | 'belowBar'
  final String color;
  final String shape; // 'arrowUp' | 'arrowDown' | 'circle' | 'square'
  final String text;

  const PatternMarker({
    required this.time,
    required this.position,
    required this.color,
    required this.shape,
    required this.text,
  });

  Map<String, dynamic> toJson() => {
    'time': time,
    'position': position,
    'color': color,
    'shape': shape,
    'text': text,
  };
}
