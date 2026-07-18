// drawing.dart

class DrawingPoint {
  final int time;
  final double price;

  const DrawingPoint({
    required this.time,
    required this.price,
  });

  Map<String, dynamic> toJson() => {
    'time': time,
    'price': price,
  };

  factory DrawingPoint.fromJson(Map<String, dynamic> json) => DrawingPoint(
    time: json['time'] as int,
    price: (json['price'] as num).toDouble(),
  );
}

class DrawingStyle {
  final String color;
  final int lineWidth;
  final double? fillOpacity;
  final int? fontSize;

  const DrawingStyle({
    required this.color,
    required this.lineWidth,
    this.fillOpacity,
    this.fontSize,
  });

  Map<String, dynamic> toJson() => {
    'color': color,
    'lineWidth': lineWidth,
    if (fillOpacity != null) 'fillOpacity': fillOpacity,
    if (fontSize != null) 'fontSize': fontSize,
  };

  factory DrawingStyle.fromJson(Map<String, dynamic> json) => DrawingStyle(
    color: json['color'] as String,
    lineWidth: json['lineWidth'] as int,
    fillOpacity: (json['fillOpacity'] as num?)?.toDouble(),
    fontSize: json['fontSize'] as int?,
  );
}

class Drawing {
  final String id;
  final String type;
  final List<DrawingPoint> points;
  final DrawingStyle style;
  final String? text;
  final bool locked;
  final bool hidden;
  final bool favorite;

  const Drawing({
    required this.id,
    required this.type,
    required this.points,
    required this.style,
    this.text,
    this.locked = false,
    this.hidden = false,
    this.favorite = false,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'type': type,
    'points': points.map((p) => p.toJson()).toList(),
    'style': style.toJson(),
    if (text != null) 'text': text,
    'locked': locked,
    'hidden': hidden,
    'favorite': favorite,
  };

  factory Drawing.fromJson(Map<String, dynamic> json) => Drawing(
    id: json['id'] as String,
    type: json['type'] as String,
    points: (json['points'] as List)
        .map((p) => DrawingPoint.fromJson(p as Map<String, dynamic>))
        .toList(),
    style: DrawingStyle.fromJson(json['style'] as Map<String, dynamic>),
    text: json['text'] as String?,
    locked: json['locked'] as bool? ?? false,
    hidden: json['hidden'] as bool? ?? false,
    favorite: json['favorite'] as bool? ?? false,
  );
}
